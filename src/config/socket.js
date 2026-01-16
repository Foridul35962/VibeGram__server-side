import Messages from "../models/Message.model.js"

const userSocket = new Map()

const notifyChatPartners = async (io, userId, online) => {
    const sentTo = await Messages.distinct('receiver', { sender: userId })
    const receivedFrom = await Messages.distinct('sender', { receiver: userId })

    const partners = [...new Set([...sentTo, ...receivedFrom])]

    partners.forEach(partnerId => {
        io.to(`user:${partnerId}`).emit('presence:update', {
            userId,
            online
        })
    })
}

const isUserOnline = (userId) => {
    return userSocket.has(String(userId))
}


const socketHandler = (io) => {
    io.on('connection', (socket) => {
        socket.on('identity', async ({ userId }) => {
            userId = String(userId)

            if (socket.data.userId) return

            socket.data.userId = userId

            socket.join(`user:${userId}`)

            if (!userSocket.has(userId)) {
                userSocket.set(userId, new Set())
            }

            const set = userSocket.get(userId)

            const wasOffline = set.size === 0
            set.add(socket.id)

            const sentTo = await Messages.distinct('receiver', { sender: userId })
            const receivedFrom = await Messages.distinct('sender', { receiver: userId })
            const partners = [...new Set([...sentTo, ...receivedFrom])]

            const onlinePartners = partners.filter(pid => isUserOnline(pid))

            socket.emit('presence:initial', {
                onlineUsers: onlinePartners
            })

            if (wasOffline) {
                notifyChatPartners(io, userId, true)
            }
        })

        socket.on('disconnect', () => {
            const userId = socket.data.userId
            if (!userId) return

            const set = userSocket.get(userId)
            if (!set) return

            set.delete(socket.id)

            if (set.size === 0) {
                userSocket.delete(userId)
                notifyChatPartners(io, userId, false)
            }
        })

        //create room for post
        socket.on('join:post', (postId) => {
            socket.join(`post:${postId}`)
        })

        socket.on('leave:post', (postId) => {
            socket.leave(`post:${postId}`)
        })

        //create room for reel
        socket.on('reel:join', (reelId) => {
            socket.join(`reel:${reelId}`)
        })

        socket.on('reel:leave', (reelId) => {
            socket.leave(`reel:${reelId}`)
        })
    })
}

export default socketHandler