import express from 'express'
import * as notificationController from '../controller/notification.controller.js'
import protect from '../middleware/protect.js'

const notificationRouter = express.Router()

notificationRouter.get('/user-notification', protect, notificationController.getAllNotification)
notificationRouter.patch('/markAsRead', protect, notificationController.markAsRead)

export default notificationRouter