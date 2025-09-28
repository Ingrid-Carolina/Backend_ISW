// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from "../config/postgre.js";

// Controlador para manejar las imágenes relacionadas con "Nuestro Equipo".
class NuestroEquipoImageController {
  // Método para obtener todas las imágenes de "Nuestro Equipo".
  static async getImages(req, res) {
    try {
      // Consulta SQL para obtener las imágenes cuyo tipo comienza con "nuestroequipo_".
      const images = await sql`
        SELECT type, url, updated_at 
        FROM images 
        WHERE type LIKE 'nuestroequipo_%'
        ORDER BY type ASC
      `;
      
      // Devuelve las imágenes en formato JSON con el código de estado 200.
      res.status(200).json(images);
    } catch (error) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error('Error al obtener imágenes de NuestroEquipo:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener las imágenes',
        error: error.message 
      });
    }
  }

  // Método para actualizar o insertar una imagen en la base de datos.
  static async updateImage(req, res) {
    try {
      const { type, url } = req.body; // Obtiene los datos del cuerpo de la solicitud.
      
      if (!type || !url) {
        // Verifica que se proporcionen los datos requeridos.
        return res.status(400).json({ 
          mensaje: 'Tipo y URL son requeridos' 
        });
      }

      // Valida que el tipo sea válido para "Nuestro Equipo".
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
      // Manejo de errores en caso de fallo en la actualización de la imagen.
      console.error('Error al actualizar imagen de NuestroEquipo:', error);
      res.status(500).json({ 
        mensaje: 'Error al actualizar la imagen',
        error: error.message 
      });
    }
  }
}

export default NuestroEquipoImageController;