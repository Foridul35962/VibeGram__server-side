import dotenv from 'dotenv'
dotenv.config()
import connectDB from './src/config/db.js'
import app from './src/app.js'


const PORT = process.env.PORT || 3000

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`server is running on http://localhost:${PORT}`)
    })
}).catch(() => {
    console.log('server connection failed')
})