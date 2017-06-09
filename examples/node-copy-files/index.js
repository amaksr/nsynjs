/**
 * Created by amaksr on 6/5/2017.
 */

var nsynjs = require('../../nsynjs');
var nsynFs = require('../../wrappers/nodeFs');

function process(nsynFs) {
    var copy = function (src,dst) {
        if(nsynFs.lstat(nsynjsCtx, src).data.isDirectory()) {
            var files = nsynFs.readdir(nsynjsCtx, src).data;
            nsynFs.mkdir(nsynjsCtx,dst);
            for(var i=0; i<files.length; i++) {
                var f=files[i];
                console.log(f);
                copy(src+"/"+f, dst+"/"+f);
            }
        }
        else { // is File
            var input = nsynFs.open(nsynjsCtx,src,'r').data;
            var output = nsynFs.open(nsynjsCtx,dst,'w').data;
            var buf = Buffer.alloc(4096);
            while(true) {
                var readCnt = nsynFs.read(nsynjsCtx,input,buf,0,4096,null).data;
                if(!readCnt)
                    break;
                nsynFs.write(nsynjsCtx,output,buf,0,readCnt,null);
            }
            nsynFs.close(nsynjsCtx,input);
            nsynFs.close(nsynjsCtx,output);
        }
    };

    copy("test1","test2");
}

var ctx = nsynjs.run(process,{},nsynFs,function () {
    console.log('done');
});
