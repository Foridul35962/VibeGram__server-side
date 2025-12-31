import express from 'express'
import cors from 'cors'
import cookies from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(cookies())

app.get('/', (req, res)=>{
    res.send('vibegram server is running...')
})

export default app