import mongoose from 'mongoose'
import { pick } from 'lodash'

const RoomSchema = mongoose.Schema({
	name: {
		type: String,
		required: true
    },
    owner: String,
    messages: [
        {
            owner: String,
            text: String
        }
    ],
    blocklist: [
        {
            name: String
        }
    ]
});

RoomSchema.methods.toJSON = function() {
	return pick(this, ['name', 'owner', 'messages', 'blocklist']);
}

export default mongoose.model('Room', RoomSchema);