
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:fhirWaveformCanvas
 * @description
 * # fhirWaveformCanvas
 */

(function () {
'use strict';

angular.module('fhirCapacityApp')
  .directive('fhirWaveformCanvas', fhirWaveformCanvas);

  fhirWaveformCanvas.$inject = [];

  function fhirWaveformCanvas() {

    return {
      restrict: 'E',
      scope: {
        data: '=chartData',
        config: '=chartConfig'
      },
      link: postLink
    };

    function postLink(scope, element) {
      var Wf = {};
      init();
      defineOnFrameWrapper();
      start();

      function start() {
        window.onEachFrame(run);
      }

      function init() {
        Wf.xMax = 3000;
        Wf.config = scope.config;
        Wf.config.dim = Wf.config.dim || {height: 100, width: 435};
        Wf.config.color = Wf.config.color || '#fff';
        Wf.activeYScaleDomain = [0, 1];
        Wf.canvas = document.createElement('canvas');
        Wf.canvasCtx = Wf.canvas.getContext('2d');
        Wf.canvasCtx.lineWidth = 1;
        Wf.canvas.width = Wf.config.dim.width;
        Wf.canvas.height = Wf.config.dim.height;
        Wf.bgCanvas = document.createElement('canvas');
        Wf.bgCanvasCtx = Wf.bgCanvas.getContext('2d');
        Wf.bgCanvas.width = Wf.config.dim.width;
        Wf.bgCanvas.height = Wf.config.dim.height;

        emptyDataBuffer();

        element.append(Wf.canvas);
        Wf.painter = {
          x: 0,
          paintToIdx: 0,
          paintDelay: 9000
        };
        Wf.eraser = {
          width: 200,
          height: Wf.config.dim.height
        };

        Wf.xScale = d3.scale.linear()
          .domain([0, Wf.xMax])
          .range([0, Wf.config.dim.width]);
        Wf.yScale = d3.scale.linear()
          .domain(Wf.activeYScaleDomain)
          .range([Wf.config.dim.height, 0]);

        Wf.emptyDataBuffer = emptyDataBuffer;
        Wf.start = start;
        Wf.update = update;
        Wf.draw = draw;
        Wf.stop = stop;
        Wf.resetPainter = resetPainter;
      }

      function emptyDataBuffer() {
        Wf.dataBuffer = new CBuffer(8192);
        Wf.latestObservations = new CBuffer(5);
      }

      function resetPainter() {
        Wf.painter.previousPoint = undefined;
        Wf.painter.paintToIdx = 0;
        Wf.painter.x = 0;
      }

      function getIndexOfFirstDataPointWithDateGreaterThan(aWhileAgo) {
        for (var i = 0; i < Wf.dataBuffer.size; i++) {
          var p = Wf.dataBuffer.get(i);
          if (p.x > aWhileAgo) {
            return i;
          }
        }
      }

      function update() {
        Wf.painter.x = Date.now();
        var aWhileAgo = Wf.painter.x - Wf.painter.paintDelay;
        Wf.painter.paintToIdx = undefined;
        Wf.painter.paintToIdx = getIndexOfFirstDataPointWithDateGreaterThan(aWhileAgo);
      }

      function setContextStartingPoint() {
        if (!Wf.painter.previousPoint) {
          // Happens only once per new config settings
          Wf.canvasCtx.beginPath();
          Wf.painter.currentPoint = Wf.dataBuffer.get(0);
          Wf.canvasCtx.moveTo(Wf.xScale(Wf.painter.currentPoint.x % Wf.xMax), Wf.yScale(Wf.painter.currentPoint.y));
        } else if (Wf.painter.currentPoint.x - Wf.painter.previousPoint.x >= 500) {
          // Don't draw a line between between sample batches if it differs more than specified value
          // This to not get a faulty "flat line".
          Wf.canvasCtx.moveTo(Wf.xScale(Wf.painter.currentPoint.x % Wf.xMax), Wf.yScale(Wf.painter.currentPoint.y));
        } else {
          Wf.canvasCtx.moveTo(Wf.xScale(Wf.painter.previousPoint.x % Wf.xMax), Wf.yScale(Wf.painter.previousPoint.y));
        }
      }

      function advancePainter() {
        Wf.painter.previousPoint = Wf.painter.currentPoint;
        Wf.painter.currentPoint = Wf.dataBuffer.shift();
      }

      function drawLine() {
        var lineHasHitTheWall = Wf.painter.previousPoint && (Wf.painter.currentPoint.x % Wf.xMax) < (Wf.painter.previousPoint.x % Wf.xMax);
        if (lineHasHitTheWall) {
          Wf.canvasCtx.beginPath();
          Wf.canvasCtx.moveTo(Wf.xScale(Wf.painter.currentPoint.x % Wf.xMax), Wf.yScale(Wf.painter.currentPoint.y));
        } else {
          Wf.canvasCtx.lineTo(Wf.xScale(Wf.painter.currentPoint.x % Wf.xMax), Wf.yScale(Wf.painter.currentPoint.y));
        }
      }

      function applyEraser() {
        var painterPos = Wf.painter.x % Wf.xMax;
        if (painterPos + Wf.eraser.width > Wf.xMax) {
          // If eraser is overlapping with the wall.
          // +5 in x pos to not erase the last painted point.
          Wf.canvasCtx.clearRect(Wf.xScale(painterPos) + 5, 0, Wf.xScale(Wf.xMax), Wf.eraser.height);
          Wf.canvasCtx.clearRect(0, 0, Wf.xScale((painterPos + Wf.eraser.width) % Wf.xMax), Wf.eraser.height);
        } else {
          Wf.canvasCtx.clearRect(Wf.xScale(painterPos) + 5, 0, Wf.xScale(Wf.eraser.width), Wf.eraser.height);
        }
      }

      function draw() {
        if (Wf.dataBuffer.size > 0 && Wf.painter.paintToIdx > 0) {
          setContextStartingPoint();

          // Plot all points found in the update() method
          for (var i = 0; i < Wf.painter.paintToIdx; i++) {
            advancePainter();
            drawLine();
          }

          Wf.painter.previousPoint = Wf.painter.currentPoint || Wf.painter.previousPoint;
          Wf.canvasCtx.strokeStyle = Wf.config.color;
          Wf.canvasCtx.stroke();
        }

        // Eraser
        applyEraser();
      }

      function run() {
        Wf.update();
        Wf.draw();
      }

      // Define wrapper function that runs on each frame
      function defineOnFrameWrapper() {
        (function () {
          var onEachFrame;

          var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

          var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame;

          onEachFrame = function (cb) {
            var _cb = function () {
              cb();
              Wf.animationId = requestAnimationFrame(_cb);
            };
            _cb();
          };
          window.onEachFrame = onEachFrame;
          window.cancelAnimation = cancelAnimationFrame;
        })();
      }

      function stop() {
        window.cancelAnimation(Wf.animationId);
      }

      function addDataToBuffer(dataArr, startTime, sampledIntervalInMs) {
        for (var i = 0; i < dataArr.length; i++) {
          var p = {x: startTime + i * sampledIntervalInMs, y: dataArr[i]};
          Wf.dataBuffer.push(p);
        }
      }

      function updateScales(domain) {
        if (domain) {
          Wf.activeYScaleDomain = domain;
          Wf.yScale.domain(Wf.activeYScaleDomain);
        }
      }

      function getLastIndexOfObservationNotAdded(observations) {
        for (var i = 0; i < observations.length; i++) {
          var obs = observations[i];
          if (Wf.latestObservations.size === 0) {
            return 0;
          } else if (Wf.latestObservations.indexOf(obs.resource.id) >= 0) {
            return i - 1;
          }
        }
        return 0;
      }

      ///////////// WATCHERS ///////////////

      scope.$watch('data', function (newVal) {
        // No data apparent
        if (!newVal.primaryData.observations || !newVal.primaryData.observations[0].resource.valueSampledData) {
          return;
        }
        var addToIdx = getLastIndexOfObservationNotAdded(newVal.primaryData.observations);

        for (var idx = addToIdx; idx >= 0; idx--) {
          var obs = newVal.primaryData.observations[idx];
          // Code not matching the current code in config (happens when changing code during active request)
          var code = obs.resource.code.coding[0].code;
          if (code !== Wf.config.code) {
            return;
          }

          // Extract relevant parameters from the FHIR object
          var dataStr = obs.resource.valueSampledData.data;
          var sampledIntervalInMs = obs.resource.valueSampledData.period;
          var lowerLimit = obs.resource.valueSampledData.lowerLimit;
          var upperLimit = obs.resource.valueSampledData.upperLimit;
          var startTime = new Date(obs.resource.effectiveDateTime).getTime();
          var obsId = obs.resource.id;
          var dataArr = dataStr.split(' ');

          updateScales([lowerLimit, upperLimit]);

          // Add data to buffer
          addDataToBuffer(dataArr, startTime, sampledIntervalInMs);
          Wf.latestObservations.push(obsId);
        }
      }, true);


      scope.$watch('config', function (newVal) {
        if (newVal) {
          // Update configs
          Wf.config = newVal;

          // Clear buffer
          Wf.emptyDataBuffer();

          // Clear canvas
          Wf.canvasCtx.clearRect(0, 0, Wf.xScale(Wf.xMax), Wf.config.dim.height);

          // Reset Painter
          Wf.resetPainter();
        }
      }, true);

      ///////////// EVENT LISTENERS ///////////////
      scope.$on('$destroy', function () {
        // Make sure that the interval is destroyed too
        Wf.stop();
      });
    }
  }
})();
