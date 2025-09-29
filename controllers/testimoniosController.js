/**
 * testimoniosController.js
 *
 * Controlador para la configuración de la vista de testimonios del sitio.
 * Gestiona información básica como el título del encabezado y facilita su
 * actualización mediante operación upsert.
 *
 * Funcionalidades principales:
 * - obtener: Devuelve la configuración actual (o valores por defecto si no existe).
 * - actualizar: Inserta/actualiza (upsert) el título del header y devuelve el nuevo estado.
 *
 * Notas:
 * - Usa PostgreSQL para persistir la configuración.
 * - Respuestas con mensajes claros y manejo de errores consistente.
 */

// backend/controllers/testimoniosController.js
import { sql } from "../config/postgre.js";

export default class testimoniosController {
  static async obtener(req, res) {
    try {
      const rows = await sql`
        SELECT id, header_title, updated_at
        FROM testimonios_site
        ORDER BY id ASC
        LIMIT 1
      `;

      if (!rows.length) {
        return res.status(200).json({
          id: 1,
          header_title: "Historias que inspiran.",
          updated_at: null,
        });
      }

      const row = rows[0];
      return res.status(200).json({
        ...row,
        header_title: row.header_title ?? "Historias que inspiran.",
      });
    } catch (e) {
      console.error("obtener testimonios error:", e);
      return res.status(500).json({ mensaje: "Error al obtener información de testimonios" });
    }
  }

  static async actualizar(req, res) {
    try {
      const { header_title } = req.body;

      if (!header_title) {
        return res.status(400).json({ mensaje: "El título del header es requerido" });
      }

      const rows = await sql`
        INSERT INTO testimonios_site
          (id, header_title, updated_at)
        OVERRIDING SYSTEM VALUE
        VALUES
          (1, ${header_title}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          header_title = EXCLUDED.header_title,
          updated_at   = NOW()
        RETURNING id, header_title, updated_at
      `;

      return res.status(200).json({
        mensaje: "Información de testimonios actualizada correctamente",
        testimonio: rows[0],
      });
    } catch (e) {
      console.error("actualizar testimonios error:", e);
      return res.status(500).json({ mensaje: "Error al actualizar información de testimonios" });
    }
  }
}