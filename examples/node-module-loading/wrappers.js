var fs=require('fs');
exports.readFile = function (ctx,name) {
	console.log("reading config");
    var res={};
	fs.readFile( name, "utf8", function( error , configText ){
		if( error ) res.error = error;
		res.data = configText;
		ctx.resume(error);
	} );
    return res;
};
exports.readFile.synjsHasCallback = true;
