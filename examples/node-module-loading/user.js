var nsynjs = require('../../nsynjs');

var synchronousCode = function (readFile) {
    var config;

    var getConfig = function() {
        if( !config )
            config = JSON.parse(readFile(synjsCtx, 'config.json').data);

        return config;
    };
    return {
        getName: function () {
            return getConfig().name;
        }
    };
};

var readFile = require('../../wrappers/nodeFsReadFile').readFile;
nsynjs.run(synchronousCode,{},readFile,function (m) {
    module.exports = m;
});