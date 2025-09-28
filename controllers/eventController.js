// controllers/eventController.js
// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from "../config/postgre.js";

// Importa funciones auxiliares para subir y eliminar archivos en Supabase.
import { uploadToSupabase, deleteFromSupabaseByUrl } from "./_uploadHelpers.js";

// Controlador para manejar las operaciones relacionadas con los eventos.
export default class eventController {

  // Método para registrar un nuevo evento.
  static async registrarEvento(req, res) {
    try {
      const uid = req.user?.uid; // Obtiene el UID del usuario autenticado (requiere requireAuth).
      let { nombre, fecha_inicio, descripcion, fecha_final, img_url } = req.body; // Obtiene los datos del cuerpo de la solicitud.

      // Normaliza las fechas proporcionadas.
      const inicio = new Date(fecha_inicio);
      const final  = fecha_final ? new Date(fecha_final) : null;

      if (isNaN(inicio.getTime())) {
        return res.status(400).send({ mensaje: "Fecha de inicio inválida" }); // Valida la fecha de inicio.
      }
      if (final && isNaN(final.getTime())) {
        return res.status(400).send({ mensaje: "Fecha final inválida" }); // Valida la fecha final.
      }

      // Si se proporciona un archivo, súbelo a Supabase y actualiza la URL de la imagen.
      if (req.file && uid) {
        const up = await uploadToSupabase({ file: req.file, uid });
        img_url = up.url;
      }

      // Llama a la función de validación en la base de datos.
      const result = await sql`
        SELECT * FROM evento_valido(${nombre}, ${inicio.toISOString()}, ${final ? final.toISOString() : null}, ${descripcion}, ${img_url})
      `;
      const { exito, mensaje, id } = result[0] || {};

      if (exito) return res.status(201).send({ mensaje, id }); // Devuelve un estado 201 si el evento se creó correctamente.
      return res.status(400).send({ mensaje }); // Devuelve un error si la validación falla.

    } catch (error) {
      console.error("Error al registrar evento:", error); // Manejo de errores.
      const status = error.status || 500;
      return res.status(status).send({
        mensaje: error.status ? error.message : "Error interno al registrar el evento",
        detalle: error.message || error.toString(),
      });
    }
  }

  // Método para obtener la lista de eventos.
  static async obtenerEventos(req, res) {
    try {
      const eventos = await sql`
        SELECT id, nombre, descripcion, fecha_inicio, fecha_final, ishabilitado, img_url
        FROM eventos
        WHERE fecha_inicio >= CURRENT_DATE
        ORDER BY fecha_inicio
      `; // Consulta SQL para obtener los eventos futuros.
      return res.status(200).json(eventos); // Devuelve los eventos en formato JSON.
    } catch (error) {
      console.error("Error al obtener eventos:", error); // Manejo de errores.
      return res.status(500).send({ mensaje: "Error al obtener eventos", error: error.message });
    }
  }

  // Método para actualizar un evento existente.
  static async actualizarEvento(req, res) {
    const eid = Number(req.params.id); // Obtiene el ID del evento desde los parámetros de la solicitud.
    if (!Number.isInteger(eid)) {
      return res.status(400).send({ mensaje: "ID inválido" }); // Valida el ID.
    }

    try {
      const uid = req.user?.uid; // Obtiene el UID del usuario autenticado.
      let { nombre, fecha_inicio, fecha_final, descripcion, img_url } = req.body; // Obtiene los datos del cuerpo de la solicitud.

      const inicio = new Date(fecha_inicio);
      const final  = fecha_final ? new Date(fecha_final) : null;

      if (isNaN(inicio.getTime())) {
        return res.status(400).send({ mensaje: "Fecha de inicio inválida" }); // Valida la fecha de inicio.
      }
      if (final && isNaN(final.getTime())) {
        return res.status(400).send({ mensaje: "Fecha final inválida" }); // Valida la fecha final.
      }

      // Si se proporciona un archivo, súbelo a Supabase y actualiza la URL de la imagen.
      if (req.file && uid) {
        const up = await uploadToSupabase({ file: req.file, uid });
        img_url = up.url;
      }

      // Actualiza el evento en la base de datos.
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
        return res.status(404).send({ mensaje: "No se encontró el evento con ese ID" }); // Manejo de caso donde no se encuentra el evento.
      }

      return res.status(200).send({ mensaje: "Evento actualizado correctamente", id: result[0].id }); // Respuesta de éxito.

    } catch (error) {
      console.error("Error al actualizar evento:", error); // Manejo de errores.
      const status = error.status || 500;
      return res.status(status).send({ mensaje: error.message || "Error al actualizar el evento", detalle: error.message });
    }
  }

  // Método para eliminar un evento existente.
  static async eliminarEvento(req, res) {
    const eid = Number(req.params.id); // Obtiene el ID del evento desde los parámetros de la solicitud.
    if (!Number.isInteger(eid)) {
      return res.status(400).send({ mensaje: "ID inválido" }); // Valida el ID.
    }
    try {
      // Busca la URL de la imagen asociada al evento para eliminarla del bucket (opcional).
      const rows = await sql`SELECT img_url FROM eventos WHERE id = ${eid}`;
      const imgUrl = rows[0]?.img_url || null;

      await sql`DELETE FROM eventos WHERE id = ${eid}`; // Elimina el evento de la base de datos.

      // Si existe una imagen asociada, intenta eliminarla de Supabase.
      if (imgUrl) {
        try { await deleteFromSupabaseByUrl(imgUrl); } catch { /* noop */ }
      }

      return res.status(200).send({ mensaje: "Evento eliminado correctamente" }); // Respuesta de éxito.
    } catch (error) {
      console.error("Error al eliminar evento:", error); // Manejo de errores.
      return res.status(500).send({ mensaje: "Error al eliminar el evento", error: error.message });
    }
  }
}
