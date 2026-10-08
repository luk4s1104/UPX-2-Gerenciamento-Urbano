// Importa o Firebase Core e o Auth direto da Web (CDN)
import { initializeApp } from "https://gstatic.com";
import { getAuth } from "https://gstatic.com";

const firebaseConfig = {
  apiKey: "AIzaSyCPOpkjeLdmnPEKmkLKh6q9OLPlI8o8VD0",
  authDomain: "upx2-backend.firebaseapp.com",
  projectId: "upx2-backend",
  storageBucket: "upx2-backend.firebasestorage.app",
  messagingSenderId: "320712261996",
  appId: "1:320712261996:web:747f6f677b20cc9d853349",
  measurementId: "G-3X4S4FG2BE"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o serviço de autenticação
export const auth = getAuth(app);
