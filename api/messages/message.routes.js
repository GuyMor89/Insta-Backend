import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import { getMessages, updateMessage } from './message.controller.js'

export const messageRoutes = express.Router()

messageRoutes.get('/', log, requireAuth, getMessages)
messageRoutes.put('/:id', requireAuth, updateMessage)
