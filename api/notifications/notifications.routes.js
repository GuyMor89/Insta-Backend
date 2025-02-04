import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import { getNotifications, createNotification, addActivity, markRead } from './notifications.controller.js'

export const notificationRoutes = express.Router()

notificationRoutes.get('/', log, requireAuth, getNotifications)
notificationRoutes.put('/read', requireAuth, markRead)
notificationRoutes.put('/:id', requireAuth, addActivity)

