/**
 * Created by amaksr on 5/13/2017.
 */

function process() {
    var log = $('#log');

    var cache={};
    function getCachedAjax(url) {
        if(!cache[url]) {
            try {
                log.append("<div>Cache MISS for "+url+", calling ajax...</div>");
                var el = jQueryGetJSON(synjsCtx, url);
                cache[url] = el;
                nsynWait(synjsCtx,500);
            }
            catch (ex) {
                log.append("<div>Error: "+ex.statusText+"</div>");
            }
        }
        else
            log.append("<div>Cache HIT for "+url+"</div>");
        return cache[url];
    };


    log.append("<div>Started...</div>");
    var data = jQueryGetJSON(synjsCtx, "data/index.json").data;
    log.append("<div>Length: "+data.length+"</div>");
    for(var i=0; i<10; i++) {
        log.append("<div>Step:"+i+"</div>");
        var j = Math.floor(Math.random()*data.length);
        var url = "data/"+data[j];
        var el = getCachedAjax(url);
        if(el)
            log.append("<div>Step:"+i+", Url:"+url+", Got:"+el.data.descr+","+"</div>");
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