import http from 'http'
import path from 'path'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import Socketio from 'socket.io'
import mongoose from 'mongoose'
import passport from 'passport'
import Promise from 'bluebird'
import Passport from './config/passport'
import config from './config/index'
import users from './routes/users'
import rooms from './routes/rooms'

const app = express();
const server = http.createServer(app);
const PORT = config.port;

Passport(passport);

app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

// connect to Database
mongoose.Promise = Promise;
let promise = mongoose.connect(config.database);
promise.then(err => {
    if (err) {
        console.log(err);
    } else {
        console.log('connected to database ' + config.database);
    }
})

//app.use('/dist', express.static(__dirname + '/dist'));

app.get('/', (req, res, next) => {
    res.send('/')
    //res.sendFile(path.resolve(__dirname, './index.html'));
})

// routes
app.use('/users', users);
app.use('/rooms', rooms);

// error-handling middlewares
app.use((req, res, next) => {
	return res.status(404).json({msg: '404 Not Found'});
})

app.use((err, req, res, next) => {
	console.log(err);
	return res.status(500).json({success: false, msg: err.name});
})

const io = Socketio(server);
io.on('connection', function(socket) {
    let room = '';

    socket.join(room);

	socket.on('change-room', (newRoom) => {
		socket.leave(room);
		socket.join(newRoom);
		room = newRoom;
    })

    socket.on('message', (message) => {
        socket.broadcast.to(room).emit('message', message);
    })

    socket.on('room-deleted', roomName => {
        socket.broadcast.emit('room-deleted', roomName);
    })
})


server.listen(PORT, () => {
    console.log(`listen on ${PORT}`)
})