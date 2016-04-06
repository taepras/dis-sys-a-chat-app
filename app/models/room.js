var mongoose = require('mongoose');

var roomSchema = mongoose.Schema({
	local: {
		rid: Number,
		roomName: String,
		messages: Array
	}
});

module.exports = mongoose.model('Room', roomSchema);
