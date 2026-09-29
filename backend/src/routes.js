import express from 'express'
import { auth, db } from './firebase.js'

const app = express()
app.use(express.json())

app.post('/register', async (req, res)=>{
    const { name, email, password} = req.body
    try {
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayname: name,
        })

        await db.collection('users').doc(userRecord.uid).set({
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        })

        res.status(201).json({
            message: "Usuário criado com sucesso!",
            userid: userRecord.uid
        })

    } catch (error) {
        return res.status(400).json({error: error.message})
    }
})

app.listen(3000, () => console.log("Servidor rodando liso http://localhost:3000 🚀"));