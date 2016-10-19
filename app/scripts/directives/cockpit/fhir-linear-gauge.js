
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:fhirLinearGauge
 * @description
 * # fhirLinearGauge
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .directive('fhirLinearGauge', _fhirLinearGauge);

  _fhirLinearGauge.$inject = ['$window', 'CapacityUtils'];

  function _fhirLinearGauge($window, CapacityUtils) {

    return {
      restrict: 'E',
      replace: false,
      scope: {
        data: '=chartData',
        orientation: '=orientation',
        config: '=gaugeConfig',
        noSignal: '='
      },
      link: postlink
    };

    function postlink(scope, element, attrs) {
      var Lg = {};

      setupStyles();
      init();

      function isHorizontal(orient) {
        return orient === 'bottom' || orient === 'top';
      }

      function setupStyles() {
        Lg.orientHorizontalDim = { width: 400, height: 80 };
        Lg.orientVerticalDim = { width: 50, height: 330 };
        Lg.defValue = {
          //MDC_ECG_CARD_BEAT_RATE: 109.2,
          MDC_PULS_OXIM_PULS_RATE: 70,
          MDC_PRESS_BLD_NONINV_MEAN: 61.2,
          MDC_PULS_OXIM_SAT_O2: 98,
          O2: 66,
          AF: 16,
          Sevo: 1.65
        };
        Lg.nTicks = 5;
        Lg.color = {
          red: '#d2322d',
          orange: '#ed9c28',
          lightBlue: '#39b3d7',
          green: '#47a447',
          blue: '428bca'
        };
        Lg.transitionOpts = {type: 'sin-in-out', delay: 1000};
        Lg.triangleDim = { tall: 15, short: 8 };

        Lg.triangle = {
          up: 'l ' + (-1 * Lg.triangleDim.short) + ' ' + Lg.triangleDim.tall + ' ' + 'h ' + 2 * Lg.triangleDim.short + ' z',
          left: 'l ' + Lg.triangleDim.tall + ' ' + Lg.triangleDim.short + ' v ' + (-2 * Lg.triangleDim.short) + ' z',
          down: 'l ' + (-1 * Lg.triangleDim.short) + ' ' + (-1 * Lg.triangleDim.tall) + ' h ' + 2 * Lg.triangleDim.short + ' z',
          right: 'l ' + (-1 * Lg.triangleDim.tall) + ' ' + (Lg.triangleDim.short) + ' v ' + (-2 * Lg.triangleDim.short) + ' z'
        };

        Lg.openTriangle = {
          up: 'm ' + (-1 * Lg.triangleDim.short) + ' ' + Lg.triangleDim.tall + ' l ' + Lg.triangleDim.short + ' ' + -Lg.triangleDim.tall + ' l ' + Lg.triangleDim.short + ' ' + Lg.triangleDim.tall,
          left: 'm ' + Lg.triangleDim.tall + ' ' + Lg.triangleDim.short + ' l ' + -Lg.triangleDim.tall + ' ' + -Lg.triangleDim.short + ' l ' + Lg.triangleDim.tall + ' ' + -Lg.triangleDim.short,
          down: 'm ' + -Lg.triangleDim.short + ' ' + -Lg.triangleDim.tall + ' l ' + Lg.triangleDim.short + ' ' + Lg.triangleDim.tall + ' l ' + Lg.triangleDim.short + ' ' + -Lg.triangleDim.tall,
          right: 'm ' + -Lg.triangleDim.tall + ' ' + Lg.triangleDim.short + ' l ' + Lg.triangleDim.tall + ' ' + -Lg.triangleDim.short + ' l ' + -Lg.triangleDim.tall + ' ' + -Lg.triangleDim.short
        };

        Lg.gradientWidth = 10;
      }
      
      function init() {
        var maxWidth, maxHeight;
        if (isHorizontal(scope.orientation)) {
          maxWidth = Lg.orientHorizontalDim.width;
          maxHeight = Lg.orientHorizontalDim.height;
        } else {
          maxWidth = Lg.orientVerticalDim.width;
          maxHeight = Lg.orientVerticalDim.height;
        }

        var tallVal = maxWidth > maxHeight ? maxWidth : maxHeight;
        var shortVal = maxWidth <= maxHeight ? maxWidth : maxHeight;

        // By using tall/short instead of width/height makes the gauges orientation agnostic
        var dim = isHorizontal(scope.orientation) ?
        {
          tall: 'x',
          short: 'y',
          tallType: 'width',
          shortType: 'height',
          tallSize: tallVal,
          shortSize: shortVal,
          isHorizontal: true
        } :
        {
          tall: 'y',
          short: 'x',
          tallType: 'height',
          shortType: 'width',
          tallSize: tallVal,
          shortSize: shortVal,
          isHorizontal: false
        };
        scope.currentValue = angular.copy(Lg.defValue);
        scope.currentMinValue = Lg.defValue[scope.config.includedObjects.parameter.type.coding[0].code];
        scope.currentMaxValue = Lg.defValue[scope.config.includedObjects.parameter.type.coding[0].code];
        /*
         Setup the chart with default values before fetching the true dimensions.
         parent node dimensions are undefined otherwise
         */
        setupLinearGauge(dim);

        var root = d3.select(element[0])[0][0];
        var actualHeight = root.parentNode.clientHeight;
        var actualWidth = root.parentNode.clientWidth;
        tallVal = actualWidth > actualHeight ? actualWidth : actualHeight;
        shortVal = actualWidth <= actualHeight ? actualWidth : actualHeight;
        dim.shortSize = shortVal;
        dim.tallSize = tallVal;
        setupLinearGauge(dim);

        angular.element($window).bind('resize', function () {
          var actualHeight = root.parentNode.clientHeight;
          var actualWidth = root.parentNode.clientWidth;
          if (actualHeight > 0 && actualWidth > 0) { 
            tallVal = actualWidth > actualHeight ? actualWidth : actualHeight;
            shortVal = actualWidth <= actualHeight ? actualWidth : actualHeight;
            dim.shortSize = shortVal;
            dim.tallSize = tallVal;
            setupLinearGauge(dim);
          }

          scope.$apply();
        });
      }

      function setupLinearGauge(baseDim) {
        var baseSvg = d3.select(element[0]);
        var shortPaddingDefault = 10;
        scope.dim = angular.copy(baseDim);

        // Vertical gauges should not have bottom padding
        if (scope.dim.isHorizontal) {
          scope.dim.shortSize -= shortPaddingDefault;
          //dim.tallSize -= 2*shortPaddingDefault;
        } else {
          scope.dim.shortSize -= shortPaddingDefault;
          scope.dim.tallSize -= 2 * shortPaddingDefault;
        }

        baseSvg.selectAll('*').remove();
        baseSvg = baseSvg.append('svg')
          .attr(baseDim.shortType, baseDim.shortSize)
          .attr(baseDim.tallType, baseDim.tallSize)
          .attr('style', 'display:block');

        var padx = 0, pady = 0;
        var w, h;
        var corners = {
          upperLeft: 10,
          upperRight: 10,
          bottomLeft: 10,
          bottomRight: 10
        };
        if (scope.orientation === 'left') {
          padx = 0;//dim.shortSize;
          pady = 0;
          w = scope.dim.shortSize;
          h = baseDim.tallSize;
          corners.bottomLeft = 0;
          corners.upperRight = 0;
        } else if (scope.orientation === 'right') {
          padx = shortPaddingDefault;
          pady = 0;
          w = scope.dim.shortSize;
          h = baseDim.tallSize;
          corners.bottomRight = 0;
          corners.upperLeft = 0;
        } else if (scope.orientation === 'bottom') {
          padx = 0;
          pady = shortPaddingDefault;
          w = baseDim.tallSize;
          h = scope.dim.shortSize;
          corners.upperLeft = 0;
          corners.upperRight = 0;
        }

        baseSvg.append('path')
          .attr('d', roundedRect(padx, pady, w, h, corners))
          .attr('fill', '#333');

        if (scope.orientation === 'left') {
          padx = 0;
          pady = shortPaddingDefault;
        } else if (scope.orientation === 'right') {
          padx = shortPaddingDefault;
          pady = shortPaddingDefault;
        } else if (scope.orientation === 'bottom') {
          pady = shortPaddingDefault;
        }
        scope.svg = baseSvg
          .append('g')
          .attr('transform', 'translate(' + padx + ', ' + pady + ')');

        // Scale
        scope.scale = setScale(scope.currentValue[scope.config.includedObjects.parameter.type.coding[0].code], scope.dim);
        var code = scope.config.includedObjects.parameter.type.coding[0].code;
        var offset = scope.config.styleObjects.scale.offset;
        scope.gradientScale = d3.scale.linear()
          .domain([scope.currentValue[code] - offset, scope.currentValue[code] + offset])
          .range([0, 1]);
        scope.colorScale = d3.scale.linear();
        defineGradient(scope.dim);
        // Axis
        scope.axis = setAxis(scope.scale, scope.dim, 'axis', Lg.nTicks);
        scope.minorAxis = setAxis(scope.scale, scope.dim, 'axis-minor', Lg.nTicks * 5);

        setGradient(scope.dim);

        // Fixed pointer
        setPointer(scope.dim, scope.currentValue[scope.config.includedObjects.parameter.type.coding[0].code]);

        // Add Min/Max pointers
        var dataMinVal = scope.data.primaryData.minValue;
        var dataMaxVal = scope.data.primaryData.maxValue;
        var minVal = dataMinVal === undefined ? scope.currentValue[scope.config.includedObjects.parameter.type.coding[0].code] : dataMinVal;
        var maxVal = dataMaxVal === undefined ? scope.currentValue[scope.config.includedObjects.parameter.type.coding[0].code] : dataMaxVal;
        setMinMaxPointer(minVal, scope.dim, 'min');
        setMinMaxPointer(maxVal, scope.dim, 'max');

        setEstimate(scope.dim, scope.data.primaryData.regression.futureValue);
      }

      function roundedRect(x, y, width, height, corners) {
        return 'M' + (x + corners.upperLeft) + ',' + y +
          ' h' + (width - corners.upperLeft - corners.upperRight) +
          ' a' + corners.upperRight + ',' + corners.upperRight + ' 0 0 1 ' + corners.upperRight + ',' + corners.upperRight +
          ' v' + (height - corners.upperRight - corners.bottomRight) +
          ' a' + corners.bottomRight + ',' + corners.bottomRight + ' 0 0 1 ' + -corners.bottomRight + ',' + corners.bottomRight +
          ' h' + (corners.bottomLeft + corners.bottomRight - width) +
          ' a' + corners.bottomLeft + ',' + corners.bottomLeft + ' 0 0 1 ' + -corners.bottomLeft + ',' + -corners.bottomLeft +
          ' v' + (corners.upperLeft + corners.bottomLeft - height) +
          ' a' + corners.upperLeft + ',' + corners.upperLeft + ' 0 0 1 ' + corners.upperLeft + ',' + -corners.upperLeft +
          ' z';
      }

      function defineGradient(dim) {
        var defs, gradient, boxGradient;
        defs = scope.svg.append('svg:defs');
        if (dim.isHorizontal) {
          gradient = defs.append('svg:linearGradient')
            .attr('id', attrs.id + '-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');

          boxGradient = defs.append('svg:linearGradient')
            .attr('id', attrs.id + '-box-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');
        } else {
          gradient = defs.append('svg:linearGradient')
            .attr('id', attrs.id + '-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

          boxGradient = defs.append('svg:linearGradient')
            .attr('id', attrs.id + '-box-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        }
        boxGradient
          .append('stop')
          .attr('offset', '0')
          .attr('stop-color', '#222')
          .attr('stop-opacity', '0');

        boxGradient
          .append('stop')
          .attr('offset', '0.2')
          .attr('stop-color', '#222')
          .attr('stop-opacity', '1');
        boxGradient
          .append('stop')
          .attr('offset', '0.8')
          .attr('stop-color', '#222')
          .attr('stop-opacity', '1');
        boxGradient
          .append('stop')
          .attr('offset', '1')
          .attr('stop-color', '#222')
          .attr('stop-opacity', '0');

        configureGradientStops(dim);
      }

      function configureGradientStops(dim) {
        /*
         Define stop without using d3 due to the ability of determine the order of the stops.
         */

        var stopColor = {
          lowerAlarm: Lg.color.red,
          lowerAlarm2: Lg.color.orange,
          lowerWarn: Lg.color.green,
          upperWarn: Lg.color.green,
          upperAlarm: Lg.color.orange,
          upperAlarm2: scope.config.includedObjects.parameter.type.coding[0].code === 'MDC_PULS_OXIM_SAT_O2' ? Lg.color.green : Lg.color.red
        };

        var lowerAlarmGradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        lowerAlarmGradStop.setAttribute('id', attrs.id + '-gradient-lower-alarm');
        lowerAlarmGradStop.setAttribute('stop-color', stopColor.lowerAlarm);
        lowerAlarmGradStop.setAttribute('stop-opacity', 1);

        var lowerAlarm2GradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        lowerAlarm2GradStop.setAttribute('id', attrs.id + '-gradient-lower-alarm-2');
        lowerAlarm2GradStop.setAttribute('stop-color', stopColor.lowerAlarm2);
        lowerAlarm2GradStop.setAttribute('stop-opacity', 1);

        var lowerWarnGradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        lowerWarnGradStop.setAttribute('id', attrs.id + '-gradient-lower-warn');
        lowerWarnGradStop.setAttribute('stop-color', stopColor.lowerWarn);
        lowerWarnGradStop.setAttribute('stop-opacity', 1);

        var upperWarnGradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        upperWarnGradStop.setAttribute('id', attrs.id + '-gradient-upper-warn');
        upperWarnGradStop.setAttribute('stop-color', stopColor.upperWarn);
        upperWarnGradStop.setAttribute('stop-opacity', 1);

        var upperAlarmGradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        upperAlarmGradStop.setAttribute('id', attrs.id + '-gradient-upper-alarm');
        upperAlarmGradStop.setAttribute('stop-color', stopColor.upperAlarm);
        upperAlarmGradStop.setAttribute('stop-opacity', 1);

        var upperAlarm2GradStop = document.createElementNS(d3.ns.prefix.svg, 'stop');
        upperAlarm2GradStop.setAttribute('id', attrs.id + '-gradient-upper-alarm-2');
        upperAlarm2GradStop.setAttribute('stop-color', stopColor.upperAlarm2);
        upperAlarm2GradStop.setAttribute('stop-opacity', 1);

        var gradStopArr = [lowerAlarmGradStop, lowerAlarm2GradStop, lowerWarnGradStop,
          upperWarnGradStop, upperAlarmGradStop, upperAlarm2GradStop];
        var grad = document.getElementById(attrs.id + '-gradient');

        var colorScaleRange = Object.keys(stopColor).map(function (key) {
          return stopColor[key];
        });
        scope.colorScale.range(colorScaleRange);

        /* Reverse the order of stops if vertical */
        var stopIdx;
        if (dim.isHorizontal) {
          for (stopIdx = 0; stopIdx < gradStopArr.length; stopIdx++) {
            grad.appendChild(gradStopArr[stopIdx]);
          }

        } else {
          for (stopIdx = gradStopArr.length - 1; stopIdx >= 0; stopIdx--) {
            grad.appendChild(gradStopArr[stopIdx]);
          }
        }
        updateGradientStops(scope.config.styleObjects.alarmLimits, dim);
      }

      function updateGradientStops(rawThresholds, dim) {
        // Guarantee that the values are in the interval [0, 1]
        var thresholds = {
          lowerAlarm: CapacityUtils.roundToInterval(scope.gradientScale(rawThresholds.lowerAlarm), [0, 1]),
          lowerWarn: CapacityUtils.roundToInterval(scope.gradientScale(rawThresholds.lowerWarning), [0, 1]),
          upperWarn: CapacityUtils.roundToInterval(scope.gradientScale(rawThresholds.upperWarning), [0, 1]),
          upperAlarm: CapacityUtils.roundToInterval(scope.gradientScale(rawThresholds.upperAlarm), [0, 1])
        };

        var gradient = scope.svg.select('#' + attrs.id + '-gradient');
        var inverse = dim.isHorizontal ? 0 : 1;

        var stopOffsets = {
          start: inverse,
          lowerAlarm: Math.abs(inverse - thresholds.lowerAlarm),
          lowerWarn: Math.abs(inverse - thresholds.lowerWarn),
          upperWarn: Math.abs(inverse - thresholds.upperWarn),
          upperAlarm: Math.abs(inverse - thresholds.upperAlarm),
          stop: 1 - inverse
        };
        var colorScaleDom = Object.keys(stopOffsets).map(function (key) {
          return stopOffsets[key];
        });
        scope.colorScale.domain(colorScaleDom);

        gradient.select('#' + attrs.id + '-gradient-start')
          .transition().ease('sin-in-out').duration(Lg.transitionOpts.delay)
          .attr('offset', stopOffsets.start);

        gradient.select('#' + attrs.id + '-gradient-lower-alarm')
          .transition().ease('sin-in-out').duration(Lg.transitionOpts.delay)
          .attr('offset', stopOffsets.lowerAlarm);

        gradient.select('#' + attrs.id + '-gradient-lower-alarm-2')
          .transition().ease('sin-in-out').duration(Lg.transitionOpts.delay)
          .attr('offset', stopOffsets.lowerAlarm);

        gradient.select('#' + attrs.id + '-gradient-lower-warn')
          .transition().ease('sin-in-out').duration(Lg.transitionOpts.delay)
          .attr('offset', stopOffsets.lowerWarn);

        gradient.select('#' + attrs.id + '-gradient-upper-warn')
          .transition().ease('sin-in-out').duration(Lg.transitionOpts.delay)
          .attr('offset', stopOffsets.upperWarn);

        gradient.select('#' + attrs.id + '-gradient-upper-alarm')
          .transition().ease('sin-in-out').duration(Lg.transitionOpts.delay)
          .attr('offset', stopOffsets.upperAlarm);

        gradient.select('#' + attrs.id + '-gradient-upper-alarm-2')
          .transition().ease('sin-in-out').duration(Lg.transitionOpts.delay)
          .attr('offset', stopOffsets.upperAlarm);

        gradient.select('#' + attrs.id + '-gradient-stop')
          .transition().ease('sin-in-out').duration(Lg.transitionOpts.delay)
          .attr('offset', stopOffsets.stop);
      }

      function setScale(value, dim) {
        var range, dom;
        range = dim.isHorizontal ? [0, dim.tallSize] : [dim.tallSize, 0];
        dom = [value - scope.config.styleObjects.scale.offset, value + scope.config.styleObjects.scale.offset];

        return d3.scale.linear()
          .domain(dom)
          .range(range);
      }

      function setAxis(scale, dim, className, nTicks) {
        var tickSize = 7;
        var axis = d3.svg.axis()
          .scale(scale)
          .orient(scope.orientation)
          .ticks(nTicks)
          .tickSize(tickSize);  //Set rough # of ticks

        // Axis
        var pad = {x: 0, y: 0};
        if (scope.orientation === 'left') {
          pad.x = dim.shortSize - Lg.triangleDim.tall;
        } else if (scope.orientation === 'right') {
          pad.x = Lg.triangleDim.tall;
        } else if (scope.orientation === 'bottom') {
          pad.y = Lg.triangleDim.tall;
        }

        scope.svg.append('g')
          .attr('class', className)
          .attr('transform', 'translate(' + pad.x + ', ' + pad.y + ')')
          .call(axis);
        return axis;
      }

      function setGradient(dim) {
        var pos = scope.orientation === 'left' ? dim.shortSize - Lg.gradientWidth : 0;
        return scope.svg.append('rect')
          .attr('class', 'color-gradient')
          .attr(dim.short, pos)
          .attr(dim.shortType, Lg.gradientWidth)
          .attr(dim.tallType, dim.tallSize)
          .style('fill', 'url(#' + attrs.id + '-gradient)');
      }


      function setPointer(dim, value) {
        var transf = dim.isHorizontal ? dim.tallSize * 0.5 + ', 0' : '0, ' + dim.tallSize * 0.5;
        var pointerGrp = scope.svg.append('g')
          .attr('class', 'pointer')
          .attr('transform', 'translate(' + transf + ')');

        var rectTall = 0.73 * dim.shortSize;
        var fontSize = 0.32 * dim.shortSize;
        var shortPos = scope.orientation === 'left' ? 0 : Lg.gradientWidth;


        pointerGrp.append('rect')
          .attr(dim.short, shortPos)
          .attr(dim.tall, -0.5 * rectTall)
          .attr(dim.shortType, dim.shortSize - Lg.gradientWidth)
          .attr(dim.tallType, rectTall)
          .style('fill', 'url(#' + attrs.id + '-box-gradient)');

        var textAnchor, baseline;
        if (scope.orientation === 'left') {
          textAnchor = 'end';
          baseline = 'central';
          shortPos = dim.shortSize - (Lg.triangleDim.tall + Lg.gradientWidth);
        } else if (scope.orientation === 'right') {
          textAnchor = 'start';
          baseline = 'central';
          shortPos = Lg.triangleDim.tall + Lg.gradientWidth;
        } else {
          textAnchor = 'middle';
          baseline = 'hanging';
          shortPos = Lg.triangleDim.tall + Lg.gradientWidth;
        }

        pointerGrp.append('text')
          .text(CapacityUtils.round(value, 0))
          .attr('class', 'current-value')
          .attr(dim.short, shortPos)
          .attr(dim.tall, 0)
          .attr('font-size', fontSize)
          .attr('alignment-baseline', baseline)
          .attr('dominant-baseline', baseline)
          .attr('text-anchor', textAnchor);

        if (scope.config.includedObjects.parameter.type.coding[0].code === 'MDC_PRESS_BLD_NONINV_MEAN') {
          pointerGrp.append('text')
            .text((CapacityUtils.round(value * 1.5, 0)) + ' / ' + (CapacityUtils.round(0.75 * value, 0)))
            .attr('class', 'current-value-secondary')
            .attr(dim.short, shortPos + fontSize)
            .attr(dim.tall, 0)
            .attr('font-size', fontSize * 0.5)
            .attr('alignment-baseline', baseline)
            .attr('dominant-baseline', baseline)
            .attr('text-anchor', textAnchor);
        }

        pointerGrp.append('path')
          .attr('d', function () {
            var y = 0;
            var x;
            var tri;
            if (scope.orientation === 'left') {
              x = dim.shortSize - Lg.gradientWidth * 0.5;
              tri = Lg.triangle.right;
            } else if (scope.orientation === 'right') {
              x = Lg.gradientWidth * 0.5;
              tri = Lg.triangle.left;
            } else if (scope.orientation === 'bottom') {
              y = Lg.gradientWidth * 0.5;
              x = 0;
              tri = Lg.triangle.up;
            }
            else {
              y = Lg.gradientWidth * 0.5;
              x = 0;
              tri = Lg.triangle.down;
            }
            return 'M ' + x + ' ' + y + ' ' + tri;
          })
          .attr('fill', scope.colorScale(scope.gradientScale(value)))
          .attr('stroke', '#222');
      }

      function setMinMaxPointer(value, dim, classPrefix) {
        var pointerSize = 2;
        var transf = dim.isHorizontal ? scope.scale(value) + ', 0' : '0, ' + scope.scale(value);
        var pointerGrp = scope.svg.append('g')
          .attr('class', classPrefix + '-pointer')
          .attr('transform', 'translate(' + transf + ')');

        pointerGrp.append('rect')
          .attr(dim.tallType, pointerSize)
          .attr(dim.shortType, dim.shortSize);

        var arrow = {
          down: 'l 5 -5 h -4 v -10 h -2 v 10 h -4 z',
          up: 'l 5 5 h -4 v 10 h -2 v -10 h -4 z',
          left: 'l 5 5 v -4 h 10 v -2 h -10 v -4 z',
          right: 'l -5 5 v -4 h -10 v -2 h 10 v -4 z'
        };
        pointerGrp.append('path')
          .attr('d', function () {
            var x, y, a;
            if (scope.orientation === 'left') {
              x = 5;
              y = classPrefix === 'min' ? 0 : pointerSize;
              a = classPrefix === 'max' ? arrow.up : arrow.down;
            } else if (scope.orientation === 'right') {
              x = dim.shortSize - 5;
              y = classPrefix === 'min' ? 0 : pointerSize;
              a = classPrefix === 'max' ? arrow.up : arrow.down;
            } else if (scope.orientation === 'bottom') {
              x = classPrefix === 'max' ? 0 : pointerSize;
              y = dim.shortSize - 5;
              a = classPrefix === 'max' ? arrow.right : arrow.left;
            }
            return 'M ' + x + ' ' + y + ' ' + a;
          });
      }

      function setEstimate(dim, futureValue) {
        var transf = dim.isHorizontal ? scope.scale(futureValue) + ', 0' : '0, ' + scope.scale(futureValue);
        var estGrp = scope.svg.append('g')
          .attr('class', 'estimate')
          .attr('transform', 'translate(' + transf + ')');

        estGrp.append('path')
          .attr('d', function () {
            var y = 0;
            var x;
            var tri;
            if (scope.orientation === 'left') {
              x = dim.shortSize - Lg.gradientWidth * 0.5;
              tri = Lg.openTriangle.left;
            } else if (scope.orientation === 'right') {
              x = Lg.gradientWidth * 0.5;
              tri = Lg.openTriangle.right;
            } else if (scope.orientation === 'bottom') {
              y = Lg.gradientWidth * 0.5;
              x = 0;
              tri = Lg.openTriangle.down;
            }
            else {
              y = Lg.gradientWidth * 0.5;
              x = 0;
              tri = Lg.openTriangle.up;
            }
            return 'M ' + x + ' ' + y + ' ' + tri;
          })
          .attr('fill', '#222')
          .attr('stroke', 'white')
          .attr('stroke-width', '1');
      }

      function updateInterface(newVals, oldVals) {
        var newVal = newVals[0].primaryData;
        var oldVal = oldVals[0].primaryData;
        var secondaryData = newVals[0].secondaryData;

        if (!newVal || !newVal.observations || newVal.observations.length === 0) {
          return;
        }

        var currentData = newVal.observations[0];

        // Guarantee to always show the most recent data point.
        if (oldVal) {
          var oldData = newVal.observations[0];
          var currentTimestamp = new Date(currentData.resource.effectiveDateTime);
          var oldTimestamp = new Date(oldData.resource.effectiveDateTime);
          if (currentTimestamp < oldTimestamp) {
            return;
          }
        }
        var currentValue = currentData.resource.valueQuantity.value;
        scope.currentValue[scope.config.includedObjects.parameter.type.coding[0].code] = currentValue;
        var secondaryValue, tertiaryValue;
        if (secondaryData) {
          secondaryValue = newVals[0].secondaryData.observations[0].resource.valueQuantity.value;
          tertiaryValue = newVals[0].tertiaryData.observations[0].resource.valueQuantity.value;
        }

        var scaleOffset = Number(scope.config.styleObjects.scale.offset);
        var dom;
        dom = [currentValue - scaleOffset, currentValue + scaleOffset];
        scope.scale.domain(dom);
        scope.gradientScale.domain(dom);

        scope.svg.select('.axis')
          .transition().ease(Lg.transitionOpts.type)
          .duration(Lg.transitionOpts.delay)
          .call(scope.axis);

        scope.svg.select('.axis-minor')
          .transition().ease(Lg.transitionOpts.type)
          .duration(Lg.transitionOpts.delay)
          .call(scope.minorAxis);

        var maxPos = d3.max([0, scope.scale(100)]);
        if (scope.config.includedObjects.parameter.type.coding[0].code === 'MDC_PULS_OXIM_SAT_O2') {
          scope.svg.select('.color-gradient')
            .transition().ease(Lg.transitionOpts.type)
            .duration(Lg.transitionOpts.delay)
            .attr('y', maxPos)
            .attr('height', scope.dim.tallSize - maxPos);

          scope.svg.selectAll('.tick')
            .attr('class', function (d) {
              var addClass = d > 100 ? ' ng-hide' : '';
              return 'tick' + addClass;
            });
        }

        updateGradientStops(scope.config.styleObjects.alarmLimits, scope.dim);

        scope.currentMaxValue = scope.currentMaxValue === undefined || currentValue > scope.currentMaxValue ? currentValue : scope.currentMaxValue;
        scope.currentMinValue = scope.currentMinValue === undefined || currentValue < scope.currentMinValue ? currentValue : scope.currentMinValue;

        var maxTransf = scope.dim.isHorizontal ? scope.scale(newVal.maxValue) + ', 0' : '0, ' + scope.scale(newVal.maxValue);
        var minTransf = scope.dim.isHorizontal ? scope.scale(newVal.minValue) + ', 0' : '0, ' + scope.scale(newVal.minValue);

        var futureValue = newVal.regression.futureValue;
        var estTransf = scope.dim.isHorizontal ? scope.scale(futureValue) + ', 0' : '0, ' + scope.scale(futureValue);

        scope.svg.select('.max-pointer')
          .transition().ease(Lg.transitionOpts.type)
          .duration(Lg.transitionOpts.delay)
          .attr('transform', 'translate(' + maxTransf + ')');

        scope.svg.select('.min-pointer')
          .transition().ease(Lg.transitionOpts.type)
          .duration(Lg.transitionOpts.delay)
          .attr('transform', 'translate(' + minTransf + ')');

        scope.svg.select('.estimate')
          .transition().ease(Lg.transitionOpts.type)
          .duration(Lg.transitionOpts.delay)
          .attr('transform', 'translate(' + estTransf + ')');

        var displayCurrentValue = scope.noSignal ? 'X' : CapacityUtils.round(currentValue, 0);

        scope.svg.select('.pointer > text')
          .text(displayCurrentValue);
        scope.svg.select('.pointer > path')
          .transition().ease(Lg.transitionOpts.type)
          .duration(Lg.transitionOpts.delay)
          .attr('fill', scope.colorScale(scope.gradientScale(currentValue)));

        var displayCurrentSubValues = scope.noSignal ? 'x / x' : (CapacityUtils.round(secondaryValue, 0)) + ' / ' + (CapacityUtils.round(tertiaryValue, 0));

        if (secondaryValue && tertiaryValue) {
          scope.svg.select('.current-value-secondary')
            .text(displayCurrentSubValues);
        }
      }
      
      // Listen to when 'data' and 'config' changes
      scope.$watch('data', function (newVals, oldVals) {
        updateInterface([newVals, scope.config], [oldVals, scope.config]);
      }, true);

      scope.$watch('config', function (newVals, oldVals) {
        updateInterface([scope.data, newVals], [scope.data, oldVals]);
      }, true);
    }
  }
})();
