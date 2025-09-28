// Importa las dependencias necesarias para manejar las imágenes de voluntariado.
import { sql } from '../config/postgre.js';
import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento para multer.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Directorio donde se guardarán los archivos subidos.
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Genera un nombre único para cada archivo subido.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage }).single('file');

// Controlador para manejar las operaciones relacionadas con las imágenes de voluntariado.
class VoluntariadoImageController {
  /**
   * Método para obtener todas las imágenes de voluntariado.
   */
  static async getImages(req, res) {
    try {
      // Consulta SQL para obtener todas las imágenes de la tabla voluntariado_images.
      const result = await sql`SELECT type, url FROM voluntariado_images`;
      // Devuelve las imágenes en formato JSON.
      res.status(200).json(result);
    } catch (error) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error('Error al obtener imágenes:', error);
      res.status(500).json({ error: 'Error al obtener imágenes de Voluntariado.' });
    }
  }

  /**
   * Método para actualizar o insertar una URL de imagen en la base de datos.
   */
  static async updateImage(req, res) {
    try {
      const { type, url } = req.body;
      if (!type || !url) {
        // Verifica que se proporcionen los datos requeridos.
        return res.status(400).json({ error: 'Se requieren el tipo y la URL de la imagen.' });
      }

      // Inserta o actualiza la URL de la imagen en la base de datos.
      await sql`
        INSERT INTO voluntariado_images (type, url)
        VALUES (${type}, ${url})
        ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
      `;

      // Devuelve una respuesta indicando que la imagen fue actualizada correctamente.
      res.json({ message: 'Imagen actualizada correctamente.' });
    } catch (error) {
      // Manejo de errores en caso de fallo al actualizar la imagen.
      console.error('Error al actualizar imagen:', error);
      res.status(500).json({ error: 'Error al actualizar la imagen en la base de datos.' });
    }
  }

  /**
   * Método para subir una nueva imagen al servidor.
   */
  static async uploadImage(req, res) {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Manejo de errores específicos de Multer.
        console.error('Error de Multer:', err);
        return res.status(500).json({ error: 'Error al subir el archivo.' });
      } else if (err) {
        // Manejo de errores desconocidos durante la subida del archivo.
        console.error('Error desconocido al subir archivo:', err);
        return res.status(500).json({ error: 'Error desconocido al subir archivo.' });
      }

      if (!req.file) {
        // Verifica que se haya proporcionado un archivo.
        return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
      }

      // Genera la URL de la imagen subida.
      const imageUrl = `/uploads/${req.file.filename}`;

      // Devuelve una respuesta indicando que la imagen fue subida correctamente.
      res.status(200).json({
        message: 'Imagen subida correctamente.',
        url: imageUrl
      });
    });
  }
}

// Exporta el controlador para su uso en otras partes de la aplicación.
export default VoluntariadoImageController;
