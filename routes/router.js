import express from "express";
import {
  ContactFormValidator,
  CreateUserValidator,
  SignInValidator,
} from "../Middlewares/ValidatorMiddleware.js";
import AuthController from "../controllers/authController.js";

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
router.get("/loadEvents", AuthController.getEventos);
router.get("/loadEventById", AuthController.getEventoById);
router.post("/crearEvento", AuthController.crearEvento);
router.post("/actualizarEvento", AuthController.actualizarEvento);
router.post("/eliminarEvento", AuthController.eliminarEvento);
//router.post('/agregarproducto');
//router.post('/login', (req, res) => authController.login(req, res));

export default router;
