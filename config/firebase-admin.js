import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

// Inicializa Firebase Admin SDK usando las credenciales del archivo .env
admin.initializeApp({
  credential: admin.credential.cert({
    // Cada uno de estos valores proviene de las variables de entorno configuradas
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    // Se reemplazan los saltos de línea (\n) para que la clave privada tenga el formato correcto
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
  })
});

// Se exporta la instancia de Firebase Admin para ser usada en otras partes del proyecto
export default admin;
