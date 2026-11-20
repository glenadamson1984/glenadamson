import test from 'node:test';
import assert from 'node:assert/strict';
import {requireAdmin} from '../src/server/private-access.mjs';
import {createSession,cookieName} from '../src/lib/master-auth.mjs';
import {createSession as footballSession} from '../src/lib/football-auth.mjs';
test('private routes redirect anonymous and legacy football sessions before exposing records',()=>{
 for(const cookies of [{},{[cookieName]:'forged'},{[cookieName]:footballSession()}]){
  const headers={};const result=requireAdmin({req:{cookies},res:{setHeader:(k,v)=>headers[k]=v}},'/football');
  assert.equal(result.redirect.destination,'/login?next=%2Ffootball');
  assert.match(headers['Cache-Control'],/no-store/);assert.equal(headers['X-Robots-Tag'],'noindex, nofollow');
 }
 assert.equal(requireAdmin({req:{cookies:{[cookieName]:createSession()}},res:{setHeader(){}}},'/football'),null);
});
