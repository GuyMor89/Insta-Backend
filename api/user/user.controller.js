import { userHandler } from "./user.handler.js"
import { logger } from "../../services/logger.service.js"
import { authHandler } from "../auth/auth.handler.js"

export async function getUsers(req, res) {
    try {
        const { text } = req.query
        const users = await userHandler.query(text)
        res.send(users)
    } catch (err) {
        logger.error('Failed to get users', err)
        res.status(400).send({ err: 'Failed to get users' })
    }
}

export async function getUser(req, res) {
    try {
        if (req.params.id) {
            const userID = req.params.id
            const user = await userHandler.getById(userID)
            res.send(user)
        }
        if (req.params.username) {
            const username = req.params.username
            const user = await userHandler.getByUsernameWithPosts(username)
            res.send(...user)
        }
    } catch (err) {
        logger.error('Failed to get user', err)
        res.status(400).send({ err: 'Failed to get user' })
    }
}

export async function deleteUser(req, res) {
    try {
        const userID = req.params.id
        await userHandler.remove(userID)
        res.send({ msg: 'Deleted successfully' })
    } catch (err) {
        logger.error('Failed to delete user', err)
        res.status(400).send({ err: 'Failed to delete user' })
    }
}

export async function updateUser(req, res) {
    try {
        const user = req.body
        const savedUser = await userHandler.update(user)

        const loginToken = authHandler.createToken(savedUser)
        res.cookie('loginToken', loginToken)

        res.send(savedUser)
    } catch (err) {
        logger.error('Failed to update user', err)
        res.status(400).send({ err: 'Failed to update user' })
    }
}

export async function updateUsers(req, res) {
    try {
        const loggedInUser = req.loggedInUser
        const userToFollowID = req.params.id
        const { type } = req.body

        const savedUsers = await userHandler.updateFollow(type, loggedInUser, userToFollowID)
        res.send(savedUsers)
    } catch (err) {
        logger.error('Failed to update user', err)
        res.status(400).send({ err: 'Failed to update users' })
    }
}