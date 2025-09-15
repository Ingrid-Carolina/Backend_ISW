import { sql } from "../config/postgre";
import multer from "multer";
import path from 'path';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).single('file');

class AliadosImageController {
    static async getImages(req, res) {
        try {
            const result = await sql`SELECT type, url FROM aliados_images`;
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
            if (!type || !url) {
                return res.status(400).json({ error: 'Se requieren el tipo de imagen y la URL' });
            }

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

