var nsynjs = require('../../nsynjs');

var synchronousCode = function (wrappers) {
    var config;

    // constructor of MyObject
    var MyObject = function(fileName) {
        this.data = JSON.parse(wrappers.readFile(synjsCtx, fileName).data);
    };
    MyObject.prototype.getData = function () {
        return this.data;
    };
    return MyObject;
};

var wrappers = require('./wrappers');
nsynjs.run(synchronousCode,{},wrappers,function (m) {
    module.exports = m;
});