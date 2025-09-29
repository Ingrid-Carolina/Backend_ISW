/**
 * FileUploadController.js
 *
 * Controlador para la subida de archivos de usuario al bucket de Supabase Storage.
 * Incluye validación de tipo de archivo y sanitización del nombre antes de guardarlo.
 *
 * Funcionalidades principales:
 * - Subir archivos (solo imágenes en formatos JPEG, PNG, WEBP y AVIF).
 * - Asociar archivos con un usuario autenticado (por UID).
 * - Generar rutas y URLs públicas seguras para acceder a los archivos.
 *
 * Este controlador es la base para el manejo de recursos multimedia
 * asociados a usuarios dentro de la aplicación.
 */


import { supabase, BUCKET } from "../config/supabase.js";

function sanitizeName(name) {
    return (name || "image")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 100);
}

class FileUploadController {
    static async uploadFile(req, res) {
        try {
            if (!req.file) return res.status(400).json({ error: 'No hay archivo' });
            if (!req.user?.uid) return res.status(401).json({ error: "No autenticado" });


            //filtro solo por imagen
            const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
            if (!allowed.includes(req.file.mimetype)) {
                return res.status(415).json({ error: "Tipo de archivo no permitido" });
            }

            const uid = req.user.uid;
            const safeName = sanitizeName(req.file.originalname);
            const path = `users/${uid}/${Date.now()}-${safeName}`;

            const { error: uploadErr } = await supabase.storage
                .from(BUCKET)
                .upload(path, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });

            if (uploadErr) {
                return res.status(500).json({ error: uploadErr.message });
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