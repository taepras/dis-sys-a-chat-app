var User = require('../app/models/user');
var Room = require('../app/models/room');
var Helpers = require('./helpers');

module.exports = function(io){
	io.on('connection', function(socket){
		var name = '';
		var room = '';
		var roomObj;

		socket.on('log-in', function(login_json){
			var login = JSON.parse(login_json);
			console.log('"' + login.nickname + '" logged in to room "' + login.room + '"');
			name = login.nickname;
			Room.findOne({ '_id': login.room }, function(err, foundRoom){
				roomObj = foundRoom;
				room = foundRoom.id;
				socket.join(room);
				socket.broadcast.to(room).emit('login', {});
			});
		});

		socket.on('chat-msg', function(msgJSON){
			console.log('incoming: ' + msgJSON);
			msg = JSON.parse(msgJSON)
			msg.time = Date.now();
			roomObj.local.messages.push(msg);
			roomObj.save();
			io.in(room).emit('chat-msg', JSON.stringify(msg));
		});

		socket.on('typing', function(nickname){
			socket.broadcast.to(room).emit('typing', nickname);
		});

		socket.on('disconnect', function(){
			console.log(name + ' disconnected');
			socket.broadcast.to(room).emit('log-out', name);
		});

		socket.on('read', function(readInfoJSON){
			console.log('read: ' + readInfoJSON);
			readInfo = JSON.parse(readInfoJSON)
			User.findOne({'local.username': readInfo.nickname}, function(err, user){
				var roomIndex = Helpers.indexOfRid(user.local.ridJoined, room);
				user.local.ridJoined[roomIndex].nextRead = readInfo.nextRead;
				user.markModified('local.ridJoined');
				user.save();
			})
		});
	});
}
