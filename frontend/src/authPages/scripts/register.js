const formulario = document.getElementById('form-register')
const btnLogin = document.getElementById('btn-ir-login')
const btnHome = document.getElementById('btn-ir-home')

formulario.addEventListener('submit', async (event) => {
    event.preventDefault()
    const dadosDoFormulario = new FormData(formulario)
    const formJson = Object.fromEntries(dadosDoFormulario)
    const urlDoBackend = 'http://localhost:3000/register'
    try{
        console.log("Enviando requisição..."); // Descoberta 1
        const respostaServidor = await fetch(urlDoBackend, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formJson)
        })
        console.log("Resposta bruta recebida do servidor:", respostaServidor); // Descoberta 2
        const resultado = await respostaServidor.json()
        alert("JSON decodificado com sucesso:", resultado); // Descoberta 3
        console.log(resultado)

    }catch(error){
        console.error('Erro ao conectar com o servidor')
        console.log(error)
    }

})

btnLogin.addEventListener("click", () => {
    window.location.href = "../pages/login.html";
});

btnHome.addEventListener("click", () => {
    window.location.href = "../../homePages/home.html";
});