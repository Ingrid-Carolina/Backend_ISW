// controllers/eventController.js
import { sql } from "../config/postgre.js";
import { uploadToSupabase, deleteFromSupabaseByUrl } from "./_uploadHelpers.js";

export default class eventController {

  // CREAR (acepta multipart/form-data y JSON)
  static async registrarEvento(req, res) {
    try {
      const uid = req.user?.uid; // requiere requireAuth
      let { nombre, fecha_inicio, descripcion, fecha_final, img_url } = req.body;

      // Normaliza fechas (acepta ISO o 'YYYY-MM-DDTHH:mm' / 'YYYY-MM-DD')
      const inicio = new Date(fecha_inicio);
      const final  = fecha_final ? new Date(fecha_final) : null;

      if (isNaN(inicio.getTime())) {
        return res.status(400).send({ mensaje: "Fecha de inicio inválida" });
      }
      if (final && isNaN(final.getTime())) {
        return res.status(400).send({ mensaje: "Fecha final inválida" });
      }

      // Si viene archivo, súbelo y usa esa URL
      if (req.file && uid) {
        const up = await uploadToSupabase({ file: req.file, uid });
        img_url = up.url;
      }

      // Llama tu función/validación en BD
      const result = await sql`
        SELECT * FROM evento_valido(${nombre}, ${inicio.toISOString()}, ${final ? final.toISOString() : null}, ${descripcion}, ${img_url})
      `;
      const { exito, mensaje, id } = result[0] || {};

      if (exito) return res.status(201).send({ mensaje, id });   // 201 creado
      return res.status(400).send({ mensaje });

    } catch (error) {
      console.error("Error al registrar evento:", error);
      const status = error.status || 500;
      return res.status(status).send({
        mensaje: error.status ? error.message : "Error interno al registrar el evento",
        detalle: error.message || error.toString(),
      });
    }
  }

  // LISTAR (igual)
  static async obtenerEventos(req, res) {
    try {
      const eventos = await sql`
        SELECT id, nombre, descripcion, fecha_inicio, fecha_final, ishabilitado, img_url
        FROM eventos
        WHERE fecha_inicio >= CURRENT_DATE
        ORDER BY fecha_inicio
      `;
      return res.status(200).json(eventos);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      return res.status(500).send({ mensaje: "Error al obtener eventos", error: error.message });
    }
  }

  // ACTUALIZAR (acepta multipart/form-data y JSON)
  static async actualizarEvento(req, res) {
    const eid = Number(req.params.id);
    if (!Number.isInteger(eid)) {
      return res.status(400).send({ mensaje: "ID inválido" });
    }

    try {
      const uid = req.user?.uid;
      let { nombre, fecha_inicio, fecha_final, descripcion, img_url } = req.body;

      const inicio = new Date(fecha_inicio);
      const final  = fecha_final ? new Date(fecha_final) : null;

      if (isNaN(inicio.getTime())) {
        return res.status(400).send({ mensaje: "Fecha de inicio inválida" });
      }
      if (final && isNaN(final.getTime())) {
        return res.status(400).send({ mensaje: "Fecha final inválida" });
      }

      // Si viene archivo, sube y reemplaza la URL
      if (req.file && uid) {
        const up = await uploadToSupabase({ file: req.file, uid });
        img_url = up.url;
      }

      const result = await sql`
        UPDATE eventos
           SET nombre       = ${nombre},
               fecha_inicio = ${inicio.toISOString()},
               fecha_final  = ${final ? final.toISOString() : null},
               descripcion  = ${descripcion},
               img_url      = ${img_url || null}
         WHERE id = ${eid}
         RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).send({ mensaje: "No se encontró el evento con ese ID" });
      }

      return res.status(200).send({ mensaje: "Evento actualizado correctamente", id: result[0].id });

    } catch (error) {
      console.error("Error al actualizar evento:", error);
      const status = error.status || 500;
      return res.status(status).send({ mensaje: error.message || "Error al actualizar el evento", detalle: error.message });
    }
  }

  // ELIMINAR (con borrado opcional de imagen del bucket)
  static async eliminarEvento(req, res) {
    const eid = Number(req.params.id);
    if (!Number.isInteger(eid)) {
      return res.status(400).send({ mensaje: "ID inválido" });
    }
    try {
      // Busca URL para intentar borrar del bucket (opcional)
      const rows = await sql`SELECT img_url FROM eventos WHERE id = ${eid}`;
      const imgUrl = rows[0]?.img_url || null;

      await sql`DELETE FROM eventos WHERE id = ${eid}`;

      // Borrar archivo en Supabase si tenías imagen
      if (imgUrl) {
        try { await deleteFromSupabaseByUrl(imgUrl); } catch { /* noop */ }
      }

      return res.status(200).send({ mensaje: "Evento eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      return res.status(500).send({ mensaje: "Error al eliminar el evento", error: error.message });
    }
  }
}
