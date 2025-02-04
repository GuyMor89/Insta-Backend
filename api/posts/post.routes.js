import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import { addPost, getPost, getPosts, updatePost } from './post.controller.js'

export const postRoutes = express.Router()

postRoutes.get('/', log, requireAuth, getPosts)
postRoutes.get('/:id', getPost)
postRoutes.post('/', requireAuth, addPost)
postRoutes.put('/', requireAuth, log, updatePost)