/**
 * Created by amaksr on 5/13/2017.
 */

function process() {
    var log = $('#log');
    log.append("<div>Started...</div>");
    try {
        var data = jQueryGetJSON(nsynjsCtx, "data/index.json").data;
    }
    catch (e) {
        console.log("error getting data/index.json:", e.statusText);
        data = [];
    }
    log.append("<div>Length: "+data.length+"</div>");
    for(k=0; k<200; k++)
        for(var i in data) {
            log.append("<div>"+i+", "+data[i]+"</div>");
            try {
                var el = jQueryGetJSON(nsynjsCtx, "data/"+data[i]);
                log.append("<div>"+el.data.descr+","+"</div>");
            }
            catch (ex) {
                log.append("<div>Error: "+ex.statusText+"</div>");
            }
            console.log('i=',i);
            nsynWait(nsynjsCtx,1);
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