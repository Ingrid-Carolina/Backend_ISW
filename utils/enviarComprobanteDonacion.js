/**
 * utils/enviarComprobanteDonacion.js
 *
 * Envía:
 *  - Correo al ADMIN con plantilla y adjunto (si viene).
 *  - Correo de agradecimiento al DONANTE con plantilla (si hay email válido).
 *
 * ENV:
 * - RESEND_API_KEY
 * - EMAIL_FROM, EMAIL_FROM_NAME
 * - EMAIL_TO (uno o varios separados por coma)
 */

import { Resend } from "resend";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const resend = new Resend(process.env.RESEND_API_KEY);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, "..", "templates");

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function simpleRender(tpl, vars = {}) {
  let html = tpl;

  // Condicional para comentario
  if (html.includes("{{#if_comentario}}")) {
    const has = !!(vars.comentario && String(vars.comentario).trim());
    html = html.replace(
      /{{#if_comentario}}([\s\S]*?){{\/if_comentario}}/g,
      has ? "$1" : ""
    );
  }

  // Reemplazos simples
  for (const [k, v] of Object.entries(vars)) {
    html = html.replaceAll(`{{${k}}}`, escapeHtml(v ?? ""));
  }
  return html;
}

function formatFecha(fecha = new Date()) {
  try {
    return new Intl.DateTimeFormat("es-HN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(fecha);
  } catch {
    return new Date().toLocaleString();
  }
}

function parseDestinatarios(rawTo, fallback) {
  const list = (rawTo || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) return fallback ? [fallback] : ["onboarding@resend.dev"];
  return list.length === 1 ? list[0] : list;
}

/**
 * @param {{nombre?:string, monto?:string|number, comentario?:string, correo?:string}} datos
 * @param {{filename:string, buffer?:Buffer, content?:string, mimeType?:string, contentType?:string}|null} adjunto
 */
export default async function enviarComprobanteDonacion(datos = {}, adjunto = null) {
  const fromName = (process.env.EMAIL_FROM_NAME || "Pilotos FAH").trim();
  const fromAddr = (process.env.EMAIL_FROM || "").trim();
  const safeFrom =
    fromAddr && fromAddr.includes("@")
      ? `${fromName} <${fromAddr}>`
      : `${fromName} <onboarding@resend.dev>`;

  const toField = parseDestinatarios(process.env.EMAIL_TO, fromAddr);

  // Variables comunes de plantilla
  const vars = {
    nombre: datos.nombre || "Anónimo",
    monto: datos.monto ? `L.${datos.monto}` : "No especificado",
    fecha: formatFecha(new Date()),
  };

  // --- ADMIN: render plantilla y adjunto
  const adminTplPath = path.join(templatesDir, "donacion-admin.html");
  const adminTplRaw = await readFile(adminTplPath, "utf8");
  const adminHtml = simpleRender(adminTplRaw, vars);

  const adminPayload = {
    from: safeFrom,
    to: toField,
    subject: "Comprobante de donación",
    html: adminHtml,
    text: `Nuevo comprobante de donación de ${vars.nombre} por ${vars.monto}. ${vars.comentario ? "Comentario: " + vars.comentario : ""} Fecha: ${vars.fecha}`,
  };

  if (adjunto) {
    const contentBuffer =
      adjunto.buffer ||
      (adjunto.content ? Buffer.from(adjunto.content, "base64") : null);

    if (contentBuffer) {
      adminPayload.attachments = [
        {
          filename: adjunto.filename || "comprobante",
          content: contentBuffer,
          contentType:
            adjunto.mimeType || adjunto.contentType || "application/octet-stream",
        },
      ];
    }
  }

  const adminResult = await resend.emails.send(adminPayload);
  console.log("[RESEND] ADMIN OK ->", adminResult?.id || adminResult);

  // --- DONANTE
  const donorEmail = (datos.correo || "").trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail);

  if (isEmail) {
    const donorTplPath = path.join(templatesDir, "donacion-agradecimiento.html");
    const donorTplRaw = await readFile(donorTplPath, "utf8");
    const donorHtml = simpleRender(donorTplRaw, vars);

    const donorPayload = {
      from: safeFrom,
      to: donorEmail,
      subject: "¡Gracias por tu donación!",
      html: donorHtml,
      text: `¡Gracias por tu donación, ${vars.nombre}! Monto: ${vars.monto}. ${vars.comentario ? "Mensaje: " + vars.comentario : ""} Fecha: ${vars.fecha}`,
    };

    const donorResult = await resend.emails.send(donorPayload);
    console.log("[RESEND] DONOR OK ->", donorResult?.id || donorResult);
  }

  return { ok: true };
}
