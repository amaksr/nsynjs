/**
 * Created by amaksr on 5/8/2017.
 */

(function(exports){
    var steps = function () {
        return [
            function (trace) {
                var closureVar=Math.sin(1);
                var myFunc1=function(a,b,c) {
                    trace.push(['step 025 myFunc',a,b,c,closureVar++]);
                    trace.push(['step 025 myFunc',a,b,c,closureVar+=10]);
                    trace.push(['step 025 myFunc',a,b,c,closureVar--]);
                    trace.push(['step 025 myFunc',a,b,c,closureVar-=5]);
                };

                function myFunc2(a,b,c) {
                    trace.push(['step 025 myFunc',a,b,c,closureVar++]);
                    trace.push(['step 025 myFunc',a,b,c,closureVar+=10]);
                    trace.push(['step 025 myFunc',a,b,c,closureVar--]);
                    trace.push(['step 025 myFunc',a,b,c,closureVar-=5]);
                };

                myFunc1(1,--closureVar,--closureVar);
                myFunc2(2,++closureVar);
                myFunc1(3,closureVar*=6);
                myFunc2(2,closureVar++);
                return ++closureVar;
            },
            function (trace) {
                var closureVar=Math.sin(0.5);
                var myFunc1=function(a,b,c) {
                    trace.push(['step 611 myFunc',a,b,c,closureVar-=5]);
                    return function () {
                        trace.push(['step 612 myFunc',a,b,c,closureVar-=5]);
                        return a+b+c+closureVar
                    }
                };
                trace.push(['step 613 myFunc',closureVar-=5]);
                return myFunc1("arg1","arg2","arg3")();
            },
        ];
    };
    exports.steps = steps;
})(typeof exports === 'undefined'? this['test03']={} : exports);
