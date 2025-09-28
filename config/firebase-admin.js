// Importa el paquete firebase-admin para interactuar con los servicios de Firebase Admin SDK.
import admin from "firebase-admin";

// Importa dotenv para cargar las variables de entorno desde un archivo .env.
import dotenv from "dotenv";
dotenv.config();

// Inicializa la aplicación de Firebase Admin con las credenciales proporcionadas.
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE, // Tipo de cuenta de servicio.
    project_id: process.env.FIREBASE_PROJECT_ID, // ID del proyecto de Firebase.
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID, // ID de la clave privada.
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Clave privada, con saltos de línea correctamente formateados.
    client_email: process.env.FIREBASE_CLIENT_EMAIL, // Correo electrónico del cliente.
    client_id: process.env.FIREBASE_CLIENT_ID, // ID del cliente.
    auth_uri: process.env.FIREBASE_AUTH_URI, // URI de autenticación.
    token_uri: process.env.FIREBASE_TOKEN_URI, // URI de tokens.
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL, // URL del certificado del proveedor de autenticación.
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL, // URL del certificado del cliente.
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN // Dominio del universo de Firebase.
  })
});

// Exporta la instancia de Firebase Admin para su uso en otras partes de la aplicación.
export default admin;
