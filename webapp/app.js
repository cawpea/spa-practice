/*jslint browser: true, continue: true,
devel: true, indent: 2, maxerr: 50,
newcap: true, nomen: true, plusplus: true,
regexp: true, sloppy: true, vars: false,
white: true
*/
/*global*/

/*** not use connect ***/
// var http, server;

// http = require('http');
// server = http.createServer( function (request, response) {
//     var response_text = request.url === '/test' ? 'you have hit the test page' : 'Hello world';
//     console.log( request );
//     response.writeHead( 200, {'Content-Type': 'text/plain'} );
//     response.end( response_text );
// }).listen(3000);

// console.log('Listening on port %d', server.address().port);

/*** use connect ***/
// var connectHello, server, 
//     http = require('http'), 
//     connect = require('connect'),
//     connectLogger = require('connect-logger'),
//     app = connect(), 
//     bodyText = 'Hello Connect';
    
// connectHello = function ( request, response, next ) {
//     response.setHeader( 'content-length', bodyText.length );
//     response.end( bodyText );
// };
// app
//     .use( connectLogger() )
//     .use( connectHello );
// server = http.createServer( app );

// server.listen( 3000 );
// console.log( 'Listening on port %d', server.address().port );

/*** use express ***/
'use strict';

var http = require('http'), 
    express = require( 'express' ), 
    routes = require('./routes'), 
    app = express(), 
    server = http.createServer( app );

//サーバー構成
app.configure( function () {
    app.use( express.bodyParser() );
    app.use( express.methodOverride() );
    app.use( express.basicAuth( 'user', 'spa' ) );
    app.use( express.static( __dirname + '/public' ) );
    app.use( app.router );
});
app.configure( 'development', function () {
    app.use( express.logger() );
    app.use( express.errorHandler({
        dumpExceptions: true, 
        showStack: true
    }) );
});
app.configure( 'production', function () {
    app.use( express.errorHandler() ); 
});

routes.configRoutes( app, server );

server.listen( 3000 );
console.log(
    'Express server listening on port %d in %s mode', 
    server.address().port, app.settings.env
);
