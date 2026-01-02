import express from 'express'
import protect from '../middleware/protect.js'
import * as userController from '../controller/user.controller.js'

const userRouter = express.Router()

userRouter.get('/get-user', protect, userController.getUser)
userRouter.get('/suggestedUser', protect, userController.suggestedUser)

export default userRouter