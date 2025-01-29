import { ObjectId } from "mongodb"

export const utilService = {
    makeId,
    getRandomIntInclusive,
    getUserId
}

function makeId(length = 5) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min //The maximum is inclusive and the minimum is inclusive 
}

function getUserId(userID) {
    if (userID instanceof ObjectId) {
        return userID
    } else if (ObjectId.isValid(userID)) {
        return ObjectId.createFromHexString(userID)
    }
}