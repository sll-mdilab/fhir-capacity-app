
/**
 * @ngdoc function
 * @name fhirWebApp.controller:EncounterFilters
 * @description
 * # EncounterFilters
 * Service of the fhirWebApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .service('EncounterFilters', EncounterFilters);

  EncounterFilters.$inject = ['$filter', 'CapacityUtils'];

  function EncounterFilters($filter, CapacityUtils) {

    return { 
      getOrganizationFilter: getOrganizationFilter,
      getMedicationFilter: getMedicationFilter,
      getIcdFilter: getIcdFilter
    };

    function getOrganizationFilter(encounterList, organizationFilter) {
      return CapacityUtils.getArrayFromObject(getOrganizationFilterOptions(encounterList, organizationFilter));
    }

    function getMedicationFilter(encounterList, medicationFilter) {
      return CapacityUtils.getArrayFromObject(getMedicationFilterOptions(encounterList, medicationFilter));
    }

    function getIcdFilter(encounterList, icdFilter) {
      return CapacityUtils.getArrayFromObject(getIcdFilterOptions(encounterList, icdFilter));
    }


    function getOrganizationFilterOptions(encounterList, organizationFilter) {
      for (var i in encounterList) {
        if (!organizationFilter.hasOwnProperty(encounterList[i].includedObjects.serviceProvider.id)) {
          addFilterOptions(organizationFilter, encounterList[i].includedObjects.serviceProvider.id, encounterList[i].includedObjects.serviceProvider.name);
        }
      }
      return organizationFilter;
    }

    function getMedicationFilterOptions(encounterList, medicationFilter) {
      return getSupportingInformationFilterOptions(encounterList, medicationFilter, 'Medication');
    }

    function getIcdFilterOptions(encounterList, icdFilter) {
      return getSupportingInformationFilterOptions(encounterList, icdFilter, 'ICD');
    }

    function getSupportingInformationFilterOptions(encounterList, filter, type) {
      // Get filters from recommendation comment
      for (var i in encounterList) {
        if (encounterList[i].includedObjects.sentReferral){
          angular.forEach(encounterList[i].includedObjects.sentReferral.supportingInformation, function(information) {
            if (information.type === type) {
              if (!filter.hasOwnProperty(information.id)) {
                addFilterOptions(filter, information.id, information.display);
              }
            }
          });
        }
      }
      return filter;
    }

    function addFilterOptions(filter, id, name) {
      filter[id] = { 
        id: id, 
        name: name
      };
    }
  }

})();
