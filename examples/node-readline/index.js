/**
 * Created by amax on 6/2/2017.
 */

var textFile = require('../../wrappers/nodeReadline').textFile;
var wait = require('../../wrappers/nsynWait').nsynWait;
var nsynjs = require('../../nsynjs');

function process(textFile,wait) {
    var fh = new textFile();
    fh.open('../data/lorem.txt');
    var s, i = 0;
    while (typeof(s = fh.readLine(nsynjsCtx).data) != 'undefined')
    {
        if(s)
            console.log(s);
        else
            console.log("<empty line>");
        wait(nsynjsCtx,1000);
    }
    fh.close();
}

var ctx = nsynjs.run(process,{},textFile,wait,function () {
    console.log('done');
});
