import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

import { ObjectId } from 'mongodb'

export const userHandler = {
	query,
	getById,
	getByUsername,
	getByUsernameWithPosts,
	remove,
	update,
	add,
}

async function query(filterBy = {}) {
	// const criteria = _buildCriteria(filterBy)
	try {
		const collection = await dbService.getCollection('users')
		return await collection.find().toArray()

	} catch (err) {
		logger.error('cannot find users', err)
		throw err
	}
}

async function getById(userID) {
	try {
		const collection = await dbService.getCollection('users')
		const user = await collection.findOne({ _id: ObjectId.createFromHexString(userID) })
		delete user.password
		return user
	} catch (err) {
		logger.error(`while finding user ${userID}`, err)
		throw err
	}
}

async function getByUsername(username) {
	try {
		const collection = await dbService.getCollection('users')
		const user = await collection.findOne({ username })
		return user
	} catch (err) {
		logger.error(`while finding user ${username}`, err)
		throw err
	}
}

async function getByUsernameWithPosts(username) {
	try {
		const collection = await dbService.getCollection('users')
		const userWithPosts = await collection.aggregate([
			{
				$match: {
					username // Replace with the actual username
				}
			},
			{
				$addFields: {
					postIDs: {
						$ifNull: [
							{
								$map: {
									input: '$postIDs',
									as: 'id',
									in: { $toObjectId: '$$id' }
								}
							},
							[]
						]
					}
				}
			},
			{
				$unwind: {
					path: '$postIDs',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'posts',
					localField: 'postIDs',
					foreignField: '_id',
					as: 'userPosts'
				}
			},
			{
				$unwind: {
					path: '$userPosts',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$group: {
					_id: '$_id',
					username: { $first: '$username' },
					fullname: { $first: '$fullname' },
					following: { $first: '$following' },
					followers: { $first: '$followers' },
					savedPostIds: { $first: '$savedPostIds' },
					imgUrl: { $first: '$imgUrl' },
					imgUrls: {
						$push: {
							$cond: {
								if: {
									$gt: [
										{
											$size: {
												$objectToArray: {
													// If userPosts is null, use an empty object: {}
													$ifNull: ['$userPosts', {}]
												}
											}
										},
										0
									]
								},
								then: { _id: '$userPosts._id', url: '$userPosts.imgUrl' },
								else: null
							}

						}
					}
				}
			},
			{
				$project: {
					_id: 1,
					username: 1,
					fullname: 1,
					following: 1,
					followers: 1,
					savedPostIds: 1,
					imgUrl: 1,
					imgUrls: {
						$filter: {
							input: '$imgUrls',
							as: 'img',
							cond: { $ne: ['$$img', null] }
						}
					}
				}
			}
		]).toArray()

		return userWithPosts
	} catch (err) {
		logger.error(`while finding user ${username}`, err)
		throw err
	}

}

async function remove(userID) {
	try {
		const collection = await dbService.getCollection('users')
		await collection.deleteOne({ _id: ObjectId.createFromHexString(userID) })
	} catch (err) {
		logger.error(`cannot remove user ${userID}`, err)
		throw err
	}
}

async function update(user) {
	try {
		const userToSave = {
			_id: ObjectId.createFromHexString(user._id),
			username: user.username,
			fullname: user.fullname,
			imgUrl: user.imgUrl,
			following: user.following,
			followers: user.followers,
			postIDs: user.postIDs,
			savedPostIDs: user.savedPostIDs
		}
		const collection = await dbService.getCollection('users')
		await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
		return userToSave
	} catch (err) {
		logger.error(`cannot update user ${user._id}`, err)
		throw err
	}
}

async function add(user) {
	try {
		const userToAdd = {
			..._getEmptyCredentials(),
			username: user.username,
			password: user.password,
			fullname: user.fullname,
		}
		const collection = await dbService.getCollection('users')
		await collection.insertOne(userToAdd)
		return userToAdd
	} catch (err) {
		logger.error('cannot insert user', err)
		throw err
	}
}

function _buildCriteria(filterBy) {
	const criteria = {}

	if (filterBy.txt) {
		const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
		criteria.$or = [
			{
				username: txtCriteria,
			},
			{
				fullname: txtCriteria,
			},
		]
	}
	if (filterBy.minBalance) {
		criteria.balance = { $gte: filterBy.minBalance }
	}
	return criteria
}

function _getEmptyCredentials() {
	return {
		username: '',
		password: '',
		fullname: '',
		imgUrl: 'https://res.cloudinary.com/dtkjyqiap/image/upload/v1736627051/44884218_345707102882519_2446069589734326272_n_lutjai.jpg',
		following: [],
		followers: [],
		postIDs: [],
		savedPostIds: []
	}
}