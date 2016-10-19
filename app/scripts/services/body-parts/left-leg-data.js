
/**
 * @ngdoc service
 * @name fhirCapacityApp.LeftLegData
 * @description Data for left leg in human body model
 * # LeftLegData
 * Constant in the fhirCapacityApp.
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .constant('LeftLegData', [
			{d:'M', x:85, y:390},
			{d:'L', x:85, y:560},
			{d:'C', x:85, y:600},
			{d:'', x:140, y:600},
			{d:'', x:140, y:560},
			{d:'L', x:140, y:390},
			{d:'L', x:85, y:390}
    ]);

})();
