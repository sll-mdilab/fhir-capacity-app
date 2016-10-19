
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:HumanCtrl
 * @description
 * # HumanCtrl
 * Controller of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('HumanCtrl', HumanCtrl);

  HumanCtrl.$inject =  ['$scope', '$filter', 'CapacityUtils', 'SharedConfig'];
  
  function HumanCtrl($scope, $filter, CapacityUtils, SharedConfig) {
    var vm = this;
    init();

    function init() {
      vm.config = SharedConfig.get();
      initVariables();
      initScopeFunctions();      
    }

    function initVariables() {
      vm.activeObject = {};
      vm.showIEEE = true;

      // List of possible clinical impressions that can be placed on the human body model
      vm.clinicalImpressionItems = [
        {id: 'item0', name: 'Arterial line', activeList: []},
        {id: 'item2', name: 'Bedsore', activeList: []},
        {id: 'item1', name: 'Peripheral venous line', activeList: []}
      ];

      // List of all active clinical impressions
      vm.allActiveList = [];

      // Hide add for mobile devices because drag and drop library doesn't have support for these
      vm.showAddButtons = !CapacityUtils.checkIfMobileDevice();
    }

    function initScopeFunctions() {
      vm.changeLocation = CapacityUtils.changeLocation;   
      vm.onStart = onStart;
      vm.onDrag = onDrag;
      vm.onStop = onStop;
      vm.addActiveItem = addActiveItem;
      vm.setActiveItemHighlight = setActiveItemHighlight;
    }

    function onStart(event, position, object) {
      // Highlight item when start dragging
      setActiveItemHighlight(object, true);
    }

    function onDrag(event, position, object)  {
      // Continously update position when dragging an object
      $scope.$apply(function() {
        object.x = event.pageX;
        object.y = event.pageY;
      });
    }

    function onStop(event, position, object) {
      $scope.$apply(function() {
        // Needed to keep item highlighted since the click event will trigger after this
        setActiveItemHighlight(object, false);

        // Reset position if not dropeed on a body part
        if (!object.bodyPart.id) {
          event.target.style.top = '';
          event.target.style.right = '';
          event.target.style.left = '';
        }
      });
    }
    
    function addActiveItem(item) {
      // Add item from clinical impression list
      var id = item.id + '-' + item.activeList.length;
      var newActiveItem = {id: id, name: item.name, x:0, y:0, isHighlight: false};

      item.activeList.push(newActiveItem);
      vm.allActiveList.push(newActiveItem);

      setActiveItemHighlight(newActiveItem, true);
      vm.allActiveList = $filter('orderBy')(vm.allActiveList, 'name', false);
    }

    function setActiveItemHighlight(active, isHighlight) {
      for (var i in vm.allActiveList) {
        // Reset highlights on all element
        vm.allActiveList[i].isHighlight = false;
        
        // set highlight on active element
        if (vm.allActiveList[i].id === active.id) {
          active.isHighlight = isHighlight;
        }
      }   
      
      // Set active object for human body directive
      vm.activeObject = active;
    }

  }
})();
