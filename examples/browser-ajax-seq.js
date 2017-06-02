/**
 * Created by amaksr on 5/13/2017.
 */

function process() {
    var log = $('#log');
    log.append("<div>Started...</div>");
    var data = jQueryGetJSON(synjsCtx, "data/index.json").data;
    log.append("<div>Length: "+data.length+"</div>");
    for(k=0; k<200; k++)
        for(var i in data) {
            log.append("<div>"+i+", "+data[i]+"</div>");
            try {
                var el = jQueryGetJSON(synjsCtx, "data/"+data[i]);
                log.append("<div>"+el.data.descr+","+"</div>");
            }
            catch (ex) {
                log.append("<div>Error: "+ex.statusText+"</div>");
            }
            console.log('i=',i);
            nsynWait(synjsCtx,1);
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