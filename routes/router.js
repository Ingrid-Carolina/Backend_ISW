import express from "express";
import {
  ContactFormValidator,
  CreateUserValidator,
  SignInValidator,
} from "../Middlewares/ValidatorMiddleware.js";
import AuthController from "../controllers/authController.js";
import DatabaseController from "../controllers/databaseController.js";

const router = express.Router();

router.post("/signup", CreateUserValidator, AuthController.registrarUsuario);
router.post("/signin", SignInValidator, AuthController.loginUsuario);
router.post("/signout", AuthController.signOutUsuario);
router.post(
  "/registrarformulario",
  ContactFormValidator,
  AuthController.registrarformulario
);
router.post("/comprar", AuthController.realizarcompra);
router.post("/restablecer", AuthController.ResetPassword);
router.post("/verificar", AuthController.captcha);
router.get("/loadEvents", DatabaseController.getEventos);
router.get("/loadEventById", DatabaseController.getEventoById);
router.post("/crearEvento", DatabaseController.crearEvento);
router.post("/actualizarEvento", DatabaseController.actualizarEvento);
router.post("/eliminarEvento", DatabaseController.eliminarEvento);
//router.post('/agregarproducto');
//router.post('/login', (req, res) => authController.login(req, res));

export default router;
