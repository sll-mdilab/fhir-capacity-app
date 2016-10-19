
/**
 * @ngdoc service
 * @name fhirCapacityApp.DefaultParameters
 * @description Default parameters for admitted patients
 * # DefaultParameters
 * Constant in the fhirCapacityApp.
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .constant('DefaultParameters', {
      heartRate: {
        code: 'MDC_PULS_OXIM_PULS_RATE', 
        alarmlimits: { lowerAlarm: 50, lowerWarning: 55, upperWarning: 80, upperAlarm: 100}
      },
      bloodPressure: {
        code: 'MDC_PRESS_BLD_NONINV_MEAN', 
        alarmlimits: { lowerAlarm: 50, lowerWarning: 55, upperWarning: 65, upperAlarm: 70}
      },
      bloodPressureDiastolic: {
        code: 'MDC_PRESS_BLD_NONINV_DIA', 
        alarmlimits: { lowerAlarm: 30, lowerWarning: 35, upperWarning: 45, upperAlarm: 50}
      },
      bloodPressureSystolic: {
        code: 'MDC_PRESS_BLD_NONINV_SYS', 
        alarmlimits: { lowerAlarm: 90, lowerWarning: 95, upperWarning: 105, upperAlarm: 110}
      },
      saturation: {
        code: 'MDC_PULS_OXIM_SAT_O2', 
        alarmlimits: { lowerAlarm: 86, lowerWarning: 95, upperWarning: 100, upperAlarm: 100}
      },
      FIO2: {
        code: 'MDC_CONC_GASDLV_O2_INSP', 
        alarmlimits: { lowerAlarm: 14, lowerWarning: 16, upperWarning: 26, upperAlarm: 40}
      },
      RR: {
        code: 'MDC_RESP_RATE', 
        alarmlimits: { lowerAlarm: 8, lowerWarning: 10, upperWarning: 15, upperAlarm: 20}
      },
      IERatio: {
        code: 'MDC_RATIO_IE',
        alarmlimits: { lowerAlarm: 0.8, lowerWarning: 1, upperWarning: 1.9, upperAlarm: 2.5}
      },
      temperature: {
        code: 'MDC_TEMP', 
        alarmlimits: { lowerAlarm: 36, lowerWarning: 36.5, upperWarning: 38, upperAlarm: 38.5}
      }
    });

})();
