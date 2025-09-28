// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from "../config/postgre.js";

// Importa multer para manejar la subida de archivos.
import multer from "multer";

// Importa path para manejar y transformar rutas de archivos.
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
const upload = multer({ storage: storage }).single('file');

// Controlador para manejar las imágenes de aliados.
class AliadosImageController {
    // Método para obtener todas las imágenes de la base de datos.
    static async getImages(req, res) {
        try {
            const result = await sql`SELECT type, url FROM aliados_images`; // Consulta SQL para obtener las imágenes.
            res.status(203).json(result); // Devuelve las imágenes en formato JSON con el código de estado 203.
        } catch (error) {
            console.error('🚨 ERROR al obtener las imágenes 🚨');
            console.error('Mensaje del error:', error.message);
            res.status(500).json({ error: 'Error al obtener las imágenes' }); // Devuelve un error en caso de fallo.
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

            // Inserta o actualiza la imagen en la base de datos.
            await sql`
                    INSERT INTO aliados_images (type, url) VALUES (${type}, ${url})
                    ON CONFLICT (type) DO UPDATE SET url = EXCLUDED.url`;

            res.json({ message: 'URL de imagen actualizada exitosamente.' });
        } catch (error) {
            console.error('Error en backend al actualizar imagen:', error);
            res.status(500).json({ error: 'Error al actualizar la imagen en el servidor.' });
        }
    }

    // not really used
    static async uploadImage(req, res) {
        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {

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

export default AliadosImageController

