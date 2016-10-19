
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:lightlineargauge
 * @description
 * # lightlineargauge
 */

(function () {
	'use strict';

	angular.module('fhirCapacityApp')
		.directive('fhirLightLinearGauge', fhirLightLinearGauge);

	fhirLightLinearGauge.$inject = ['$window', 'CapacityUtils'];

	function fhirLightLinearGauge($window, CapacityUtils) {
		return {
			restrict: 'E',
			scope: {
				updateDelay: '=updateDelay',
				isUpdating: '=isUpdating',
				noSignal: '=noSignal',
      	config: '=config',
      	data: '=parameterData',
      	gaugeWidth: '=gaugeWidth',
      	gaugeHeight: '=gaugeHeight',
      	alarmWidth: '=alarmWidth'
    	},
			link: postLink 
		}

		function postLink(scope, element, attrs) {
			var llg = {};
	    llg.initialized = false;
			llg.saturationCode = 'MDC_PULS_OXIM_SAT_O2';

			setupStyles();
			setupSvgElement();
			setupGradient();
			configureGradientStops();
			setGradientStops();
			
			// Set up initial values for value and lower alarm pointers
			setCurrentValuePointer(scope.data.primaryData.observations[0].resource.valueQuantity.value);
			setAlarmPointer(scope.config.primaryConfig.styleObjects.alarmLimits.lowerAlarm, 'lower-alarm');

			// Set up upper alarm pointer for all parameters except saturation 
			if (!(scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code === llg.saturationCode)) {
				setAlarmPointer(scope.config.primaryConfig.styleObjects.alarmLimits.upperAlarm, 'upper-alarm');
			}

			function setupStyles() {
				llg.svgWidth = '65';
				llg.gaugeWidth = scope.gaugeWidth;
				llg.gaugeHeight = scope.gaugeHeight;
				llg.alarmWidth = scope.alarmWidth;
				llg.alarmHeight = '2';
				llg.currentValueHeight = '4';
				llg.oldWidth = 0;

				llg.colors = {
					red: '#d2322d',
					orange: '#ed9c28',
					green: '#47a447',
					grey: '#222'
		    };

				llg.alarmThresholdsOffset = 5;
		    llg.transitionDelay = 1000;
			}

			function setupSvgElement() {
				updateBoxSize();
				llg.svg = d3.select(element[0]);
	    	llg.svg = llg.svg.append('svg')
	    		.attr('class', 'light-observation-linear-gauge')
	    		.attr('height', llg.gaugeHeight)
	        .attr('width', llg.svgWidth)
	        .attr('style', 'display:block')
	        .attr('y', 0);
	    	
	    	llg.defs = llg.svg.append('svg:defs');

	    	var scaleDomain = getScaleDomain();
	    	llg.gradientScale = d3.scale.linear()
	        .domain(scaleDomain)
	        .range([0, 1]);	

	      llg.horizontalScale = setHorizontalScale();		        
	      llg.verticalScale = setVerticalScale();

	      setupOldValuePlot();
			}

			function setupOldValuePlot() {
				// Setup line chart for old values
				llg.nOldValues = 15;
				llg.oldValues = [];
				llg.svg.select("defs").append("clipPath")
				    .attr("id", "clip")
				  .append("rect")
				  	.attr("class", "clip-path-rect")
				    .attr("width", llg.svgWidth-(llg.svgWidth/llg.nOldValues))
				    .attr("height", llg.gaugeHeight);

	    	llg.oldValuePlot = llg.svg.append('g').attr('class', 'light-old-values')
	    	  .attr("width", llg.oldValuePlotWidth)
			    .attr("height", llg.gaugeHeight)
			    .attr("clip-path", "url(#clip)");
			}

			function updateBoxSize() {				
				llg.svgWidth = $('#light-observation-box').parent().width();
				llg.oldValuePlotWidth = llg.svgWidth - llg.gaugeWidth;
			}

	    function setHorizontalScale() {
        return d3.scale.linear()
          .domain([0, llg.nOldValues])
          .range([llg.oldValuePlotWidth, 0]);
	    }

			function setVerticalScale() {
	    	var scaleDomain = getScaleDomain();
	      return d3.scale.linear()
	        .domain(scaleDomain)
	        .range([0, llg.gaugeHeight]);
	    }

	    function getScaleDomain() {
	    	var upperDomain = scope.config.primaryConfig.styleObjects.alarmLimits.upperAlarm + llg.alarmThresholdsOffset;
				var lowerDomain = scope.config.primaryConfig.styleObjects.alarmLimits.lowerAlarm - llg.alarmThresholdsOffset;

				if (scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code === llg.saturationCode) {
					upperDomain = 100 + 0.5;
				}
				return [upperDomain, lowerDomain];
	    }

			function setupGradient() {
				llg.gradient = llg.defs.append('svg:linearGradient')
					.attr('id', scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient')
					.attr('x1', '0%')
					.attr('y1', '0%')
					.attr('x2', '0%')
					.attr('y2', '100%');
		    }

	    function configureGradientStops() {
        var stopColor = {
          lowerAlarm: llg.colors.red,
          lowerAlarm2: llg.colors.orange,
          lowerWarn: llg.colors.green,
          upperWarn: llg.colors.green,
          upperAlarm: llg.colors.orange,
          upperAlarm2: scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code === llg.saturationCode ? llg.colors.green : llg.colors.red
        };

        // Set gradient colors
        var lowerAlarmGradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        lowerAlarmGradStop.setAttribute('id', scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-lower-alarm');
        lowerAlarmGradStop.setAttribute('stop-color', stopColor.lowerAlarm);

        var lowerAlarm2GradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        lowerAlarm2GradStop.setAttribute('id', scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-lower-alarm-2');
        lowerAlarm2GradStop.setAttribute('stop-color', stopColor.lowerAlarm2);

        var lowerWarnGradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        lowerWarnGradStop.setAttribute('id', scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-lower-warn');
        lowerWarnGradStop.setAttribute('stop-color', stopColor.lowerWarn);

        var upperWarnGradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        upperWarnGradStop.setAttribute('id', scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-upper-warn');
        upperWarnGradStop.setAttribute('stop-color', stopColor.upperWarn);

        var upperAlarmGradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        upperAlarmGradStop.setAttribute('id', scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-upper-alarm');
        upperAlarmGradStop.setAttribute('stop-color', stopColor.upperAlarm);

        var upperAlarm2GradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        upperAlarm2GradStop.setAttribute('id', scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-upper-alarm-2');
        upperAlarm2GradStop.setAttribute('stop-color', stopColor.upperAlarm2);

        var gradStopArr = [lowerAlarmGradStop, lowerAlarm2GradStop, lowerWarnGradStop,
          upperWarnGradStop, upperAlarmGradStop, upperAlarm2GradStop];
        var grad = document.getElementById(scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient');
	    	
	    	var stopIdx;
	        for (stopIdx = gradStopArr.length - 1; stopIdx >= 0; stopIdx--) {
	          grad.appendChild(gradStopArr[stopIdx]);
	        }		    	
	    }

	    function setGradientStops() {
        var thresholds = {
          lowerAlarm: CapacityUtils.roundToInterval(llg.gradientScale(scope.config.primaryConfig.styleObjects.alarmLimits.lowerAlarm), [0, 1]),
          lowerWarn: CapacityUtils.roundToInterval(llg.gradientScale(scope.config.primaryConfig.styleObjects.alarmLimits.lowerWarning), [0, 1]),
          upperWarn: CapacityUtils.roundToInterval(llg.gradientScale(scope.config.primaryConfig.styleObjects.alarmLimits.upperWarning), [0, 1]),
          upperAlarm: CapacityUtils.roundToInterval(llg.gradientScale(scope.config.primaryConfig.styleObjects.alarmLimits.upperAlarm), [0, 1])
        };

    		var gradient = llg.svg.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient');

        var stopOffsets = {
          start: 0,
          lowerAlarm: Math.abs(thresholds.lowerAlarm),
          lowerWarn: Math.abs(thresholds.lowerWarn),
          upperWarn: Math.abs(thresholds.upperWarn),
          upperAlarm: Math.abs(thresholds.upperAlarm),
          stop: 1 
        };

        // Set gradient fill
        llg.gradient.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-start')
          .attr('offset', stopOffsets.start);

        llg.gradient.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-upper-alarm-2')
          .attr('offset', stopOffsets.upperAlarm);

        llg.gradient.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-upper-alarm')
          .attr('offset', stopOffsets.upperAlarm);

        llg.gradient.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-upper-warn')
          .attr('offset', stopOffsets.upperWarn);

        llg.gradient.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-lower-warn')
	          .attr('offset', stopOffsets.lowerWarn);

        llg.gradient.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-lower-alarm-2')
          .attr('offset', stopOffsets.lowerAlarm);

        llg.gradient.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-lower-alarm')
          .attr('offset', stopOffsets.lowerAlarm);

        llg.gradient.select('#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient-stop')
          .attr('offset', stopOffsets.stop);

	  		llg.svg.append('rect')
	          .attr('class', 'light-color-gradient')
	          .attr('x', llg.oldValuePlotWidth)
	          .attr('width', llg.gaugeWidth)
	          .attr('height', llg.gaugeHeight)
	          .style('fill', 'url(#' + scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code + '-light-gradient)');		    	
	    }

			function setAlarmPointer(value, classPrefix) {
				var transf = '0, ' + llg.verticalScale(value);

				var pointerGrp = llg.svg.append('g')
				  .attr('class', 'light-' + classPrefix + '-indicator')
				  .attr('transform', 'translate(' + transf + ')');

				// Set alarm pointer line
				pointerGrp.append('rect')
					.attr('class', 'light-alarm-indicator')
				  	.attr('width', llg.alarmWidth)
				  	.attr('height', llg.alarmHeight)
				  	.attr('x', llg.svgWidth-llg.alarmWidth);

				// Set alarm pointer label
				pointerGrp.append('text')
					.attr('class', 'light-alarm-label')
					.attr('alignment-baseline', 'central')
					.attr('dominant-baseline', 'central')
					.attr('text-anchor', 'end')
					.attr('x', llg.svgWidth-llg.alarmWidth-5)
				  .text(value);
			}

			function setCurrentValuePointer(value) {
				var transf = '0, ' + llg.verticalScale(value);

				var pointerGrp = llg.svg.append('g')
				  .attr('class', 'light-current-value-pointer')
				  .attr('transform', 'translate(' + transf + ')');

				pointerGrp.append('rect')
				  	.attr('width', llg.gaugeWidth - 2)
				  	.attr('height', llg.currentValueHeight)
				  	.attr('x', llg.oldValuePlotWidth + 1);
			}

			function updateInterface(newVals, oldVals) {
				if (llg.initialized) {
					var newValue = newVals[0].primaryData.observations[0].resource.valueQuantity.value;
					var oldValue = oldVals[0].primaryData.observations[0].resource.valueQuantity.value; 
	        var transf = '0, ' + llg.verticalScale(newValue);

	        // Update current value
	        llg.svg.select('.light-current-value-pointer')
	          .transition().ease('sin-in-out')
	          .duration(llg.transitionDelay)
	          .attr('transform', 'translate(' + transf + ')');

	        if (!scope.noSignal) {
						updateOldValuePlot(oldValue, newValue);		        	
	        } 
			    	
		    } else {
		    	llg.initialized = true;
				} 
			}

			function updateOldValuePlot(oldValue, newValue) {
				llg.oldValues.push(newValue);
				var pathData = getPathData();

				if (!llg.svg.select('.light-old-value-line')[0][0]) {
					// Create path if it doesn't exist
					createPath(pathData);
				} else {
					// Update already existing path
					updatePath(pathData)
				}
	
				if (llg.oldValues.length == llg.nOldValues) {
					llg.oldValues.shift(newValue);
				}
			}

			function getPathData() {
				// Create svg path data string from old value array
				var pathData = '';
				for (var i = 0; i < llg.oldValues.length; i++) {
					var x = (i+llg.nOldValues-llg.oldValues.length) * llg.svgWidth/(llg.nOldValues-1);
					if (i == 0) {
						pathData = pathData + 'M'+ x + ',' + llg.verticalScale(llg.oldValues[i]);
					} else  {
						pathData = pathData + ' L'+ x + ',' + llg.verticalScale(llg.oldValues[i]);
					} 
				}
				return pathData;
			}

			function createPath(pathData) {
				llg.lineGraph = llg.svg.select('.light-old-values').append('path')
        	.attr('class', 'light-old-value-line ' + scope.config.primaryConfig.includedObjects.parameter.color + '-stroke')
          .attr('d', pathData)
          .attr('fill', 'none');
			}
			
			function updatePath(pathData) {
				var x = d3.scale.linear()
			    .domain([0, llg.nOldValues - 1])
			    .range([0, llg.oldValuePlotWidth]);

				llg.lineGraph
					.attr('d', pathData)
					.attr('transform', null)
				.transition()
					.ease('linear')
					.attr("transform", "translate(" + x(-1) + ",0)")
          .duration(scope.updateDelay - 100);				
			}

			function resetInterface() {
				updateBoxSize();
				llg.horizontalScale = setHorizontalScale();	
				resetCurrentValuePointer();
				resetAlarmIndicators();
				resetOldValuePlot();
			}

			function resetCurrentValuePointer() {
				llg.svg.select('.light-current-value-pointer').remove();
				setCurrentValuePointer(scope.data.primaryData.observations[0].resource.valueQuantity.value);
			}

			function resetAlarmIndicators() {
				llg.svg.select('.light-upper-alarm-indicator').remove();
				llg.svg.select('.light-lower-alarm-indicator').remove();

				// Set up lower alarm pointer for all parameters 
				setAlarmPointer(scope.config.primaryConfig.styleObjects.alarmLimits.lowerAlarm, 'lower-alarm');

				// Set up upper alarm pointer for all parameters except saturation 
				if (!(scope.config.primaryConfig.includedObjects.parameter.type.coding[0].code === llg.saturationCode)) {
					setAlarmPointer(scope.config.primaryConfig.styleObjects.alarmLimits.upperAlarm, 'upper-alarm');
				}
			}

			function resetOldValuePlot() {
				llg.svg.select('.clip-path-rect')
				  .attr('width', llg.svgWidth-(llg.svgWidth/llg.nOldValues));

		    llg.oldValuePlot = llg.svg.select('.light-old-values')
	    	  .attr('width', llg.oldValuePlotWidth)
			    .attr('clip-path', 'url(#clip)');

			 	llg.svg.select('.light-old-value-line')
          .attr('d', '');
			}

	   	angular.element($window).bind('resize', function () {
				updateBoxSize();
				if(llg.svgWidth != llg.oldWidth) {
					llg.svg.attr('width', llg.svgWidth);
					llg.svg.select('.light-color-gradient').attr('x', llg.oldValuePlotWidth);
					resetInterface();
					llg.oldWidth = llg.svgWidth;
					scope.$apply();
				}
    	});				

			// Listen to when 'data' changes
			scope.$watch('data', function (newVals, oldVals) {
				if (newVals) {
				updateInterface([newVals, scope.config], [oldVals, scope.config]);
			}
			}, true);

			// Listen to when 'isUpdating' changes
    	scope.$watch('isUpdating', function (newVals, oldVals) {
    		if (!scope.isUpdating) {
    			llg.oldValues = [];
    		}
    		resetInterface();
    	}, true);	

			// Listen to when 'noSignal' changes
    	scope.$watch('noSignal', function (newVals, oldVals) {
				if (scope.noSignal) {
					resetInterface();
				}
    	}, true);
				

		}
	}
})();
