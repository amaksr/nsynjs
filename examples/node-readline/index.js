/**
 * Created by amax on 6/2/2017.
 */

var textFile = require('../../wrappers/nodeReadline').textFile;
var nsynjs = require('../../nsynjs');

function process(textFile) {
    var fh = new textFile();
    fh.open('../data/lorem.txt');
    var s, i = 0;
    while (typeof(s = fh.readLine(synjsCtx).data) != 'undefined')
    {
        if(s)
            console.log(s);
        else
            console.log("<empty line>");
    }
    fh.close();
}

var ctx = nsynjs.run(process,{},textFile,function () {
    console.log('done');
});
