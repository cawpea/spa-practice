/*jslint node: true, continue: true,
 devel: true, indent: 2, maxerr: 50,
 newcap: true, nomen: true, plusplus: true,
 regexp: true, sloppy : true, vars: false,
 white: true
*/
/* global spa */

jsDom = require('jsdom');
global.jQuery = require('jquery');
global.window = jsDom.jsdom().defaultView;
global.TAFFY = require('./js/lib/taffy.js').taffy;
global.window = global.jsDom.jsdom().defaultView;
global.$ = global.jQuery( global.window );
require('./js/jq/jquery.event.gevent.1.js');

global.spa = null;
require('./js/spa.js');
require('./js/spa.util.js');
require('./js/spa.fake.js');
require('./js/spa.data.js');
require('./js/spa.model.js');

spa.initModule();
spa.model.setDataMode('fake');

var $t = $('<div/>');
global.$.gevent.subscribe(
	$t, 'spa-login', 
	function ( event, user ) {
		console.log( 'Login user is:', user );
	}
);

spa.model.people.login('Fred');