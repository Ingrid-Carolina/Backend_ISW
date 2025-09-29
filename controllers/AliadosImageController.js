import { sql } from "../config/postgre.js";
import multer from "multer";
import path from 'path';

// Configuración de almacenamiento local con Multer (carpeta ./uploads)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Directorio de salida para archivos subidos
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Prefijo único para evitar colisiones + extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Middleware de subida para un único archivo con campo 'file'
const upload = multer({ storage: storage }).single('file');

class AliadosImageController {
    // Obtiene lista de imágenes (type, url) desde la tabla aliados_images
    static async getImages(req, res) {
        try {
            const result = await sql`SELECT type, url FROM aliados_images`;
            // 203: Non-Authoritative Information (se respeta el status utilizado)
            res.status(203).json(result);
        } catch (error) {
            console.error('🚨 ERROR al obtener las imágenes 🚨');
            console.error('Mensaje del error:', error.message);
            res.status(500).json({ error: 'Error al obtener las imágenes' });
        }
    }

    // Este es el que se usa para actualizar cada imagen
    static async updateImage(req, res) {
        try {
            const { type, url } = req.body;
            // Validación mínima de entrada requerida
            if (!type || !url) {
                return res.status(400).json({ error: 'Se requieren el tipo de imagen y la URL' });
            }

            // UPSERT por 'type': inserta si no existe, o actualiza url si ya existe
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
        // Maneja la subida con Multer usando el middleware 'upload'
        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                // Errores propios de Multer (tamaño, límite de archivos, etc.)
                console.error('Error de Multer:', err);
                return res.status(500).json({ error: 'Error al subir el archivo.' });
            } else if (err) {
                // Error desconocido durante la subida
                console.error('Error desconocido al subir archivo:', err);
                return res.status(500).json({ error: 'Error desconocido al subir el archivo.' });
            }

            // Si la subida fue exitosa, req.file contiene la info del archivo
            if (!req.file) {
                return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
            }

            // Construye una URL pública relativa (depende de cómo sirvas /uploads estático)
            const imageUrl = `/uploads/${req.file.filename}`;
            // Nota: si se usara S3/Supabase/GCS, aquí se retornaría la URL remota

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
