
/**
 * @ngdoc directive
 * @name fhirTypeAheadApp.directive:dateInput
 * @description
 * # dateInput
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .directive('dateInput', dateInput);

  dateInput.$inject = ['CapacityUtils'];

function dateInput(CapacityUtils) {
    return {
      restrict: 'AC',
      scope: {
        dateVariable: '=dateVariable'
      },
      link: function (scope, element, attrs) {
        // Display the formatted date
        element[0].value = CapacityUtils.formatDate(new Date(scope.dateVariable), false);
        var newDate = new Date(scope.dateVariable);

        element.on('blur keyup change', function () {
          // Matches the complete date format
          var longRegex = /^(|[0-9]|[0-9]{2})-(|[0-9]|0[0-9]|1[0-2])-(|[0-9]|0[0-9]|1[0-9]|2[0-9]|3[0-1])$/;
          
          // Matches the date format before the second '-'
          var mediumRegex = /^(|[0-9]|[0-9]{2})-(|[0-9]|0[0-9]|1[0-2])$/;
          
          // Matches the date format before the first '-'
          var shortRegex = /^(|[0-9]|[0-9]{2})$/;


          if (longRegex.test(this.value)) {
            // If input value matches the complete date format both day, month and year are updated
            var date = this.value.split('-');
            
            // If a value is empty it is set to previous ligit value
            var day = (parseInt(date[2]) && parseInt(date[2]) > 0) ? parseInt(date[2]) : newDate.getDate();
            var month = (parseInt(date[1]) && parseInt(date[1]) > 0) ? parseInt(date[1]) - 1 : newDate.getMonth();  // Javascript months starts on 0
            var year = (parseInt(date[0]) === 0 || parseInt(date[0])) ? parseInt(date[0]) : (new Date()).getFullYear().toString().substr(2,2);
           
            newDate.setDate(day);
            newDate.setMonth(month);
            newDate.setYear(2000 + year);

            scope.dateVariable = newDate;
            scope.$apply();
            
          } else if (mediumRegex.test(this.value)) {
            // If input value matches the date format before the second '-' year and month are updated, but date is reset
            var date = this.value.split('-');
            var month = (parseInt(date[1]) && parseInt(date[1]) > 0) ? parseInt(date[1]) - 1 : newDate.getMonth();  // Javascript months starts on 0
            var year = (parseInt(date[0]) === 0 || parseInt(date[0])) ? parseInt(date[0]) : (new Date()).getFullYear().toString().substr(2,2);

            newDate.setDate(1);
            newDate.setMonth(month);
            newDate.setYear(2000 + year);
            scope.$apply();

          } else if (shortRegex.test(this.value)) {
            // If input value matches the date format before the first '-' year is updated, but month and date are reset
            newDate.setDate(1);
            newDate.setMonth(0);
            newDate.setYear(this.value);
            scope.$apply();
          } else {
            // If input value doesn't match the date format at all the time is set to previous ligit value
            this.value = CapacityUtils.formatDate(new Date(scope.dateVariable), false);
          }
        });

        element.on('blur', function () {
          // Display the formatted date when done editing 
          this.value = CapacityUtils.formatDate(new Date(scope.dateVariable), false);
        });

      }
    };
  }

})();
