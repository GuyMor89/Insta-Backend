import { authHandler } from "./auth.handler.js"
import { logger } from '../../services/logger.service.js'
import { notificationHandler } from "../notifications/notifications.handler.js"

export async function login(req, res) {
    const { username, password } = req.body

    try {
        const user = await authHandler.login(username, password)
        const loginToken = authHandler.createToken(user)

        logger.info('User login: ', user)
        res.cookie('loginToken', loginToken)

        res.json(user)
    } catch (err) {
        logger.error('Failed to Login ' + err)
        res.status(401).send({ err: 'Failed to Login' })
    }
}

export async function signup(req, res) {
    try {
        const { username, password, fullname } = req.body

        const bannedUsernames = ['explore', 'about', 'p', 'direct', 'story', 'home', 'main']

        if (bannedUsernames.some(name => name === username)) throw new Error('Username Taken')

        const account = await authHandler.signup(username, password, fullname)
        logger.debug(`auth.route - new account created: ` + JSON.stringify(account))

        const user = await authHandler.login(username, password)
        const loginToken = authHandler.createToken(user)
        logger.info('User signup:', user)

        await notificationHandler.createNotification(user._id)

        res.cookie('loginToken', loginToken)
        res.json(user)
    } catch (err) {
        logger.error('Failed to signup ' + err)
        res.status(500).send({ err: 'Failed to signup' })
    }
}

export async function logout(req, res) {
    try {
        res.clearCookie('loginToken')
        logger.info('User logged out successfully')
        res.send({ msg: 'Logged out successfully' })
    } catch (err) {
        res.status(500).send({ err: 'Failed to logout' })
    }
}
