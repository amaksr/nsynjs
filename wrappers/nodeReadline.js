/**
 * Created by amaksr on 6/2/2017.
 */

var readline = require('readline');
var fs = require('fs');

/**
 * Cancellable wrapper class for readline (node)
 */
/**
 * Constructor for line textFile object
 */
var textFile = function() {
    this.buf = [];
    this.dataRequested = false;
};

/**
 * Open text file
 * @param name
 */
textFile.prototype.open = function (name) {
    this.name = name;
    var _this=this;
    this.fs = fs.createReadStream(name)
        .on('error',function (error) {
            _this.error(error)
        })
        .on('close',function () {
            if(_this.dataRequested)
                _this.ctx.resume();
        });
    this.iFace = readline.createInterface({
        input: this.fs,
    });
    var _this = this;
    this.iFace.on('line',function (line) {
        _this.buf.push(line);
        _this.iFace.pause();
        if(_this.dataRequested) {
            _this.dataRequested = false;
            _this.res.data = _this.buf.shift();
            _this.ctx.resume();
        }
    });
    this.iFace.pause();
};

textFile.prototype.error = function (error) {
    this.ctx.resume(error);
};

/*
 * read line
 * @param {State} ctx refernce to nsynjs-executed caller context
 */
textFile.prototype.readLine = function (ctx) {
    this.res = {};
    this.ctx = ctx;
    if(this.buf.length) {
        this.res.data = this.buf.shift();
        ctx.setDoNotWait(true);
        return this.res;
    };
    var _this=this;
    ctx.setDestructor(function () {
        _this.iFace.close();
    });
    this.dataRequested = true;
    this.iFace.resume();
    return this.res;
};
textFile.prototype.readLine.synjsHasCallback = true;

/**
 * close text file
 */
textFile.prototype.close = function () {
    this.iFace.close();
    this.buf = [];
};

exports.textFile = textFile;