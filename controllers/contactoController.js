// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from "../config/postgre.js";

// Define el controlador para manejar las operaciones relacionadas con el contacto.
export default class contactoController {
  // Método para obtener los datos de contacto desde la base de datos.
  static async obtener(req, res) {
    try {
      // Consulta SQL para obtener los datos de contacto.
      const rows = await sql`
        SELECT id, org_nombre, telefono_lbl, telefono_val, email_lbl, email_val,
               texto_intro, texto_cta, header_title, updated_at
        FROM contacto_site
        ORDER BY id ASC
        LIMIT 1
      `;

      if (!rows.length) {
        // Devuelve valores predeterminados si no hay registros en la base de datos.
        return res.status(200).json({
          id: 1,
          org_nombre: "Organización de Béisbol PILOTOS - FAH",
          telefono_lbl: "NUESTRO NÚMERO",
          telefono_val: "+504 9918-2456",
          email_lbl: "CORREO ELECTRÓNICO",
          email_val: "pilotoshn@outlook.com",
          texto_intro: "Comparta su experiencia con nosotros.",
          texto_cta: "Envíe una historia o testimonio.",
          header_title: "Ponte en Contacto",
          updated_at: null,
        });
      }

      // Devuelve el primer registro encontrado en la base de datos.
      const row = rows[0];
      return res.status(200).json({
        ...row,
        header_title: row.header_title ?? "Ponte en Contacto", // Valor predeterminado si header_title es nulo.
      });
    } catch (e) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error("obtener contacto error:", e);
      return res.status(500).json({ mensaje: "Error al obtener contacto" });
    }
  }

  // Método para actualizar los datos de contacto en la base de datos.
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
        header_title,
      } = req.body;

      // Valida mínimos
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

      // Upsert con header_title
      const rows = await sql`
        INSERT INTO contacto_site
          (id, org_nombre, telefono_lbl, telefono_val, email_lbl, email_val,
           texto_intro, texto_cta, header_title, updated_at)
        OVERRIDING SYSTEM VALUE
        VALUES
          (1, ${org_nombre}, ${telefono_lbl}, ${telefono_val}, ${email_lbl}, ${email_val},
           ${texto_intro}, ${texto_cta}, ${header_title ?? "Ponte en Contacto"}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          org_nombre   = EXCLUDED.org_nombre,
          telefono_lbl = EXCLUDED.telefono_lbl,
          telefono_val = EXCLUDED.telefono_val,
          email_lbl    = EXCLUDED.email_lbl,
          email_val    = EXCLUDED.email_val,
          texto_intro  = EXCLUDED.texto_intro,
          texto_cta    = EXCLUDED.texto_cta,
          header_title = EXCLUDED.header_title,
          updated_at   = NOW()
        RETURNING id, org_nombre, telefono_lbl, telefono_val, email_lbl, email_val,
                  texto_intro, texto_cta, header_title, updated_at
      `;

      return res.status(200).json({
        mensaje: "Información de contacto actualizada correctamente",
        contacto: rows[0],
      });
    } catch (e) {
      console.error("actualizar contacto error:", e);
      return res.status(500).json({ mensaje: "Error al actualizar contacto" });
    }
  }
}
