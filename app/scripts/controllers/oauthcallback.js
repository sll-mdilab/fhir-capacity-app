
/**
 * @ngdoc function
 * @name fhirWebApp.controller:OauthcallbackCtrl
 * @description
 * # OauthcallbackCtrl
 * Controller of the fhirWebApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('OauthcallbackCtrl',['$scope', '$location', 'fhirOauth', 'SharedConfig', function ($scope, $location, fhirOauth, SharedConfig) {

    $scope.statustext = 'Fetching authorization token...';

    fhirOauth.ready(function(currentPractitioner) {
      var config = SharedConfig.get();
      config.practitioner = currentPractitioner;
      SharedConfig.set(config);

      console.log('Login sequence completed.');

      $location.path('/overview');

      if(!$scope.$$phase) {
          $scope.$apply();
      }
    }, function(message) {
      $scope.statustext = 'Error: ' + message;
    });
  }]);

})();