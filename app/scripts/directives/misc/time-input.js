
/**
 * @ngdoc directive
 * @name fhirTypeAheadApp.directive:timeInput
 * @description
 * # timeInput
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .directive('timeInput', timeInput);

  timeInput.$inject = ['CapacityUtils'];

function timeInput(CapacityUtils) {
    return {
      restrict: 'AC',
      scope: {
        timeVariable: '=timeVariable'
      },
      link: function (scope, element, attrs) {
        // Display the formatted time
        element[0].value = CapacityUtils.formatTime(new Date(scope.timeVariable));
        var newDate = new Date(scope.timeVariable);

        element.on('blur keyup change', function () {
          // Matches the complete time format
          var longRegex = /^(|[0-9]|0[0-9]|1[0-9]|2[0-3]):(|[0-9]|[0-5][0-9])$/;
          
          // Matches the time format before ':'
          var shortRegex = /^(|[0-9]|0[0-9]|1[0-9]|2[0-3])$/;

          if (longRegex.test(this.value)) {
            // If input value matches the complete time format both hours and minutes are updated
            var time = this.value.split(':');

            // If a value is empty it is set to previous ligit value
            var hours = (parseInt(time[0]) === 0 || parseInt(time[0])) ? parseInt(time[0]) : newDate.getHours();
            var minutes = (parseInt(time[1]) === 0 || parseInt(time[1])) ? parseInt(time[1]) : newDate.getMinutes();

            newDate.setHours(hours);
            newDate.setMinutes(minutes);
            scope.timeVariable = newDate;
            scope.$apply();

          } else if (shortRegex.test(this.value)) {
            // If input value matches the time format before ':' hours is updated and minutes is reset
            scope.timeVariable.setHours(this.value);
            scope.timeVariable.setMinutes(0);
            scope.$apply();
            
          } else {
            // If input value doesn't match the time format at all the time is set to previous ligit value
            this.value = CapacityUtils.formatTime(new Date(scope.timeVariable));
          }
        });

        element.on('blur', function () {
          // Display the formatted time when done editing 
          this.value = CapacityUtils.formatTime(new Date(scope.timeVariable));
        });

      }
    };
  }

})();
