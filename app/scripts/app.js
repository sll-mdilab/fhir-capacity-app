
/**
 * @ngdoc overview
 * @name fhirCapacityApp
 * @description
 * # fhirCapacityApp
 *
 * Main module of the application.
 */

(function () {
  'use strict';

  angular
    .module('fhirCapacityApp', [
      'ngCookies',
      'ngResource',
      'ngRoute',
      'ngSanitize',
      'ngTouch',
      'ui.grid',
      'ui.grid.selection',
      'ui.grid.edit',
      'ui.grid.autoResize',
      'ui.router',
      'ui.bootstrap',
      'angularFhirResources',
      'uuid',
      'config',
      'mentio',
      'uiSwitch',
      'LocalStorageModule',
      'ngDragDrop',
	   'treeControl'
    ])
    .config(function ($stateProvider, $urlRouterProvider, fhirConfigProvider, fhirAPI) {

      $urlRouterProvider.otherwise('/overview');

      $stateProvider
        .state('oauth', {
          url: '/oauth',
          templateUrl: '../views/oauth.html',
          controller: 'OauthCtrl',
          title: 'Authorization | Innovationsplatsen'
        })
        .state('oauthCallback', {
          url: '/oauth_callback',
          templateUrl: '../views/oauthcallback.html',
          controller: 'OauthcallbackCtrl',
          title: 'Authorization | Innovationsplatsen'
        })
        .state('overview', {
          url: '/overview',
          views: {
            '': { 
              templateUrl: '../views/overview/overview.html',
              controller: 'OverviewCtrl',
              controllerAs: 'vm',
              title: 'Overview | Innovationsplatsen'
            },
            'sbar-modal@overview': {
              templateUrl: '../views/overview/sbar-modal.html'
            },
            'appointment-modal@overview': {
              templateUrl: '../views/overview/appointment-modal.html'
            },
            'header@overview': {
              templateUrl: '../views/misc/header.html'
            }
          }
        })
        .state('cockpit', {
          url: '/cockpit',
          views: {
            '': { 
              templateUrl: '../views/cockpit/cockpit.html',
              controller: 'CockpitCtrl',
              controllerAs: 'vm',
              title: 'Cockpit | Innovationsplatsen'
            },
            'cockpit-full@cockpit': {
              templateUrl: '../views/cockpit/cockpit-full.html'
            },
            'cockpit-light@cockpit': {
              templateUrl: '../views/cockpit/cockpit-light.html'
            },
            'light-config@cockpit': {
              templateUrl: '../views/misc/light-config.html'
            },
            'header@cockpit': {
              templateUrl: '../views/misc/header.html'
            }
          }
        })
        .state('history', {
          url: '/history',
          views: {
            '': { 
              templateUrl: '../views/history/history.html',
              controller: 'HistoryCtrl',
              controllerAs: 'vm',
              title: 'History | Innovationsplatsen'
            },
            'history-cockpitlight@history': {
              templateUrl: '../views/history/history-cockpit-light.html'
            },
            'circulation-toolbox@history': {
              templateUrl: '../views/history/circulation-toolbox.html'
            },
            'light-config@history': {
              templateUrl: '../views/misc/light-config.html'
            },
            'header@history': {
              templateUrl: '../views/misc/header.html'
            }
          }
        })
        .state('sbar', {
          title: 'SBAR | Innovationsplatsen',
          url: '/sbar',
          views: {
            '': { 
              templateUrl: '../views/sbar/sbar.html',
              controller: 'SbarCtrl',
              controllerAs: 'vm'
            },
            'cockpit-light@sbar': {
              templateUrl: '../views/sbar/sbar-cockpit-light.html',
              controller: 'CockpitCtrl',
              controllerAs: 'vm'
            }
          }
        })
        .state('ordination', {
          url: '/ordination',
          views: {
            '': { 
              templateUrl: '../views/ordination/ordination.html',
              controller: 'OrdinationCtrl',
              controllerAs: 'vm',
              title: 'Ordination | Innovationsplatsen'
            },
            'medication-header@ordination': {
              templateUrl: '../views/ordination/medication-header.html'
            },
            'medication-doses@ordination': {
              templateUrl: '../views/ordination/medication-doses.html'
            },
            'medication-list-modal@ordination': {
              templateUrl: '../views/ordination/medication-list-modal.html'
            },
            'header@ordination': {
              templateUrl: '../views/misc/header.html'
            }
          }
        })      
        .state('human', {
          url: '/human',
          views: {
            '': { 
              templateUrl: '../views/human/human.html',
              controller: 'HumanCtrl',
              controllerAs: 'vm',
              title: 'Human | Innovationsplatsen'
            },
            'header@human': {
              templateUrl: '../views/misc/header.html'
            }
          }
        })
        .state('pre-anestesia', {
          url: '/pre-anestesia',
          views: {
            '': { 
              templateUrl: '../views/pre-anestesia/pre-anestesia.html',
              controller: 'PreAnestesiaCtrl',
              controllerAs: 'vm',
              title: 'Pre-anestesia | Innovationsplatsen'
            },
            'header@pre-anestesia': {
              templateUrl: '../views/misc/header.html'
            }
          }
        })
        .state('todo', {
          url: '/todo',
          views: {
            '': { 
              templateUrl: '../views/todo/todo.html',
              controller: 'TodoCtrl',
              controllerAs: 'vm',
              title: 'Todo | Innovationsplatsen'
            },
            'header@todo': {
              templateUrl: '../views/misc/header.html'
            }
          }
        })
		.state('body-mapper', {
          url: '/body-mapper',
          views: {
            '': { 
              templateUrl: '../views/body-mapper/body-mapper.html',
              controller: 'BodyMapperCtrl',
              controllerAs: 'vm',
              title: 'Body Mapper | Innovationsplatsen'
            },
            'header@body-mapper': {
              templateUrl: '../views/misc/header.html'
            }
          }
        })
        .state('logout', {
          url: '/logout',
          templateUrl: '../views/logout.html',
          controller: 'LogoutCtrl',
          title: 'Logout | Innovationsplatsen'
        });
      fhirConfigProvider.setAPICredentials(fhirAPI.apiUser, fhirAPI.apiKey);
      fhirConfigProvider.setBackendURL(fhirAPI.url);
      fhirConfigProvider.setOauthClientId(fhirAPI.oauthClientId);
      fhirConfigProvider.setOauthRedirectUri(fhirAPI.oauthRedirectUri);
    })
    .config(['localStorageServiceProvider', function(localStorageServiceProvider){
      localStorageServiceProvider.setPrefix('ls');
    }])
    .run(function ($rootScope, $location, $state, fhirConfig, rfc4122, SharedConfig, Config, CapacityUtils, fhirAPI) {

      if(CapacityUtils.isEmpty(SharedConfig.get())) {
        console.log('Shared config is empty, initializing.');
        SharedConfig.set(Config.getDefaultConfig());
      }

      $rootScope.$on('$stateChangeStart', function(event, toState, params) {
        console.log('Changing to state ' + toState.name);
        if(fhirAPI.oauthClientId && !CapacityUtils.contains(toState.name, ['oauth', 'oauthCallback', 'logout'])) {
          if(!fhirConfig.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login page.');

            event.preventDefault();
            $state.go('oauth');
          } else {
            console.log('User is authenticated.');
          }
        }
      });

      $rootScope.$on('$routeChangeSuccess', function (event, current) {
        if (current.hasOwnProperty('$$route')) {
          $rootScope.title = current.$$route.title;
        }
      });
      fhirConfig.setCustomHeader('Client-Version', 'CAPACITY');
      fhirConfig.setCustomHeader('Session-Id', rfc4122.v4());
    });
    
})();