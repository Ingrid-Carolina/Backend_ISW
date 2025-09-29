import enviarComprobanteDonacion from "../utils/enviarComprobanteDonacion.js";
import { sql } from "../config/postgre.js"; 

class DonationReceiptController {
  static async enviar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Falta el archivo comprobante." });
      }

      const { monto } = req.body || {};
      const email =
        (req.user && (req.user.correo || req.user.email)) ||
        req.authEmail ||
        null;

      let resolvedName = "Anónimo";

      if (email) {
        try {
          const rows = await sql`
            SELECT nombre FROM usuarios WHERE email = ${email} LIMIT 1
          `;
          if (rows.length > 0) {
            resolvedName = rows[0].nombre || "Anónimo";
          }
        } catch (dbErr) {
          console.error("[DB] Error buscando nombre del usuario:", dbErr);
        }
      }

      console.log("[DONATION] nombre/email resueltos:", resolvedName, email);

      const datos = {
        nombre: resolvedName,
        monto: monto || null,
        correo: email || null,
      };

      const adjunto = {
        filename: req.file.originalname || "comprobante",
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      };

      await enviarComprobanteDonacion(datos, adjunto);
      return res.status(200).json({ mensaje: "Comprobante enviado." });
    } catch (e) {
      console.error("Error al enviar comprobante:", e);
      return res.status(500).json({ error: "No se pudo enviar el comprobante." });
    }
  }
}

export default DonationReceiptController;
