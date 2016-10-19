
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:fhirCirculationParameterLineChart
 * @description
 * # fhirCirculationParameterLineChart
 */

(function () {
	'use strict';

	angular.module('fhirCapacityApp')
		.directive('fhirCirculationParameterLineChart', fhirCirculationParameterLineChart);

	fhirCirculationParameterLineChart.$inject = ['$window', 'CapacityUtils'];

	function fhirCirculationParameterLineChart($window, CapacityUtils) {
		return {
      templateUrl: 'views/history/circulation-linechart.html',
      restrict: 'E',
      replace: true,
			scope: {
      	timeScope: '=timeScope',
      	currentTime: '=currentTime',
				data: '=parameterData',
      	config: '=parameterConfig',
      	annotations: '=parameterAnnotations',
      	manualObservations: '=parameterManualObservations',
 				noSignal: '=noSignal',
      	lineChartHeight: '=lineChartHeight',
      	nIntervals: '=nIntervals'
     	},
			link: postLink 
		}

		function postLink(scope, element, attrs) {
			var lc = {};
			init();

			function init() {
				setupStyles();
				setupSvgElement();
				setupScopeFunctions();
				updateTargetLines();
			}

			function setupStyles() {
				lc.lineChartWidth = '100%';
				lc.lineChartHeight = scope.lineChartHeight;
				lc.alarmOffsetFactor = 0.3;
				lc.intervalEndWidth = 6;
				scope.hasOrdinationTarget = false;
				setupFocusBoxStyles(); 
			}

			function setupFocusBoxStyles() {
				scope.focusBoxStyle = {};
				scope.focusBoxStyle.top = 20;
				scope.focusBoxStyle.width = 110;
				scope.focusBoxStyle.display = 'none';	
				scope.focusBoxStyle.color = null;	
				scope.focusBoxStyle.fontSize = 14;
			}

			function setupSvgElement() {
				lc.svg = d3.select(element[0]);
	    	lc.svg = lc.svg.append('svg')
	    		.attr('class', 'circulation-line-chart')
	    		.attr('height', lc.lineChartHeight)
        	.attr('width', lc.lineChartWidth);

        lc.horizontalScale = setHorizontalScale();
        lc.verticalScale = setVerticalScale();

        setupPlot();
			}

		 	function setHorizontalScale() {
		 		var width = d3.select(element[0])[0][0].offsetWidth;

			 	return d3.scale.linear()
	        .domain([scope.timeScope.lowerTimeLimit, scope.timeScope.upperTimeLimit])
	        .range([0, width]);
		  }

			function setVerticalScale() {
				var scaleDomain = getScaleDomain();
        return d3.scale.linear()
          .domain(scaleDomain)
          .range([0, lc.lineChartHeight]);
	   	}

   		function getScaleDomain() {
	    	var upperDomain = scope.config.primaryConfig.styleObjects.alarmLimits.upperAlarm; 
				var lowerDomain = scope.config.primaryConfig.styleObjects.alarmLimits.lowerAlarm;

				// Adjust domain if there is secondary and tertiary data
				if (scope.data.secondaryData) { 
					upperDomain = scope.config.secondaryConfig.styleObjects.alarmLimits.upperAlarm; 
					lowerDomain = scope.config.tertiaryConfig.styleObjects.alarmLimits.lowerAlarm;
				}

				var intervalOffset = (upperDomain - lowerDomain) * lc.alarmOffsetFactor;
				return [upperDomain + intervalOffset, lowerDomain - intervalOffset];
	    }

			function setupPlot() {
				lc.primaryData = [];
				lc.secondaryData = [];
				lc.tertiaryData = [];				
	    	var width = d3.select(element[0])[0][0].offsetWidth;

	    	// Setup line chart 
	    	lc.plot = lc.svg.append('g').attr('class', 'old-values-history')
	    	  .attr('width', width)
			    .attr('height', lc.lineChartHeight);

				lc.focus = lc.svg.append('g')
			      .attr('class', 'focus')
			      .style('display', 'none');

			  // Focus point for mouseover
			  lc.focus.append('circle')
		      .attr('r', 3)
		      .attr('class', 'focus-point');

			  // Transparent overlay to catch mouseevents
			  lc.overlay = lc.svg.append('rect')
		      .attr('class', 'focus-overlay')
		      .attr('width', lc.lineChartWidth)
		      .attr('height', lc.lineChartHeight)
		      .on('mouseout', function() { hideFocusBox(); scope.$apply(); })
		      .on('mousemove', mousemove);

		    // Annotation group
	    	lc.annotations = lc.svg.append('g')
					.attr('class', 'circulation-annotations');

		    // Manual observation group
	    	lc.manualObservations = lc.svg.append('g')
					.attr('class', 'circulation-manual-observations');
			}

		  function mousemove() {
		  	// Mouse position
		    var mouseX = lc.horizontalScale.invert(d3.mouse(this)[0]);
		    var mouseY = lc.verticalScale.invert(d3.mouse(this)[1]);

		    // Catch points closest to mouse position
				var bisectTime = d3.bisector(function(d) { return d.x; }).right;
	      var	i = bisectTime(lc.primaryData, mouseX, 1);
	      var data0 = lc.primaryData[i-1];
	      var data1 = lc.primaryData[i];

	      if (data0 && data1) {
	      	// Deside closest point to mouse position
        	var closestData = mouseX - data0.x > data1.x - mouseX ? data1 : data0;

        	// Set maximum distance to point for showing focus box
        	var horizontalLimit = (lc.horizontalScale.domain()[1] - lc.horizontalScale.domain()[0]) / 2 * scope.nIntervals;
        	var verticalLimit = (lc.verticalScale.domain()[0] - lc.verticalScale.domain()[1]) / scope.nIntervals;

			   	 // Check if mouse is close enough in x and y direction for showing focus box
        	var mouseCloseToDataX = Math.abs(closestData.x - mouseX) <= horizontalLimit;
        	var mouseCloseToDataY = Math.abs(closestData.y - mouseY) <= verticalLimit;
        	var mouseCloseToData = mouseCloseToDataX && mouseCloseToDataY;

        	// Check if data point is visible
        	var dataIsInDomain = closestData.x >= lc.horizontalScale.domain()[0] && closestData.x < lc.horizontalScale.domain()[1];
		      var dataIsBeforeCurrentTime = closestData.x < (scope.currentTime - scope.timeScope.updateDelay);

		      if (mouseCloseToData && dataIsInDomain && dataIsBeforeCurrentTime) {
		      	showDataPointFocusBox(closestData);
			    } else {
			    	hideFocusBox();
			    }
			  } else {
			  	hideFocusBox();
			  }
			  scope.$apply();
		  }

		  function showDataPointFocusBox(closestData) {
  			var date = new Date(closestData.x);
  			var width = d3.select(element[0])[0][0].offsetWidth;

  			// Show focus point
	      lc.focus.style('display', null);
			  lc.focus.attr('transform', 'translate(' + lc.horizontalScale(closestData.x) + ',' + lc.verticalScale(closestData.y) + ')');

			  // Show focus box with x and y labels for closest data point
				scope.focusBoxStyle.display = null;
		    scope.focusBoxStyle.right = width - lc.horizontalScale(closestData.x) + 10;
		    scope.focusUpperlabel = 'X = ' + CapacityUtils.formatTime(date, true);
		    scope.focusBottomlabel = 'Y = ' + Math.round(closestData.y);
		  }
		  
		  function hideFocusBox() {
			  lc.focus.style('display', 'none');
			  scope.focusBoxStyle.display = 'none';
		  }

			function setupScopeFunctions() {
				scope.showOrdinationInfoFocusBox = showOrdinationInfoFocusBox;
				scope.hideOrdinationInfoFocusBox = setupFocusBoxStyles;
			}

		 	function showOrdinationInfoFocusBox() {
		 		// Show focus box for medication ordination
				scope.focusBoxStyle.display = null;
		    scope.focusBoxStyle.right = 35;
		    scope.focusBoxStyle.width = 'auto';
		    scope.focusBoxStyle.color = '#39b3d7';

		  	// Display medication and target limies
		    scope.focusUpperlabel = 'Medication: ' + scope.config.primaryConfig.styleObjects.ordination.medication;
		    scope.focusBottomlabel = 'Target: ' + scope.config.primaryConfig.styleObjects.ordination.dose;
			}

			function updateTargetLines() {
				if (scope.config.primaryConfig.styleObjects.ordination) {
					scope.hasOrdinationTarget = true;

					// Set target min and max lines
					var max = lc.verticalScale(scope.config.primaryConfig.styleObjects.ordination.upperOrdinationLimit);
					var min = lc.verticalScale(scope.config.primaryConfig.styleObjects.ordination.lowerOrdinationLimit);
					var fontSize = 14;

					scope.ordinationMinTargetStyle = {};
					scope.ordinationMaxTargetStyle = {};	
					scope.ordinationMaxTargetStyle.top = max;
					scope.ordinationMinTargetStyle.top = min;

					// Set target icon
					scope.ordinationIconTargetStyle = {};
					scope.ordinationIconTargetStyle.fontSize = fontSize;
					
					// Set target icon position depending on if lower line is visible or not
					scope.ordinationIconTargetStyle.top = min > scope.lineChartHeight ? (max + fontSize) : (max + ((min - max - fontSize) / 2)); 
	      }
			}

			function updatePlot(newVals, oldVals) {
        if (!scope.noSignal) {
					var isMainRequest = newVals[0].primaryData.isMainRequest;
					var observations = newVals[0].primaryData.observations;

					lc.primaryData = updateData(observations, isMainRequest, lc.primaryData);
					var pathData = getPathData(lc.primaryData);
					
					// Set plot with values collected in the hospital
					setPath(pathData[0], 'primary-plot');

					// Set plot with values collected by the patient
					setPath(pathData[1], 'patient-primary-plot');

					updateSecTerPlot(newVals, isMainRequest);
        } 
			}

			function updateSecTerPlot(newVals, isMainRequest) {
				if (newVals[0].secondaryData) {
					// Set secondary data plot
					var secondaryObservations = newVals[0].secondaryData.observations;
					lc.secondaryData = updateData(secondaryObservations, isMainRequest, lc.secondaryData);
					var secondaryPathData = getPathData(lc.secondaryData);
					
					setPath(secondaryPathData[0], 'secondary-plot');
					setPath(secondaryPathData[1], 'patient-secondary-plot');
				}

				if (newVals[0].tertiaryData) {
					// Set tertiary data plot
					var tertiaryObservations = newVals[0].tertiaryData.observations;
					lc.tertiaryData = updateData(tertiaryObservations, isMainRequest, lc.tertiaryData);
					var tertiaryPathData = getPathData(lc.tertiaryData);
					
					setPath(tertiaryPathData[0], 'tertiary-plot');
					setPath(tertiaryPathData[1], 'patienttertiary-plot');
				}				
			}

			function updateData(observations, isMainRequest, data) {
				var newObservationData = [];
	      var latestTime = (data[data.length-1]) ? data[data.length-1].x : 0;

				// If this was the first request for a given timescope then clear all data
				if (isMainRequest) { data = []; }

	      // Go through all observations
	      for (var i = 0; i < observations.length; i++) {
	      	var xValue = observations[i].resource.effectiveDateTime;
					var yValue = observations[i].resource.valueQuantity.value;
					xValue = new Date(xValue).getTime(); 
					var isCollectedByPatient = false;

					// Check if value was collected by patient
					if (observations[i].resource.performer) {
						isCollectedByPatient = CapacityUtils.getReferenceResourceType(observations[i].resource.performer[0].reference) === 'Patient';
					}

					if (yValue) {
						if (isMainRequest) {
							// If this was the first request for a given timescope then set all points to current data
							data.unshift({x: xValue,	y: yValue, isCollectedByPatient: isCollectedByPatient});
						} else {
							// If this was not the first request for a given timescope then update current data
						 	newObservationData = updateDataWithNewValues(data, newObservationData, xValue, yValue, latestTime, isCollectedByPatient);
						}
					}
	      }
	      data = data.concat(newObservationData);
	      return data;
			}

			function updateDataWithNewValues(data, newObservationData, xValue, yValue, latestTime, isCollectedByPatient) {
				var newObservation = xValue > latestTime;
				var observationsOutsideTimeScope = data.length > scope.timeScope.value/scope.timeScope.updateDelay;

				if (newObservation) {
					// Add new data point and remove the oldest
		     	newObservationData.unshift({x: xValue,	y: yValue, isCollectedByPatient: isCollectedByPatient});
		     	if (observationsOutsideTimeScope) { data.shift() }
		    }
		  	return newObservationData;
			}

			function getPathData(data) {
				var devicePathData = '';
				var patientPathData = '';

				lc.horizontalScale = setHorizontalScale();

				for (var i in data) {
					if (data[i].isCollectedByPatient) {
						// Add data collected by the patient to one path
						patientPathData = addPointToPathData(patientPathData, data[i]);
					} else {
						// Add data collected in the hospital to one path
						devicePathData = addPointToPathData(devicePathData, data[i]);
					}
				}
				return [devicePathData, patientPathData];
			}

			function addPointToPathData(pathData, dataPoint) {
				// Update svg path data string with data point
				if (pathData == '') {
					pathData = pathData + 'M' + lc.horizontalScale(dataPoint.x) + 
						',' + lc.verticalScale(dataPoint.y);
				} else  {
					pathData = pathData + ' L' + lc.horizontalScale(dataPoint.x) + 
						',' + lc.verticalScale(dataPoint.y);
				} 
				return pathData;
			}

			function setPath(pathData, className) {
				if (!lc.svg.select('.' + className)[0][0]) {
					// Create path if it doesn't exist
					createPath(pathData, className);
				} else {
					// Update already existing path 
					updatePath(pathData, '.' + className);
				}		
			}
			
			function createPath(pathData, plotClass) {
				lc.svg.select('.old-values-history').append('path')
        	.attr('class', plotClass)
          .attr('d', pathData);
			}

			function updatePath(pathData, plotClass) {
				var lineGraph = lc.svg.select(plotClass);
				lineGraph.attr('d', pathData);				
			}

			function updateAnnotations(newVals) {
				// Reset all displayed annotations
				lc.annotations.selectAll("*").remove(); 
				var verticalSpace = 10;

				// Go through and display all annotations
				for (var i in newVals) {
					var min = new Date(newVals[i].effectivePeriod.start).getTime();
					var max = new Date(newVals[i].effectivePeriod.end).getTime();

					// Left interval end 
					lc.annotations.append('rect')
	          .attr('x', lc.horizontalScale(min)-(lc.intervalEndWidth/2))
	          .attr('class', 'white-fill')
	          .attr('height', '10px')
	          .attr('width', lc.intervalEndWidth);

					// Right interval end 
					lc.annotations.append('rect')
	          .attr('x', lc.horizontalScale(max)-(lc.intervalEndWidth/2))
	          .attr('class', 'white-fill')
	          .attr('height', '10px')
	          .attr('width', lc.intervalEndWidth);

					// Interval fill 
					lc.annotations.append('rect')
	          .attr('x', lc.horizontalScale(min))
	          .attr('class', 'circulation-annotation-interval white-fill')
	          .attr('height', '10px')
	          .attr('width', lc.horizontalScale(max) - lc.horizontalScale(min))
	          .on('mouseout', function() { setupFocusBoxStyles() } )
		      	.on('mousemove', function() { showAnnotationFocusBox(d3.mouse(this)[0], min, max, newVals[i].comments) } );
				}
			}

		 	function showAnnotationFocusBox(mouse, min, max, text) {
		 		var width = d3.select(element[0])[0][0].offsetWidth;
		 		var intervalWidth = ((lc.horizontalScale(max) - lc.horizontalScale(min))/2);

		 		// Show annotation focus box
				scope.focusBoxStyle.top = 15;
				scope.focusBoxStyle.display = null;
		    scope.focusBoxStyle.right = width - mouse - 55;
		    scope.focusBoxStyle.color = '#fff';
		    scope.focusBoxStyle.fontSize = 12;

		    scope.focusBoxStyle.width = 200;

		    // Display interval limits and notes
		    scope.focusUpperlabel = 'Interval: ' + CapacityUtils.formatTime(new Date(min)) + '-' + CapacityUtils.formatTime(new Date(max));
		    scope.focusBottomlabel = 'Notes: ' + text;

				scope.$apply();
			}

			function updateManualObservations(newVals) {
				lc.manualObservations.selectAll("*").remove(); 				

				for (var i in newVals) {
					var time = new Date(newVals[i].effectiveDateTime).getTime();
					var value = newVals[i].valueQuantity.value;

					// Manual observation point
					lc.manualObservations.append('circle')
						.attr('class', 'circulation-manual-observation white-fill')
						.attr('cx', lc.horizontalScale(time))
						.attr('cy', lc.verticalScale(value))
						.attr('r', 4)
						.on('mousemove', function() {  showManualObservationFocusBox(this) } )
						.on('mouseout', function() { setupFocusBoxStyles() } ); 
				}
			}

		  function showManualObservationFocusBox(annotation) {
		  	var xValue = d3.select(annotation).attr("cx");
		  	var yValue = d3.select(annotation).attr("cy");

		  	var time = new Date(lc.horizontalScale.invert(xValue));
		  	var value = lc.verticalScale.invert(yValue);
  			var width = d3.select(element[0])[0][0].offsetWidth;

  			// Show manual observation focus box
				scope.focusBoxStyle.display = null;
		    scope.focusBoxStyle.right = width - lc.horizontalScale(time) + 10;
		    scope.focusBoxStyle.color = '#fff';

		    // Display x and y labels
		    scope.focusUpperlabel = 'X = ' + CapacityUtils.formatTime(time, true);
		    scope.focusBottomlabel = 'Y = ' + Math.round(value);

		    scope.$apply();
		  }

			// Listen to when 'config' changes
			scope.$watch('config', function () {
	      updateTargetLines();
	    }, true);

			// Listen to when 'data' changes
			scope.$watch('data', function (newVals, oldVals) {
				if (newVals.primaryData.timeScope == scope.timeScope) {
					updatePlot([newVals, scope.config], [oldVals, scope.config]);
				}
			}, true);

			// Listen to when 'timeScope' changes
			scope.$watch('timeScope', function (newVals, oldVals) {
				if (newVals.value != oldVals.value && !newVals.editMode) {
					lc.svg.remove();
					init();
					updateAnnotations(scope.annotations);
					updateManualObservations(scope.manualObservations);
				}
			}, true);

			// Listen to when 'annotations' changes
			scope.$watch('annotations', function (newVals, oldVals) {
				updateAnnotations(newVals);
			}, true);

			// Listen to when 'manualObservations' changes
			scope.$watch('manualObservations', function (newVals, oldVals) {
				updateManualObservations(newVals)
			}, true);

			angular.element($window).bind('resize', function () {
        lc.svg.remove();
				init();  
				updateAnnotations(scope.annotations);
				updateManualObservations(scope.manualObservations);
      });
		}
	}
})();

