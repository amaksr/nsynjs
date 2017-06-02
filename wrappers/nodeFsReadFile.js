/**
 * Created by amaksr on 6/2/2017.
 */

var fs=require('fs');

/**
 * Wrapper for fs.readFile (node)
 * Returns object with following properties
 * - 'data' set to content of the file in case of success
 * - 'error' set to error in case of failure
 *
 * Triggers exception in nsynjs-executed caller in case if error is set
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} fileName
 * @returns {Object} file content
 * @throws {Exception}
 */
exports.readFile = function (ctx,fileName) {
    var res={};
    fs.readFile( fileName, "utf8", function( error , data ){
        if( error ) res.error = error;
        res.data = data;
        ctx.resume(error);
    } );
    return res;
};
exports.readFile.synjsHasCallback = true;
