/**
 * Created by amaksr on 5/27/2016.
 */

QUnit.test("nsynjs", function( assert ) {
    var thenable = new Promise(function (resolve, reject) {
        setTimeout(function () {
            runTest(resolve,reject);
        },100);
    });
    return thenable;
});

var testModules = [test00, test01, test02, test03, test04, test05, test06];
var tm=0, s=0;
function runTest(resolve,reject) {
    var testMod = testModules[tm];
    var steps = testMod.steps();
    var step = steps[s];

    var MyClass = function (a,b) {
        this.a = a;
        this.b = b;
    };
    var myObj  = new MyClass('A','B');
    myObj.step = step;

    // capture native run results
    var expectedTrace = [];
    var expectedRes = myObj.step(expectedTrace,53,53);

    // capture nsynjs run results
    var actualTrace = [];
    nsynjs.run(step,myObj,actualTrace,53,53,function (actualRes) {
        console.log('Done');
        deepEqual(actualRes,expectedRes,"module:"+tm+",step:"+s);
        deepEqual(actualTrace,expectedTrace);
        if(nextTest())
            setTimeout(function () {
                runTest(resolve,reject);
            },20);
        else
            resolve("OK");
    });
}

function nextTest() {
    console.log("mod/step",tm,s);
    var testMod = testModules[tm];
    if(++s >= testMod.steps().length) {
        s=0;
        if(++tm >= testModules.length)
            return false;
    }
    return true;
}


