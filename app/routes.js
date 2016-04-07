var User = require('../app/models/user');
var Room = require('../app/models/room');

module.exports = function(app, passport) {

	app.get('/', function(req, res) {
		if(req.isAuthenticated()){
			var joinedRoomsIds = req.user.local.ridJoined;
			Room.find({ '_id': { $in: joinedRoomsIds } }, function(err, rooms){
				res.render('home.ejs', { user : req.user, joinedRooms : rooms });
			});
		}else
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

	app.get('/logout', function(req, res) {
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

		req.user.local.ridJoined.push(rid);
		req.user.local.save();
		res.redirect('/chat/' + rid);
	})

	app.post('/chat/join', isLoggedIn, function(req, res){
		var roomName = req.body.roomname;
		Room.findOne({ 'local.roomName': roomName }, function(err, room){
			if ( !room ) {
				res.redirect('/');
			} else if( req.user.local.ridJoined.indexOf(room.id) >= 0 ) {
				res.redirect('/');
			} else {
				req.user.local.ridJoined.push(room.id);
				req.user.local.save();
				res.redirect('/chat/' + room.id);
			}
		});
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
					} else if( invitee.local.ridJoined.indexOf(room.id) >= 0 ) {
						res.redirect('/');
					} else {
						invitee.local.ridJoined.push(room.id);
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
			if ( room && req.user.local.ridJoined.indexOf(room.id) >= 0 ) {
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
			if ( room && req.user.local.ridJoined.indexOf(room.id) >= 0 ) {
				return res.send(JSON.stringify(room.local.messages));
			} else {
				console.log('forbidden: user did not joined this room.');
				return false;
			}
		});
	});

	app.post('/chat/leave/*', function(req, res){
		var rid = req.params[0];
		User.findOne({ '_id': req.user.id }, function(err, user){
			console.log(rid);
			var roomIndex = user.local.ridJoined.indexOf(rid);
			user.local.ridJoined.splice(roomIndex, 1);
			user.save();
			res.redirect('/');
		});
	});

	app.get('/chat/*', isLoggedIn, function(req, res){
		var rid = req.params[0];
		Room.findOne({ '_id': rid }, function(err, room){
			if ( room && req.user.local.ridJoined.indexOf(room.id) >= 0 )
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
