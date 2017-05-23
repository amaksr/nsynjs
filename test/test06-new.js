/**
 * Created by amaksr on 5/8/2017.
 */

(function(exports){
    var steps = function () {
        return [
            function (trace) {
                var myObj = function (id,name) {
                    this.id = id;
                    this.name = name;
                    this.getId = function () {
                        return this.id;
                    }
                };
                myObj.prototype.toString = function () {
                    return "myObj:"+this.name+","+this.id;
                };

                var o1 = new myObj;
                var o2 = new myObj();
                var o3 = new myObj(3,'John');

                trace.push(['step 230',o1.toString(),o2.toString(),o3.toString(),o3.getId()]);
            },
            function (trace, a, b) {
                for(var m=0; m<11; m++) {
                    var md=new Date(2011,m);
                    var mds=new Date(2011,m).toISOString();
                    trace.push(['step 235',m,md,mds,new Date(2011,m).toISOString()]);
                }
            },
            function (trace) {
                return [new String('test'), new String(), new String];
            }
        ];
    };
    exports.steps = steps;
})(typeof exports === 'undefined'? this['test06']={} : exports);
