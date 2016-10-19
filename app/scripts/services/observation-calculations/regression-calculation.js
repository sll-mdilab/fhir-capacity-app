
/**
 * @ngdoc function
 * @name fhirWebApp.controller:RegressionCalculation
 * @description
 * # RegressionCalculation
 * Service of the fhirWebApp
 */

(function () {
  'use strict';

	angular.module('fhirCapacityApp')
		.factory('RegressionCalculation', RegressionCalculation);

	RegressionCalculation.$inject = [];

	function RegressionCalculation() {

		return {
		    performLinearRegression: performLinearRegression, 
		    evaluatePolynomial: evaluatePolynomial
		};

		function performLinearRegression(dataObj, maxObservations) {
			var dataArr = dataObj.observations;
			var currentTimestep = dataObj.nrUpdates;
			var r = 1,
				params = [0, 0],
				xyr = [];
			
			if (dataArr.length > 1) {
				var oldestIdx = Math.min(dataArr.length - 1, maxObservations - 1);
				for (var idx = oldestIdx; idx >= 0; idx--) {
				  var y = dataArr[idx].resource.valueQuantity.value;
				  xyr.push([currentTimestep - idx, y, r]);
				}
			params = linearRegression(xyr);
			}
			return params;
	   }


  	function evaluatePolynomial(poly, x, y) {
  		// poly array defines the polynomial [a,b,c] corresponds to the polynomial 'a*x^2 + b*x + c'
	    if (poly.length === 0) {
	      	return undefined;
	    }
	    if (poly.length === 1) {
	      	return poly[0];
	    }
	    var y = 0;
	    var lastIdx = poly.length - 1;
	    for (var exp = 0; exp < poly.length; exp++) {
	      	y += Math.pow(x, exp) * poly[lastIdx - exp];
	    }
	    return y;
		}

    function linearRegression(xyr) {
      // return (a, b) that minimize
      // sum_i r_i * (a*x_i+b - y_i)^2
      var i,
        x, y, r,
        sumx = 0, sumy = 0, sumx2 = 0, sumy2 = 0, sumxy = 0, sumr = 0,
        a, b;

      for (i = 0; i < xyr.length; i++) {
          // this is our data pair
          x = xyr[i][0];
          y = xyr[i][1];

            // this is the weight for that pair
          // set to 1 (and simplify code accordingly, ie, sumr becomes xy.length) if weighting is not needed
          r = xyr[i][2];

          // consider checking for NaN in the x, y and r variables here
          // (add a continue statement in that case)

        sumr += r;
        sumx += r * x;
        sumx2 += r * (x * x);
        sumy += r * y;
        sumy2 += r * (y * y);
        sumxy += r * (x * y);
      }

      // note: the denominator is the variance of the random variable X
      // the only case when it is 0 is the degenerate case X==constant
      b = (sumy * sumx2 - sumx * sumxy) / (sumr * sumx2 - sumx * sumx);
      a = (sumr * sumxy - sumx * sumy) / (sumr * sumx2 - sumx * sumx);

      return [a, b];
  	}

	}

})();
