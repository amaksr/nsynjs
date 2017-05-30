/**
 * Created by amaksr on 5/8/2017.
 */

(function(exports){
    var steps = function () {
        return [
            function (trace, paramA, paramB) {
                return [typeof zzz];
            },
            function (trace, paramA, paramB) {
                return [typeof zzz,typeof undefined,typeof false,typeof true,typeof 0,typeof -1,typeof '',typeof Math.sin];
            },
            function (trace, paramA, paramB) {
                return [typeof(zzz),typeof(undefined),typeof(false),typeof(true),typeof(0),typeof(''+""),typeof(Math),typeof Math];
            },
            function (trace, paramA, paramB) {
                var i=5;
                var j=5;
                return [i==j,i===j,i!=j,i!==j];
            },
            function (trace, paramA, paramB) {
                var i="5.0";
                var j=5;
                return [i==j,i===j,i!=j,i!==j];
            },
            function (trace, paramA, paramB) {
                var i=-4;
                var j=5;
                return [i<j,i<=j,i>j,i>=j];
            },
            function (trace, paramA, paramB) {
                var i=3;
                var j=2;
                return [i+j,i-j,i/j,i*j,i<<j,i>>j];
            },
            function (trace, paramA, paramB) {
                var i=0;
                outer_label: {
                    i++;
                    inner_label: {
                        i+=10;
                        break outer_label;
                        i+=100;
                    };
                    i+=1000;
                }
                return i;
            },
            function (trace, paramA, paramB) {
                var i=0;
                outer_label: {
                    i+=Math.sin(3);
                    inner_label: {
                        i+=10*Math.sin(3);
                        break outer_label;
                        i+=100*Math.sin(3);
                    };
                    i+=1000;
                }
                return i;
            },
            function () {
                var j=20;
                for(var i=0; i<10; i++) {
                    j++;
                    if(i==7)
                        continue;
                    j++;
                };
                return j;
            },
            function (trace) {
                var r=100;
                outer: for(var i=0; i<10; i++) {
                    r++;
                    inner: for(var j=0; j<20; j++) {
                        r+=10;
                        if(j===12)
                            continue outer;
                        r+=100;
                        if(j===5)
                            continue inner;
                        r+=1000;
                    }
                    r+=10000;
                };
                return r;
            },
            function (trace) {
                var r=100;
                outer: for(var i=0; i<10; i++) {
                    r+=Math.sin(3);
                    inner: for(var j=0; j<20; j++) {
                        r+=10*Math.sin(3);
                        if(j===12)
                            continue outer;
                        r+=100*Math.sin(3);
                        if(j===5)
                            continue inner;
                        r+=1000*Math.sin(3);
                    }
                    r+=10000*Math.sin(3);
                };
                return r;
            },
            function (trace) {
                var r=100;
                outer: for(var i=0; i<10; i++) {
                    r++;
                    inner: for(var j=0; j<20; j++) {
                        r+=10;
                        if(j===12)
                            break outer;
                        r+=100;
                        if(j===5)
                            break inner;
                        r+=1000;
                    }
                    r+=10000;
                };
                return r;
            },
            function (trace) {
                var r=100;
                outer: for(var i=0; i<10; i++) {
                    r+=Math.sin(3);
                    inner: for(var j=0; j<20; j++) {
                        r+=10*Math.sin(3);
                        if(j===12)
                            break outer;
                        r+=100*Math.sin(3);
                        if(j===5)
                            break inner;
                        r+=1000*Math.sin(3);
                    }
                    r+=10000*Math.sin(3);
                };
                return r;
            },
            function (trace) {
                var r=100;
                outer: for(var i=0; i<10; i++) {
                    r++;
                    inner: for(var j=0; j<20; j++) {
                        r+=10;
                        if(j===12)
                            break outer;
                        r+=100;
                        if(j===5)
                            break;
                        r+=1000;
                    }
                    r+=10000;
                };
                return r;
            },
            function () {
                var ret="";
                for(var i=0; i<arguments.length; i++)
                    ret+=arguments[i];
                return ret;
            },
            function (trace) {
                var r=100;
                outer: for(var i=0; i<10; i++) {
                    r+=Math.sin(3);
                    inner: for(var j=0; j<20; j++) {
                        r+=10*Math.sin(3);
                        if(j===12)
                            break outer;
                        r+=100*Math.sin(3);
                        if(j===5)
                            break;
                        r+=1000*Math.sin(3);
                    }
                    r+=10000*Math.sin(3);
                };
                return r;
            },
        ];
    };
    exports.steps = steps;
})(typeof exports === 'undefined'? this['test00']={} : exports);
