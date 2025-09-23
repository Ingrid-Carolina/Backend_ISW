# Backend ISW

Este repositorio contiene el backend de la plataforma de gestión y servicios para la organización de béisbol PILOTOS - FAH. El sistema integra autenticación de usuarios, gestión de productos, órdenes de compra, noticias, eventos, formularios de contacto, testimonios y más.

El proyecto está desarrollado en Node.js + Express, con PostgreSQL, Firebase, Supabase y despliegue automatizado mediante GitHub Actions.

# Tecnologías principales

● Node.js + Express – Framework backend.

● PostgreSQL (Neon) – Base de datos relacional.

● Firebase Auth – Autenticación y gestión de usuarios.

● Firebase Admin SDK – Administración de usuarios desde el servidor.

● Supabase Storage – Almacenamiento de archivos e imágenes.

● Multer – Manejo de subida de archivos en el servidor.

● Axios – Consumo de APIs externas (ej. Google reCAPTCHA).

● Dotenv – Manejo de variables de entorno.

● GitHub Actions – CI/CD con despliegue automático vía SSH.

# Estructura del proyecto

.git<br>
.github<br>
│	└──/workflows/deploy.yml<br>
config<br>
│	├──/firebase.js<br>
│	├──/firebase-admin.js<br>
│	├──/postgre.js<br>
│	└──/supabase.js<br>
controllers<br>
│	├──/AliadosImageController.js<br>
│	├──/authController.js<br>
│	├──/CategoriaImageController.js<br>
│	├──/contactoController.js<br>
│	├──/ContactoImageController.js<br>
│	├──/detalleOrdenController.js<br>
│	├──/eventController.js<br>
│	├──/fileUploadController.js<br>
│	├──/HomeImageController.js<br>
│	├──/jugadorController.js<br>
│	├──/noticiaController.js<br>
│	├──/ordenController.js<br>
│	├──/productoController.js<br>
│	├──/productos_donacionController.js<br>
│	├──/TestimoniosImageController.js<br>
│	├──/VoluntariadoImageController.js<br>
│	└──/_uploadHelpers.js<br>
│	<br>
Middlewares<br>
│ ├──/authCookieMiddleware.js<br>
│	├──/multer.js<br>
│	└──/ValidatorMiddleware.js<br>
node_modules<br>
routes<br>
│	└──/router.js<br>
templates<br>
│	├──/correo-compra-cliente.html<br>
│	├──/correo-confirmacion.html<br>
│	├──/correo-donacion.html<br>
│	└──/correo-orden.html<br>
uploads<br>
utils<br>
│	├──/compracorreo.js<br>
│	├──/donacioncorreo.js<br>
│	├──/enviarcorreo.js<br>
│	└──/handleValidator.js<br>
.env<br>
.gitignore<br>
auth.js<br>
index.js<br>
LICENSE<br>
package.json<br>
package-lock.son<br>


# Instalación y configuración:

### Paso 1: Clonar el repositorio:

git clone https://github.com/tu-org/Backend_ISW.git<br>
cd Backend_ISW<br>

### Paso 2: Instalar dependencias:

npm install

### Paso 3: Crear archivo .env en la raíz con las credenciales necesarias:

#### Firebase
FIREBASE_API_KEY=tu-api-key<br>
FIREBASE_AUTH_DOMAIN=tu-project.firebaseapp.com<br>
FIREBASE_PROJECT_ID=tu-project-id<br>
FIREBASE_STORAGE_BUCKET=tu-project.appspot.com<br>
FIREBASE_MESSAGING_SENDER_ID=123456789<br>
FIREBASE_APP_ID=1:123456789:web:abcdef123456<br>
FIREBASE_TYPE=service_account<br>
FIREBASE_PROJECT_ID=tu-project-id<br>
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id<br>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"<br>
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@tu-project.iam.gserviceaccount.com<br>
FIREBASE_CLIENT_ID=tu-client-id<br>
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth<br>
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token<br>
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs<br>
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...<br>
FIREBASE_UNIVERSE_DOMAIN=googleapis.com<br>

#### PostgreSQL
POSTGRESQL_URL=postgresql://usuario:contraseña@host:puerto/base_de_datos

#### ReCAPTCHA
RECAPTCHA_SECRET=tu-recaptcha-secret

#### Configuración de Email
EMAIL_SERVICE=gmail<br>
EMAIL_USER=tu-email@gmail.com<br>
EMAIL_PASS=tu-contraseña-de-aplicación<br>

#### Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co<br>
SUPABASE_SERVICE_KEY=tu-service-key<br>

### Paso 4: Iniciar el servidor en desarrollo:

Ejecutar en modo desarrollo<br>
npm run dev

Ejecutar en producción<br>
npm start


# Endpoints de la API

### Autenticación y Usuarios

POST /signup → Registrar nuevo usuario

POST /signin → Iniciar sesión

POST /signout → Cerrar sesión

POST /registrarformulario → Registrar formulario de contacto

POST /restablecer → Restablecer contraseña

POST /verificar → Verificar reCAPTCHA

GET /datosusuario → Obtener datos del usuario

DELETE /eliminar → Eliminar cuenta de usuario

POST /comprar → Realizar compra

PUT /editarperfil → Editar perfil de usuario

GET /obtenerperfil → Obtener perfil de usuario

### Eventos

GET /obtenereventos → Obtener lista de eventos

POST /registrarevento → Crear nuevo evento

PUT /evento/:id → Actualizar evento

DELETE /evento/:id → Eliminar evento

### Noticias

GET /noticias → Obtener todas las noticias

POST /agregarnoticia/:autor_id → Crear noticia

PUT /modificarnoticia/:id/:autor_id → Actualizar noticia

DELETE /eliminarnoticia/:id → Eliminar noticia

GET /noticias/:id → Obtener noticia por ID

### Testimonios

GET /obtenertestimonios → Obtener testimonios

POST /registrartestimonio → Crear testimonio

PUT /testimonio/:id → Actualizar testimonio

DELETE /testimonio/:id → Eliminar testimonio

### Transmisiones en Vivo

POST /registrarenvivo → Registrar video en vivo

GET /obtenerenvivo → Obtener video activo

PUT /video/:id → Actualizar video

### Junta Directiva

GET /junta-directiva → Obtener miembros

POST /junta-directiva → Agregar miembro

PUT /junta-directiva/:id → Editar miembro

DELETE /junta-directiva/:id → Eliminar miembro

### Jugadores

GET /jugadores → Obtener lista de jugadores

### Subida de Imágenes

POST /upload → Subir imagen

PUT /images → Actualizar imagen de inicio

PUT /aliadoimages → Actualizar imagen de aliados

PUT /testimonioimages → Actualizar imagen de testimonios

### Tienda y Productos

GET /tienda/productos → Listar productos

GET /tienda/productos/:id → Obtener producto por ID

POST /tienda/agregarproducto → Agregar producto

PUT /tienda/modificarproducto/:id → Modificar producto

DELETE /tienda/eliminarproducto/:id → Eliminar producto

### Donaciones

GET /donaciones/productos → Listar productos de donación

POST /donaciones/productos → Agregar producto de donación

PUT /donaciones/productos/:id → Modificar producto de donación

DELETE /donaciones/productos/:id → Eliminar producto de donación

POST /donaciones/registrardonacion → Registrar donación

GET /donaciones → Obtener donaciones

### Órdenes

GET /ordenes → Obtener todas las órdenes

GET /ordenes/:idorden/productos_comprados → Obtener productos de una orden

GET /ordenes/:id → Obtener orden por ID

PUT /orden/:idorden → Actualizar estado de orden

POST /agregarorden → Crear orden

PUT /modificarorden/:id → Modificar orden

DELETE /eliminarorden/:id → Eliminar orden

### Detalles de Órdenes

GET /detalles → Obtener todos los detalles

GET /detalles/:id → Obtener detalle por ID

POST /agregardetalle → Crear detalle de orden

PUT /modificardetalle/:id → Modificar detalle de orden

DELETE /eliminardetalle/:id → Eliminar detalle de orden

### Contacto

GET /contacto → Obtener información de contacto

PUT /contacto → Actualizar información de contacto

GET /contactoimages → Obtener imágenes de contacto

PUT /contactoimages → Actualizar imágenes de contacto

### Usuarios extra

GET /obtenerusuarios → Listar todos los usuarios

PUT /usuario/:id → Actualizar rol de usuario

GET /images → Obtener imágenes de inicio

### Categorías

GET /images → Obtener imágenes de categorías

POST /upload → Subir imagen de categoría

PUT /images → Actualizar imagen de categoría

### UID y Última Orden

GET /obteneruid → Obtener UID del usuario actual

GET /ultimaorden → Obtener última orden

# Gestión de Archivos

## Subida de Imágenes

● Supabase Storage para almacenamiento

● Multer para procesamiento de archivos

● Validación de tipos MIME (JPEG, PNG, WebP, AVIF)

● Sanitización de nombres de archivo

## Controladores de Imágenes

● HomeImageController: Imágenes de la página principal

● AliadosImageController: Imágenes de aliados/patrocinadores

● TestimoniosImageController: Imágenes de testimonios

● ContactoImageController: Imágenes de sección de contacto

● CategoriaImageController: Imágenes de categorías

● VoluntariadoImageController: Imágenes de voluntariado

# Sistema de Emails

## Plantillas Disponibles

● correo-confirmacion.html: Confirmación de formulario de contacto

● correo-compra-cliente.html: Confirmación de compra al cliente

● correo-orden.html: Notificación de nueva orden al admin

● correo-donacion.html: Confirmación de donación

# Seguridad

● Validación de entrada con Express Validator

● Sanitización de datos de usuario

● Protección contra XSS y inyección SQL

● CORS configurado para dominios específicos

● Cookies HttpOnly y Secure flags

# Soporte y Contacto

Email técnico: [pilotoshn@outlook.com]

Teléfono: +504 9918-2456

Sitio web: [https://pilotosbaseball.netlify.app]

# Licencia

Este proyecto es de uso interno para la Asociación de Béisbol Menor PILOTOS FAH. Todos los derechos reservados.
