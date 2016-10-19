
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:LogoutCtrl
 * @description
 * # LogoutCtrl
 * Controller of the fhirCapacityApp
 */

(function () {
	'use strict';

	angular.module('fhirCapacityApp')
	  .controller('LogoutCtrl', ['$scope', 'fhirConfig', 'SharedConfig', function ($scope, fhirConfig, SharedConfig) {
	  	$scope.statustext =  'Logging out...';

	    SharedConfig.set({});
	    fhirConfig.clearAuthToken();

	    $scope.statustext = 'Logged out successfully.';
	  }]);
	  
})();
