const token = localStorage.getItem("token_usuario");

if (!token) {
    // Se não há token salvo no navegador, barra na hora e manda pro login
    alert("Acesso negado! Por favor, faça login para acessar esta página.");
    window.location.href = "../authPages/pages/login.html";
}