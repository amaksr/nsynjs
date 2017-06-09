/**
 * Created by amaksr on 12/13/2016.
 */

var nsynjs = require('./nsynjs');

var wait = function (ctx, ms) {
    var res = {done: false};
    setTimeout(function () {
        res.done = true;
        ctx.resume();
    }, ms);
    return res;
};
wait.nsynjsHasCallback = true;

var wrappers = {
    wait: wait,
};

var myFunc = function(wrappers) {
    console.log("date at start:"+new Date());
    console.log("waiting 5 sec...");
    wrappers.wait(nsynjsCtx,5000);
    console.log("5 sec later  :"+new Date());
    return 123;
};

nsynjs.run(myFunc,{},wrappers,function (r) {
    console.log('Done',r);
});
