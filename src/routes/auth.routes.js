import express from 'express'
import * as authController from '../controller/auth.controller.js'

const authRouter = express.Router()

authRouter.post('/register', authController.registration)
authRouter.post('/verify-regi', authController.verifyRegi)

export default authRouter