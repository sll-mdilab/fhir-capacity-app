
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:TodoCtrl
 * @description
 * # TodoCtrl
 * Controller of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('TodoCtrl', TodoCtrl);

  TodoCtrl.$inject =  ['CapacityUtils', 'SharedConfig'];
  
  function TodoCtrl(CapacityUtils, SharedConfig) {
    var vm = this;
    init();

    function init() {
    	vm.config = SharedConfig.get();
    	initScopeFunctions();
    }
    
    function initScopeFunctions() {
      vm.changeLocation = CapacityUtils.changeLocation; 
    }

  }
})();
