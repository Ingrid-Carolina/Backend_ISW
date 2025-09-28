import { sql } from "../config/postgre.js";

class JugadorController {
    /**
     * 
     * Obtener lisa de jugadores para estadisticas
     */
    static async getJugadores(req, res) {
        try{
            const jugadores = await sql `SELECT * FROM jugadores`;

            res.status(200).json({jugadores});
        } catch (e) {
            console.error(`Error al obtener jugadores: ${e}`);
            res.status(500).json({
                error: `Error al obtener jugadores: ${e}`
            });
        }
    }
}

export default JugadorController;