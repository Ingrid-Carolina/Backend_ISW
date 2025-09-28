// Importa la biblioteca Multer para manejar la subida de archivos.
import multer from "multer";

// Lista de tipos de archivo permitidos para la subida de imágenes.
const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Configuración de Multer para la subida de imágenes.
 * - Almacena los archivos en memoria.
 * - Limita el tamaño máximo de los archivos a 5MB.
 * - Filtra los archivos para permitir solo los tipos especificados en la lista `allowed`.
 */
const uploadImages = multer({
  storage: multer.memoryStorage(), // Almacena los archivos en memoria temporal.
  limits: { fileSize: 5 * 1024 * 1024 }, // Tamaño máximo de archivo: 5MB.
  fileFilter: (_req, file, cb) => cb(null, allowed.includes(file.mimetype)), // Filtra los archivos por tipo MIME.
});

// Exporta la configuración de Multer para su uso en otros módulos.
export default uploadImages;
