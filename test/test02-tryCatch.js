/**
 * Created by amaksr on 5/8/2017.
 */

(function(exports){
    var steps = function () {
        return [
            function (trace) {
                var k=0;
                try {
                    k++;
                    Math;
                    k+=10;
                    return k;
                }
                catch (e) {
                    k+=100;
                }
                return k+1000;
            },
            function (trace) {
                var k=0;
                try {
                    k++;
                    nonexistent;
                    k+=10;
                }
                catch (e) {
                    k+=100;
                }
                return k;
            },
            function (trace) {
                var k=0;
                try {
                    k++;
                    nonexistent;
                    k+=10;
                }
                catch (e) {
                    k+=100;
                    return k;
                    k+=1000;
                }
            },
            function (trace) {
                var myFunc1=function(a,b,c) {
                    trace.push(['step 045 myFunc',a,b,c]);
                    nonExistent();
                    trace.push(['step 045 myFunc end',a,b,c]);
                };

                try {
                    trace.push(['step 046 before calling myFunc']);
                    myFunc1('a',3,{aaa:123});
                    trace.push(['step 046 after calling myFunc']);
                }
                catch (e) {
                    trace.push(['step 046 exception after calling myFunc']);
                }
            },
            function (trace) {
                var myFunc2=function(a,b,c) {
                    trace.push(['step 045 myFunc',a,b,c]);
                    var res = Math.sin(a);
                    trace.push(['step 045 myFunc end',a,b,c,]);
                    return res;
                };

                try {
                    trace.push(['step 046 before calling myFunc']);
                    myFunc2(0.5);
                    trace.push(['step 046 after calling myFunc']);
                }
                catch (e) {
                    trace.push(['step 046 exception after calling myFunc']);
                }
            },
            function (trace) {
                try {
                    trace.push(['step 046 before 2nd try']);
                    try {
                        trace.push(['step 048 in 2nd try']);
                        nonExistent();
                    }
                    catch (e) {
                        trace.push(['step 049 in 2nd catch']);
                        throw "error from 049";
                        trace.push(['step 049 in 2nd catch aftrer throw']);
                    }
                    trace.push(['step 046 after calling myFunc']);
                }
                catch (e) {
                    trace.push(['step 046 exception after calling myFunc',e]);
                }
            },
            function (trace) {
                label_1: for(var i=0; i<5; i++) {
                    for (var j = 0; j < 3; j++) {
                        trace.push('step 170',[i,j]);
                        try {
                            trace.push('step 171',[i,j]);
                            if (i == 2 && j == 2)
                                nonexistent();
                            trace.push('step 172',[i,j]);
                        }
                        catch (e) {
                            trace.push('step 173',[i,j]);
                            continue label_1;
                            trace.push('step 174',[i,j]);
                        }
                        trace.push('step 175',[i,j]);
                    }
                    trace.push('step 176',[i,j]);
                }
                return i*j;
            },
            function (trace) {
                lable_1: {
                    try {
                        trace.push(['step 046 before 2nd try']);
                        try {
                            trace.push(['step 048 in 2nd try']);
                            nonExistent();
                        }
                        catch (e) {
                            trace.push(['step 050']);
                            throw "error from 050";
                            trace.push(['step 050']);
                        }
                        trace.push(['step 046 after calling myFunc']);
                    }
                    catch (e) {
                        trace.push(['step 0461',e]);
                        var k=0;
                        try {
                            k++;
                            nonexistent;
                            k+=10;
                        }
                        catch (e) {
                            k+=100;
                            break lable_1;
                            k+=1000;
                        }
                        trace.push(['step 0462',e]);
                    }
                }
                trace.push(['step 510']);
            },
        ];
    };
    exports.steps = steps;
})(typeof exports === 'undefined'? this['test02']={} : exports);
