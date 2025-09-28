// backend/controllers/testimoniosController.js
import { sql } from "../config/postgre.js";

// Controlador para manejar las operaciones relacionadas con los testimonios.
export default class testimoniosController {
  /**
   * Método para obtener la información de los testimonios.
   */
  static async obtener(req, res) {
    try {
      // Consulta SQL para obtener la información de los testimonios.
      const rows = await sql`
        SELECT id, header_title, updated_at
        FROM testimonios_site
        ORDER BY id ASC
        LIMIT 1
      `;

      if (!rows.length) {
        // Devuelve valores predeterminados si no hay registros en la base de datos.
        return res.status(200).json({
          id: 1,
          header_title: "Historias que inspiran.",
          updated_at: null,
        });
      }

      const row = rows[0];
      // Devuelve la información obtenida o valores predeterminados si algún campo es nulo.
      return res.status(200).json({
        ...row,
        header_title: row.header_title ?? "Historias que inspiran.",
      });
    } catch (e) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error("obtener testimonios error:", e);
      return res.status(500).json({ mensaje: "Error al obtener información de testimonios" });
    }
  }

  /**
   * Método para actualizar la información de los testimonios.
   */
  static async actualizar(req, res) {
    try {
      const { header_title } = req.body;

      if (!header_title) {
        // Verifica que el título del header sea proporcionado.
        return res.status(400).json({ mensaje: "El título del header es requerido" });
      }

      // Inserta o actualiza la información de los testimonios en la base de datos.
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

      // Devuelve una respuesta indicando que la información fue actualizada correctamente.
      return res.status(200).json({
        mensaje: "Información de testimonios actualizada correctamente",
        testimonio: rows[0],
      });
    } catch (e) {
      // Manejo de errores en caso de fallo al actualizar la información.
      console.error("actualizar testimonios error:", e);
      return res.status(500).json({ mensaje: "Error al actualizar información de testimonios" });
    }
  }
}