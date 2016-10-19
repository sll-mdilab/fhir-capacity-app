
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:BodyMapperCtrl
 * @description
 * # BodyMapperCtrl
 * Controller of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('BodyMapperCtrl', BodyMapperCtrl);

  BodyMapperCtrl.$inject =  ['$scope', '$filter', 'CapacityUtils', 'SharedConfig', 'fhirConceptMap'];
  
  function BodyMapperCtrl($scope, $filter, CapacityUtils, SharedConfig , fhirConceptMap) {
    var vm = this;	
	init();

    function init() {
		vm.config = SharedConfig.get();
		initVariables();
		initScopeFunctions();  

		vm.show_search = true;
		vm.show_wider = true;
		vm.show_narrow = true;
	  
		vm.searchResults = [];
	  	vm.searchResults = [];		
		vm.searchResults_SNOMED = [];
	  	vm.hierarchyWider_SNOMED = [];
		vm.hierarchyWider_IEEEX73 = [];
		vm.hierarchyWider_Clinisoft = [];
		vm.hierarchyNarrower_SNOMED = [];
		vm.hierarchyNarrower_IEEEX73 = [];
		vm.hierarchyNarrower_Clinisoft = [];
    }

    function initVariables() {
		
		vm.patient = "Tian Tiansson";
	  
	  
      vm.activeObject = {};
 
	  
	  vm.expandedWider = [
		{system: undefined},
		{system: undefined}
	  ];
	  
	  vm.selectedWider = [
		{system: undefined},
		{system: undefined}
	  ];

      // List of possible clinical impressions that can be placed on the human body model
	  var imageArtLine = new Image();
	  imageArtLine.src = '/images/push_pin_red.png';
	  var imageBedSore = new Image();
	  imageBedSore.src = '/images/push_pin_yellow.png';
	  var imagePerVLine = new Image();
	  imagePerVLine.src = '/images/push_pin_navy.png';
	  var imageEDA = new Image();
	  imageEDA.src = '/images/push_pin_green.png';
	  var imageTTube = new Image();
	  imageTTube.src = '/images/push_pin_black.png';
	  var imageWound = new Image();
	  imageWound.src = '/images/push_pin_pink.png';
	  var imageCDK = new Image();
	  imageCDK.src = '/images/push_pin_orange.png';
	  
      vm.clinicalImpressionItems = [
	  
        {id: 'item0', name: 'Arterial line', activeList: [], image: imageArtLine, index : 0},
        {id: 'item1', name: 'Bedsore', activeList: [], image: imageBedSore, index : 1},
		{id: 'item2', name: 'Epidural analgesia', activeList: [], image: imageEDA, index : 2},
        {id: 'item3', name: 'Peripheral venous line', activeList: [], image: imagePerVLine, index : 3},
		{id: 'item4', name: 'Tracheal tube', activeList: [], image: imageTTube, index : 4},
		{id: 'item5', name: 'Surgical wound', activeList: [], image: imageWound, index : 5},
		{id: 'item6', name: 'Dialysis catheter', activeList: [], image: imageCDK, index : 6}
		
		
		
      ];

      // List of all active clinical impressions
      vm.allActiveList = [];

      // Hide add for mobile devices because drag and drop library doesn't have support for these
      vm.showAddButtons = !CapacityUtils.checkIfMobileDevice();
	  
	  vm.chosenCodingSystem = "snomed";
	  vm.language = "en";
	  
	  vm.clinisoft_body = new Image();
	  vm.clinisoft_body.src = '/images/clinisoft-body.png'
	  
	  vm.pushpin_image = new Image();
	  vm.pushpin_image.src = '/images/push_pin_red.png'
	  
	  vm.numClinisoftGridCols = 21;
	  vm.numClinisoftGridRows = 20;
	  
	  vm.dataLoading = false;
	  vm.legendWidth = 300;
    }

    function initScopeFunctions() {
      vm.changeLocation = CapacityUtils.changeLocation;   
      vm.onStart = onStart;
      vm.onDrag = onDrag;
      vm.onStop = onStop;
      vm.addActiveItem = addActiveItem;
      vm.setActiveItemHighlight = setActiveItemHighlight;
    }
	
	  // Listen to when 'activeObject' changes
     $scope.$watch('vm.activeObject', function (newVal, oldVal) {
		 
		 /*
		 if(newVal.bodyPart == null)
			 return;
 		
		// If new body site
		var newSite = true;
		for(var i=0; i<newVal.bodyPart.length; i++){
			if(	newVal.bodyPart[i].SNOMED === vm.selectedSNOMED.id && 
				newVal.bodyPart[i].IEEE === vm.selectedIEEEX73.id){
					
				newSite = false;
				break;
			}
		}
	
		// Set bodypart to impression
		if(newSite === true){
			var bodySite = {SNOMED: vm.selectedSNOMED.id, IEEE: vm.selectedIEEEX73.id, id: vm.selectedSNOMED.id};
			newVal.bodyPart.push(bodySite);
		}
		*/
 
      }, true);
	
    vm.doSearch = function(lang){ 
		vm.searchResults.length = 0;
		
		vm.searchResults_SNOMED.length = 0;
		
		vm.hierarchyWider_SNOMED.length = 0;
		vm.hierarchyWider_IEEEX73.length = 0;
		vm.hierarchyWider_Clinisoft.length = 0;
		vm.hierarchyNarrower_SNOMED.length = 0;
		vm.hierarchyNarrower_IEEEX73.length = 0;
		vm.hierarchyNarrower_Clinisoft.length = 0;

		vm.selectedSNOMED_Wider = undefined;
		vm.expandedSNOMED_Wider = undefined;
		
		vm.selectedSNOMED_Narrower = undefined;
		vm.expandedSNOMED_Narrower = undefined;
		vm.selectedIEEEX73_Narrower = undefined;
		vm.expandedIEEEX73_Narrower = undefined;
		
		vm.selectedClinisoft_Narrower = undefined;
		vm.expandedClinisoft_Narrower = undefined;
		
		vm.selectedSNOMED = undefined;
		vm.selectedIEEEX73 = undefined;
		vm.selectedClinisoft = undefined;
		
		listLabelsSNOMED(vm.searchString,vm.language);
    };

	vm.AddImpression = function(){
		if( vm.selectedSNOMED === undefined){
			alert("Body site not selected");
			return;
		}
		alert(vm.selectedSNOMED.id);
		alert(vm.selectedIEEEX73.id);
	};

	vm.treeOptions = {
		equality: function(node1, node2) {
				return node1 === node2;
		},
		isSelectable: function(node) {
				return node.id.includes('n/a') === false;
        },
		nodeChildren: "children",
		dirSelectable: true,
		injectClasses: {
			ul: "a1",
			li: "a2",
			liSelected: "a7",
			iExpanded: "a3",
			iCollapsed: "a4",
			iLeaf: "a5",
			label: "a6",
			labelSelected: "a8"
         }
	};
	
	 vm.addRoot = function(tree, label, id, countstr) {
		 var children = [];
         tree.push({"id" : id, "label" : (tree.length +1) + ". " + label + countstr, "display" : label, "index" : tree.length ,"children" : children});
		 return children;
     };
	 
	vm.addChild = function(parent, label, id) {
		var children = [];
        parent.push({"id" : id, "label" : label, "display" : label, "children" : children});
		return children;
     };
	
	vm.showSelectedTerm = function(sel) {
		vm.selectedNode = sel;
			
		vm.hierarchyWider_SNOMED.length = 0;
		vm.hierarchyWider_IEEEX73.length = 0;
		vm.hierarchyWider_Clinisoft.length = 0;
		listHierachiesSNOMEDandIEEEX73( vm.selectedNode.id, 'wider' , vm.hierarchyWider_SNOMED, vm.hierarchyWider_IEEEX73);
		listHierachiesSNOMEDandClinisoft(vm.selectedNode.id, 'wider' , vm.hierarchyWider_SNOMED, vm.hierarchyWider_Clinisoft);
		
		vm.hierarchyNarrower_SNOMED.length = 0;
		vm.hierarchyNarrower_IEEEX73.length = 0;
		vm.hierarchyNarrower_Clinisoft.length = 0;			
	};
	
	vm.handleSelectedSNOMEDWider = function(sel, parent, index, otherHierarchy, otherExpanded, otherSelected){
		
		// IEEE
		handleSelectedSNOMEDWiderOther(sel, parent, index, vm.hierarchyWider_IEEEX73, 0);
		vm.selectedIEEEX73 = vm.selectedWider[0].system;
		// Populate Narrower hierarcy
		vm.hierarchyNarrower_SNOMED.length = 0;
		vm.hierarchyNarrower_IEEEX73.length = 0;
		listHierachiesSNOMEDandIEEEX73( vm.selectedSNOMED.id, 'narrower', vm.hierarchyNarrower_SNOMED, vm.hierarchyNarrower_IEEEX73 );
		
		// Clinisoft
		handleSelectedSNOMEDWiderOther(sel, parent, index, vm.hierarchyWider_Clinisoft, 1);		
		vm.selectedClinisoft = vm.selectedWider[1].system;
		vm.hierarchyNarrower_Clinisoft.length = 0;
		listHierachiesSNOMEDandClinisoft( vm.selectedSNOMED.id, 'narrower', vm.hierarchyNarrower_SNOMED, vm.hierarchyNarrower_Clinisoft );
	};
	
	function handleSelectedSNOMEDWiderOther(sel, parent, index, otherHierarchy, otherSystemIndex){
		vm.selectedNode = sel;
		vm.selectedSNOMED = sel;
		
		// Set selection in IEEEX73 tree and Clinisoft tree
		vm.expandedWider[otherSystemIndex].system = undefined;
		if(parent == null){
			
			// If the matched term is n/a navigate UP
			if(otherHierarchy[index].id == "n/a"){
				handleSelectedSNOMEDWiderOther(sel, otherHierarchy[index], 0, otherHierarchy, otherSystemIndex)
				return;
			}
			
			vm.selectedWider[otherSystemIndex].system = otherHierarchy[index];
			vm.expandedWider[otherSystemIndex].system = otherHierarchy[index];
		}
		else{
			// Find 1st term that is not n/a
			var i = index;
			while(otherHierarchy[parent.index].children[i].id == "n/a")
				i++;
			vm.selectedWider[otherSystemIndex].system = otherHierarchy[parent.index].children[i];
			vm.expandedWider[otherSystemIndex].system = otherHierarchy[parent.index];		
		}
	};
	
	vm.handleSelectedIEEEX73Wider = function(sel, parent, index){
		vm.selectedNode = sel;
		vm.selectedIEEEX73 = sel;
		
		// Set selection in SNOMED tree
		vm.expandedSNOMED_Wider = undefined;
		if(parent == null){
			vm.selectedSNOMED_Wider = vm.hierarchyWider_SNOMED[index];
			vm.expandedSNOMED_Wider = [ vm.hierarchyWider_SNOMED[index] ];
		}
		else{
			vm.selectedSNOMED_Wider = vm.hierarchyWider_SNOMED[parent.index].children[index];
			vm.expandedSNOMED_Wider = [ vm.hierarchyWider_SNOMED[parent.index] ];			
		}
		vm.selectedSNOMED = vm.selectedSNOMED_Wider;
		
		// Populate Narrower hierarcy
		vm.hierarchyNarrower_SNOMED.length = 0;
		vm.hierarchyNarrower_IEEEX73.length = 0;
		listHierachiesSNOMEDandIEEEX73( vm.selectedSNOMED.id, 'narrower', vm.hierarchyNarrower_SNOMED, vm.hierarchyNarrower_IEEEX73 );
		
		// Clinisoft
		handleSelectedSNOMEDWiderOther(sel, parent, index, vm.hierarchyWider_Clinisoft, 1);		
		vm.selectedClinisoft = vm.selectedWider[1].system;
		vm.hierarchyNarrower_Clinisoft.length = 0;
		listHierachiesSNOMEDandClinisoft( vm.selectedSNOMED.id, 'narrower', vm.hierarchyNarrower_SNOMED, vm.hierarchyNarrower_Clinisoft );
	};
	
	vm.handleSelectedClinisoftWider = function(sel, parent, index){
		vm.selectedNode = sel;
		vm.selectedClinisoft = sel;
		
		// Set selection in SNOMED tree
		vm.expandedSNOMED_Wider = undefined;
		if(parent == null){
			vm.selectedSNOMED_Wider = vm.hierarchyWider_SNOMED[index];
			vm.expandedSNOMED_Wider = [ vm.hierarchyWider_SNOMED[index] ];
		}
		else{
			vm.selectedSNOMED_Wider = vm.hierarchyWider_SNOMED[parent.index].children[index];
			vm.expandedSNOMED_Wider = [ vm.hierarchyWider_SNOMED[parent.index] ];			
		}
		vm.selectedSNOMED = vm.selectedSNOMED_Wider;
		
		vm.hierarchyNarrower_Clinisoft.length = 0;
		listHierachiesSNOMEDandClinisoft( vm.selectedSNOMED.id, 'narrower', vm.hierarchyNarrower_SNOMED, vm.hierarchyNarrower_Clinisoft );
		
		vm.hierarchyNarrower_IEEEX73.length = 0;
		listHierachiesSNOMEDandIEEEX73( vm.selectedSNOMED.id, 'narrower', vm.hierarchyNarrower_SNOMED, vm.hierarchyNarrower_IEEEX73 );
	};
	
	vm.handleSelectedSNOMEDNarrower = function(sel, parent, index){
		vm.selectedNode = sel;
		vm.selectedSNOMED = sel;
		
		// Set selection in IEEEX73 tree
		vm.selectedIEEEX73_Narrower = undefined;
		vm.expandedIEEEX73_Narrower = undefined;
		if(parent == null){
			
			// If the matched term is n/a - that is it. selection is cleared and goes back to wider tree
			if(vm.hierarchyNarrower_IEEEX73[index].id.includes('n/a') === true){
				//vm.handleSelectedSNOMEDNarrower(sel, vm.hierarchyNarrower_IEEEX73[index], 0)
				return;
			}
				
			vm.selectedIEEEX73_Narrower = vm.hierarchyNarrower_IEEEX73[index];
			vm.expandedIEEEX73_Narrower = [ vm.hierarchyNarrower_IEEEX73[index] ];
		}
		else{
			// Find 1st term that is not n/a
			var i = index;
			while(  i >= 0 && vm.hierarchyNarrower_IEEEX73[parent.index].children[i].id.includes('n/a') === true)
				i--;
			if( i >= 0){
				vm.selectedIEEEX73_Narrower = vm.hierarchyNarrower_IEEEX73[parent.index].children[i];
			}
			else if(vm.hierarchyNarrower_IEEEX73[parent.index].id.includes('n/a') === false){
				vm.selectedIEEEX73_Narrower = vm.hierarchyNarrower_IEEEX73[parent.index];
			}
			vm.expandedIEEEX73_Narrower = [ vm.hierarchyNarrower_IEEEX73[parent.index] ];	
		}
		if( vm.selectedIEEEX73_Narrower !== undefined)
			vm.selectedIEEEX73 = vm.selectedIEEEX73_Narrower;
		
		// Set selection in Clinisoft tree
		vm.selectedClinisoft_Narrower = undefined;
		vm.expandedClinisoft_Narrower = undefined;
		if(parent == null){
			
			// If the matched term is n/a - that is it. selection is cleared and goes back to wider tree
			if(vm.hierarchyNarrower_Clinisoft[index].id.includes('n/a') === true){
				return;
			}
				
			vm.selectedClinisoft_Narrower = vm.hierarchyNarrower_Clinisoft[index];
			vm.expandedClinisoft_Narrower = [ vm.hierarchyNarrower_Clinisoft[index] ];
		}
		else{
			// Find 1st term that is not n/a
			var i = index;
			while(  i >= 0 && vm.hierarchyNarrower_Clinisoft[parent.index].children[i].id.includes('n/a') === true)
				i--;
			if( i >= 0){
				vm.selectedClinisoft_Narrower = vm.hierarchyNarrower_Clinisoft[parent.index].children[i];
			}
			else if(vm.hierarchyNarrower_Clinisoft[parent.index].id.includes('n/a') === false){
				vm.selectedClinisoft_Narrower = vm.hierarchyNarrower_Clinisoft[parent.index];
			}
			vm.expandedClinisoft_Narrower = [ vm.hierarchyNarrower_Clinisoft[parent.index] ];	
		}
		if( vm.selectedClinisoft_Narrower !== undefined)
			vm.selectedClinisoft = vm.selectedClinisoft_Narrower;
	};
	
	vm.handleSelectedIEEEX73Narrower = function(sel, parent, index){
		vm.selectedNode = sel;
		vm.selectedIEEEX73 = sel;
		
		// Set selection in SNOMED tree
		vm.expandedSNOMED_Narrower = undefined;
		if(parent == null){
			vm.selectedSNOMED_Narrower = vm.hierarchyNarrower_SNOMED[index];
			vm.expandedSNOMED_Narrower = [ vm.hierarchyNarrower_SNOMED[index] ];
		}
		else{
			vm.selectedSNOMED_Narrower = vm.hierarchyNarrower_SNOMED[parent.index].children[index];
			vm.expandedSNOMED_Narrower = [ vm.hierarchyNarrower_SNOMED[parent.index] ];			
		}
		vm.selectedSNOMED = vm.selectedSNOMED_Narrower;
	};
	
	vm.handleSelectedClinisoftNarrower = function(sel, parent, index){
		vm.selectedNode = sel;
		vm.selectedClinisoft = sel;
		
		// Set selection in SNOMED tree
		vm.expandedSNOMED_Narrower = undefined;
		if(parent == null){
			vm.selectedSNOMED_Narrower = vm.hierarchyNarrower_SNOMED[index];
			vm.expandedSNOMED_Narrower = [ vm.hierarchyNarrower_SNOMED[index] ];
		}
		else{
			vm.selectedSNOMED_Narrower = vm.hierarchyNarrower_SNOMED[parent.index].children[index];
			vm.expandedSNOMED_Narrower = [ vm.hierarchyNarrower_SNOMED[parent.index] ];			
		}
		vm.selectedSNOMED = vm.selectedSNOMED_Narrower;
	};
	
	function listLabelsSNOMED(searchString,lang) {
		vm.dataLoading = true;
		
		return fhirConceptMap.getTermsSNOMED(searchString, lang).then(function (returnData) {
		
		vm.dataLoading = false;
		
		vm.searchResults_SNOMED = [];
		var success = returnData.parameter[0].valueBoolean;
		
		if(success === false){
			vm.searchResults_SNOMED.push({"label" : 'n/a', "id" : 'n/a'});
			return;
		}
		
		var i;
		for (i = 1; i < returnData.parameter.length; i++) { 
			vm.searchResults_SNOMED.push({"label" : returnData.parameter[i].part[1].valueCoding.display, 
								 "id" : returnData.parameter[i].part[1].valueCoding.code});
		}
		
      }, function () {
		vm.dataLoading = false;
        throw new Error('There was a problem communicating with the server.');
      });
    }
  
	function listHierachiesSNOMEDandIEEEX73(snomed_code, equivalende_code, hierarchySNOMED, hierarchyIEEEX73) {
		
	  vm.dataLoading = true;
      return fhirConceptMap.getHierachiesIEEEX73(snomed_code, equivalende_code).then(function (returnData) {
		  
		vm.dataLoading = false;  
		
		var success = returnData.parameter[0].valueBoolean;
		
		if(returnData.parameter.length <= 1 ){
			vm.addRoot(hierarchySNOMED, "no results","na", "");
			return;
		}
		
		var i;	
		for (i = 1; i < returnData.parameter.length; i++) { 
			var part_len = returnData.parameter[i].part.length;
			
			// Navigate Concepts			
			var hasRoot = false;
			var parent = [];
			for (var j = 1, partCountNoEmpty = 0; j < part_len; j++) { 
				if( returnData.parameter[i].part[j].name == "concept"){
					
					if(returnData.parameter[i].part[j].valueCoding.code != "n/a")
						partCountNoEmpty++;
					
					if(hasRoot == false){
						parent = vm.addRoot(hierarchyIEEEX73, returnData.parameter[i].part[j].valueCoding.display, 
															 returnData.parameter[i].part[j].valueCoding.code, "");
						hasRoot = true;
					}
					else
						vm.addChild(parent, returnData.parameter[i].part[j].valueCoding.display, 
											returnData.parameter[i].part[j].valueCoding.code);
				}
			}		
			// set count on top level
			var countstr = " (" + (partCountNoEmpty ) + ")"; 
			hierarchyIEEEX73[i-1].label = hierarchyIEEEX73[i-1].label + countstr; 
			
			// Navigate Product.Concepts  -  SNOMED canonical tree
			hasRoot = false;
			parent = [];
			for (j = 1; j < part_len; j++) { 
				if( returnData.parameter[i].part[j].name == "product"){
					if(hasRoot == false){
						countstr = " (" + ((part_len-1)/2) + ")";
						parent = vm.addRoot(hierarchySNOMED, returnData.parameter[i].part[j].part[0].valueCoding.display, 
											returnData.parameter[i].part[j].part[0].valueCoding.code, countstr);
						hasRoot = true;
					}
					else
						vm.addChild(parent, returnData.parameter[i].part[j].part[0].valueCoding.display, 
											returnData.parameter[i].part[j].part[0].valueCoding.code);
				}
			}		
		}
		
      }, function () {
        throw new Error('There was a problem communicating with the server.');
      });
    }
	
	function listHierachiesSNOMEDandClinisoft(snomed_code, equivalende_code, hierarchySNOMED, hierarchyClinisoft) {
		
	  vm.dataLoading = true;
	  
      return fhirConceptMap.getHierachiesClinisoft(snomed_code, equivalende_code).then(function (returnData) {
		  		  
		vm.dataLoading = false;
		
		var success = returnData.parameter[0].valueBoolean;
		
		var i;	
		for (i = 1; i < returnData.parameter.length; i++) { 
			var part_len = returnData.parameter[i].part.length;
			
			// Navigate Concepts			
			var hasRoot = false;
			var parent = [];
			for (var j = 1, partCountNoEmpty = 0; j < part_len; j++) { 
				if( returnData.parameter[i].part[j].name == "concept"){
					
					if(returnData.parameter[i].part[j].valueCoding.code != "n/a")
						partCountNoEmpty++;
					
					// labels are not generally set on Clinisoft terms, then use ID as all labels
					var display = returnData.parameter[i].part[j].valueCoding.code;
					if(hasRoot == false){
						parent = vm.addRoot(hierarchyClinisoft, display, 
																returnData.parameter[i].part[j].valueCoding.code, "");
						hasRoot = true;
					}
					else
						vm.addChild(parent, display, 
											returnData.parameter[i].part[j].valueCoding.code);
				}
			}		
			// set count on top level
			var countstr = " (" + (partCountNoEmpty ) + ")"; 
			hierarchyClinisoft[i-1].label = hierarchyClinisoft[i-1].label + countstr; 
		}
		
      }, function () {
        throw new Error('There was a problem communicating with the server.');
      });
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
		
		// Calculate relative coordinates to Canvas.
		
		var c = document.getElementById("clinImpressionReport");
		var ctx = c.getContext("2d");
		var rect = c.getBoundingClientRect();
		var canvasOffset=$("#clinImpressionReport").offset();
		var offsetX=canvasOffset.left;
		var offsetY=canvasOffset.top;
	
		var canvasX, canvasY;
		if( (object.x - offsetX) < 0 || (object.x - offsetX) > rect.width )
			canvasX = -1;
		else
			canvasX = object.x - offsetX;
		if( (object.y - offsetY) < 0 || (object.y - offsetY) > rect.height )
			canvasY = -1;
		else
			canvasY = object.y - offsetY;		
	
		//alert("x:  " + canvasX + "   y:  " + canvasY );
		
		if( vm.chosenCodingSystem !== 'clinisoft' || ( canvasX < 0 || canvasY < 0) )
			addBodySiteToImpression(object);
		else{
			addImpressionToClinisoft(object, canvasX, canvasY, rect.width - vm.legendWidth, rect.height);
			
			// Send the marker back
			event.target.style.top = '';
			event.target.style.right = '';
			event.target.style.left = '';
		}
		
		
		/*
        // Reset position if not dropeed on a body part
        if (!object.bodyPart.id) {
          event.target.style.top = '';
          event.target.style.right = '';
          event.target.style.left = '';
        }
		*/
		
      });
    }
	
	function getMousePos(canvas, object) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
			y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}
	
	function addBodySiteToImpression(object){
		// Set new body site
		 if(object.bodyPart == null)
			 return;
 		
		// If new body site
		var newSite = true;
		for(var i=0; i<object.bodyPart.length; i++){
			if(	vm.selectedSNOMED == undefined ||
				(object.bodyPart[i].SNOMED === vm.selectedSNOMED.id && 
				object.bodyPart[i].IEEE === vm.selectedIEEEX73.id &&
				object.bodyPart[i].Clinisoft === vm.selectedClinisoft.id)){
					
				newSite = false;
				break;
			}
		}
	
		// Set bodypart to impression
		if(newSite === true && vm.selectedSNOMED !== undefined){
			var bodySite = {SNOMED: vm.selectedSNOMED.id, IEEE: vm.selectedIEEEX73.id, Clinisoft: vm.selectedClinisoft.id, id: vm.selectedSNOMED.id,
							SNOMED_label: vm.selectedSNOMED.display, IEEE_label: vm.selectedIEEEX73.display};
			object.bodyPart.push(bodySite);
		}		
	}
    
    function addActiveItem(item) {
      // Add item from clinical impression list
      var id = item.id + '-' + item.activeList.length;
      var newActiveItem = {id: id, name: item.name, x:0, y:0, itemDefIndex: item.index, bodyPart: [], isHighlight: false};
	  
      item.activeList.push(newActiveItem);
      vm.allActiveList.push(newActiveItem);

	  addBodySiteToImpression(newActiveItem);
      setActiveItemHighlight(newActiveItem, true);
      vm.allActiveList = $filter('orderBy')(vm.allActiveList, 'name', false);
    }
	
	vm.deleteClinicalExpression = function() {
		
		// remove from active list
		var idx = vm.allActiveList.indexOf(vm.activeObject);
		var item;
		if (idx > -1) {
			item = vm.allActiveList[idx];
			vm.allActiveList.splice(idx, 1);
		}
		else
			return;
		
		// Remoove push-pin icon
		var itemCI = vm.clinicalImpressionItems[item.itemDefIndex];
		idx = itemCI.activeList.indexOf(vm.activeObject);
		var item;
		if (idx > -1) {
			itemCI.activeList.splice(idx, 1);
		}
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
	
	
	vm.showReport = function(){
		var c = document.getElementById("clinImpressionReport");
		var ctx = c.getContext("2d");
		
		ctx.clearRect(0, 0, c.width, c.height);
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 0;
		
		var x,y;
		x=20;
		y=15;
		
		if(vm.chosenCodingSystem === "snomed" || vm.chosenCodingSystem === "ieee"){
			
			ctx.font = "12px Arial";
			ctx.fillText(vm.patient,x,y);	
			
			var newDate = new Date();
			var datetime = new Date().toLocaleString();
			var y= y + 20;
			ctx.fillText(datetime,x,y);
			var y= y + 20;			
		
			// Navigate over Clin Expression
			for (var i in vm.allActiveList) {
				var name = vm.allActiveList[i].name;
				
				ctx.font = "bold 15px Arial";
				y= y + 25;
				ctx.fillText(name,x,y);		

				var sites = [];
				for (var j in vm.allActiveList[i].bodyPart) {
					var site;
					if( vm.chosenCodingSystem === "snomed")
						site = vm.allActiveList[i].bodyPart[j].SNOMED_label  + " (" + vm.allActiveList[i].bodyPart[j].SNOMED + ")";
					else
						site = vm.allActiveList[i].bodyPart[j].IEEE_label + " (" + vm.allActiveList[i].bodyPart[j].IEEE + ")";
					
					// Check if unique for this impression
					if( $.inArray(site, sites)){					
						sites.push(site);
						y= y + 20;
						ctx.font = "12px Arial";					
						ctx.fillText(site,x,y);	
					}					
				}
				y = y + 5;
			}
		}
		else if(vm.chosenCodingSystem === "clinisoft"){
			
			var offsetX = c.width - vm.legendWidth;
			createClinisoftReportLegend(c, ctx, offsetX);
			
			var stepW = offsetX / vm.numClinisoftGridCols;
			var stepH = c.height / vm.numClinisoftGridRows;
			
			// draw body figure
			ctx.drawImage(vm.clinisoft_body, stepW, stepH, offsetX - (2.0*stepW), c.height-(2.0*stepH));	
			
			// Draw grid
			ctx.font = "15px Arial";
			ctx.fillStyle = 'gray';
			// Vertical
			ctx.lineWidth = 0.05;
			ctx.strokeStyle="gray";

			x=0;						
			for( var i = 0; i< vm.numClinisoftGridCols; i++){
				x = x + stepW;
				ctx.moveTo(x,0);
				ctx.lineTo(x,c.height);
				ctx.stroke();
				// label
				var label = String.fromCharCode(65 + i);
				ctx.fillText(label, x-stepW + 5, 20);		
			}
			
			// horizontal
			y = c.height;
			for( var j = vm.numClinisoftGridRows; j > 1; j--){
				y = y - stepH;
				ctx.moveTo(0,y);
				ctx.lineTo(offsetX,y);
				ctx.stroke();
				ctx.fillText(20-j,5,y + 25);					
			}
			
			// Clin impressions
			var icon_width  = 24;
			var icon_height = 24;
				
			for (var i in vm.allActiveList) {
				
				var pushpin_image = vm.clinicalImpressionItems[vm.allActiveList[i].itemDefIndex].image;
				var names = [];	
				var sites = [];	
				for (var j in vm.allActiveList[i].bodyPart) {
					var name = vm.allActiveList[i].name;					
					
					var site;
					site = vm.allActiveList[i].bodyPart[j].Clinisoft;
					var dim = site.split("_");
					y= y + 30;
					
					// Calculate coordinates
					var startCell = dim[0];
					var startLetter = startCell.substring(0,1);
					var startNumber = startCell.substring(1,3);
					var startCol = startLetter.charCodeAt(0) - 65;
					var startRow = parseInt(startNumber) + 1;

					var endRow;
					var endCol;
					
					if( dim.length > 1){
						// composite cell - need to find center
						var endCell = dim[1];
						var endLetter = endCell.substring(0,1);
						var endNumber = endCell.substring(1,3);
						endCol = endLetter.charCodeAt(0) - 65;
						endRow = parseInt(endNumber) + 1;		

						ctx.shadowColor = 'black';
						ctx.shadowOffsetX = 2;
						ctx.shadowOffsetY = -6;
						ctx.shadowBlur = 10;						
					}
					else{
						endRow = startRow;
						endCol = startCol;
						
						ctx.shadowOffsetX = 0;
						ctx.shadowOffsetY = 0;
						ctx.shadowBlur = 0;
					}
					

					y = c.height - (  stepH * (startRow - (startRow-endRow)/2.0) );		
					x = stepW * (startCol + (endCol-startCol)/2.0);					
					
					// apply random drift for possible duplicates
					x = x + Math.floor((Math.random() * icon_width/2 ) + 1);
					y = y - Math.floor((Math.random() * icon_width/2 ) + 1);
					
					// Avoid multiple push-pins for same impression  in the same cell
					if( ($.inArray(name, names) === -1) || ($.inArray(site, sites) === -1) ){					
						names.push(name);
						sites.push(site);
						ctx.drawImage(pushpin_image, x+1, y-1, icon_width, icon_height);	
					}						
					
				}
			}
		}
		
		vm.downloadReport('clinImpressionReport');
	};
	
	function createClinisoftReportLegend(c, ctx, offsetX) {
		
		ctx.clearRect(offsetX, 0, c.width, c.height);
		
		ctx.font = "bold 15px Arial";
		var x=offsetX + 10;
		var y=20;
		ctx.fillText("Legend:",x,y);		
		
		// Clin impressions
		var icon_width  = 24;
		var icon_height = 24;
		ctx.font = "12px Arial";
	
		for(var i in vm.clinicalImpressionItems){
			y = y + 20;
			
			var pushpin_image = vm.clinicalImpressionItems[i].image;
			ctx.drawImage(pushpin_image, x, y, icon_width, icon_height);
			ctx.fillText(vm.clinicalImpressionItems[i].name,x + icon_width + 10, y + icon_height/2.0);				
		}
		
		ctx.font = "12px Arial";
		var x=offsetX + 10;
		var y=c.height - 20;
		ctx.fillText(vm.patient,x,y);	
		
		var newDate = new Date();
		var datetime = new Date().toLocaleString();
		var y= y - 20;
		ctx.fillText(datetime,x,y);	
	}
	
	function addImpressionToClinisoft(object, canvasX, canvasY, canvasW, canvasH){
		
		// Figure the Clinisoft bodysite Cell number
		var stepW = canvasW / vm.numClinisoftGridCols;
		var stepH = canvasH / vm.numClinisoftGridRows;
		
		var colNum = parseInt(canvasX / stepW);
		var row = vm.numClinisoftGridRows - parseInt(canvasY / stepH) - 1;
		var col = String.fromCharCode(65 + colNum);
		var clinisoftTermID = col + row;
		
		// Check that this Clinisoft Term has mapping SNOMED, and that then also get best IEEE match
		vm.matchClinisoftToSNOMED(clinisoftTermID, object);		

		//alert(row + ":" + col);
		 
	}
	
	vm.matchClinisoftToSNOMED = function(sourcecode, object) {
      return fhirConceptMap.getDirectOrWiderMatch('http://sll-mdilab.net/BodySites/Clinisoft', sourcecode, 'http://snomed.info/sct', 'subsumes').then(function (returnData) {
		  
		var success = returnData.parameter[0].valueBoolean;
		if(success === false)
			alert('There is no mapping from ' + sourcecode + " to any SNOMED-CT term. Use the Authoring Corner to add one");
		else{
			// Mapping exists - set the Clinisoft code as selected item, for model to work
			
			//get via FHIR query - all equal mappings
			var i;	
			for (i = 1; i < returnData.parameter.length; i++) { 
			
				var termClinisoft = {"id" : sourcecode};
				
				var snomedTermID = returnData.parameter[i].part[1].valueCoding.code;
				var termSNOMED = {"id" : snomedTermID, "display": returnData.parameter[i].part[1].valueCoding.display};

				vm.bestMatchSNOMEDtoIEEE(termClinisoft, termSNOMED, object);		
			}
		}
		
      }, function () {
        throw new Error('There was a problem communicating with the server.');
      });
		
	};
	
	vm.bestMatchSNOMEDtoIEEE = function(termClinisoft, termSNOMED, object) {
      return fhirConceptMap.getHierachiesIEEEX73(termSNOMED.id, 'wider').then(function (returnData) {
		  
		var success = returnData.parameter[0].valueBoolean;
		if(success === false)
			alert('There is no mapping from ' + sourcecode + " to any SNOMED-CT term. Use the Authoring Corner to add one");
		else{
			
			// Get the first match at highest level aka Best Match
			var ieeeTermID = "n/a";
			var ieeeTermLabel = "n/a";
			var minMatchLevel = 99;
			
			var i;	
			for (i = 1; i < returnData.parameter.length; i++) { 
				var part_len = (returnData.parameter[i].part.length - 2); // Exclude Entire Body
				
				// Navigate Concepts			
				for (var j = 1, partCountNoEmpty = 0; j < part_len; j++) { 
					if( returnData.parameter[i].part[j].name == "concept"){
						
						if(returnData.parameter[i].part[j].valueCoding.code != "n/a"){
							if( j < minMatchLevel){
								minMatchLevel = j;
								ieeeTermID = returnData.parameter[i].part[j].valueCoding.code;
								ieeeTermLabel = returnData.parameter[i].part[j].valueCoding.display;
							}
							break;
						}
					}
				}	
			}				
	
			var termIEEE = {"id" : ieeeTermID, "display": ieeeTermLabel};
			vm.selectedIEEEX73 = termIEEE;
			
			vm.selectedClinisoft = termClinisoft;
			vm.selectedSNOMED = termSNOMED;		
			addBodySiteToImpression(vm.activeObject);	
				
			// Clear current codes
			vm.clearSelection();
			
			vm.showReport();
		}
		
      }, function () {
        throw new Error('There was a problem communicating with the server.');
      });
		
	};

	vm.doMapClinisoft = function(direction) {
      return fhirConceptMap.mapSNOMEDandClinisoft(vm.selectedSNOMED.id, vm.mapClinisoftCellID, direction).then(function (returnData) {
		  
		var success = returnData.parameter[0].valueBoolean;
		if(success === false)
			alert('mapping failed');
		
      }, function () {
        throw new Error('There was a problem communicating with the server.');
      });
		
	};
	
	vm.downloadReport = function(canvasID) {       
		var c = document.getElementById(canvasID);
		var dt = c.toDataURL('image/png');
		/* Change MIME type to trick the browser to downlaod the file instead of displaying it */
		dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');

		/* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
		dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');

		document.getElementById("download").href = dt;
	}
	
	vm.clearSelection = function(){
		// Clear current codes
		vm.selectedSNOMED = undefined;
		vm.selectedIEEEX73 = undefined;
		vm.selectedClinisoft = undefined;
	}
	
  }  
})();