// backend/controllers/ContactoImageController.js
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


class ContactoImageController {
  static async getImages(_req, res) {
    try {
      const result = await sql`SELECT type, url FROM contacto_images`;
      res.status(203).json(result);
    } catch (error) {
      console.error("ERROR getImages contacto_images:", error.message);
      res.status(500).json({ error: "Error al obtener las imágenes" });
    }
  }

  static async updateImage(req, res) {
    try {
      const { type, url } = req.body;
      if (!type || !url) {
        return res.status(400).json({ error: "Se requieren el tipo de imagen y la URL" });
      }
      await sql`
        INSERT INTO contacto_images (type, url) VALUES (${type}, ${url})
        ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
      `;
      res.json({ message: "URL de imagen actualizada exitosamente." });
    } catch (error) {
      console.error("Error updateImage contacto_images:", error);
      res.status(500).json({ error: "Error al actualizar la imagen en el servidor." });
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

export default ContactoImageController;
