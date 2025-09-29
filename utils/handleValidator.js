/**
 * handleValidator.js — Resumen de validaciones (express-validator)
 *
 * Middleware central para procesar el resultado de `express-validator`.
 * Si existen errores de validación:
 *   - Responde con HTTP 403.
 *   - Devuelve un objeto `{ errors: [...] }` con el detalle.
 * Si no hay errores:
 *   - Llama a `next()` y permite continuar con la petición.
 *
 * Uso:
 * - Incluir al final de cada arreglo de validadores como:
 *   (req, res, next) => validateResult(req, res, next)
 *
 * Notas:
 * - Mantiene la respuesta consistente y evita duplicar lógica de manejo de errores.
 */
import { validationResult } from "express-validator";

const validateResult = (req, res, next) => {
    try {
        validationResult(req).throw(); //throws algun error
        return next(); //procede con el request
    } catch (err) {
        res.status(403);
        res.send({ errors: err.array() }); //imprime los errores en el request antes de realizar el promise
    }
};

export default validateResult;
