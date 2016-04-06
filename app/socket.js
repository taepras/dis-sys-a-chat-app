var User = require('../app/models/user');
var Room = require('../app/models/room');

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
				console.log(foundRoom);
				roomObj = foundRoom;
				room = foundRoom.id;
				socket.join(room);
				socket.broadcast.to(room).emit('login', {});
			});
		});

		socket.on('chat-msg', function(msg){
			console.log('incoming: ' + msg);
			msgObj = JSON.parse(msg)
			msgObj.time = Date.now();
			roomObj.local.messages.push(msgObj);
			roomObj.save();
			socket.broadcast.to(room).emit('chat-msg', msg);
		});

		socket.on('typing', function(nickname){
			console.log(nickname + ' is typing...');
			socket.broadcast.to(room).emit('typing', nickname);
		});

		socket.on('disconnect', function(){
			console.log(name + ' disconnected');
			socket.broadcast.to(room).emit('log-out', name);
		});
	});
}
