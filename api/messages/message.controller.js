import { messageHandler } from './message.handler.js'
import { logger } from '../../services/logger.service.js'

export async function getMessages(req, res) {
    try {
        const loggedInUser = req.loggedInUser
        const messages = await messageHandler.query(loggedInUser._id)
        res.json(messages)
    } catch (err) {
        logger.error('Failed to get messages', err)
        res.status(500).send({ err: 'Failed to get messages' })
    }
}

export async function addMessage(req, res) {
    try {
        const loggedInUser = req.loggedInUser
        const { secondUserID } = req.body
        const addedMessageID = await messageHandler.addMessage(loggedInUser._id, secondUserID)
        res.json(addedMessageID)
    } catch (err) {
        logger.error('Failed to get messages', err)
        res.status(500).send({ err: 'Failed to get messages' })
    }
}

export async function updateMessage(req, res) {
    try {
        const messageID = req.params.id
        const { lineToSend } = req.body
        const updatedMessage = await messageHandler.updateMessage(messageID, lineToSend)
        res.json(updatedMessage)
    } catch (err) {
        logger.error('Failed to get messages', err)
        res.status(500).send({ err: 'Failed to get messages' })
    }
}