/**
 * productoController.js
 *
 * Controlador CRUD para productos de la tienda, con soporte de subida de imágenes
 * a Supabase Storage. Permite listar, obtener por ID, crear, actualizar y eliminar
 * productos, gestionando además la URL de imagen asociada.
 *
 * Funcionalidades principales:
 * - getProductos / getProductoById: Lectura de productos.
 * - addProducto: Alta de producto (JSON o multipart/form-data) con subida opcional a Supabase.
 * - actualizarProducto: Actualización parcial, sustituyendo imagen y limpiando la anterior si aplica.
 * - eliminarProducto: Borra el registro y elimina la imagen del bucket si existe.
 *
 * Notas:
 * - Incluye helpers para normalizar valores (nullables y números).
 * - Maneja validaciones mínimas (nombre y precio) y errores de BD.
 */

// controllers/productoController.js
import { sql } from "../config/postgre.js";
import { uploadToSupabase, deleteFromSupabaseByUrl } from "./_uploadHelpers.js";

// Helpers para normalizar valores y evitar "undefined"
const toNullable = (v) =>
  v === undefined || v === null || v === "" || v === "undefined" ? null : v;

const toNumberOrNull = (v) => {
  if (v === undefined || v === null || v === "" || v === "undefined") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export default class ProductoController {
  // LISTAR
  static async getProductos(req, res) {
    try {
      const productos = await sql`
        SELECT idproducto, nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url
        FROM productos
        ORDER BY idproducto
      `;
      res.status(200).json({ productos });
    } catch (e) {
      console.error(`Error al obtener productos:`, e);
      res.status(500).json({ error: `Error al obtener productos: ${e.message}` });
    }
  }

  // OBTENER POR ID
  static async getProductoById(req, res) {
    try {
      const { id } = req.params;
      const [producto] = await sql`
        SELECT idproducto, nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url
        FROM productos
        WHERE idproducto = ${id}
      `;
      if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
      res.status(200).json(producto);
    } catch (e) {
      console.error(`Error al obtener producto:`, e);
      res.status(500).json({ error: `Error al obtener producto: ${e.message}` });
    }
  }

  // CREAR (acepta multipart/form-data y JSON)
  static async addProducto(req, res) {
    try {
      const uid = req.user?.uid; // requireAuth debe llenar esto

      // Leer valores de forma segura (JSON o multipart)
      const b = req.body || {};
      // Por si llega con espacio accidental en la clave:
      const nombreRaw =
        b.nombre_producto ??
        b["nombre_producto "] ??
        b["nombre_producto"] ??
        null;

      const nombre_producto = toNullable(
        typeof nombreRaw === "string" ? nombreRaw.trim() : nombreRaw
      );
      const descripcion     = toNullable(b.descripcion);
      const precio_unitario = toNumberOrNull(b.precio_unitario);
      const cantidad        = toNumberOrNull(b.cantidad);
      const talla           = toNullable(b.talla);
      const estado          = toNullable(b.estado) ?? "Pendiente";

      // URL pegada directamente (cuando no se sube archivo)
      let image_url = toNullable(b.image_url);

      // Si vino archivo, súbelo a Supabase y usa esa URL
      if (req.file && uid) {
        const up = await uploadToSupabase({ file: req.file, uid });
        image_url = up.url; // <- URL pública
      }

      // Validaciones mínimas
      if (!nombre_producto) {
        return res.status(400).json({ mensaje: "Nombre y precio son obligatorios!" });
      }
      if (precio_unitario === null || precio_unitario < 0) {
        return res.status(400).json({ mensaje: "Precio unitario inválido" });
      }

      const result = await sql`
        INSERT INTO productos (nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url)
        VALUES (
          ${nombre_producto},
          ${descripcion},
          ${precio_unitario},
          ${cantidad},
          ${talla},
          ${estado},
          ${image_url}
        )
        RETURNING idproducto, nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url
      `;

      return res.status(201).json({
        mensaje: "Producto creado correctamente",
        producto: result[0],
      });
    } catch (e) {
      console.error(`Error al agregar producto:`, e);
      return res.status(500).json({ error: `Error al agregar producto: ${e.message}` });
    }
  }

  // ACTUALIZAR (acepta multipart/form-data y JSON)
  static async actualizarProducto(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    try {
      const uid = req.user?.uid;
      const b = req.body || {};

      // Leer valores (permitiendo parches parciales)
      const nombre_producto = toNullable(
        typeof b.nombre_producto === "string" ? b.nombre_producto.trim() : b.nombre_producto
      );
      const descripcion     = toNullable(b.descripcion);
      const precio_unitario = toNumberOrNull(b.precio_unitario);
      const cantidad        = toNumberOrNull(b.cantidad);
      const talla           = toNullable(b.talla);
      const estado          = toNullable(b.estado);
      let   image_url       = toNullable(b.image_url);

      // Traer la URL actual para saber si debemos borrar la anterior
      const prevRows = await sql`
        SELECT image_url
        FROM productos
        WHERE idproducto = ${id}
      `;
      if (prevRows.length === 0) {
        return res.status(404).json({ mensaje: "Producto no encontrado" });
      }
      const prevImageUrl = prevRows[0]?.image_url || null;

      // Si vino archivo, sube y reemplaza URL
      if (req.file && uid) {
        const up = await uploadToSupabase({ file: req.file, uid });
        image_url = up.url;

        // Borra la imagen anterior en Supabase si existía y fue reemplazada
        if (prevImageUrl && prevImageUrl !== image_url) {
          try { await deleteFromSupabaseByUrl(prevImageUrl); } catch { /* noop */ }
        }
      }

      const result = await sql`
        UPDATE productos
           SET nombre_producto = COALESCE(${nombre_producto}, nombre_producto),
               descripcion     = COALESCE(${descripcion}, descripcion),
               precio_unitario = COALESCE(${precio_unitario}, precio_unitario),
               cantidad        = COALESCE(${cantidad}, cantidad),
               talla           = COALESCE(${talla}, talla),
               estado          = COALESCE(${estado}, estado),
               image_url       = COALESCE(${image_url}, image_url)
         WHERE idproducto = ${id}
         RETURNING idproducto, nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url
      `;

      return res.status(200).json({
        mensaje: "Producto actualizado correctamente",
        producto: result[0],
      });
    } catch (e) {
      console.error(`Error al actualizar producto:`, e);
      return res.status(500).json({ error: `Error al actualizar producto: ${e.message}` });
    }
  }

  // ELIMINAR (borra imagen del bucket si existe)
  static async eliminarProducto(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }
    try {
      // Recupera URL para eliminar del bucket
      const rows = await sql`
        SELECT image_url
        FROM productos
        WHERE idproducto = ${id}
      `;
      if (rows.length === 0) {
        return res.status(404).json({ mensaje: "Producto no encontrado" });
      }
      const imgUrl = rows[0]?.image_url || null;

      await sql`DELETE FROM productos WHERE idproducto = ${id}`;

      if (imgUrl) {
        try { await deleteFromSupabaseByUrl(imgUrl); } catch { /* noop */ }
      }

      return res.status(200).json({ mensaje: "Producto eliminado correctamente!" });
    } catch (e) {
      console.error(`Error al eliminar producto:`, e);
      return res.status(500).json({ mensaje: "Error al eliminar producto", error: e.message });
    }
  }
}
