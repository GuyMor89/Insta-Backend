import express from 'express'

import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import { getPosts } from './post.controller.js'

export const postRoutes = express.Router()

postRoutes.get('/', log, getPosts)