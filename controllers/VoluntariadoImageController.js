/**
 * VoluntariadoImageController.js
 *
 * Controlador para la gestión de imágenes de la sección Voluntariado.
 * Permite obtener la lista, actualizar (upsert por `type`) y subir imágenes.
 *
 * Funcionalidades:
 * - getImages: Lista las imágenes registradas en `voluntariado_images`.
 * - updateImage: Inserta/actualiza la URL de imagen por `type` (ON CONFLICT).
 * - uploadImage: Sube archivo usando Multer (diskStorage) y retorna URL accesible.
 *
 * Notas:
 * - El almacenamiento local se realiza en la carpeta `uploads/`.
 * - Validación mínima de `type` y `url` en el update.
 * - Manejo de errores con códigos HTTP adecuados.
 */

import { sql } from '../config/postgre.js';
import multer from 'multer';
import path from 'path';

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage }).single('file');

const CLAVES_PERMITIDAS = [
  "header_l1",
  "header_l2",
  "slogan",
  "contenido_titulo",
  "contenido_subtitulo",
  "descripcion",
];

const MAX_LEN = 2000;

function isValidClave(clave) {
  return typeof clave === "string" && CLAVES_PERMITIDAS.includes(clave);
}


class VoluntariadoImageController {
  // Obtener todas las imágenes
  static async getImages(req, res) {
    try {
      const result = await sql`SELECT type, url FROM voluntariado_images`;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error al obtener imágenes:', error);
      res.status(500).json({ error: 'Error al obtener imágenes de Voluntariado.' });
    }
  }

  // Actualizar URL de imagen
  static async updateImage(req, res) {
    try {
      const { type, url } = req.body;
      if (!type || !url) {
        return res.status(400).json({ error: 'Se requieren el tipo y la URL de la imagen.' });
      }

      await sql`
        INSERT INTO voluntariado_images (type, url)
        VALUES (${type}, ${url})
        ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
      `;

      res.json({ message: 'Imagen actualizada correctamente.' });
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      res.status(500).json({ error: 'Error al actualizar la imagen en la base de datos.' });
    }
  }

  // Subir imagen al servidor
  static async uploadImage(req, res) {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Error de Multer:', err);
        return res.status(500).json({ error: 'Error al subir el archivo.' });
      } else if (err) {
        console.error('Error desconocido al subir archivo:', err);
        return res.status(500).json({ error: 'Error desconocido al subir archivo.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;

      res.status(200).json({
        message: 'Imagen subida correctamente.',
        url: imageUrl
      });
    });
  }

  //insertar a la tabla Voluntariado_textos
   static async upsert(req, res) {
      try {
        let { clave, valor } = req.body || {};
  
        if (!isValidClave(clave)) {
          return res.status(400).json({
            success: false,
            mensaje: `Clave inválida. Válidas: ${CLAVES_PERMITIDAS.join(", ")}`,
          });
        }
        if (typeof valor !== "string") {
          return res.status(400).json({
            success: false,
            mensaje: "El valor debe ser una cadena",
          });
        }
        if (valor.length > MAX_LEN) {
          return res.status(400).json({
            success: false,
            mensaje: `El texto excede el máximo de ${MAX_LEN} caracteres`,
          });
        }
  
        const rows = await sql`
          INSERT INTO voluntariado_textos (clave, valor)
          VALUES (${clave}, ${valor.trim()})
          ON CONFLICT (clave)
          DO UPDATE SET
            valor = EXCLUDED.valor
          RETURNING id_texto, clave, valor
        `;
  
        return res.json({
          success: true,
          mensaje: "Texto guardado correctamente",
          data: rows[0]
        });
      } catch (error) {
        console.error("❌ [VoluntariadoTextos] upsert:", error);
        return res.status(500).json({
          success: false,
          mensaje: "Error interno al guardar el texto",
        });
      }
    }


    static async obtenerTodos(req, res) {
    try {
      const rows = await sql`
        SELECT clave, valor
        FROM voluntariado_textos
        ORDER BY clave ASC
      `;

      const data = {};
      for (const r of rows) data[r.clave] = r.valor;

      return res.json({
        success: true,
        data,
        count: rows.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ [VoluntariadoTextos] obtenerTodos:", error);
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al cargar textos de Home",
      });
    }
  }
}

export default VoluntariadoImageController;
