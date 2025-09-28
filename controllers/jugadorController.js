// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from "../config/postgre.js";

// Controlador para manejar las operaciones relacionadas con los jugadores.
class JugadorController {
    /**
     * Método para obtener la lista de jugadores para estadísticas.
     */
    static async getJugadores(req, res) {
        try {
            // Consulta SQL para obtener todos los jugadores.
            const jugadores = await sql `SELECT * FROM jugadores`;

            // Devuelve los jugadores en formato JSON con el código de estado 200.
            res.status(200).json({ jugadores });
        } catch (e) {
            // Manejo de errores en caso de fallo en la consulta SQL.
            console.error(`Error al obtener jugadores: ${e}`);
            res.status(500).json({
                error: `Error al obtener jugadores: ${e}`
            });
        }
    }
}

// Exporta el controlador para su uso en otras partes de la aplicación.
export default JugadorController;