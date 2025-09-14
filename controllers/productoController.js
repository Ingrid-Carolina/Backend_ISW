import { sql } from "../config/postgre.js";

class ProductoController {
  // Obtener todos los productos
  static async getProductos(req, res) {
    try {
      const productos = await sql`
        SELECT * FROM productos ORDER BY idproducto
      `;
      res.status(200).json({ productos });
    } catch (e) {
      console.error(`Error al obtener productos: ${e}`);
      res.status(500).json({ error: `Error al obtener productos: ${e}` });
    }
  }

  // Obtener producto por ID
  static async getProductoById(req, res) {
    try {
      const { id } = req.params;
      const [producto] = await sql`
        SELECT * FROM productos WHERE idproducto = ${id}
      `;
      if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
      res.status(200).json(producto);
    } catch (e) {
      console.error(`Error al obtener producto: ${e}`);
      res.status(500).json({ error: `Error al obtener producto: ${e}` });
    }
  }

  // Agregar producto
  static async addProducto(req, res) {
    const { nombre_producto, descripcion, precio_unitario, cantidad, talla, estado } = req.body;
    try {
      if (!nombre_producto || !precio_unitario) {
        return res.status(400).json({ mensaje: "Nombre y precio son obligatorios!" });
      }

      const result = await sql`
        INSERT INTO productos (nombre_producto, descripcion, precio_unitario, cantidad, talla, estado)
        VALUES (${nombre_producto}, ${descripcion}, ${precio_unitario}, ${cantidad}, ${talla}, ${estado || "Pendiente"})
        RETURNING *
      `;

      res.status(200).json({
        mensaje: "Producto creado correctamente",
        producto: result[0]
      });
    } catch (e) {
      console.error(`Error al agregar producto: ${e}`);
      res.status(500).json({ error: `Error al agregar producto: ${e}` });
    }
  }

  // Actualizar producto
  static async actualizarProducto(req, res) {
    const { id } = req.params;
    const { nombre_producto, descripcion, precio_unitario, cantidad, talla, estado } = req.body;

    try {
      const result = await sql`
        UPDATE productos
        SET nombre_producto = ${nombre_producto},
            descripcion = ${descripcion},
            precio_unitario = ${precio_unitario},
            cantidad = ${cantidad},
            talla = ${talla},
            estado = ${estado}
        WHERE idproducto = ${id}
        RETURNING *
      `;

      if (result.length === 0) return res.status(404).json({ mensaje: "Producto no encontrado" });

      res.status(200).json({
        mensaje: "Producto actualizado correctamente",
        producto: result[0]
      });
    } catch (e) {
      console.error(`Error al actualizar producto: ${e}`);
      res.status(500).json({ error: `Error al actualizar producto: ${e}` });
    }
  }

  // Eliminar producto
  static async eliminarProducto(req, res) {
    const { id } = req.params;
    try {
      const result = await sql`DELETE FROM productos WHERE idproducto = ${id}`;
      res.status(200).json({ mensaje: "Producto eliminado correctamente!" });
    } catch (e) {
      console.error(`Error al eliminar producto: ${e}`);
      res.status(500).json({ mensaje: "Error al eliminar producto", error: e.message });
    }
  }
}

export default ProductoController;
