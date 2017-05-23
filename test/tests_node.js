/**
 * Created by amaksr on 5/27/2016.
 */

global.nsynjs = global.nsynjs || require('../nsynjs');

var test00 = require('./test00-operators');
var test01 = require('./test01-basicOperations');
var test02 = require('./test02-tryCatch');
var test03 = require('./test03-closure');
var test04 = require('./test04-array');
var test05 = require('./test05-delete');

var testModules = [test00, test01, test02, test03, test04, test05];
var tm=0, s=0;

runTest();

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
        if(JSON.toString(actualRes) != JSON.toString(expectedRes)
            || JSON.toString(actualTrace) != JSON.toString(expectedTrace)
        ) {
            console.log('---------- Expected Result -------------');
            console.log(JSON.toString(expectedRes));
            console.log('---------- Actual Result -------------');
            console.log(JSON.toString(actualResRes));
            console.log('---------- Expected Trace -------------');
            console.log(JSON.toString(expectedTrace));
            console.log('---------- Actual Trace -------------');
            console.log(JSON.toString(actualTrace));
            process.exit(1);
        }
        if(nextTest())
            setTimeout(function () {
                runTest(resolve,reject);
            },20);
        else {
            console.log('all done');
            process.exit(0);
        }
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
