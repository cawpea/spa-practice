/*jslint browser: true, continue: true,
devel: true, indent: 2, maxerr: 50,
newcap: true, nomen: true, plusplus: true,
regexp: true, sloppy: true, vars: false,
white: true
*/
/*global $, spa*/
spa.chat = (function () {
    var configMap = {
        main_html: String()
            + '<div style="padding:1em; color: #FFF;">'
            + 'Say hello to chat'
            + '</div>',
        setting_map: {}
    },
    stateMap = { $container: null },
    jqueryMap = {},
    setJqueryMap,
    configModule,
    initModule;
    
    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = { $container: $container };
    };
    
    /*
    初期化前にモジュールを構成する
    
    引数:
     set_chat_anchor: オープンまたはクローズ状態を示すようにURIアンカーを変更するコールバック。
                      このコールバックは要求された状態を満たせない場合にはfalseを返さなければいけない
     chat_model: インスタントメッセージングとやり取りするメソッドを提供するオブジェクト
     people_model: モデルが保持する人々のリストを管理するメソッドを提供するオブジェクト
    動作:
     指定された引数で内部構成データ構造を更新する
     その他の動作は行わない
    戻り値:
     true
    例外発行:
     受け入れられない引数や欠如した引数ではエラーオブジェクトとスタックトレース。
    */
    configModule = function ( input_map ) {
        spa.util.setConfigMap({
            $input_map: input_map,
            setting_map: configMap.setting_map,
            config_map: configMap
        });
        return false;
    };
    
    /*
    ユーザに機能を提供するようにチャットに指示する
    
    引数:
     $append_target: 1つのDOMコンテナを表すjQueryコレクション
    動作:
     指定されたコンテナにチャットスライダーを付加し、HTMLコンテンツで埋める。
     そして、要素、イベント、ハンドラを初期化し、ユーザにチャットルームインターフェースを提供する。
    戻り値:
     成功時にはtrue, 失敗時にはfalse
    例外発行:
     なし
    */
    initModule = function ( $container ) {
        $container.html( configMap.main_html );
        stateMap.$container = $container;
        setJqueryMap();
        return true;
    };
    
    /*
    チャットスライダーが要求された状態になるようにする
    
    引数:
     position_type: enum('closed', 'opend', 'hidden')
     callback: アニメーションの最後のオプションのコールバック。
    動作:
     スライダーが要求に合致している場合は現在の状態のままにする。
     それ以外の場合はアニメーションを使って要求された状態にする。
    戻り値:
     true: 要求された状態を実現した
     false: 要求された状態を実現していない
    例外発行:
     なし
    */
    
    return {
        configModule: configModule,
        initModule: initModule
    };
}());