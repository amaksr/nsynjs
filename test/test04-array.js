/**
 * Created by amaksr on 5/8/2017.
 */

(function(exports){
    var steps = function () {
        return [
            function (trace, paramA, paramB) {
                return new Array;
            },
            function (trace, paramA, paramB) {
                return new Array();
            },
            function (trace, paramA, paramB) {
                return new Array(20);
            },
            function (trace, paramA, paramB) {
                return [];
            },
            function (trace, paramA, paramB) {
                var x=72;
                var arr = [4,7,24.-11,x,Math.sin(x)];

                Array.prototype.synMap = function(cb) {
                    var res=new Array(this.length);
                    for(var i=0; i<res.length; i++)
                        res[i] = cb(this[i]);
                    return res;
                };

                trace.push('step 073', arr.synMap(function (e) {
                    return e*e;
                }));
            },
            function (trace, paramA, paramB) {
                var x=72;
                var arr = [4,7,24.-11,x,Math.sin(paramA*paramB)];
                trace.push('step 075',arr.splice(1,1),arr);
                var res=delete arr[1];
                trace.push('step 076',arr);
                return res;
            },
        ];
    };
    exports.steps = steps;
})(typeof exports === 'undefined'? this['test04']={} : exports);
