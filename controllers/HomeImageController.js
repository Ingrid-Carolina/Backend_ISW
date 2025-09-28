// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from '../config/postgre.js';

// Importa multer para manejar la subida de archivos.
import multer from 'multer';

// Importa path para manejar rutas de archivos.
import path from 'path';

// Configuración de almacenamiento para multer.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define la carpeta de destino para los archivos subidos.
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Genera un nombre único para cada archivo subido.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configura multer para manejar un solo archivo con el nombre de campo 'file'.
const upload = multer({ storage: storage }).single('file'); // 'file' debe coincidir con el nombre en formData del frontend.

// Controlador para manejar las imágenes de la página de inicio.
class HomeImageController {
    // Método para obtener todas las imágenes de la base de datos.
    static async getImages(req, res) {
      try {
        console.log('Intentando obtener imágenes de la tabla home_images...');
        const result = await sql`SELECT type, url FROM home_images`; // Consulta SQL para obtener las imágenes.
        console.log('Resultado de la consulta:', result);
        res.status(203).json(result); // Devuelve las imágenes en formato JSON con el código de estado 203.
      } catch (error) {
        console.error('🚨 ERROR al obtener las imágenes 🚨');
        console.error('Mensaje del error:', error.message);
        res.status(500).json({ error: 'Error al obtener las imágenes' }); // Manejo de errores en caso de fallo.
      }
    }

    // Método para actualizar o insertar una imagen en la base de datos.
    static async updateImage(req, res) {
      try {
        const { type, url } = req.body; // Obtiene los datos del cuerpo de la solicitud.
        if (!type || !url) {
          // Verifica que se proporcionen los datos requeridos.
          return res.status(400).json({ error: 'Se requieren el tipo de imagen y la URL' });
        }

        await sql`
          INSERT INTO home_images (type, url) VALUES (${type}, ${url})
          ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
        `; // Inserta o actualiza la URL de la imagen en la base de datos.

        res.json({ message: 'URL de imagen actualizada exitosamente.' });
      } catch (error) {
        console.error('Error en backend al actualizar imagen:', error);
        res.status(500).json({ error: 'Error al actualizar la imagen en el servidor.' });
      }
    }

    // Nuevo método para subir imágenes
    static async uploadImage(req, res) {
      upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          console.error('Error de Multer:', err);
          return res.status(500).json({ error: 'Error al subir el archivo.' });
        } else if (err) {
          // An unknown error occurred when uploading.
          console.error('Error desconocido al subir archivo:', err);
          return res.status(500).json({ error: 'Error desconocido al subir el archivo.' });
        }

        // Si la subida fue exitosa, req.file contiene la información del archivo
        if (!req.file) {
          return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }

        // Aquí construyes la URL persistente.
        // Esto depende de cómo sirvas tus archivos estáticos.
        // Si los sirves desde Node.js/Express con express.static:
        const imageUrl = `/uploads/${req.file.filename}`; 
        // Si usas un servicio de almacenamiento como AWS S3, aquí iría la URL de S3.

        console.log('Archivo subido exitosamente:', req.file.filename);
        console.log('URL persistente generada:', imageUrl);

        res.status(200).json({
          message: 'Imagen subida correctamente.',
          url: imageUrl // IMPORTANTE: Devuelve la URL persistente
        });
      });
    }
}

export default HomeImageController;