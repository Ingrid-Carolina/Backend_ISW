// controllers/_uploadHelpers.js
import { supabase, BUCKET } from "../config/supabase.js";

export function sanitizeName(name) {
  return (name || "image")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}

export async function uploadToSupabase({ file, uid }) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowed.includes(file.mimetype)) {
    const err = new Error("Tipo de archivo no permitido");
    err.status = 415;
    throw err;
  }
  const safeName = sanitizeName(file.originalname);
  const path = `users/${uid}/${Date.now()}-${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadErr) {
    const err = new Error(uploadErr.message);
    err.status = 500;
    throw err;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

// Intenta derivar el path interno desde una public URL
export function pathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null;
  // Busca el segmento después de `/object/public/${BUCKET}/`
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export async function deleteFromSupabaseByUrl(publicUrl) {
  const path = pathFromPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
