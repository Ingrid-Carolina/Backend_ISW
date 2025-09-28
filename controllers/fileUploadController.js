// Importa el cliente de Supabase y el nombre del bucket desde la configuración.
import { supabase, BUCKET } from "../config/supabase.js";

// Función para sanitizar nombres de archivos eliminando caracteres especiales y limitando su longitud.
function sanitizeName(name) {
    return (name || "image")
        .normalize("NFD") // Normaliza el texto para separar caracteres con tilde.
        .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes y diacríticos.
        .replace(/[^a-zA-Z0-9._-]/g, "_") // Reemplaza caracteres no permitidos por guiones bajos.
        .slice(0, 100); // Limita el nombre a 100 caracteres.
}

// Controlador para manejar la subida de archivos.
class FileUploadController {
    // Método para subir un archivo al almacenamiento de Supabase.
    static async uploadFile(req, res) {
        try {
            if (!req.file) return res.status(400).json({ error: 'No hay archivo' }); // Verifica que se haya proporcionado un archivo.
            if (!req.user?.uid) return res.status(401).json({ error: "No autenticado" }); // Verifica que el usuario esté autenticado.


            // Filtro para permitir solo tipos de archivo de imagen
            const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
            if (!allowed.includes(req.file.mimetype)) {
                return res.status(415).json({ error: "Tipo de archivo no permitido" }); // Devuelve un error si el tipo de archivo no está permitido.
            }

            const uid = req.user.uid; // Obtiene el UID del usuario autenticado.
            const safeName = sanitizeName(req.file.originalname); // Sanitiza el nombre del archivo.
            const path = `users/${uid}/${Date.now()}-${safeName}`; // Genera un path único para el archivo.

            // Intenta subir el archivo al bucket de Supabase.
            const { error: uploadErr } = await supabase.storage
                .from(BUCKET)
                .upload(path, req.file.buffer, {
                    contentType: req.file.mimetype, // Especifica el tipo de contenido del archivo.
                    upsert: false, // Evita sobrescribir archivos existentes.
                });

            if (uploadErr) {
                return res.status(500).json({ error: uploadErr.message }); // Manejo de errores en caso de fallo en la subida.
            }

            const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
            // TODO: guardar en Neon { uid:req.user.uid, path, url:data.publicUrl, ... }
            return res.json({
                path,
                url: data.publicUrl,
                size: req.file.size,
                type: req.file.mimetype,
                name: safeName,
            });

        } catch (error) {
            res.status(500).json({
                mensaje: "Error al subir archivo",
                detalle: error.message,
            })
        }
    }
}

//-

export default FileUploadController;