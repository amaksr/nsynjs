/**
 * Created by amaksr on 6/2/2017.
 */

/**
 * Cancellable wrapper for setTimeout (node and browser)
 * Delays execution of nsynjs-executed caller by given number of milliseconds
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {Number} milliseconds
 */
function nsynWait(ctx, milliseconds) {
    var timeoutId = setTimeout(function () {
        ctx.setDestructor(null);
        ctx.resume();
    }, milliseconds);
    ctx.setDestructor(function () {
        clearTimeout(timeoutId);
    });
};
nsynWait.synjsHasCallback = true;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    exports.nsynWait = nsynWait;
};
