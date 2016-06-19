/*jslint browser: true, continue: true,
devel: true, indent: 2, maxerr: 50,
newcap: true, nomen: true, plusplus: true,
regexp: true, sloppy: true, vars: false,
white: true
*/
/*global*/

'use strict';

var checkType, 
	constructObj, 
	readObj, 
	readOneObj, 
	updateObj, 
	destroyObj, 
	loadSchema, 
	checkSchema, 
	clearIsOnline, 
	fs = require('fs'), 
	cache = require('./cache'), 
	jsv = require('JSV').JSV, 
	mongodb = require('mongodb'), 
	mongoClient = require('mongodb').MongoClient, 
	db, 
	validator = jsv.createEnvironment(), 
	objTypeMap = {'user': {}};

loadSchema = function ( schema_name, schema_path ) {
	fs.readFile( schema_path, 'utf8', function( err, data ) {
		objTypeMap[ schema_name ] = JSON.parse( data );
	});
};

//JSONスキーマ検証関数
checkSchema = function ( obj_type, obj_map, callback ) {
	var schema_map = objTypeMap[ obj_type ], 
		report_map = validator.validate( obj_map, schema_map );
	
	callback( report_map.errors );
};

clearIsOnline = function () {
	updateObj(
		'user', 
		{ is_online: true }, 
		{ is_online: false }, 
		function ( response_map ) {
			console.log( 'All users set to offline', response_map );
		}
	);
};

checkType = function ( obj_type ) {
	if( !objTypeMap[obj_type] ) {
		return ({
			error_msg: 'Object type "' + obj_type + '" is not supported.'
		});
	}
};

constructObj = function ( obj_type, obj_map, callback ) {
	var type_check_map = checkType( obj_type );
	if( type_check_map ) {
		callback( type_check_map );
		return;
	}
	
	checkSchema(
		obj_type, 
		obj_map, 
		function ( error_list ) {
			if( error_list.length === 0 ) {
				var option_map = {w:1};
					
				db.collection( obj_type ).insert(
					obj_map, 
					option_map, 
					function ( err, result ) {
						callback( result );	
					}
				)
			}else {
				callback({
					error_msg: 'Input document not valid', 
					error_list: error_list
				});
			}
		}
	);
};

readObj = function ( obj_type, find_map, fields_map, callback ) {
	var type_check_map = checkType( obj_type );
	
	if( type_check_map ) {
		callback( type_check_map );
		return;
	}
	
	//サーバーキャッシュが存在すれば利用する
	cache.getValue( find_map, callback, function () {
		db.collection( obj_type ).find(
			find_map
		).toArray(function (err, result) {
			cache.setValue( find_map, result );
			callback( result );
		});
	});
};

readOneObj = function ( obj_type, find_map, fields_map, callback ) {
	var type_check_map = checkType( obj_type );
	
	if( type_check_map ) {
		callback( type_check_map );
		return;
	}
	
	db.collection( obj_type ).findOne(
		find_map, 
		fields_map, 
		function ( err, doc ) {
			callback( doc );
		}	
	);
};

updateObj = function ( obj_type, find_map, set_map, callback ) {
	var type_check_map = checkType( obj_type );
	if( type_check_map ) {
		callback( type_check_map );
		return;
	}
	
	checkSchema(
		obj_type, 
		set_map, 
		function ( error_list ) {
			if( error_list.length === 0 ) {
				db.collection( obj_type ).updateMany(
					find_map, 
					{$set: set_map}, 
					function ( inner_error, update_count ) {
						callback({
							update_count: update_count
						});
					} 
				);
			}else {
				callback({
					error_msg: 'Input document not valid', 
					error_list: error_list
				});
			}
		}
	);
};

destroyObj = function ( obj_type, find_map, callback ) {
	var type_check_map = checkType( obj_type );
	if( type_check_map ) {
		callback( type_check_map );
		return;
	}
	cache.deleteKey( find_map );
	db.collection( obj_type ).remove(
		find_map, 
		option_map, 
		function( err, delete_count ) {
			callback({delete_count: delete_count});
		}
	);
};

module.exports = {
	makeMongoId: mongodb.ObjectID, 
	checkType: checkType, 
	construct: constructObj, 
	read: readObj, 
	readOne: readOneObj, 
	update: updateObj, 
	destroy: destroyObj
};

mongoClient.connect(
	'mongodb://localhost:27017/spa',
	function ( err, mongodb ) {
		console.log( '** Connected to MongoDB **' );
		db = mongodb;
		clearIsOnline();
	}
);

(function () {
	var schema_name, schema_path;
	
	for( schema_name in objTypeMap ) {
		if( objTypeMap.hasOwnProperty( schema_name ) ) {
			schema_path = __dirname + '/' + schema_name + '_schema.json';
			loadSchema( schema_name, schema_path );
		}
	}
}());

