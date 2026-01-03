import express from 'express'
import * as postController from '../controller/post.controller.js'
import protect from '../middleware/protect.js'
import upload from '../middleware/upload.js'

const postRouter = express.Router()

postRouter.post('/upload-post', protect, upload, postController.uploadPost)
postRouter.delete('/delete-post', protect, postController.deletePost)
postRouter.get('/user-post', protect, postController.getUserPosts)
postRouter.patch('/save-post', protect, postController.savedPosts)
postRouter.patch('/like-unlike', protect, postController.likedUnlikedPost)
postRouter.patch('/comment', protect, postController.commentPost)

export default postRouter