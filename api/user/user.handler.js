import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

import { ObjectId } from 'mongodb'

export const userHandler = {
	query,
	getById,
	getByUsername,
	getByUsernameWithPosts,
	remove,
	update,
	updateFollow,
	add,
}

async function query(text) {
	try {
		const collection = await dbService.getCollection('users')
		return await collection.find(text ? { username: { $regex: text, $options: 'i' } } : {}).toArray()

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
					},
					savedPostIDs: {
						$ifNull: [
							{
								$map: {
									input: '$savedPostIDs',
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
				$lookup: {
					from: 'posts',
					localField: 'postIDs',
					foreignField: '_id',
					as: 'userPosts'
				}
			},
			{
				$lookup: {
					from: 'posts',
					localField: 'savedPostIDs',
					foreignField: '_id',
					as: 'savedPosts'
				}
			},
			{
				$project: {
					username: 1,
					fullname: 1,
					following: 1,
					followers: 1,
					bio: 1,
					imgUrl: 1,
					postIDs: 1,
					savedPostIDs: 1,
					// Map the userPosts array to return just { _id, url }
					imgUrls: {
						$map: {
							input: '$userPosts',
							as: 'post',
							in: {
								_id: '$$post._id',
								url: '$$post.imgUrl'
							}
						}
					},
					// Map the savedPosts array to return just { _id, url }
					savedImgUrls: {
						$map: {
							input: '$savedPosts',
							as: 'post',
							in: {
								_id: '$$post._id',
								url: '$$post.imgUrl'
							}
						}
					}
				}
			}
		]).toArray();

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
		console.log('updating', user)
		const userToSave = {
			_id: utilService.getUserId(user._id),
			username: user.username,
			fullname: user.fullname,
			imgUrl: user.imgUrl,
			following: user.following,
			followers: user.followers,
			postIDs: user.postIDs,
			savedPostIDs: user.savedPostIDs,
			bio: user.bio
		}
		const collection = await dbService.getCollection('users')
		await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
		return userToSave
	} catch (err) {
		logger.error(`cannot update user ${user._id}`, err)
		throw err
	}
}

async function updateFollow(type, loggedInUser, userToFollowID) {
	try {
		const fullLoggedInUser = await getById(loggedInUser._id)
		const fullUserToFollow = await getById(userToFollowID)

		const followUserToFollow = { following: [...fullLoggedInUser.following, fullUserToFollow._id.toString()] }
		const addLoggedInUserToFollowers = { followers: [...fullUserToFollow.followers, fullLoggedInUser._id.toString()] }

		const unFollowUserToFollow = { following: fullLoggedInUser.following.filter(_id => _id.toString() !== fullUserToFollow._id.toString()) }
		const removeLoggedInUserFromFollowers = { followers: fullUserToFollow.followers.filter(_id => _id.toString() !== fullLoggedInUser._id.toString()) }

		let updatedLoggedInUser
		let updatedUserToFollow

		if (type === 'follow') {
			updatedLoggedInUser = await update({ ...fullLoggedInUser, ...followUserToFollow })
			updatedUserToFollow = await update({ ...fullUserToFollow, ...addLoggedInUserToFollowers })
		}
		else if (type === 'unfollow') {
			updatedLoggedInUser = await update({ ...fullLoggedInUser, ...unFollowUserToFollow })
			updatedUserToFollow = await update({ ...fullUserToFollow, ...removeLoggedInUserFromFollowers })
		}

		const users = { updatedLoggedInUser, updatedUserToFollow }
		return users
	} catch (err) {
		logger.error('cannot update users', err)
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

function _getEmptyCredentials() {
	return {
		username: '',
		password: '',
		fullname: '',
		imgUrl: 'https://res.cloudinary.com/dtkjyqiap/image/upload/v1736627051/44884218_345707102882519_2446069589734326272_n_lutjai.jpg',
		following: [],
		followers: [],
		postIDs: [],
		savedPostIDs: []
	}
}