'use strict';

/**
 * @ngdoc service
 * @name angularFhirResources.fhirConceptMap
 * @description
 * # fhirObservation
 * Factory in the fhirCapacityApp.
 */
angular.module('fhirCapacityApp')
  .factory('fhirConceptMap', ['$http', 'Utilities', function ($http, Utilities) {
 
    // Service logic
    var resourceType = 'ConceptMap';
	//var url = "https://localhost:8343/fhir/" + resourceType;
	var url = "https://clinicalmapper.sll-mdilab.net/fhir/" + resourceType;
    // Public API here
    return {
      getTermsSNOMED: function (searchString,lang) {
        return $http({
          method: 'GET',
          url: url + "/$translate",
          //headers: fhirConfig.headers,
          params: {
            label: searchString,
			lang: lang,
            equivalence: 'search',
			target: 'http://snomed.info/sct',
            _format: 'json'
          }
        }).then(function (response) {
          return response.data;
        });
      },
       getHierachiesIEEEX73: function (snomed_code, equivalence_code) {
        return $http({
          method: 'GET',
          url: url + "/$translate",
          //headers: fhirConfig.headers,
          params: {
            code: snomed_code,
            equivalence: equivalence_code,
			system: 'http://snomed.info/sct',
			target: 'urn:std:iso:11073',
            _format: 'json'
          }
        }).then(function (response) {
          return response.data;
        });
      },
       getHierachiesClinisoft: function (snomed_code, equivalence_code) {
        return $http({
          method: 'GET',
          url: url + "/$translate",
          //headers: fhirConfig.headers,
          params: {
            code: snomed_code,
            equivalence: equivalence_code,
			system: 'http://snomed.info/sct',
			target: 'http://sll-mdilab.net/BodySites/Clinisoft',
            _format: 'json'
          }
        }).then(function (response) {
          return response.data;
        });
      },	
	getDirectOrWiderMatch: function (sourcesystem, sourcecode, targetsystem, equivalence) {
        return $http({
          method: 'GET',
          url: url + "/$translate",
          //headers: fhirConfig.headers,
          params: {
            code: sourcecode,
            equivalence: equivalence,
			system: sourcesystem,
			target: targetsystem,
            _format: 'json'
          }
        }).then(function (response) {
          return response.data;
        });
      },	
       mapSNOMEDandClinisoft: function (snomed_code, clinisoft_code, direction_code) {
        return $http({
          method: 'GET',
          url: url + "/$map",
          //headers: fhirConfig.headers,
          params: {
            sourcecode: snomed_code,
			targetcode: clinisoft_code,
            direction: direction_code,
			sourcesystem: 'http://snomed.info/sct',
			targetsystem: 'http://sll-mdilab.net/BodySites/Clinisoft'
           }
        }).then(function (response) {
          return response.data;
        });
      }	  
    };
  }]);
