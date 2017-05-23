/**
 * Created by amaksr on 5/13/2017.
 */

/* wrapper for setTimeout */
var wait = function (ctx, ms) {
    var res = {done: false};
    var timeoutId = setTimeout(function () {
        console.log('firing timeout');
        ctx.setDestructor(null);
        ctx.resume();
    }, ms);
    ctx.setDestructor(function () {
        console.log('clear timeout');
        clearTimeout(timeoutId);
    });
    return res;
};
wait.synjsHasCallback = true;

/* wrapper for ajax get*/
var ajaxGetJson = function (ctx,url) {
    var res = {};
    var ex;
    $.getJSON(url, function (data) {
        res.data = data;
    })
    .fail(function(e) {
        ex = e;
    })
    .always(function() {
        ctx.resume(ex);
    });
    return res;
};
ajaxGetJson.synjsHasCallback = true;

function process() {
    var log = $('#log');
    log.append("<div>Started...</div>");
    var data = ajaxGetJson(synjsCtx, "data/index.json").data;
    log.append("<div>Length: "+data.length+"</div>");
    for(var i in data) {
        log.append("<div>"+i+", "+data[i]+"</div>");
        try {
            var el = ajaxGetJson(synjsCtx, "data/"+data[i]);
            log.append("<div>"+el.data.descr+","+"</div>");
        }
        catch (ex) {
            log.append("<div>Error: "+ex.statusText+"</div>");
        }
        wait(synjsCtx,1000);
    }
    log.append('Done');
}

var ctx;
function btnRunClicked() {
    ctx = nsynjs.run(process,this,function (r) {
    });
}

function btnStopClicked() {
    ctx.stop();
}