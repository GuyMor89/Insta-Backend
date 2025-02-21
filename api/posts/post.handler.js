import { ObjectId } from "mongodb"

import { dbService } from "../../services/db.service.js"
import { logger } from "../../services/logger.service.js"
import { utilService } from '../../services/util.service.js'
import { userHandler } from "../user/user.handler.js"

export const postHandler = {
    query,
    getByID,
    addPost,
    updatePost
}

async function query(limit, loggedInUser) {
    try {
        const fullLoggedInUser = await userHandler.getById(loggedInUser._id)
        // Determine if a limit was provided
        const hasLimit = limit !== null && limit !== undefined

        const collection = await dbService.getCollection('posts')
        const pipeline = []

        // If a limit is provided, filter posts based on the user's following list.
        if (hasLimit) {
            pipeline.push({
                $match: {
                    "by._id": { $in: fullLoggedInUser.following }
                }
            })
        }

        // Always add a createdAt field (if you still need this for display or other processing)
        pipeline.push({
            $addFields: {
                createdAt: {
                    $toLong: { $toDate: "$_id" }
                }
            }
        })

        // If a limit is provided, sort by creation time. Otherwise, randomize the order.
        if (hasLimit) {
            pipeline.push({
                $sort: { createdAt: -1 }
            })
        } else {
            // Add a random field
            pipeline.push({
                $addFields: { random: { $rand: {} } }
            })
            // Sort documents by the random field
            pipeline.push({
                $sort: { random: 1 }
            })
            // Optionally remove the random field from the output
            pipeline.push({
                $project: { random: 0 }
            })
        }

        // Apply the limit stage if one is provided
        if (hasLimit) {
            pipeline.push({ $limit: Number(limit) })
        }

        const posts = await collection.aggregate(pipeline).toArray()
        return posts
    } catch (err) {
        console.error("Error in query function:", err)
        throw err
    }
}

async function getByID(postID) {
    try {
        const collection = await dbService.getCollection('posts')
        const post = await collection.findOne({ _id: ObjectId.createFromHexString(postID) })
        post.createdAt = post._id.getTimestamp().getTime()

        return post
    } catch (err) {
        logger.error('ERROR: cannot find post')
        throw err
    }
}

async function addPost({ postData, userData }) {
    try {
        const postToAdd = { ..._getEmptyCredentials(), by: { ...userData }, ...postData }

        const collection = await dbService.getCollection('posts')
        const addedPostID = await collection.insertOne(postToAdd)

        const addedPostWithCreatedAt = await getByID(addedPostID.insertedId.toString())

        return addedPostWithCreatedAt
    } catch (err) {
        logger.error('ERROR: cannot add post')
        throw err
    }
}

async function updatePost(postData) {
    try {
        const { _id, ...fieldsToUpdate } = postData
        const collection = await dbService.getCollection('posts')
        await collection.updateOne({ _id: ObjectId.createFromHexString(postData._id) }, { $set: fieldsToUpdate })
        return postData
    } catch (err) {
        logger.error('ERROR: cannot update post')
        throw err
    }
}

function _getEmptyCredentials() {
    return {
        caption: '',
        imgUrl: 'https://res.cloudinary.com/dtkjyqiap/image/upload/v1736627051/44884218_345707102882519_2446069589734326272_n_lutjai.jpg',
        by: [],
        loc: '',
        comments: [],
        likedBy: [],
        tags: []
    }
}
