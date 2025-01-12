import express from 'express'

import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { getUser, getUsers, deleteUser, updateUser } from './user.controller.js'

export const userRoutes = express.Router()

userRoutes.get('/', getUsers)
userRoutes.get('/:id', getUser)
userRoutes.put('/:id',  updateUser)
userRoutes.delete('/:id', deleteUser)
