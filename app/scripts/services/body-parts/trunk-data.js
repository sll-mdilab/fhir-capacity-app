
/**
 * @ngdoc service
 * @name fhirCapacityApp.TrunkData
 * @description Data for trunk in human body model
 * # TrunkData
 * Constant in the fhirCapacityApp.
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .constant('TrunkData', [
			{d:'M', x:85, y:160},
			{d:'L', x:85, y:390},
			{d:'L', x:215, y:390},
			{d:'L', x:215, y:160},
			{d:'L', x:85, y:160}
    ]);

})();
