/**
 * CategoriasImagesController.js
 *
 * Controlador para la gestión de imágenes y datos asociados a categorías.
 * Maneja la subida de archivos al servidor mediante Multer, así como las operaciones
 * de CRUD en la tabla `categorias_images` de PostgreSQL.
 *
 * Funcionalidades principales:
 * - Subir imágenes al servidor (carpeta `/uploads`).
 * - Obtener todas las imágenes y categorías con sus atributos.
 * - Actualizar la URL de una imagen según el tipo.
 * - Editar los datos de una categoría existente (texto, tipo, descripción, imagen).
 *
 * Este controlador conecta la capa de almacenamiento de archivos con la base de datos,
 * permitiendo tanto la persistencia de las imágenes como su información complementaria.
 */

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

  static async getCategorias(req, res) {
    try {
      const categorias = await sql`
  SELECT id, slugs, titletext, image, tipo, descripcion
  FROM categorias_images
  ORDER BY slugs
`;

      res.status(200).json({ categorias });
    } catch (err) {
      console.error('Error al obtener categorías:', err);
      res.status(500).json({ error: 'Error al obtener categorías de la base de datos.' });
    }
  }

  static async updateCategoria(req, res) {
    const { id } = req.params;
    const { titletext, tipo, descripcion, image } = req.body; // image debe ser URL

    try {
      const [categoriaActualizada] = await sql`
      UPDATE categorias_images
      SET titletext = ${titletext},
          tipo = ${tipo},
          descripcion = ${descripcion},
          image = ${image}
      WHERE id = ${id}
      RETURNING *
    `;

      if (!categoriaActualizada) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }

      res.status(200).json({ categoria: categoriaActualizada });
    } catch (e) {
      console.error(`Error al actualizar categoría: ${e}`);
      res.status(500).json({ error: `Error al actualizar categoría: ${e}` });
    }
  }
}

export default CategoriasImagesController;
