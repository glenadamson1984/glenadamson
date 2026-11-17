// Windows build compatibility: directory junctions do not require symlink privilege.
// Build-time file links become copies. This does not change application code.
if(process.platform==='win32'){
 const fs=require('node:fs'),path=require('node:path');
 const original=fs.symlinkSync.bind(fs);
 fs.symlinkSync=function(target,dest,type){const full=path.isAbsolute(target)?target:path.resolve(path.dirname(dest),target);if(fs.statSync(full).isDirectory())return original(full,dest,'junction');return fs.copyFileSync(full,dest);};
 fs.symlink=function(target,dest,type,callback){if(typeof type==='function')callback=type;try{fs.symlinkSync(target,dest);callback(null);}catch(e){callback(e);}};
 fs.promises.symlink=async function(target,dest){return fs.symlinkSync(target,dest);};
}
