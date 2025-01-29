import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import { getMessages, updateMessage, addMessage } from './message.controller.js'

export const messageRoutes = express.Router()

messageRoutes.get('/', log, requireAuth, getMessages)
messageRoutes.post('/', requireAuth, addMessage)
messageRoutes.put('/:id', requireAuth, updateMessage)
