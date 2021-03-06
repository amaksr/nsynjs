/**
 * Created by amaksr on 5/19/2017.
 *
 */

exports.process = function(env) {
    var query = env.query;
    var conn    = env.connection;

    // drop table, it may not exist
    console.log('dropping table');
    try {
        query(nsynjsCtx, conn, 'drop table syn_users');
    }
    catch (e) {
        console.log('cannot drop table: ',e);
    }

    try {
        console.log('creating table');
        query(nsynjsCtx, conn, 'create table syn_users (' +
            'id int,' +
            'name varchar(255),' +
            'primary key(id)' +
            ')');

        console.log('inserting records');
        for(var i=0; i<10000; i++) {
            query(nsynjsCtx, conn, 'insert into syn_users (id,name) values (?,?)',[i,Math.random()]);
        }
    }
    catch (e) {
        console.log(e);
    }
};



