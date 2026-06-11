// JV Malhas Compressivas - Authentication Controller
import { auth, googleProvider, isMock } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const ADMIN_EMAIL = "paulo.htcosta3837@gmail.com";

// Event listener callbacks para mudanças no estado de auth
const authStateListeners = new Set();

// Estado do usuário atual
let currentUser = null;

// Inicializa o controle de auth
function initAuth() {
  if (isMock) {
    // Carrega usuário da simulação (LocalStorage)
    const storedUserJson = localStorage.getItem("jv_mock_user");
    if (storedUserJson) {
      currentUser = JSON.parse(storedUserJson);
    }
    notifyListeners();
  } else {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || "",
          isAdmin: user.email === ADMIN_EMAIL
        };
      } else {
        currentUser = null;
      }
      notifyListeners();
    });
  }
}

function notifyListeners() {
  for (const listener of authStateListeners) {
    try {
      listener(currentUser);
    } catch (e) {
      console.error(e);
    }
  }
}

// Inscreve um escutador para o status do login
export function subscribeToAuth(callback) {
  authStateListeners.add(callback);
  callback(currentUser); // retorna estado inicial
  return () => authStateListeners.delete(callback);
}

// Retorna o usuário logado atualmente
export function getCurrentUser() {
  return currentUser;
}

// Verifica se é administrador
export function isAdmin() {
  return currentUser && (currentUser.email === ADMIN_EMAIL || currentUser.isAdmin === true);
}

// Login com Email e Senha
export async function loginWithEmail(email, password) {
  if (isMock) {
    const mockUsers = JSON.parse(localStorage.getItem("jv_mock_users") || "[]");
    const found = mockUsers.find(u => u.email === email && u.password === password);
    if (!found) {
      throw new Error("E-mail ou senha incorretos.");
    }
    currentUser = {
      uid: found.uid,
      email: found.email,
      displayName: found.displayName,
      isAdmin: found.email === ADMIN_EMAIL
    };
    localStorage.setItem("jv_mock_user", JSON.stringify(currentUser));
    notifyListeners();
    return currentUser;
  } else {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }
}

// Cadastro com Email e Senha
export async function registerWithEmail(email, password, name) {
  if (isMock) {
    const mockUsers = JSON.parse(localStorage.getItem("jv_mock_users") || "[]");
    if (mockUsers.find(u => u.email === email)) {
      throw new Error("Este e-mail já está cadastrado.");
    }
    const newUser = {
      uid: "mock_" + Date.now(),
      email,
      password,
      displayName: name,
      isAdmin: email === ADMIN_EMAIL
    };
    mockUsers.push(newUser);
    localStorage.setItem("jv_mock_users", JSON.stringify(mockUsers));
    
    // Auto login
    currentUser = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      isAdmin: newUser.isAdmin
    };
    localStorage.setItem("jv_mock_user", JSON.stringify(currentUser));
    notifyListeners();
    return currentUser;
  } else {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Em Firebase real, precisaríamos atualizar o profile name se desejado,
    // mas retornaremos o usuário criado.
    return result.user;
  }
}

// Login via Google
export async function loginWithGoogle() {
  if (isMock) {
    // Simula login google
    currentUser = {
      uid: "google_mock_" + Date.now(),
      email: ADMIN_EMAIL, // Força admin para facilitar testes do cliente
      displayName: "Paulo Administrador (Simulado)",
      photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      isAdmin: true
    };
    localStorage.setItem("jv_mock_user", JSON.stringify(currentUser));
    notifyListeners();
    return currentUser;
  } else {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }
}

// Logout do usuário
export async function logoutUser() {
  if (isMock) {
    currentUser = null;
    localStorage.removeItem("jv_mock_user");
    notifyListeners();
    return true;
  } else {
    await signOut(auth);
    return true;
  }
}

// Executa inicialização automática
initAuth();
