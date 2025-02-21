import { notificationHandler } from './notifications.handler.js'
import { logger } from '../../services/logger.service.js'
import { emitNotification } from '../../services/socket.service.js'

export async function getNotifications(req, res) {
    try {
        const loggedInUser = req.loggedInUser
        const notifications = await notificationHandler.query(loggedInUser._id)
        res.json(notifications[0].activities)
    } catch (err) {
        logger.error('Failed to get notifications', err)
        res.status(500).send({ err: 'Failed to get notifications' })
    }
}

export async function createNotification(req, res) {
    try {
        const loggedInUser = req.loggedInUser
        const notification = await notificationHandler.createNotification(loggedInUser)
        res.json(notification)
    } catch (err) {
        logger.error('Failed to create notification', err)
        res.status(500).send({ err: 'Failed to create notification' })
    }
}

export async function addActivity(req, res) {
    try {
        const loggedInUser = req.loggedInUser
        const toUserID = req.params.id
        const activity = req.body

        const addedActivity = await notificationHandler.addActivity(toUserID, loggedInUser, activity)
        emitNotification(activity, toUserID)

        res.json(addedActivity)
    } catch (err) {
        logger.error('Failed to add activity', err)
        res.status(500).send({ err: 'Failed to add activity' })
    }
}

export async function markRead(req, res) {
    try {
        const loggedInUser = req.loggedInUser
        const markedAsRead = await notificationHandler.markRead(loggedInUser._id)

        res.json(markedAsRead)
    } catch (err) {
        logger.error('Failed to mark all as read', err)
        res.status(500).send({ err: 'Failed to mark all as read' })
    }
}
