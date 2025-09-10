import { sql } from "../config/postgre.js";

class ProductosDonacionController {
    /**
     * Obtener lista de productos de donación
     */
    static async getProductos(req, res) {
        try {
            const productos = await sql`
                SELECT * FROM productos_donacion 
                ORDER BY id
            `;
            res.status(200).json({ productos });
        } catch (e) {
            console.error(`Error al obtener productos: ${e}`);
            res.status(500).json({ error: `Error al obtener productos: ${e}` });
        }
    }

    /**
     * Agregar un nuevo producto
     */
    static async addProducto(req, res) {
        const { nombre, descripcion, imagen, estado = true } = req.body;
        try {
            const [nuevoProducto] = await sql`
                INSERT INTO productos_donacion (nombre, descripcion, imagen, estado)
                VALUES (${nombre}, ${descripcion}, ${imagen}, ${estado})
                RETURNING *
            `;
            res.status(201).json({ producto: nuevoProducto });
        } catch (e) {
            console.error(`Error al agregar producto: ${e}`);
            res.status(500).json({ error: `Error al agregar producto: ${e}` });
        }
    }

    /**
     * Modificar un producto existente
     */
    static async updateProducto(req, res) {
        const { id } = req.params;
        const { nombre, descripcion, imagen, estado } = req.body;
        try {
            const [productoActualizado] = await sql`
                UPDATE productos_donacion
                SET nombre = ${nombre},
                    descripcion = ${descripcion},
                    imagen = ${imagen},
                    estado = ${estado}
                WHERE id = ${id}
                RETURNING *
            `;
            if (!productoActualizado) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            res.status(200).json({ producto: productoActualizado });
        } catch (e) {
            console.error(`Error al modificar producto: ${e}`);
            res.status(500).json({ error: `Error al modificar producto: ${e}` });
        }
    }

    /**
     * Eliminar un producto
     */
    static async deleteProducto(req, res) {
        const { id } = req.params;
        try {
            const [productoEliminado] = await sql`
                DELETE FROM productos_donacion
                WHERE id = ${id}
                RETURNING *
            `;
            if (!productoEliminado) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            res.status(200).json({ producto: productoEliminado });
        } catch (e) {
            console.error(`Error al eliminar producto: ${e}`);
            res.status(500).json({ error: `Error al eliminar producto: ${e}` });
        }
    }

     static async registrardonacion(req, res) {
        const { nombre, telefono, correo, dia,horario, descripcion } = req.body;

        
        try {

            const donaciondata = {
          nombre: nombre,
          telefono: telefono,
          correo: correo,
          dia: dia,
          horario: horario,
          descripcion:descripcion

        };
            await sql`
                INSERT INTO donaciones ${sql(donaciondata)}
            `;
            res.status(201).send({ mensaje: 'Donacion ingresada correctamente!' });
        } catch (e) {
            
            res.status(500).send({ error: `Error al agregar donacion: ${e}` });
        }
    }


}

export default ProductosDonacionController;