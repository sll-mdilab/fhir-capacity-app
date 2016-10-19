
/**
 * @ngdoc directive
 * @name fhirCapacityApp.directive:humanBody
 * @description
 * # humanBody
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .directive('humanBody', humanBody);

  humanBody.$inject = ['$window','HeadData', 'FaceData', 'NeckData', 'LeftArmData', 'RightArmData', 'TrunkData', 'LeftLegData', 'RightLegData'];

  function humanBody($window, HeadData, FaceData, NeckData, LeftArmData, RightArmData, TrunkData, LeftLegData, RightLegData) {
    return {
      restrict: 'E',
      scope: {
        activeObject: '=activeObject'
      },
      link: postLink 
    }

    function postLink(scope, element, attrs) {
      var hb = {};
      init();

      function init() {
        setupSvgElement();
        setOffsets();
        setupScales();
        setupBodyParts();
      }

      function setupSvgElement() {
        var width = window.innerWidth > 767 ? '80%' : '40%';  /* Grid breakpoint */
        hb.svg = d3.select(element[0]);
        hb.svg = hb.svg.append('svg')
          .attr('id', 'human-body-svg')
          .attr('width', width);

        var width = d3.select(element[0])[0][0].offsetWidth;
        hb.svg.attr('height', 2 * width);
      }

      function setOffsets() {
        // Offsets from window to svg
        var humanBodySvg = document.getElementById('human-body-svg'); 
        scope.offsetLeft = humanBodySvg ? humanBodySvg.getBoundingClientRect().left : 0;
        scope.offsetTop = humanBodySvg ? humanBodySvg.getBoundingClientRect().top : 0;      
      }

      function setupScales() {
        var width = d3.select(element[0])[0][0].offsetWidth;
        var height = d3.select(element[0])[0][0].offsetHeight;

        hb.horizontalScale = d3.scale.linear()
          .domain([0, 300])
          .range([0, width]);

        hb.verticalScale = d3.scale.linear()
          .domain([0, 600])
          .range([0, 2*width]);
      }

      function setupBodyParts() {
        // Setup body part objects, get data from body part services
        hb.bodyParts = {
          head: getBodyPartObject('head', HeadData),
          face: getBodyPartObject('face', FaceData),
          neck: getBodyPartObject('neck', NeckData),
          leftArm: getBodyPartObject('leftArm', LeftArmData),
          rightArm: getBodyPartObject('rightArm', RightArmData),
          trunk: getBodyPartObject('trunk', TrunkData),
          leftLeg: getBodyPartObject('leftLeg', LeftLegData),
          rightLeg: getBodyPartObject('rightLeg', RightLegData)
        }

        // Go through body part objects
        for (var i in hb.bodyParts){
          if (hb.bodyParts.hasOwnProperty(i)) {
            // Append path
            hb.bodyParts[i].path = hb.svg.append('path')
              .attr('fill', '#fff')
              .attr('stroke', '#fff')
              .attr('d', hb.bodyParts[i].outlineData);

            // Set max values
            var boundingClientRect = hb.bodyParts[i].path[0][0].getBoundingClientRect();
            hb.bodyParts[i].maxValues = {
              maxTop: boundingClientRect.top - scope.offsetTop,
              maxRight: boundingClientRect.right - scope.offsetLeft,
              maxBottom: boundingClientRect.bottom - scope.offsetTop,
              maxLeft: boundingClientRect.left - scope.offsetLeft
            }
          }
        }
      }

      function getBodyPartObject(id, bodyPartData) {
        return {
          id: id,
          SNOMED: 'SNOMED-' + id,
          IEEE: 'IEEE-' + id,
          outlineData: getPathData(bodyPartData),
          isHighlighted: false
        }
      }

      function getPathData(bodyPartData) {
        var maxValues = {}; 
        var outlineData = '';

        // Get svg path data string
        for (var i in bodyPartData) {
          var x = hb.horizontalScale(bodyPartData[i].x);
          var y = hb.verticalScale(bodyPartData[i].y);

          outlineData = outlineData !== '' ? outlineData + ' ' : outlineData 
          outlineData = outlineData + bodyPartData[i].d + x + ',' + y;  
        }
        return outlineData;
      }

      function highlightBodyPart(bodyPart) {
        bodyPart.isHighlighted = true;
        bodyPart.path.attr('fill', '#aaa').attr('stroke', '#aaa');
      }

      function unHighlightBodyPart(bodyPart) {
        bodyPart.isHighlighted = false;
        bodyPart.path.attr('fill', '#fff').attr('stroke', '#fff');
      }

      function highlightOnHover(x, y, bodyPart) {
        if (checkIfActiveBodyPart(x, y, bodyPart.maxValues)) {
          removeHighlightFromAll();
          highlightBodyPart(bodyPart);
          
          // Set bodypart to active (dragged) object on hover
          scope.activeObject.bodyPart = {
            id: bodyPart.id,
            SNOMED: bodyPart.SNOMED,
            IEEE: bodyPart.IEEE
          };
        } else {
          unHighlightBodyPart(bodyPart);
        } 
      }

      function checkIfActiveBodyPart(x, y, maxValues) {
        // Check if hover
        return (
          (y > maxValues.maxTop && y < maxValues.maxBottom) && 
          (x > maxValues.maxLeft && x < maxValues.maxRight)
        );
      }

      function removeHighlightFromAll() {
        for (var i in hb.bodyParts){
          if (hb.bodyParts.hasOwnProperty(i)) {
            unHighlightBodyPart(hb.bodyParts[i]);
          }
        }  
      }

      // Listen to when 'activeObject' changes
      scope.$watch('activeObject', function (newVals, oldVals) {
        // Reset body part on active (dragged) object
        newVals.bodyPart = {};
        for (var i in hb.bodyParts) {
          highlightOnHover(newVals.x - scope.offsetLeft, newVals.y - scope.offsetTop, hb.bodyParts[i]);      
        }

        // Unhighlight body part if active (dragged) object is not highlighted
        if (newVals.bodyPart.id && !newVals.isHighlight) {
          unHighlightBodyPart(hb.bodyParts[newVals.bodyPart.id]);
        }
      }, true);

      // Reset view on resize
      angular.element($window).bind('resize', function () {
        hb.svg.remove();
        init();
      });   

    }
  }

})();

