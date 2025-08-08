import express from 'express'
import { ContactFormValidator, CreateUserValidator, SignInValidator } from '../Middlewares/ValidatorMiddleware.js';
import AuthController from '../controllers/authController.js';
import { requireAuth, requireRole } from '../Middlewares/authCookieMiddleware.js';

const router = express.Router();

router.post('/signup', CreateUserValidator, AuthController.registrarUsuario);
router.post('/signin', SignInValidator, AuthController.loginUsuario);
router.post('/signout', AuthController.signOutUsuario);
router.post('/registrarformulario', ContactFormValidator, AuthController.registrarformulario);
router.post('/comprar', AuthController.realizarcompra);
router.post('/restablecer', AuthController.ResetPassword);
router.post('/verificar', AuthController.captcha);
router.get('/obtenereventos', AuthController.obtenerEventos);
//router.post('/agregarproducto');
//router.post('/login', (req, res) => authController.login(req, res));
// Acciones que requieren sesión (usuario logueado)
// Acciones de administración de eventos

router.post('/comprar', requireAuth, AuthController.realizarcompra);
router.post('/registrarevento', requireAuth, requireRole('admin', 'admin-calendario'), AuthController.registrarEvento);
router.put('/evento/:id',      requireAuth, requireRole('admin', 'admin-calendario'), AuthController.actualizarEvento);
router.delete('/evento/:id',   requireAuth, requireRole('admin', 'admin-calendario'), AuthController.eliminarEvento);


export default router;