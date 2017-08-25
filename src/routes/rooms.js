import express from 'express'
import passport from 'passport'
import Room from '../models/room'
import User from '../models/user'

const router = express.Router();

router.get('/:name', async(req, res, next) => {
    const room = await Room.findOne({name: req.params.name});
    res.json(room);
})

router.get('/:name/messages', async(req, res, next) => {

    const name = req.params.name;

    try {
        const room = await Room.findOne({name: name});

        if (!room) {
            return res.json({success: false, msg: 'Room not found'});
        }

        const messages = room.messages;
        res.json(messages);

    } catch (err) {
        next(err);
    }
})

router.post('', passport.authenticate('jwt', {session: false}), async(req, res, next) => {

    const roomName = req.body.name,
          userName = req.user.name;

    try {
        const exist = await Room.findOne({name: roomName});
        if (exist) {
            return res.json({success: false, msg: 'Room aready exist'});
        }

        const room = new Room(Object.assign({}, req.body, {owner: userName}));
        await room.save();

        await User.findOneAndUpdate({name: userName}, {
            $push: {
                rooms: {
                    name: roomName,
                    owner: userName
                }
            }
        })

        res.status(201).json({success: true, msg: 'Room created', room: room});

    } catch (err) {
        next(err);
    }
})

router.post('/:name/messages', passport.authenticate('jwt', {session: false}), async(req, res, next) => {

    const roomName = req.params.name,
          userName = req.user.name;

    try {
        const room = await Room.findOne({name: roomName})
        if (!room) {
            return res.json({success: false, msg: 'This room no longer exist'});
        }

        await Room.findOneAndUpdate({name: roomName}, {
            $push: {
                messages: {
                    owner: userName,
                    text: req.body.text
                }
            }
        });

        res.json({success: true, msg: 'Message saved', message: {text: req.body.text, owner: userName}});

    } catch (err) {
        next(err);
    }
})

router.post('/:name/blocklist', passport.authenticate('jwt', {session: false}), async(req, res, next) => {

    const name = req.params.name,
          user = req.user.name,
          blockedUser = req.body.name;

    try {
        const room = await Room.findOne({name: name})
        if (!room) {
            return res.json({success: false, msg: 'Room not found'});
        }

        if (room.owner == user) {
            await Room.findOneAndUpdate({name: name}, {
                $push: {
                    blocklist: {
                        name: blockedUser
                    }
                }
            });
        }

        res.json({success: true, msg: `User ${username} added to blocklist`});

    } catch (err) {
        next(err);
    }
})

router.delete('/:name', passport.authenticate('jwt', {session: false}), async(req, res, next) => {

    const roomName = req.params.name,
          userName = req.user.name;

    try {
        const room = await Room.findOne({name: roomName});
        if (!room) return res.json({success:false, msg: 'Room not found'});

        if (room.owner == userName) {
            await Room.findOneAndRemove({name: roomName});
            await User.findOneAndUpdate({name: userName}, {
                $pull: {
                    rooms: {
                        name: roomName
                    }
                }
            })
            res.json({success: true, msg: `Room '${roomName}' deleted`});
        } else {
            res.json({success: false, msg: 'Only the owner can delete the room'})
        }

    } catch(err) {
        next(err);
    }
})

export default router;

