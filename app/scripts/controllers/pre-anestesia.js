
/**
 * @ngdoc function
 * @name fhirCapacityApp.controller:PreAnestesiaCtrl
 * @description
 * # PreAnestesiaCtrl
 * Controller of the fhirCapacityApp
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .controller('PreAnestesiaCtrl', PreAnestesiaCtrl);

  PreAnestesiaCtrl.$inject =  ['CapacityUtils', 'SharedConfig', 'CareCaseData'];
  
  function PreAnestesiaCtrl(CapacityUtils, SharedConfig, CareCaseData) {
    var vm = this;
    init();

    function init() {
    	vm.config = SharedConfig.get();
      initVariables();
    	initScopeFunctions();
      fetchEpisodeEncounters();
      fetchOrdinationData();
    }

    function initVariables() {
      vm.questionnaireResponse = {};
      vm.overallAssessmentComment = '';
      vm.questionnaireResponseExists = false;
      vm.questionnaireResponseIsMissing = false;
      vm.overallAssessmentIndex = -1;
    }
    
    function initScopeFunctions() {
      vm.changeLocation = CapacityUtils.changeLocation; 
      vm.savePreAnestesiaAssessment = savePreAnestesiaAssessment;
    }

    function fetchEpisodeEncounters() {
      var episode = 'EpisodeOfCare/' + vm.config.episode.id;
      CareCaseData.getEpisodeEncounters(episode, '', []).then(function(result) {
        fetchQuestionnaireResponseData(result[0]);
      });
    }

    function fetchQuestionnaireResponseData(encounterList) {
      var patientRef = 'Patient/' + vm.config.patient.id;
      CareCaseData.getCurrentQuestionnaireResponseForPatient(patientRef, encounterList).then(function(result) {
        if (result.length > 0) {
          // Set questionnaire parameters
          vm.questionnaireResponseExists = true;
          vm.isCompleted = result[0].status === 'completed';
          vm.questionnaireResponse = result[0];
          vm.questionnaireResponse.styleObjects = {questions: {}};
         
          // Go through questionnaire questiongroups
          for (var i in vm.questionnaireResponse.group.group) {
            var questionGroup = vm.questionnaireResponse.group.group[i]; 
            if (questionGroup.linkId === 'overallAssessment') { 
              var answers = questionGroup.question[0].answer;
              vm.questionnaireResponse.styleObjects.overallAssessment = answers ? answers[0].valueString : '';
              vm.overallAssessmentIndex = i;
            } else {
              // Go through questions in questiongroup
              vm.questionnaireResponse.styleObjects.questions[questionGroup.linkId] = getStyledQuestionGroup(questionGroup);
            }
          }
        } else {
          vm.questionnaireResponseIsMissing = true;
        }
      });
    }

    function getStyledQuestionGroup(questionGroup) {
      var styledQuestionGroup = {};
      for (var i in questionGroup.group) {
        // Divide questions depending on if they are filled in by patient or a doctor
        if (questionGroup.group[i].linkId.indexOf('Patient') >= 0) {
          styledQuestionGroup.patient = getStyledQuestion(questionGroup.group[i].question);
        } else if (questionGroup.group[i].linkId.indexOf('Personal') >= 0) {
          styledQuestionGroup.personal = getStyledQuestion(questionGroup.group[i].question);
        }
      }
      return styledQuestionGroup;
    }

    function getStyledQuestion(questions) {
      var styledQuestion = {question: '', answers: {}}; 
            
      // Divide answers on the questionsdepending on if they are a yes-or-no question or a string comment
      for (var i in questions) {
        if (questions[i].answer && questions[i].answer[0].valueString) {
          styledQuestion.answers.string = questions[i].answer[0].valueString;
        } else if (questions[i].answer) {
          // The question text is in the yes-or-no question
          styledQuestion.question = questions[i].text;
          styledQuestion.answers.boolean = questions[i].answer[0].valueBoolean;
        } 
      }
      return styledQuestion;
    }

    function fetchOrdinationData() {
      // Get ordination data for links in view
      var patientRef = 'Patient/' + vm.config.patient.id;
      CareCaseData.getMedicationOrders(patientRef, []).then(function(result) {
        vm.nOrderedParameters = Object.keys(vm.config.parameterConfig).length;
        vm.nOrderedMedications = result.length;        
      });
    }

    function savePreAnestesiaAssessment() {
      // Create overall assessment question
      var overallAssessmentQuestion = {
        linkId: 'overallAssessment',
        question: {
          linkId: 'overallAssessmentComment', 
          answer: [{ valueString: vm.questionnaireResponse.styleObjects.overallAssessment }]
        }
      };

      // Update existing overall assessment question or create new if it doesn't exist
      if (vm.overallAssessmentIndex >= 0) {
        vm.questionnaireResponse.group.group[vm.overallAssessmentIndex] = overallAssessmentQuestion;
      } else {
        vm.questionnaireResponse.group.group.push(overallAssessmentQuestion);
      }

      CareCaseData.updateQuestionnaireResponse(vm.questionnaireResponse);
    }

  }
})();
