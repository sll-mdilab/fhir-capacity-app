
/**
 * @ngdoc service
 * @name fhirCapacityApp.CapacityUtils
 * @description
 * # CapacityUtils
 * Factory in the fhirCapacityApp.
 */
 
(function () {
  'use strict';

  angular.module('fhirCapacityApp')
    .factory('CapacityUtils', CapacityUtils);

  CapacityUtils.$inject = ['$location', 'SharedConfig'];

  function CapacityUtils($location, SharedConfig) {
    // Service logic

    function mergeObjects(dst, objs, deep) {
      var h = dst.$$hashKey;

      for (var i = 0, ii = objs.length; i < ii; ++i) {
        var obj = objs[i];
        if (!isObject(obj) && !isFunction(obj)) {
          continue;
        }
        var keys = Object.keys(obj);
        for (var j = 0, jj = keys.length; j < jj; j++) {
          var key = keys[j];
          var src = obj[key];

          if (deep && isObject(src)) {
            if (!isObject(dst[key])) {
              dst[key] = isArray(src) ? [] : {};
            }
            mergeObjects(dst[key], [src], true);
          } else {
            dst[key] = src;
          }
        }
      }

      setHashKey(dst, h);
      return dst;
    }

    var isArray = Array.isArray;
    var slice = [].slice;

    /**
     * Set or clear the hashkey for an object.
     * @param obj object
     * @param h the hashkey (!truthy to delete the hashkey)
     */
    function setHashKey(obj, h) {
      if (h) {
        obj.$$hashKey = h;
      } else {
        delete obj.$$hashKey;
      }
    }

    function isObject(value) {
      // http://jsperf.com/isobject4
      return value !== null && typeof value === 'object';
    }

    function isFunction(value) {
      return typeof value === 'function';
    }

    function addStartingZero(dateValue) {
      if (dateValue === 0) {
        return '00';
      } else if (dateValue < 10) {
        return '0' + dateValue;
      } else {
        return dateValue;
      }
    }

    // Public API here
    return {
      changeLocation: function(newLocation, config) {
        SharedConfig.set(config);        
        $location.path(newLocation);   
      },
      deepMerge: function (dst) {
        return mergeObjects(dst, slice.call(arguments, 1), true);
      },
      containsIgnoreCase: function (aStr, otherStr) {
        return aStr.toUpperCase().indexOf(otherStr.toUpperCase()) >= 0;
      },
      round: function (value, exp) {
        if (typeof exp === 'undefined' || +exp === 0){
          return Math.round(value);
        }
        value = +value;
        exp = +exp;

        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)){
          return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
      },
      roundToInterval: function (value, interval) {
        return Math.min(interval[1], Math.max(interval[0], value));
      },
      isEmpty: function (obj) {
        return Object.keys(obj).length === 0;
      },
      capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }, 
      formatDate: function(dateObject, includeTime) {
        var hours = addStartingZero(dateObject.getHours());
        var minutes = addStartingZero(dateObject.getMinutes());
        var year = dateObject.getFullYear().toString().substr(2,2);
        var month = addStartingZero(dateObject.getMonth()+1);
        var date = addStartingZero(dateObject.getDate());
        if (includeTime) {
          return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes;
        } else {
          return year + '-' + month + '-' + date;
        }
      },
      formatDateToRange: function(dateObject){
        var year = dateObject.getFullYear().toString();
        var month = addStartingZero(dateObject.getMonth()+1);
        var date = addStartingZero(dateObject.getDate());
        var hours = addStartingZero(dateObject.getHours());
        var minutes = dateObject.getMinutes()-5;
        if(minutes<0){
          minutes = '00';
        }else{
          minutes = addStartingZero(minutes);
        }
        var seconds = addStartingZero(dateObject.getSeconds());
        return '>=' + year + '-' + month + '-' + date + 'T' + hours + ':' + minutes + ':' + seconds;
      },
      formatTime: function(dateObject, includeSeconds) {
        var hours = addStartingZero(dateObject.getHours());
        var minutes = addStartingZero(dateObject.getMinutes());
        var seconds = addStartingZero(dateObject.getSeconds());
        if (includeSeconds) {
          return hours + ':' + minutes + ':' + seconds;
        } else {
          return hours + ':' + minutes;
        }
      },
      roundTimeString: function(dateString) {
        return dateString.substr(0, dateString.length - 7) + '00.000Z';
      },
      calculateAge: function(SSID) {
        // SSID is a 10-digit value
        var birthYear = SSID.substr(0,2);
        var birthMonth = SSID.substr(2,2);
        var birthDay = SSID.substr(4,2);

        var currentDate = new Date();
        var currentYear = parseInt(currentDate.getFullYear().toString().substr(2,2));
        var currentMonth = currentDate.getMonth();
        var currentDay = currentDate.getDate();

        var age = currentYear - birthYear;
        if ( currentMonth < (birthMonth - 1)) { age--; }
        if (((birthMonth - 1) === currentMonth) && (currentDay < birthDay)) { age--; }
          
        if (age < 0) { age = 100 + age; }

        return age;
      },
      getReferenceId: function(reference) {
        return reference.split('/')[1];
      },
      getReferenceResourceType: function(reference) {
        return reference.split('/')[0];
      },
      getReferenceFromDomId: function(domId) {
        return domId.replace('-', '/');
      },
      replaceHtmlSpaces: function(text) {
        return String(text).replace(/&nbsp;/g, ' ');
      },
      getHtmlTags: function(text) {
        var result = [];
        var idPattern = /id="(.*?)\"/g;
        var valuePattern = /value="(.*?)\"/g;
        var idMatch, valueMatch;

        while ((idMatch = idPattern.exec(text)) !== null) {
          valueMatch = valuePattern.exec(text);
          result.push({id: idMatch[1], value: valueMatch[1]});
        }
        return result;
      },
      htmlToPlainText: function(text) {
        var result = text;

        while (result.match('value="(.*)"')) {
          var value = result.match('value="(.*)"')[1];
          if (value.search('>') >= 0) {
            var end = value.search('>');
            value = value.substring(0, end-1);
          }
          result = result ? String(result).replace(/<[^>]+>/m, value) : result;
        }
        return result;
      },
      getArrayFromObject: function(object) {
        var list = [];
        for (var key in object) { 
          if (object.hasOwnProperty(key)) {
            list.push(object[key]);
          }
        }
        return list;
      },
      getListWithoutRemovedElement: function(oldList, removedElement) {
        var newList = []; 
        for (var i in oldList) {
          if (oldList[i] !== removedElement) {
            newList.push(oldList[i]);
          }
        }
        return newList;
      },
      contains: function(value, array) {
        return array.indexOf(value) != -1;
      },
      checkIfMobileDevice: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      }
    };
  }

})();