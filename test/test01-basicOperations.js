/**
 * Created by amaksr on 5/8/2017.
 */

(function(exports){
    var steps = function () {
        return [
            function () {
            },
            function () {
                return undefined;
            },
            function () {
                return true;
            },
            function () {
                return false;
            },
            function (trace) {
                var fun1 = function(val,comment) {
                    trace.push("step 010",val,comment);
                    return val;
                };

                return [
                    fun1(false,"FALSE") && fun1("Test false && ..."),
                    fun1(true,"TRUE") && fun1("Test true && ..."),
                    fun1(false,"FALSE") || fun1("Test false || ..."),
                    fun1(true,"TRUE") || fun1("Test true || ..."),
                ];
            },
            function (trace, paramA, paramB) {
                trace.push(['step 010',paramA, paramB]);
                return paramB*(paramA+43*paramB)/paramA-paramA;
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
                    i+=1000*Math.sin(3);
                }
                return i;
            },
            function (trace, paramA, paramB) {
                var k=100;
                lbl1: for (var i = 0, j = 100; i <= 100; i++, j--)
                    switch (i) {
                        case 3:
                        case 4:
                        case 5,6,7:
                            k++;
                        default:
                            k+=10;
                        case 10:
                            k+=100;
                            break;
                        case 20:
                            k+=1000;
                        case 21: {
                            k+=10000;
                            break;
                        }
                        case 22:
                            k+=100000;
                        case 80:
                            break lbl1;
                    }
                return k;
            },
            function (trace, paramA, paramB) {
                lbl1: for (var i = 0, j = 100; i <= 100; i++, j--)
                    switch (i) {
                        case 3:
                        case 4:
                        case 5,6,7:
                            trace.push("step 80[" + i + "][" + j + "]");
                        default:
                            trace.push("step 90[" + i + "][" + j + "]");
                        case 10:
                            trace.push("step 100 [" + i + "][" + j + "]");
                            break;
                        case 20:
                            trace.push("step 110[" + i + "][" + j + "]");
                        case 21: {
                            trace.push("step 121[" + i + "][" + j + "]");
                            break;
                        }
                        case 22:
                            trace.push("step 122[" + i + "][" + j + "]");
                        case 80:
                            break lbl1;
                    }
            },
            function (trace, paramA, paramB) {
                var res={};
                var obj = {a:1, b:2, c:3};
                trace.push(obj);
                for (var prop in obj) {
                    trace.push(prop);
                }

                for (var prop in obj) {
                    trace.push(obj[prop]);
                }
                var i=100, j=i*2;

                var k = i+j;
                {
                    trace.push(['step 010',i,j,k]);
                    i++;
                }
                {
                    trace.push(['step 020',i,j,k]);
                    i++;
                    trace.push(['step 030',i,j,++k]);
                    i++;
                }
                {{/*comment*/{
                    trace.push(['step 040',i,j,k]);
                }}}

                {
                    i+=6;
                    {i*=5}
                    /*
                     this is multy
                     line comment
                     */
                }
                for(var l=1; l<50; l++) {
                    j+=(k-5)+i;
                    j+=(k-12)+i;
                    trace.push(['step 050',i,j,k]);
                    if(l==3)
                        k+=1;
                    if(l%2 == 0) {
                        trace.push(['step 060',i,j,k]);
                        k*=2;
                    }
                    // if(l==35){
                    //     {
                    //         break;
                    //     }
                    // }
                    trace.push('step 070 '+l, [i,j,k,paramA,paramB]);
                }

                for(var l=1; l<50; l++) {
                    j+=(k-5)+i;
                    j+=(k-12)+i;
                    switch (l) {
                        case 1,2:
                            trace.push('step 075 12'+l, [i,j,k,l]);
                        case 3:
                            trace.push('step 075 3'+l, [i,j,k,l]);
                    }
                    switch (l) {
                        case 1,2:
                    }
                    if(l==3)
                        k-=1;
                    if(l%2 == 0) {
                        k*=2;
                    }
                    if(l==38) {
                        {
                            {
                                return res;
                            }
                        }
                    }
                    trace.push('step 080 '+l, [i,j,k,paramA,paramB]);
                }
            },
        ];
    };
    exports.steps = steps;
})(typeof exports === 'undefined'? this['test01']={} : exports);
