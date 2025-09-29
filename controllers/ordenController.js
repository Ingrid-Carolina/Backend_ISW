/**
 * ordenController.js
 *
 * Controlador para la gestión de órdenes y sus detalles en la tienda.
 * Expone endpoints para consultar órdenes (y sus productos), crear nuevas órdenes,
 * actualizar el estado, eliminar y utilidades relacionadas (última orden, etc.).
 *
 * Funcionalidades principales:
 * - getProductosbyID: Lista los productos de una orden con totales calculados.
 * - getOrdenes / getOrdenById: Consulta de órdenes (resumen y por ID con total).
 * - addOrden: Crea una orden a partir del carrito e inserta su detalle.
 * - actualizarOrden / setestado: Cambia el estado de una orden existente.
 * - eliminarOrden: Elimina la orden por ID.
 * - getultimaorden: Obtiene el identificador más reciente de orden.
 *
 * Notas:
 * - Integra PostgreSQL para persistencia.
 * - Envía notificación por correo al cliente tras crear la orden.
 * - Valida entradas mínimas del carrito antes de persistir.
 */

// controllers/ordenController.js
import axios from "axios";
import auth from "../config/firebase.js";
import { sql } from "../config/postgre.js";
import enviarCorreoConfirmacion from "../utils/enviarcorreo.js";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import admin from "../config/firebase-admin.js";
import enviarCorreoCompra from "../utils/compracorreo.js";

class OrdenController {
  // Obtener todas las órdenes (con total calculado)
  static async getProductosbyID(req, res) { //Agarro la descripcion de los productos por cada idorden dinamicamente en el frontend
    const { idorden } = req.params;
    try {
      const productos_comprados = await sql`
      SELECT 
        p.nombre_producto,
        d.cantidad,
        d.precio_unitario,
        d.cantidad * d.precio_unitario AS total
        d.detalle_camisa
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
      res.status(200).json(productos_comprados);
    } catch (e) {
      console.error(`Error al obtener productos: ${e}`);
      res.status(500).json({ error: `Error al obtener productos: ${e}` });
    }
  }

  static async getOrdenes(req, res) { //agarro el dato general de la orden(Ordenes+Usuario)
    try {
      const ordenes = await sql`
      SELECT o.idorden, o.fecha, o.estado, u.nombre AS nombre_usuario, u.email
      FROM ordenes o
      JOIN usuarios u ON o.usuario_id = u.id;
    `;
      res.status(200).json({ ordenes });
    } catch (error) {
      console.error("Error al obtener ordenes:", error.message);
      res.status(500).json({ error: "Error al obtener ordenes" });
    }
  }

  // Obtener una orden por ID (con total calculado)
  static async getOrdenById(req, res) {
    try {
      const { id } = req.params;
      const [orden] = await sql`
        SELECT o.idorden, o.usuario_id, o.fecha, o.estado,
               COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS total
        FROM ordenes o
        LEFT JOIN detalleorden d ON o.idorden = d.orden_id
        WHERE o.idorden = ${id}
        GROUP BY o.idorden
      `;

      if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

      res.status(200).json(orden);
    } catch (e) {
      console.error(`Error al obtener orden: ${e}`);
      res.status(500).json({ error: `Error al obtener orden: ${e}` });
    }
  }

  // Crear orden (solo guarda usuario, fecha y estado inicial)
  static async addOrden(req, res) {
    const { uid, cartItems } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ mensaje: "No hay productos en la orden" });
    }

    try {
      const result = await sql`
      INSERT INTO ordenes (usuario_id)
      VALUES (${uid})
      RETURNING idorden
    `;

      const orden_id = result[0].idorden; // Acceso corregido la ultima orden agregada

      // Insertar cada producto individualmente en la tabla DETALLEORDENR
      for (const item of cartItems) {
        await sql`
        INSERT INTO DETALLEORDEN (orden_id, producto_id, cantidad, precio_unitario, detalle_camisa)
        VALUES (${orden_id}, ${item.idproducto}, ${item.cantidad}, ${item.precio_unitario}, ${item.detalle_camisa})
      `;
      }

      // Obtener datos del usuario (email / nombre) para notificación al cliente
      const userRows = await sql`
        SELECT nombre, email
        FROM usuarios
        WHERE id = ${uid}
        LIMIT 1
      `;
      const cliente = userRows[0] || {};
      const nombreCliente = cliente.nombre || null;
      const emailCliente = cliente.email || null;

      // Enviar correos (admin + cliente)
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

      return res
        .status(201)
        .json({ mensaje: "Orden creada exitosamente", orden_id });
    } catch (error) {
      console.error("Error al crear la orden:", error.message || error.stack);
      return res.status(500).json({ mensaje: error.message });
    }
  }

  // Actualizar estado de la orden, solo el admin lo puede realizar
  static async actualizarOrden(req, res) {
    const { id } = req.params;
    const { estado } = req.body;

    try {
      const result = await sql`
        UPDATE ordenes
        SET estado = ${estado}
        WHERE idorden = ${id}
        RETURNING *
      `;

      if (result.length === 0)
        return res.status(404).json({ mensaje: "Orden no encontrada" });

      res.status(200).json({
        mensaje: "Orden actualizada correctamente",
        orden: result[0],
      });
    } catch (e) {
      console.error(`Error al actualizar orden: ${e}`);
      res.status(500).json({ error: `Error al actualizar orden: ${e}` });
    }
  }

  // Eliminar orden
  static async eliminarOrden(req, res) {
    const { id } = req.params;
    try {
      await sql`DELETE FROM ordenes WHERE idorden = ${id}`;
      res.status(200).json({ mensaje: "Orden eliminada correctamente!" });
    } catch (e) {
      console.error(`Error al eliminar orden: ${e}`);
      res
        .status(500)
        .json({ mensaje: "Error al eliminar orden", error: e.message });
    }
  }

  static async setestado(req, res) {
    const { id } = req.params;
    const { estado } = req.body;

    try {
      const result = await sql`
        UPDATE ORDENES SET estado = ${estado} WHERE idorden = ${id}
      `;

      res.status(203).send({ mensaje: "Estado actualizado correctamente!" });
    } catch (err) {
      res.status(500).send({
        mensaje: "Error al setear el estado de la orden",
        error: err.message,
      });
    }
  }

  static async getultimaorden(req, res) {
    try {
      const result = await sql`
        SELECT idorden FROM ORDENES ORDER BY idorden DESC LIMIT 1;
      `;

      res.status(203).send(result);
    } catch (err) {
      res.status(500).send({
        mensaje: "Error al obtener el numero de la ultima orden",
        error: err.message,
      });
    }
  }
}

export default OrdenController;
