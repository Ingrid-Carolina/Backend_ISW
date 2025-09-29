import dotenv from "dotenv";
import { initializeApp } from "firebase/app"; // Inicializa Firebase en el frontend (login, signup, etc.)
import { getAuth } from "firebase/auth"; // Servicio de autenticación
import { getStorage } from "firebase/storage"; // Servicio de almacenamiento

dotenv.config();

// Configuración de Firebase, todos los valores vienen del archivo .env
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inicializa la app de Firebase con la configuración dada
const app = initializeApp(firebaseConfig);

// Exporta el servicio de autenticación
export const auth = getAuth(app);

// Exporta el servicio de almacenamiento
export const storage = getStorage(app);

// Exporta auth como valor por defecto
export default auth;
