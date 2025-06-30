import {
  sql,
  dbConnect,
  getEventById,
  createEvent,
  deleteEventdisabled,
  getAllEventsByMonthYear,
} from "../config/postgre.js";

class DatabaseController {
  constructor() {
    dbConnect();
  }

  async getEventos(req, res) {
    const { month, year } = req.body;
    try {
      const eventos = await getAllEventsByMonthYear(month, year);
      res.status(200).json(eventos);
    } catch (error) {
      console.error("Error al obtener los eventos:", error);
      res.status(500).send("Error al obtener los eventos: " + error.message);
    }
  }

  async getEventoById(req, res) {
    const { id } = req.body;
    try {
      const evento = await getEventById(id);
      if (evento) {
        res.status(200).json(evento);
      } else {
        res.status(404).send("Evento no encontrado");
      }
    } catch (error) {
      console.error("Error al obtener el evento por ID:", error);
      res
        .status(500)
        .send("Error al obtener el evento por ID: " + error.message);
    }
  }
  async crearEvento(req, res) {
    const { nombre, fecha_inicio, fecha_fin, descripcion, ishabilitado } =
      req.body;
    try {
      const nuevoEventoId = await createEvent({
        nombre,
        fecha_inicio,
        fecha_fin,
        descripcion,
        ishabilitado,
      });
      res.status(201).json({ id: nuevoEventoId });
    } catch (error) {
      console.error("Error al crear el evento:", error);
      res.status(500).send("Error al crear el evento: " + error.message);
    }
  }
  async actualizarEvento(req, res) {
    const { id, nombre, fecha_inicio, fecha_fin, descripcion, ishabilitado } =
      req.body;

    try {
      await updateEvent(id, {
        nombre,
        fecha_inicio,
        fecha_fin,
        descripcion,
        ishabilitado,
      });
      res.status(200).send("Evento actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar el evento:", error);
      res.status(500).send("Error al actualizar el evento: " + error.message);
    }
  }

  async eliminarEvento(req, res) {
    const { id } = req.body;
    try {
      await deleteEvent(id);
      res.status(200).send("Evento eliminado con éxito");
    } catch (error) {
      console.error("Error al eliminar el evento:", error);
      res.status(500).send("Error al eliminar el evento: " + error.message);
    }
  }
}

export default new DatabaseController();
