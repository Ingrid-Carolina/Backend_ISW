/**
 * enviarcorreo.js — Confirmación + aviso a admin del formulario de contacto (Resend)
 *
 * Envía:
 *  1) Correo interno a admin(s) con el detalle del formulario (plantilla `correo-contacto-admin.html`).
 *  2) Correo de confirmación al usuario (plantilla `correo-confirmacion.html`).
 */

import { Resend } from "resend";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

// Soporta múltiples destinatarios (coma o punto y coma)
function splitRecipients(envVarValue) {
  return (envVarValue || "")
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function safeJoin(arr) {
  return Array.isArray(arr) ? arr.join(", ") : arr ?? "";
}

export default async function enviarCorreoConfirmacion(datos) {
  const from = `"Pilotos FAH" <${process.env.EMAIL_FROM}>`;
  const replyTo = datos?.email || process.env.EMAIL_FROM;

  // -------- 1) Correo a ADMIN(ES) --------
  try {
    const adminTemplatePath = path.join(
      __dirname,
      "../templates/correo-contacto-admin.html"
    );
    let adminHtml = await readFile(adminTemplatePath, "utf-8");

    // Reemplazos dinámicos para el admin
    adminHtml = adminHtml
      .replace(/{{fecha}}/g, new Date().toLocaleString("es-HN"))
      .replace(/{{nombre}}/g, datos.nombre || "-")
      .replace(/{{apellido}}/g, datos.apellido || "-")
      .replace(/{{correo}}/g, datos.email || "-")
      .replace(/{{telefono}}/g, datos.telefono || "-")
      .replace(/{{direccion}}/g, datos.direccion || "-")
      .replace(/{{proposito}}/g, safeJoin(datos.proposito) || "-")
      .replace(/{{mensaje}}/g, (datos.mensaje || "").toString().trim() || "-");

    const adminRecipients = splitRecipients(
      process.env.EMAIL_TO || process.env.EMAIL_FROM
    );

    if (adminRecipients.length) {
      await resend.emails.send({
        from,
        to: adminRecipients, // admite array
        subject: `Nuevo formulario de contacto — ${datos.nombre || ""} ${
          datos.apellido || ""
        }`.trim(),
        html: adminHtml,
        text: `Nuevo formulario de contacto:
Fecha: ${new Date().toLocaleString("es-HN")}
Nombre: ${datos.nombre || "-"} ${datos.apellido || "-"}
Correo: ${datos.email || "-"}
Teléfono: ${datos.telefono || "-"}
Dirección: ${datos.direccion || "-"}
Propósito: ${safeJoin(datos.proposito) || "-"}
Mensaje: ${(datos.mensaje || "").toString().trim() || "-"}`,
        reply_to: replyTo,
      });
      console.log("[CONTACTO] Admin notificado a:", adminRecipients);
    }
  } catch (e) {
    console.error("[CONTACTO] Error enviando correo al admin:", e);
  }

  // -------- 2) Correo de confirmación al CLIENTE --------
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/correo-confirmacion.html"
    );
    let html = await readFile(templatePath, "utf-8");

    html = html
      .replace(/{{nombre}}/g, datos.nombre || "-")
      .replace(/{{apellido}}/g, datos.apellido || "-")
      .replace(/{{correo}}/g, datos.email || "-")
      .replace(/{{telefono}}/g, datos.telefono || "-")
      .replace(/{{direccion}}/g, datos.direccion || "-")
      .replace(/{{proposito}}/g, safeJoin(datos.proposito) || "-")
      .replace(/{{mensaje}}/g, datos.mensaje || "-")
      .replace(/{{home_link}}/g, "https://pilotosfah.com")
      .replace(/{{enlace_email}}/g, "mailto:pilotoshn@outlook.com")
      .replace(/{{enlace_telefono}}/g, "tel:+50499182456")
      .replace(/{{enlace_sitio}}/g, "https://pilotosfah.com");

    await resend.emails.send({
      from,
      to: datos.email,
      subject: "Confirmación de envío de formulario - Pilotos FAH",
      html,
      text: `Hola ${
        datos.nombre || ""
      }, confirmamos la recepción de tu formulario. ¡Gracias por contactarnos!`,
      reply_to: process.env.EMAIL_FROM,
    });

    console.log("[CONTACTO] Confirmación enviada a:", datos.email);
  } catch (e) {
    console.error("[CONTACTO] Error enviando confirmación al cliente:", e);
  }
}
