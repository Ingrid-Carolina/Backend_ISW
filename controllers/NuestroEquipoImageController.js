// controllers/NuestroEquipoImageController.js
import { sql } from "../config/postgre.js";

class NuestroEquipoImageController {
  static async getImages(req, res) {
    try {
      const images = await sql`
        SELECT type, url, updated_at 
        FROM images 
        WHERE type LIKE 'nuestroequipo_%'
        ORDER BY type ASC
      `;
      
      res.status(200).json(images);
    } catch (error) {
      console.error('Error al obtener imágenes de NuestroEquipo:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener las imágenes',
        error: error.message 
      });
    }
  }

  static async updateImage(req, res) {
    try {
      const { type, url } = req.body;
      
      if (!type || !url) {
        return res.status(400).json({ 
          mensaje: 'Tipo y URL son requeridos' 
        });
      }

      // Validar que el tipo sea válido para NuestroEquipo
      const validTypes = ['nuestroequipo_header'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          mensaje: 'Tipo de imagen no válido para NuestroEquipo' 
        });
      }

      // Upsert - actualizar si existe, crear si no existe
      const result = await sql`
        INSERT INTO images (type, url, updated_at)
        VALUES (${type}, ${url}, NOW())
        ON CONFLICT (type) DO UPDATE SET
          url = EXCLUDED.url,
          updated_at = NOW()
        RETURNING type, url, updated_at
      `;

      res.status(200).json({
        mensaje: 'Imagen actualizada correctamente',
        image: result[0]
      });

    } catch (error) {
      console.error('Error al actualizar imagen de NuestroEquipo:', error);
      res.status(500).json({ 
        mensaje: 'Error al actualizar la imagen',
        error: error.message 
      });
    }
  }
}

export default NuestroEquipoImageController;