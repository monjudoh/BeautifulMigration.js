/*
 * BeautifulMigration.js
 *
 * https://github.com/monjudoh/BeautifulMigration.js
 * version: 0.0.1
 *
 * Copyright (c) 2013 monjudoh
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 */
/**
 * @module BeautifulMigration
 * @version 0.0.1
 * @author monjudoh
 * @copyright (c) 2013 monjudoh<br/>
 * Dual licensed under the MIT (MIT-LICENSE.txt)<br/>
 * and GPL (GPL-LICENSE.txt) licenses.
 * @see https://github.com/monjudoh/BeautifulMigration.js
 * @see BeautifulMigration
 */
define('BeautifulMigration',
['underscore','jquery'],
function (_,$) {
  /**
   * @name BeautifulMigration
   * @param {string} key
   * @constructor
   *
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
   * @returns {promise=}
   * @description バージョンアップ処理。<br/>
   * 同期処理の場合は何も返さない。非同期処理の場合はpromiseを返し、非同期処理の完了時にresolveする。
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
    operations.unshift($.Deferred().resolve().promise());
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
   * @returns {promise}
   * @description 現在のバージョンを指定してマイグレーションを行う。<br/>
   * localStorageに記録された前回起動時のバージョンと指定された現在のバージョンを比較してマイグレーションを行う。<br/>
   * マイグレーションの処理が完了すると戻り値のpromiseのdone callbackが呼ばれる。<br/>
   * - 初回起動時<br/>
   * -- TODO実装<br/>
   * - 同一バージョン時<br/>
   * -- 何もしない<br/>
   * - バージョンアップ時<br/>
   * -- 前回起動時のバージョン+1〜指定された現在のバージョンについてのバージョンアップ処理が呼ばれる。<br/>
   * - バージョンダウン時<br/>
   * -- TODO実装
   * @see BeautifulMigration#key
   * @see BeautifulMigration.registerVersionUpOperation
   * @see BeautifulMigration~versionUpOperation
   */
  proto.migrate = function migrate(currentVersion){
    var dfd = $.Deferred();
    // storageKey
    var storageKey = storageKeyRetriever(this.key);
    var previousVersion = JSON.parse(localStorage[storageKey] || 'null');
    console.log(previousVersion,currentVersion);
    if (previousVersion === null) {
      // 初回起動時処理
      console.info('初回起動時処理');
      localStorage[storageKey] = JSON.stringify(currentVersion);
      dfd.resolve();
    } else if (currentVersion === previousVersion) {
      // 同一バージョンなので何もしない
      console.info('同一バージョンなので何もしない');
      dfd.resolve();
    } else if (currentVersion > previousVersion) {
      // バージョンアップ処理
      console.info('バージョンアップ処理');
      return versionUp(this.key,previousVersion,currentVersion);
    } else if (currentVersion < previousVersion) {
      // バージョンダウン処理
      console.info('バージョンダウン処理');
      dfd.resolve();
    } else {
      // localStorageのデータが何かおかしい
      console.info('localStorageのデータが何かおかしい');
    }
    return dfd.promise();
  };

  return BeautifulMigration;
});