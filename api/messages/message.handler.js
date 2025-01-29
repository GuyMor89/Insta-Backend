import { dbService } from "../../services/db.service.js"
import { logger } from "../../services/logger.service.js"
import { utilService } from '../../services/util.service.js'

import { ObjectId } from "mongodb"

export const messageHandler = {
	query,
	updateMessage
}

async function query(loggedInUserID) {
	try {
		const collection = await dbService.getCollection('messages')

		const messages = collection.aggregate([
			{
				$match: {
					"by._id": ObjectId.createFromHexString(loggedInUserID)
				}
			},
			{
				$project: {
					_id: 1,
					lines: 1,
					sentAt: 1,
					user: {
						$first: {
							$filter: {
								input: "$by",
								as: "b",
								cond: { $ne: ["$$b._id", ObjectId.createFromHexString(loggedInUserID)] }
							}
						}
					}
				}
			}
		]).toArray()

		return messages

	} catch (err) {
		logger.error('cannot find messages', err)
		throw err
	}
}

async function updateMessage(messageID, lineToSend) {
	try {
		const collection = await dbService.getCollection('messages')
		await collection.updateOne({ _id: utilService.getUserId(messageID) }, { $push: { lines: lineToSend } })

		return lineToSend
	} catch (err) {
		logger.error('cannot send message', err)
		throw err
	}

}