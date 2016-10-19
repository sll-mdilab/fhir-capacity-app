
/**
 * @ngdoc function
 * @name fhirWebApp.controller:DefaultMedicationDoses
 * @description
 * # DefaultMedicationDoses
 * Factory of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('DefaultMedicationDoses', DefaultMedicationDoses);


  DefaultMedicationDoses.$inject = [];

  function DefaultMedicationDoses() {

    return {
      getDefaultInfusionDose: getDefaultInfusionDose,
      getDefaultTimeIntervalDose: getDefaultTimeIntervalDose,
      getDefaultAsNeededDose: getDefaultAsNeededDose,
      getDefaultTargetDose: getDefaultTargetDose,
      setEmptyDoseValuesToDefault: setEmptyDoseValuesToDefault
    };

    function getDefaultInfusionDose() {
      var date = new Date();
     
      // Default infusion dose
      return {
        rateRatio: {
          numerator: {
            value: 0,
            unit: 'ml'
          },
          denominator: {
            value: 1,
            unit: 'h'
          }
        },
        timing: {
          event:  date.toISOString()
        }
      };
    }

    function getDefaultTimeIntervalDose() {
      var date = new Date();
      
      // Default time interval dose
      return {
        doseQuantity: {
          value: 0,
          unit: 'mg'
        },
        timing: {
          repeat: {
            frequency: 0, 
            period: 1,
            periodUnits: 'd'
          },
          event: date.toISOString()
        }
      }; 
    }

    function getDefaultAsNeededDose() {
      var date = new Date();
      
      // Default as needed dose
      return {
        doseQuantity: {
          value: 0,
          unit: 'mg'
        },
        asNeededBoolean: true,
        timing: {
          event:  date.toISOString()
        }
      };      
    }

    function getDefaultTargetDose(defaultCode, defaultDisplay) {
      var date = new Date();

      // Default target dose
      return {
        additionalInstructions: {
          coding: [{
            code: defaultCode,
            display: defaultDisplay
          }],
          text: '0-100'
        },
        timing: {
          event:  date.toISOString()
        },
        maxDosePerPeriod: {
          numerator: {
            value: 0,
            unit: 'ml'
          },
          denominator: {
            value: 1,
            unit: 'd'
          }
        }
      };      
    }

    function setEmptyDoseValuesToDefault(medicationOrder) {
      var dose = medicationOrder.dosageInstruction[0];
      // Set empty dose values to default depending on dose type
      if (medicationOrder.styleObjects.doseType.parameter === 'rateRatio') {
        setEmptyInfusionValuesToDefault(dose);
      } else if (medicationOrder.styleObjects.doseType.parameter === 'timing') {
        setEmptyIntervalValuesToDefault(dose)
      } else if (medicationOrder.styleObjects.doseType.parameter === 'asNeededBoolean') {
        setEmptyAsNeededValuesToDefault(dose);
      } else if (medicationOrder.styleObjects.doseType.parameter === 'additionalInstructions') {
        setEmptyTargetValuesToDefault(medicationOrder);
      }
    }

    function setEmptyInfusionValuesToDefault(dose) {
      dose.rateRatio.numerator.value = dose.rateRatio.numerator.value || 0;
      dose.rateRatio.numerator.unit = dose.rateRatio.numerator.unit || 'mg';
      dose.rateRatio.denominator.value = dose.rateRatio.denominator.value || 1;
      dose.rateRatio.denominator.unit = dose.rateRatio.denominator.unit || 'h';
    }

    function setEmptyIntervalValuesToDefault(dose) {
      dose.doseQuantity.value = dose.doseQuantity.value || 0;
      dose.doseQuantity.unit = dose.doseQuantity.unit || 'mg';
      dose.timing.repeat.frequency = dose.timing.repeat.frequency || 0;
    }

    function setEmptyAsNeededValuesToDefault(dose) {
      dose.doseQuantity.value = dose.doseQuantity.value || 0;
      dose.doseQuantity.unit = dose.doseQuantity.unit || 'mg'; 
    } 

    function setEmptyTargetValuesToDefault(medicationOrder) {
      medicationOrder.styleObjects.lowerOrdinationLimit = medicationOrder.styleObjects.lowerOrdinationLimit || 0;
      medicationOrder.styleObjects.upperOrdinationLimit = medicationOrder.styleObjects.upperOrdinationLimit || 0;

      var dose = medicationOrder.dosageInstruction[0];
      dose.maxDosePerPeriod.numerator.value = dose.maxDosePerPeriod.numerator.value || 0;
      dose.maxDosePerPeriod.numerator.unit = dose.maxDosePerPeriod.numerator.unit || 'mg';
      dose.maxDosePerPeriod.denominator.value = dose.maxDosePerPeriod.denominator.value || 1;
      dose.maxDosePerPeriod.denominator.unit = dose.maxDosePerPeriod.denominator.unit || 'd';
    }    
  }

})();
