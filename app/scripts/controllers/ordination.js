
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:StartCtrl
 * @description
 * # StartCtrl
 * Controller of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('OrdinationCtrl', OrdinationCtrl);

  OrdinationCtrl.$inject =  ['$scope', '$timeout', '$window', '$filter', 'SharedConfig', 'CapacityUtils', 'DefaultParameters', 'CareCaseData', 'DefaultMedicationDoses', 'ParameterConfig'];
  
  function OrdinationCtrl($scope, $timeout, $window, $filter, SharedConfig, CapacityUtils, DefaultParameters, CareCaseData, DefaultMedicationDoses, ParameterConfig) {
    var vm = this;
    init();

    function init() {
      vm.config = SharedConfig.get();
      vm.config.parameterConfig = {};

      initVariables();
      setModalGridMaxRows();
      fetchAllMedication();
      fetchAllParameters();
      setupScopeFunctions();
    }

    function initVariables() {
      vm.showMedicationModal = false;
      vm.itemList = [];
      vm.fullParameterList = [];
      vm.remainingParameterList = [];
      vm.targetParameterList = [];
      vm.fullParameterOrderList = [];
      vm.shownParameterOrderList = [];
      vm.standardMedicationList = [];
      vm.fullMedicationList = [];
      vm.fullMedicationOrderObject = {};
      vm.fullMedicationOrderList = [];
      vm.shownMedicationOrderList = [];
      vm.parameterSearchField = '';
      vm.medicationSearchField = '';
      
      initCollections();
    }

    function initCollections() {
      // Init select and toggle options in the view
      vm.itemListNames = {
        parameter: 'Parameter',
        medication: 'Medication',
        lab: 'Lab'
      };
      vm.medicationDoseTypes = {
        asNeededBoolean: {parameter: 'asNeededBoolean', display: 'As needed'},
        timing: {parameter: 'timing', display: 'Timing'},
        rateRatio: {parameter: 'rateRatio', display: 'Infusion'},
        additionalInstructions: {parameter: 'additionalInstructions', display: 'Target'}
      };
      vm.medicationDoseTime  = ['day', 'h'];
      vm.medicationDoseValues  = ['ml', 'mg', 'mcg', 'mmol', 'E'];
    }

    function setModalGridMaxRows() {
      // Set max height on default medication order modal
      var height = $window.innerHeight;
      vm.modalGridMaxRows = Math.ceil(height / 100);  
    }

    function fetchAllMedication() {
      CareCaseData.getAllMedication().then(function(result) {
        vm.fullMedicationList = result;
        for (var i in vm.fullMedicationList) {
          setMedicationStyleObjects(vm.fullMedicationList[i]);
        }
      });
    }

    function fetchAllParameters() {
      CareCaseData.getAllDeviceMetrics().then(function(result) {
        vm.fullParameterList = result;
        setParameterList();
        fetchAllParameterOrders();
      });
    }

    function setParameterList() {
      for (var i in vm.fullParameterList) {
        vm.fullParameterList[i].styleObjects = {};
        vm.fullParameterList[i].styleObjects.fontClass = vm.fullParameterList[i].color + '-font';
        
        if (vm.fullParameterList[i].extension[0].valueString === 'circulation') {
          // Set heart glyphicon to all circulation parameters
          vm.fullParameterList[i].styleObjects.iconClass = 'glyphicon-heart';
          insertInParameterTargetList(vm.fullParameterList[i]);
        }
      }

      vm.fullParameterList =  $filter('orderBy')(vm.fullParameterList, 'type.text', false);
      vm.remainingParameterList = angular.copy(vm.fullParameterList);
    }

    function insertInParameterTargetList(parameter) {
      // If default parameter, add parameter to target toggle list
      var code = parameter.type.coding[0].code;
      if (code === DefaultParameters.saturation.code || code === DefaultParameters.heartRate.code || code === DefaultParameters.bloodPressure.code) {
        vm.targetParameterList.push(parameter);
      }
    }

    function fetchAllParameterOrders() {
      ParameterConfig.getParameterConfig('Patient/' + vm.config.patient.id).then(function(result) {
        vm.config.parameterConfig = result;
        SharedConfig.set(vm.config);
        
        vm.fullParameterOrderList = CapacityUtils.getArrayFromObject(vm.config.parameterConfig);
        vm.shownParameterOrderList =  $filter('orderBy')(vm.fullParameterOrderList, ['includedObjects.parameter.extension[0].valueString', 'includedObjects.parameter.type.text']);

        fetchAllMedicationOrders();
      });
    }

    function fetchAllMedicationOrders() {
      var includeList = ['MedicationOrder:prescriber', 'MedicationOrder:medication'];
      var patientReference = 'Patient/' + vm.config.patient.id;
      CareCaseData.getMedicationOrders(patientReference, includeList).then(function(result) {
        fetchOrganizationMedicationList();
        listExistingMedicationOrders(result);
      });
    }

    function fetchOrganizationMedicationList() {
      // Get default medication order list for current department
      var medicationListReference = vm.config.managingOrganization.extension[0].valueReference.reference;
      var medicationListId = CapacityUtils.getReferenceId(medicationListReference);
      CareCaseData.getList(medicationListId).then(function(result) {
        vm.standardMedicationList = [];
        for (var i in result.entry) {
          var medicationId = CapacityUtils.getReferenceId(result.entry[i].item.reference);
          var medication = getMedicationFromFullList(medicationId);
          if (medication) {
            vm.standardMedicationList.push(medication);
          }
        }    
      });
    }

    function listExistingMedicationOrders(medicationOrderList) {
      for (var i in medicationOrderList) {
        setMedicationOrderStyleObjects(medicationOrderList[i]);
        vm.fullMedicationOrderObject[medicationOrderList[i].id] = medicationOrderList[i];
        removeMedicationFromFullList(medicationOrderList[i]);
      }
      vm.fullMedicationOrderList = CapacityUtils.getArrayFromObject(vm.fullMedicationOrderObject);
      vm.shownMedicationOrderList = vm.fullMedicationOrderList;
    }

    function setMedicationOrderStyleObjects(medicationOrder) {
      // Set formatted dates, is active boolean for medication order
      var dateWritten = new Date(medicationOrder.dateWritten);
      medicationOrder.styleObjects = {};
      medicationOrder.styleObjects.formattedDateWritten = CapacityUtils.formatDate(dateWritten, true);
      medicationOrder.styleObjects.isActive = medicationOrder.status === 'active';
      setMedicationStyleObjects(medicationOrder.includedObjects.medication);

      // Set formatted start date if there is one
      if (medicationOrder.dosageInstruction[0].timing && medicationOrder.dosageInstruction[0].timing.event) {  
        var roundedTimeString = CapacityUtils.roundTimeString(medicationOrder.dosageInstruction[0].timing.event[0]);
        medicationOrder.styleObjects.startTime = new Date(roundedTimeString);
      }

      if (!medicationOrder.dosageInstruction) {
        medicationOrder.dosageInstruction = [{}];
      }

      // Set dosetype
      if (medicationOrder.dosageInstruction[0].rateRatio) {
        medicationOrder.styleObjects.doseType = vm.medicationDoseTypes.rateRatio;
      } else if (medicationOrder.dosageInstruction[0].asNeededBoolean) {
        medicationOrder.styleObjects.doseType = vm.medicationDoseTypes.asNeededBoolean;
      } else if (medicationOrder.dosageInstruction[0].additionalInstructions) {
        medicationOrder.styleObjects.doseType = vm.medicationDoseTypes.additionalInstructions;
        setMedicationOrdinationTargetStyleObjects(medicationOrder);
      } else {
        medicationOrder.styleObjects.doseType = vm.medicationDoseTypes.timing;
      }
    }

    function setMedicationStyleObjects(medication) {
      medication.styleObjects = {};
      // Set additional information and standard dose for medications
      for (var i in medication.extension) {
        if (medication.extension[i].url.split('#')[1] === 'additionalInformation') {
          setAdditionalMedicationInformation(medication.extension[i].extension, medication);
        } else if (medication.extension[i].url.split('#')[1] === 'standardDose') { 
          setPredefinedMedicationOrder(medication.extension[i].extension, medication);
        }
      }
    }

    function setAdditionalMedicationInformation(extensionList, medication) {
      // Set concentration, preparation and side-effects for medication
      for (var i in extensionList) {
        if (extensionList[i].url === 'concentration') {
          medication.styleObjects.concentration = extensionList[i].valueRatio;
        } else if (extensionList[i].url === 'preparation') {
          medication.styleObjects.preparation = extensionList[i].valueString;
        } else if (extensionList[i].url === 'sideEffects') {
          medication.styleObjects.sideEffects = getSideEffectList(extensionList[i].extension);
        }
      }
    }

    function setPredefinedMedicationOrder(extensionList, medication) {
      // Set standarddose for medication
      medication.styleObjects.standardDose = { doseType: '', dosageInstruction: {} };
      for (var i in extensionList) {
        if (extensionList[i].url === 'doseType') {
          medication.styleObjects.standardDose.doseType = extensionList[i].valueString;
        } else {
          setPredefinedMedicationOrderDose(extensionList[i], medication);
        }
      }
    }

    function setPredefinedMedicationOrderDose(list, medication) {
      // Set predefined dose for medication
      var key = '';
      var value = '';

      for (var i in list) {
        if (list.hasOwnProperty(i)) {
          if (i === 'url') { 
            key = list[i];
          } else {
            value = list[i];
          }
        }
      }
      medication.styleObjects.standardDose.dosageInstruction[key] = value;
    }
  

    function getSideEffectList(effectExtensionList) {
      // Set side effect list for medication
      var list = [];
      for (var i in effectExtensionList) {
        list.push(effectExtensionList[i].valueString);
      }
      return list;
    }

    function setMedicationOrdinationTargetStyleObjects(medicationOrder) { 
      // Set target styles if medication dose is target
      var code = medicationOrder.dosageInstruction[0].additionalInstructions.coding[0].code;
      var doseText = medicationOrder.dosageInstruction[0].additionalInstructions.text;
      medicationOrder.styleObjects.target = vm.targetParameterList[findTargetParameterIndex(code)];
      
      // Set target limits
      if (doseText) {
        var limits = doseText.split('-');
        medicationOrder.styleObjects.lowerOrdinationLimit = parseInt(limits[0]);
        medicationOrder.styleObjects.upperOrdinationLimit = parseInt(limits[1]);
      } else {
        medicationOrder.styleObjects.lowerOrdinationLimit = '';
        medicationOrder.styleObjects.upperOrdinationLimit = '';
      }

      if (medicationOrder.styleObjects.isActive) {
        // If medication order is active then add target medication ordination to config
        setOrdinationConfig(medicationOrder);
      }
    }

    function findTargetParameterIndex(code) {
      for (var i in vm.targetParameterList) {
        if (code === vm.targetParameterList[i].type.coding[0].code) {
          return i;
        }
      }
      return null;
    }

    function setOrdinationConfig(medicationOrder) {
      // Set target medication ordination to config
      var configOrdination = {
        medication: medicationOrder.includedObjects.medication.code.text,
        dose: medicationOrder.dosageInstruction[0].additionalInstructions.text,
        lowerOrdinationLimit: medicationOrder.styleObjects.lowerOrdinationLimit,
        upperOrdinationLimit: medicationOrder.styleObjects.upperOrdinationLimit
      };

      vm.config.parameterConfig[medicationOrder.styleObjects.target.type.coding[0].code].styleObjects.ordination = configOrdination;
      SharedConfig.set(vm.config);
    }

    function removeOrdinationConfig(medicationOrder) {
      delete vm.config.parameterConfig[medicationOrder.styleObjects.target.type.coding[0].code].styleObjects.ordination;
      SharedConfig.set(vm.config);
    }

    function removeMedicationFromFullList(medicationOrder) {
      for (var i in vm.fullMedicationList) {
        if (medicationOrder.includedObjects.medication.code.text === vm.fullMedicationList[i].code.text) {
          vm.fullMedicationList.splice(i, 1); 
          break; 
        }
      }
    }

    function getMedicationFromFullList(medicationId) {
      for (var i in vm.fullMedicationList) {
        if (vm.fullMedicationList[i].id === medicationId) {
          return vm.fullMedicationList[i]; 
        }
      }
    }

    // Accessible from the view
    function setupScopeFunctions() {
      vm.changeLocation = CapacityUtils.changeLocation;   
      vm.searchParameter = searchParameter;
      vm.addParameterOrder = addParameterOrder;      
      vm.deleteParameterOrder = deleteParameterOrder;
      vm.updateParameterOrder = updateParameterOrder;
      vm.searchMedication = searchMedication;
      vm.addMedicationOrder = addMedicationOrder;
      vm.addMedicationFromList = addMedicationFromList;
      vm.deleteMedicationOrder = deleteMedicationOrder;
      vm.changeOrdinationStatus = changeOrdinationStatus;
      vm.toggleDoseType = toggleDoseType;
      vm.toggleTarget = toggleTarget;
      vm.updateMedicationDose = updateMedicationDose;
      vm.sortMedicationOrders = sortMedicationOrders;
      vm.filterMedicationOrders = filterMedicationOrders;
      vm.removeMedicationFilters = removeMedicationFilters;
      vm.showMedicationObservationModal = showMedicationObservationModal;
    }

    function searchParameter() {
      // Pattern matching for parameter typeahead 
      var parameterList = [];
      angular.forEach(vm.remainingParameterList, function(item, key) {
        var searchString = item.type.text + ' (' + item.type.coding[0].display + ')';
        if(searchString.toUpperCase().indexOf(vm.parameterSearchField.toUpperCase()) >= 0) {
          item.index = key;
          parameterList.push(item);
        }
      });
      return parameterList;
    }

    function addParameterOrder(parameter) {
      vm.parameterSearchField = '';
      createParameterOrder(parameter.id);
    }

    function createParameterOrder(parameterId) {
      var date = new Date();
      CareCaseData.createOrder(
        'Patient/' + vm.config.patient.id, 
        'Practitioner/' + vm.config.practitioner.id,
        'DeviceMetric/' + parameterId, 
        date 
      ).then(function() {
        fetchAllParameterOrders();
      });
    }

    function deleteParameterOrder(parameterOrder) {
      CareCaseData.deleteOrder(parameterOrder.id).then(function() {
        vm.shownParameterOrderList = CapacityUtils.getListWithoutRemovedElement(vm.shownParameterOrderList, parameterOrder);
        delete vm.config.parameterConfig[parameterOrder.includedObjects.parameter.type.coding[0].code];
        vm.remainingParameterList.push(parameterOrder.includedObjects.parameter);
        fetchAllParameterOrders();
      });
    }

    function updateParameterOrder(parameterOrder) { 
      ParameterConfig.updateParameterOrderExtensionStyleObjects(parameterOrder);
      CareCaseData.updateOrder(parameterOrder);
    }

    function searchMedication() {
      // Pattern matching for medication typeahead 
      var medicationList = [];
      angular.forEach(vm.fullMedicationList, function(item, key) {
        if(item.code.text.toUpperCase().indexOf(vm.medicationSearchField.toUpperCase()) >= 0) {
          item.index = key;
          medicationList.push(item);
        }
      });
      return medicationList;
    }
    
    function addMedicationOrder(medication) {
      vm.medicationSearchField = '';
      createMedicationOrder(medication.id);
    }

    function addMedicationFromList() {
      vm.showMedicationModal = false;
      document.body.style.overflow = 'visible';

      // Add all selected medications in modal grid
      if (vm.modalGridSelectionList && vm.modalGridSelectionList[0].type === vm.itemListNames.medication) {
        for (var i in vm.modalGridSelectionList) {
          var medication = vm.modalGridSelectionList[i].object;
          if (medication.styleObjects.standardDose) {
            createMedicationOrder(medication.id, medication.styleObjects.standardDose.dosageInstruction);
          } else {
            createMedicationOrder(medication.id);
          }
        }
      }
    }

    function createMedicationOrder(medicationId, preDefinedDose) {
      var date = new Date();
      var dose; 

      if (preDefinedDose) {
        dose = preDefinedDose;
      } else {
        dose = DefaultMedicationDoses.getDefaultTimeIntervalDose();
      }

      CareCaseData.createMedicationOrder(
        'Patient/' + vm.config.patient.id, 
        'Practitioner/' + vm.config.practitioner.id,
        'Medication/' + medicationId, 
        date,
        dose
      ).then(function() {
        fetchAllMedicationOrders();
      });
    }

    function deleteMedicationOrder(medicationOrder) {
      CareCaseData.deleteMedicationOrder(medicationOrder.id).then(function() {
        vm.shownMedicationOrderList = CapacityUtils.getListWithoutRemovedElement(vm.shownMedicationOrderList, medicationOrder);
        delete vm.fullMedicationOrderObject[medicationOrder.id];
        vm.fullMedicationList.push(medicationOrder.includedObjects.medication);
        fetchAllMedicationOrders();
      });
    }

    function changeOrdinationStatus(order) {
      if (order.styleObjects.isActive) {
        startOrdination(order);
      } else {
        stopOrdination(order);
      }
    }

    function startOrdination(medicationOrder) {
      if (medicationOrder.styleObjects.startTime) {
        // Start ordination if there is a starttime
        medicationOrder.styleObjects.startTimeIsMissing = false;
        medicationOrder.styleObjects.isActive = true;
        medicationOrder.status = 'active';

        // Update medication dose data
        updateMedicationDoseData(medicationOrder);
        CareCaseData.updateMedicationOrder(medicationOrder);

        // Set medication ordination to config if target dose 
        if (medicationOrder.styleObjects.doseType.parameter === 'additionalInstructions') {
          setOrdinationConfig(medicationOrder);
        }
      } else {
        medicationOrder.styleObjects.isActive = false;
        medicationOrder.styleObjects.startTimeIsMissing = true;
      }
    }

    function stopOrdination(medicationOrder) {
      medicationOrder.status = 'stopped';
      medicationOrder.styleObjects.isActive = false;
      
      // Update medication dose data
      updateMedicationDoseData(medicationOrder);

      CareCaseData.updateMedicationOrder(medicationOrder);
      
      // Remove medication ordination from config if target dose 
      if (medicationOrder.styleObjects.target) {
        removeOrdinationConfig(medicationOrder);
      }
    }

    function toggleDoseType(medicationOrder) {
      // Toggle dose type for  medication order
      var doseList = CapacityUtils.getArrayFromObject(vm.medicationDoseTypes);
      var oldIndex = doseList.indexOf(medicationOrder.styleObjects.doseType);
      
      medicationOrder.styleObjects.doseType = doseList[(oldIndex + 1) % doseList.length];
      medicationOrder.dosageInstruction[0] = getDefaultDoseType(medicationOrder);
      
      // Set target style objects if target dose
      if (medicationOrder.styleObjects.doseType.parameter === 'additionalInstructions') {
        setMedicationOrdinationTargetStyleObjects(medicationOrder);
      }
      updateMedicationDose(medicationOrder);
    }

    function getDefaultDoseType(medicationOrder) {
      var doseTypeParameter = medicationOrder.styleObjects.doseType.parameter;
      if (doseTypeParameter === 'rateRatio') {
        return DefaultMedicationDoses.getDefaultInfusionDose();        
      } else if (doseTypeParameter === 'timing') {
        return DefaultMedicationDoses.getDefaultTimeIntervalDose();        
      } else if (doseTypeParameter === 'asNeededBoolean') {
        return DefaultMedicationDoses.getDefaultAsNeededDose();        
      } else if (doseTypeParameter === 'additionalInstructions') {
        return DefaultMedicationDoses.getDefaultTargetDose(vm.targetParameterList[0].type.coding[0].code, vm.targetParameterList[0].type.coding[0].display);
      }    
    }

    function toggleTarget(medicationOrder) {
      if (medicationOrder.styleObjects.isActive) { 
        // Stop ordination if it is active because changes were made
        stopOrdination(medicationOrder); 
      } 

      // Toggle target parameter
      var oldIndex = findTargetParameterIndex(medicationOrder.styleObjects.target.type.coding[0].code);
      medicationOrder.styleObjects.target = vm.targetParameterList[(parseInt(oldIndex) + 1) % vm.targetParameterList.length];

      // Update medication order
      updateMedicationDoseData(medicationOrder);
      CareCaseData.updateMedicationOrder(medicationOrder);
    }

    function updateMedicationDose(medicationOrder) { 
      if (medicationOrder.styleObjects.isActive) { 
        // Stop ordination if it is active because changes were made
        stopOrdination(medicationOrder); 
      } else {
        // Update medication order with new dose
        updateMedicationDoseData(medicationOrder);
        CareCaseData.updateMedicationOrder(medicationOrder);
      }
    }

    function updateMedicationDoseData(medicationOrder) {
      DefaultMedicationDoses.setEmptyDoseValuesToDefault(medicationOrder);
      if (medicationOrder.styleObjects.doseType.parameter === 'additionalInstructions') {
        updateMedicationTargetDose(medicationOrder);
      }
      if (medicationOrder.styleObjects.startTime) {
        updateMedicationStartTime(medicationOrder);
      }
    }

    function updateMedicationTargetDose(medicationOrder) {
      var targetText = medicationOrder.styleObjects.lowerOrdinationLimit + '-' + medicationOrder.styleObjects.upperOrdinationLimit;
      medicationOrder.dosageInstruction[0].additionalInstructions.text = targetText;
      medicationOrder.dosageInstruction[0].additionalInstructions.coding = [medicationOrder.styleObjects.target.type.coding[0]];
    }

    function updateMedicationStartTime(medicationOrder) {
      if (!medicationOrder.dosageInstruction[0].timing) { 
        medicationOrder.dosageInstruction[0].timing = {};
      }
      medicationOrder.dosageInstruction[0].timing.event = medicationOrder.styleObjects.startTime.toISOString();
    }

    function sortMedicationOrders(sortField, reverseOrder) {
      vm.shownMedicationOrderList = $filter('orderBy')(vm.shownMedicationOrderList, sortField, reverseOrder);
    }

    function filterMedicationOrders(filterField, value) {
      // Show medication orders depending on filter options
      vm.shownMedicationOrderList = [];
      var parameterLevels = filterField.split('.');

      for (var i in vm.fullMedicationOrderList) {
        var filterParameter = vm.fullMedicationOrderList[i].styleObjects;
        for (var levelNumber in parameterLevels) {
          filterParameter = filterParameter[parameterLevels[levelNumber]];
        }

        if (filterParameter === value) {
          vm.shownMedicationOrderList.push(vm.fullMedicationOrderList[i]);
        }
      }
    }

    function removeMedicationFilters() {
      // Remove all filters and show all medication orders
      vm.shownMedicationOrderList = vm.fullMedicationOrderList;
    }

    function showMedicationObservationModal() {
      // Show modal of predefined medication orders for department
      vm.itemList = getMedicationGridData(vm.standardMedicationList);
      setModalGridSettings();
      vm.showMedicationModal = true;
      document.body.style.overflow = 'hidden';       
    }

    function getMedicationGridData(medicationList) {
      var itemList = [];
      for (var i in medicationList) {
        itemList.push({
          name: medicationList[i].code.text,
          type: vm.itemListNames.medication,
          object: medicationList[i]
        });
      }
      return itemList;
    }

    function setModalGridSettings() {
      // Define settings for modal grid
      var minRows = Math.min(vm.itemList.length, vm.modalGridMaxRows);
      vm.modalGridSettings = {
        enableRowSelection: true,
        enableFullRowSelection: true,
        enableRowHeaderSelection: false,
        data: vm.itemList,
        rowHeight: 40,
        minRowsToShow: minRows,
        columnDefs: [
          {field: 'name', displayName: vm.listCategoryName, enableCellEdit: false}
        ]
     };

      vm.modalGridSettings.onRegisterApi = function(gridApi){
        vm.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope, function () {
          vm.modalGridSelectionList = gridApi.selection.getSelectedRows();
        });
      };
    }
  }
})();
