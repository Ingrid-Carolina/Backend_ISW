import { sql } from '../config/postgre.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Carpeta de subida de imágenes
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single('file'); // 'file' debe coincidir con FormData del frontend

class CategoriasImagesController {
  // Obtener todas las imágenes
  static async getImages(req, res) {
    try {
      const result = await sql`SELECT type, url FROM categorias_images`;
      res.status(200).json(result);
    } catch (err) {
      console.error('Error al obtener imágenes:', err);
      res.status(500).json({ error: 'Error al obtener imágenes de Categorías.' });
    }
  }

  // Actualizar URL de imagen
  static async updateImage(req, res) {
    try {
      const { type, url } = req.body;
      if (!type || !url) return res.status(400).json({ error: 'Se requieren tipo y URL.' });

      await sql`
        INSERT INTO categorias_images (type, url)
        VALUES (${type}, ${url})
        ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
      `;

      res.json({ message: 'Imagen actualizada correctamente.' });
    } catch (err) {
      console.error('Error al actualizar imagen:', err);
      res.status(500).json({ error: 'Error al actualizar imagen en DB.' });
    }
  }

  // Subir imagen al servidor
  static async uploadImage(req, res) {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Error de Multer:', err);
        return res.status(500).json({ error: 'Error al subir archivo.' });
      } else if (err) {
        console.error('Error desconocido al subir archivo:', err);
        return res.status(500).json({ error: 'Error desconocido al subir archivo.' });
      }

      if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });

      // Generar URL completa accesible desde frontend
      const imageUrl = `/uploads/${req.file.filename}`;

      res.status(200).json({
        message: 'Imagen subida correctamente.',
        url: imageUrl,
      });
    });
  }
}

export default CategoriasImagesController;
