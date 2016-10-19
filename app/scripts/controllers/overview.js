
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:OverviewCtrl
 * @description
 * # OverviewCtrl
 * Controller of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('OverviewCtrl', OverviewCtrl);

  OverviewCtrl.$inject =  ['$scope', '$q', '$timeout', '$filter','SharedConfig', 'CapacityUtils', 'CareCaseData', 'ParameterConfig', 'ParameterData', '$window', 'fhirObservation', '$http'];

  function OverviewCtrl($scope, $q, $timeout, $filter, SharedConfig, CapacityUtils, CareCaseData, ParameterConfig, ParameterData, $window, fhirObservation, $http) {
    var vm = this;
    vm.config = SharedConfig.get();
    init();

    function init() {
      initVariables();
      setConfigData();
      setAllFormData();
      setupScopeFunctions();
    }

    function initVariables() {
      vm.fullPatientList = [];
      vm.fullPractitionerList = [];
      vm.fullOrganizationList = [];
      vm.managingOrganizationList = [];
      vm.careManagerList = [];
      vm.careTeamList = [];
      vm.fullEpisodeList = [];
      vm.shownEpisodeList = [];
      vm.currentPractitionerEpisodeList = [];
      vm.organizationPractitionerList = [];
      vm.allActiveReferralRequests = [];
      vm.appointmentList = [];
      vm.showSbarModal = false;
      vm.showAppointmentModal = false;
      setupSbarFormData();
      setupAppointmentFormData();
      vm.editActivePatients = false;
      vm.editScheduledPatients = false;
    }

    function setConfigData() {
      vm.currentPractitioner = vm.config.practitioner;
    }

    function setAllFormData() {
      CareCaseData.getAllPractitioners().then(function(result) {
        vm.fullPractitionerList = result;
      });

      CareCaseData.getAllOrganizations().then(function(result) {
        vm.fullOrganizationList = result;
      });

      fetchPlannedEncounters();
      fetchActiveReferralRequests();

      CareCaseData.getAllPatients().then(function(result) {
        vm.fullPatientList = result;
        fetchBookedAppointments();
        fetchActiveEpisodesForPractitioner();
        fetchAllActiveEpisodes();
      });
    }

    function fetchPlannedEncounters() {
      var includeList = ['Encounter:practitioner', 'Encounter:-service-provider'];
      CareCaseData.getEpisodeEncounters('', 'planned', includeList).then(function(result) {
        vm.allPlannedEncounterList = result[0];
      });
    }

    function fetchActiveReferralRequests() {
      var includeList = ['ReferralRequest:requester', 'ReferralRequest:recipient'];
      CareCaseData.getPatientReferralRequests('', 'active', includeList).then(function(result) {
        vm.allActiveReferralRequests = result;
      });
    }

    function fetchBookedAppointments() {
      var includeList = ['patient', 'practitioner'];
      CareCaseData.getAppointments('booked', includeList).then(function(result) {
         vm.appointmentList = [];
        for (var i in result) {
          var appointment = result[i];
          var start = new Date(appointment.start);

          // Set formated dates and short names for view
          appointment.styleObjects = {};
          appointment.styleObjects.startDate = CapacityUtils.formatDate(start, false);
          appointment.styleObjects.startTime = CapacityUtils.formatTime(start, false);

          appointment.styleObjects.shortPatientName = getShortName(appointment.includedObjects.patient.name[0].text);
          appointment.styleObjects.shortPrimaryPerformerName = getShortName(appointment.includedObjects.primaryPerformer.name.text);

          vm.appointmentList.push(appointment);
          removePatientFromList(appointment.includedObjects.patient.id);
        }
        vm.appointmentList = $filter('orderBy')(vm.appointmentList, 'start', false);

      });
    }

    function getShortName(name) {
      var names = name.split(' ');
      var shortLastName = names[1].charAt(0);
      return names[0] + ' ' + shortLastName + '.';
    }

    function removePatientFromList(id) {
      for (var i in vm.fullPatientList) {
        if (vm.fullPatientList[i].id === id) {
          vm.fullPatientList.splice(i, 1);
        }
      }
    }

    function fetchActiveEpisodesForPractitioner() {
      var includeList = ['EpisodeOfCare:care-manager', 'EpisodeOfCare:organization', 'EpisodeOfCare:patient', 'EpisodeOfCare:condition'];
      var activePractitioner = 'Practitioner/' + vm.config.practitioner.id;
      CareCaseData.getEpisodesForPractitioner(activePractitioner, 'active', includeList).then(function(result) {
        vm.currentPractitionerEpisodeList = result[0];
      });
    }

    function fetchAllActiveEpisodes() {
      var includeList = ['EpisodeOfCare:care-manager', 'organization', 'patient', 'condition'];
      CareCaseData.getEpisodesForPractitioner(null, 'active', includeList).then(function(result) {
        updateEpisodeList(result[0], result[1]);
      });
    }

    function updateEpisodeList(episodes, includeList) {
      for (var i in episodes) {

        // Set short names for view
        episodes[i].styleObjects = {};
        episodes[i].styleObjects.shortPatientName = getShortName(episodes[i].includedObjects.patient.name[0].text);
        episodes[i].styleObjects.shortCareManagerName = getShortName(episodes[i].includedObjects.careManager.name.text);

        setIfQuestionnaireResponseData(episodes[i]);
        setEpisodesAnnotationNotifications(episodes[i]);
        removePatientFromList(episodes[i].includedObjects.patient.id);
      }
      vm.fullEpisodeList = episodes;
      vm.shownEpisodeList = episodes;
      setEpisodeFilters(includeList);
    }

    function setIfQuestionnaireResponseData(episode) {
      var episodeRef = 'EpisodeOfCare/' + episode.id;

      // Get episode encounters to be able to get episode questionnaire responses
      CareCaseData.getEpisodeEncounters(episodeRef, '', []).then(function(result) {
        var patientRef = 'Patient/' + episode.includedObjects.patient.id;
        CareCaseData.getCurrentQuestionnaireResponseForPatient(patientRef, result[0]).then(function(result) {
          var hasQuestionnaire = (result.length > 0 && result[0].status === 'completed') ? true : false;
          episode.styleObjects.hasQuestionnaireResponseData = hasQuestionnaire;
        });
      });
    }

    function setEpisodesAnnotationNotifications(episode) {
      // Check if there are annotations from the latest time interval and display a notification if there are
      ParameterData.setNoCirculationAnnotations(
        CapacityUtils.getReferenceId(episode.patient.reference),
        vm.config.generalConfig.defaultCirculationParameters,
        vm.config.generalConfig.defaultMillisecondTimeInterval,
        episode.styleObjects
      );
    }

    function setEpisodeFilters(includeList) {
      // Set filters for active patients
      vm.managingOrganizationList = CapacityUtils.getArrayFromObject(includeList.Organization);
      vm.careManagerList = CapacityUtils.getArrayFromObject(includeList.Practitioner);
      vm.careTeamList = [];

      vm.managingOrganizationList.push({id: 'all', name: '- All service providers -' });
      vm.managingOrganizationFilter = {id: 'all', name: '- All service providers -' };

      vm.careManagerList.push({id: 'all', name: {text: '- All care managers -' }});
      vm.careManagerFilter = {id: 'all', name: {text: '- All care managers -' }};

      vm.careTeamList.push({id: 'all', name: '- All care teams -' });
      vm.careTeamList.push({id: 'current', name: 'Only my care teams' });
      vm.careTeamFilter = {id: 'all', name: '- All care teams -' };
    }

    function setupScopeFunctions() {
      // Accessible from the view
      vm.changeLocation = CapacityUtils.changeLocation;
      vm.updateShownEpisodes = updateShownEpisodes;
      vm.goToApp = goToApp;
      vm.checkSBAR = checkSBAR;
      vm.updateAvailablePractitionerList = updateAvailablePractitionerList;
      vm.createSBAR = createSBAR;
      vm.setupAppointmentModal = setupAppointmentModal;
      vm.searchPatient = searchPatient;
      vm.createAppointment = createAppointment;
      vm.cancelAppointment = cancelAppointment;
      vm.admitPatient = admitPatient;
      vm.dischargePatient = dischargePatient;
      vm.goToCDS = goToCDS;
      vm.fetchMEWS = fetchMEWS;
    }

    function updateShownEpisodes() {
      // Show active patients depending on filter options
      var episodes = vm.fullEpisodeList;
      if (vm.careTeamFilter.id !== 'all') {
        episodes = vm.currentPractitionerEpisodeList;
      }
      if (vm.managingOrganizationFilter.id !== 'all') {
        episodes = $filter('filter')(episodes, {includedObjects: {managingOrganization: {id: vm.managingOrganizationFilter.id}}}, true);
      }
      if (vm.careManagerFilter.id !== 'all') {
        episodes = $filter('filter')(episodes, {includedObjects: {careManager: {id: vm.careManagerFilter.id}}}, true);
      }
      vm.shownEpisodeList = episodes;
    }

    function goToApp(appName, episode) {
      var oldPatient = vm.config.patient;
      updateConfigEpisodeObjects(episode);

      // Update ordered parameter config if patient is changed
      if (Object.keys(vm.config.parameterConfig).length <=0 || oldPatient !== vm.config.patient) {
        ParameterConfig.getParameterConfig('Patient/' + vm.config.patient.id).then(function(result) {
          vm.config.parameterConfig = result;
          CapacityUtils.changeLocation(appName, vm.config);
        });
      } else {
        CapacityUtils.changeLocation(appName, vm.config);
      }
    }

    function checkSBAR(episode) {
      updateConfigEpisodeObjects(episode);
      updateActiveReferralRequestList(vm.config.patient.id);

      // Check if referralRequest exists or if it needs to be created;
      if (vm.activeReferralRequests.length > 0) {
        vm.config.referralRequest = vm.activeReferralRequests[0];
        goToApp('sbar', episode);
      } else {
        // Get needed information for SBAR-modal
        fetchOngoingEncounter();
        updatePlannedEncounterList();
        updateAvailablePractitionerList();
        setupSbarModal();
      }
    }

    function updateConfigEpisodeObjects(episode) {
      vm.config.episode = episode;
      vm.config.patient = episode.includedObjects.patient;
      vm.config.managingOrganization = episode.includedObjects.managingOrganization;
      vm.config.careManager = episode.includedObjects.careManager;
    }

    function updateActiveReferralRequestList(patientId) {
      vm.activeReferralRequests = [];
      for (var i in vm.allActiveReferralRequests) {
        if (CapacityUtils.getReferenceId(vm.allActiveReferralRequests[i].patient.reference) === patientId) {
          vm.activeReferralRequests.push(vm.allActiveReferralRequests[i]);
        }
      }
    }

    function setupSbarModal() {
      vm.showSbarModal = true;
      vm.showPlannedActivities = true;
      vm.showNewActivities = false;
      vm.completeButtonLabel = 'Transfer';
      setupSbarFormData();
      angular.element(document).find('body').animate({ scrollTop: 0 }, 'slow');
    }

    function setupSbarFormData() {
      vm.sbarFormData = {
        planned: {encounter: ''},
        new: {
          organization: vm.config.managingOrganization,
          recipient: '',
          activity: ''
        }
      };
    }

    function fetchOngoingEncounter() {
      var episodeReference = 'EpisodeOfCare/' + vm.config.episode.id;
      var includeList = ['Encounter:practitioner', 'Encounter:-service-provider'];
      CareCaseData.getEpisodeEncounters(episodeReference, 'in-progress', includeList).then(function(result) {
        vm.ongoingEncounter = result[0][0];
      });
    }

    function updatePlannedEncounterList() {
      vm.plannedEpisodeEncounterList = [];

      for (var i in vm.allPlannedEncounterList) {
        if (CapacityUtils.getReferenceId(vm.allPlannedEncounterList[i].patient.reference) === vm.config.patient.id) {
          vm.plannedEpisodeEncounterList.push(vm.allPlannedEncounterList[i]);
        }
      }
    }

    function updateAvailablePractitionerList() {
      vm.organizationPractitionerList = [];

      angular.forEach(vm.fullPractitionerList, function(practitioner) {
        if (practitioner.id !== vm.config.careManager.id) {
          var practitionerOrganization = CapacityUtils.getReferenceId(practitioner.practitionerRole[0].managingOrganization.reference);
          if (practitionerOrganization === vm.sbarFormData.new.organization.id) {
            vm.organizationPractitionerList.push(practitioner);
          }
        }
      });
    }

    function createSBAR() {
      vm.formDataIsMissing = checkFormData(vm.sbarFormData.planned);
      var newEpisodeTeamMember;

      // Create SBAR if no form data is missing
      if (vm.showPlannedActivities) {
        vm.formDataIsMissing = checkFormData(vm.sbarFormData.planned);
        if (!vm.formDataIsMissing) {
          newEpisodeTeamMember = vm.sbarFormData.planned.encounter.includedObjects.primaryPerformer;
        }
      } else {
        vm.formDataIsMissing = checkFormData(vm.sbarFormData.new);
        if (!vm.formDataIsMissing) {
          newEpisodeTeamMember = vm.sbarFormData.new.recipient;
        }
      }

      CareCaseData.addToEpisodeCareTeam(vm.config.episode, 'Practitioner/' + newEpisodeTeamMember.id);
      createReferralRequest(newEpisodeTeamMember);
    }

    function createReferralRequest(recipientObject) {
      // Create new referralrequest and set a reference to it in the next encounter
      CareCaseData.createReferralRequest(
        'Patient/' + vm.config.patient.id,
        vm.config.careManager,
        recipientObject,
        'Encounter/' + vm.ongoingEncounter.id,
        'active'
      ).then(function(result) {
        setEncounter(result[0]);
        vm.config.referralRequest = result[0];
        goToApp('sbar', vm.config.episode);
      });
    }

    function setEncounter(referralRequest) {
      if (vm.showPlannedActivities) {
        // If the next encounter was planned then update status
        vm.sbarFormData.planned.encounter.status = 'arrived';
        CareCaseData.updateEncounter(vm.sbarFormData.planned.encounter);
      } else {
        // If the next encounter was new then create this encounter
        CareCaseData.createEncounter(
          'EpisodeOfCare/' + vm.config.episode.id,
          'Patient/' + vm.config.patient.id,
          'Organization/' + vm.sbarFormData.new.organization.id,
          'Practitioner/' + vm.sbarFormData.new.recipient.id,
          vm.sbarFormData.new.activity,
          'arrived',
          'ReferralRequest/' + referralRequest.id,
          null
        );
      }
    }

    function setupAppointmentModal() {
      vm.showAppointmentModal = true;
      vm.formDataIsMissing = false;
      vm.invalidPatient = false;
      setupAppointmentFormData();
    }

    function setupAppointmentFormData() {
      var startDate = new Date(CapacityUtils.roundTimeString(new Date().toISOString()));
      var endDate = new Date(startDate.getTime() + (24 * 3600 * 1000));

      vm.appointmentFormData = {
        description: '',
        patient: '',
        practitioner: vm.config.practitioner,
        startDate: startDate,
        endDate: endDate,
        startTime: angular.copy(startDate),
        endTime: angular.copy(endDate)
      };
    }

    function searchPatient() {
      // For patient typeahead in appointment modal
      var patientList = [];
      angular.forEach(vm.fullPatientList, function(item, key) {
        var searchString = item.name[0].text + ' (' + item.id + ')';
        if(searchString.toUpperCase().indexOf(vm.appointmentFormData.patient.toUpperCase()) >= 0) {
          item.index = key;
          patientList.push(item);
        }
      });
      return patientList;
    }

    function createAppointment() {
      // Create a new appointment if no form data is missing
      vm.formDataIsMissing = checkFormData(vm.appointmentFormData);
      if (!vm.formDataIsMissing) {

        // Get patient name and id from typeahead format 'Name (id)'
        var patientString = vm.appointmentFormData.patient;
        var breakPoint = patientString.indexOf('(');
        if (breakPoint >= 0) {
          vm.showAppointmentModal = false;
          vm.invalidPatient = false;
          var patientId = patientString.substring(breakPoint + 1, patientString.length-1);
          var patientName = patientString.substring(0, breakPoint-1);

          setTimeOnDate(vm.appointmentFormData.startDate, vm.appointmentFormData.startTime);
          setTimeOnDate(vm.appointmentFormData.endDate, vm.appointmentFormData.endTime);

          CareCaseData.createAppointment(
            vm.appointmentFormData.startDate,
            vm.appointmentFormData.endDate,
            'Practitioner/' + vm.appointmentFormData.practitioner.id,
            vm.appointmentFormData.practitioner.name.text,
            'Patient/' + patientId,
            patientName,
            vm.appointmentFormData.description
          ).then(function() {
            // Update all appointments
            fetchBookedAppointments();
          });
        } else {
          vm.invalidPatient = true;
        }
      }
    }

    function setTimeOnDate(dateObject, timeObject) {
      // Set time from timeObject on dateObject
      dateObject.setHours(timeObject.getHours());
      dateObject.setMinutes(timeObject.getMinutes());
    }

    function checkFormData(formData) {
      // Check if all form data have a value
      var dataIsMissing = false;
      for (var i in formData) {
        if (formData.hasOwnProperty(i)) {
          if (!formData[i] || formData[i] === '') {
            dataIsMissing = true;
          }
        }
      }
      return dataIsMissing;
    }

    function cancelAppointment(appointment) {
      // Remove from view
      vm.appointmentList = CapacityUtils.getListWithoutRemovedElement(vm.appointmentList, appointment);

      // If it was the last appointment in list, close edit mode
      if (vm.appointmentList.length <= 0) {
        vm.editScheduledPatients = false;
      }

      // Close appointment
      appointment.status = 'cancelled';
      CareCaseData.updateAppointment(appointment).then(function() {
        vm.fullPatientList.push(appointment.includedObjects.patient);
      });
    }

    function admitPatient(appointment) {
      // Remove appointment from view
      vm.appointmentList = CapacityUtils.getListWithoutRemovedElement(vm.appointmentList, appointment);

      // Close appointment
      appointment.status = 'arrived';
      CareCaseData.updateAppointment(appointment);

      var patientRef = 'Patient/' + appointment.includedObjects.patient.id;
      var practitionerRef = 'Practitioner/' + appointment.includedObjects.primaryPerformer.id;
      var organizationRef = appointment.includedObjects.primaryPerformer.practitionerRole[0].managingOrganization.reference;

      // Create default parameter orders
      ParameterConfig.createDefaultParameterOrders(patientRef, practitionerRef);

      // Create new episode of care and first encounter within it
      CareCaseData.createEpisodeOfCare(patientRef, organizationRef, practitionerRef).then(function(response) {
        var locationStringArray =  response.headers('location').split('/');
        var episodeRef = 'EpisodeOfCare/' + locationStringArray[locationStringArray.length - 1];
        var appointmentRef = 'Appointment/' + appointment.id;

        CareCaseData.createEncounter(
          episodeRef,
          patientRef,
          organizationRef,
          practitionerRef,
          appointment.description,
          'in-progress',
          null,
          appointmentRef
        );

        // Update data
        fetchActiveEpisodesForPractitioner();
        fetchAllActiveEpisodes();
        fetchBookedAppointments();
      });
    }

    function dischargePatient(episode) {
      // Remove episode from view
      vm.fullEpisodeList = CapacityUtils.getListWithoutRemovedElement(vm.fullEpisodeList, episode);

      // If it was the last episode in list, close edit mode
      if (vm.fullEpisodeList.length <= 0) {
        vm.editActivePatients = false;
      }

      // Close episode of care
      episode.status = 'finished';
      CareCaseData.updateEpisodeOfCare(episode);

      // Delete all patient orders
      CareCaseData.deleteAllPatientOrders(episode.patient.reference);
      CareCaseData.deleteAllPatientMedicationOrders(episode.patient.reference);

      // Close all episode encounters and referral requests
      CareCaseData.closeAllPatientEncounters('EpisodeOfCare/' + episode.id);
      CareCaseData.closeAllPatientReferralRequests('Patient/' + episode.includedObjects.patient.id);

      // Put patient in the list of patients available for appointments
      vm.fullPatientList.push(episode.includedObjects.patient);

      // Update data
      updateShownEpisodes();
    }

    function fetchMEWS(episode){
      episode.includedObjects.iconSpin = true;
      var patientId = episode.includedObjects.patient.id;
      var rangeStartTime = (CapacityUtils.formatDateToRange(new Date())); 
      fhirObservation.getObservationsByPatientId(patientId, rangeStartTime, 'MDCX_SCORE_MEWS')
        .then( 
          function(response){ 
            var observation = response.entry[0].resource;
            episode.includedObjects.mewScore = observation.valueQuantity.value.toString();
            var textField = observation.code.text.split(';');
            episode.includedObjects.details = textField[0].slice(21).split(',').join(' <br> ');
            episode.includedObjects.info = textField[1];
            episode.includedObjects.linkToCDS = textField[3];
            episode.includedObjects.iconSpin = false;
          }, function(data){
            episode.includedObjects.details = 'No data available for specified patient';
            episode.includedObjects.iconSpin = false;
          }
        )
    }

    function goToCDS(episode){
      var cdsUrl = episode.includedObjects.linkToCDS;
      if(cdsUrl){
        $window.open(cdsUrl, '_blank');
      }
    }

  }
})();
