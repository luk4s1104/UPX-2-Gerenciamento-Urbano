import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// o objeto com as credenciais no Console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCPOpkjeLdmnPEKmkLKh6q9OLPlI8o8VD0",
  authDomain: "upx2-backend.firebaseapp.com",
  projectId: "upx2-backend",
  storageBucket: "upx2-backend.firebasestorage.app",
  messagingSenderId: "320712261996",
  appId: "1:320712261996:web:747f6f677b20cc9d853349",
  measurementId: "G-3X4S4FG2BE"
};

// Inicializa o aplicativo Firebase
const app = initializeApp(firebaseConfig);

// Exporta o serviço de autenticação configurado
export const auth = getAuth(app);
