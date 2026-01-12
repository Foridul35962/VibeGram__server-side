import express from 'express'
import * as messageController from '../controller/message.controller.js'
import protect from '../middleware/protect.js'
import upload from '../middleware/upload.js'

const messageRouter = express.Router()

messageRouter.post('/send-message/:receiver', protect, upload, messageController.sendMessage)
messageRouter.get('/get-message/:receiver', protect, messageController.getAllMessages)
messageRouter.get('/prev-chatPartner', protect, messageController.getPrevUserChat)

export default messageRouter