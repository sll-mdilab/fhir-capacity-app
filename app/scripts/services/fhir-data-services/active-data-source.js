
/**
 * @ngdoc function
 * @name fhirWebApp.controller:ActiveDataSource
 * @description Set data sources for ordered parameters
 * # ActiveDataSource
 * Service of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('ActiveDataSource', ActiveDataSource);

  ActiveDataSource.$inject = [];

  function ActiveDataSource() {
    var dataSources = { random: 'random', live: 'live' };
    var defaultDataSource = { source: dataSources.random };

    return {
      setActiveDataSource: setActiveDataSource,
      getDataSources: getDataSources,
      getDefaultDataSource: getDefaultDataSource,
      setNoSignal: setNoSignal
    };

    function getDataSources() {
      return dataSources;
    }

    function getDefaultDataSource() {
      return angular.copy(defaultDataSource);
    }

    function setActiveDataSource(parameters) {
      var activeDataSource = {};

      // Set all parameter data sources to random
      for (var i in parameters) {
        activeDataSource[parameters[i].includedObjects.parameter.type.coding[0].code] = angular.copy(defaultDataSource);
      }

      // Enforce Systolic and Diastolic BP to have same data source as mean.
      activeDataSource.MDC_PRESS_BLD_NONINV_SYS = activeDataSource.MDC_PRESS_BLD_NONINV_MEAN;
      activeDataSource.MDC_PRESS_BLD_NONINV_DIA = activeDataSource.MDC_PRESS_BLD_NONINV_MEAN;

      return activeDataSource;
    }

    function setNoSignal(parameters) {
      var noSignal = {};

      // Set no signal to false for all  parameters
      for (var i in parameters) {
        noSignal[parameters[i].includedObjects.parameter.type.coding[0].code] = false
      }

      return noSignal;
    }
  }

})();
