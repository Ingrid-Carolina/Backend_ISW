// backend/controllers/ContactoImageController.js
// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from "../config/postgre.js";

// Importa multer para manejar la subida de archivos.
import multer from "multer";

// Importa path para manejar rutas de archivos.
import path from "path";

// Configuración de almacenamiento para multer.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"), // Define la carpeta de destino para los archivos subidos.
  filename: (_req, file, cb) => {
    // Genera un nombre único para cada archivo subido.
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configura multer para manejar un solo archivo con el nombre de campo 'file'.
const upload = multer({ storage }).single("file");

// Controlador para manejar las imágenes de contacto.
class ContactoImageController {
  // Método para obtener todas las imágenes de la base de datos.
  static async getImages(_req, res) {
    try {
      const result = await sql`SELECT type, url FROM contacto_images`; // Consulta SQL para obtener las imágenes.
      res.status(203).json(result); // Devuelve las imágenes en formato JSON con el código de estado 203.
    } catch (error) {
      console.error("ERROR getImages contacto_images:", error.message);
      res.status(500).json({ error: "Error al obtener las imágenes" }); // Devuelve un error en caso de fallo.
    }
  }

  // Método para actualizar o insertar una imagen en la base de datos.
  static async updateImage(req, res) {
    try {
      const { type, url } = req.body; // Obtiene los datos del cuerpo de la solicitud.
      if (!type || !url) {
        // Verifica que se proporcionen los datos requeridos.
        return res.status(400).json({ error: "Se requieren el tipo de imagen y la URL" });
      }
      // Inserta o actualiza la imagen en la base de datos.
      await sql`
        INSERT INTO contacto_images (type, url) VALUES (${type}, ${url})
        ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
      `;
      res.json({ message: "URL de imagen actualizada exitosamente." }); // Respuesta de éxito.
    } catch (error) {
      console.error("Error updateImage contacto_images:", error);
      res.status(500).json({ error: "Error al actualizar la imagen en el servidor." }); // Manejo de errores.
    }
  }

  // Método para subir una imagen al servidor.
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
