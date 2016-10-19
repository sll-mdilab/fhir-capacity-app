
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:historyIntervalSelect
 * @description
 * # historyIntervalSelect
 */

(function () {
	'use strict';

	angular.module('fhirCapacityApp')
	.directive('historyIntervalSelect', historyIntervalSelect);
	
	historyIntervalSelect.$inject = ['$interval', '$window','CapacityUtils'];

	function historyIntervalSelect($interval, $window, CapacityUtils) {
		return {
			restrict: 'E',
			scope: {
				identifier: '=identifier',
      	timeScope: '=timeScope',
      	currentTime: '=currentTime',
      	boxHeight: '=boxHeight',
      	showToggleButton: '=showToggleButton',
      	minTime: '=intervalSelectMinTime',
      	maxTime: '=intervalSelectMaxTime',
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
	      createIntervalSelectors();
	      setMinMax();
	    }

			function setupStyles() {
				ht.boxHeight = scope.boxHeight;
				ht.isMain = scope.identifier === 'timeline';
				ht.intervalHeight = ht.isMain ? scope.boxHeight : 10;
				ht.fillClass = ht.isMain ? 'blue-fill' : 'white-fill';
				ht.selectorWidth = 6;
			}

			function setupSvgElement() {
				ht.svg = d3.select(element[0]);
	    	ht.svg = ht.svg.append('svg')
	    		.attr('class', 'history-interval-select')
	    		.attr('height', ht.boxHeight)
        	.attr('width', '100%');
			}			 

		 	function updateHorizontalScale() {
		 		var width = d3.select(element[0])[0][0].offsetWidth;

			 	ht.horizontalScale = d3.scale.linear()
	        .domain([scope.timeScope.lowerTimeLimit, scope.timeScope.upperTimeLimit])
	        .range([0, width]);
		  }

		  function createIntervalSelectors() {
				if (!ht.svg.select('#history-interval-selectors-' + scope.identifier)[0][0]) {
					ht.boxWidth = getIntervalMaxWidth();
					setDragBehaviors();

				 	var intervalSelect = ht.svg.append('g')
						  .attr('class', 'history-interval-selectors')
						  .attr('id', 'history-interval-selectors-' + scope.identifier)
						  .data([{x: 0, y: 0}]);	

					// Interval content
					ht.intervalSelectBox = intervalSelect.append('rect')
						.attr('class', 'history-interval-selector-box ' + ht.fillClass)
			      .attr('id', 'active')
			      .attr('x', ht.selectorWidth/2)
			      .attr('y', 0)
			      .attr('height', ht.intervalHeight)
			      .attr('width', ht.boxWidth)
			      .on('dblclick', callManualTimescopeFunction)
			      .call(ht.drag);

					// Left interval end
					ht.intervalMinSelector = intervalSelect.append('rect')
						.attr('class', 'history-interval-selector ' + ht.fillClass)
					  .attr('x', 0 - (ht.selectorWidth/2))
	      		.attr('y', 0)
			      .attr('id', 'dragleft')
						.attr('width', ht.selectorWidth)
						.attr('height', ht.intervalHeight)
			      .call(ht.dragleft);
					
					// Right interval end
					ht.intervalMaxSelector = intervalSelect.append('rect')
						.attr('class', 'history-interval-selector ' + ht.fillClass)
						.attr('x', ht.boxWidth - (ht.selectorWidth/2))
			      .attr('y', function(d) { return d.y })
			      .attr('id', 'dragright')
			      .attr('height', ht.intervalHeight)
			      .attr('width', ht.selectorWidth)
			      .call(ht.dragright);
			  }
		  }

		  function setDragBehaviors() {
				// Drag entire interval
				ht.drag = d3.behavior.drag()
			    .origin(Object)
			    .on('drag', moveManualTimescope);

				// Resize interval right
				ht.dragright = d3.behavior.drag()
			    .origin(Object)
			    .on('drag', resizeManualTimescopeRight);

				// Resize interval left
				ht.dragleft = d3.behavior.drag()
			    .origin(Object)
			    .on('drag', resizeManualTimescopeLeft);
			}

			function callManualTimescopeFunction() {
				// Call manual timescope function in controller
				if (scope.manualTimescopeFunction) {
	      	scope.manualTimescopeFunction(
	      		scope.minTime.milliseconds, 
	      		scope.maxTime.milliseconds
	      	);
	      }
    	}

    	function setMinMax() {
    		var minWidth = parseInt(ht.intervalMinSelector.attr('x')) + (ht.selectorWidth/2);
    		var maxWidth = parseInt(ht.intervalMaxSelector.attr('x')) + (ht.selectorWidth/2);

    		scope.minTime.milliseconds = ht.horizontalScale.invert(minWidth);
    		scope.maxTime.milliseconds = ht.horizontalScale.invert(maxWidth);

    		scope.minTime.formattedTime = CapacityUtils.formatTime(new Date(scope.minTime.milliseconds));
    		scope.maxTime.formattedTime = CapacityUtils.formatTime(new Date(scope.maxTime.milliseconds));
    	}

			function moveManualTimescope(d) {
				// Drag entire interval
				var windowWith = getIntervalMaxWidth();
			  ht.intervalSelectBox.attr('x', d.x = Math.max(0, Math.min(windowWith - ht.boxWidth, d3.event.x)))
			  ht.intervalMinSelector .attr('x', function(d) { return d.x - (ht.selectorWidth/2); })
			  ht.intervalMaxSelector .attr('x', function(d) { return d.x + ht.boxWidth - (ht.selectorWidth/2); })

			  setMinMax();
			 	scope.$apply();
			}

			function resizeManualTimescopeLeft(d) {
				// Resize interval left
				var windowWith = getIntervalMaxWidth();
				var oldx = d.x; 
			  d.x = Math.max(0, Math.min(d.x + ht.boxWidth - (ht.selectorWidth / 2), d3.event.x)); 
			  ht.boxWidth = ht.boxWidth + (oldx - d.x);
			  ht.intervalMinSelector.attr('x', function(d) { return d.x - (ht.selectorWidth / 2); });

			  ht.intervalSelectBox
			    .attr('x', function(d) { return d.x; })
			    .attr('width', ht.boxWidth);

			 	setMinMax();
			 	scope.$apply();
			}

			function resizeManualTimescopeRight(d) {
				// Resize interval right
				var windowWith = getIntervalMaxWidth();
				var dragx = Math.max(d.x + (ht.selectorWidth/2), Math.min(windowWith, d.x + ht.boxWidth + d3.event.dx));
			  ht.boxWidth = dragx - d.x;
			  ht.intervalMaxSelector.attr('x', function(d) { return dragx - (ht.selectorWidth/2) });
			  ht.intervalSelectBox.attr('width', ht.boxWidth);

			  setMinMax();
			  scope.$apply();
			}

			function getIntervalMaxWidth() {
				var boxWidth;
				if (scope.timeScope.hasManualTimeLimits) {
					boxWidth = d3.select(element[0])[0][0].offsetWidth;
				} else {
					boxWidth = ht.horizontalScale(scope.currentTime) - ht.selectorWidth/2;
				}
				var positiveBoxWidth = boxWidth >= 0 ? boxWidth : 0;
				return positiveBoxWidth;
			}

			scope.$watch('timeScope', function (newVals, oldVals) {
				if (newVals.editMode) {
					if (ht.isMain) {
						createIntervalSelectors();
					}
				} else {
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

