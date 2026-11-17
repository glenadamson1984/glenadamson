import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const demo=path.join(root,'demos/salon-demo');
const args=process.platform==='win32'?['--require',path.join(demo,'scripts/windows-links.cjs')]:[];
execFileSync(process.execPath,[...args,path.join(demo,'node_modules/vite/bin/vite.js'),'build'],{cwd:demo,stdio:'inherit',env:{...process.env,...(process.platform==='win32'?{NODE_OPTIONS:`--require="${path.join(demo,'scripts/windows-links.cjs').replaceAll('\\','/')}"`}:{})}});
fs.mkdirSync(path.join(root,'public/demos/salon-ops'),{recursive:true});
fs.cpSync(path.join(demo,'dist'),path.join(root,'public/demos/salon-ops'),{recursive:true});
console.log('Packaged Salon Daybook in public/demos/salon-ops');
