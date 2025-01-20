import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { getUser, getUsers, deleteUser, updateUser } from './user.controller.js'
import { log } from '../../middlewares/logger.middleware.js'

export const userRoutes = express.Router()

userRoutes.get('/', getUsers)
userRoutes.get('/id/:id', getUser)
userRoutes.get('/username/:username', log, getUser)
userRoutes.put('/', updateUser)
userRoutes.delete('/:id', deleteUser)
