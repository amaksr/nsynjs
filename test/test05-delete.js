/**
 * Created by amaksr on 5/8/2017.
 */

(function(exports){
    var steps = function () {
        return [
            function (trace) {
                var aaa={
                    a:123,
                    b:456,
                    c:789
                };
                var d1=delete(aaa.a);
                var d2=delete aaa.b;
                return [d1,d2,aaa];
            },
            function (trace, a, b) {
                var x=123;
                var d1=delete x;
                var d2=delete a;
                return [x,a,b,d1,d2];
            },
            function (trace) {
                var aaa=[5,8,91,11,29,1,52,-3,0];
                var d1=delete(aaa[1]);
                var d2=delete aaa[2];
                return [aaa,d1,d2];
            }
        ];
    };
    exports.steps = steps;
})(typeof exports === 'undefined'? this['test05']={} : exports);
