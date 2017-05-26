var nsynjs = require('../../nsynjs');
var modules = {
    MyObject: require('./MyObject')
};

function synchronousApp(modules) {
    try {
        var myObjectInstance1 = new modules.MyObject('data1.json');
        var myObjectInstance2 = new modules.MyObject('data2.json');

        console.log(myObjectInstance1.getData());
        console.log(myObjectInstance2.getData());
    }
    catch (e) {
        console.log("Error",e);
    }
}

nsynjs.run(synchronousApp,null,modules,function () {
		console.log('done');
});
