import express from 'express'
import { auth, db } from './firebase.js'
import cors from 'cors'

const app = express()
app.use(express.json())
app.use(cors())

app.post('/register', async (req, res)=>{
    const { name, email, password} = req.body
    try {
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: name,
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

app.post('/login-verify', async(req, res)=>{
    const { idToken } = req.body

    try {
        // Valida se o token enviado pelo front-end é legítimo
        const decodedToken = await auth.verifyIdToken(idToken)
        const uid = decodedToken.uid

        // Busca os dados cadastrados desse usuário no Firestore
        const userDoc = await db.collection('users').doc(uid).get()

        res.status(200).json({
            message:'Usuário autenticado no Backend',
            user: userDoc.data()
        })
    }catch (error) {
        res.status(401).json({ error: 'Token invalido ou expirado'})
    }
})

app.listen(3000, () => console.log("Servidor rodando liso http://localhost:3000 🚀"));
