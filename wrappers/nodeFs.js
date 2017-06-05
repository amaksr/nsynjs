/**
 * Created by amaksr on 6/2/2017.
 */

var fs=require('fs');

/**
 * Wrapper for fs.appendFile (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {?} data
 * @param {Object} options
 * @throws {Exception}
 */
exports.appendFile = function (ctx, path, data, options) {
    fs.appendFile( path, data, options, function( error  ){
        ctx.resume(error);
    } );
};
exports.appendFile.synjsHasCallback = true;


/**
 * Wrapper for fs.chmod (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {?} mode
 * @throws {Exception}
 */
exports.chmod = function (ctx,path,mode) {
    fs.chmod( path, mode, function( error  ){
        ctx.resume(error);
    } );
};
exports.chmod.synjsHasCallback = true;

/**
 * Wrapper for fs.chown (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {number} uid
 * @param {number} gid
 * @throws {Exception}
 */
exports.chown = function (ctx,path,uid, gid) {
    fs.chown( path, uid, gid, function( error  ){
        ctx.resume(error);
    } );
};
exports.chown.synjsHasCallback = true;

/**
 * Wrapper for fs.fchmod (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {?} mode
 * @throws {Exception}
 */
exports.fchmod = function (ctx,path,mode) {
    fs.fchmod( path, mode, function( error  ){
        ctx.resume(error);
    } );
};
exports.fchmod.synjsHasCallback = true;



/**
 * Wrapper for fs.fchown (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {number} uid
 * @param {number} gid
 * @throws {Exception}
 */
exports.fchown = function (ctx,path,uid, gid) {
    fs.fchown( path, uid, gid, function( error  ){
        ctx.resume(error);
    } );
};
exports.fchown.synjsHasCallback = true;


/**
 * Wrapper for fs.lchmod (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {?} mode
 * @throws {Exception}
 */
exports.lchmod = function (ctx,path,mode) {
    fs.lchmod( path, mode, function( error  ){
        ctx.resume(error);
    } );
};
exports.lchmod.synjsHasCallback = true;


/**
 * Wrapper for fs.lchown (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {number} uid
 * @param {number} gid
 * @throws {Exception}
 */
exports.lchown = function (ctx,path,uid, gid) {
    fs.lchown( path, uid, gid, function( error  ){
        ctx.resume(error);
    } );
};
exports.lchown.synjsHasCallback = true;


/**
 * Wrapper for fs.link (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} existingPath
 * @param {String} newPath
 * @throws {Exception}
 */
exports.link = function (ctx,existingPath, newPath) {
    fs.link( existingPath, newPath, function( error  ){
        ctx.resume(error);
    } );
};
exports.link.synjsHasCallback = true;

/**
 * Wrapper for fs.lstat (node)
 * Returns object with following properties
 * - 'data' set to content of the stats of file
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @returns {Object} stats
 * @throws {Exception}
 */
exports.lstat = function (ctx,path) {
    var res={};
    fs.lstat( path, function( error , stats ){
        if( error ) res.error = error;
        res.data = stats;
        ctx.resume(error);
    } );
    return res;
};
exports.lstat.synjsHasCallback = true;

/**
 * Wrapper for fs.mkdir (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {number} mode
 * @throws {Exception}
 */
exports.mkdir = function (ctx,path,mode) {
    fs.mkdir( path, mode, function( error  ){
        ctx.resume(error);
    } );
};
exports.mkdir.synjsHasCallback = true;


/**
 * Wrapper for fs.mkdtemp (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} prefix
 * @param {Object} options
 * @throws {Exception}
 */
exports.mkdtemp = function (ctx, prefix, options) {
    var res={};
    fs.mkdtemp( prefix, options, function( error, folder  ){
        res.data = folder;
        ctx.resume(error);
    } );
    return res;
};
exports.mkdtemp.synjsHasCallback = true;


/**
 * Wrapper for fs.readdir (node)
 * Returns object with following properties
 * - 'data' set to content of the dir in case of success
 * - 'error' set to error in case of failure
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {Object} options
 * @returns {Object} dir content
 * @throws {Exception}
 */
exports.readdir = function (ctx,path,options) {
    var res={};
    fs.readdir( path, options, function( error , data ){
        if( error ) res.error = error;
        res.data = data;
        ctx.resume(error);
    } );
    return res;
};
exports.readdir.synjsHasCallback = true;

/**
 * Wrapper for fs.readFile (node)
 * Returns object with following properties
 * - 'data' set to content of the file in case of success
 * - 'error' set to error in case of failure
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {Object} options
 * @returns {Object} file content
 * @throws {Exception}
 */
exports.readFile = function (ctx,path,options) {
    var res={};
    fs.readFile( path, options, function( error , data ){
        if( error ) res.error = error;
        res.data = data;
        ctx.resume(error);
    } );
    return res;
};
exports.readFile.synjsHasCallback = true;


/**
 * Wrapper for fs.readlink (node)
 * Returns object with following properties
 * - 'data' set to content of the link in case of success
 * - 'error' set to error in case of failure
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {Object} options
 * @returns {Object} link content
 * @throws {Exception}
 */
exports.readlink = function (ctx,path,options) {
    var res={};
    fs.readlink( path, options, function( error , data ){
        if( error ) res.error = error;
        res.data = data;
        ctx.resume(error);
    } );
    return res;
};
exports.readlink.synjsHasCallback = true;


/**
 * Wrapper for fs.realpath (node)
 * Returns object with following properties
 * - 'data' set to content of the resolvedPath in case of success
 * - 'error' set to error in case of failure
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {Object} options
 * @returns {Object} resolvedPath content
 * @throws {Exception}
 */
exports.realpath = function (ctx,path,options) {
    var res={};
    fs.realpath( path, options, function( error , data ){
        if( error ) res.error = error;
        res.data = data;
        ctx.resume(error);
    } );
    return res;
};
exports.realpath.synjsHasCallback = true;


/**
 * Wrapper for fs.rename (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} oldPath
 * @param {String} newPath
 * @throws {Exception}
 */
exports.rename = function (ctx,oldPath, newPath) {
    fs.rename( oldPath, newPath, function( error  ){
        ctx.resume(error);
    } );
};
exports.rename.synjsHasCallback = true;


/**
 * Wrapper for fs.rmdir (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @throws {Exception}
 */
exports.rmdir = function (ctx,path) {
    fs.rmdir( path, function( error  ){
        ctx.resume(error);
    } );
};
exports.rmdir.synjsHasCallback = true;


/**
 * Wrapper for fs.stat (node)
 * Returns object with following properties
 * - 'data' set to content of the stats of file
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @returns {Object} stats
 * @throws {Exception}
 */
exports.stat = function (ctx,path) {
    var res={};
    fs.stat( path, function( error , stats ){
        if( error ) res.error = error;
        res.data = stats;
        ctx.resume(error);
    } );
    return res;
};
exports.stat.synjsHasCallback = true;


/**
 * Wrapper for fs.symlink (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} target
 * @param {String} path
 * @param {String} type
 * @throws {Exception}
 */
exports.symlink = function (ctx,target,path,type) {
    fs.symlink( target,path,type, function( error  ){
        ctx.resume(error);
    } );
};
exports.symlink.synjsHasCallback = true;


/**
 * Wrapper for fs.truncate (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {number} len
 * @throws {Exception}
 */
exports.truncate = function (ctx,path,len) {
    fs.truncate( path,len, function( error  ){
        ctx.resume(error);
    } );
};
exports.truncate.synjsHasCallback = true;


/**
 * Wrapper for fs.unlink (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @throws {Exception}
 */
exports.unlink = function (ctx,path) {
    fs.unlink( path, function( error  ){
        ctx.resume(error);
    } );
};
exports.unlink.synjsHasCallback = true;


/**
 * Wrapper for fs.utimes (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {String} atime
 * @param {String} mtime
 * @throws {Exception}
 */
exports.utimes = function (ctx, path, atime, mtime) {
    fs.utimes( path, atime, mtime, function( error  ){
        ctx.resume(error);
    } );
};
exports.utimes.synjsHasCallback = true;

/**
 * Wrapper for fs.open (node)
 * Returns object with following properties
 * - 'data' set to fd
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {String} path
 * @param {String} flags
 * @param {number} mode
 * @throws {Exception}
 */
exports.open = function (ctx, path, flags, mode) {
    var res = {};
    fs.open(path, flags, mode, function (error, fd) {
        res.data = fd;
        ctx.resume(error);
    });
    return res;
};
exports.open.synjsHasCallback = true;

/**
 * Wrapper for fs.read (node)
 * Returns object with following properties
 * - 'data' set to data buffer
 * - 'bytesRead' set to bytesRead
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {number} fd
 * @param {?} buffer
 * @param {number} offset
 * @param {number} length
 * @param {number} position
 * @throws {Exception}
 */
exports.read = function (ctx, fd, buffer, offset, length, position) {
    var res = {};
    fs.read(fd, buffer, offset, length, position, function (error, bytesRead, buffer) {
        res.data = bytesRead;
        res.buffer = buffer;
        ctx.resume(error);
    });
    return res;
};
exports.read.synjsHasCallback = true;


/**
 * Wrapper for fs.write (node)
 * Returns object with following properties
 * - 'data' set to data buffer
 * - 'bytesRead' set to bytesRead
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {number} fd
 * @param {?} buffer
 * @param {number} offset
 * @param {number} length
 * @param {number} position
 * @throws {Exception}
 */
exports.write = function (ctx, fd, buffer, offset, length, position) {
    var res = {};
    fs.write(fd, buffer, offset, length, position, function (error, bytesWritten, buffer) {
        res.data = bytesWritten;
        res.buffer = buffer;
        ctx.resume(error);
    });
    return res;
};
exports.write.synjsHasCallback = true;


/**
 * Wrapper for fs.close (node)
 *
 * @param {State} ctx Context of nsynjs-executed caller, accessible via built-in variable
 * @param {number} fd
 * @throws {Exception}
 */
exports.close = function (ctx,fd) {
    fs.close( fd, function( error  ){
        ctx.resume(error);
    } );
};
exports.close.synjsHasCallback = true;

