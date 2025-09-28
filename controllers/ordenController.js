// Importa las dependencias necesarias para manejar las órdenes.
import axios from "axios";
import auth from "../config/firebase.js";
import { sql } from "../config/postgre.js";
import enviarCorreoConfirmacion from "../utils/enviarcorreo.js";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import admin from "../config/firebase-admin.js";
import enviarCorreoCompra from "../utils/compracorreo.js";

// Controlador para manejar las operaciones relacionadas con las órdenes.
class OrdenController {
  // Método para obtener los productos comprados en una orden específica.
  static async getProductosbyID(req, res) {
    const { idorden } = req.params;
    try {
      // Consulta SQL para obtener los productos comprados en la orden especificada.
      const productos_comprados = await sql`
      SELECT 
        p.nombre_producto,
        d.cantidad,
        d.precio_unitario,
        d.cantidad * d.precio_unitario AS total
      FROM 
        ordenes o
      JOIN 
        detalleorden d ON o.idorden = d.orden_id
      JOIN 
        productos p ON d.producto_id = p.idproducto
      WHERE 
        o.idorden = ${idorden}
      ORDER BY 
        p.nombre_producto ASC;
    `;
      // Devuelve los productos comprados en formato JSON.
      res.status(200).json(productos_comprados);
    } catch (e) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error(`Error al obtener productos: ${e}`);
      res.status(500).json({ error: `Error al obtener productos: ${e}` });
    }
  }

  // Método para obtener todas las órdenes con información del usuario.
  static async getOrdenes(req, res) {
    try {
      // Consulta SQL para obtener todas las órdenes y sus detalles.
      const ordenes = await sql`
      SELECT o.idorden, o.fecha, o.estado, u.nombre AS nombre_usuario, u.email
      FROM ordenes o
      JOIN usuarios u ON o.usuario_id = u.id;
    `;
      // Devuelve las órdenes en formato JSON.
      res.status(200).json({ ordenes });
    } catch (error) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error("Error al obtener ordenes:", error.message);
      res.status(500).json({ error: "Error al obtener ordenes" });
    }
  }

  // Método para obtener una orden específica por su ID.
  static async getOrdenById(req, res) {
    try {
      const { id } = req.params;
      // Consulta SQL para obtener los detalles de una orden específica.
      const [orden] = await sql`
        SELECT o.idorden, o.usuario_id, o.fecha, o.estado,
               COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS total
        FROM ordenes o
        LEFT JOIN detalleorden d ON o.idorden = d.orden_id
        WHERE o.idorden = ${id}
        GROUP BY o.idorden
      `;

      if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

      // Devuelve los detalles de la orden en formato JSON.
      res.status(200).json(orden);
    } catch (e) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error(`Error al obtener orden: ${e}`);
      res.status(500).json({ error: `Error al obtener orden: ${e}` });
    }
  }

  // Método para crear una nueva orden.
  static async addOrden(req, res) {
    const { uid, cartItems } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      // Verifica que la orden contenga productos.
      return res.status(400).json({ mensaje: "No hay productos en la orden" });
    }

    try {
      // Inserta una nueva orden en la base de datos.
      const result = await sql`
      INSERT INTO ordenes (usuario_id)
      VALUES (${uid})
      RETURNING idorden
    `;

      const orden_id = result[0].idorden; // Obtiene el ID de la nueva orden.

      // Inserta los productos de la orden en la tabla detalleorden.
      for (const item of cartItems) {
        await sql`
        INSERT INTO DETALLEORDEN (orden_id, producto_id, cantidad, precio_unitario)
        VALUES (${orden_id}, ${item.idproducto}, ${item.cantidad}, ${item.precio_unitario})
      `;
      }

      // Obtiene los datos del usuario para enviar notificaciones.
      const userRows = await sql`
        SELECT nombre, email
        FROM usuarios
        WHERE id = ${uid}
        LIMIT 1
      `;
      const cliente = userRows[0] || {};
      const nombreCliente = cliente.nombre || null;
      const emailCliente = cliente.email || null;

      // Enviar correos de confirmación al cliente y al administrador.
      (async () => {
        try {
          await enviarCorreoCompra({
            idorden: orden_id,
            cartItems,
            nombre: nombreCliente,
            email: emailCliente,
          });
        } catch (mailErr) {
          console.error(
            "Error al enviar correo de compra:",
            mailErr?.message || mailErr
          );
        }
      })();

      // Devuelve una respuesta indicando que la orden fue creada exitosamente.
      return res
        .status(201)
        .json({ mensaje: "Orden creada exitosamente", orden_id });
    } catch (error) {
      // Manejo de errores en caso de fallo al crear la orden.
      console.error("Error al crear la orden:", error.message || error.stack);
      return res.status(500).json({ mensaje: error.message });
    }
  }

  // Método para actualizar el estado de una orden (solo para administradores).
  static async actualizarOrden(req, res) {
    const { id } = req.params;
    const { estado } = req.body;

    try {
      // Actualiza el estado de la orden en la base de datos.
      const result = await sql`
        UPDATE ordenes
        SET estado = ${estado}
        WHERE idorden = ${id}
        RETURNING *
      `;

      if (result.length === 0)
        return res.status(404).json({ mensaje: "Orden no encontrada" });

      // Devuelve una respuesta indicando que la orden fue actualizada correctamente.
      res.status(200).json({
        mensaje: "Orden actualizada correctamente",
        orden: result[0],
      });
    } catch (e) {
      // Manejo de errores en caso de fallo al actualizar la orden.
      console.error(`Error al actualizar orden: ${e}`);
      res.status(500).json({ error: `Error al actualizar orden: ${e}` });
    }
  }

  // Método para eliminar una orden.
  static async eliminarOrden(req, res) {
    const { id } = req.params;
    try {
      // Elimina la orden de la base de datos.
      await sql`DELETE FROM ordenes WHERE idorden = ${id}`;
      res.status(200).json({ mensaje: "Orden eliminada correctamente!" });
    } catch (e) {
      // Manejo de errores en caso de fallo al eliminar la orden.
      console.error(`Error al eliminar orden: ${e}`);
      res
        .status(500)
        .json({ mensaje: "Error al eliminar orden", error: e.message });
    }
  }

  // Método para establecer el estado de una orden.
  static async setestado(req, res) {
    const { id } = req.params;
    const { estado } = req.body;

    try {
      // Actualiza el estado de la orden en la base de datos.
      const result = await sql`
        UPDATE ORDENES SET estado = ${estado} WHERE idorden = ${id}
      `;

      res.status(203).send({ mensaje: "Estado actualizado correctamente!" });
    } catch (err) {
      // Manejo de errores en caso de fallo al actualizar el estado.
      res.status(500).send({
        mensaje: "Error al setear el estado de la orden",
        error: err.message,
      });
    }
  }

  // Método para obtener el ID de la última orden creada.
  static async getultimaorden(req, res) {
    try {
      // Consulta SQL para obtener el ID de la última orden.
      const result = await sql`
        SELECT idorden FROM ORDENES ORDER BY idorden DESC LIMIT 1;
      `;

      res.status(203).send(result);
    } catch (err) {
      // Manejo de errores en caso de fallo al obtener la última orden.
      res.status(500).send({
        mensaje: "Error al obtener el numero de la ultima orden",
        error: err.message,
      });
    }
  }
}

// Exporta el controlador para su uso en otras partes de la aplicación.
export default OrdenController;
