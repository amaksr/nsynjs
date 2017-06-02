/**
 * Created by amksr on 6/2/2017.
 */

/**
 * Cancellable wrapper for jQuery.getJSON (browser)
 * Retrieves URL as JSON and returns it as an object
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} url URL to retrieve
 */

function jQueryGetJSON(ctx,url) {
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
jQueryGetJSON.synjsHasCallback = true; // let nsynjs know that this function
                // is slow, and that caller needs to wait for callback to finish

