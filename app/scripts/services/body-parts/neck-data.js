
/**
 * @ngdoc service
 * @name fhirCapacityApp.HeadData
 * @description Data for neck in human body model
 * # HeadData
 * Constant in the fhirCapacityApp.
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .constant('NeckData', [
			{d:'M', x:85, y:160},
			{d:'C', x:100, y:153},
			{d:'', x:110, y:150},
			{d:'', x:120, y:150},
			{d:'L', x:125, y:130},
			{d:'C', x:125, y:135},
			{d:'', x:175, y:135},
			{d:'', x:175, y:130},
			{d:'L', x:180, y:150},
			{d:'C', x:190, y:150},
			{d:'', x:200, y:153},
			{d:'', x:215, y:160},
			{d:'L', x:85, y:160}
    ]);

})();
