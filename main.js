var wait = function (ctx, ms) {
    var res = {done: false};
    setTimeout(function () {
        res.done = true;
        ctx.resume();
    }, ms);
    return res;
};
wait.synjsHasCallback = true;

var myFunc = function() {
    document.getElementById('my').innerHTML+="<p>date at start:"+new Date()+"</p>";
    document.getElementById('my').innerHTML+="<p>waiting 5 sec...</p>";
    wait(synjsCtx,5000);
    document.getElementById('my').innerHTML+="<p>5 sec later  :"+new Date()+"</p>";
};

nsynjs.run(myFunc,{},11,22,33,function (r) {
    console.log('Done');
});

