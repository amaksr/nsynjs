/**
 * Created by amaksr on 5/13/2017.
 */

/* wrapper for setTimeout */
var wait = function (ctx, ms) {
    var res = {done: false};
    var timeoutId = setTimeout(function () {
        console.log('firing timeout');
        ctx.setDestructor(null);
        ctx.resume(); // callback is finished, resume execution of caller
    }, ms);
    ctx.setDestructor(function () { // this will be called once caller function is interrupted
        console.log('clear timeout');
        clearTimeout(timeoutId); // in case of stop, cancel timeout to prevent callback
    });
    return res;
};
wait.synjsHasCallback = true; // let nsynjs know that this function
    // is slow, and that it needs to wait for callback to finish

/* wrapper for ajax getJSON */
var ajaxGetJson = function (ctx,url) {
    var res = {};
    var ex;
    var isStopped=false;
    var xhr = $.getJSON(url, function (data) {
        res.data = data;
    })
    .fail(function(e) {
        ex = e;
    })
    .always(function() {
        if(!isStopped) // ignore all callbacks issued by jQuery after aborting
            ctx.resume(ex);  // callback is finished, resume execution of caller
    });
    ctx.setDestructor(function () {  // this will be called once caller function is interrupted
        console.log('xhr.abort');
        isStopped=true;
        xhr.abort(); // cancel underlying request
    });
    return res;
};
ajaxGetJson.synjsHasCallback = true; // let nsynjs know that this function
    // is slow, and that it needs to wait for callback to finish

function process() {
    var log = $('#log');
    log.append("<div>Started...</div>");
    var data = ajaxGetJson(synjsCtx, "data/index.json").data;
    log.append("<div>Length: "+data.length+"</div>");
    for(k=0; k<200; k++)
        for(var i in data) {
            log.append("<div>"+i+", "+data[i]+"</div>");
            try {
                var el = ajaxGetJson(synjsCtx, "data/"+data[i]);
                log.append("<div>"+el.data.descr+","+"</div>");
            }
            catch (ex) {
                log.append("<div>Error: "+ex.statusText+"</div>");
            }
            console.log('i=',i);
            wait(synjsCtx,1);
        }
        log.append('Done');
}

var ctx;
function btnRunClicked() {
    ctx = nsynjs.run(process,this,function (r) {
        console.log('done');
    });
}

function btnStopClicked() {
    ctx.stop();
}