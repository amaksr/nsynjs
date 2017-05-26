var nsynjs = require('../../nsynjs');

var synchronousCode = function(){
    return {
        say: function ( greeting , user ){
            console.log( greeting + ', ' + ( user.getName() ) + '!' )
        }
    };
};

nsynjs.run(synchronousCode,{},function (m) {
    module.exports = m;
});