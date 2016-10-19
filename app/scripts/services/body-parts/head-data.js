
/**
 * @ngdoc service
 * @name fhirCapacityApp.HeadData
 * @description Data for outer head in human body model
 * # HeadData
 * Constant in the fhirCapacityApp.
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .constant('HeadData', [
 			{d:'M', x:85, y:72},
			{d:'C', x:85, y:154},
			{d:'', x:215, y:154},
			{d:'', x:215, y:72},
			{d:'C', x:215, y:0},
			{d:'', x:85, y:0},
			{d:'', x:85, y:72}
    ]);

})();
