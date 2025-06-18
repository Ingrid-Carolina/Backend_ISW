import admin from "firebase-admin";
import serviceAccount from "./admin.json" with { type: "json" };


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


export default admin;