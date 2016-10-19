
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:modalDialog
 * @description
 * # modalDialog
 */

(function () {
  'use strict';
  
  angular.module('fhirCapacityApp')
    .directive('modalDialog', modalDialog);

  modalDialog.$inject = [];

  function modalDialog() {

    return {
      templateUrl: 'views/misc/modal.html',
      restrict: 'E',
      transclude: true,
      replace:true,
      scope: {
      	show: '=',
        completeButtonLabel: '=',
      	completeFunction: '='
    	},
      link: postLink
    };

    function postLink(scope, element, attrs) {
      // Hide modal when clicking outside of it
      scope.hideModal = function() {
        scope.show = false;
        document.body.style.overflow = 'visible';
      };
    }
  }
})();