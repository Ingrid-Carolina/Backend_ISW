import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

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
  // ruta del template HTML
  const templatePath = path.join(
    __dirname,
    "../templates/correo-donacion.html"
  );
  let html = await readFile(templatePath, "utf-8");

  const safe = (v, fallback = "-") => (v ?? "").toString().trim() || fallback;

  // reemplazos
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
 * Esta funcion envia dos correos:
 *  1) Al Interno osea al admin designado de recibir esos correos
 *  2) Agradecimiento al donante solo si proporciono un coreo
 */
export default async function enviarCorreoDonacion(datos) {
  const transporter = createTransporter();

  const from = `"Pilotos FAH" <${process.env.EMAIL_USER}>`;
  const adminTo = process.env.EMAIL_TO || process.env.EMAIL_USER;

  // 1) correo interno
  await transporter.sendMail({
    from,
    to: adminTo,
    subject: `Nueva donación: ${datos.nombre || "Anónimo"}`,
    html: adminHtml(datos),
    text: adminText(datos),
  });

  // 2) correo al donante
  if (datos.correo) {
    const htmlDonor = await renderDonorTemplate(datos);

    await transporter.sendMail({
      from,
      to: datos.correo,
      subject: "Gracias por tu donación — Pilotos FAH",
      html: htmlDonor,
      text: donorText(datos),
    });
  }
}
