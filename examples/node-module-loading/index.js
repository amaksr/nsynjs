var nsynjs = require('../../nsynjs');

function synchronousApp(modules) {
	var user = require.main.require( './user' );
	var greeter = require.main.require( './greeter' );

    try {
        console.time('time');
        greeter.say('Hello', user);
        greeter.say('Bye', user);
        console.timeEnd('time');
    }
    catch(e) {
        console.log('error',e);
    }
}

nsynjs.run(synchronousApp,null,function () {
		console.log('done');
});
