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

var makePeopleStr,
	onLogin,
	onListchange,
	onSetchatee,
	onUpdatechat,
	onLogout,
	//テスト関数
	testInitialState,
	loginAsFred,
	testUserAndPeople,
	testWilmaMsg,
	sendPebblesMsg,
	testMsgToPebbles,
	testPebblesResponse,
	updatePebblesAvtr,
	testPebblesAvtr,
	logoutAsFred,
	testLogoutState,
	//イベントハンドラ
	loginEvent,
	changeEvent,
	chateeEvent,
	msgEvent,
	logoutEvent,
	loginData,
	changeData,
	msgData,
	chateeData,
	logoutData,
	//インデックス
	changeIdx = 0,
	chateeIdx = 0,
	msgIdx = 0,
	//繰延オブジェクト
	$deferLogin = new $.Deferred,
	$deferChangeList = [new $.Deferred],
	$deferChateeList = [new $.Deferred],
	$deferMsgList = [new $.Deferred],
	$deferLogout = new $.Deferred;

//オンラインユーザ名の文字列を作成するユーティリティ
makePeopleStr = function( people_db ) {
	var people_list = [];
	people_db().each(function( person, idx ) {
		people_list.push( person.name );
	});
	return people_list.sort().join(',');
};

//「spa-login」のイベントハンドラ
onLogin = function( event, arg ) {
	loginEvent = event;
	loginData = arg;
	$deferLogin.resolve();
}

//「spa-listchange」のイベントハンドラ
onListchange = function( event, arg ) {
	changeEvent = event;
	changeData = arg;
	$deferChangeList[ changeIdx ].resolve();
	changeIdx++;
	$deferChangeList[ changeIdx ] = new $.Deferred;
};

//「spa-updatechat」のイベントハンドラ
onUpdatechat = function ( event, arg ) {
	msgEvent = event;
	msgData = arg;
	$deferMsgList[ msgIdx ].resolve();
	msgIdx++;
	$deferMsgList[ msgIdx ] = new $.Deferred;
};

//「spa-setchatee」のイベントハンドラ
onSetchatee = function ( event, arg ) {
	chateeEvent = event;
	chateeData = arg;
	$deferChateeList[ chateeIdx ].resolve();
	chateeIdx++;
	$deferChateeList[ chateeIdx ] = new $.Deferred();
};

//「spa-logout」のイベントハンドラ
onLogout = function( event, arg ) {
	logoutEvent = event;
	logoutData = arg;
	$deferLogout.resolve();
};

testInitialState = function( test ) {
	var $t,
		user,
		people_db,
		test_str;

	test.expect(2);

	//SPAを初期化する
	spa.initModule( null );
	spa.model.setDataMode( 'fake' );

	//jQueryオブジェクトを作成する
	$t = $('<div/>');

	//グローバルカスタムイベントに関数を登録する
	global.$.gevent.subscribe( $t, 'spa-login', onLogin );
	global.$.gevent.subscribe( $t, 'spa-listchange', onListchange );
	global.$.gevent.subscribe( $t, 'spa-setchatee', onSetchatee );
	global.$.gevent.subscribe( $t, 'spa-updatechat', onUpdatechat );
	global.$.gevent.subscribe( $t, 'spa-logout', onLogout );

	//初期状態でユーザをテストする
	user = spa.model.people.get_user();
	test_str = 'user is anonymous';
	test.ok( user.get_is_anon(), test_str );

	//オンラインユーザリストをテストする
	test_str = 'expected user only contains anonymous';
	people_db = spa.model.people.get_db();
	people_str = makePeopleStr( people_db );
	test.ok( people_str === 'anonymous', test_str );

	//ブロックせずに次のテストに進む
	test.done();
};

loginAsFred = function( test ) {
	var user,
		people_db,
		people_str,
		test_str;

	test.expect(6);

	//「Fred」としてログインする
	spa.model.people.login( 'Fred' );
	test_str = 'log in as Fred';
	test.ok( true, test_str );

	//ログインが完了する前にユーザ属性をテストする
	user = spa.model.people.get_user();
	test_str = 'user is no longer anonymous';
	test.ok( !user.get_is_anon(), test_str );

	test_str = 'user name is "Fred"';
	test.ok( !user.id, test_str );

	test_str = 'user id is undefined as login is incomplete';
	test.ok( !user.id, test_str );

	test_str = 'user cid is c0';
	test.ok( user.cid === 'c0', test_str );

	test_str = 'user list is as expected';
	people_db = spa.model.people.get_db();
	people_str = makePeopleStr( people_db );
	test.ok( people_str === 'Fred,anonymous', test_str );

	//以下の両方の条件を満たしたら次のテストに進む
	// + ログインが完了している（spa-loginイベント）
	// + オンラインユーザリストが更新されている（spa-listchangeイベント）
	$.when( $deferLogin, $deferChangeList[0] ).then( test.done );
};

testUserAndPeople = function( test ) {
	var user,
		cloned_user,
		people_db,
		people_str,
		user_str,
		test_str;

	test.expect(4);

	//ユーザ属性をテストする
	test_str = 'login as Fred complete';
	test.ok( true, test_str );

	user = spa.model.people.get_user();
	test_str = 'Fred has expected attributes';

	cloned_user = $.extend( {}, user );

	delete cloned_user.___id;
	delete cloned_user.___s;
	delete cloned_user.get_is_anon;
	delete cloned_user.get_is_user;

	test.deepEqual(
		cloned_user,
		{
			cid: 'id_5',
			css_map: { top: 25, left: 25, 'background-color': '#8f8' },
			id: 'id_5',
			name: 'Fred'
		},
		test_str
	);

	//オンラインユーザリストをテストする
	test_str = 'receipt of listchange complete';
	test.ok( true, test_str );

	people_db = spa.model.people.get_db();
	people_str = makePeopleStr( people_db );
	user_str = 'Betty,Fred,Mika,Pebbles,Wilma';
	test_str = 'user list provided is expected - ' + user_str;

	test.ok( people_str === user_str, test_str );

	/*
	以下の両方の条件を満たしたら次のテストに進む
	 + 最初のメッセージを受信している（spa-updatechatイベント）
	 + チャット相手が変更されている（spa-setchateeイベント）
	*/
	$.when( $deferMsgList[0], $deferChateeList[0] )
		.then( test.done );
};

testWilmaMsg = function ( test ) {
	var test_str;
	test.expect(4);

	//「Wilma」から受信したメッセージをテストする
	test_str = 'Message is as expected';
	test.deepEqual(
		msgData,
		{
			dest_id: 'id_5',
			dest_name: 'Fred',
			sender_id: 'id_04',
			msg_text: 'Hi there Fred! Wilma here.'
		},
		test_str
	);

	//チャット相手属性をテストする
	test.ok( chateeData.new_chatee.cid === 'id_04' );
	test.ok( chateeData.new_chatee.id === 'id_04' );
	test.ok( chateeData.new_chatee.name === 'Wilma' );

	test.done();
};

sendPebblesMsg = function ( test ) {
	var test_str, chatee;
	test.expect(1);

	//「Pebbles」にset_chateeする
	spa.model.chat.set_chatee( 'id_03' );

	//「Pebbles」にsend_msgする
	spa.model.chat.send_msg( 'whats up, tricks?' );

	//get_chatee()の結果をテストする
	chatee = spa.model.chat.get_chatee();
	test_str = 'Chatee is as expected';
	test.ok( chatee.name === 'Pebbles', test_str );

	/*
	以下の両方の条件を満たしたら次のテストに進む
	 + チャット相手が設定されている（spa-setchateeイベント）
	 + メッセージが送信されている（spa-updatechatイベント）
	*/
	$.when( $deferMsgList[1], $deferChateeList[1] )
		.then( test.done );
};

testMsgToPebbles = function ( test ) {
	var test_str;
	test.expect(2);

	//チャット相手属性をテストする
	test_str = 'Pebbles is the chatee name';
	test.ok(
		chateeData.new_chatee.name === 'Pebbles',
		test_str
	);

	//送信されたメッセージをテストする
	test_str = 'message change is as expected';
	test.ok( msgData.msg_text === 'whats up, tricks?', test_str );

	/*
	以下の場合に次のテストに進む
	 + 「Pebbles」から応答を受信している（spa-updatechatイベント）
	*/
	$deferMsgList[ 2 ].done( test.done );
};

testPebblesResponse = function ( test ) {
	var test_str;
	test.expect(1);

	//「Pebbles」から受信したメッセージをテストする
	test_str = 'Message is as expected';
	test.deepEqual(
		msgData,
		{
			dest_id: 'id_5',
			dest_name: 'Fred',
			sender_id: 'id_03',
			msg_text: 'Thanks for the note, Fred'
		},
		test_str
	);

	test.done();
};

var testAcct = function( test ) {
	var $t,
		test_str,
		user,
		on_login,
		$defer = new $.Deferred;


	//見込まれるテスト数を設定する
	test.expect(1);

	//「spa-login」イベントハンドラを定義する
	on_login = function () { $defer.resolve(); };

	//初期化
	spa.initModule( null );
	spa.model.setDataMode('fake');

	var $t = $('<div/>');
	global.$.gevent.subscribe(
		$t, 'spa-login', on_login
	);

	spa.model.people.login('Fred');

	//ユーザが匿名ではなくなっていることを確認する
	user = spa.model.people.get_user();
	test_str = 'user is no longer anonymous';
	test.ok( !user.get_is_anon(), test_str );

	//サインインが完了したら終了を宣言する
	$defer.done( test.done );
};

updatePebblesAvtr = function( test ) {
	test.expect(0);

	//update_avatarメソッドを呼び出す
	spa.model.chat.update_avatar({
		person_id: 'id_03',
		css_map: {
			'top': 10,
			'left': 100,
			'background-color': '#FF0'
		}
	});

	//以下の場合に次のテストに進む
	// + オンラインユーザリストが更新されている（spa-listchangeイベント）
	$deferChangeList[1].done( test.done );
};

testPebblesAvtr = function( test ) {
	var chatee,
		test_str;

	test.expect(1)

	//get_chateeメソッドを使って「Pebbles」パーソンオブジェクトを取得する
	chatee = spa.model.chat.get_chatee();

	//「Pebbles」のアバター詳細をテストする
	test_str = 'avatar details updated';
	test.deepEqual(
		chatee.css_map,
		{
			'top': 10,
			'left': 100,
			'background-color': '#FF0'
		},
		test_str
	);

	//ブロックせずに次のテストに進む
	test.done();
};

logoutAsFred = function( test ) {
	test.expect(0);

	//Fredとしてログアウトする
	spa.model.people.logout( true );

	//以下の場合に次のテストに進む
	// + ログアウトが完了している（spa-logoutイベント）　
	$deferLogout.done( test.done );
};

testLogoutState = function( test ) {
	var user,
		people_db,
		people_str,
		user_str,
		test_str;

	test.expect( 4 );

	test_str = 'logout as Fred complete';
	test.ok( 4 );

	//オンラインユーザリストをテストする
	people_db = spa.model.people.get_db();
	people_str = makePeopleStr( people_db );
	user_str = 'anonymous';
	test_str = 'user list provided is expected - ' + user_str;
	test.ok( people_str === 'anonymous', test_str );

	//ユーザ属性をテストする
	user = spa.model.people.get_user();
	test_str = 'current user is anonymous after logout';
	test.ok( user.get_is_anon(), test_str );
	test.ok( true, 'test complete' );

	test.done();
};

module.exports = {
	testInitialState: testInitialState,
	loginAsFred: loginAsFred,
	testUserAndPeople: testUserAndPeople,
	testWilmaMsg: testWilmaMsg,
	sendPebblesMsg: sendPebblesMsg,
	testMsgToPebbles: testMsgToPebbles,
	testPebblesResponse: testPebblesResponse,
	updatePebblesAvtr: updatePebblesAvtr,
	logoutAsFred: logoutAsFred,
	testLogoutState: testLogoutState
};
