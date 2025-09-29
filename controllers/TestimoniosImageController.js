/**
 * TestimoniosImageController.js
 *
 * Controlador para la gestión de imágenes usadas en la sección de Testimonios.
 * Permite listar, actualizar (upsert por `type`) y subir imágenes al servidor.
 *
 * Funcionalidades:
 * - getImages: Obtiene todas las imágenes desde la tabla `test_images`.
 * - updateImage: Inserta/actualiza por `type` la URL de una imagen (ON CONFLICT).
 * - uploadImage: Recibe un archivo (Multer + diskStorage) y devuelve su URL pública local.
 *
 * Notas:
 * - Usa PostgreSQL para persistir `type` y `url`.
 * - Multer guarda físicamente en `uploads/` y genera nombres únicos.
 * - Respuestas JSON claras y manejo de errores consistente.
 */


// backend/controllers/TestimoniosImageController.js
import { sql } from "../config/postgre.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage }).single("file");

class TestimoniosImageController {
  static async getImages(_req, res) {
    try {
      const result = await sql`SELECT type, url FROM test_images`;
      res.status(200).json(result);
    } catch (error) {
      console.error("ERROR getImages test_images:", error.message);
      res.status(500).json({ error: "Error al obtener las imágenes" });
    }
  }

  static async updateImage(req, res) {
    try {
      const { type, url } = req.body;
      if (!type || !url) return res.status(400).json({ error: 'Se requieren tipo y URL.' });

      await sql`
        INSERT INTO test_images (type, url)
        VALUES (${type}, ${url})
        ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
      `;
      
      
      res.json({ message: 'Imagen actualizada correctamente.' });
    } catch (err) {
      console.error('Error al actualizar imagen:', err);
      res.status(500).json({ error: 'Error al actualizar imagen en DB.' });
    }
  }
  static async uploadImage(req, res) {
    upload(req, res, async function (err) {
      if (err) {
        console.error("Error subiendo archivo:", err);
        return res.status(500).json({ error: "Error al subir el archivo." });
      }
      if (!req.file) return res.status(400).json({ error: "No se proporcionó ningún archivo." });
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.status(200).json({ message: "Imagen subida correctamente.", url: imageUrl });
    });
  }
}

export default TestimoniosImageController;

