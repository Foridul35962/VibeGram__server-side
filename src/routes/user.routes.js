import express from 'express'
import protect from '../middleware/protect.js'
import * as userController from '../controller/user.controller.js'
import upload from '../middleware/upload.js'

const userRouter = express.Router()

userRouter.get('/get-user', protect, userController.getUser)
userRouter.get('/suggestedUser', protect, userController.suggestedUser)
userRouter.patch('/followUnfollow', protect, userController.followUnfollow)
userRouter.patch('/updateUserProfile', protect, upload, userController.updateUserProfile)
userRouter.get('/find-user/:userName', protect, userController.findUser)

export default userRouter