spa.shell = (function () {
    //モジュールスコープ
    var configMap = {
        main_html: String()
            + '<div class="spa-shell-head">'
                + '<div class="spa-shell-head-logo"></div>'
                + '<div class="spa-shell-head-acct"></div>'
                + '<div class="spa-shell-head-search"></div>'
            + '</div>'
            + '<div class="spa-shell-main">'
                + '<div class="spa-shell-main-nav"></div>'
                + '<div class="spa-shell-main-content"></div>'
            + '</div>'
            + '<div class="spa-shell-foot"></div>'
            + '<div class="spa-shell-chat"></div>'
            + '<div class="spa-shell-modal"></div>',
        anchor_schema_map: {
            chat: {
                open: true,
                closed: true
            }
        },
        chat_extend_time: 1000,
        chat_retract_time: 300,
        chat_extend_height: 450,
        chat_retract_height: 15,
        chat_extended_title: 'Click to retract',
        chat_retracted_title: 'Click to extend'
    },
    stateMap = { 
        $container: null,
        anchor_map: null,
        is_chat_retracted: true
    },
    jqueryMap = {},
    copyAnchorMap,
    setJqueryMap,
    toggleChat,
    changeAnchorPart,
    onHashchange,
    onClickChat,
    initModule;
    
    //ユーティリティメソッド
    copyAnchorMap = function () {
        return $.extend( true, {}, stateMap.anchor_map );
    };
    
    //DOMメソッド
    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container,
            $chat: $container.find('.spa-shell-chat')
        };
    };
    
    //チャットスライダーの拡大や格納
    toggleChat = function ( do_extend, callback ) {
        var px_chat_ht = jqueryMap.$chat.height(),
         is_open = px_chat_ht === configMap.chat_extend_height,
         is_closed = px_chat_ht === configMap.chat_retract_height,
         is_sliding = !is_open && !is_closed;
        
        if(is_sliding){return false};
        
        if(do_extend) {
            jqueryMap.$chat.animate(
                {height: configMap.chat_extend_height},
                configMap.chat_extend_height,
                function () {
                    jqueryMap.$chat.attr(
                        'title', configMap.chat_extended_title
                    );
                    stateMap.is_chat_retracted = false;
                    if(callback) { callback(jqueryMap.$chat) }
                }
            );
            return true;
        }
        
        jqueryMap.$chat.animate(
            {height : configMap.chat_retract_height}, 
            function () {
                jqueryMap.$chat.attr(
                    'title', configMap.chat_retracted_title
                );
                stateMap.is_chat_retracted = true;
                if(callback) { callback(jqueryMap.$chat) }
            }
        );
        return true;
    }
    
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
    
    //イベントハンドラー
    //hashchangeイベントを処理する
    onHashchange = function( event ) {
        var anchor_map_previous = copyAnchorMap(),
         anchor_map_proposed,
         _s_chat_previous,
         _s_chat_proposed,
         s_chat_proposed;
         
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
                 case 'open':
                    toggleChat(true);
                    break;
                 case 'closed':
                    toggleChat(false);
                    break;
                 default:
                    toggleChat(false);
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
             }
         }
         return false;
    };
    
    onClickChat = function ( event ) {
        changeAnchorPart({
            chat: ( stateMap.is_chat_retracted ? 'open' : 'closed' )
        });
        return false;
    };
    
    //パブリックメソッド
    initModule = function ($container) {
        stateMap.$container = $container;
        $container.html( configMap.main_html );
        setJqueryMap();
        
        stateMap.is_chat_retracted = true;
        jqueryMap.$chat
            .attr( 'title', configMap.chat_retracted_title )
            .click( onClickChat );
        
        //我々のスキーマを使うようにuriAnchorを設定する
        $.uriAnchor.configModule({
            schema_map : configMap.anchor_schema_map
        });
        
        //機能モジュールを構成して初期化する
        spa.chat.configModule( {} );
        spa.chat.initModule( jqueryMap.$chat );
        
        //URIアンカー変更イベントを処理する
        $(window)
            .bind('hashchange', onHashchange)
            .trigger('hashchange');
    };
    
    return { initModule: initModule };
}());

