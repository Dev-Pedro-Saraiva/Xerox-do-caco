import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// SUAS CONFIGURAÇÕES DO FIREBASE AQUI
const firebaseConfig = {
  apiKey: "AIzaSyCNYVaYrjUZKWYP-yV8AU2awmzcp7M7IoA",
  authDomain: "penielmatconst.firebaseapp.com",
  projectId: "penielmatconst",
  storageBucket: "penielmatconst.firebasestorage.app",
  messagingSenderId: "769088435817",
  appId: "1:769088435817:web:5496b08f49aae3756d94f8"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const btnSubmit = document.getElementById('btn-submit');
const toggleAuth = document.getElementById('toggle-auth');

let isLogin = true;

// Alternar entre Login e Cadastro
toggleAuth.addEventListener('click', () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? "Fazer Login" : "Criar Conta";
    btnSubmit.innerText = isLogin ? "Entrar" : "Cadastrar";
    toggleAuth.innerHTML = isLogin ? "Não tem conta? <span>Cadastre-se</span>" : "Já tem conta? <span>Faça Login</span>";
});

// Lógica de Envio
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isLogin) {
        // LOGIN
        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                alert("Bem-vindo!");
                window.location.href = "admin.html"; // Redireciona para o painel
            })
            .catch((error) => alert("Erro ao entrar: " + error.message));
    } else {
        // CADASTRO
        createUserWithEmailAndPassword(auth, email, password)
            .then(() => {
                alert("Conta criada com sucesso!");
                window.location.href = "admin.html";
            })
            .catch((error) => alert("Erro ao cadastrar: " + error.message));
    }
});