var nsynjs = require('../../nsynjs');

var synchronousCode = function (readFile) {
    var config;

    // constructor of MyObject
    var MyObject = function(fileName) {
        this.data = JSON.parse(readFile(nsynjsCtx, fileName, "utf8").data);
    };
    MyObject.prototype.getData = function () {
        return this.data;
    };
    return MyObject;
};

var readFile = require('../../wrappers/nodeFs').readFile;
nsynjs.run(synchronousCode,{},readFile,function (m) {
    module.exports = m;
});