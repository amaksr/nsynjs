[![Build Status](https://travis-ci.org/amaksr/nsynjs.svg?branch=master)](https://travis-ci.org/amaksr/nsynjs)

# nsynjs #

Nsynjs is JavaScript execution engine + state machine that allows to write javascript code without callbacks,
and execute it in synchronous manner.

Nsynjs has following unique features:

- Pseudo-threads that are executed synchronously and that can be gracefully stopped,
- Asynchronous _new_ operator,
- No compilation or transpilation required,
- No need to mark functions with '*', _async_ or _await_ keywords,
- Not dependant on promises.
- Compatible with nodejs and all browsers, including Internet Explorer.

Nsynjs is written in ES2015 and does not require any dependencies.

It supports most of the features of ES2015, but with some limitations (see below).

## How it works ##

It accepts function pointer as an input parameter, and performs following:

- It parses code of input function, and builds a few internal structures, such as:
    - an internal tree structure of operators and expressions, that represents code of input function,
    - hash array with local variables names, that were defined in input function using _var_ statement,

- It "compiles" each operator and expression by 
    - modifying source of operator by changing references to local variables
    - creating internal function that contain modified code

- It creates execution context that contains local variables, execution stack with program counters, and other information,
 that is necessary in order to represent the latest state, and to stop and resume execution. 

- It executes structure of operators (code) against execution context (data).

With nsynjs you can write code like this:

```javascript
    var i=0;
    while(i<5) {
        wait(1000); // <<-- long-running function with callback
        console.log(i, new Date());
        i++;
    }
```
    
Or like this:

```javascript
    function getStats(userId) {
        var res;
        try {
            res = { // <<-- expression with few long-running functions, evaluated one after another
                friends: dbQuery("select * from firends where user_id = "+userId).data,
                comments: dbQuery("select * from comments where user_id = "+userId).data,
                likes: dbQuery("select * from likes where user_id = "+userId).data,
            }
        }
        catch(e) {
            res = {
                error: e
            }
        }
        return res;
    }
```

## How to start ##

### Step 1. Get nsynjs ###

In Node.JS:

    npm install nsynjs

    global.nsynjs = global.nsynjs || require('nsynjs');
    
In browser:
    
    <script src="nsynjs.js"></script>

### Step 2. Wrap all functions with callbacks into nsynjs-aware wrappers ###

There are many functions out there that return results via callbacks. In order to use them in your nsynjs-executed code you just need to wrap them,
so they would be able to post results of callback back to nsynjs, and resume execution of nsynjs engine.

All nsynjs-aware wrapper should generally do following:
- Accept reference to a current pseudo-thread as a parameter (e.g. *ctx*).
- Call wrapped function
- Return an object, and assign results of the callback to some properties of that object.
- Call ctx.resume() in th callback of wrapped fucntion, so caller pseudo-thread will continue execution.
- Set destructor function, that will be called in order to cancel long-running function.
All nsynjs-aware wrapper should have 'synjsHasCallback' property set to true.

Here is an example of simple wrapper to setTimeout:
```javascript
    var wait = function (ctx, ms) {
        setTimeout(function () {
            ctx.resume(); // <<-- resume execution of nsynjs pseudo-thread, referred by ctx
        }, ms);
    };
    wait.synjsHasCallback = true; // <<-- indicates that nsynjs should stop and wait when calling this function
```
    
Example of wrapper to setTimeout, that will be gracefully stopped in case if pseudo-thread is stopped:
 
```javascript
    var wait = function (ctx, ms) {
        var res = {};
        var timeoutId = setTimeout(function () {
            console.log('firing timeout');
            ctx.resume();
        }, ms);
        ctx.setDestructor(function () { // <<-- this function will be called in case if pseudo-thread is requested to stop
            console.log('clear timeout');
            clearTimeout(timeoutId);
        });
        return res;
    };
    wait.synjsHasCallback = true;
```


Example of wrapper to jQuery's getJSON, that can return data or throw an exception back to nsynjs-executed code:
```javascript
    var ajaxGetJson = function (ctx,url) {
        var res = {}; // <<-- results will be posted back to nsynjs via method to this object
        var ex; // <<-- possible exception
        $.getJSON(url, function (data) {
            res.data = data; // <<-- capture data from callback, or
        })
        .fail(function(e) {
            ex = e; // <<-- capture exception
        })
        .always(function() {
            ctx.resume(ex); // <<-- resume pseudo-thread
        });
        return res;
    };
    ajaxGetJson.synjsHasCallback = true; // <<-- indicates that nsynjs should stop and wait on evaluating this function
```

### Step 3. Write your synchronous code ###

Put your synchronous code into function:

```javascript
    function myTestFunction1() {
        var i=0;
        
        while(i<5) {
            wait(synjsCtx,1000); // <<-- reserved variable synjsCtx is a reference to current pseudo-thread
            console.log(res, new Date());
            i++;
        }
        return "myTestFunction1 finished";
    }

```

### Step 4. Execute it ###

Execute your function via nsynjs engine:

    nsynjs.run(myTestFunction1,null, function (ret) {
        console.log('done all:', ret);
    });

The result will look like this:

<pre>
i=0 Sun Dec 25 2016 12:25:41 GMT-0700 (Mountain Standard Time)
i=1 Sun Dec 25 2016 12:25:42 GMT-0700 (Mountain Standard Time)
i=2 Sun Dec 25 2016 12:25:43 GMT-0700 (Mountain Standard Time)
i=3 Sun Dec 25 2016 12:25:44 GMT-0700 (Mountain Standard Time)
i=4 Sun Dec 25 2016 12:25:45 GMT-0700 (Mountain Standard Time)
done all: myTestFunction1 finished
</pre>

## nsynjs Reference ##

var ctx = **nsynjs.run(myTestFunction1,obj, param1, param2 [, param3 etc], callback)** _(function, to be called to execute function synchronously)_

Parameters:
- myTestFunction1: pointer to a function that needs to be executed synchronously
- obj: some object that will be accessed via "this" in myTestFunction1 (could be null)
- param1, param2, etc - any number of parameters
- callback: some function to call once myTestFunction1 is finished.

Returns:
- pseudo-thread execution context

### Pseudo-thread execution context reference ###

Pseudo-thread execution context is available inside nsynjs-executed code via predefined variable **synjsCtx**.

#### For use inside nsynjs-aware wrapper functions ####

**ctx.resume** _([exception])_

Wrapper function should always call this to indicate that all callbacks are done, and that pseudo-thread may continue.

- _exception_: optional exception to be thrown back to nsynjs-executed code

**ctx.setDestructor** _(func)_

Set destructor function, that will be called if pseudo-therad is terminated.

- _func_: function that will do the cleanup (e.g. abort pending XHR request, or call to cleanTimeout)

## Supported JS features ##
- var
- if ... then ... [else...]
- while
- do ... while
- for(;;)
- for(var ;;)
- for(.. in ..)
- for(var .. in ..)
- switch
- break [label]
- continue [label]
- return
- try ... catch
- throw
- typeof
- closures

#### Not supported ####
- const
- let
- for ... of
- expr1 ? expr2 : expr3
- arrow functions

## Other limitations ##

1. Operators that are executed via nsynjs should all be separated with semicolon.

2. Nsynjs is not able to execute native functions with callbacks, such as Array.map. But in many cases
 this can be done by running polyfills via nsynjs. Please see 'browser-array-map-polyfill.html' for an example.

## Under the hood ##

When some function is executed via **nsynjs.run(_someFunc_,...)**, nsynjs will check if **_someFunc.synjsBin_** property exists.
This property holds tree-like structure that represents the code of **_someFunc_**, an is required for nsynjs to run.
This parsing/compiling is done only once per function pointer.

Whe nsynjs parses code of function, it also parses all nested function definitions. These nested functions would
have stub body but valid **_someFunc.synjsBin_** property, as they intended to fail if called directly.
Instead, they should only be called from nsynjs-executed code.

When nsynjs executes code and encounters some function call, it checks what type of function is called. There could be 3 types:

- function with **_someOtherFunc.synjsBin_** property defined: these functions executed in synchronous manner by nsynjs.
- function without **_someOtherFunc.synjsBin_** property defined
    - With  **_someOtherFunc.synjsHasCallback_** property defined: this means that someOtherFunc is nsynjs-aware wrapper,
    so nsynjs should stop and wait untill ctx.resume() is called by wrapper.
    - Without  **_someOtherFunc.synjsHasCallback_** property defined: these functions are executed immediately.

## Performance considerations ##

Nsynjs tries to optimize internal structure by packing as many elements as possible into each internal function.
For example, consider following code:
```javascript
    for(i=0; i<arr.length; i++) {
        res += arr[i];
    }
```
    
Since it does not have any function calls in it, it will be packed into one internal function:
```javascript
    this.execute = function(state) {
        for(state.localVars.i=0; state.localVars.i<arr.length; state.localVars.i++) {
            state.localVars.res += state.localVars.arr[state.localVars.i];
        }
    }
```
This function will be executed almost as fast as native code.

However, if some function is called inside this code, there is generally no way to find out type of that function
at compile time, therefore nsynjs will evaluate such expressions one piece at a time.
 
For example, following code will not be optimized:

    var n = Math.random()
    
It will be split into following internal functions:

    this.execute = function(state) {
        return Math
    }
    ..
    this.execute = function(state,prev) {
        return prev.random
    }
    ..
    this.execute = function(state,prev) {
        return prev()
    }
    ..
    this.execute = function(state,prev, v) {
        return state.localVars.n = v
    }
    
