
/**
 * @ngdoc service
 * @name fhirCapacityApp.Config
 * @description Creates config objects
 * # Config
 * Factory in the fhirCapacityApp.
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('Config', Config);

  Config.$inject = ['DefaultParameters'];

  function Config(DefaultParameters) {
    var vm = {};

    vm.config = createEmptyConfig();  
    vm.config.generalConfig = createGeneralConfig();

    return {
      getDefaultConfig: getDefaultConfig
    };

    function createEmptyConfig() {
      return {
        practitioner: {},
        patient: {},
        parameterConfig: {},
        generalConfig: {}
      };
    }

    function createGeneralConfig() {
      var regressionConfig = createRegressionConfig(10, 5);
      return {
        // Needed to calculate no circulation annotations
        defaultCirculationParameters: [
          DefaultParameters.heartRate.code, 
          DefaultParameters.saturation.code, 
          DefaultParameters.bloodPressure.code
        ],
        // Specifies the time limit from current time when counting no circulation annotations
        defaultMillisecondTimeInterval: 1200000,
        regression: regressionConfig
      };
    }

    function createRegressionConfig(past, future) {
      return {past: past, future: future};
    }

    function getDefaultConfig() {
     // Default practitioner for usage of API key and not oauth
      vm.config.practitioner = {
        "resourceType": "Practitioner",
        "id": "19780909-5674", 
        "identifier": [{  
          "value": "19780909-5674"
        }],
        "name": { "text": "Cecilia Davidsson" }, 
        "practitionerRole": [{ 
          "role": {
            "coding": [
              {
                "system": "http://snomed.info/sct",
                "code": "224565004",
                "display": "Doctor"
              }
            ]
          },
          "managingOrganization": { 
            "reference": "Organization/Radiology"
          }
        }]
      }

      return vm.config;
    }

  }
})();
