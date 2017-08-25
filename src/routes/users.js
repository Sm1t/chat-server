import express from 'express'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import bcrypt from 'bcryptjs';
import config from '../config/index'
import User from '../models/user'
import Room from '../models/room'

const router = express.Router();

router.get('', passport.authenticate('jwt', {session: false}), async(req, res, next) => {
	res.json({name: req.user.name});
})

router.get('/rooms', passport.authenticate('jwt', {session: false}), async(req, res, next) => {
	try {
		const rooms = (await User.findOne({name: req.user.name})).rooms;
		
		res.json(rooms);

	} catch (err) {
		next(err);
	}
})

router.delete('/rooms/:name', passport.authenticate('jwt', {session: false}), async(req, res, next) => {

	const userName = req.user.name,
		  roomName = req.params.name;

	try {
		
		const user = await User.findOneAndUpdate({name: userName}, {
			$pull: {
				rooms: {
					name: roomName
				}
			}
		});

		res.json({success: true, msg: 'The room is abandoned'});

	} catch (err) {
		next(err);
	}

})

router.post('/rooms', passport.authenticate('jwt', {session: false}), async(req, res, next) => {

	const userName = req.user.name,
		  roomName = req.body.name;

    try {
        const room = await Room.findOne({name: roomName})
        if (!room) {
            return res.json({success: false, msg: 'Room not found'});
		}

		if (room.owner == userName) {
			return res.json({success: false, msg: 'You are the owner of this room'})
		}
		
		const currentUserRooms = (await User.findOne({name: userName})).rooms;
		
		currentUserRooms.forEach(room => {
			if (room.name == roomName) {
				return res.json({success: false, msg: 'Room already added'})
			}
		});

		await User.findOneAndUpdate({name: userName}, {
			$push: {
				rooms: {
					name: room.name,
					owner: room.owner
				}
			}
		});

        res.json({success: true, msg: 'Room added'});

    } catch (err) {
        next(err);
    }
})

router.post('', async(req, res, next) => {

    const name = req.body.name
    const exist = await User.findOne({name: name});
    
	if (exist) return res.json({success: false, msg: 'User already exist'});

	try {
		const user = new User(req.body);
		user.save();

		const token = jwt.sign({name}, config.secret, {expiresIn: 604800});
        res.status(201).json(Object.assign({}, user.toJSON(), {token: 'JWT ' + token}));
        
	} catch(err) {
		next(err);
	}
})

router.post('/auth', async(req, res, next) => {
	const userName = req.body.name,
		  password = req.body.password;

	try {
		const user = await User.findOne({name: userName});

		if (!user) return res.json({success: false, msg: "User not found"});

		if (await bcrypt.compare(password, user.password)) {
			const token = jwt.sign({name: userName}, config.secret, {expiresIn: 604800});
			res.json(Object.assign({}, user.toJSON(), {token: 'JWT ' + token}));
		} else {
			res.json({success: false, msg: 'Incorrect password'});
		}

	} catch (err) {
		next(err);
	}
})

export default router;

