
/**
 * @ngdoc function
 * @name fhirWebApp.controller:CareCaseData
 * @description Get, create, update and delete care case data object
 * # CareCaseData
 * Factory of the fhirWebApp
 */

 (function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('CareCaseData', CareCaseData);


  CareCaseData.$inject = ['$http', '$sce', 'CapacityUtils', 'DefaultParameters', 'fhirPatient', 'fhirPractitioner', 'fhirOrganization', 'fhirEpisodeOfCare', 'fhirAppointment', 'fhirEncounter', 'fhirReferralRequest', 'fhirMedication', 'fhirMedicationOrder', 'fhirDeviceMetric', 'fhirOrder', 'fhirList', 'fhirQuestionnaireResponse'];

  function CareCaseData($http, $sce, CapacityUtils, DefaultParameters, fhirPatient, fhirPractitioner, fhirOrganization, fhirEpisodeOfCare, fhirAppointment, fhirEncounter, fhirReferralRequest, fhirMedication, fhirMedicationOrder, fhirDeviceMetric, fhirOrder, fhirList, fhirQuestionnaireResponse) {

    return {
      getAllPatients: getAllPatients,
      getAllPractitioners: getAllPractitioners,
      getAllOrganizations: getAllOrganizations,

      getEpisodesForPractitioner: getEpisodesForPractitioner,
      createEpisodeOfCare: createEpisodeOfCare,
      updateEpisodeOfCare: updateEpisodeOfCare,
      addToEpisodeCareTeam: addToEpisodeCareTeam,
      
      getAppointments: getAppointments,
      createAppointment: createAppointment,
      updateAppointment: updateAppointment,

      getEpisodeEncounters: getEpisodeEncounters,
      createEncounter: createEncounter,
      updateEncounter: updateEncounter,
      closeAllPatientEncounters: closeAllPatientEncounters,

      getPatientReferralRequests: getPatientReferralRequests,
      createReferralRequest: createReferralRequest,
      updateReferralRequest: updateReferralRequest,
      closeAllPatientReferralRequests: closeAllPatientReferralRequests,

      getAllMedication: getAllMedication,
      getMedicationOrders: getMedicationOrders,
      createMedicationOrder: createMedicationOrder,
      updateMedicationOrder: updateMedicationOrder,
      deleteMedicationOrder: deleteMedicationOrder,
      deleteAllPatientMedicationOrders: deleteAllPatientMedicationOrders,

      getAllDeviceMetrics: getAllDeviceMetrics,
      getOrders: getOrders,
      createOrder: createOrder,
      updateOrder: updateOrder,
      deleteOrder: deleteOrder,
      deleteAllPatientOrders: deleteAllPatientOrders,

      getList: getList,
      getCurrentQuestionnaireResponseForPatient: getCurrentQuestionnaireResponseForPatient,
      updateQuestionnaireResponse: updateQuestionnaireResponse,
      getAllIcdCodes: getAllIcdCodes
    };

    function getAllPatients() {
      return fhirPatient.getAllPatients().then(function (result) {
        var list = [];
        angular.forEach(result.Patient, function (patient) {
          list.push(patient);
        });
        return list;
      }); 
    }

    function getAllPractitioners() {
      return fhirPractitioner.getAllPractitioners().then(function (practitioners) {
        var list = [];
        angular.forEach(practitioners, function (practitioner) {
          if (practitioner.identifier) {
            list.push(practitioner);
          }
        });
        return list;
      });
    }

    function getAllOrganizations() {
      return fhirOrganization.getAllOrganizations().then(function (organizations) {
        var list = [];
        angular.forEach(organizations, function (organization) {
          list.push(organization);
        });
        return list;
      });
    }

    function getEpisodesForPractitioner(activePractitioner, status, includeList) {
      return fhirEpisodeOfCare.getEpisodesOfCare(activePractitioner, status, includeList).then(function (result) {
        var episodeList = [];
        angular.forEach(result.EpisodeOfCare, function (episode) {
          if (includeList.length > 0) {
            // Include care manager, patien and department objects
            episode.includedObjects = {};
            episode.includedObjects.careManager = result.Practitioner[CapacityUtils.getReferenceId(episode.careManager.reference)];
            episode.includedObjects.patient = result.Patient[CapacityUtils.getReferenceId(episode.patient.reference)];
            episode.includedObjects.managingOrganization = result.Organization[CapacityUtils.getReferenceId(episode.managingOrganization.reference)];
            
            // Include condition object if the episode refers to one
            if (episode.condition) {
              episode.includedObjects.condition = result.Condition[CapacityUtils.getReferenceId(episode.condition[0].reference)];
            }
          }
          episodeList.push(episode);

        });
        return [episodeList, result];
      });
    }

    function createEpisodeOfCare(patientRef, organizationRef, practitionerRef) {
      var newEpisodeOfCare = fhirEpisodeOfCare.instantiateEmptyEpisodeOfCare();

      newEpisodeOfCare.patient = { reference: patientRef };
      newEpisodeOfCare.managingOrganization = { reference: organizationRef };
      newEpisodeOfCare.careManager = { reference: practitionerRef };
      newEpisodeOfCare.careTeam[0].member = { reference: practitionerRef };

      return fhirEpisodeOfCare.createEpisodeOfCare(newEpisodeOfCare);
    }

    function updateEpisodeOfCare(episodeOfCare, prom) {
      var cleanEpisodeOfCare = getCleanObject(episodeOfCare);
      if (prom) {
        prom.push(fhirEpisodeOfCare.updateEpisodeOfCare(cleanEpisodeOfCare));
      } else {
        fhirEpisodeOfCare.updateEpisodeOfCare(cleanEpisodeOfCare);
      }
    }

    function addToEpisodeCareTeam(episodeOfCare, newTeamMemberReference) {
      episodeOfCare.careTeam = updateEpisodeCareTeam(episodeOfCare.careTeam, newTeamMemberReference);
      fhirEpisodeOfCare.updateEpisodeOfCare(episodeOfCare);
    }

    function updateEpisodeCareTeam(careTeam, careManagerReference) {
      var existInCareTeam;

      // Check if new care manager is already in care team
      for (var i in careTeam) {
        if (careTeam[i].member.reference === careManagerReference) { existInCareTeam = true; }
      }

      // Add new care manager to the care team if it was not already in it
      if (!existInCareTeam) { careTeam.push({member: {reference: careManagerReference}}); }
      return careTeam;
    }

    function getAppointments(status, includeList) {
      return fhirAppointment.getAppointments(status, includeList).then(function(result) {
        var appointmentList = [];

        angular.forEach(result.Appointment, function (episode) {
          if (includeList.length > 0) {
            // Include patient and primary performer objects
            episode.includedObjects = {};
            episode.includedObjects.patient = result.Patient[getParticipantId(episode.participant, 'actor', 'SBJ')];
            episode.includedObjects.primaryPerformer = result.Practitioner[getParticipantId(episode.participant, 'actor', 'PPRF')];
          }
          appointmentList.push(episode);
        });
        return appointmentList;
      });
    }

    function getParticipantId(participantList, roleParameter, roleCode) {
      var participantId = '';
      // Get participant id of a specific role
      for (var i in participantList) {
        angular.forEach(participantList[i].type, function (type) {
          if (type.coding[0].code === roleCode) {
            participantId = CapacityUtils.getReferenceId(participantList[i][roleParameter].reference);
          }
        });
      }
      return participantId;
    }

    function createAppointment(start, end, practitionerRef, practitionerName, patientRef, patientName, description) {
      var newAppointmentObject = fhirAppointment.instantiateEmptyAppointment();

      newAppointmentObject.start = new Date(start).toISOString();
      newAppointmentObject.end = new Date(end).toISOString();

      newAppointmentObject.participant = [];
      newAppointmentObject.participant.push(createParticipant(patientRef, 'SBJ', patientName));
      newAppointmentObject.participant.push(createParticipant(practitionerRef, 'PPRF', practitionerName));

      newAppointmentObject.description = description;

      return fhirAppointment.createAppointment(newAppointmentObject);      
    }

    function createParticipant(participantRef, code, display) {
      return {
        actor: {
          reference: participantRef,
          display: display
        },
        type: {
          coding: [{
            code: code,
            system: 'http://hl7.org/fhir/ValueSet/v3-ParticipationType'
          }]
        }
      }
    }

    function updateAppointment(appointment) {
      return fhirAppointment.updateAppointment(appointment);
    }

    function getEpisodeEncounters(episodeOfCare, status, includeList) { 
      return fhirEncounter.getEncounters(episodeOfCare, status, includeList).then(function (result) {
        var encounterList = [];
        angular.forEach(result.Encounter, function (encounter) {
          if (includeList.length > 0) {
            // Include primary performer and department objects
            encounter.includedObjects = {};
            encounter.includedObjects.primaryPerformer = result.Practitioner[getParticipantId(encounter.participant, 'individual', 'PPRF')];
            encounter.includedObjects.serviceProvider = result.Organization[CapacityUtils.getReferenceId(encounter.serviceProvider.reference)];

            if (result.ReferralRequest) {
              // Include incoming referral request if there is a reference in the encounter
              if (encounter.incomingReferral) {
                encounter.includedObjects.incomingReferral = result.ReferralRequest[CapacityUtils.getReferenceId(encounter.incomingReferral[0].reference)]
              }
              // Include sent referral if a referral request in result list has a reference to this encounter
              encounter.includedObjects.sentReferral = getEncounterSentReferralRequest(result.ReferralRequest, encounter.id);
              if (encounter.includedObjects.sentReferral) {
                encounter.includedObjects.sentReferral.description = $sce.trustAsHtml(encounter.includedObjects.sentReferral.description);
              }
            }
          }
          encounterList.push(encounter);
        });

        return [encounterList, result];
      });
    } 

    function getEncounterSentReferralRequest(referralRequestList, encounterId) {
      // Return the referral request in result list that a reference to specific encounter id if there is one
      for (var i in referralRequestList) {
        if (referralRequestList.hasOwnProperty(i)) {
          if (CapacityUtils.getReferenceId(referralRequestList[i].encounter.reference) === encounterId) {
            return referralRequestList[i];
          }
        }
      }
    }

    function updateEncounter(encounter, prom) {
      var cleanEncounter = getCleanObject(encounter);
      if (prom) {
        prom.push(fhirEncounter.updateEncounter(cleanEncounter));
      } else {
        fhirEncounter.updateEncounter(cleanEncounter);
      }
    }

    function createEncounter(episodeRef, patientRef, organizationRef, practitionerRef, type, status, incomingReferralRef, appointmentRef) {
      var newEncounterObject = fhirEncounter.instantiateEmptyEncounter();
      var currentDate = new Date().toISOString();

      newEncounterObject.episodeOfCare.reference = episodeRef;
      newEncounterObject.patient.reference = patientRef;
      newEncounterObject.participant = getEncounterParticipant(practitionerRef);
      newEncounterObject.serviceProvider = [{ reference: organizationRef }];
      newEncounterObject.type = [{ 'text': type }]; 
      newEncounterObject.class = 'inpatient';
      newEncounterObject.status = status;
      newEncounterObject.period.start = currentDate;

      if (incomingReferralRef) { newEncounterObject.incomingReferral = [{ reference: incomingReferralRef }]; }
      if (appointmentRef) { newEncounterObject.appointment = [{ reference: appointmentRef }]; }

      fhirEncounter.createEncounter(newEncounterObject);
    }

    function getEncounterParticipant(reference) {
      var participantObject = {};
      return [{
        type: [{
          text: 'primary performer',
          coding: [{code: 'PPRF', system: 'http://hl7.org/fhir/v3/ParticipationType', display: 'primary performer'}]
        }],
        individual: {
          reference: reference
        }
      }];
    }

    function closeAllPatientEncounters(episodeRef) {
      // Set all encounter status to 'finished' and class to 'outpatient' in a specific episode 
      fhirEncounter.getEncounters(episodeRef, '').then(function(result) {
        for (var i in result.Encounter) {
          result.Encounter[i].status = 'finished';
          result.Encounter[i].class = 'outpatient';
          fhirEncounter.updateEncounter(result.Encounter[i]);
        }
      });
    }

    function getPatientReferralRequests(patient, status, inlcudeList) {
      return fhirReferralRequest.getReferralRequests(patient, status, inlcudeList).then(function (result) {
        var referralRequestList = [];
        angular.forEach(result.ReferralRequest, function (referralRequest) {
          // Include requester and recipient objects
          referralRequest.includedObjects = {};
          referralRequest.includedObjects.requester = result.Practitioner[CapacityUtils.getReferenceId(referralRequest.requester.reference)];
          referralRequest.includedObjects.recipient = result.Practitioner[CapacityUtils.getReferenceId(referralRequest.recipient[0].reference)];

          referralRequestList.push(referralRequest);
        });
        return referralRequestList;
      });
    }

    function createReferralRequest(patientReference, requester, recipient, encounterReference, status) {
      var newReferralRequestObject = fhirReferralRequest.instantiateEmptyReferralRequest();

      newReferralRequestObject.patient.reference = patientReference;
      newReferralRequestObject.requester.reference = 'Practitioner/' + requester.id;
      newReferralRequestObject.recipient.reference = 'Practitioner/' + recipient.id;
      newReferralRequestObject.encounter.reference = encounterReference;
      newReferralRequestObject.status = status;

      // return update referral request list after creating a new one
      return fhirReferralRequest.createReferralRequest(newReferralRequestObject).then(function() {
        var includeList = ['requester', 'recipient'];
        return getPatientReferralRequests(patientReference, status, includeList);
      }); 
    }

    function updateReferralRequest(referralRequest, prom) {
      var cleanReferralRequest = getCleanObject(referralRequest);
      if (prom) {
        prom.push(fhirReferralRequest.updateReferralRequest(cleanReferralRequest));
      } else {
        fhirReferralRequest.updateReferralRequest(cleanReferralRequest);
      }
    }

    function closeAllPatientReferralRequests(patientRef) {
      fhirReferralRequest.getReferralRequests(patientRef, '').then(function(result) {
        for (var i in result.ReferralRequest) {
          result.ReferralRequest[i].status = 'completed';
          fhirReferralRequest.updateReferralRequest(result.ReferralRequest[i]);
        }
      });
    }

    function getAllMedication() {
      return fhirMedication.getAllMedication().then(function (result) {
        var list = [];
        angular.forEach(result, function (medication) {
          list.push(medication);
        });
        return list;
      });
    }

    function getMedicationOrders(patient, includeList) {
      return fhirMedicationOrder.getMedicationOrdersForPatient(patient, includeList).then(function (result) {
        var medicationOrderList = [];
        angular.forEach(result.MedicationOrder, function (medicationOrder) {
          if (includeList.length > 0) {
            // Include medication and prescriber objects
            medicationOrder.includedObjects = {};
            medicationOrder.includedObjects.medication = result.Medication[CapacityUtils.getReferenceId(medicationOrder.medicationReference.reference)];
            medicationOrder.includedObjects.prescriber = result.Practitioner[CapacityUtils.getReferenceId(medicationOrder.prescriber.reference)];
          }
          medicationOrderList.push(medicationOrder);
        });
        return medicationOrderList;
      });
    }

    function createMedicationOrder(patient, prescriber, medication, date, dose) {
      var newMedicationOrderObject = fhirMedicationOrder.instantiateEmptyMedicationOrder();

      newMedicationOrderObject.patient.reference = patient;
      newMedicationOrderObject.prescriber.reference = prescriber;
      newMedicationOrderObject.medicationReference.reference = medication;
      newMedicationOrderObject.dateWritten = date.toISOString();
      newMedicationOrderObject.dosageInstruction = dose;

      if (newMedicationOrderObject.dosageInstruction.timing) {
        newMedicationOrderObject.dosageInstruction.timing.event = date.toISOString();
      } else {
        // Add current time as start time to medication order object if there was none
        newMedicationOrderObject.dosageInstruction.timing = {event: date.toISOString()}
      }

      return fhirMedicationOrder.createMedicationOrder(newMedicationOrderObject);
    }

    function updateMedicationOrder(medicationOrder) {
      var cleanMedicationOrder = getCleanObject(medicationOrder);
      fhirMedicationOrder.updateMedicationOrder(cleanMedicationOrder);
    }
    
    function deleteMedicationOrder(medicationOrderId) {
      return fhirMedicationOrder.deleteMedicationOrder(medicationOrderId);
    }

    function deleteAllPatientMedicationOrders(patientRef) {
      // Used when discharging patient
      getMedicationOrders(patientRef, []).then(function(result) {
        for (var i in result) {
          fhirMedicationOrder.deleteMedicationOrder(result[i].id);
        }
      });
    }

    function getAllDeviceMetrics() {
      return fhirDeviceMetric.getAllDeviceMetrics().then(function (result) {
        var list = [];
        angular.forEach(result, function (deviceMetric) {
          list.push(deviceMetric);
        });
        return list;
      });
    }

    function getOrders(patientRef) {
      // Can't use patient as a search parameter because of a Fhirbase issue on the Order resource
      return fhirOrder.getOrdersForPatient().then(function (result) {
        var orderList = [];
        angular.forEach(result, function (order) {
          if (patientRef === order.subject.reference) {
            orderList.push(order);
          }        
        });
        return orderList;
      });
    }

    function createOrder(patientRef, practitionerRef, parameterRef, date, defaultParameterIndex) {
      var newOrderObject = fhirOrder.instantiateEmptyOrder();

      newOrderObject.subject.reference = patientRef;
      newOrderObject.source.reference = practitionerRef;
      newOrderObject.detail[0].reference = parameterRef;
      newOrderObject.dateWritten = date.toISOString();

      var alarmLimits = defaultParameterIndex ? DefaultParameters[defaultParameterIndex].alarmlimits : { lowerAlarm: 0, lowerWarning: 0, upperWarning: 0, upperAlarm: 0 };
      newOrderObject.extension = getAlarmLimits(alarmLimits);

      return fhirOrder.createOrder(newOrderObject);
    }

    function getAlarmLimits(alarmLimits) {
      // Get alarm limits for parameter order
      return [{
        url: "http://sll-mdilab.net/fhir/Order#alarmlimits",
        extension: [{
          url: "lowerAlarm",
          valueDecimal: alarmLimits.lowerAlarm
        }, {
          url: "lowerWarning",
          valueDecimal: alarmLimits.lowerWarning
        },{
          url: "upperWarning",
          valueDecimal: alarmLimits.upperWarning
        }, {
          url: "upperAlarm",
          valueDecimal: alarmLimits.upperAlarm
        }]
      }];
    }

    function updateOrder(order) {
      var cleanOrder = getCleanObject(order);
      fhirOrder.updateOrder(order);
    } 

    function deleteOrder(orderId) {
      return fhirOrder.deleteOrder(orderId);      
    }

    function deleteAllPatientOrders(patientRef) {
      // Used when discharging patient
      getOrders(patientRef).then(function(result) {
        for (var i in result) {
          fhirOrder.deleteOrder(result[i].id);
        }       
      });
    }

    function getList(listId) {
      return fhirList.getList({
        listId: listId,
        includeResourceType: true
      }).then(function (result) {
        return result;
      });
    }

    function getCurrentQuestionnaireResponseForPatient(patientRef, encounterList) {
      // Get questionnaire response if there is a reference to one in any encounter in list
      return fhirQuestionnaireResponse.getQuestionnaireResponsesForPatient(patientRef).then(function(result) {
        for (var i in result.QuestionnaireResponse) {
          var appointmentRef = result.QuestionnaireResponse[i].extension[0].valueReference.reference;
          var encounter = getAppointmentEncounter(encounterList, appointmentRef);
          if (encounter) {
            return [result.QuestionnaireResponse[i], encounter];
          }
        }
        return [];
      });
    }

    function getAppointmentEncounter(encounterList, appointmentRef) {
      for (var i in encounterList) {
        if (encounterList[i].appointment && appointmentRef === encounterList[i].appointment.reference) {
          return encounterList[i];
        }
      }
      return null;
    }

    function updateQuestionnaireResponse(questionnaireResponse) {
      var cleanQuestionnaire = getCleanObject(questionnaireResponse); 
      fhirQuestionnaireResponse.updateQuestionnaireResponse(cleanQuestionnaire);
    } 

    function getCleanObject(object) {
      var cleanObject = angular.copy(object);
      delete cleanObject.includedObjects;
      delete cleanObject.styleObjects;
      return cleanObject;
    }

    function getAllIcdCodes() {
      var url = '/data/icd_valueset_reduced.json';
      // Get all ICD-codes from local json-file
      // Uses the reduced set for performance reasons
      return $http({
        method: 'GET',
        url: url
      }).then(function (response) {
        var resources = response.data.codeSystem.concept;
        var list = [];
        for (var idx in resources) {
          list.push(resources[idx]);
        }
        return list;
      });
    }

  }
})();
