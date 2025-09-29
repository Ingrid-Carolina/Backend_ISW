/**
 * multerImages.js
 *
 * Configuración de Multer en memoria para subir imágenes (buffer en `req.file`).
 * Filtra por tipos MIME permitidos y limita el tamaño del archivo.
 *
 * Características:
 * - storage: memoryStorage() (ideal para reenviar a storage externo, p. ej. Supabase/S3).
 * - limits: tamaño máximo 5MB por archivo.
 * - fileFilter: solo `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
 *
 * Uso:
 * - Importar `uploadImages` y usar como middleware: `uploadImages.single('file')`.
 */

// Middlewares/multerImages.js
import multer from "multer";

const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => cb(null, allowed.includes(file.mimetype)),
});

//--

export default uploadImages;
