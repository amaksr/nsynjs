/**
 * Created by amaksr on 6/2/2017.
 */

/**
 * Cancellable wrapper for mysql#connection#query (node)
 * Returns object with following properties
 * - 'data' set to content result set in case of success
 * - 'error' set to error in case of failure
 * - 'fields' set to list of fileds from the query
 *
 * Triggers exception in nsynjs-executed caller in case if error is set
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {Object} connection Object, created by mysql.createConnection
 * @param {String} sql SQL query to execute
 * @param {Array} params Parameters of SQL query
 * @param {Boolean} allowDestroy Whether to use connection.destroy() when stop is requested
 * @returns {Object} query results
 * @throws {Exception}
 */

exports.query = function (ctx, connection, sql, params, allowDestroy) {
    var res={};
    var isStopped = false;

    connection.query(sql, params, function (error, data, fields) {
        res.error = error;
        res.data = data;
        res.fields = fields;
        if(!isStopped)
            ctx.resume(error);
    });

    ctx.setDestructor(function () {
        isStopped = true;
        if(allowDestroy)
            connection.destroy();
        else
            connection.end();
    });


    return res;
};
exports.query.nsynjsHasCallback = true;