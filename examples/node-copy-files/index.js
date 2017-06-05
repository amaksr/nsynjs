/**
 * Created by amaksr on 6/5/2017.
 */

var nsynjs = require('../../nsynjs');
var nsynFs = require('../../wrappers/nodeFs');

function process(nsynFs) {
    var copy = function (src,dst) {
        if(nsynFs.lstat(synjsCtx, src).data.isDirectory()) {
            var files = nsynFs.readdir(synjsCtx, src).data;
            nsynFs.mkdir(synjsCtx,dst);
            for(var i=0; i<files.length; i++) {
                var f=files[i];
                console.log(f);
                copy(src+"/"+f, dst+"/"+f);
            }
        }
        else { // is File
            var input = nsynFs.open(synjsCtx,src,'r').data;
            var output = nsynFs.open(synjsCtx,dst,'w').data;
            var buf = Buffer.alloc(4096);
            while(true) {
                var readCnt = nsynFs.read(synjsCtx,input,buf,0,4096,null).data;
                if(!readCnt)
                    break;
                nsynFs.write(synjsCtx,output,buf,0,readCnt,null);
            }
            nsynFs.close(synjsCtx,input);
            nsynFs.close(synjsCtx,output);
        }
    };

    copy("test1","test2");
}

var ctx = nsynjs.run(process,{},nsynFs,function () {
    console.log('done');
});
