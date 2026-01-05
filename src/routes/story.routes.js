import express from 'express'
import * as storyController from '../controller/story.controller.js'
import protect from '../middleware/protect.js'
import upload from '../middleware/upload.js'

const storyRouter = express.Router()

storyRouter.post('/upload', protect, upload, storyController.uploadStory)
storyRouter.delete('/delete', protect, storyController.deleteStory)
storyRouter.patch('/view', protect, storyController.viewStory)

export default storyRouter