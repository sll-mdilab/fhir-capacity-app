
/**
 * @ngdoc filter
 * @name fhirCapacityApp.filter:sanitize
 * @function
 * @description
 * # sanitize
 * Filter in the fhirCapacityApp.
 */

(function () {
	'use strict';

	angular.module('fhirCapacityApp')
	  .filter('sanitize', ['$sce', function ($sce) {
	    return function (htmlCode) {
	      return $sce.trustAsHtml(htmlCode);
	    };
	  }]);

})();