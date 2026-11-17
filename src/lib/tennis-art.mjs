import {COURT} from './pixel-tennis.mjs';
export const MONSTER=[
 '..pp........pp..','..ppp......ppp..','...ppmmmmmmpp...','..mmmmmmmmmmmm..','.mmmmmmmmmmmmmm.','.mmmddmmmmddmmm.','.mmmwwmmmmwwmmm.','.mmmkWmmmmkWmmm.','.mmmmmmmmmmmmmm.','..mmmmddddmmmm..','..mmmdwddwdmmm..','...mmmddddmmm...','....mmmmmmmm....','...mm.mm.mm.mm..','...mm.mm.mm.mm..','..mmm......mmm..'
];
export const MONSTER_PALETTE={p:'#c7a0ed',m:'#7bcda4',d:'#193b34',w:'#f5f2da',W:'#ff75aa',k:'#101d19'};
export function monsterSprite(ctx,x,y,scale=3){for(let row=0;row<MONSTER.length;row++)for(let col=0;col<MONSTER[row].length;col++){const c=MONSTER_PALETTE[MONSTER[row][col]];if(c){ctx.fillStyle=c;ctx.fillRect(Math.round(x+col*scale),Math.round(y+row*scale),scale,scale);}}}
function racket(ctx,x,y,color){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(Math.round(x-37),Math.round(y-8),74,16);ctx.globalAlpha=.35;ctx.lineWidth=1;for(let n=-30;n<36;n+=9){ctx.beginPath();ctx.moveTo(x+n,y-7);ctx.lineTo(x+n,y+7);ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle=color;ctx.fillRect(x+37,y-2,14,4);}
export function paintCourt(ctx,s,{portrait,trail=[],particles=[],reducedMotion=false}={}){
 const {width:w,height:h}=COURT;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#131c1a';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#ffffff03';for(let y=14;y<h;y+=24)for(let x=14;x<w;x+=24)ctx.fillRect(x,y,2,2);
 ctx.fillStyle='#203d32';ctx.fillRect(90,62,780,496);ctx.fillStyle='#1c352c';ctx.fillRect(158,62,644,496);
 ctx.strokeStyle='#7bcda44d';ctx.lineWidth=2;ctx.strokeRect(90,62,780,496);ctx.strokeRect(158,62,644,496);ctx.strokeRect(158,187,644,246);
 ctx.beginPath();ctx.moveTo(480,187);ctx.lineTo(480,433);ctx.stroke();
 ctx.fillStyle='#101d18';ctx.fillRect(80,306,800,13);ctx.strokeStyle='#e3f3d3aa';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(80,310);ctx.lineTo(880,310);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#a6bca5';ctx.fillRect(80,303,5,20);ctx.fillRect(875,303,5,20);
 ctx.font='bold 10px monospace';ctx.textAlign='left';ctx.fillStyle='#7bcda4aa';ctx.fillText('MOSSBYTE / CPU',100,35);ctx.fillStyle='#ff75aaaa';ctx.fillText('GLEN / YOU',100,h-18);ctx.textAlign='right';ctx.fillStyle='#7bcda46b';ctx.fillText('PIXEL COURT 01',860,h-18);
 ctx.textAlign='center';ctx.font='bold 17px monospace';ctx.fillStyle='#ff75aa';ctx.fillText(`GLEN ${s.playerScore}`,425,35);ctx.fillStyle='#7bcda4';ctx.fillText(`${s.monsterScore} MOSSBYTE`,540,35);
 ctx.fillStyle='#0004';ctx.fillRect(s.monsterX-24,127,48,8);ctx.fillRect(s.playerX-24,562,48,8);
 monsterSprite(ctx,s.monsterX-24,61,3);
 ctx.fillStyle='#ff408b';ctx.fillRect(s.playerX-12,525,24,27);ctx.fillStyle='#151c1b';ctx.fillRect(s.playerX-17,551,12,11);ctx.fillRect(s.playerX+5,551,12,11);
 if(portrait?.complete&&portrait.naturalWidth){const n=portrait.naturalWidth;ctx.drawImage(portrait,n*.19,n*.03,n*.61,n*.71,Math.round(s.playerX-22),515,44,46);}else{ctx.fillStyle='#ffb394';ctx.fillRect(s.playerX-18,515,36,37);ctx.fillStyle='#efdfc5';ctx.fillRect(s.playerX-18,515,36,9);}
 racket(ctx,s.monsterX,COURT.monsterY,'#7bcda4');racket(ctx,s.playerX,COURT.playerY,'#ff75aa');
 if(!reducedMotion){trail.forEach((p,i)=>{ctx.globalAlpha=(i/trail.length)*.28;ctx.fillStyle='#efff8e';ctx.fillRect(p.x-4,p.y-4,8,8);});ctx.globalAlpha=1;}
 if(s.phase!=='finished'){
  ctx.fillStyle='#0005';ctx.fillRect(s.ball.x-5,s.ball.y+9,12,5);
  ctx.fillStyle='#f0fc99';ctx.fillRect(Math.round(s.ball.x-6),Math.round(s.ball.y-6),12,12);ctx.fillStyle='#fffde0';ctx.fillRect(Math.round(s.ball.x-4),Math.round(s.ball.y-4),5,4);
 }
 if(!reducedMotion)for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.4);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
 ctx.strokeStyle='#ff75aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(88,540);ctx.lineTo(88,560);ctx.lineTo(108,560);ctx.stroke();ctx.strokeStyle='#7bcda4';ctx.beginPath();ctx.moveTo(850,60);ctx.lineTo(872,60);ctx.lineTo(872,80);ctx.stroke();
}
