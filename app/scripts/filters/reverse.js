
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
  	.filter('reverse', function() {
		  return function(items) {
		    return items.slice().reverse();
		  };
		});

})();