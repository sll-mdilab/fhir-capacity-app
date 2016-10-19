
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:fhirBarChart
 * @description
 * # fhirBarChart
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .directive('fhirBarChart', _fhirBarChart);

  _fhirBarChart.$inject = ['$window', 'CapacityUtils'];

  function _fhirBarChart($window, CapacityUtils) {
    var transitionOpts = {type: 'sin-in-out', delay: 1000};

    var maxWidth = 500,
      maxHeight = 230,
      numDecimals = 1,
      textOffset = 25;

    var margin = {top: 0, right: 0, bottom: 30, left: 0};

    return {
      restrict: 'E',
      replace: false,
      scope: {
        data: '=chartData',
        config: '=chartConfig',
        parameterList: '=parameterList'
      },
      link: function (scope, element) {

        init();
        setupWatchers();

        //////// FUNCTIONS ///////////

        function init() {
          /*
           Setup the chart with default values
           before fetching the true dimensions.
           parent node dimensions are undefined otherwise
           */
          setupBarChart(maxWidth, maxHeight);
          var root = d3.select(element[0])[0][0];
          var actualHeight = root.parentNode.getBoundingClientRect().height; 
          var actualWidth = root.parentNode.getBoundingClientRect().width; 
          setupBarChart(actualWidth, actualHeight);

          angular.element($window).bind('resize', function () {
            /*
             Without the 5px subtraction the height will increase by 5px at every resize.
             Haven't figured out why but this solves the problem temporarily.
             */
            var quickFixOffset = 5;
            var actualHeight = root.parentNode.getBoundingClientRect().height - quickFixOffset; 
            var actualWidth = root.parentNode.getBoundingClientRect().width;

            if (actualHeight > 0 && actualWidth > 0) { 
              setupBarChart(actualWidth, actualHeight);
            }
           
            scope.$apply();
          });
        }

        function setupBarChart(maxWidth, maxHeight) {
          scope.maxWidth = maxWidth - margin.left - margin.right;
          scope.maxHeight = maxHeight - margin.top - margin.bottom;

          scope.svg = d3.select(element[0]);
          scope.svg.selectAll('*').remove();
          scope.svg = scope.svg.append('svg')
            .attr('width', scope.maxWidth + margin.left + margin.right)
            .attr('height', scope.maxHeight + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          scope.dataArr = [];
          scope.extremeBarData = {};
          scope.alarmLimits = {};

          var k;
          for (k in scope.parameterList) {
            var parameter = scope.parameterList[k].config.primaryConfig.includedObjects.parameter;
            var observation = scope.parameterList[k].data.primaryData.observations[0];
            var obj = {
              label: observation.resource.code.coding[0].code,
              name: parameter.type.coding[0].display,
              value: observation.resource.valueQuantity.value
            };
            scope.dataArr.push(obj);
            scope.extremeBarData[obj.label] = {
              min: obj.value,
              max: obj.value,
              name: obj.name
            };
            scope.alarmLimits[obj.label] = scope.parameterList[k].config.primaryConfig.styleObjects.alarmLimits;
          }

          scope.extreme = {'min': [], 'max': []};
          for (k in scope.extremeBarData) {
            if (scope.extremeBarData.hasOwnProperty(k)) {
              scope.extreme.min.push({
                'label': k,
                'value': scope.extremeBarData[k].min,
                name: scope.extremeBarData[k].name
              });
              scope.extreme.max.push({
                'label': k,
                'value': scope.extremeBarData[k].max,
                name: scope.extremeBarData[k].name
              });
            }
          }

          var approxBarWidth = scope.maxWidth / scope.dataArr.length;

          scope.x = d3.scale.ordinal()
            .rangeRoundBands([0, scope.maxWidth], 0.1);

          var xAxis = d3.svg.axis()
            .scale(scope.x)
            .orient('bottom');

          var domainSettings = {};

          for (var i in scope.parameterList) {
            var parameter = scope.parameterList[i].config.primaryConfig.includedObjects.parameter;
            var alarmLimits = scope.parameterList[i].config.primaryConfig.styleObjects.alarmLimits;

            var code = parameter.type.coding[0].code;
            var maxAlarm = alarmLimits.upperAlarm;
            var minWarn = alarmLimits.lowerWarning;
            var maxWarn = alarmLimits.upperWarning;

            domainSettings[code] = [0, maxAlarm + ((maxWarn-minWarn)/2)];
          }

          scope.scales = {};
          scope.x.domain(scope.dataArr.map(function (d) {
            return d.name;
          }));

          setupBarScales(domainSettings);

          scope.svg.append('g')
            .attr('class', 'x axiz')
            .attr('transform', 'translate(0,' + scope.maxHeight + ')')
            .call(xAxis);

          scope.svg.selectAll('.bar')
            .data(scope.dataArr)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', function (d) {
              return scope.x(d.name);
            })
            .attr('y', function (d) {
              return scope.scales[d.label](d.value);
            })
            .attr('height', function (d) {
              return scope.maxHeight - scope.scales[d.label](d.value);
            })
            .attr('width', scope.x.rangeBand())
            .attr('fill', 'steelblue');

          scope.svg.selectAll('.bar-text')
            .data(scope.dataArr)
            .enter().append('text')
            .text(function (d) {
              return CapacityUtils.round(d.value, numDecimals).toFixed(numDecimals);
            })
            .attr('class', 'bar-text')
            .attr('x', function (d) {
              return scope.x(d.name) + approxBarWidth * 0.45;
            })
            .attr('y', function (d) {
              return scope.scales[d.label](d.value) + textOffset;
            })
            .attr('height', function (d) {
              return scope.maxHeight - scope.scales[d.label](d.value);
            })
            .attr('width', scope.x.rangeBand())
            .attr('text-anchor', 'middle')
            .attr('fill', 'white');

          var textWidth = angular.element('.bar-text')[0].getBoundingClientRect().width;
          var textHeight = angular.element('.bar-text')[0].getBoundingClientRect().height;
          var textRatio = textHeight / textWidth;
          var fontSize = approxBarWidth >= (textWidth + 20) ? 20 : textRatio * approxBarWidth * 0.7;

          scope.svg.selectAll('.bar-text')
            .attr('font-size', fontSize);
          scope.svg.selectAll('.tick text')
            .attr('font-size', fontSize)
            .attr('fill', 'white');

          setMinMaxPointer('min', approxBarWidth * 0.87);
          setMinMaxPointer('max', approxBarWidth * 0.87);
        }

        function setupBarScales(domainSettings) {
          for (var i in scope.dataArr) {
            if (scope.dataArr.hasOwnProperty(i)) {
              var d = scope.dataArr[i];
              scope.scales[d.label] = d3.scale.linear()
                .domain(domainSettings[d.label])
                .range([scope.maxHeight - margin.bottom, 0]);
            }
          }
        }

        function setMinMaxPointer(classSuffix, width) {
          var thresholdKey = classSuffix === 'max' ? 'upperAlarm' : 'lowerAlarm';

          var pointer = scope.svg.selectAll('.bar-' + classSuffix)
            .data(scope.extreme[classSuffix])
            .enter().append('g')
            .attr('class', 'bar-' + classSuffix)
            .attr('transform', function (d) {
              return 'translate(' + scope.x(d.name) + ', ' + scope.scales[d.label]((scope.alarmLimits[d.label])[thresholdKey]) + ')';
            })
            .attr('fill', 'white');

          pointer.append('line')
            .style('stroke-dasharray', ('3, 3'))
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', width)
            .attr('y2', 0)
            .attr('stroke', 'white');
        }

        function updateBarChart(dataArr) {
          updateBarChartColumns(dataArr);
          updateBarChartText(dataArr);
          updateBarChartMinMax();
        }

        function updateBarChartColumns(dataArr) {
          scope.svg.selectAll('.bar')
            .data(dataArr)
            .transition().ease(transitionOpts.type).duration(transitionOpts.delay)
            .attr('y', function (d) {
              return scope.scales[d.label](d.value);
            })
            .attr('height', function (d) {
              return scope.maxHeight - scope.scales[d.label](d.value);
            });
        }

        function updateBarChartText(dataArr) {
          scope.svg.selectAll('.bar-text')
            .data(dataArr)
            .transition().ease(transitionOpts.type).duration(transitionOpts.delay)
            .attr('y', function (d) {
              return scope.scales[d.label](d.value) + textOffset;
            })
            .attr('height', function (d) {
              return scope.maxHeight - scope.scales[d.label](d.value);
            })
            .text(function (d) {
              return CapacityUtils.round(d.value, numDecimals).toFixed(numDecimals);
            });
        }

        function updateBarChartMinMax() {
          scope.svg.selectAll('.bar-min')
            .data(scope.extreme.min)
            .transition().ease(transitionOpts.type).duration(transitionOpts.delay)
            .attr('transform', function (d) {
              return 'translate(' + scope.x(d.name) + ', ' + scope.scales[d.label](scope.alarmLimits[d.label].lowerAlarm) + ')';
            });
          scope.svg.selectAll('.bar-max')
            .data(scope.extreme.max)
            .transition().ease(transitionOpts.type).duration(transitionOpts.delay)
            .attr('transform', function (d) {
              return 'translate(' + scope.x(d.name) + ', ' + scope.scales[d.label](scope.alarmLimits[d.label].upperAlarm) + ')';
            });
        }

        function selectDataObjectWithMostRecentObservation(aDataObj, anotherDataObj) {
          var aTimestamp, anotherTimestamp;

          if (aDataObj && aDataObj.primaryData.observations) {
            aTimestamp = new Date(aDataObj.primaryData.observations[0].resource.effectiveDateTime);
          }
          if (anotherDataObj && anotherDataObj.primaryData.observations) {
            anotherTimestamp = new Date(anotherDataObj.primaryData.observations[0].resource.effectiveDateTime);
          }
          var mostRecentObservation;

          if (aTimestamp && anotherTimestamp) {
            if (aTimestamp > anotherTimestamp) {
              mostRecentObservation = aDataObj;
            } else {
              mostRecentObservation = anotherDataObj;
            }
          } else if (aTimestamp && !anotherTimestamp) {
            mostRecentObservation = aDataObj;
          } else if (!aTimestamp && anotherTimestamp) {
            mostRecentObservation = anotherDataObj;
          } else {
            mostRecentObservation = undefined;
          }
          return mostRecentObservation;
        }

        function updateInterface(newVals, oldVals) {
          var newVal = newVals[0];
          var oldVal = oldVals[0];
          var idx = -1;
          for (var k in newVal) {
            if (newVal.hasOwnProperty(k)) {
              idx++;
              var dataObj = {};
              dataObj[k] = selectDataObjectWithMostRecentObservation(newVal[k], oldVal[k]);
              if (!dataObj[k]) {
                continue;
              }
              var label = dataObj[k].primaryData.observations[0].resource.code.coding[0].code;
              var value = dataObj[k].primaryData.observations[0].resource.valueQuantity.value;
              var name = scope.config[k].includedObjects.parameter.type.coding[0].display;
              var obj = {
                'label': label,
                'value': value,
                'name': name
              };
              scope.dataArr[idx] = obj;

              if (obj.value < scope.extremeBarData[k].min) {
                scope.extremeBarData[k].min = obj.value;
              } else if (obj.value > scope.extremeBarData[k].max) {
                scope.extremeBarData[k].max = obj.value;
              }

              scope.extreme.min[idx] = {'label': k, 'value': scope.extremeBarData[k].min, name: name};
              scope.extreme.max[idx] = {'label': k, 'value': scope.extremeBarData[k].max, name: name};
            }
          }
          updateBarChart(scope.dataArr);
        }

        function setupWatchers() {
          scope.$watch('data', function (newVals, oldVals) {
            updateInterface([newVals, scope.config], [oldVals, scope.config]);
          }, true);

          scope.$watch('config', function (newVals, oldVals) {
            updateInterface([scope.data, newVals], [scope.data, oldVals]);
          }, true);
        }
      }
    };
  }

})();
