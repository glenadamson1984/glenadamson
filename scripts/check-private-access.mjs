import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const port=3194,origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,MASTER_PIN:'9876',MASTER_SESSION_SECRET:randomBytes(32).toString('hex')},stdio:'ignore'});
try{
 let ready=false;for(let i=0;i<40;i++){try{const r=await fetch(origin+'/api/master-session');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,300));}assert.ok(ready,'production server starts');
 for(const route of ['/','/portfolio','/pixel-me']){const r=await fetch(origin+route);assert.equal(r.status,200);const html=await r.text();assert.ok(!html.includes('href="/football"'),`${route} does not expose football navigation`);assert.ok(!html.includes('sh-2017-06-19T07:46:01'),'private run is absent');}
 for(const route of ['/football','/running-dashboard','/admin']){const r=await fetch(origin+route,{redirect:'manual'});assert.equal(r.status,307);assert.match(r.headers.get('location'),/^\/login\?next=/);assert.match(r.headers.get('cache-control'),/no-store/);}
 const login=await fetch(origin+'/api/master-session',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({pin:'9876'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 const football=await fetch(origin+'/football',{headers:{Cookie:cookie}});assert.equal(football.status,200);assert.match(await football.text(),/Tandragee/);
 const running=await fetch(origin+'/running-dashboard',{headers:{Cookie:cookie}});assert.equal(running.status,200);assert.match(await running.text(),/sh-2017-06-19T07:46:01/);
 console.log('PASS: public pages omit private links and records; anonymous requests redirect; authenticated dashboards work.');
}finally{child.kill();}
