import dotenv from "dotenv";
import { initializeApp } from "firebase/app"; //inicializamos sesion en firebase(para login, singin o sign up)
import { getAuth } from "firebase/auth";
import {getStorage} from "firebase/storage";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const storage = getStorage(app);

export default auth;

/*import admin from 'firebase-admin'
import serviceAccount from './firebase.json' assert {type: 'json'};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export default admin;*/
