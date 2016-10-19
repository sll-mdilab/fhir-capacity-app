
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:CockpitCtrl
 * @description
 * # CockpitCtrl
 * Controller of the fhirCapacityApp
 */
 
(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('CockpitCtrl', CockpitCtrl);

  CockpitCtrl.$inject = ['$scope' ,'$interval', '$window', 'SharedConfig', 'CapacityUtils', 'ParameterData', 'ActiveDataSource', 'DefaultParameters'];

  function CockpitCtrl($scope, $interval, $window, SharedConfig, CapacityUtils, ParameterData, ActiveDataSource, DefaultParameters) {
    var vm = this;
    var intervalStop; 

    init();

    function init() {
      vm.defaultParameters = DefaultParameters; // To be used in the view
      vm.config = SharedConfig.get();

      setLightMode();
      initVariables();
      initParameterConfig();
      setupScopeFunctions();

      setSelectedCodesToLiveAsDefault();
    }

    function setLightMode() {
      vm.lightMode = window.innerWidth < 500;  
    }

    function initVariables() {
      vm.cachedValuesSize = 5;
      vm.updateDelay = 3000;
      vm.inputFile = '';
      vm.hideInstruction = true;
      vm.hideConfigEdit = true;
      vm.isUpdating = false;
      vm.singleSpin = false;
      vm.orientation = {
        'left': 'left',
        'right': 'right',
        'bottom': 'bottom',
        'top': 'top'
      };
    }

    function initParameterConfig() {  
      // Circulation parameter data
      vm.circulationParameters = ParameterData.getParameterObject(vm.config, 'circulation', vm.cachedValuesSize);

      // Other parameter data
      var allOtherParameters = ParameterData.getParameterObject(vm.config, 'other', vm.cachedValuesSize);
      vm.otherParameters = getPrioritizedOtherParameters(allOtherParameters);

      // Temperature parameter
      vm.temperatureParameters = {};
      vm.temperatureParameters[DefaultParameters.temperature.code] = allOtherParameters[DefaultParameters.temperature.code];      

      // Waveform parameter data
      vm.activeWaveformData = ParameterData.getDefaultPrimaryDataObject(vm.cachedValuesSize);
      vm.activeWaveformData.primaryData.observations = ParameterData.getDefaultWaveformObservationObject();

      initWaveformParams();
      initDataSourceParams();
      updateAllObservationData();
    }

    function getPrioritizedOtherParameters(parameters) {
      var object = {};

      // Prioritized parameters for bar chart
      getPrioritizedOtherParameter(object, parameters, DefaultParameters.RR.code);
      getPrioritizedOtherParameter(object, parameters, DefaultParameters.IERatio.code);
      getPrioritizedOtherParameter(object, parameters, DefaultParameters.FIO2.code);

      // Decide max number of bar charts displayed
      var noBarCharts = 3;

      for (var i in parameters) {
        var code = parameters[i].config.primaryConfig.includedObjects.parameter.type.coding[0].code;
        if (parameters.hasOwnProperty(i) && Object.keys(object).length < noBarCharts && code !== DefaultParameters.temperature.code) {
          object[i] = parameters[i];
        }
      }
      return object;
    }

    function getPrioritizedOtherParameter(object, parameters, code) {
      if (parameters[code]) { 
        object[code] = parameters[code]; 
        delete parameters[code];
      }
    }

    function initWaveformParams() {
      vm.waveformChartConfig = ParameterData.getWaveFormChartConfig();

      vm.displayWaveformOptions = {
        heartRate: {displayName: 'Heart Rate', code: 'MDC_ECG_LEAD_I'},
        bloodPressure: {displayName: 'Blood Pressure', code: 'MDC_PRESS_BLD_ART'},
        saturation: {displayName: 'Saturation', code: 'MDC_PULS_OXIM_SAT_O2_WAVEFORM'}
      };

      vm.activeWaveform = vm.displayWaveformOptions.heartRate;
      vm.activeWaveformConfig = vm.waveformChartConfig.heartRate;
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
      vm.dynamicParameters = vm.otherParameters;
      vm.noSignal = ActiveDataSource.setNoSignal(vm.config.parameterConfig);
    }

    function setSelectedCodesToLiveAsDefault() {
      // Set Heart Rate and Saturation to live as default
      vm.activeDataSource.MDC_PULS_OXIM_PULS_RATE = angular.copy({source: vm.dataSource.live});
      vm.activeDataSource.MDC_PULS_OXIM_SAT_O2 = angular.copy({source: vm.dataSource.live});
    }

    function setupScopeFunctions() {
      // Accessible from the view
      vm.changeLocation = CapacityUtils.changeLocation;   
      vm.setAllDataSources = setAllDataSources;
      vm.changeActiveWaveform = changeActiveWaveform;
      vm.toggleConfigEdit = toggleConfigEdit;
      vm.updateAllObservationData = updateAllObservationData;
      vm.startContinuousUpdate = startContinuousUpdate;
      vm.stopContinuousUpdate = stopContinuousUpdate;
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

    function changeActiveWaveform(newWf) {
      console.log('Changing waveform to: ' + newWf);
      vm.activeWaveform = vm.displayWaveformOptions[newWf];
      vm.activeWaveformConfig = vm.waveformChartConfig[newWf];
    }

    function toggleConfigEdit() {
      vm.hideConfigEdit = !vm.hideConfigEdit;
    }

    function updateAllObservationData() {
      var startDate = new Date(); 
      startDate.setTime(startDate.getTime() - 30 * 1000);
      var dateRange = '>=' + startDate.toISOString();

      ParameterData.updateObservationData(vm.circulationParameters, vm.config, vm.activeDataSource, vm.noSignal, dateRange, 0);
      ParameterData.updateObservationData(vm.otherParameters, vm.config, vm.activeDataSource, vm.noSignal, dateRange, 0);
      ParameterData.updateObservationData(vm.temperatureParameters, vm.config, vm.activeDataSource, vm.noSignal, dateRange, 0);
      
      ParameterData.updateWaveformObservationData(vm.activeWaveformData, vm.activeWaveform.code, vm.config, vm.noSignal);
    }

    // Interval for observation update
    function startContinuousUpdate() {
      vm.isUpdating = true;
      if (angular.isDefined(intervalStop)) {
        return;
      }

      if (!angular.isDefined(vm.updateDelay)) {
        vm.updateDelay = 3 * 1000;
      }

      intervalStop = $interval(function () {
        updateAllObservationData(); 
      }, vm.updateDelay);
    }

    function stopContinuousUpdate() {
      if (angular.isDefined(intervalStop)) {
        vm.isUpdating = false;
        $interval.cancel(intervalStop);
        intervalStop = undefined;
      }
    }

    $scope.$on('$destroy', function () {
      // Make sure that the interval is destroyed too
      vm.stopContinuousUpdate();
    });

    angular.element($window).bind('resize', function () {
        setLightMode();
    });
  }
})();

