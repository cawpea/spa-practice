/*
チャットメッセージングを提供するモジュール
*/

/*jslint browser: true, continue: true,
devel: true, indent: 2, maxerr: 50,
newcap: true, nomen: true, plusplus: true,
regexp: true, sloppy: true, vars: false,
white: true
*/
/*global*/

'use strict';

var emitUserList,
	signIn, 
	signOut, 
	chatObj,
	socket = require('socket.io'), 
	crud = require('./crud'), 
	makeMongoId = crud.makeMongoId, 
	chatterMap = {};
	
emitUserList = function (io) {
	crud.read(
		'user',
		{ is_online: true }, 
		{}, 
		function ( result_list ) {
			io.of('/chat')
				.emit( 'listchange', result_list );
		}
	);	
};

signIn = function ( io, user_map, socket ) {
	crud.update(
		'user', 
		{ '_id': user_map._id }, 
		{ is_online: true },
		function ( result_map ) {
			emitUserList( io );
			user_map.is_online = true;
			socket.emit( 'userupdate', user_map );
		}
	);
};

signOut = function ( io, user_id ) {
	crud.update(
		'user',
		{ '_id': user_id }, 
		{ is_online: false }, 
		function ( result_list ) {
			emitUserList( io );
		}
	);
	delete chatterMap[ user_id ];
};

chatObj = {
	connect: function ( server ) {
		console.log('**** CONNECT ****');
		var io = socket.listen( server );
		
		io.of('/chat')
			.on('connection', function ( socket ) {
				
				/*
				/adduser/メッセージハンドラ開始
				
				概要： サインイン機能を提供する
				引数： 1つのuser_mapオブジェクト
					user_mapは以下のプロパティを持つべき
					 name = ユーザの名前
					 cid = クライアントID
				動作：
					指定のユーザ名を持つユーザがMongoDBにすでに存在する場合は、
					既存のユーザオブジェクトを使い、他の入力は無視する。
					指定のユーザ名を持つユーザがMongoDBに存在しない場合には、
					ユーザオブジェクトを作成してそれを使う。
					送信者に「userupdate」メッセージを送信し、
					ログインサイクルを完了できるようにする。
					クライアントIDを戻し、クライアントがユーザを関連付けられるようにするが、
					MongoDBには格納しない。
					ユーザをオンラインとしてマークし、「adduser」メッセージを発行した
					クライアントを含めた全クライアントに更新されたオンラインユーザリストを配信する。
				*/
				socket.on( 'adduser', function ( user_map ) {
					console.log('***** adduser *****');
					crud.read(
						'user', 
						{ name: user_map.name }, 
						{}, 
						function ( result_list ) {
							console.log( result_list.length + '¥n¥n' );
							var result_map, 
								cid = user_map.cid;
								
							delete user_map.cid;
							
							//指定の名前を持つ既存ユーザを使う
							if( result_list.length > 0 ) {
								console.log('** 既存ユーザ **');
								result_map = result_list[0];
								result_map.cid = cid;
								chatterMap[ result_map._id ] = socket; //書籍に記載はないけど、多分必要。
								signIn( io, result_map, socket );
							}
							else {
								console.log('** 新規ユーザ **');
								user_map.is_online = true;
								crud.construct(
									'user', 
									user_map, 
									function ( result_list ) {
										if( result_list === undefined || result_list.length === 0 ) {
											console.log('*** result_list = %s, cid = %s ***', result_list, cid);
										}
										result_map = result_list[0];
										result_map.cid = cid;
										chatterMap[ result_map._id ] = socket;
										socket.user_id = result_map._id;
										socket.emit( 'userupdate', result_map );
										emitUserList( io );
									}	
								);
							}
						}	
					);
				});
				
				/*
				/updatechat/メッセージハンドラ開始
				概要：チャットのメッセージを処理する。
				引数：１つのchat_mapオブジェクト
				 chat_mapは以下のプロパティを持つべき。
				  dest_id = 受信者のID
				  dest_name = 受信者の名前
				  sender_id = 送信者のID
				  msg_text = メッセージテキスト
				*/
				socket.on('updatechat', function ( chat_map ) {
					console.log('**** updatechat ****');
					if( chatterMap.hasOwnProperty( chat_map.dest_id ) ) {
						chatterMap[ chat_map.dest_id ]
							.emit( 'updatechat', chat_map )
					}
					else {
						socket.emit( 'updatechat', {
							sender_id: chat_map.sender_id, 
							msg_text: chat_map.dest_name + ' has gone offline.'
						});
					}
				});
				
				socket.on('leavechat', function () {
					console.log('** user %s logged out **', socket.user_id );
					signOut( io, socket.user_id );	
				});
				
				socket.on('disconnect', function () {
					console.log('** user %s closed browser window or tab **', socket.user_id);
					signOut( io, socket.user_id );		
				});
				
				/*
				/updateavatar/メッセージハンドラ開始
				概要：アバターのクライアント更新に対処する
				引数：１つのavtr_mapオブジェクトavtr_mapは以下のプロパティを持つべき。
				　person_id = 更新するユーザアバターのID
				　css_map = 上端、左端、背景色のcssマッップ
				動作：
				　このハンドラはMongoDBのエントリを更新し、全クライアントに修正したユーザリストを配信する。
				*/
				socket.on('updateavatar', function ( avtr_map ) {
					crud.update(
						'user', 
						{'_id': makeMongoId( avtr_map.person_id )}, 
						{ css_map: avtr_map.css_map }, 
						function ( result_list ) {
							emitUserList( emitUserList( io ) );
						}
					);
				});
			}
		);
		
		return io;
	}
};

module.exports = chatObj;