// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from "../config/postgre.js";

// Controlador para manejar las operaciones relacionadas con las noticias.
class NoticiaController {

    /**
     * Método para obtener todas las noticias.
     * @async
     * @param {*} req - solicitud HTTP.
     * @param {*} res - respuesta HTTP.
     * @returns {Promise<void>} Devuelve la respuesta HTTP con la lista de noticias en formato JSON.
     */
    static async getNoticias(req, res) {
        try {
            // Consulta SQL para obtener todas las noticias ordenadas por fecha de publicación.
            const noticias = await sql` SELECT * FROM noticias ORDER BY fecha_publicacion`;

            // Devuelve las noticias en formato JSON con el código de estado 200.
            res.status(200).json({ noticias });

        } catch (e) {
            // Manejo de errores en caso de fallo en la consulta SQL.
            console.error(`Error al obtener noticias: ${e}`);
            res.status(500).json({
                error: `Error al obtener noticias: ${e}`
            });
        }
    }

    /**
     * Método para obtener una noticia específica por su ID.
     * @async
     * @param {*} req - solicitud HTTP.
     * @param {*} res - respuesta HTTP.
     * @returns {Promise<void>} Devuelve la respuesta HTTP con la noticia encontrada o un error si no existe.
     */
    static async getNoticiaById(req, res) {
        try {
            const { id } = req.params; // Obtiene el ID de los parámetros de la solicitud.

            // Consulta SQL para obtener la noticia por ID.
            const [noticia] = await sql`
                SELECT * FROM noticias WHERE id = ${id}
            `;

            if (!noticia) {
                // Manejo de caso donde no se encuentra la noticia.
                return res.status(404).json({ error: "Noticia no encontrada" });
            }

            // Devuelve la noticia encontrada en formato JSON.
            res.status(200).json(noticia);
        } catch (e) {
            // Manejo de errores en caso de fallo en la consulta SQL.
            console.error(`Error al obtener noticia: ${e}`);
            res.status(500).json({
                error: `Error al obtener noticia: ${e}`
            });
        }
    }


    /**
     * Crea la noticia
     * @async 
     * @param {*} req - solicitud HTTP 
     * @param {*} res - respuesta HTTP
     * @returns {Promise<void>} Devuelve la noticia creada en JSON
     */
    static async addNoticia(req, res) {
        // El autor id es el id del usuario que escribe la noticia
        const { autor_id = null} = req.params;
        const { titulo, contenido, imagen_url, fecha } = req.body;

        try {

            // valida titulo y contenido
            if (!titulo || !contenido) return res.status(400).json({ mensaje: 'Titulo y contenido son obligatorios!' });

            // valida fecha
            const fecha_publicacion = new Date(fecha);
            if (isNaN(fecha_publicacion.getTime())) return res.status(400).json({ mensaje: 'Fecha invalida!' });

            // Consulta SQL para insertar una nueva noticia.
            const result = await sql`INSERT INTO noticias (titulo, contenido, imagen_url, fecha_publicacion, autor_id) 
                                        VALUES (${titulo}, ${contenido}, ${imagen_url}, ${fecha_publicacion}, ${autor_id})
                                        RETURNING *
                                        `;

            if (result.length === 0) return res.status(500).json({ mensaje: 'No se pudo crear la noticia' });

            // Devuelve la noticia creada en formato JSON.
            res.status(200).json({
                mensaje: 'Noticia creada correctamente',
                noticia: result[0]
            })

        } catch (e) {
            // Manejo de errores en caso de fallo en la inserción de la noticia.
            console.error(`Error al agregar noticia: ${e}`);
            res.status(500).json({ error: `Error al agregar la noticia: ${e}` });
        }

    }

    /**
     * Actualiza la noticia
     * @async 
     * @param {*} req - solicitud HTTP  
     * @param {*} res - respuesta HTTP
     * @returns {Promise<void>} Deveulve la noticia modificada en JSON
     */
    static async actualizarNoticia(req, res) {

        //empiezan en null para evitar undefined
        const { id = null, autor_id = null } = req.params
        const { titulo, contenido, imagen_url, fecha } = req.body;

        try {

            // valida titulo y contenido
            if (!titulo || !contenido) return res.status(400).json({ mensaje: 'Titulo y contenido son obligatorios!' });

            // valida fecha
            const fecha_publicacion = new Date(fecha);
            if (isNaN(fecha_publicacion.getTime())) return res.status(400).json({ mensaje: 'Fecha invalida!' });

            // Consulta SQL para actualizar una noticia existente.
            const result = await sql`
                UPDATE noticias
                SET titulo = ${titulo},
                    contenido = ${contenido},
                    imagen_url = ${imagen_url},
                    fecha_publicacion = ${fecha_publicacion},
                    autor_id = ${autor_id}
                WHERE id = ${id}
                RETURNING *
            `;

            if (result.length === 0) return res.status(404).json({ mensaje: 'Noticia no encontrada' });

            // Devuelve la noticia actualizada en formato JSON.
            res.status(200).json({
                mensaje: 'Noticia actualizada correctamente',
                noticia: result[0]
            })
        } catch (e) {
            // Manejo de errores en caso de fallo en la actualización de la noticia.
            console.error(`Error al actualizar la noticia: ${e}`);
            res.status(500).json({ error: `Error al actualizar la noticia: ${e}` });
        }
    }

    /**
     * Elimina la noticia
     * @param {*} req - solicitud HTTP
     * @param {*} res - respuesta HTTP
     * @returns {Promise<void>} Devuelve la respuesta HTTP con un mensaje confirmando si se elimino la noticia 
     */
    static async eliminarNoticia(req, res) {
        const { id } = req.params;

        try {
            // Consulta SQL para eliminar una noticia por ID.
            const result = await sql`DELETE FROM noticias WHERE id = ${id}`;
            res.status(200).json({mensaje: 'Noticia eliminada correctamente!'});
        } catch (e) {
            // Manejo de errores en caso de fallo en la eliminación de la noticia.
            console.error("Error al eliminar noticia:", e);
            res.status(500).send({ mensaje: "Error al eliminar la noticia", error: e.message });
        }
    }
}

// Exporta el controlador para su uso en otras partes de la aplicación.
export default NoticiaController;