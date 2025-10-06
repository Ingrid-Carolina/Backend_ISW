/**
 * compracorreo.js — Envío de correos de compra (Resend)
 *
 * Envía:
 *  1) Correo interno a administradores con el detalle de la orden (plantilla `correo-orden.html`).
 *  2) Correo de confirmación al cliente con desglose de compra (plantilla `correo-compra-cliente.html`).
 *
 * Características:
 * - Usa la API de Resend y plantillas HTML basadas en archivos estáticos.
 * - Construcción de tabla de productos (cantidades/precios/subtotales).
 * - Cálculo de subtotal, impuesto e importe total para el cliente.
 * - Soporta múltiples destinatarios admin (separados por coma o punto y coma).
 *
 * Variables de entorno esperadas:
 * - RESEND_API_KEY      : API key de Resend.
 * - EMAIL_FROM          : Remitente (correo).
 * - EMAIL_FROM_NAME     : Nombre visible del remitente (opcional).
 * - EMAIL_REPLY_TO      : Dirección para respuestas (opcional).
 * - EMAIL_TO            : Lista de admin(s) (coma/;).
 *
 * Notas:
 * - Si falta RESEND_API_KEY, se registra en consola y no se intenta enviar.
 * - Los placeholders {{...}} en las plantillas se reemplazan dinámicamente.
 */
import { Resend } from "resend";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function splitRecipients(envVarValue) {
  return (envVarValue || "")
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// helpers arriba del archivo
function pickSize(it) {
  // prioridad: it.talla -> it.detalle_camisa
  if (it?.talla) return String(it.talla);
  const s = String(it?.detalle_camisa || "");
  // Busca "Talla: 2XL" o patrones comunes
  let m = s.match(/talla\s*:\s*([A-Za-z0-9+]+)/i);
  if (m) return m[1];
  m = s.match(/\b(4XL|3XL|2XL|XL|L|M|S|XS)\b/i);
  return m ? m[1] : "-";
}

function pickNameNumber(it) {
  const s = String(it?.detalle_camisa || "");
  const name = (s.match(/nombre\s*:\s*([^,]+?)(?:\s+numero|\s*$)/i) || [
    ,
    "-",
  ])[1].trim();
  const num = (s.match(/numero\s*:\s*([0-9]+)/i) || [, "-"])[1];
  return { name, num };
}

/* --- templates --- */
async function renderAdminTemplate(data) {
  const templatePath = path.join(__dirname, "../templates/correo-orden.html");
  let html = await readFile(templatePath, "utf-8");

  const productosHtml = data.cartItems?.length
    ? `
      <table role="presentation" cellspacing="0" cellpadding="6" border="1" width="100%"
        style="border-collapse:collapse;border:1px solid #ddd;font-size:14px;">
        <thead style="background:#f4f6ff;color:#0c005a;">
          <tr>
            <th align="left">Producto</th>
            <th align="center">Talla</th>
            <th align="left">Nombre</th>
            <th align="center">Número</th>
            <th align="center">Cant.</th>
            <th align="right">P. Unitario</th>
            <th align="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${data.cartItems
            .map((it) => {
              const talla = pickSize(it);
              const { name, num } = pickNameNumber(it);
              return `
              <tr>
                <td>${it.nombre_producto}</td>
                <td align="center">${talla}</td>
                <td>${name}</td>
                <td align="center">${num}</td>
                <td align="center">${it.cantidad}</td>
                <td align="right">L. ${Number(it.precio_unitario).toFixed(
                  2
                )}</td>
                <td align="right">L. ${(
                  Number(it.precio_unitario) * Number(it.cantidad)
                ).toFixed(2)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
    : "<em>(No se encontraron productos en la orden)</em>";

  html = html
    .replace(/{{year}}/g, String(new Date().getFullYear()))
    .replace(/{{productos}}/g, productosHtml);

  return html;
}

async function renderClienteTemplate(data) {
  const templatePath = path.join(
    __dirname,
    "../templates/correo-compra-cliente.html"
  );
  let html = await readFile(templatePath, "utf-8");

  const total = Array.isArray(data.cartItems)
    ? data.cartItems.reduce(
        (acc, it) => acc + Number(it.precio_unitario) * Number(it.cantidad),
        0
      )
    : 0;
  const impuesto = total * 0.15;
  const subtotal = total - impuesto;

  const productosHtml = data.cartItems?.length
    ? `
      <table role="presentation" cellspacing="0" cellpadding="6" border="1" width="100%"
        style="border-collapse:collapse;border:1px solid #ddd;font-size:14px;">
        <thead style="background:#f4f6ff;color:#0c005a;">
          <tr>
            <th align="left">Producto</th>
            <th align="center">Talla</th>
            <th align="left">Nombre</th>
            <th align="center">Número</th>
            <th align="center">Cant.</th>
            <th align="right">P. Unitario</th>
            <th align="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${data.cartItems
            .map((it) => {
              const talla = pickSize(it);
              const { name, num } = pickNameNumber(it);
              return `
              <tr>
                <td>${it.nombre_producto}</td>
                <td align="center">${talla}</td>
                <td>${name}</td>
                <td align="center">${num}</td>
                <td align="center">${it.cantidad}</td>
                <td align="right">L. ${Number(it.precio_unitario).toFixed(
                  2
                )}</td>
                <td align="right">L. ${(
                  Number(it.precio_unitario) * Number(it.cantidad)
                ).toFixed(2)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
    : "<em>(No se encontraron productos en la orden)</em>";

  html = html
    .replace(/{{nombre}}/g, String(data.nombre || "amigo/a"))
    .replace(/{{idorden}}/g, String(data.idorden || "-"))
    .replace(/{{year}}/g, String(new Date().getFullYear()))
    .replace(/{{productos}}/g, productosHtml)
    .replace(/{{subtotal}}/g, subtotal.toFixed(2))
    .replace(/{{impuesto}}/g, impuesto.toFixed(2))
    .replace(/{{total}}/g, total.toFixed(2));

  return html;
}

/* --- envío del correo--- */
export default async function enviarCorreoCompra(datos) {
  if (!resend) {
    console.error("RESEND_API_KEY no configurada. Evitando intento SMTP.");
    return;
  }

  const from = `${process.env.EMAIL_FROM_NAME || "Pilotos FAH"} <${
    process.env.EMAIL_FROM
  }>`;
  const replyTo = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;

  // --- Admin ---
  const admins = splitRecipients(process.env.EMAIL_TO);
  if (admins.length) {
    const htmlAdmin = await renderAdminTemplate(datos);
    await resend.emails.send({
      from,
      to: admins,
      subject: `Nueva compra #${datos.idorden || "-"}`,
      html: htmlAdmin,
      reply_to: replyTo,
    });
  }

  // --- Cliente ---
  if (datos?.email) {
    const htmlCliente = await renderClienteTemplate(datos);
    await resend.emails.send({
      from,
      to: datos.email,
      subject: `Confirmación de compra #${datos.idorden || "-"}`,
      html: htmlCliente,
      reply_to: replyTo,
    });
  }
}
