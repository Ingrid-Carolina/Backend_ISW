// backend/controllers/TestimoniosImageController.js
// Importa las dependencias necesarias para manejar las imágenes de testimonios.
import { sql } from "../config/postgre.js";
import multer from "multer";
import path from "path";

// Configuración de almacenamiento para multer.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"), // Directorio donde se guardarán los archivos subidos.
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)); // Nombre único para cada archivo.
  },
});
const upload = multer({ storage }).single("file");

// Controlador para manejar las operaciones relacionadas con las imágenes de testimonios.
class TestimoniosImageController {
  /**
   * Método para obtener todas las imágenes de testimonios.
   */
  static async getImages(_req, res) {
    try {
      // Consulta SQL para obtener todas las imágenes de la tabla test_images.
      const result = await sql`SELECT type, url FROM test_images`;
      // Devuelve las imágenes en formato JSON.
      res.status(200).json(result);
    } catch (error) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error("ERROR getImages test_images:", error.message);
      res.status(500).json({ error: "Error al obtener las imágenes" });
    }
  }

  /**
   * Método para actualizar o insertar una imagen en la base de datos.
   */
  static async updateImage(req, res) {
    try {
      const { type, url } = req.body;
      if (!type || !url) {
        // Verifica que se proporcionen los datos requeridos.
        return res.status(400).json({ error: 'Se requieren tipo y URL.' });
      }

      // Inserta o actualiza la imagen en la base de datos.
      await sql`
        INSERT INTO test_images (type, url)
        VALUES (${type}, ${url})
        ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
      `;

      // Devuelve una respuesta indicando que la imagen fue actualizada correctamente.
      res.json({ message: 'Imagen actualizada correctamente.' });
    } catch (err) {
      // Manejo de errores en caso de fallo al actualizar la imagen.
      console.error('Error al actualizar imagen:', err);
      res.status(500).json({ error: 'Error al actualizar imagen en DB.' });
    }
  }

  /**
   * Método para subir una nueva imagen al servidor.
   */
  static async uploadImage(req, res) {
    upload(req, res, async function (err) {
      if (err) {
        // Manejo de errores durante la subida del archivo.
        console.error("Error subiendo archivo:", err);
        return res.status(500).json({ error: "Error al subir el archivo." });
      }
      if (!req.file) {
        // Verifica que se haya proporcionado un archivo.
        return res.status(400).json({ error: "No se proporcionó ningún archivo." });
      }

      // Genera la URL de la imagen subida.
      const imageUrl = `/uploads/${req.file.filename}`;
      // Devuelve una respuesta indicando que la imagen fue subida correctamente.
      res.status(200).json({ message: "Imagen subida correctamente.", url: imageUrl });
    });
  }
}

// Exporta el controlador para su uso en otras partes de la aplicación.
export default TestimoniosImageController;

