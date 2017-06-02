/**
 * Created by amaksr on 5/19/2017.
 *
 * please run:
 *
 * npm install mysql
 * node inser10k
 */

global.nsynjs     = require('../../nsynjs');
var mysql      = require('mysql');
var nodeMysqlConn = require('../../wrappers/nodeMysqlConn');

var connection = mysql.createConnection({
    connectionLimit : 1,
    host     : 'localhost',
    user     : 'tracker',
    password : 'tracker123',
    database : 'tracker'
});

var logic = require('./insert10k-logic');

var env = {
    connection: connection,
    query: nodeMysqlConn.query,
};

nsynjs.run(logic.process,null,env,function () {
    console.log('disconnecting');
    env.connection.end();
    console.log('done');
});


