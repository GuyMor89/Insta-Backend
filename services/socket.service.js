import { logger } from './logger.service.js'
import { Server } from 'socket.io'

var gIo = null

const userData = new Map()

export function setupSocketAPI(http) {
    gIo = new Server(http, {
        cors: {
            origin: '*',
        }
    })

    gIo.on("connection", (socket) => {
        logger.info(`New connected socket [id: ${socket.id}]`)

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected [id: ${socket.id}]`)

            const user = userData.get(socket.id)
            if (user) {
                logger.info(`Removing socket mapping for user ${user.userID}`)
                userData.delete(socket.id)
            }
        })

        socket.on("set-user-socket", (userID) => {
            logger.info(`Setting userID = ${userID} for socket [id: ${socket.id}]`)

            for (const [existingSocketID, data] of userData.entries()) {
                if (data.userID === userID) {
                    logger.info(`Removing old socket [id: ${existingSocketID}] for user ${userID}`)
                    userData.delete(existingSocketID)
                    data.socket.disconnect()
                    break
                }
            }
            userData.set(socket.id, { userID, socket })
        })

        // socket.on("set-room", (room) => {
        //     const user = userData.get(socket.id)
        //     if (!user) return

        //     if (user.rooms.has(room)) return

        //     socket.join(room)
        //     user.rooms.add(room)
        //     logger.info(`User ${user.userID} joined room ${room} [socket.id: ${socket.id}]`)
        // })

        // socket.on("leave-room", (room) => {
        //     const user = userData.get(socket.id)
        //     if (!user) return

        //     if (user.rooms.has(room)) {
        //         socket.leave(room)
        //         user.rooms.delete(room)
        //         logger.info(`User ${user.userID} left room ${room} [socket.id: ${socket.id}]`)
        //     }
        // })

        socket.on("notification-from-socket", (userID) => {

            emitToUser({ type: "notification-from-server", data: 'update', userID })

        })


        socket.on('user-is-typing', ({ user, userID }) => {
            // gIo.to(socket.room).emit('user-is-typing', user)
            broadcast({ type: 'user-is-typing', data: user, room: socket.room, userID })
        })

        socket.on('watch-current-user', userID => {
            logger.info(`user-watch from socket [id: ${socket.id}], on user ${userID}`)
            socket.join(userID)
        })

    })
}

export function emitMessageSent({ messageID, lineToSend }, toUserID) {
    emitToUser({ type: "msg-from-server", data: { messageID, lineToSend }, toUserID })
}

export function emitNotification(activity, toUserID) {
    emitToUser({ type: "notification-from-server", data: activity, toUserID })
}


// function emitTo({ type, data, label }) {
//     if (label) gIo.to(label.toString()).emit(type, data)
//     else gIo.emit(type, data)
// }

async function emitToUser({ type, data, toUserID }) {
    toUserID = toUserID.toString()
    const socket = await _getUserSocket(toUserID)

    if (socket) {
        logger.info(`Emiting event: ${type} to user: ${toUserID} socket [id: ${socket.id}]`)
        socket.emit(type, data)
    } else {
        logger.info(`No active socket for user: ${toUserID}`)
        // _printSockets()
    }
}

// If possible, send to all sockets BUT not the current socket 
// Optionally, broadcast to a room / to all
async function broadcast({ type, data, room = null, userID }) {
    console.log(type, data, room, userID)
    userID = userID?.toString()

    logger.info(`Broadcasting event: ${type}`)
    const excludedSocket = await _getUserSocket(userID)

    console.log('excluded socket', excludedSocket?.id)

    if (room) {
        if (excludedSocket) {
            logger.info(`Broadcast to room ${room} excluding user: ${userID}`)
            excludedSocket.broadcast.to(room).emit(type, data)
        } else {
            logger.info(`Emit to room: ${room}`)
            gIo.to(room).emit(type, data)
        }
    } else {
        if (excludedSocket) {
            logger.info(`Broadcast to all excluding user: ${userID}`)
            excludedSocket.broadcast.emit(type, data)
        } else {
            logger.info(`Emit to all`)
            gIo.emit(type, data)
        }
    }
}

function _getUserSocket(userID) {
    for (const user of userData.values()) {
        if (user.userID === userID) {
            return user.socket
        }
    }
    return null
}


// async function _getUserSocket(userID) {
//     const sockets = await _getAllSockets()
//     const socket = sockets.find(s => s.userID === userID)
//     return socket
// }

// async function _getAllSockets() {
//     // return all Socket instances
//     const sockets = await gIo.fetchSockets()
//     return sockets
// }

async function _printSockets() {
    const sockets = await _getAllSockets()
    console.log(`Sockets: (count: ${sockets.length}):`)
    sockets.forEach(_printSocket)
}
function _printSocket(socket) {
    console.log(`Socket - socketId: ${socket.id} userID: ${socket.userID}`)
}

export const socketService = {
    // set up the sockets service and define the API
    setupSocketAPI,
    // emit to everyone / everyone in a specific room (label)
    // emitTo,
    // emit to a specific user (if currently active in system)
    emitToUser,
    // Send to all sockets BUT not the current socket - if found
    // (otherwise broadcast to a room / to all)
    broadcast,
}
