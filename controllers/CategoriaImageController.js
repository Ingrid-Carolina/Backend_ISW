// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from '../config/postgre.js';

// Importa multer para manejar la subida de archivos.
import multer from 'multer';

// Importa path para manejar rutas de archivos y fs para interactuar con el sistema de archivos.
import path from 'path';
import fs from 'fs';

// Define la carpeta donde se subirán las imágenes.
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir); // Crea la carpeta si no existe.

// Configuración de almacenamiento para multer.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir), // Define la carpeta de destino.
  filename: (req, file, cb) => {
    // Genera un nombre único para cada archivo subido.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configura multer para manejar un solo archivo con el nombre de campo 'file'.
const upload = multer({ storage }).single('file'); // 'file' debe coincidir con FormData del frontend.

// Controlador para manejar las imágenes de categorías.
class CategoriasImagesController {
  // Método para obtener todas las imágenes de la base de datos.
  static async getImages(req, res) {
    try {
      const result = await sql`SELECT type, url FROM categorias_images`; // Consulta SQL para obtener las imágenes.
      res.status(200).json(result); // Devuelve las imágenes en formato JSON con el código de estado 200.
    } catch (err) {
      console.error('Error al obtener imágenes:', err);
      res.status(500).json({ error: 'Error al obtener imágenes de Categorías.' }); // Devuelve un error en caso de fallo.
    }
  }

  // Método para actualizar la URL de una imagen en la base de datos.
  static async updateImage(req, res) {
    try {
      const { type, url } = req.body; // Obtiene los datos del cuerpo de la solicitud.
      if (!type || !url) return res.status(400).json({ error: 'Se requieren tipo y URL.' }); // Verifica que se proporcionen los datos requeridos.

      await sql`
        INSERT INTO categorias_images (type, url)
        VALUES (${type}, ${url})
        ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url
      `; // Inserta o actualiza la URL de la imagen en la base de datos.

      res.json({ message: 'Imagen actualizada correctamente.' }); // Responde con un mensaje de éxito.
    } catch (err) {
      console.error('Error al actualizar imagen:', err);
      res.status(500).json({ error: 'Error al actualizar imagen en DB.' }); // Devuelve un error en caso de fallo.
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
