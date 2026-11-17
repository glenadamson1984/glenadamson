export const COURT={width:960,height:620,left:112,right:848,playerY:500,monsterY:120};
export const DIFFICULTIES={easy:{label:'Warm-up',speed:285,cpuSpeed:230,error:135,reaction:.28},normal:{label:'Club match',speed:345,cpuSpeed:300,error:82,reaction:.18},hard:{label:'Monster mode',speed:410,cpuSpeed:390,error:35,reaction:.1}};
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function createMatch(difficulty='normal',seed=Date.now()){
 if(!DIFFICULTIES[difficulty])difficulty='normal';
 return {difficulty,seed:seed>>>0,phase:'ready',resumePhase:null,playerScore:0,monsterScore:0,playerX:480,monsterX:480,playerVelocity:0,cpuTarget:480,cpuTimer:0,time:0,ball:{x:480,y:310,vx:0,vy:0},serveTimer:1.4,server:'player',rally:0,bestRally:0,returns:0,winner:null,pointText:'',events:[]};
}
export function startMatch(s){if(s.phase==='ready')s.phase='serve';}
export function pauseMatch(s){if(['playing','serve'].includes(s.phase)){s.resumePhase=s.phase;s.phase='paused';}}
export function resumeMatch(s){if(s.phase==='paused'){s.phase=s.resumePhase||'serve';s.resumePhase=null;}}
export function awardPoint(s,winner){
 if(s.phase!=='playing')return;
 if(winner==='player')s.playerScore++;else s.monsterScore++;
 s.events.push({type:'point',winner});s.pointText=winner==='player'?'Your point. Nicely done.':'Mossbyte takes the point.';
 s.rally=0;s.server=winner;s.ball={x:480,y:310,vx:0,vy:0};s.playerX=480;s.monsterX=480;s.cpuTarget=480;
 if(s.playerScore>=7||s.monsterScore>=7){s.phase='finished';s.winner=winner;s.events.push({type:'finished',winner});}else{s.phase='serve';s.serveTimer=1.6;}
}
export function reflectedX(x){const span=COURT.right-COURT.left;const offset=((x-COURT.left)%(2*span)+2*span)%(2*span);return COURT.left+(offset>span?2*span-offset:offset);}
function hit(s,who){
 const half=who==='player'?54:46,px=who==='player'?s.playerX:s.monsterX;
 const speed=Math.min(680,Math.hypot(s.ball.vx,s.ball.vy)*1.045+6);
 const offset=clamp((s.ball.x-px)/half,-1,1);
 s.ball.vx=clamp(offset*speed*.7+(who==='player'?s.playerVelocity*.16:0),-speed*.78,speed*.78);
 s.ball.vy=Math.sqrt(speed*speed-s.ball.vx*s.ball.vx)*(who==='player'?-1:1);
 s.ball.y=who==='player'?COURT.playerY-1:COURT.monsterY+1;
 s.rally++;s.bestRally=Math.max(s.bestRally,s.rally);if(who==='player')s.returns++;
 s.events.push({type:'hit',who,x:s.ball.x,y:s.ball.y});
}
function tick(s,input,dt){
 const config=DIFFICULTIES[s.difficulty];s.time+=dt;
 const old=s.playerX;
 if(Number.isFinite(input.targetX)){const distance=input.targetX-s.playerX;s.playerX+=clamp(distance,-600*dt,600*dt);}else{s.playerX+=(input.axis||0)*510*dt;}
 s.playerX=clamp(s.playerX,140,820);s.playerVelocity=(s.playerX-old)/dt;
 s.cpuTimer-=dt;
 if(s.cpuTimer<=0){
  let target=480;
  if(s.ball.vy<0){const t=(COURT.monsterY-s.ball.y)/s.ball.vy;target=reflectedX(s.ball.x+s.ball.vx*Math.max(0,t));}
  else target=s.ball.x*.35+480*.65;
  s.cpuTarget=clamp(target+(random(s)-.5)*config.error*2,140,820);s.cpuTimer=config.reaction;
 }
 s.monsterX+=clamp(s.cpuTarget-s.monsterX,-config.cpuSpeed*dt,config.cpuSpeed*dt);
 if(s.phase==='serve'){
  s.serveTimer-=dt;s.ball.x=s.server==='player'?s.playerX:s.monsterX;s.ball.y=s.server==='player'?COURT.playerY-35:COURT.monsterY+35;
  if(s.serveTimer<=0){s.phase='playing';s.ball.vx=(random(s)-.5)*180;s.ball.vy=(s.server==='player'?-1:1)*config.speed;s.events.push({type:'serve'});}return;
 }
 const previousY=s.ball.y;
 s.ball.x+=s.ball.vx*dt;s.ball.y+=s.ball.vy*dt;
 if(s.ball.x<COURT.left){s.ball.x=COURT.left+(COURT.left-s.ball.x);s.ball.vx=Math.abs(s.ball.vx);s.events.push({type:'wall'});}
 if(s.ball.x>COURT.right){s.ball.x=COURT.right-(s.ball.x-COURT.right);s.ball.vx=-Math.abs(s.ball.vx);s.events.push({type:'wall'});}
 if(s.ball.vy>0&&previousY<=COURT.playerY&&s.ball.y>=COURT.playerY&&Math.abs(s.ball.x-s.playerX)<=60)hit(s,'player');
 if(s.ball.vy<0&&previousY>=COURT.monsterY&&s.ball.y<=COURT.monsterY&&Math.abs(s.ball.x-s.monsterX)<=52)hit(s,'monster');
 if(s.ball.y>600)awardPoint(s,'monster');else if(s.ball.y<20)awardPoint(s,'player');
}
export function advanceMatch(s,input={},elapsed=1/60){
 s.events=[];if(!['playing','serve'].includes(s.phase)||!Number.isFinite(elapsed)||elapsed<=0)return s;
 let remaining=Math.min(elapsed,.08);
 while(remaining>0&&['playing','serve'].includes(s.phase)){const dt=Math.min(remaining,1/180);tick(s,input,dt);remaining-=dt;}
 return s;
}
