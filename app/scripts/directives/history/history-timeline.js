
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:historyTimeline
 * @description
 * # historyTimeline
 */

(function () {
	'use strict';

	angular.module('fhirCapacityApp')
		.directive('historyTimeline', historyTimeline);

	historyTimeline.$inject = ['$interval', '$window'];

	function historyTimeline($interval, $window) {
		return {
			restrict: 'E',
			scope: {
      	timeScope: '=timeScope',
      	currentTime: '=currentTime',
      	nIntervals: '=nIntervals',
      	timelineBoxHeight: '=timelineBoxHeight',
      	nLineCharts: '=nLineCharts',
      	lineChartBoxHeight: '=lineChartBoxHeight',
      	boxHeight: '=boxHeight',
      	manualTimescopeFunction: '=manualTimescopeFunction'
	    },
			link: postLink 
		}

		function postLink(scope, element, attrs) {
			var ht = {};
			init();

			function init() {
				setupStyles();
				setupSvgElement();
	      updateHorizontalScale();
	      setupTimeline();
	    }

			function setupStyles() {
				ht.currentTime = new Date(scope.currentTime).getTime();

				ht.lineChartBoxHeightWithBorder = scope.lineChartBoxHeight + 1;  
				ht.timelineBoxHeightWithBorder = scope.timelineBoxHeight + 1;
				
				ht.currentTimeLineWidth = 2; 
				ht.boxHeight = scope.boxHeight;
			}

			function setupSvgElement() {
				ht.svg = d3.select(element[0]);
	    	ht.svg = ht.svg.append('svg')
	    		.attr('class', 'history-timeline')
	    		.attr('height', ht.boxHeight)
        	.attr('width', '100%');
			}			 

		 	function updateHorizontalScale() {
		 		var width = d3.select(element[0])[0][0].offsetWidth;
				
				ht.currentTimeInterval = scope.timeScope.value/scope.nIntervals;
				ht.currentRoundedTime = Math.floor(ht.currentTime / ht.currentTimeInterval) * ht.currentTimeInterval;

			 	ht.horizontalScale = d3.scale.linear()
	        .domain([scope.timeScope.lowerTimeLimit, scope.timeScope.upperTimeLimit])
	        .range([0, width]);
		  }

		  function setupTimeline() {
		  	var transf = ht.horizontalScale(ht.currentTime-scope.timeScope.updateDelay) + ', 0';
				var line = createLine();
				line.attr('transform', 'translate(' + transf + ')');
				createTimeLineAxis();
			}	

		  function createLine() {
		  	var line = ht.svg.append('g')
					  .attr('class', 'history-timeline-current-time');

				return updateLineContent(line);
			}

			function updateLineContent(line) {
		  	var width = d3.select(element[0])[0][0].offsetWidth;

				// Cover area to the right of current-time-line, supporting animation
				for (var i = 0; i < scope.nLineCharts; i++) {
					line.append('rect')
						.attr('class', 'black-background')
						.attr('y', i*ht.lineChartBoxHeightWithBorder + ht.timelineBoxHeightWithBorder)
						.attr('height', scope.lineChartBoxHeight)
						.attr('width', 1.5*width/scope.nIntervals);
				}
				
				// Main time line
				line.append('path')
					.attr('class', 'history-timeline-current-time-line white-stroke')
					.attr('stroke-width', ht.currentTimeLineWidth)
					.attr('d', 'M0,' + ht.timelineBoxHeightWithBorder + ' L0,' + ht.boxHeight);
				
				return line;
		  }

			function createTimeLineAxis() {
			 	var time = scope.timeScope.lowerTimeLimit + (scope.timeScope.value/scope.nIntervals);

			 	var axisIntervals = ht.svg.append('g')
					  .attr('class', 'history-timeline-intervals');

				// Go through time intervals
		  	for (var i=1; i < scope.nIntervals; i++) {
		  		var timeLabel = getTimeLabel(time);
		  		var transf = ht.horizontalScale(time) + ', 0';

		  		var axisInterval = axisIntervals.append('g')
					  .attr('class', 'history-timeline-interval')
					  .attr('transform', 'translate(' + transf + ')');

					// Display time interval label
					axisInterval.append('text')
						.attr('class', 'white-fill history-timeline-interval-label-' + i)
						.attr('dominant-baseline', 'middle')	// Firefox support
						.attr('alignment-baseline', 'central')
						.attr('y', ht.timelineBoxHeightWithBorder/2)
					  .text(timeLabel);

					// Display strokes between time intervals in circulation parameter charts (parameter tables have own strokes)
					var lineChartHeight = ht.lineChartBoxHeightWithBorder * scope.nLineCharts;
					axisInterval.append('path')
						.attr('class', 'white-stroke')
						.attr('d', 'M0,' + ht.timelineBoxHeightWithBorder + ' L0,' + (ht.timelineBoxHeightWithBorder + lineChartHeight));

				  time += ht.currentTimeInterval;
		  	}
		  }

		  function getTimeLabel(time) {
		  	// Get formatted time
		  	var timeLabel = new Date(time);
		  	var hours = (('' + timeLabel.getHours()).length < 2 ? '0' : '') + timeLabel.getHours();
		  	var minutes = (('' + timeLabel.getMinutes()).length < 2 ? '0' : '') + timeLabel.getMinutes();
		  	var seconds = (('' + timeLabel.getSeconds()).length < 2 ? '0' : '') + timeLabel.getSeconds();
		  	
		  	timeLabel = hours + ':' + minutes + (scope.timeScope.value <= 60*1000 ? ':' + seconds : '');
		  	return timeLabel;
		  }

		  function updateTimeline(newVals) {
		  	var oldCurrentRoundedTime = ht.currentRoundedTime;
		  	var oldCurrentTime = ht.currentTime;
		  	ht.currentTime = new Date(newVals).getTime();
		  	updateHorizontalScale();

		  	// Update current time position
		  	var transfOld = ht.horizontalScale(oldCurrentTime - scope.timeScope.updateDelay) + ', 0';
		  	var transfCurr = ht.horizontalScale(ht.currentTime - scope.timeScope.updateDelay) + ', 0';
		  	var transfLimit = ht.horizontalScale(ht.currentTime - 2*scope.timeScope.updateDelay) + ', 0';

		  	if (oldCurrentRoundedTime == ht.currentRoundedTime) {
	  			updateCurrentLine(transfOld, transfCurr, ht.currentTime - oldCurrentTime);
				} else {
					// If limit time is reach then shift timeline
					shiftCurrentLine(transfLimit, transfCurr);
				}
		  }

		  function updateCurrentLine(transfOld, transfCurr, duration) {
				var line = ht.svg.select('.history-timeline-current-time')
					.attr('transform', 'translate(' + transfOld + ')')
						.transition()
						.ease('linear')
					 	.duration(duration)
					 	.attr('transform', 'translate(' + transfCurr + ')');	
		  }

		  function shiftCurrentLine(transfLimit, transfCurr, duration) {
				var line = ht.svg.select('.history-timeline-current-time');
				line.selectAll('*').remove();
				
				// Shift one time interval 
				updateLineContent(line);
				line.attr('transform', 'translate(' + transfLimit + ')')
					.transition()
						.ease('linear')
					 	.duration(1)
					 	.attr('transform', 'translate(' + transfCurr + ')');	

				//To make axis render on top of timeline coverarea
				ht.svg.select('.history-timeline-intervals').remove();
				createTimeLineAxis();		  	
		  }

		  // Listen to when 'data' changes
			scope.$watch('currentTime', function (newVals, oldVals) {
				updateTimeline(newVals);
			}, true);

			scope.$watch('timeScope', function (newVals, oldVals) {
				if (!newVals.editMode) {
					ht.svg.remove();
					init();
				}
			}, true);

			angular.element($window).bind('resize', function () {
				ht.svg.remove();
				init();
      });
		}

	}

})();

