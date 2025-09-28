// Importa el paquete dotenv para cargar las variables de entorno desde un archivo .env.
import dotenv from "dotenv";

// Importa las funciones necesarias de Firebase para inicializar la aplicación, autenticación y almacenamiento.
import { initializeApp } from "firebase/app"; // Inicializa la sesión en Firebase (para login, sign-in o sign-up).
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Carga las variables de entorno definidas en el archivo .env en process.env.
dotenv.config();

// Configuración de Firebase utilizando las variables de entorno.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY, // Clave de API para interactuar con Firebase.
  authDomain: process.env.FIREBASE_AUTH_DOMAIN, // Dominio de autenticación de Firebase.
  projectId: process.env.FIREBASE_PROJECT_ID, // ID del proyecto de Firebase.
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Bucket de almacenamiento de Firebase.
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID, // ID del remitente de mensajes de Firebase.
  appId: process.env.FIREBASE_APP_ID, // ID de la aplicación de Firebase.
};

// Inicializa la aplicación de Firebase con la configuración proporcionada.
const app = initializeApp(firebaseConfig);

// Exporta la instancia de autenticación de Firebase para su uso en otras partes de la aplicación.
export const auth = getAuth(app);

// Exporta la instancia de almacenamiento de Firebase para gestionar archivos en el bucket de Firebase.
export const storage = getStorage(app);

// Exporta la instancia de autenticación como valor predeterminado.
export default auth;

