
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:fhirOtherParameterTable
 * @description
 * # fhirOtherParameterTable
 */

(function () {
	'use strict';

	angular.module('fhirCapacityApp')
		.directive('fhirOtherParameterTable', fhirOtherParameterTable);

	fhirOtherParameterTable.$inject = ['$window'];

	function fhirOtherParameterTable($window) {
		return {
			restrict: 'E',
			scope: {
				timeScope: '=timeScope',
				nIntervals: '=nIntervals',
				nIntervalsAfterCurrentTime: '=nIntervalsAfterCurrentTime',
				currentTime: '=currentTime',
				data: '=parameterData',
				config: '=parameterConfig',
				tableHeight: '=tableHeight'
	    },
			link: postLink 
		}

		function postLink(scope, element, attrs) {
			var vt = {};
			vt.primaryData = [];

			init();

			function init() {
				setupStyles();
				setupSvgElement();
			}

			function setupStyles() {
				vt.tableWidth = '100%';
				vt.tableHeight = scope.tableHeight;
				vt.nIntervals = scope.nIntervals;
				vt.nTableIntervals = vt.nIntervals * 2;
				vt.nIntervalsAfterCurrentTime = scope.nIntervalsAfterCurrentTime * 2;
			}

			function setupSvgElement() {
				vt.svg = d3.select(element[0]);
	    	vt.svg = vt.svg.append('svg')
	    		.attr('class', 'other-parameter-table')
	    		.attr('height', vt.tableHeight)
        	.attr('width', vt.tableWidth);
	    	
        vt.horizontalScale = setHorizontalScale();

        setupTable();
			}

		 	function setHorizontalScale() {
			 	var width = d3.select(element[0])[0][0].offsetWidth;

			 	return d3.scale.linear()
	        .domain([scope.timeScope.lowerTimeLimit, scope.timeScope.upperTimeLimit])
	        .range([0, width]);
		  }

			function setupTable() {
				var width = d3.select(element[0])[0][0].offsetWidth;
	    	
	    	vt.table = vt.svg.append('g').attr('class', 'old-values-history')
	    	  .attr('width', width)
			    .attr('height', vt.tableHeight);

			  // Go through table cells
			  for (var i=0; i < vt.nTableIntervals; i++) {
			  	var intervalLength = (width/vt.nTableIntervals);
			  	var tableCell = vt.table.append('g')
			  		.attr('class', 'table-cell');

			  	// Display stroke between cells
					tableCell.append('path')
						.attr('class', 'white-stroke')
						.attr('d', 'M' + (width - i * intervalLength) + ',' + 0 + 
							' L' + (width - i * intervalLength) + ',' + vt.tableHeight);

					// Display text field for table cell value
					tableCell.append('text')
						.attr('class', 'white-fill table-cell-value table-cell-value-index-' + i)
						.attr('x', (width - ((i + 1/2) * intervalLength)))
						.attr('y', vt.tableHeight/2)
						.attr('alignment-baseline', 'central');			  		
			  }
			}

			function updateData(newVals) {
				var isMainRequest = newVals.primaryData.isMainRequest;
				var observations = newVals.primaryData.observations;
				vt.primaryData = updateDataSet(observations, isMainRequest, vt.primaryData);
				updateTable();
			}

			function updateDataSet(observations, isMainRequest, data) {
				var newObservationData = [];
	      var latestTime = (data[0]) ? data[0].x : 0;

				// If this was the first request for a given timescope then clear all data
				if (isMainRequest) { data = []; }

	      for (var i = 0; i < observations.length; i++) {
	      	var xValue = observations[i].resource.effectiveDateTime;
					var yValue = observations[i].resource.valueQuantity.value;
					xValue = new Date(xValue).getTime(); 

					if (isMainRequest) {
						// If this was the first request for a given timescope then set all points to current data
						data.push({x: xValue,	y: yValue});
					} else {
					 	// If this was not the first request for a given timescope then update current data
						newObservationData = updateDataSetWithNewValues(data, newObservationData, xValue, yValue, latestTime);
					}
	      }
	      data = newObservationData.concat(data);
	      return data;
			}

			function updateDataSetWithNewValues(data, newObservationData, xValue, yValue, latestTime) {
				var newObservation = xValue > latestTime;
				var observationsOutsideTimeScope = data.length > scope.timeScope.value/scope.timeScope.updateDelay;			
			
				if (newObservation) {
					// Add new data point and remove the oldest
		     	newObservationData.push({x: xValue,	y: yValue});
		     	if (observationsOutsideTimeScope) { data.pop() }
		    }
		  	return newObservationData;
			}

			function updateTable() {
				if (vt.primaryData.length > 0) {
					var tableData = getTableData(vt.primaryData);
					displayTableData(tableData);
				}
			}

			function getTableData(data) {
				var nonSortedData = data;
				var sortedDataArray = [];

				var currentTime = new Date(scope.currentTime).getTime();
				var currentTimeInterval = scope.timeScope.value/vt.nTableIntervals;

				// Set upper timelimit depending on timescope
      	if (scope.timeScope.hasManualTimeLimits) {
					var upperTimeLimit = scope.timeScope.upperTimeLimit;
				} else {
					var currentTimeLineInterval = scope.timeScope.value/vt.nIntervals;
					var currentRoundedTime = Math.floor(currentTime / currentTimeLineInterval) * currentTimeLineInterval;
					var upperTimeLimit = currentRoundedTime + (vt.nIntervalsAfterCurrentTime * currentTimeInterval);
				} 

				for (var i = 0; i < vt.nTableIntervals; i++) {
					var maxTime = upperTimeLimit - i * currentTimeInterval;
					var minTime = upperTimeLimit - (i+1) * currentTimeInterval;
					var intervalAverage = 0;

					// Sort data to correct interval depending on time 
					if ((nonSortedData[0].x-scope.timeScope.updateDelay > minTime) && !(nonSortedData[nonSortedData.length - 1].x > upperTimeLimit) ) {
						var intervalData = getIntervalData(nonSortedData, maxTime, minTime);
						intervalAverage = intervalData.intervalAverage;
						nonSortedData = intervalData.nonSortedData;
					}
					sortedDataArray.push(intervalAverage);
				}
				return sortedDataArray;
			}

			function getIntervalData(nonSortedData, maxTime, minTime) {
				var  intervalAverage = 0;
				var intervalSum = 0;
				
				for (var i in nonSortedData) {
					// collect datapoints for given interval and calculate average
					intervalSum += nonSortedData[i].y;
					if (nonSortedData[i].x - scope.timeScope.updateDelay < minTime ||i == nonSortedData.length-1) {
						if (i > 0) { intervalAverage = intervalSum/(i+1) }
						nonSortedData = nonSortedData.slice(i, nonSortedData.length);
						return { intervalAverage:  intervalAverage, nonSortedData: nonSortedData};
					}
				}
				return { intervalAverage: 0, nonSortedData: nonSortedData};
			}

			function displayTableData(tableData) {
				vt.horizontalScale = setHorizontalScale();

				for (var i=0; i < tableData.length; i++) {
					var average = Math.round(tableData[i] * 10) / 10;
					var label = (average == 0) ? '' : average;
				
					vt.svg.select('.table-cell-value-index-' + i)
						.text(label);
				}
			}

			// Listen to when 'data' changes
			scope.$watch('data', function (newVals, oldVals) {
				if (newVals.primaryData.timeScope == scope.timeScope) {
					updateData(newVals);
				}
			}, true);

			// Listen to when 'timeScope' changes
			scope.$watch('timeScope', function (newVals, oldVals) {
				if (newVals.value != oldVals.value && !newVals.editMode) {
					vt.svg.remove();
					init();
					updateTable();
				}
			}, true);

			angular.element($window).bind('resize', function () {
				vt.svg.remove();
				init();
      });
		}

	}
})();

