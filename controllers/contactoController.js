import { sql } from "../config/postgre.js";

export default class contactoController {
  static async obtener(req, res) {
    try {
      const rows = await sql`
        SELECT id, org_nombre, telefono_lbl, telefono_val, email_lbl, email_val, texto_intro, texto_cta, updated_at
        FROM contacto_site
        ORDER BY id ASC
        LIMIT 1
      `;

      if (!rows.length) {
        // Si no hay registros o falla al obtenerlos usa defaults
        return res.status(200).json({
          id: 1,
          org_nombre: "Organización de Béisbol PILOTOS - FAH",
          telefono_lbl: "NUESTRO NÚMERO",
          telefono_val: "+504 9918-2456",
          email_lbl: "CORREO ELECTRÓNICO",
          email_val: "pilotoshn@outlook.com",
          texto_intro: "Comparta su experiencia con nosotros.",
          texto_cta: "Envíe una historia o testimonio.",
          updated_at: null,
        });
      }

      return res.status(200).json(rows[0]);
    } catch (e) {
      console.error("obtener contacto error:", e);
      return res.status(500).json({ mensaje: "Error al obtener contacto" });
    }
  }

  static async actualizar(req, res) {
    try {
      const {
        org_nombre,
        telefono_lbl,
        telefono_val,
        email_lbl,
        email_val,
        texto_intro,
        texto_cta,
      } = req.body;

      // Valida campos minimos
      if (
        !org_nombre ||
        !telefono_lbl ||
        !telefono_val ||
        !email_lbl ||
        !email_val ||
        !texto_intro ||
        !texto_cta
      ) {
        return res.status(400).json({ mensaje: "Faltan campos requeridos" });
      }

      //validaciones
      const rows = await sql`
        INSERT INTO contacto_site
          (id, org_nombre, telefono_lbl, telefono_val, email_lbl, email_val, texto_intro, texto_cta, updated_at)
        OVERRIDING SYSTEM VALUE
        VALUES
          (1, ${org_nombre}, ${telefono_lbl}, ${telefono_val}, ${email_lbl}, ${email_val}, ${texto_intro}, ${texto_cta}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          org_nombre   = EXCLUDED.org_nombre,
          telefono_lbl = EXCLUDED.telefono_lbl,
          telefono_val = EXCLUDED.telefono_val,
          email_lbl    = EXCLUDED.email_lbl,
          email_val    = EXCLUDED.email_val,
          texto_intro  = EXCLUDED.texto_intro,
          texto_cta    = EXCLUDED.texto_cta,
          updated_at   = NOW()
        RETURNING id, org_nombre, telefono_lbl, telefono_val, email_lbl, email_val, texto_intro, texto_cta, updated_at
      `;

      return res.status(200).json({
        mensaje: "Informacion de contacto actualizada correctamente",
        contacto: rows[0],
      });
    } catch (e) {
      console.error("actualizar contacto error:", e);
      return res.status(500).json({ mensaje: "Error al actualizar contacto" });
    }
  }
}
