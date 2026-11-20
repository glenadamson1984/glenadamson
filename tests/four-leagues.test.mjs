import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LEAGUES,leagueData,leagueTeams,standings,scoreCoverage,blockMoves} from '../src/lib/football.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../src/data/football.json',import.meta.url)));
test('all four leagues reconcile scored results and retain missing scores separately',()=>{
 const expected={red:[[24,23,1,0],[9,9,0,0]],blue:[[18,18,0,4],[9,9,0,0]],green:[[21,16,5,0],[12,12,0,0]],yellow:[[23,23,0,0],[9,9,0,0]]};
 for(const l of LEAGUES)for(const b of [1,2]){
  const d=leagueData(data,l.id),coverage=scoreCoverage(d,b),rows=standings(d.blocks[b],leagueTeams(d,b));
  assert.deepEqual(Object.values(coverage),expected[l.id][b-1]);
  assert.equal(rows.reduce((sum,q)=>sum+q.p,0),coverage.scored*2);
  assert.equal(rows.reduce((sum,q)=>sum+q.gf,0),rows.reduce((sum,q)=>sum+q.ga,0));
  assert.equal(rows.reduce((sum,q)=>sum+q.gd,0),0);
  for(const q of rows){assert.equal(q.p,q.w+q.d+q.l);assert.equal(q.pts,3*q.w+q.d);}
  assert.ok(d.blocks[b].every(m=>(b===1?m.week>=1&&m.week<=7:m.week>=9&&m.week<=11)));
  const keys=d.blocks[b].map(m=>`${m.week}|${m.home}|${m.away}`);assert.equal(new Set(keys).size,keys.length);
 }
});
test('Red and Blue leaders match the independently checked source scores',()=>{
 assert.deepEqual(standings(data.leagues.red.blocks[1])[0],{team:'Dromore Amateurs',p:7,w:5,d:1,l:1,gf:37,ga:9,gd:28,pts:16});
 assert.deepEqual(standings(data.leagues.red.blocks[2])[0],{team:'Armagh City 2017',p:3,w:3,d:0,l:0,gf:15,ga:5,gd:10,pts:9});
 assert.equal(standings(data.leagues.blue.blocks[1])[0].team,'Annagh Youth Lions');
 assert.equal(standings(data.leagues.blue.blocks[2])[0].team,'Markethill Swifts');
 const unranked=standings(data.leagues.blue.blocks[1],leagueTeams(data.leagues.blue,1)).at(-1);
 assert.equal(unranked.team,'Rathfriland Swifts');assert.equal(unranked.p,0);
});
test('group changes use fixture membership and do not confuse age or similarly named teams',()=>{
 const blue=blockMoves(data,'blue');
 assert.deepEqual(blue.filter(m=>m.direction==='Joined').map(m=>[m.team,m.league,m.stats.pts]),[['Lurgan Celtic Green','Red',0],['Ridgeway Mill Youth','Red',3]]);
 assert.equal(blue.find(m=>m.team==='Dromore Amateurs Swifts').league,'Green');
 assert.equal(blue.find(m=>m.team==='Rathfriland Swifts').league,'Not listed');
 assert.equal(blockMoves(data,'red').find(m=>m.team==='Armagh City 2017').stats,null);
 assert.equal(blockMoves(data,'green').find(m=>m.team==='Bourneview Mill Minis').league,'Blue');
 assert.ok(!blue.some(m=>m.team==='Ridgeway Mill Youth Blues'));
 assert.equal(blockMoves(data,'yellow').find(m=>m.team==='Hanover Youth Colts').league,'Green');
});
