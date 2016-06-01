/*jslint browser: true, continue: true,
devel: true, indent: 2, maxerr: 50,
newcap: true, nomen: true, plusplus: true,
regexp: true, sloppy: true, vars: false,
white: true
*/
/*global*/

'use strict';

var countUp,
	setWatch,
	watchMap = {},
	http = require('http'), 
	express = require('express'), 
	socketIo = require('socket.io'), 
	fsHandle = require('fs'),
	app = express(), 
	server = http.Server( app ), 
	io = socketIo.listen( server ),
	countIdx = 0;

countUp = function () {
	countIdx++;
	console.log( countIdx );
	io.sockets.send( countIdx );
};

setWatch = function ( url_path, file_type ) {
	console.log( 'setWatch called on ' + url_path );
	
	if( !watchMap[ url_path ] ) {
		console.log( 'setting watch on ' + url_path );
		
		fsHandle.watchFile(
			url_path.slice(1), // url_pathから'/'を取り除く
			function ( current, previous ) {
				console.log( 'file accessed' );
				if( current.mtime !== previous.mtime ) {
					console.log( file_type + ' file changed');
					io.sockets.emit( file_type, url_path );
				}
			}
		);
	}
};

app.configure( function () {
	app.use( function ( request, response, next ) {
		if( request.url.indexOf('/js/') >= 0 ) {
			setWatch( request.url, 'script' );
		}
		else if( request.url.indexOf('/css/') >= 0 ) {
			setWatch( request.url, 'stylesheet' );
		}
		next();
	});
	app.use( express.static( __dirname + '/' ) );
});

app.get( '/', function ( request, response ) {
	response.redirect('/socket.html');
});

io.on('connection', function ( socket ) {
	console.log('---- connection ----');
	socket.broadcast.emit('msg push', countIdx);
});

server.listen( 3000 );
console.log(
	'Express server listening on port %d in %s mode', 
	server.address().port, app.settings.env
);

setInterval( countUp, 1000 );