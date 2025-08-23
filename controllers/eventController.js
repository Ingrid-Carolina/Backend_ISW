import axios from "axios";
import { sql } from "../config/postgre.js";

export default class eventController {

//Funcion para registrar Eventos
  static async registrarEvento(req, res) {
    const { nombre, fecha_inicio, descripcion, fecha_final } = req.body;

    try {
      const result = await sql`
      SELECT * FROM evento_valido(${nombre}, ${fecha_inicio}, ${fecha_final}, ${descripcion})
    `;

      const { exito, mensaje } = result[0];

      if (exito) {
        res.status(201).send({ mensaje });
      } else {
        res.status(400).send({ mensaje });
      }
    } catch (error) {
      console.error("Error al registrar evento:", error);

      res.status(500).send({
        mensaje: "Error interno al registrar el evento",
        detalle: error.message || error.toString(),
      });
    }
  }

  //funcion para mostrar eventos en el backend
  static async obtenerEventos(req, res) {
    try {
      const eventos = await sql`
      SELECT id, nombre, descripcion, fecha_inicio, fecha_final,ishabilitado
      FROM Eventos
      WHERE fecha_inicio > CURRENT_DATE
      ORDER BY fecha_inicio
    `;

      res.status(200).json(eventos);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      res
        .status(500)
        .send({ mensaje: "Error al obtener eventos", error: error.message });
    }
  }

  //funcion para eliminar eventos en la bd
  static async eliminarEvento(req, res) {
    const { id } = req.params;

    try {
      const result = await sql`
      DELETE FROM Eventos WHERE id = ${id}
    `;

      res.status(200).send({ mensaje: "Evento eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      res
        .status(500)
        .send({ mensaje: "Error al eliminar el evento", error: error.message });
    }
  }

  // mofiicar evento
  static async actualizarEvento(req, res) {
    const { id } = req.params;
    let { nombre, fecha_inicio, fecha_final, descripcion } = req.body;

    try {
      // Conversión segura a tipo Date
      const inicio = new Date(fecha_inicio);
      const final = new Date(fecha_final);

      // Validación mínima
      if (isNaN(inicio.getTime()) || isNaN(final.getTime())) {
        return res.status(400).send({ mensaje: "Fechas inválidas" });
      }

      const result = await sql`
			UPDATE Eventos
			SET nombre = ${nombre},
				fecha_inicio = ${inicio.toISOString()},
				fecha_final = ${final.toISOString()},
				descripcion = ${descripcion}
			WHERE id = ${id}
			RETURNING id
		`;

      if (result.length === 0) {
        return res.status(404).send({
          mensaje: "No se encontró el evento con ese ID",
        });
      }

      res.status(200).send({
        mensaje: "Evento actualizado correctamente",
        id: result[0].id,
      });
    } catch (error) {
      console.error("Error al actualizar evento:", error);
      res.status(500).send({
        mensaje: "Error al actualizar el evento",
        detalle: error.message,
      });
    }
  }
}