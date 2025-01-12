import { ObjectId } from "mongodb"

import { dbService } from "../../services/db.service.js"
import { logger } from "../../services/logger.service.js"
import { utilService } from '../../services/util.service.js'

export const postHandler = {
    query
}

async function query(filterBy) {
    try {
        const collection = await dbService.getCollection('posts')

        const posts = collection.find().toArray()

        return posts
    } catch (err) {
        logger.error('ERROR: cannot find posts')
        throw err
    }
}