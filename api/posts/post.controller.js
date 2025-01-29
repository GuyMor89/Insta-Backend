import exp from "constants"
import { logger } from "../../services/logger.service.js"
import { postHandler } from "./post.handler.js"
import { userHandler } from "../user/user.handler.js"

export async function getPosts(req, res) {
    try {
        const { limit } = req.query
        const posts = await postHandler.query(limit)
        res.json(posts)
    } catch (err) {
        logger.error('Failed to get posts', err)
        res.status(500).send({ err: 'Failed to get posts' })
    }
}

export async function getPost(req, res) {
    try {
        const { id: postID } = req.params
        const post = await postHandler.getByID(postID)
        res.json(post)
    } catch (err) {
        logger.error('Failed to get post', err)
        res.status(500).send({ err: 'Failed to get post' })
    }
}

export async function addPost(req, res) {
    try {
        const postData = req.body
        const userData = req.loggedInUser
        const addedPost = await postHandler.addPost({ postData, userData })

        const fullUser = await userHandler.getById(req.loggedInUser._id)
        await userHandler.update({ ...fullUser, postIDs: [...fullUser.postIDs, addedPost._id] })

        res.json(addedPost)
    } catch (err) {
        logger.error('Failed to add post', err)
        res.status(500).send({ err: 'Failed to add post' })
    }
}

export async function updatePost(req, res) {
    try {
        const postData = req.body
        const updatedPost = await postHandler.updatePost(postData)
        res.json(updatedPost)
    } catch (err) {
        logger.error('Failed to update post', err)
        res.status(500).send({ err: 'Failed to update post' })
    }
}