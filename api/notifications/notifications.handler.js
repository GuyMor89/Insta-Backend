import { dbService } from "../../services/db.service.js"
import { logger } from "../../services/logger.service.js"
import { utilService } from "../../services/util.service.js"

import { ObjectId } from "mongodb"

export const notificationHandler = {
    query,
    createNotification,
    addActivity,
    markRead
}

async function query(loggedInUserID) {
    try {
        const collection = await dbService.getCollection('notifications')
        const notifications = await collection.aggregate([
            {
                $match: { userID: utilService.getUserId(loggedInUserID) } // Step 1: Filter notifications for the logged-in user
            },
            {
                $unwind: "$activities" // Step 2: Unwind activities so each is its own document
            },
            {
                $sort: { "activities.createdAt": -1 } // Step 3: Sort by createdAt (newest first)
            },
            {
                $limit: 5 // Step 4: Limit to last 5 activities
            },
            {
                $group: { // Step 5: Group only the activities into an array
                    _id: null, // No need for an ID, we only want activities
                    activities: { $push: "$activities" }
                }
            },
            {
                $project: { // Step 6: Remove _id, return only activities array
                    _id: 0,
                    activities: 1
                }
            }
        ]).toArray()

        return notifications
    } catch (err) {
        logger.error('cannot find notifications', err)
        throw err
    }
}

async function getByID(userID) {
    try {
        const collection = await dbService.getCollection('notifications')
        const notification = await collection.findOne({ userID: ObjectId.createFromHexString(userID) })

        return notification
    } catch (err) {
        logger.error('ERROR: cannot find notification')
        throw err
    }
}

async function createNotification(loggedInUserID) {
    try {
        const newNotification = {
            userID: utilService.getUserId(loggedInUserID),
            activities: []
        }

        const collection = await dbService.getCollection('notifications')
        collection.insertOne(newNotification)

        return newNotification
    } catch (err) {
        logger.error('cannot create notification', err)
        throw err
    }
}

async function addActivity(toUserID, loggedInUser, activity) {
    try {
        console.log(toUserID)
        console.log(activity)

        const notification = await getByID(toUserID)

        const newActivity = {
            by: loggedInUser,
            createdAt: Date.now(),
            isRead: false,
            ...activity
        }

        console.log(newActivity)

        const collection = await dbService.getCollection('notifications')
        await collection.updateOne({ _id: notification._id }, { $push: { activities: newActivity } })

        return newActivity
    } catch (err) {
        logger.error('cannot add activity', err)
        throw err
    }
}

async function markRead(loggedInUserID) {
    try {
        const notification = await getByID(loggedInUserID)

        const collection = await dbService.getCollection('notifications')
        await collection.updateOne({ _id: notification._id }, { $set: { "activities.$[].isRead": true } })

        return notification
    } catch (err) {
        logger.error('cannot mark as read', err)
        throw err
    }
}
