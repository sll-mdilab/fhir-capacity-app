
/**
 * @ngdoc function
 * @name fhirWebApp.controller:ParameterData
 * @description
 * # ParameterData
 * Factory of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('ParameterData', ParameterData);

  ParameterData.$inject = ['$q', '$filter', 'CapacityUtils', 'fhirObservation', 'DefaultParameters', 'ActiveDataSource', 'MinMaxCalculation', 'RegressionCalculation'];

  function ParameterData($q, $filter, CapacityUtils, fhirObservation, DefaultParameters, ActiveDataSource, MinMaxCalculation, RegressionCalculation) {
    var dataSources = ActiveDataSource.getDataSources();
    var manualMethodCode = 'MMEAS';

    return {
      getParameterObject: getParameterObject,
      getDefaultPrimaryDataObject: getDefaultPrimaryDataObject,
      getDefaultDataObject: getDefaultDataObject,
      getDefaultWaveformObservationObject: getDefaultWaveformObservationObject,
      getWaveFormChartConfig: getWaveFormChartConfig,      
      updateObservationData: updateObservationData,
      updateWaveformObservationData: updateWaveformObservationData,
      fetchAnnotationObservations: fetchAnnotationObservations,
      createAnnotationObservation: createAnnotationObservation,
      fetchManualObservations: fetchManualObservations,
      createManualObservation: createManualObservation,
      setNoCirculationAnnotations: setNoCirculationAnnotations
    };

    function getParameterObject(config, type, cachedValuesSize) {
      var parameters = {};
      
      // Get parameter objects with config and default data objects for all ordered parameters of specific type
      for (var i in config.parameterConfig) {
        if (config.parameterConfig.hasOwnProperty(i) && checkParameterType(config.parameterConfig[i].includedObjects.parameter, type)) {
          var parameter = {
            config: {primaryConfig: config.parameterConfig[i]},
            data: {primaryData: getDefaultDataObject(cachedValuesSize)}
          };

          // Add secondary and tertiary configs and data objects for bloodPressure
          if (config.parameterConfig[i].includedObjects.parameter.type.coding[0].code === DefaultParameters.bloodPressure.code) {
            parameter.data.secondaryData = getDefaultDataObject(cachedValuesSize);
            parameter.data.tertiaryData = getDefaultDataObject(cachedValuesSize);
            parameter.config.secondaryConfig = config.parameterConfig[DefaultParameters.bloodPressureSystolic.code];
            parameter.config.tertiaryConfig = config.parameterConfig[DefaultParameters.bloodPressureDiastolic.code];
          } 
          parameters[config.parameterConfig[i].includedObjects.parameter.type.coding[0].code] = parameter;
        } 
      }
      return parameters;
    }

    function checkParameterType(parameter, type) {
      // Check if parameter is primary and of given time
      var isEqualToType = parameter.extension[0].valueString === type;
      var isSecondary = parameter.type.coding[0].code === DefaultParameters.bloodPressureSystolic.code;
      var isTertiary = parameter.type.coding[0].code === DefaultParameters.bloodPressureDiastolic.code;
      return (isEqualToType && !isSecondary && !isTertiary);
    }

    function getDefaultPrimaryDataObject(cachedValuesSize) {
      return { primaryData: getDefaultDataObject(cachedValuesSize) };
    }

    function getDefaultDataObject(cachedValuesSize) {
      return {
        nrUpdates: 0,
        observations: fhirObservation.instantiateEmptyObservation().entry,
        cachedValues: [],
        cachedValuesSize: cachedValuesSize,
        maxValue: undefined,
        minValue: undefined
      };
    }  

    function getDefaultWaveformObservationObject() {
      return fhirObservation.instantiateEmptyWaveFormObservation().entry;
    }

    function getWaveFormChartConfig() {
      var waveformChartConfig = {};

      function getWaveformDim() {
        return {dim: {height: 100, width: 435}};
      }

      waveformChartConfig.heartRate = getWaveformDim();
      waveformChartConfig.saturation = getWaveformDim();
      waveformChartConfig.bloodPressure = getWaveformDim();

      // Wave form config for heart rate
      waveformChartConfig.heartRate.color = '#68ff5a';
      waveformChartConfig.heartRate.code = 'MDC_ECG_LEAD_I';
      waveformChartConfig.heartRate.scales = {y: [-0.55, 1.6]};

      // Wave form config for saturation
      waveformChartConfig.saturation.color = '#fcf95c';
      waveformChartConfig.saturation.code = 'MDC_PULS_OXIM_SAT_O2_WAVEFORM';
      waveformChartConfig.saturation.scales = {y: [0, 3.5]};

      // Wave form config for blood pressure
      waveformChartConfig.bloodPressure.color = '#ff5456';
      waveformChartConfig.bloodPressure.code = 'MDC_PRESS_BLD_ART';
      waveformChartConfig.bloodPressure.scales = {y: [32, 141]};

      return waveformChartConfig;
    }

    function updateObservationData(parameterObjects, config, activeDataSource, noSignal, dateRange, futureOffset, samplingPeriod) {
      // Go trough parameter objects and update observationdata objects
      for (var i in parameterObjects) { 
        var code = parameterObjects[i].config.primaryConfig.includedObjects.parameter.type.coding[0].code;
        var data = parameterObjects[i].data.primaryData;
        updateSingleDataObject(code, data, activeDataSource[code], config, noSignal, dateRange, futureOffset, samplingPeriod);
     
        if (parameterObjects[i].data.secondaryData) {
        // Update secondary data if it exists
          var code = parameterObjects[i].config.secondaryConfig.includedObjects.parameter.type.coding[0].code;
          var data = parameterObjects[i].data.secondaryData;
          updateSingleDataObject(code, data, activeDataSource[code], config, noSignal, dateRange, futureOffset, samplingPeriod);
        } 

        if (parameterObjects[i].data.tertiaryData) {
          // Update tertiary data if it exists
          var code = parameterObjects[i].config.tertiaryConfig.includedObjects.parameter.type.coding[0].code;
          var data = parameterObjects[i].data.tertiaryData;
          updateSingleDataObject(code, data, activeDataSource[code], config, noSignal, dateRange, futureOffset, samplingPeriod);
        } 
      } 
    }

    function updateWaveformObservationData(waveformParameterObject, code, config, noSignal) {
      randomUpdate(code, waveformParameterObject.primaryData, noSignal, config);
      postUpdate(waveformParameterObject.primaryData, config.generalConfig.regression);
    }

    function updateSingleDataObject(code, data, dataSource, config, noSignal, dateRange, futureOffset, samplingPeriod) {
      var currentPatient = config.patient.id;
      var regressionConfig = config.generalConfig.regression;

      if (dataSource.source === dataSources.random) {
        // Update with random values
        randomUpdate(code, data, noSignal, config);
        postUpdate(data, regressionConfig);
      } else if (dataSource.source === dataSources.live) {
        liveUpdate(code, data, dataSource, noSignal, currentPatient, dateRange, futureOffset, samplingPeriod).then(function () {
          // If observations is defined
          if (data.observations) {
            postUpdate(data, regressionConfig);
          }
        });
      } else {
        throw new Error('Data Mode \'' + dataSource.source + '\' is not recognized.');
      }
    }

    function postUpdate(dataObject, regressionConfig) {
      dataObject.nrUpdates++;
      if (!isWaveForm(dataObject.observations[0].resource)) {

        // Set valueQuantity for objects with valueString
        if (dataObject.observations[0].resource.valueString) {
          for (var i = 0; i < dataObject.cachedValuesSize; i++) {
            var valueString = dataObject.observations[0].resource.valueString;
            var value = parseInt(valueString.replace('1:', ''));
            dataObject.observations[i].resource.valueQuantity = { value: value };
          }
        }

        // Update min and max values
        var minMaxResult = MinMaxCalculation.calculateMinMax(dataObject);

        if (minMaxResult){
          dataObject.minValue = minMaxResult.min;
          dataObject.maxValue = minMaxResult.max;
        }

        // Update regression
        var params = RegressionCalculation.performLinearRegression(dataObject, regressionConfig.past);
        var futureValue = RegressionCalculation.evaluatePolynomial([params[0], params[1]], dataObject.nrUpdates + regressionConfig.future);

        dataObject.regression = {
          slope: params[0],
          intercept: params[1],
          futureValue: futureValue,
          past: regressionConfig.past,
          future: regressionConfig.future
        };
      }
    }

    function isWaveForm(resource) {
      return !!resource.valueSampledData;
    }

    function randomUpdate(code, dataObject, noSignal, config) {
      var existingObservations = dataObject.nrUpdates === 0 ? [] : dataObject.observations;
      var randomResponse;

      if (isWaveForm(dataObject.observations[0].resource)) {
        randomResponse = fhirObservation.generateRandomWaveFormObservation(code);
      } else {
        // Create random observation from parameter distribution config
        randomResponse = fhirObservation.generateRandomObservation(
          code, 
          config.parameterConfig[code].styleObjects.distribution.mean, 
          config.parameterConfig[code].styleObjects.distribution.deviation
        );
      }
      existingObservations.push(randomResponse.entry[0]);
      dataObject.observations = $filter('orderBy')(existingObservations, 'resource.effectiveDateTime', true);
      noSignal[code] = false;
    }

    function liveUpdate(code, data, dataSource, noSignal, currentPatient, dateRange, futureOffset, samplingPeriod) {
      return fhirObservation.getObservationsByPatientId(currentPatient, dateRange, code, samplingPeriod).then(function (returnData) {
        // Set time limit for outdated response
        var timeUntilOld = 15000;
        
        // Set observation data
        var sortedObservations = $filter('orderBy')(returnData.entry, 'resource.effectiveDateTime', true);
        if (sortedObservations) {
          data.observations = sortedObservations;
        }

        // Set no signal
        if (returnData.total <= 0) {
          // If no observations were find, set no signal to true
          noSignal[code] = true;
          console.warn('No entries were retrieved in the response for ' + code);
        } else if (new Date() + futureOffset - new Date(data.observations[0].resource.effectiveDateTime) > timeUntilOld) {
            // If response was to slow, set no signal to true
          noSignal[code] = true;
          console.warn('Entries retrieved for code ' + code + ' is older than ' + timeUntilOld + 'ms.');
        } else {
          // If observations were find in a propriate time, set no signal to false
          noSignal[code] = false;
        }
      }, function () {
        throw new Error('There was a problem communicating with the server.');
      });
    }

    function fetchAnnotationObservations(list, currentPatient, dateRange, code) {
      return fhirObservation.getAnnotationObservationsByPatientId(currentPatient, dateRange, code).then(function(result) {
        for (var i in result) {
          list.push(result[i]);
        }
      });
    }

    function createAnnotationObservation(code, patientReference, performerReference, start, end, comment) {
      var newObservation = fhirObservation.instantiateEmptyAnnotationObservation();

      newObservation.code.coding = [{code: code}];
      newObservation.subject.reference = patientReference;
      newObservation.performer.reference = performerReference;
      newObservation.effectivePeriod.start = start.toISOString(),
      newObservation.effectivePeriod.end = end.toISOString(),
      newObservation.comments = comment;

      fhirObservation.createObservation(newObservation);
      return newObservation;
    }


    function fetchManualObservations(list, currentPatient, dateRange, parameterCode) {
      return fhirObservation.getManualObservationsByPatientId(currentPatient, dateRange, parameterCode, manualMethodCode).then(function(result) {
        for (var i in result) {
          list.push(result[i]);
        }
      });
    }

    function createManualObservation(code, patientReference, performerReference, date, value) {
      var newObservation = fhirObservation.instantiateEmptyManualObservation();

      newObservation.code.coding = [{code: code}];
      newObservation.subject.reference = patientReference;
      newObservation.performer.reference = performerReference;
      newObservation.effectiveDateTime = date.toISOString(),
      newObservation.valueQuantity.value = value;

      fhirObservation.createObservation(newObservation);
      return newObservation;
    }

    function setNoCirculationAnnotations(patientId, circulationParameterList, timeLimit, object) {
      var noAnnotations = 0;
      var resultObject = {};
      var prom = [];

      // Check annoation in the most recent time interval (depending on given timeLimit) for all parameters in list
      for (var i in circulationParameterList) {   
        var currentDate = new Date();
        var dateRange = '>=' + new Date(currentDate.getTime()-timeLimit).toISOString();
        resultObject[i] = {list: []}
        
        prom.push(fetchAnnotationObservations(resultObject[i].list, patientId, dateRange, circulationParameterList[i]));
      }

      // Wait for all annotation responses
      $q.all(prom).then(function () {
        // Count annotations
        for (var i in resultObject) {
          if (resultObject.hasOwnProperty(i)) {
            noAnnotations += resultObject[i].list.length;
          }
        }
        object.noCirculationAnnotations = noAnnotations;
      });
    } 

  }
})();
