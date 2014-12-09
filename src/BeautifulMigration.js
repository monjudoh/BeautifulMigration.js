define('BeautifulMigration',
['underscore'],
function (_) {
  /**
   * @version 0.1.0
   * @author monjudoh
   * @copyright <pre>(c) 2013 monjudoh
   * Dual licensed under the MIT (MIT-LICENSE.txt)
   * and GPL (GPL-LICENSE.txt) licenses.</pre>
   * @see https://github.com/monjudoh/BeautifulMigration.js
   *
   * @name BeautifulMigration
   * @param {string} key
   * @constructor
   * @property {string} key
   */
  function BeautifulMigration(key) {
    this.key = key;
  }

  var versionUpOperations = Object.create(null);
  var storageKeyRetriever = function defaultStorageKeyRetriever(key){
    return ['BeautifulMigration',key].join('.');
  };
  /**
   * @callback BeautifulMigration~versionUpOperation
   * @returns {Promise=}
   * @description <pre>バージョンアップ処理。
   * 同期処理の場合は何も返さない。非同期処理の場合はPromiseを返し、非同期処理の完了時にresolveする。</pre>
   */
  /**
   * @name registerVersionUpOperation
   * @memberOf BeautifulMigration
   * @function
   *
   * @param {string} key
   * @param {number} version
   * @param {BeautifulMigration~versionUpOperation} operation
   * @description 指定されたkey,versionにおけるバージョンアップの際に呼ばれる処理を登録する。
   */
  BeautifulMigration.registerVersionUpOperation = function registerVersionUpOperation(key,version,operation){
    if (!versionUpOperations[key]) {
      versionUpOperations[key] = [];
    }
    versionUpOperations[key][version] = operation;
  };
  /**
   * @callback BeautifulMigration~storageKeyRetriever
   * @param {string} key
   * @returns {string} storageKey
   * @description 現在のバージョンをlocalStorageに記録する際に使用するkeyを取得するための関数
   */
  /**
   * @name registerStorageKeyRetriever
   * @memberOf BeautifulMigration
   * @function
   *
   * @param {BeautifulMigration~storageKeyRetriever} retriever
   */
  BeautifulMigration.registerStorageKeyRetriever = function registerStorageKeyRetriever(retriever){
    storageKeyRetriever = retriever;
  };
  function versionUp(key,previousVersion,currentVersion) {
    var storageKey = storageKeyRetriever(key);
    var operations = _.compact(versionUpOperations[key].slice(previousVersion+1,currentVersion+1));
    function updateLocalStorage(){
      localStorage[storageKey] = JSON.stringify(currentVersion);
    }
    operations.push(updateLocalStorage);
    operations.unshift(Promise.resolve());
    var promise = operations.reduce(function(promise,operation){
      var index = versionUpOperations[key].indexOf(operation);
      return promise.then(function done(){
        if (operation !== updateLocalStorage) {
          console.info('versionUp(key,version)', key, index);
        } else {
          console.info('versionUp(key,previousVersion,currentVersion)', key, previousVersion,currentVersion);
        }
      }).then(operation);
    });
    return promise;
  }
  var proto = BeautifulMigration.prototype;
  /**
   * @name migrate
   * @memberOf BeautifulMigration#
   * @function
   *
   * @param {number} currentVersion 現在のバージョン
   * @returns {Promise}
   * @description <pre>現在のバージョンを指定してマイグレーションを行う。
   * localStorageに記録された前回起動時のバージョンと指定された現在のバージョンを比較してマイグレーションを行う。
   * マイグレーションの処理が完了すると戻り値のPromiseのfulfilled callbackが呼ばれる。
   * - 初回起動時
   * -- TODO実装
   * - 同一バージョン時
   * -- 何もしない
   * - バージョンアップ時
   * -- 前回起動時のバージョン+1〜指定された現在のバージョンについてのバージョンアップ処理が呼ばれる。
   * - バージョンダウン時
   * -- TODO実装</pre>
   * @see BeautifulMigration#key
   * @see BeautifulMigration.registerVersionUpOperation
   * @see BeautifulMigration~versionUpOperation
   */
  proto.migrate = function migrate(currentVersion){
    // storageKey
    var storageKey = storageKeyRetriever(this.key);
    var previousVersion = JSON.parse(localStorage[storageKey] || 'null');
    console.log(previousVersion,currentVersion);
    if (previousVersion === null) {
      // 初回起動時処理
      console.info('初回起動時処理');
      localStorage[storageKey] = JSON.stringify(currentVersion);
      return Promise.resolve();
    } else if (currentVersion === previousVersion) {
      // 同一バージョンなので何もしない
      console.info('同一バージョンなので何もしない');
      return Promise.resolve();
    } else if (currentVersion > previousVersion) {
      // バージョンアップ処理
      console.info('バージョンアップ処理');
      return versionUp(this.key,previousVersion,currentVersion);
    } else if (currentVersion < previousVersion) {
      // バージョンダウン処理
      console.info('バージョンダウン処理');
      return Promise.resolve();
    } else {
      // localStorageのデータが何かおかしい
      console.info('localStorageのデータが何かおかしい');
      return Promise.reject();
    }
  };

  return BeautifulMigration;
});