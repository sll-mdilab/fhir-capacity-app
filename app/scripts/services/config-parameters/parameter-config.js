
/**
 * @ngdoc function
 * @name fhirWebApp.controller:ParameterConfig
 * @description Ordered parameter config 
 * # ParameterConfig
 * Factory of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('ParameterConfig', ParameterConfig);

  ParameterConfig.$inject = ['CareCaseData', 'CapacityUtils', 'DefaultParameters'];

  function ParameterConfig(CareCaseData, CapacityUtils, DefaultParameters) {
    var vm = {};
    vm.parameterList = [];

    // Get all existing parameters
    CareCaseData.getAllDeviceMetrics().then(function(result) {
      vm.parameterList = result
    });
    
    return {
      getParameterConfig: getParameterConfig,
      updateParameterOrderExtensionStyleObjects: updateParameterOrderExtensionStyleObjects,
      createDefaultParameterOrders: createDefaultParameterOrders,
      findParameterById: findParameterById,
      findParameterByCode: findParameterByCode
    };

    function getParameterConfig(patientReference) {
      vm.parameterConfig = {};
      vm.patientReference = patientReference;

      // Get all ordered parameters
      return CareCaseData.getOrders(vm.patientReference).then(function(result) {
        for (var i in result) {
          var parameter = findParameterById(CapacityUtils.getReferenceId(result[i].detail[0].reference));
          setParameterOrderStyleObjects(result[i], parameter);
          vm.parameterConfig[result[i].includedObjects.parameter.type.coding[0].code] = result[i];
        }
        // Get medication orders to add target ordinations to config
        return fetchAllMedicationOrders();
      });
    }

    function setParameterOrderStyleObjects(parameterOrder, parameter) {
      parameterOrder.styleObjects = {};
      parameterOrder.includedObjects = {};

      parameterOrder.includedObjects.parameter = parameter;
      parameterOrder.styleObjects.fontClass = parameterOrder.includedObjects.parameter.color + '-font';
      
      parameterOrder.styleObjects.cantRemove = false;
      setDefaultParameterStyleObjects(parameterOrder);

      setParameterOrderExtensionStyleObjects(parameterOrder);
    }

    function setDefaultParameterStyleObjects(parameterOrder) {
      var parameter = parameterOrder.includedObjects.parameter;

      if (parameter.extension[0].valueString === 'circulation' || parameter.type.coding[0].code === DefaultParameters.temperature.code) {
        // Hide remove functionalities for default circulation and temperature parameters
        // since these parameters are used specifically in cockpit
        for (var i in DefaultParameters) {
          if (DefaultParameters.hasOwnProperty(i) && DefaultParameters[i].code === parameter.type.coding[0].code) {
            parameterOrder.styleObjects.cantRemove = true;
          }
        }
      }
    }

    function setParameterOrderExtensionStyleObjects(parameterOrder) {
      parameterOrder.styleObjects.alarmLimits = {};

      // Go through parameter alarm limit extension
      for (var i in parameterOrder.extension[0].extension) {
        var id = parameterOrder.extension[0].extension[i].url; 
        var value = parameterOrder.extension[0].extension[i].valueDecimal; 
        parameterOrder.styleObjects.alarmLimits[id] = value;
      }
      setParameterOrderDistributionAndScale(parameterOrder);
    }

    function updateParameterOrderExtensionStyleObjects(parameterOrder) {
      // Set alarm limits
      for (var i in parameterOrder.extension[0].extension) {
        if (parameterOrder.extension[0].extension[i].url == 'lowerAlarm') {
          parameterOrder.extension[0].extension[i].valueDecimal = parameterOrder.styleObjects.alarmLimits.lowerAlarm;
        } else if (parameterOrder.extension[0].extension[i].url == 'lowerWarning') {
           parameterOrder.extension[0].extension[i].valueDecimal = parameterOrder.styleObjects.alarmLimits.lowerWarning;
        } else if (parameterOrder.extension[0].extension[i].url == 'upperWarning') {
           parameterOrder.extension[0].extension[i].valueDecimal = parameterOrder.styleObjects.alarmLimits.upperWarning;
        } else if (parameterOrder.extension[0].extension[i].url == 'upperAlarm') {
           parameterOrder.extension[0].extension[i].valueDecimal = parameterOrder.styleObjects.alarmLimits.upperAlarm;
        }
      }
      setParameterOrderDistributionAndScale(parameterOrder);
    }

    function setParameterOrderDistributionAndScale(parameterOrder) {
      var minAlarm = parameterOrder.styleObjects.alarmLimits['lowerAlarm'];
      var maxAlarm = parameterOrder.styleObjects.alarmLimits['upperAlarm'];
      var minWarning = parameterOrder.styleObjects.alarmLimits['lowerWarning'];
      var maxWarning = parameterOrder.styleObjects.alarmLimits['upperWarning'];

      var isSaturation = parameterOrder.includedObjects.parameter.type.coding[0].code === DefaultParameters.saturation.code;

      // Special for saturation since it can't be more than 100
      var mean = isSaturation ? 98 : minAlarm + (maxAlarm-minAlarm) / 2;
      var deviation = isSaturation ? 2 : (maxWarning-minWarning) / 2;
      var offset = isSaturation ? 2 : (maxAlarm-minAlarm) / 2;
      
      // Set distribution and scale depending on alarm limits
      parameterOrder.styleObjects.distribution = {mean: mean, deviation: deviation};
      parameterOrder.styleObjects.scale = {offset: offset};
    }

    function fetchAllMedicationOrders() {
      var includeList = ['MedicationOrder:prescriber', 'MedicationOrder:medication'];
      return CareCaseData.getMedicationOrders(vm.patientReference, includeList).then(function(result) {
        return getAllOrdinationTargets(result)
      });
    }

    function getAllOrdinationTargets(medicationOrderList) {
      for (var i in medicationOrderList) {
        if (medicationOrderList[i].dosageInstruction[0].additionalInstructions && medicationOrderList[i].status === 'active') {
          var limits = medicationOrderList[i].dosageInstruction[0].additionalInstructions.text.split('-');

          // Set target medication orders to config
          var configOrdination = {
            medication: medicationOrderList[i].includedObjects.medication.code.text,
            dose: medicationOrderList[i].dosageInstruction[0].additionalInstructions.text,
            lowerOrdinationLimit: parseInt(limits[0]),
            upperOrdinationLimit: parseInt(limits[1])
          };

          var code = medicationOrderList[i].dosageInstruction[0].additionalInstructions.coding[0].code;
          vm.parameterConfig[code].styleObjects.ordination = configOrdination;
        }
      }
      return vm.parameterConfig;
    }

    function createDefaultParameterOrders(patientRef, practitionerRef) {
      var date = new Date();
      
      // Create default parameter orders for admitted patient
      for (var i in DefaultParameters) {
        if (DefaultParameters.hasOwnProperty(i)) {
          var deviceMetric = findParameterByCode(DefaultParameters[i].code);

          CareCaseData.createOrder(
            patientRef, 
            practitionerRef,
            'DeviceMetric/' + deviceMetric.id, 
            date,
            i
          );
        }
      }
    }

    function findParameterById(parameterId) {
      for (var i in vm.parameterList) {
        if (parameterId === vm.parameterList[i].id) {
          return vm.parameterList[i];
        }
      }
      return null;
    }

    function findParameterByCode(parameterCode) {
      for (var i in vm.parameterList) {
        if (parameterCode === vm.parameterList[i].type.coding[0].code) {
          return vm.parameterList[i];
        }
      }
      return null;
    }


  }
})();
