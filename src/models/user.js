import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { pick } from 'lodash';

const UserSchema = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	rooms: [
		{
			name: String,
			owner: String,
			_id: false
		}
	]
});


UserSchema.methods.toJSON = function() {
	return pick(this, ['name', 'rooms']);
}

UserSchema.pre('save', function(next) {
	return bcrypt.genSalt(10)
	.then(salt => {
		bcrypt.hash(this.password, salt)
		.then(hash => {
			this.password = hash;
			next();
		})
	})
	.catch(next)
})

export default mongoose.model('User', UserSchema);