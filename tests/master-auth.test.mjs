import test from 'node:test';import assert from 'node:assert/strict';
import {createSession,validSession,correctPin} from '../src/lib/master-auth.mjs';
import {createSession as footballSession,validSession as validFootball} from '../src/lib/football-auth.mjs';
test('master access is signed, expires and cannot reuse a football session',()=>{
 const now=Date.now(),token=createSession(now);assert.equal(validSession(token,now),true);assert.equal(validSession(token,now+12*3600*1000),false);assert.equal(validSession(footballSession(now),now),false);assert.equal(validFootball(token,now),false);assert.equal(correctPin('3217'),true);assert.equal(correctPin('0000'),false);
});
