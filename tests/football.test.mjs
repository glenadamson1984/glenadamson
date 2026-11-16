import test from 'node:test';
import assert from 'node:assert/strict';
import { correctPin, createSession, validSession, maxAge } from '../src/lib/football-auth.mjs';
import { standings } from '../src/lib/football.mjs';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../src/data/football.json',import.meta.url)));
test('tables reconcile to recorded fixtures and missing scores do not count',()=>{
  const b1=standings(data.blocks[1],data.block1Teams), b2=standings(data.blocks[2]);
  assert.deepEqual(b1.find(q=>q.team==='Tandragee Rovers'),{team:'Tandragee Rovers',p:5,w:0,d:1,l:4,gf:9,ga:18,gd:-9,pts:1});
  assert.equal(b2.findIndex(q=>q.team==='Tandragee Rovers'),7);
  assert.equal(b2.reduce((s,q)=>s+q.p,0),24);
  assert.equal(b2.reduce((s,q)=>s+q.gf,0),65);
  assert.equal(b2.reduce((s,q)=>s+q.gd,0),0);
  const extra={week:12,home:'Tandragee Rovers',away:'Dromore Amateurs Swifts',hg:0,ag:0};
  const updated=standings([...data.blocks[2],extra]);
  assert.equal(updated.find(q=>q.team==='Tandragee Rovers').pts,4);
  assert.equal(updated.find(q=>q.team==='Tandragee Rovers').p,4);
  assert.equal(standings([...data.blocks[2],{...extra,hg:10}])[0].team,'Tandragee Rovers');
});
test('PIN and signed sessions reject incorrect, forged and expired credentials', () => {
  assert.equal(correctPin('3217'), true);
  for (const pin of ['1234', '', null, 3217, 'éééé']) assert.equal(correctPin(pin), false);
  const now = Date.now(), session = createSession(now);
  assert.equal(validSession(session, now), true);
  assert.equal(validSession(session + '.extra', now), false);
  assert.equal(validSession(session.replace(/.$/, 'z'), now), false);
  assert.equal(validSession(session, now + maxAge * 1000), false);
  assert.equal(validSession('3217', now), false);
});
