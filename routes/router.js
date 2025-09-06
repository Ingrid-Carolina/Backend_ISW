import express from 'express'
import { ContactFormValidator, CreateUserValidator, SignInValidator, EditProfileValidator } from '../Middlewares/ValidatorMiddleware.js';
import verificarToken from '../Middlewares/ValidatorMiddleware.js';
import AuthController from '../controllers/authController.js';
import { requireAuth, requireRole } from '../Middlewares/authCookieMiddleware.js';
import NoticiaController from '../controllers/noticiaController.js';
import eventController from '../controllers/eventController.js';
import JugadorController from '../controllers/jugadorController.js';
import FileUploadController from '../controllers/fileUploadController.js';
import uploadImages from '../Middlewares/multer.js';


const router = express.Router();

router.use((req, _res, next) => {
  console.log('Cookie token?', !!req.cookies?.token, 'Origin:', req.headers.origin);
  next();
});


router.post('/signup', CreateUserValidator, AuthController.registrarUsuario);
router.post('/signin', SignInValidator, AuthController.loginUsuario);
router.post('/signout', AuthController.signOutUsuario);
router.post('/registrarformulario', ContactFormValidator, AuthController.registrarformulario);
router.post('/restablecer', AuthController.ResetPassword);
router.post('/verificar', AuthController.captcha);
router.get('/datosusuario', verificarToken, AuthController.obtenerDatosUsuario);
router.delete('/eliminar', verificarToken, AuthController.eliminarUsuarioAutenticado);
//router.post('/agregarproducto');
//router.post('/login', (req, res) => authController.login(req, res));

// Acciones que requieren sesión (usuario logueado)
router.post('/comprar', requireAuth, AuthController.realizarcompra);
router.put('/editarperfil', requireAuth, EditProfileValidator, AuthController.editarPerfil);
router.get('/obtenerperfil', requireAuth, AuthController.obtenerPerfil);

//eventos
router.get('/obtenereventos',eventController.obtenerEventos);
router.post('/registrarevento', requireAuth, requireRole('admin', 'admin-calendario'), eventController.registrarEvento);
router.put('/evento/:id', requireAuth, requireRole('admin', 'admin-calendario'), eventController.actualizarEvento);
router.delete('/evento/:id', requireAuth, requireRole('admin', 'admin-calendario'), eventController.eliminarEvento);

// noticias
router.get('/noticias', NoticiaController.getNoticias); 
router.post('/agregarnoticia/:autor_id', requireAuth, requireRole('admin'), NoticiaController.addNoticia);
router.put('/modificarnoticia/:id/:autor_id' ,requireAuth, requireRole('admin'), NoticiaController.actualizarNoticia);
router.delete('/eliminarnoticia/:id', requireAuth, requireRole('admin'), NoticiaController.eliminarNoticia);
router.get('/noticias/:id', NoticiaController.getNoticiaById); 

//testimonios
router.get('/obtenertestimonios',AuthController.obtenerTestimonios);
router.post('/registrartestimonio',requireAuth, requireRole('admin'), AuthController.registrarTestimonio);
router.put('/testimonio/:id',requireAuth, requireRole('admin'), AuthController.actualizarTestimonio);
router.delete('/testimonio/:id',requireAuth, requireRole('admin'), AuthController.eliminarTestimonios);

//jugadores
router.get('/jugadores', JugadorController.getJugadores);


//subir imagenes
router.post('/upload', requireAuth, requireRole('admin'), uploadImages.single('file'), FileUploadController.uploadFile);

//router.post('/health', SomeController.someFunction);


export default router;