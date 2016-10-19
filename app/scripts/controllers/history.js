
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:HistoryCtrl
 * @description
 * # HistoryCtrl
 * Controller of the fhirCapacityApp
 */
 
(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('HistoryCtrl', HistoryCtrl);

  HistoryCtrl.$inject = ['$scope' ,'$interval', '$filter', '$window', 'SharedConfig', 'CapacityUtils', 'ParameterData', 'ActiveDataSource', 'DefaultParameters'];

  function HistoryCtrl($scope, $interval, $filter, $window, SharedConfig, CapacityUtils, ParameterData, ActiveDataSource, DefaultParameters) {
    var vm = this;
    var currentIntervalStop;
    var sampledIntervalStop;
      
    init();

    function init() {
      vm.defaultParameters = DefaultParameters; // To be used in the view
      vm.config = SharedConfig.get();

      initVariables();
      initTableStyleVariables();
      initIntervalSelectVariables();
      initIntervalSelectOptions();
      initManualObservationVariables();
      initParameterConfig();
      setSelectedCodesToLiveAsDefault();
      setupScopeFunction();
    }

    function initVariables() {
      vm.noCirculationParameters = 0;
      vm.noOtherParameters = 0;

      vm.cachedValuesSize = 5;
      vm.initialized = false;
      vm.currentDataUpdateDelay = 3000;
      vm.hideConfigEdit = true;
      vm.isUpdating = false;
      vm.isMainRequest = true;
      vm.oldTimeScope = {};
      vm.currentTime = new Date().getTime();

      // Hide manual time interval for mobile devices because double click function doesn't have support for these
      vm.showManualTimeIntervalButton = !CapacityUtils.checkIfMobileDevice();
    }


    function initTableStyleVariables() {
      vm.nIntervals = 6;
      vm.nIntervalsBeforeCurrentTime = 4;
      vm.nIntervalsAfterCurrentTime = 2;
      
      vm.timelineBoxHeight = 35;
      vm.circulationLineChartHeight = 100;
      vm.circulationLineChartBoxHeight = 100;
      vm.tableHeight = 30;
    }

    function initIntervalSelectVariables() {
      vm.timelineIntervalSelectIdentifier = 'timeline';
      vm.intervalSelectVariables = {};
      vm.intervalSelectDefaultObject = {
        showIntervalSelect: false,
        minTime: {milliseconds: 0, formattedTime: '00:00'},
        maxTime: {milliseconds: 0, formattedTime: '00:00'},
        annotationText: ''
      };
      vm.intervalSelectVariables[vm.timelineIntervalSelectIdentifier] = angular.copy(vm.intervalSelectDefaultObject);
    } 

    function initIntervalSelectOptions() {
      var hour = 60 * 60 * 1000;
      var nrObservations = 120;
      vm.timeScopeSource =  [
        {name: '30 Min', editMode: false, hasManualTimeLimits: false, value: (1/2) * hour, updateDelay: ((1/2) * hour) / nrObservations},
        {name: '1 Hour', editMode: false, hasManualTimeLimits: false, value: 1 * hour, updateDelay: (1 * hour) / nrObservations},
        {name: '2 Hours', editMode: false, hasManualTimeLimits: false, value: 2 * hour, updateDelay: (2 * hour) / nrObservations},
        {name: '4 Hours', editMode: false, hasManualTimeLimits: false, value: 4 * hour, updateDelay: (4 * hour) / nrObservations},
        {name: '8 Hours', editMode: false, hasManualTimeLimits: false, value: 8 * hour, updateDelay: (8 * hour) / nrObservations},
        {name: 'Manual', editMode: true}
      ];
      vm.timeScope = {name: '30 Min', editMode: false, value: (1/2) * hour, updateDelay: ((1/2) * hour) / nrObservations};
      setTimeScopeLimits();

      vm.oldTimeScope = vm.timeScope; 
    }

    function initManualObservationVariables() {
      var roundedTimeString = CapacityUtils.roundTimeString(new Date().toISOString());
      
      vm.manualObservationVariables = {};
      vm.manualObservationDefaultObject = {
        showInputFields: false,
        date: new Date(roundedTimeString),
        value: 0
      };
    } 

    function initParameterConfig() {  
      // Parameters in cockpit light row
      vm.currentCirculationParameters = ParameterData.getParameterObject(vm.config, 'circulation', vm.cachedValuesSize);
      
      // Circulation parameters
      vm.sampledCirculationParameters = ParameterData.getParameterObject(vm.config, 'circulation', vm.cachedValuesSize);      
      vm.noCirculationParameters = Object.keys(vm.sampledCirculationParameters).length;
      
      // Other parameters
      vm.sampledOtherParameters = ParameterData.getParameterObject(vm.config, 'other', vm.cachedValuesSize);
      vm.noOtherParameters = Object.keys(vm.sampledOtherParameters).length;

      initCirculationVariables();
      initDataSourceParams();
      initBoxHeight();

      updateAllCurrentObservationData();
    }

    function initCirculationVariables() {
      for (var i in vm.sampledCirculationParameters) {
        var code = vm.sampledCirculationParameters[i].config.primaryConfig.includedObjects.parameter.type.coding[0].code;
        
        // Init annotations
        vm.sampledCirculationParameters[i].annotations = [];
        vm.intervalSelectVariables[code] = angular.copy(vm.intervalSelectDefaultObject);
        updateCirculationAnnotationObservations(vm.sampledCirculationParameters[i].annotations, code);
        
        // Init manual observations
        vm.sampledCirculationParameters[i].manualObservations = [];
        vm.manualObservationVariables[code] = angular.copy(vm.manualObservationDefaultObject);
        updateCirculationManualObservations(vm.sampledCirculationParameters[i].manualObservations, code);
      }
    }

    function updateCirculationAnnotationObservations(list, code) {
      var dateRange = getObservationDateRange();
      ParameterData.fetchAnnotationObservations(list, vm.config.patient.id, dateRange, code);
    }

    function updateCirculationManualObservations(list, code) {
      var date = new Date(vm.currentTime - vm.timeScope.value); 
      var dateString = '>=' + date.toISOString();
      var patientRef = 'Patient/' + vm.config.patient.id;

      ParameterData.fetchManualObservations(list, patientRef, dateString, code);
    }

    function initDataSourceParams() {
      // Create data source object for all ordered parameters
      vm.dataSource = ActiveDataSource.getDataSources();
      vm.activeDataSource = ActiveDataSource.setActiveDataSource(vm.config.parameterConfig);

      // Set all data sources to random
      vm.dataSourceControl = angular.copy(vm.dataSource);
      vm.dataSourceControl.none = '';
      vm.dataSourceForAll = vm.dataSourceControl.none;

      // Set source select option in light config for parameters in addition to Heart Rate, Saturation and Blood pressure 
      vm.dynamicParameters = vm.sampledOtherParameters;
      vm.noSignal = ActiveDataSource.setNoSignal(vm.config.parameterConfig);
    }

    function setSelectedCodesToLiveAsDefault() {
      // Set Heart Rate and Saturation to live as default
      vm.activeDataSource[DefaultParameters.heartRate.code] = angular.copy({source: vm.dataSource.live});
      vm.activeDataSource[DefaultParameters.saturation.code] = angular.copy({source: vm.dataSource.live});
    }

    function initBoxHeight() {
      var chartHeight = vm.noCirculationParameters * (vm.circulationLineChartBoxHeight + 1);
      var tableHeight = vm.noOtherParameters * (vm.tableHeight + 1);
      vm.boxHeight = (vm.timelineBoxHeight + 1) + chartHeight + tableHeight;
    }

    function setupScopeFunction() {
      // Accessible from the view
      vm.changeLocation = CapacityUtils.changeLocation;   
      vm.setAllDataSources = setAllDataSources;
      vm.toggleConfigEdit = toggleConfigEdit;
      vm.startContinuousUpdate = startContinuousUpdate;
      vm.stopContinuousUpdate = stopContinuousUpdate;
      vm.changeTimeScope = changeTimeScope;
      vm.setManualTimeScope = setManualTimeScope;
      vm.updateActiveIntervalSelectToolbox = updateActiveIntervalSelectToolbox;
      vm.createAnnotationObservation = createAnnotationObservation;
      vm.updateActiveManualObservationToolbox = updateActiveManualObservationToolbox;
      vm.createManualObservation = createManualObservation;
    }

    function setAllDataSources() {
      // Set all data sources to selected value from light config
      if (vm.dataSourceForAll !== 'none') {
        for (var key in vm.activeDataSource) {
          if (vm.activeDataSource.hasOwnProperty(key)) {
            vm.activeDataSource[key].source = vm.dataSource[vm.dataSourceForAll];
          }
        }
      }
    }

    function toggleConfigEdit() {
      vm.hideConfigEdit = !vm.hideConfigEdit;
    }

    // Intervals for current and sampled observation update
    function startContinuousUpdate() {
      vm.isUpdating = true;
      if (angular.isDefined(currentIntervalStop)) { return; }
      if (angular.isDefined(sampledIntervalStop)) { return; }

      currentIntervalStop = $interval(function () {
        updateAllCurrentObservationData(); 
      }, vm.currentDataUpdateDelay);

      sampledIntervalStop = $interval(function () {
        updateAllSampledObservationData(); 
      }, vm.timeScope.updateDelay);

      updateAllCurrentObservationData();
      updateAllSampledObservationData(); 
    }

    function stopContinuousUpdate() {
      if (angular.isDefined(currentIntervalStop)) {
        vm.isUpdating = false;
        $interval.cancel(currentIntervalStop);
        $interval.cancel(sampledIntervalStop);
        currentIntervalStop = undefined;
        sampledIntervalStop = undefined;
      }
    }

    // Update data in cockpit light row
    function updateAllCurrentObservationData() {
      var startDate = new Date(); 
      startDate.setTime(startDate.getTime() - 30 * 1000);
      var dateRange = '>=' + startDate.toISOString();

      ParameterData.updateObservationData(vm.currentCirculationParameters, vm.config, vm.activeDataSource, vm.noSignal, dateRange, 0);
    }

    // Update data in history table
    function updateAllSampledObservationData() {
      if (vm.isUpdating) {
        var dateRange = getObservationDateRange();
        
        // Fetch data for entire interval only in the first request for given timescope
        setMainRequest(vm.sampledCirculationParameters);
        setMainRequest(vm.sampledOtherParameters);
        
        ParameterData.updateObservationData(vm.sampledCirculationParameters, vm.config, vm.activeDataSource, vm.noSignal, dateRange, 0, vm.timeScope.updateDelay/1000);
        ParameterData.updateObservationData(vm.sampledOtherParameters, vm.config, vm.activeDataSource, vm.noSignal, dateRange, 0, vm.timeScope.updateDelay/1000);

        vm.currentTime = new Date().getTime();
        vm.oldTimeScope = vm.timeScope; 
        setTimeScopeLimits();

        if (!vm.initialized) { vm.initialized = true; }
      }
    }

    function getObservationDateRange() {
      // To make sure that we cover the entire interval we add a small offset to it. 
      var intervalOffset = 3 * vm.timeScope.updateDelay;      
      var startDate;

       // Set time limits depending on if current time is in domain and if the request is the first for given timescope
      if (vm.timeScope.hasManualTimeLimits) {
        startDate = new Date(vm.timeScope.lowerTimeLimit - intervalOffset); 
        var endDate = new Date(Math.min(vm.timeScope.upperTimeLimit, vm.currentTime) + intervalOffset); 
        return ['>=' + startDate.toISOString(), '<=' + endDate.toISOString()];
      } else {
        var timeIntervalLowerLimit = (vm.isMainRequest) ? vm.timeScope.value : intervalOffset;   
        startDate = new Date(vm.currentTime - timeIntervalLowerLimit); 
        return '>=' + startDate.toISOString();
      }
    }

    function setMainRequest(observationDataObjects) {
      // Is set to true for first request in given timescope
      for (var i in observationDataObjects) {
        observationDataObjects[i].data.primaryData.isMainRequest = vm.isMainRequest;
        observationDataObjects[i].data.primaryData.timeScope = vm.timeScope;
      }
      vm.isMainRequest = false;
    }

    function changeTimeScope() {
      if (vm.timeScope.editMode) {
        // If timescope was set to editmode give it the same properties as the timescope before
        vm.timeScope.value = vm.oldTimeScope.value;
        vm.timeScope.updateDelay = vm.oldTimeScope.updateDelay;
        setTimeScopeLimits();
      } else {
        // Timescope was changed, set new properties and reset main request flag
        setTimeScopeLimits();
        vm.isMainRequest = true;
        resetRandomChart();
        if (vm.isUpdating) {
          stopContinuousUpdate();
          startContinuousUpdate();
        }
      }
    }

    function setTimeScopeLimits() {
      // If timescope is manual, update time limits 
      if (!vm.timeScope.hasManualTimeLimits) {
        var currentTimeInterval = vm.timeScope.value/vm.nIntervals;
        var currentRoundedTime = Math.floor(vm.currentTime / currentTimeInterval) * currentTimeInterval;

        vm.timeScope.lowerTimeLimit = currentRoundedTime - (vm.nIntervalsBeforeCurrentTime * currentTimeInterval);
        vm.timeScope.upperTimeLimit = currentRoundedTime + (vm.nIntervalsAfterCurrentTime * currentTimeInterval);
      }
    }

    function resetRandomChart() {
      // Reset all circulation charts with random as data source
      for (var i in vm.sampledCirculationParameters) {
        var code = vm.sampledCirculationParameters[i].config.primaryConfig.includedObjects.parameter.type.coding[0].code;
        if (vm.activeDataSource[code].source === vm.dataSource.random) {
          vm.sampledCirculationParameters[i].data.primaryData = ParameterData.getDefaultDataObject(vm.cachedValuesSize);
          vm.sampledCirculationParameters[i].data.secondaryData = ParameterData.getDefaultDataObject(vm.cachedValuesSize);
          vm.sampledCirculationParameters[i].data.tertiaryData = ParameterData.getDefaultDataObject(vm.cachedValuesSize);  
        }
      }
    }

    function setManualTimeScope(min, max) {
      // Set new timescope from manual interval selection
      vm.intervalSelectVariables[vm.timelineIntervalSelectIdentifier].showIntervalSelect = false;
      vm.timeScope = {
        name: 'Manual', 
        editMode: false,
        hasManualTimeLimits: true,
        lowerTimeLimit: min,
        upperTimeLimit: max,
        value: max-min,
        updateDelay: (max-min) / 120
      };
      changeTimeScope();
      $scope.$apply();
    }

    function updateActiveIntervalSelectToolbox(code) {
      // Show only one interval select at the time
      if (vm.intervalSelectVariables[code].showIntervalSelect) {
        vm.intervalSelectVariables[code].showIntervalSelect = false;
      } else {
        resetAllManualObservationVariables();
        resetAllIntervalSelectVariables();
        vm.intervalSelectVariables[code].showIntervalSelect = true;
      }
    }

    function resetAllIntervalSelectVariables() {
      // Hide all interval selects
      for (var i in vm.intervalSelectVariables) {
        if (vm.intervalSelectVariables.hasOwnProperty(i)) {
          vm.intervalSelectVariables[i].showIntervalSelect = false;
        }
      }
    }

    function createAnnotationObservation(circulationParameter) {
      var code = circulationParameter.config.primaryConfig.includedObjects.parameter.type.coding[0].code;
      var minTime = new Date(vm.intervalSelectVariables[code].minTime.milliseconds); 
      var maxTime = new Date(vm.intervalSelectVariables[code].maxTime.milliseconds); 
      var text = vm.intervalSelectVariables[code].annotationText;
      var practitionerRef = 'Practitioner/' + vm.config.practitioner.id;
      var patientRef = 'Patient/' + vm.config.patient.id;

      var newAnnotation = ParameterData.createAnnotationObservation(code, patientRef, practitionerRef, minTime, maxTime, text);
      circulationParameter.annotations.push(newAnnotation);
        
      vm.intervalSelectVariables[code].showIntervalSelect = false;
      vm.intervalSelectVariables[code].annotationText = '';
    }

    function updateActiveManualObservationToolbox(code) {
      // Show only one manual observation input at the time
      if (vm.manualObservationVariables[code].showInputFields) {
        vm.manualObservationVariables[code].showInputFields = false;
      } else {
        resetAllManualObservationVariables();
        resetAllIntervalSelectVariables();
        vm.manualObservationVariables[code].showInputFields = true;
      }
    }

    function resetAllManualObservationVariables() {
      // Hide all manual observation inputs
      for (var i in vm.manualObservationVariables) {
        if (vm.manualObservationVariables.hasOwnProperty(i)) {
          vm.manualObservationVariables[i].showInputFields = false;
        }
      }
    }

    function createManualObservation(circulationParameter) {
      var code = circulationParameter.config.primaryConfig.includedObjects.parameter.type.coding[0].code;
      var date = vm.manualObservationVariables[code].date;
      var value = vm.manualObservationVariables[code].value;
      var practitionerRef = 'Practitioner/' + vm.config.practitioner.id;
      var patientRef = 'Patient/' + vm.config.patient.id;

      var newObservation = ParameterData.createManualObservation(code, patientRef, practitionerRef, date, value);
      circulationParameter.manualObservations.push(newObservation);

      vm.manualObservationVariables[code].showInputFields = false;
      vm.manualObservationVariables[code].date = new Date();
      vm.manualObservationVariables[code].value = 0;
    }

    $scope.$on('$destroy', function () {
      // Make sure that the interval is destroyed too
      vm.stopContinuousUpdate();
    });

    angular.element($window).bind('resize', function () {
      vm.isMainRequest = true;
      resetRandomChart();
      if (vm.isUpdating) {
        stopContinuousUpdate();
        startContinuousUpdate();
      }     
    });
  }
})();

