var wait = function (ctx, ms) {
    var res = {done: false};
    setTimeout(function () {
        res.done = true;
        ctx.resume();
    }, ms);
    return res;
};
wait.synjsHasCallback = true;

var myFunc = function (trace) {
    var myObj = function (id,name) {
        this.id = id;
        this.name = name;
        this.getId = function () {
            return this.id;
        }
    };
    myObj.prototype.toString = function () {
        return "myObj:"+this.name+","+this.id;
    };

    var o1 = new myObj;
    var o2 = new myObj();
    var o3 = new myObj(3,'John');

    console.log(['step 230',o1.toString(),o2.toString(),o3.toString(),o3.getId()]);
};

nsynjs.run(myFunc,{},11,22,33,function (r) {
    console.log('Done',r);
});

