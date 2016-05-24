spa.shell = (function () {
    'use strict';
    
    //モジュールスコープ
    var configMap = {
        main_html: String()
            + '<div class="spa-shell-head">'
                + '<div class="spa-shell-head-logo">'
                    + '<h1>SPA</h1>'
                    + '<p>javascript end to end</p>'
                + '</div>'
                + '<div class="spa-shell-head-acct"></div>'
            + '</div>'
            + '<div class="spa-shell-main">'
                + '<div class="spa-shell-main-nav"></div>'
                + '<div class="spa-shell-main-content"></div>'
            + '</div>'
            + '<div class="spa-shell-foot"></div>'
            + '<div class="spa-shell-modal"></div>',
        anchor_schema_map: {
            chat: {
                opened: true,
                closed: true
            }
        },
        chat_extend_time: 1000,
        chat_retract_time: 300,
        chat_extend_height: 450,
        chat_retract_height: 15,
        chat_extended_title: 'Click to retract',
        chat_retracted_title: 'Click to extend',
        resize_interval: 200
    },
    stateMap = { 
        $container: undefined,
        anchor_map: null,
        resize_idto: undefined
    },
    jqueryMap = {},
    copyAnchorMap,
    setJqueryMap,
    changeAnchorPart,
    onResize,
    onHashchange,
    onTapAcct,
    onLogin,
    onLogout, 
    setChatAnchor,
    initModule;
    
    /*
    ユーティリティメソッド
    */
    copyAnchorMap = function () {
        return $.extend( true, {}, stateMap.anchor_map );
    };
    
    /*
    イベントハンドラ
    */
    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container, 
            $acct: $container.find('.spa-shell-head-acct'), 
            $nav: $container.find('.spa-shell-main-nav')
        };
    };
    
    //URIアンカー要素部分を変更する
    changeAnchorPart = function ( arg_map ) {
        var anchor_map_revise = copyAnchorMap(),
         bool_return = true,
         key_name,
         key_name_dep;
         
         KEYVAL:
         for( key_name in arg_map ) {
             if( arg_map.hasOwnProperty( key_name )) {
                 //反復中に従属キーを飛ばす
                 if( key_name.indexOf( '_' ) === 0 ) {
                     continue KEYVAL;
                 }
                 //独立キー値を更新する
                 anchor_map_revise[key_name] = arg_map[key_name];
                 
                 //合致する独立キーを更新する
                 key_name_dep = '_' + key_name;
                 if( arg_map[key_name_dep] ) {
                     anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                 }else {
                     delete anchor_map_revise[key_name_dep];
                     delete anchor_map_revise['_s' + key_name_dep];
                 }
             }
         }
         //URIの変更開始。成功しなければ元に戻す
         try {
             $.uriAnchor.setAnchor( anchor_map_revise );
         }
         catch( error ) {
             $.urlAnchor.setAnchor( stateMap.anchor_map, null, true );
             bool_return = false;
         }
         return bool_return;
    };
    
    /*
    アンカーのチャットコンポーネントを変更する
    
    引数:
     position_type: 'closed'または'open'
    動作:
     可能ならURIアンカーパラメータ'chat'を要求値に変更する
    戻り値:
     true: 要求されたアンカー部分が更新された
     false: 要求されたアンカー部分が更新されなかった
    例外発行:
     なし
    */
    setChatAnchor = function ( position_type ) {
        return changeAnchorPart({
            chat: position_type
        });
    };
    
    /*
    イベントハンドラ
    */
    //hashchangeイベントを処理する
    onHashchange = function( event ) {
        var _s_chat_previous, 
         _s_chat_proposed,
         s_chat_proposed,
         is_ok = true,
         anchor_map_previous = copyAnchorMap(),
         anchor_map_proposed;
         
         //アンカーの解析を試みる
         try {
             anchor_map_proposed = $.uriAnchor.makeAnchorMap();
         }catch( error ) {
             $.uriAnchor.setAnchor( anchor_map_previous, null, true );
             return false;
         }
         stateMap.anchor_map = anchor_map_proposed;
         
         //便利な変数
         _s_chat_previous = anchor_map_previous._s_chat;
         _s_chat_proposed = anchor_map_proposed._s_chat;
         
         //変更されている場合のチャットコンポーネントの調整開始
         if( !anchor_map_previous || _s_chat_previous !== _s_chat_proposed ) {
             s_chat_proposed = anchor_map_proposed.chat;
             switch( s_chat_proposed ) {
                 case 'opened':
                    is_ok = spa.chat.setSliderPosition('opened');
                    break;
                 case 'closed':
                    is_ok = spa.chat.setSliderPosition('closed');
                    break;
                 default:
                    spa.chat.setSliderPosition('closed');
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
             }
             if( !is_ok ) {
                 if( anchor_map_previous ) {
                     $.uriAnchor.setAnchor( anchor_map_previous, null, true );
                     stateMap.anchor_map = anchor_map_previous;
                 }else {
                     delete anchor_map_previous.chat;
                     $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
                 }
             }
         }
         return false;
    };
    
    onResize = function () {
        if(stateMap.resize_idto) {
            return true;
        }
        spa.chat.handleResize();
        stateMap.resize_idto = setTimeout(function () {
            stateMap.resize_idto = undefined; 
        }, configMap.resize_interval);
        
        return true;
    };
    
    onTapAcct = function( event ) {
        var acct_text,
            user_name,
            user = spa.model.people.get_user();
        
        if( user.get_is_anon() ) {
            user_name = prompt('Please sign-in');
            spa.model.people.login(user_name);
            jqueryMap.$acct.text('... processing ...');
        }
        else {
            spa.model.people.logout();
        }
        return false;
    };
    
    onLogin = function ( event, login_user ) {
        jqueryMap.$acct.text( login_user.name );
    };
    
    onLogout = function ( event, logout_user ) {
        jqueryMap.$acct.text('Please sign-in');
    };
    
    /*
    パブリックメソッド
    */
    
    /*
    ユーザに機能を提供するようにチャットに指示する
    引数:
     $append_target: 1つのDOMコンテナを表すjQueryコレクション
    動作:
     $containerにUIのシェルを含め、機能モジュールを構成して初期化する
    戻り値:
     なし
    例外発行:
     なし
    */
    initModule = function ($container) {
        stateMap.$container = $container;
        $container.html( configMap.main_html );
        setJqueryMap();
        
        //我々のスキーマを使うようにuriAnchorを設定する
        $.uriAnchor.configModule({
            schema_map : configMap.anchor_schema_map
        });
        
        //機能モジュールを構成して初期化する
        spa.chat.configModule({
            set_chat_anchor: setChatAnchor, 
            chat_model: spa.model.chat, 
            people_model: spa.model.people
        });
        spa.chat.initModule( jqueryMap.$container );
        
        spa.avtr.configModule({
            chat_model: spa.model.chat, 
            people_model: spa.model.people
        });
        spa.avtr.initModule( jqueryMap.$nav );
        
        $.gevent.subscribe( $container, 'spa-login', onLogin );
        $.gevent.subscribe( $container, 'spa-logout', onLogout );
        
        jqueryMap.$acct.text('Please sign-in').bind('utap', onTapAcct);
        
        //URIアンカー変更イベントを処理する
        $(window)
            .bind('resize', onResize)
            .bind('hashchange', onHashchange)
            .trigger('hashchange');
    };
    
    return { initModule: initModule };
}());

