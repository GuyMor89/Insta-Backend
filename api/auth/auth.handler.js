import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userHandler } from '../user/user.handler.js'
import { logger } from '../../services/logger.service.js'

const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

export const authHandler = {
    login,
    signup,
    createToken,
    validateToken
}

async function login(username, password) {
    logger.debug(`auth.service - login with username: ${username}`)

    // Get the full user object from Mongo
    const user = await userHandler.getByUsername(username)
    if (!user) throw new Error('Invalid username or password')

    // Compare the given password with the stored password
    const match = await bcrypt.compare(password, user.password)
    if (!match) throw new Error('Invalid username or password')

    delete user.password
    return user
}

async function signup(username, password, fullname) {
    const saltRounds = 10

    logger.debug(`auth.service - signup with username: ${username}, fullname: ${fullname}`)
    if (!username || !password || !fullname) throw new Error('Missing details')

    const usernameTaken = await userHandler.getByUsername(username)
    if (usernameTaken) return Promise.reject('Username already taken')

    const hash = await bcrypt.hash(password, saltRounds)
    const addedUser = await userHandler.add({ username, password: hash, fullname })
    
    delete addedUser.password
    return addedUser
}

function createToken(user) {
    const userInfo = { _id: user._id, username: user.username, imgUrl: user.imgUrl }
    return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
    try {
        const json = cryptr.decrypt(loginToken)
        const loggedInUser = JSON.parse(json)
        return loggedInUser
    } catch (err) {
        console.log('Invalid login token')
    }
    return null
}