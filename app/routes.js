var User = require('../app/models/user');
var Room = require('../app/models/room');
var Helpers = require('./helpers');

module.exports = function(app, passport) {

	app.get('/', function(req, res) {
		if(req.isAuthenticated()){
			var joinedRoomsIds = [];
			req.user.local.ridJoined.forEach(function(room){
				joinedRoomsIds.push(room.rid);
			});
			Room.find({ '_id': { $in: joinedRoomsIds } }, function(err, rooms){
				for(var i = 0; i < rooms.length; i++){
					var roomIndex = Helpers.indexOfRid(req.user.local.ridJoined, rooms[i].id);
					rooms[i].unreadCount = rooms[i].local.messages.length - req.user.local.ridJoined[roomIndex].nextRead;
				}
				res.render('home.ejs', { user : req.user, joinedRooms : rooms });
			});
		} else
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/',
		failureRedirect : '/',
		failureFlash : true
	}));

	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	app.get('/logout', isLoggedIn, function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.post('/chat/create', isLoggedIn, function(req, res){
		var roomName = req.body.roomname;
		var room = new Room();
		room.local.roomName = roomName;
		room.save(function (err) {
			if (err)
			console.log(err);
			else
			console.log('room "' + roomName + '" created with ID: ' + rid + '.');
		});

		var rid = room.id;

		req.user.local.ridJoined.push({
			rid: rid,
			nextRead: 0
		});
		req.user.local.save();
		res.redirect('/chat/' + rid);
	})

	app.post('/chat/join', isLoggedIn, function(req, res){
		var roomName = req.body.roomname;
		Room.findOne({ 'local.roomName': roomName }, function(err, room){
			if ( !room ) {
				res.redirect('/');
			} else if( Helpers.indexOfRid(req.user.local.ridJoined, room.id) >= 0 ) {
				res.redirect('/');
			} else {
				req.user.local.ridJoined.push(room.id);
				req.user.local.save();
				res.redirect('/chat/' + room.id);
			}
		});

		req.user.local.ridJoined.push({
			rid: rid,
			nextRead: 0
		});
		req.user.local.save();
	})

	app.post('/chat/invite/*', isLoggedIn, function(req, res){
		var rid = req.params[0];
		var invitee = req.body.username;
		User.findOne({ 'local.username': invitee }, function(err, invitee){
			if ( !invitee ) {
				res.redirect('/');
			} else {
				Room.findOne({ '_id': rid }, function(err, room){
					if ( !room ) {
						res.redirect('/');
					} else if( Helpers.indexOfRid(invitee.local.ridJoined, room.id) >= 0 ) {
						res.redirect('/');
					} else {
						invitee.local.ridJoined.push({
							rid: rid,
							nextRead: 0
						});
						invitee.local.save();
						res.redirect('/chat/' + room.id);
					}
				});
			}
		});

	})

	app.get('/chat/message/*/start/*', isLoggedIn, function(req, res){
		var rid = req.params[0];
		var start = req.params[1];
		Room.findOne({ '_id': rid }, function(err, room){
			if ( room && Helpers.indexOfRid(req.user.local.ridJoined, room.id) >= 0 ) {
				console.log(room.local.messages.slice(start));
				return res.send(JSON.stringify(room.local.messages.slice(start)));
			} else {
				console.log('forbidden: user did not joined this room.');
				return false;
			}
		});
	});

	app.get('/chat/message/*', isLoggedIn, function(req, res){
		console.log("!");
		var rid = req.params[0];
		Room.findOne({ '_id': rid }, function(err, room){
			if ( room && Helpers.indexOfRid(req.user.local.ridJoined, room.id) >= 0 ) {
				return res.send(JSON.stringify(room.local.messages));
			} else {
				console.log('forbidden: user did not joined this room.');
				return false;
			}
		});
	});

	app.post('/chat/leave/*', isLoggedIn, function(req, res){
		var rid = req.params[0];
		var roomIndex = Helpers.indexOfRid(req.user.local.ridJoined, rid);
		req.user.local.ridJoined.splice(roomIndex, 1);
		req.user.save();
		res.redirect('/');
	});

	app.get('/chat/*', isLoggedIn, function(req, res){
		var rid = req.params[0];
		Room.findOne({ '_id': rid }, function(err, room){
			if ( room && Helpers.indexOfRid(req.user.local.ridJoined, room.id) >= 0 )
				res.render('chat.ejs', { room: room, user: req.user });
			else {
				console.log('forbidden: user did not joined this room.');
				res.redirect('/');
			}
		});
	})
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
	return next();
	else
	res.redirect('/');
}
