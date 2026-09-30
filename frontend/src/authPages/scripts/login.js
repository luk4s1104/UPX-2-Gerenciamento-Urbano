import { auth } from "./firebase-config.js"
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const loginForm = document.getElementById('login-form')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const btnRegistro = document.getElementById('btn-ir-registro')
const btnHome = document.getElementById('btn-ir-home')
const btnLogout = document.getElementById('btn-ir-logout')

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const email = emailInput.value
    const password = passwordInput.value

    try{

        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        const idToken = await user.getIdToken()
        const response = await fetch("http://localhost:3000/login-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: idToken})
        })
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Erro ao validar o token no servidor.");
        }
        localStorage.setItem("token_usuario", idToken);
        alert(`Bem-vindo de volta! Usuário autenticado com sucesso.`);
    } catch (error) {
        console.error("Falha na autenticação:", error.message);
        
        // Trata erros comuns do Firebase para avisar o usuário de forma amigável
        if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
            alert("E-mail ou senha incorretos. Tente novamente.");
        } else {
            alert(`Erro ao tentar entrar: ${error.message}`);
        }
    }
})

btnRegistro.addEventListener("click", () => {
    window.location.href = "../pages/register.html";
});

btnHome.addEventListener("click", () => {
    window.location.href = "../../homePages/home.html";
})

btnLogout.addEventListener("click", () => {
    localStorage.clear()
})