
/**
 * @ngdoc directive
 * @name fhirTypeAheadApp.directive:contenteditable
 * @description
 * # contenteditable
 */

(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .directive('contenteditable', _contenteditable);

  _contenteditable.$inject = ['$sce'];

  function _contenteditable($sce) {
    return {
      restrict: 'A',
      transclude: true,
      require: '?ngModel', 
      link: function(scope, element, attrs, ngModel) {
        function read() {
          var html = element.html();

          // Remove the <br> that some browsers leave when clearing the content editable
          if (attrs.stripBr && html === '<br>') {
            html = '';
          }
          ngModel.$setViewValue(html);
        }

        if(!ngModel) {return;}

        ngModel.$render = function() {
          if (ngModel.$viewValue !== element.html()) {
            element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
          }
        };

        // Listen for change events 
        element.on('blur keyup change', function() {
          scope.$apply(read);
        });
        read();
      }
    };
  }

})();
