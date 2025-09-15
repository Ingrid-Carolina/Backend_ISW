import express from 'express'
import { ContactFormValidator, CreateUserValidator, SignInValidator, EditProfileValidator, DonacionesFormValidator } from '../Middlewares/ValidatorMiddleware.js';
import verificarToken from '../Middlewares/ValidatorMiddleware.js';
import AuthController from '../controllers/authController.js';
import { requireAuth, requireRole } from '../Middlewares/authCookieMiddleware.js';
import NoticiaController from '../controllers/noticiaController.js';
import eventController from '../controllers/eventController.js';
import JugadorController from '../controllers/jugadorController.js';
import FileUploadController from '../controllers/fileUploadController.js';
import uploadImages from '../Middlewares/multer.js';
import ProductosDonacionController from '../controllers/productos_donacionController.js';
import contactoController from '../controllers/contactoController.js';
import ProductoController from '../controllers/productoController.js';
import HomeImageController from '../controllers/HomeImageController.js';
import OrdenController from '../controllers/ordenController.js';
import DetalleOrdenController from '../controllers/detalleOrdenController.js';
import AliadosImageController from '../controllers/TestimoniosImageController.js';
import TestimoniosImageController from '../controllers/TestimoniosImageController.js';

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
router.post('/registrarevento', requireAuth, requireRole('admin', 'admin-calendario'), uploadImages.single('file'), eventController.registrarEvento);
router.put('/evento/:id', requireAuth, requireRole('admin', 'admin-calendario'), uploadImages.single('file'), eventController.actualizarEvento);
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

//envivo
router.post('/registrarenvivo', requireAuth, requireRole('admin'), AuthController.registrarenvivo);
router.get('/obtenerenvivo',  AuthController.obtenerenvivo);
router.put('/video/:id', requireAuth, requireRole('admin'), AuthController.actualizarenvivo);

//NuestroEquipo
router.get('/junta-directiva', AuthController.obtenerJuntaDirectiva); // Sin autenticación para mostrar públicamente
router.post('/junta-directiva', requireAuth, requireRole('admin'), AuthController.agregarMiembro);
router.put('/junta-directiva/:id', requireAuth, requireRole('admin'), AuthController.editarMiembro);
router.delete('/junta-directiva/:id', requireAuth, requireRole('admin'), AuthController.eliminarMiembro); 

//jugadores
router.get('/jugadores', JugadorController.getJugadores);


//subir imagenes
router.post('/upload', requireAuth, requireRole('admin'), uploadImages.single('file'), FileUploadController.uploadFile);
router.put('/images', requireAuth, requireRole('admin'), HomeImageController.updateImage);
router.put('/aliadoimages', requireAuth, requireRole('admin'), AliadosImageController.updateImage);
router.put('/testimonioimages', requireAuth, requireRole('admin'), TestimoniosImageController.updateImage);

//router.post('/health', SomeController.someFunction);

/*
// productos donación
router.get('/productos', ProductosDonacionController.getProductos);
router.post('/productos', requireAuth, requireRole('admin'), ProductosDonacionController.addProducto);
router.put('/productos/:id', requireAuth, requireRole('admin'), ProductosDonacionController.updateProducto);
router.delete('/productos/:id', requireAuth, requireRole('admin'), ProductosDonacionController.deleteProducto);
router.post('/registrardonacion', DonacionesFormValidator, ProductosDonacionController.registrardonacion);
*/



// productos tienda
router.get("/tienda/productos", ProductoController.getProductos);
router.get("/tienda/productos/:id", ProductoController.getProductoById);
router.post("/tienda/agregarproducto", requireAuth, requireRole("admin"), ProductoController.addProducto);
router.put("/tienda/modificarproducto/:id", requireAuth, requireRole("admin"), ProductoController.actualizarProducto);
router.delete("/tienda/eliminarproducto/:id", requireAuth, requireRole("admin"), ProductoController.eliminarProducto);

// productos donación
router.get('/donaciones/productos', ProductosDonacionController.getProductos);
router.post('/donaciones/productos', requireAuth, requireRole('admin'), ProductosDonacionController.addProducto);
router.put('/donaciones/productos/:id', requireAuth, requireRole('admin'), ProductosDonacionController.updateProducto);
router.delete('/donaciones/productos/:id', requireAuth, requireRole('admin'), ProductosDonacionController.deleteProducto);
router.post('/donaciones/registrardonacion', DonacionesFormValidator, ProductosDonacionController.registrardonacion);


// ordenes
router.get('/ordenes', OrdenController.getOrdenes);
router.get('/ordenes/:id', OrdenController.getOrdenById);
router.post('/agregarorden', requireAuth, OrdenController.addOrden);
router.put('/modificarorden/:id', requireAuth, OrdenController.actualizarOrden);
router.delete('/eliminarorden/:id', requireAuth, requireRole('admin'), OrdenController.eliminarOrden);

// detalle orden
router.get('/detalles', DetalleOrdenController.getDetalles);
router.get('/detalles/:id', DetalleOrdenController.getDetalleById);
router.post('/agregardetalle', requireAuth, DetalleOrdenController.addDetalle);
router.put('/modificardetalle/:id', requireAuth, DetalleOrdenController.actualizarDetalle);
router.delete('/eliminardetalle/:id', requireAuth, requireRole('admin'), DetalleOrdenController.eliminarDetalle);



//contacto
router.get('/contacto', contactoController.obtener);
router.put('/contacto',requireAuth, requireRole('admin'), contactoController.actualizar);

//Promote Usuario

router.get('/obtenerusuarios', AuthController.obtenerusuarios);
router.put('/usuario/:id', AuthController.setrol);router.get('/images', HomeImageController.getImages);


export default router;