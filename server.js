var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

// socket.io stuffs
var http 	 = require('http')
var socketio = require('socket.io');

var configDB = require('./config/database.js');

mongoose.connect(configDB.url);

require('./config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser());

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(session({ secret: 'dischat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport);

var server    = app.listen(port);
var io        = require('socket.io').listen(server);

console.log('The magic happens on port ' + port);

require('./app/socket.js')(io);
