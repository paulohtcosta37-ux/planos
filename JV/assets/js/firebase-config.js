// JV Malhas Compressivas - Firebase Initialization & Config fallbacks
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// === ATENÇÃO ===
// Substitua as chaves abaixo pelas credenciais do seu projeto Firebase.
// Você pode obter essas chaves no console do Firebase (https://console.firebase.google.com/)
// em "Configurações do Projeto" > "Seus aplicativos" > criar um app Web.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "jv-malhas.firebaseapp.com",
  projectId: "jv-malhas",
  storageBucket: "jv-malhas.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

let app;
let auth;
let db;
let isMock = false;

// Tenta inicializar o Firebase. Se as credenciais forem padrão (fictícias), usa simulação local.
if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE" || firebaseConfig.apiKey === "") {
  console.warn("JV Malhas: Firebase executando em modo SIMULADO. Para conectar ao seu banco real do Google, configure suas chaves em 'assets/js/firebase-config.js'.");
  isMock = true;
} else {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("JV Malhas: Firebase conectado com sucesso!");
  } catch (error) {
    console.error("Falha ao inicializar o Firebase real. Entrando em modo simulado.", error);
    isMock = true;
  }
}

const googleProvider = auth ? new GoogleAuthProvider() : null;

export { app, auth, db, googleProvider, isMock };
