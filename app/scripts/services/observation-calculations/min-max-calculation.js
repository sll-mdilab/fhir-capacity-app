
/**
 * @ngdoc function
 * @name fhirWebApp.controller:MinMaxCalculation
 * @description
 * # MinMaxCalculation
 * Service of the fhirWebApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('MinMaxCalculation', MinMaxCalculation);

  MinMaxCalculation.$inject = [];

  function MinMaxCalculation() {
    return {
      calculateMinMax: calculateMinMax
    };

    function calculateMinMax(dataObject) {
      if (dataObject.observations[0] === undefined) {
        return;
      }

      var selectedObservations = dataObject.observations.slice(0, dataObject.cachedValuesSize);
      var selectedValues = selectedObservations.map(function(obs){
        return obs.resource.valueQuantity.value;
      });

      return {
        max: Math.max.apply(null, selectedValues),
        min: Math.min.apply(null, selectedValues)
      };
    }
  }
})();
