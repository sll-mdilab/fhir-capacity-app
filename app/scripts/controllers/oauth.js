
/**
 * @ngdoc function
 * @name fhirWebApp.controller:OauthCtrl
 * @description
 * # OauthCtrl
 * Controller of the fhirWebApp
 */

(function () {
	'use strict';

	angular.module('fhirCapacityApp')
	  .controller('OauthCtrl', ['$scope', 'fhirConfig', 'fhirOauth', function ($scope, fhirConfig, fhirOauth) {
  	$scope.statustext = 'Connecting to authorization server...';

    fhirOauth.authorize(function (message) {
  		$scope.statustext = 'Authorization failed. Error message: ' + message;

  		if(!$scope.$$phase) {
            $scope.$apply();
        }
    });
  }]);
	  
})();