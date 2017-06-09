/**
 * Created by amaksr on 5/8/2017.
 */

(function(exports){
    var steps = function () {
        return [
            function (trace, paramA, paramB) {
                if(typeof(fetch) === 'undefined')
                    return false;

                var url = 'https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js';
                var len = 83095;
                if(typeof(nsynjsCtx)==='undefined')
                    return len;

                try {
                    return window.fetch(url).data.text().data.length;
                }
                catch (e) {
                    return e;
                }
            },
            function (trace, paramA, paramB) {
                if(typeof(fetch) === 'undefined')
                    return false;

                var ExternalFile = function (url) {
                    this.url = url;
                    try {
                        this.text = window.fetch(url).data.text().data;
                    }
                    catch (e) {
                        this.text = "--error--";
                    }
                };

                var url = 'https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js';
                var len = 83095;

                if(typeof(nsynjsCtx)==='undefined')
                    return len;

                var ef = new ExternalFile(url);
                return ef.text.length;
            },
            function (trace, paramA, paramB) {
                if(typeof(fetch) === 'undefined')
                    return false;

                var ExternalFile = function (url) {
                    this.url = url;
                    var resp;
                    try {
                        resp = window.fetch(url).data;
                        this.status = resp.status;
                    }
                    catch (e) {
                        this.error = e;
                    }
                };

                var url = 'https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/SOME_NON_EXISTENT_FILE.min.js';

                if(typeof(nsynjsCtx)==='undefined')
                    return 404;

                var ef = new ExternalFile(url);
                return ef.status;
            },
        ];
    };
    exports.steps = steps;
})(typeof exports === 'undefined'? this['test07']={} : exports);
