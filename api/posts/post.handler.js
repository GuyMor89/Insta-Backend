import { ObjectId } from "mongodb"

import { dbService } from "../../services/db.service.js"
import { logger } from "../../services/logger.service.js"
import { utilService } from '../../services/util.service.js'

export const postHandler = {
    query,
    getByID,
    addPost,
    updatePost
}

async function query(limit) {
    try {
        if (limit === null) limit = 0
        const collection = await dbService.getCollection('posts')
        const pipeline = [
            {
                $addFields: {
                    createdAt: {
                        $toLong: { $toDate: "$_id" }
                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]

        if (limit) {
            pipeline.push({ $limit: Number(limit) })
        }

        const posts = await collection.aggregate(pipeline).toArray()


        return posts
    } catch (err) {
        logger.error('ERROR: cannot find posts')
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
