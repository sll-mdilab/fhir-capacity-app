
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:fhirLightObservationBox
 * @description
 * # fhirLightObservationBox
 */

(function () {
  'use strict';
    
  angular.module('fhirCapacityApp')
    .directive('fhirLightObservationBox', fhirLightObservationBox);

  fhirLightObservationBox.$inject = [];

  function fhirLightObservationBox() {
    return {
      restrict: 'E',
      templateUrl: 'views/cockpit/fhir-light-observation-box.html',
      scope: {
        updateDelay: '=updateDelay',
        isUpdating: '=isUpdating',
        data: '=parameterData',
        config: '=parameterConfig',
        noSignal: '=noSignal',
        gaugeWidth: '=gaugeWidth',
        gaugeHeight: '=gaugeHeight',
        alarmWidth: '=alarmWidth'
      },
      link: postLink
    }

    function postLink(scope, element) {
      scope.oldPrimaryVals = [];
      scope.hasSecondaryData = false;

      function updateInterface(newVals, oldVals) {
        updateCurrentValues(newVals);
        updateMinMax(newVals);
        updateRegressionArrow(newVals);
      }

      function updateCurrentValues(newVals) {
        if (!scope.noSignal) {
          scope.primaryData = Math.round(newVals[0].primaryData.observations[0].resource.valueQuantity.value);
          if (newVals[0].secondaryData) {
            scope.hasSecondaryData = true;
            scope.secondaryData = Math.round(newVals[0].secondaryData.observations[0].resource.valueQuantity.value);
            scope.tertiaryData = Math.round(newVals[0].tertiaryData.observations[0].resource.valueQuantity.value);            
          }      
        }     
      }

      function updateMinMax(newVals) {
        scope.maxValue = newVals[0].primaryData.maxValue;
        scope.minValue = newVals[0].primaryData.minValue;
        scope.regression = newVals[0].primaryData.regression.futureValue; 
      }

      function updateRegressionArrow(newVals) {
        scope.regressionValue = newVals[0].primaryData.regression.futureValue;

        if (scope.regressionValue) {
          var arrowObject = $('#light-observation-regression-' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + ' .light-observation-regression-arrow');
          var difference = scope.primaryData - scope.regressionValue;
          var fontSize = 30;

          // Adjust size of arrow depending on how much the predicted value differs from the current one
          if (difference > 0) {
            // Display up arrow if predicted value is higher than current
            fontSize = Math.ceil(difference / 10) * 10;
            fontSize = fontSize > 30 ? 30 : fontSize;
            fontSize = fontSize == 10 ? 12 : fontSize;
            arrowObject
              .css('font-size', fontSize + 'px')
              .html('&uarr;');
          } else {
            // Display down arrow if predicted value is lower than current
            fontSize = Math.floor(difference / 10) * 10;
            fontSize = fontSize < -30 ? -30 : fontSize;
            fontSize = fontSize == -10 ? -12 : fontSize;
            arrowObject
              .css('font-size', fontSize + 'px')
              .html('&darr;')
          }
          var height = arrowObject.css('height').replace('px', '');
          arrowObject.css('margin-top', height/-2);
        }
      }

      // Listen to when 'data' changes
      scope.$watch('data', function (newVals, oldVals) {
        updateInterface([newVals, scope.config], [oldVals, scope.config]);
      }, true); 

      // Listen to when 'isUpdating' changes
      scope.$watch('isUpdating', function (newVals, oldVals) {
        var arrowObject = $('#light-observation-regression-' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + ' .light-observation-regression-arrow');
        arrowObject.css('font-size', 0);
      }, true);

      // Listen to when 'noSignal' changes
      scope.$watch('noSignal', function (newVals, oldVals) {
        if (scope.noSignal) {
          // Set all labels to 'x' and hide regression arrow if there are no signal
          scope.primaryData = 'x';
          scope.secondaryData = 'x';
          scope.tertiaryData = 'x';
          var arrowObject = $('#light-observation-regression-' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + ' .light-observation-regression-arrow');
          arrowObject.css('font-size', 0);
        }
      }, true);
    }
  }   
})();

