const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const BadWordsFilter = require('bad-words')
const { genMessage, genLocMessage } = require('./utils/messages')
const { addUser, removeUser, getUsersInRoom, getUser } = require('./utils/user')

const port = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New Websocket connection')

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({ id: socket.id, ...options})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', genMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', genMessage('Admin', `Suddenly a wild ${user.username} appears!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        if(!user){
            return callback('No such user')
        }

        const badWords = new BadWordsFilter()

        if(badWords.isProfane(message)){
            return callback('Got fuck yourself with your bad words')
        }

        io.to(user.room).emit('message', genMessage(user.username, message))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', genMessage('Admin', `${user.username} disappears in a puff of smoke!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (pos, callback) => {
        const user = getUser(socket.id)

        if(!user){
            return callback('No such user')
        }

        if(!pos){
            return callback('Browser did not return your location information')
        }
        io.to(user.room).emit('locMessage', genLocMessage(user.username, `http://google.com/maps?q=${pos.lat},${pos.long}`))
        callback()
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
}) 