/**
 * donacioncorreo.js — Envío de correos por donaciones (Resend)
 *
 * Envía:
 *  1) Correo interno al buzón del club con el resumen de la solicitud.
 *  2) Correo de agradecimiento al donante (si proporcionó correo), basado en la plantilla
 *     `correo-donacion.html` con reemplazos dinámicos.
 *
 * Características:
 * - Plantilla HTML para el donante + versión de texto plano fallback.
 * - Resumen claro para administradores (HTML + texto).
 * - Campos admitidos: nombre, correo, teléfono, día, horario, descripción.
 *
 * Variables de entorno:
 * - RESEND_API_KEY : API key de Resend.
 * - EMAIL_FROM     : Remitente (correo).
 * - EMAIL_TO       : Correo del buzón interno (si no está, usa EMAIL_FROM).
 *
 * Notas:
 * - Usa `Resend.emails.send()` para ambos correos.
 * - Plantillas externas leídas desde `/templates`.
 */
import { Resend } from "resend";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

function splitRecipients(envVarValue) {
  return (envVarValue || "")
    .split(/[;,]/)      // admite coma o punto y coma
    .map(s => s.trim())
    .filter(Boolean);
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

/** ---------- Correo interno (al buzón del club) ---------- */
function adminHtml(d) {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;line-height:1.5">
    <h2>Nueva solicitud de donación</h2>
    <p><b>Nombre:</b> ${d.nombre || "-"}<br/>
       <b>Correo:</b> ${d.correo || "-"}<br/>
       <b>Teléfono:</b> ${d.telefono || "-"}<br/>
       <b>Día:</b> ${d.dia || "-"}<br/>
       <b>Horario:</b> ${d.horario || "-"}<br/>
       <b>Descripción:</b> ${d.descripcion || "-"}
    </p>
    <hr/>
    <p style="color:#666;font-size:12px">Fecha: ${new Date().toLocaleString()}</p>
  </div>`;
}

function adminText(d) {
  return `Nueva donación:
Nombre: ${d.nombre || "-"}
Correo: ${d.correo || "-"}
Teléfono: ${d.telefono || "-"}
Día: ${d.dia || "-"}
Horario: ${d.horario || "-"}
Descripción: ${d.descripcion || "-"}
Fecha: ${new Date().toLocaleString()}`;
}

async function renderDonorTemplate(data) {
  const templatePath = path.join(__dirname, "../templates/correo-donacion.html");
  let html = await readFile(templatePath, "utf-8");

  const safe = (v, fallback = "-") => (v ?? "").toString().trim() || fallback;

  html = html
    .replace(/{{nombre}}/g, safe(data.nombre, "amigo/a"))
    .replace(/{{dia}}/g, safe(data.dia))
    .replace(/{{horario}}/g, safe(data.horario))
    .replace(/{{descripcion}}/g, safe(data.descripcion, "(sin detalle)"))
    .replace(/{{year}}/g, String(new Date().getFullYear()));

  return html;
}

/** Texto alternativo (por si el cliente no soporta HTML) */
function donorText(d) {
  return `¡Gracias por tu aporte a Pilotos FAH!
Día: ${d.dia || "-"}
Horario: ${d.horario || "-"}
Detalle: ${d.descripcion || "(sin detalle)"}
Pronto te contactaremos para coordinar la entrega.`;
}

/**
 * Envía dos correos:
 *  1) Al administrador (EMAIL_TO o EMAIL_USER)
 *  2) Al donante (si proporcionó correo)
 */
export default async function enviarCorreoDonacion(datos) {
  const from = `"Pilotos FAH" <${process.env.EMAIL_FROM}>`;

  // soporta múltiples destinatarios
  const adminRecipients = splitRecipients(process.env.EMAIL_TO || process.env.EMAIL_FROM);

  // 1) correo interno (a todos los admins)
  await resend.emails.send({
    from,
    to: adminRecipients,                 
    subject: `Nueva donación: ${datos.nombre || "Anónimo"}`,
    html: adminHtml(datos),
    text: adminText(datos),
  });

  // 2) correo al donante (opcional)
  if (datos.correo) {
    const htmlDonor = await renderDonorTemplate(datos);
    await resend.emails.send({
      from,
      to: datos.correo,
      subject: "Gracias por tu donación — Pilotos FAH",
      html: htmlDonor,
      text: donorText(datos),
    });
  }
}
