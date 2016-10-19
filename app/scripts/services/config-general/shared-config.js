
/**
 * @ngdoc service
 * @name fhirCapacityApp.SharedConfig
 * @description Get and store config object in local storage
 * # SharedConfig
 * Facotry in the fhirCapacityApp.
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('SharedConfig',[ 'localStorageService', function (localStorageService) {
      
      return {
        set: set,
        get: get
      };
      
      function set(conf) {
        localStorageService.remove('config');
        localStorageService.set('config', conf);
      }

      function get() {
        var config = localStorageService.get('config');
        if(!config) {
          return {};
        }
        return config;
      }

    }]);
  
})();