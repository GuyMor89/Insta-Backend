import { logger } from "../../services/logger.service.js"
import { postHandler } from "./post.handler.js"

export async function getPosts(req, res) {
    try {
        const posts = await postHandler.query(req.query)
        res.json(posts)
    } catch (err) {
        logger.error('Failed to get posts', err)
        res.status(500).send({ err: 'Failed to get posts' })
    }
}

