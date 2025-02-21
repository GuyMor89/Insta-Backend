import { messageHandler } from './message.handler.js'
import { logger } from '../../services/logger.service.js'
import { emitMessageSent } from '../../services/socket.service.js'

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

export async function sendLine(req, res) {
    try {
        const messageID = req.params.id
        const { secondUserID } = req.body
        const { lineToSend } = req.body

        const updatedMessage = await messageHandler.sendLine(messageID, lineToSend)
        emitMessageSent({ messageID, lineToSend }, secondUserID)

        res.json(updatedMessage)
    } catch (err) {
        logger.error('Failed to get messages', err)
        res.status(500).send({ err: 'Failed to get messages' })
    }
}

export async function markRead(req, res) {
    try {
        const messageID = req.params.id
        const markedAsRead = await messageHandler.markRead(messageID)

        res.json(markedAsRead)
    } catch (err) {
        logger.error('Failed to mark all as read', err)
        res.status(500).send({ err: 'Failed to mark all as read' })
    }
}

export async function sendEmail(req, res) {
    try {
        const email = req.body
        const sentEmail = await messageHandler.sendEmail(email)

        res.json(sentEmail)
    } catch (err) {
        logger.error('Failed to send Email', err)
        res.status(500).send({ err: 'Failed to send Email' })
    }
}