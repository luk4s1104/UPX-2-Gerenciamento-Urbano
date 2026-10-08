const formulario = document.getElementById('form')
const resposta = document.getElementById('resposta')

formulario.addEventListener('submit', async (event) => {
    event.preventDefault()
    const dadosDoFormulario = new FormData(formulario)
    const formJson = Object.fromEntries(dadosDoFormulario)
    const urlDoBackend = 'http://localhost:3000/teste'
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
        console.log("JSON decodificado com sucesso:", resultado); // Descoberta 3
        resposta.innerText = 'Dados enviados com sucesso'
        console.log(resultado)

    }catch(error){
        resposta.innerText = 'Erro ao conectar com o servidor'
        console.log(error)
    }

})
