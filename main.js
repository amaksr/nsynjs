var wait = function (ctx, ms) {
    var res = {done: false};
    setTimeout(function () {
        res.done = true;
        ctx.resume();
    }, ms);
    return res;
};
wait.nsynjsHasCallback = true;

var myFunc = function (trace) {
    var O = [function() {    }];
    var o = new O[0]();
    console.log(o);
};

nsynjs.run(myFunc,{},[],function (r) {
    console.log('Done',r);
});

