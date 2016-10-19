
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:SbarCtrl
 * @description
 * # SbarCtrl
 * Controller of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('SbarCtrl', SbarCtrl);

  SbarCtrl.$inject = ['$scope', '$filter', '$location', '$q', 'CapacityUtils', 'SharedConfig', 'CareCaseData', 'ParameterData', 'ActiveDataSource', 'DefaultParameters', 'EncounterFilters'];

  function SbarCtrl($scope, $filter, $location, $q, CapacityUtils, SharedConfig, CareCaseData, ParameterData, ActiveDataSource, DefaultParameters, EncounterFilters) {
    var  vm = this;
    init();

    function init() {
      vm.config = SharedConfig.get();

      initVariables();
      setDataFromConfig();
      fetchPatientCareCase();
      createPatientCurrentStatus();
      fetchAllMedication();
      fetchAllIcdCodes();
      setupScopeFunctions();
    }

    function initVariables() {
      initCareCaseInformationLists();
      vm.checkboxCompleted = 0;
      vm.checkboxRemaining = 100;
      vm.showModal = false;
      vm.allChecked = false;
      vm.isRequester = false;
      vm.isRecipient = false;
      vm.recommendationNotes = '';
      vm.annotations = {};
      vm.aModeList = {
        organ: 'organ',
        abc: 'abc'
      };
      vm.aMode = vm.aModeList.organ;
    }

    function initCareCaseInformationLists() {
      vm.patientInformation = [];
      vm.patientRelativesInformation = [];
      vm.patientCareGiverInformation = [];
      vm.patientStatusInformation = [];
      vm.patientContactReasonInformation = [];
      vm.allCompletedEncounters = [];
      vm.shownCompletedEncounters = [];
      vm.shownPlannedEncounters = [];
      vm.questionnaireResponses = [];
      vm.allMedicationList = [];
      vm.allIcdCodeList = [];
      vm.medicationList = [];
      vm.icdCodeList = [];
    }

    function setDataFromConfig() {
      // Set care case data from config
      if (vm.config.episode.includedObjects.condition) { 
        addToInformationList(vm.patientContactReasonInformation, 'Contact reason', vm.config.episode.includedObjects.condition.code.coding[0].display);
      }
      addToInformationList(vm.patientCareGiverInformation, vm.config.careManager.practitionerRole[0].role.coding[0].display, vm.config.careManager.name.text);
      addToInformationList(vm.patientCareGiverInformation, 'Department', vm.config.managingOrganization.name);
      setPatient();
    }

    function addToInformationList(informationList, label, value) {
      // Add data to informationlist shown in the view
      informationList.push({
        label: CapacityUtils.capitalizeFirstLetter(label) + ': ', 
        value: value
      });
    }

    function setPatient() {
      // Set specific patient information
      setPatientRelativesContent(vm.config.patient.contact);
      var gender = vm.config.patient.gender ? CapacityUtils.capitalizeFirstLetter(vm.config.patient.gender) : 'Not specified';
      vm.patientInformation = [
        {label: 'Name: ', value: vm.config.patient.name[0].text},
        {label: 'SSN: ', value: vm.config.patient.id}, 
        {label: 'Gender: ', value: gender},
        {label: 'Age: ', value: CapacityUtils.calculateAge(vm.config.patient.id)}   
      ]; 
    }

    function setPatientRelativesContent(relatives) {
      for (var i in relatives) {
        vm.patientRelativesInformation.push({
          label: relatives[i].name.text + ':',
          value: relatives[i].telecom[0].value
        });
      }
    }

    function fetchPatientCareCase() {
      // Fetch data from current episode of care
      var episodeReference = 'EpisodeOfCare/' + vm.config.episode.id;
      var includeList = ['Encounter:practitioner', 'Encounter:-service-provider', 'Encounter:incomingreferral'];
      CareCaseData.getEpisodeEncounters(episodeReference, '', includeList).then(function(result) {
        updateEncounterInformation(result[0], result[1]);
      });
    }

    function updateEncounterInformation(encounters) {
      vm.allEncounters =  $filter('orderBy')(encounters, 'start', true); 
      vm.allCompletedEncounters = [];
      vm.allPlannedEncounters = [];

      // Sort encounters depending on if they are completed, current, next or planned
      for (var i = 0; i < vm.allEncounters.length; i++) {
        switch (vm.allEncounters[i].status) {
          case 'finished':
            vm.allCompletedEncounters.push(vm.allEncounters[i]);
            break;
          case 'in-progress':
            vm.currentEncounter = vm.allEncounters[i]; 
            if(vm.currentEncounter.includedObjects.sentReferral) { 
              vm.recommendationNotes = vm.currentEncounter.includedObjects.sentReferral.description;
            }
            break;
          case 'arrived':
            vm.nextEncounter = vm.allEncounters[i];
            break;
          case 'planned':
            vm.allPlannedEncounters.push(vm.allEncounters[i]);
            break;
          default:
            console.log('No data was used from encounter with status ' + vm.allEncounters[i].status);
        }
      }
      // Add information about current and next encounter for the view
      addSituationStatusInformation();

      // Update completed and planned encounter list for the view
      updateEncounterList(vm.shownCompletedEncounters, vm.allCompletedEncounters);   
      updateEncounterList(vm.shownPlannedEncounters, vm.allPlannedEncounters); 

      // Fetch questionnaire data for all encounters
      fetchQuestionnaireResponseData(vm.allEncounters);

      // Create filters for completed encounters
      createAnnotationFilters(vm.shownCompletedEncounters);
    }

    function addSituationStatusInformation() {
      addToInformationList(vm.patientStatusInformation, 'Current', vm.currentEncounter.type[0].text);

      if (vm.nextEncounter) {
        addToInformationList(vm.patientStatusInformation, 'Next', vm.nextEncounter.type[0].text);
      }  
    }

    function updateEncounterList(encounterList, statusEncounterList) {
      for (var i in statusEncounterList) {
        var start = new Date(statusEncounterList[i].period.start);
        var end = new Date(statusEncounterList[i].period.end);

        // Add style objects for view
        statusEncounterList[i].styleObjects = {};
        statusEncounterList[i].styleObjects.formattedStart = CapacityUtils.formatDate(start, true);
        statusEncounterList[i].styleObjects.formattedEnd = CapacityUtils.formatDate(end, true);

        // Add comment from the referral request that initiated the encounter
        if (statusEncounterList[i].includedObjects.sentReferral) {
          addReferralSupportingInformation(statusEncounterList[i].includedObjects.sentReferral);
        }
        encounterList.push(statusEncounterList[i]);
      }
    }

    function addReferralSupportingInformation(referralRequest) {
      // Get tags from referral request description
      var description = referralRequest.description ? referralRequest.description : '';
      var htmlTags = CapacityUtils.getHtmlTags(description);
      var tagList = [];

      for (var i in htmlTags) {
        var reference = CapacityUtils.getReferenceFromDomId(htmlTags[i].id);
        tagList.push({
          id: CapacityUtils.getReferenceId(reference),
          type: CapacityUtils.getReferenceResourceType(reference),
          display: htmlTags[i].value
        });
      }
      referralRequest.supportingInformation = tagList;
      referralRequest.description = description;
    }

    function fetchQuestionnaireResponseData(encounterList) {
      // Get data from questionnaire response
      var patientRef = 'Patient/' + vm.config.patient.id;
      CareCaseData.getCurrentQuestionnaireResponseForPatient(patientRef, encounterList).then(function(result) {
        if (result.length > 0) {
          var questionnaireResponse = result[0];
          questionnaireResponse.styleObjects = {};
          questionnaireResponse.includedObjects = {encounter: result[1]};

          var start = new Date(questionnaireResponse.includedObjects.encounter.period.start);
          questionnaireResponse.styleObjects.formattedStart = CapacityUtils.formatDate(start, true);

          for (var i in result[0].group.group) {
            var questionGroup = result[0].group.group[i]; 
            if (questionGroup.linkId === 'overallAssessment') {
              questionnaireResponse.styleObjects.overallAssessment = questionGroup.question[0].answer[0].valueString;
            } 
          }
          vm.questionnaireResponses.push(questionnaireResponse);
        } 
      });
    }

    function createAnnotationFilters(encounterList) {
      // Create filters for completed enconuters
      var filters = { organization: {}, medication: {}, icd: {}};
      var organizationList = EncounterFilters.getOrganizationFilter(encounterList, filters.organization);
      var medicationList = EncounterFilters.getMedicationFilter(encounterList, filters.medication);
      var icdList = EncounterFilters.getIcdFilter(encounterList, filters.icd);

      vm.organizationFilter = {id: 'all', name: '- All organizations -' };
      vm.medicationFilter = {id: 'all', name: '- All medications -' };
      vm.icdFilter = {id: 'all', name: '- All ICD\'s -' };

      organizationList.push({id: 'all', name: '- All organizations -' });
      medicationList.push({id: 'all', name: '- All medications -' });
      icdList.push({id: 'all', name: '- All ICD\'s -' });

      vm.allInvolvedOrganizations = $filter('orderBy')(organizationList, 'name', false); 
      vm.allInvolvedMedications = $filter('orderBy')(medicationList, 'name', false); 
      vm.allInvolvedIcds = $filter('orderBy')(icdList, 'name', false); 
    }

    function createPatientCurrentStatus() {
      // Create content in A-box
      createPatientVitalParameterStatusInformation();
      setTemperatureData();
      fetchOrdinationData();
    }

    function setTemperatureData() {
      vm.dataSource = ActiveDataSource.getDataSources();
      vm.activeDataSource = {};
      vm.activeDataSource[DefaultParameters.temperature.code] = ActiveDataSource.getDefaultDataSource();
      
      vm.noSignal = {};
      vm.noSignal[DefaultParameters.temperature.code] = false;

      // Temperature parameter
      var allOtherParameters = ParameterData.getParameterObject(vm.config, 'other', vm.cachedValuesSize);
      vm.temperatureParameters = {};
      vm.temperatureParameters[DefaultParameters.temperature.code] = allOtherParameters[DefaultParameters.temperature.code];

      var startDate = new Date(); 
      startDate.setTime(startDate.getTime() - 30 * 1000);
      ParameterData.updateObservationData(vm.temperatureParameters, vm.config, vm.activeDataSource, vm.noSignal, '>=' + startDate.toISOString(), 0);
    }

    function fetchOrdinationData() {
      // Get data from active ordinations and link to ordination view
      var patientRef = 'Patient/' + vm.config.patient.id;
      CareCaseData.getMedicationOrders(patientRef, []).then(function(result) {
        var nOrderedParameters = Object.keys(vm.config.parameterConfig).length;
        var nOrderedMedications = result.length;

        createPatientAdditionalStatusInformation(nOrderedParameters, nOrderedMedications);
      });
    }

    function createPatientVitalParameterStatusInformation() {
      // Check if there are annotations from the latest time interval and display a link if there are
      displayPatientVitalParameterStatusInformation();
      var index = getCirculationIndex();

      ParameterData.setNoCirculationAnnotations(
        vm.config.patient.id,
        vm.config.generalConfig.defaultCirculationParameters, 
        vm.config.generalConfig.defaultMillisecondTimeInterval,
        vm.patientVitalParameterInformation[index]
      );
    } 

    function getCirculationIndex() {
      for (var i in vm.patientVitalParameterInformation) {
        if (vm.patientVitalParameterInformation[i].longLabel === 'Circulation') {
          return i;
        }
      }
    }

    function displayPatientVitalParameterStatusInformation() {
      // Set ABC list for nurses or Organ list for doctors
      if (vm.config.practitioner.practitionerRole[0].role.coding[0].display === 'Doctor') {
        vm.aMode = vm.aModeList.organ;
        createPatientOrganInformation();
      } else {
        vm.aMode = vm.aModeList.abc;
        createPatientAbcInformation();
      }
    } 

    // Temporary dummy data, will be developed in the future 
    function createPatientAbcInformation() {
      vm.patientVitalParameterInformation = [];
      vm.patientVitalParameterInformation.push(getDefaultAbcRow('A', 'Airways'));
      vm.patientVitalParameterInformation.push(getDefaultAbcRow('B', 'Breathing'));
      vm.patientVitalParameterInformation.push(getDefaultAbcRow('C', 'Circulation'));
      vm.patientVitalParameterInformation.push(getDefaultAbcRow('D', 'Disability'));
      vm.patientVitalParameterInformation.push(getDefaultAbcRow('E', 'Exposure'));
    } 

    function getDefaultAbcRow(shortLabel, longLabel) {
      return {
        shortLabel: shortLabel,
        longLabel: longLabel,
        noCirculationAnnotations: 0,
        link: 'history'
      };
    }

    // Temporary dummy data, will be developed in the future 
    function createPatientOrganInformation() {
      vm.patientVitalParameterInformation = [];
      vm.patientVitalParameterInformation.push(getDefaultOrganRow('/images/organs/neurology.png', 'Neurology'));
      vm.patientVitalParameterInformation.push(getDefaultOrganRow('/images/organs/circulation.png', 'Circulation'));
      vm.patientVitalParameterInformation.push(getDefaultOrganRow('/images/organs/respiration.png', 'Respiration'));
      vm.patientVitalParameterInformation.push(getDefaultOrganRow('/images/organs/urology.png', 'Urology'));
      vm.patientVitalParameterInformation.push(getDefaultOrganRow('/images/organs/gastro.png', 'Gastro'));
      vm.patientVitalParameterInformation.push(getDefaultOrganRow('/images/organs/infection.png', 'Infection'));
    } 

    function getDefaultOrganRow(imageUrl, longLabel) {
      return {
        imageUrl: imageUrl,
        longLabel: longLabel,
        noCirculationAnnotations: 0,
        link: 'history'
      };
    }

    // Temporary dummy data, will be developed in the future 
    function createPatientBasicStatusInformation() {
      // Set dummy data for all patients
      var height = 182;
      var weight = 84; 

      // Get temperature for given patient
      var temperature =  vm.temperatureParameters[DefaultParameters.temperature.code].data.primaryData.observations[0].resource.valueQuantity.value;

      vm.patientBasicStatusInformation = [
        {
          label: 'Temperature',
          note: Math.round(temperature) + '\u00B0 C'
        }, 
        {
          label: 'Height',
          note: height + ' cm'
        },  
        {
          label: 'Weight',
          note: weight + ' kg'
        }     
      ];
    } 

    // Temporary dummy data, will be developed in the future 
    function createPatientAdditionalStatusInformation(nOrderedParameters, nOrderedMedications) {
      // Set correct ending depending on number of orders
      var parameterOrderString = nOrderedParameters === 1 ? 'order' : 'orders';
      var medicationOrderString = nOrderedMedications === 1 ? 'order' : 'orders';

      vm.patientAdditionalStatusInformation = [
        {
          label: 'Parameters',
          note: nOrderedParameters + ' ' + parameterOrderString,
          link: 'ordination' 
        },
        {
          label: 'Medications',
          note: nOrderedMedications + ' ' + medicationOrderString,
          link: 'ordination'
        },
        {
          label: 'Liquid balance',
          note: '-400'
        },
        {
          label: 'Wound treatment',
          note: 'no'
        },  
        {
          label: 'Infection',
          note: 'no'
        }
      ];
    }

    function fetchAllMedication() {
      // Fetch all medication for typeahead field in R-box
      CareCaseData.getAllMedication().then(function(result) {
        vm.allMedicationList = result;
      });
    }

    function fetchAllIcdCodes() {
      // Fetch all ICD-codes for typeahead field in R-box
      CareCaseData.getAllIcdCodes().then(function(result) {
        vm.allIcdCodeList = result;
      });
    }

    function setupScopeFunctions() {
      // Accessible from the view
      vm.changeLocation = CapacityUtils.changeLocation; 
      vm.updateRecommendationNotes = updateRecommendationNotes;
      vm.countCheckboxProgress = countCheckboxProgress;
      vm.completeSbar = completeSbar;
      vm.checkAllInSituationBox = checkAllInSituationBox;
      vm.checkAllInBackgroundBox = checkAllInBackgroundBox;
      vm.checkAllInAssessmentBox = checkAllInAssessmentBox;
      vm.checkAllInRecommendationBox = checkAllInRecommendationBox;
      vm.searchMedication = searchMedication;
      vm.searchIcdCode = searchIcdCode;
      vm.getMedication = getMedication;
      vm.getIcdCode = getIcdCode;
      vm.updateShownCompletedEncounters = updateShownCompletedEncounters;
    }

    function searchMedication(term) {
      // Patternmatching for typeahead
      var medicationList = [];
      angular.forEach(vm.allMedicationList, function(item, key) {
        if(item.code.text.toUpperCase().indexOf(term.toUpperCase()) >= 0){
          item.index = key;
          medicationList.push(item);
        }
      });
      vm.medicationList = medicationList;
      return medicationList;
    }

    function searchIcdCode(term) {
      // Patternmatching for typeahead
      var icdCodeList = [];
      angular.forEach(vm.allIcdCodeList, function(item, key) {
        if(item.definition.toUpperCase().indexOf(term.toUpperCase()) >= 0){
          item.index = key;
          icdCodeList.push(item);
        }
      });
      vm.icdCodeList = icdCodeList;
      return icdCodeList;
    }

    function getMedication(item) {
      return getAnnotation(item.id, 'Medication', item.code.text);
    }

    function getIcdCode(item) {
      return getAnnotation(item.code, 'ICD', item.definition);
    }

    function getAnnotation(id, key, label) {
      return '<input id="' + key + '-' + id + '" style="padding:0 !important" type="button" disabled="disabled" class="annotation annotation-text ' + key + '-annotation" +  value="' + label + '"></button>';
    }

    function updateRecommendationNotes() {
      vm.config.referralRequest.description = CapacityUtils.replaceHtmlSpaces(vm.recommendationNotes); 
      CareCaseData.updateReferralRequest(vm.config.referralRequest);
    }

    function updateShownCompletedEncounters() {
      // Show completed encounters depending on filter options
      var encounters = vm.allCompletedEncounters;
      if (vm.organizationFilter.id !== 'all') {
        encounters = $filter('filter')(vm.allCompletedEncounters, {includedObjects: {serviceProvider: {id: vm.organizationFilter.id}}}, true);
      }
      if (vm.medicationFilter.id !== 'all') {
        encounters = filterBySupportingInformation(encounters, vm.medicationFilter.id);
      }
      if (vm.icdFilter.id !== 'all') {
        encounters = filterBySupportingInformation(encounters, vm.icdFilter.id);
      }
      vm.shownCompletedEncounters = [];
      updateEncounterList(vm.shownCompletedEncounters, encounters);
    } 

    function filterBySupportingInformation(encounters, filterId) {
      // Return completed encounters that has supporting information with filterId
      var filteredEncounters = [];
      for (var i in encounters) {
        if (encounters[i].includedObjects.sentReferral) {
          for (var j in encounters[i].includedObjects.sentReferral.supportingInformation) {
            if (encounters[i].includedObjects.sentReferral.supportingInformation[j].id === filterId) {
              filteredEncounters.push(encounters[i]);
            }
          }
        }
      }
      return filteredEncounters;
    }

    function checkAllInSituationBox() {
      // Check progress in S-box
      checkAllInList(vm.patientInformation, vm.sProgress.allChecked);
      checkAllInList(vm.patientRelativesInformation, vm.sProgress.allChecked);
      checkAllInList(vm.patientCareGiverInformation, vm.sProgress.allChecked);
      checkAllInList(vm.patientStatusInformation, vm.sProgress.allChecked);
      checkAllInList(vm.patientContactReasonInformation, vm.sProgress.allChecked);
      countCheckboxProgress();
    }

    function checkAllInBackgroundBox() {
      // Check progress in B-box
      checkAllInList(vm.shownCompletedEncounters, vm.bProgress.allChecked);
      checkAllInList(vm.questionnaireResponses, vm.bProgress.allChecked);
      countCheckboxProgress();
    }

    function checkAllInAssessmentBox() {
      // Check progress in A-box
      checkAllInList(vm.patientVitalParameterInformation, vm.aProgress.allChecked);
      checkAllInList(vm.patientBasicStatusInformation, vm.aProgress.allChecked);
      checkAllInList(vm.patientAdditionalStatusInformation, vm.aProgress.allChecked);
      countCheckboxProgress();
    }

    function checkAllInRecommendationBox() {
      // Check progress in R-box
      checkAllInList(vm.shownPlannedEncounters, vm.rProgress.allChecked);
      countCheckboxProgress();
    }

    function checkAllInList(list, isChecked) {
      for (var i in list) {
        list[i].checked = isChecked; 
      }
    }

    function countCheckboxProgress() {
      var sList = vm.patientInformation
        .concat(vm.patientRelativesInformation)
        .concat(vm.patientCareGiverInformation)
        .concat(vm.patientStatusInformation)
        .concat(vm.patientContactReasonInformation);

      var bList = vm.shownCompletedEncounters
        .concat(vm.questionnaireResponses);

      var aList = vm.patientVitalParameterInformation
        .concat(vm.patientBasicStatusInformation)
        .concat(vm.patientAdditionalStatusInformation);

      vm.sProgress = getListProgress(sList);
      vm.bProgress = getListProgress(bList);
      vm.aProgress = getListProgress(aList);
      vm.rProgress = getListProgress(vm.shownPlannedEncounters);

      // Count total progress
      var nCheckedCheckboxes = vm.sProgress.nChecked + vm.bProgress.nChecked + vm.aProgress.nChecked + vm.rProgress.nChecked;
      var nCheckboxes = vm.sProgress.nCheckboxes + vm.bProgress.nCheckboxes + vm.aProgress.nCheckboxes + vm.rProgress.nCheckboxes; 

      vm.checkboxCompleted = (nCheckedCheckboxes/nCheckboxes) * 100;
      vm.checkboxRemaining = 100 - vm.checkboxCompleted;
      
      // Check if SBAR is complete
      checkIfCheckboxComplete();
    } 

    function getListProgress(list) {
       var nChecked = countCompletedCheckboxes(list);
       var allChecked = (nChecked === list.length);
       return { nChecked: nChecked, nCheckboxes: list.length, allChecked: allChecked };
    }

    function countCompletedCheckboxes(list) {
      var count = 0;
      angular.forEach(list, function(checkbox) {
        count += checkbox.checked ? 1 : 0;
      });
      return count;
    }

    function checkIfCheckboxComplete() {
      if (vm.checkboxCompleted === 100) { 
        // Show modal if all checkboxes are complete
        vm.allChecked = true;
        vm.showModal = true;
        angular.element(document).find('body').animate({ scrollTop: 0 }, 'slow');
      } else {
        vm.allChecked = false;
      }
    }   

    // When SBAR is complete
    function completeSbar() {
      vm.showModal = false;
      var currentDate = new Date().toISOString();
      var prom = [];

      // Update episode of care with new care manager and department
      vm.config.episode.careManager.reference = 'Practitioner/' + vm.config.referralRequest.includedObjects.recipient.id;
      vm.config.episode.managingOrganization.reference = 'Organization/' + vm.nextEncounter.includedObjects.serviceProvider.id;
      CareCaseData.updateEpisodeOfCare(vm.config.episode, prom);

      // Close current referralRequest
      var notes = vm.recommendationNotes ? CapacityUtils.replaceHtmlSpaces(vm.recommendationNotes) : 'No notes';
      vm.config.referralRequest.status = 'completed';
      vm.config.referralRequest.description = notes;
      CareCaseData.updateReferralRequest(vm.config.referralRequest, prom);
      
      // Close current encounter      
      vm.currentEncounter.period.end = currentDate;
      vm.currentEncounter.status = 'finished';
      CareCaseData.updateEncounter(vm.currentEncounter, prom);

      // Update status and start date on new encounter
      vm.nextEncounter.period.start = currentDate;
      vm.nextEncounter.status = 'in-progress';
      CareCaseData.updateEncounter(vm.nextEncounter,  prom);

      $q.all(prom).then(function () {
        vm.changeLocation('Start', vm.config);
      });
    }

    $scope.$watch('vm.tempData.primaryData', function () {
      createPatientBasicStatusInformation();
    }, true);

  }
})();
  