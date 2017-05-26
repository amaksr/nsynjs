/**
 * Created by amaksr on 5/19/2017.
 */

exports.dbQuery = function (ctx,conn,sql,params) {
    var res={};

    conn.query(sql, params, function (error, data, fields) {
        res.error = error;
        res.data = data;
        ctx.resume(error);
    });

    return res;
};
exports.dbQuery.synjsHasCallback = true;