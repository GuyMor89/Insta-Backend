import { dbService } from "../../services/db.service.js"
import { logger } from "../../services/logger.service.js"
import { sendMail } from "../../services/mail.service.js"
import { utilService } from '../../services/util.service.js'
import { userHandler } from '../user/user.handler.js'

import { ObjectId } from "mongodb"

export const messageHandler = {
	query,
	addMessage,
	sendLine,
	markRead,
	sendEmail
}

async function query(loggedInUserID) {
	try {
		const collection = await dbService.getCollection('messages')
		const messages = await collection.aggregate([
			{
				$match: {
					"by._id": ObjectId.createFromHexString(loggedInUserID)
				}
			},
			{
				$addFields: {
					otherUser: {
						$first: {
							$filter: {
								input: "$by",
								as: "b",
								cond: { $ne: ["$$b._id", ObjectId.createFromHexString(loggedInUserID)] }
							}
						}
					}
				}
			},
			{
				$project: {
					_id: 1,
					lines: 1,
					hasUnread: {
						$gt: [{
							$size: {
								$filter: {
									input: "$lines",
									as: "line",
									cond: {
										$and: [
											{ $eq: ["$$line.isRead", false] },
											{ $eq: ["$$line.by", "$otherUser.username"] } // Check if the unread message is from the other user
										]
									}
								}
							}
						}, 0]
					},
					user: "$otherUser",
					lastSentAt: {
						$toLong: { $last: "$lines.sentAt" }
					}
				}
			},
			{
				$sort: { lastSentAt: -1 }
			}
		]).toArray();
		
		return messages
		
	} catch (err) {
		logger.error('cannot find messages', err)
		throw err
	}
}


async function getByID(messageID) {
	try {
		const collection = await dbService.getCollection('messages')
		const message = await collection.findOne({ _id: ObjectId.createFromHexString(messageID) })
		
		return message
	} catch (err) {
		logger.error('ERROR: cannot find message')
		throw err
	}
}

async function checkForExistingMessage(loggedInUserID, secondUserID) {
	
	const collection = await dbService.getCollection('messages')
	const existingMessage = await collection.aggregate([
		{
			$match: {
				"by._id": { $all: [utilService.getUserId(loggedInUserID), utilService.getUserId(secondUserID)] } // ✅ Check if both user IDs exist in the "by" array
			}
		},
		{
			$project: { _id: 1 } // ✅ Only return the message document's _id
		}
	]).toArray()

	if (existingMessage.length > 0) {
		console.log("Existing message _id:", existingMessage[0]._id)
		return existingMessage[0]._id
	} else {
		console.log("No conversation found.")
		return null
	}
}

async function addMessage(loggedInUserID, secondUserID) {
	try {

		const existingMessageID = checkForExistingMessage(loggedInUserID, secondUserID)
		if (existingMessageID !== null) return existingMessageID

		const fullLoggedInUser = await userHandler.getById(loggedInUserID)
		const fullSecondUser = await userHandler.getById(secondUserID)
		const newMessage = {
			by: [
				{
					_id: fullLoggedInUser._id,
					fullname: fullLoggedInUser.fullname,
					username: fullLoggedInUser.username,
					imgUrl: fullLoggedInUser.imgUrl
				},
				{
					_id: fullSecondUser._id,
					fullname: fullSecondUser.fullname,
					username: fullSecondUser.username,
					imgUrl: fullSecondUser.imgUrl
				}
			],
			lines: []
		}
		const collection = await dbService.getCollection('messages')
		const addedMessage = await collection.insertOne(newMessage)
		const addedMessageID = addedMessage.insertedId

		return addedMessageID
	} catch (err) {
		logger.error('cannot send message', err)
		throw err
	}
}

async function sendLine(messageID, lineToSend) {
	try {
		const collection = await dbService.getCollection('messages')
		await collection.updateOne({ _id: utilService.getUserId(messageID) }, { $push: { lines: lineToSend } })

		return lineToSend
	} catch (err) {
		logger.error('cannot send message', err)
		throw err
	}
}

async function markRead(messageID) {
	try {
		const collection = await dbService.getCollection('messages')
		const message = await collection.updateOne({ _id: utilService.getUserId(messageID) }, { $set: { "lines.$[].isRead": true } })

		return message
	} catch (err) {
		logger.error('cannot mark as read', err)
		throw err
	}
}

async function sendEmail(email) {
	try {
		const mailDetails = {
			subject: `${email.subject} from ${email.from} (${email.email})`,
			text: email.text,
		}
		console.log(mailDetails)
		sendMail(mailDetails)
		return email
	} catch (err) {
		logger.error('cannot send Email', err)
		throw err
	}
}
