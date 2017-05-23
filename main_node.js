/**
 * Created by amaksr on 12/13/2016.
 */

global.nsynjs = global.nsynjs || require('./nsynjs');

var wait = function (ctx, ms) {
    var res = {done: false};
    setTimeout(function () {
        res.done = true;
        ctx.resume();
    }, ms);
    return res;
};
wait.synjsHasCallback = true;

var wrappers = {
    wait: wait,
};

var myFunc = function(wrappers) {
    console.log("date at start:"+new Date());
    console.log("waiting 5 sec...");
    wrappers.wait(synjsCtx,5000);
    console.log("5 sec later  :"+new Date());
};

nsynjs.run(myFunc,{},wrappers,function (r) {
    console.log('Done');
});
