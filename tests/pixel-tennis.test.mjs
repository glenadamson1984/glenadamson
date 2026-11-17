import test from 'node:test';import assert from 'node:assert/strict';
import {createMatch,startMatch,advanceMatch,pauseMatch,resumeMatch,awardPoint,reflectedX,COURT} from '../src/lib/pixel-tennis.mjs';
test('serve, pause and restart preserve clear match boundaries',()=>{
 const s=createMatch('easy',42);startMatch(s);for(let i=0;i<110;i++)advanceMatch(s,{},1/60);assert.equal(s.phase,'playing');
 pauseMatch(s);const y=s.ball.y;advanceMatch(s,{axis:1},1);assert.equal(s.ball.y,y);resumeMatch(s);assert.equal(s.phase,'playing');
 const reset=createMatch('easy',42);assert.equal(reset.playerScore,0);assert.equal(reset.bestRally,0);assert.equal(reset.phase,'ready');
});
test('continuous collision returns an intercepted shot and misses award one point',()=>{
 const s=createMatch('normal',1);s.phase='playing';s.ball={x:480,y:490,vx:0,vy:600};advanceMatch(s,{},.04);assert.ok(s.ball.vy<0);assert.equal(s.returns,1);assert.equal(s.bestRally,1);
 s.ball={x:COURT.left,y:594,vx:0,vy:600};advanceMatch(s,{},.04);assert.equal(s.monsterScore,1);assert.equal(s.phase,'serve');advanceMatch(s,{},.04);assert.equal(s.monsterScore,1);
});
test('first to seven ends the match and cannot score again',()=>{
 const s=createMatch();for(let i=0;i<7;i++){s.phase='playing';awardPoint(s,'player');}assert.equal(s.phase,'finished');assert.equal(s.winner,'player');awardPoint(s,'monster');assert.equal(s.monsterScore,0);
});
test('court reflections and player movement stay bounded across long sessions',()=>{
 for(const x of [-10000,0,100,1000,50000])assert.ok(reflectedX(x)>=COURT.left&&reflectedX(x)<=COURT.right);
 const s=createMatch('hard',13);startMatch(s);for(let i=0;i<8000&&s.phase!=='finished';i++){advanceMatch(s,{targetX:s.ball.x},1/60);assert.ok(Number.isFinite(s.ball.x)&&Number.isFinite(s.ball.y));assert.ok(s.playerX>=140&&s.playerX<=820);}assert.ok(s.playerScore+s.monsterScore>0);
});
