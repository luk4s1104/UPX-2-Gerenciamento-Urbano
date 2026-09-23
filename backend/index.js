import express from 'express'
import cors from 'cors'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

app.post('/teste',(req, res)=>{
    const dadosRecebidos = req.body
    console.log("Dados que chegaram do Frontend:", dadosRecebidos);
    res.json({ 
    status: "Sucesso", 
    message: "Dados do gerenciamento urbano recebidos no backend!",
    dados: dadosRecebidos 
    });
})

app.listen(port, ()=>{
    console.log(`Server rodando em http://localhost:${port}`)
})