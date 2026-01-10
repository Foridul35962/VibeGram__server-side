import express from 'express'
import * as reelController from '../controller/reels.controller.js'
import protect from '../middleware/protect.js'
import upload from '../middleware/upload.js'

const reelRouter = express.Router()

reelRouter.post('/upload-reel', protect, upload, reelController.uploadReel)
reelRouter.delete('/delete-reel', protect, reelController.deleteReel)
reelRouter.get('/user-reel/:userId', protect, reelController.getUserAllReels)
reelRouter.get('/get-reel/:reelId', protect, reelController.getReel)
reelRouter.get('/all-reels', protect, reelController.getAllReels)
reelRouter.patch('/like-unlike', protect, reelController.likedUnlikedReel)
reelRouter.patch('/comment', protect, reelController.commentReel)

export default reelRouter