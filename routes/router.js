import express from 'express'
import { ContactFormValidator, CreateUserValidator, SignInValidator, EditProfileValidator } from '../Middlewares/ValidatorMiddleware.js';
import verificarToken from '../Middlewares/ValidatorMiddleware.js';
import AuthController from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', CreateUserValidator, AuthController.registrarUsuario);
router.post('/signin', SignInValidator, AuthController.loginUsuario);
router.post('/signout', AuthController.signOutUsuario);
router.post('/registrarformulario', ContactFormValidator, AuthController.registrarformulario);
router.post('/comprar', AuthController.realizarcompra);
router.post('/restablecer', AuthController.ResetPassword);
router.post('/verificar', AuthController.captcha);
router.post('/registrarevento', AuthController.registrarEvento);
router.get('/obtenereventos', AuthController.obtenerEventos);
router.delete('/evento/:id', AuthController.eliminarEvento);
router.put('/evento/:id', AuthController.actualizarEvento);
router.put('/editarperfil', verificarToken, EditProfileValidator, AuthController.editarPerfil);
router.get('/datosusuario', verificarToken, AuthController.obtenerDatosUsuario);
router.delete('/eliminar', verificarToken, AuthController.eliminarUsuarioAutenticado);
//router.post('/agregarproducto');
//router.post('/login', (req, res) => authController.login(req, res));

export default router;