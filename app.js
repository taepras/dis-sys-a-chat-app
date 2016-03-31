var express = require('express');
var app 	= express();
var http 	= require('http')
var server	= http.Server(app);
var io 		= require('socket.io')(server);

app.use(express.static('public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/templates/index.html');
});

io.on('connection', function(socket){

	var name = '';
	var room = '';
	// console.log('a user connected');

	socket.on('log-in', function(login_json){
		var login = JSON.parse(login_json);
		console.log('"' + login.nickname + '" logged in to room "' + login.room + '"');
		name = login.nickname;
		room = login.room;
		socket.join(login.room);
		socket.broadcast.to(room).emit('log-in', login.nickname);
	});

	socket.on('chat-msg', function(msg){
		console.log('incoming: ' + msg);
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

server.listen(3000, function(){
	console.log('listening on *:3000');
});
