var nsynjs = require('../../nsynjs');

var synchronousCode = function (readFile) {
    var config;

    var getConfig = function() {
        if( !config )
            config = JSON.parse(readFile(synjsCtx, 'config.json', "utf8").data);

        return config;
    };
    return {
        getName: function () {
            return getConfig().name;
        }
    };
};

var readFile = require('../../wrappers/nodeFs').readFile;
nsynjs.run(synchronousCode,{},readFile,function (m) {
    module.exports = m;
});