var nsynjs = require('../../nsynjs');

var synchronousCode = function (wrappers) {
    var config;

    var getConfig = function() {
        if( !config )
            config = JSON.parse(wrappers.readFile(synjsCtx, 'config.json').data);

        return config;
    };
    return {
        getName: function () {
            return getConfig().name;
        }
    };
};

var wrappers = require('./wrappers');
nsynjs.run(synchronousCode,{},wrappers,function (m) {
    module.exports = m;
});