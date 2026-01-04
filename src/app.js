import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import cookies from 'cookie-parser'

//local import
import errorHandler from './helpers/ErrorHandler.js'
import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'
import postRouter from './routes/post.routes.js'
import reelRouter from './routes/reel.routes.js'
import startStoryCleanupJob from './jobs/storyCleanup.job.js'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(cookies())

//jobs
startStoryCleanupJob()

//routers
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/reel', reelRouter)

app.get('/', (req, res)=>{
    res.send('vibegram server is running...')
})

//global error handler
app.use(errorHandler)

export default app