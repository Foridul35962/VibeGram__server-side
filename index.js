import dotenv from 'dotenv'
dotenv.config()
import connectDB from './src/config/db.js'
import app from './src/app.js'
import http from 'http'
import { Server } from 'socket.io'
import socketHandler from './src/config/socket.js'


const PORT = process.env.PORT || 3000

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
})

app.set('io', io)
socketHandler(io)

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`server is running on http://localhost:${PORT}`)
    })
}).catch(() => {
    console.log('server connection failed')
})