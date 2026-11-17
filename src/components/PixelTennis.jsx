import {useCallback,useEffect,useRef,useState} from 'react';
import {COURT,DIFFICULTIES,createMatch,startMatch,advanceMatch,pauseMatch,resumeMatch} from '../lib/pixel-tennis.mjs';
import {MONSTER,MONSTER_PALETTE,paintCourt} from '../lib/tennis-art.mjs';
function MonsterBadge(){return <svg viewBox="0 0 16 16" role="img" aria-label="Mossbyte, a pixel monster" shapeRendering="crispEdges">{MONSTER.flatMap((row,y)=>[...row].map((c,x)=>MONSTER_PALETTE[c]?<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={MONSTER_PALETTE[c]}/>:null))}</svg>;}
const snapshot=s=>({phase:s.phase,player:s.playerScore,monster:s.monsterScore,rally:s.rally,best:s.bestRally,returns:s.returns,winner:s.winner,countdown:Math.max(1,Math.ceil(s.serveTimer)),pointText:s.pointText});
export default function PixelTennis(){
 const canvas=useRef(null),game=useRef(createMatch()),input=useRef({left:false,right:false,targetX:null}),audio=useRef(null),soundRef=useRef(false);
 const [difficulty,setDifficulty]=useState('normal'),[hud,setHud]=useState(()=>snapshot(game.current)),[sound,setSound]=useState(false),[resetOpen,setResetOpen]=useState(false),[announcement,setAnnouncement]=useState('Ready to play. First to seven wins.');
 const resumeAfterReset=useRef(false);
 const publish=useCallback(()=>setHud(snapshot(game.current)),[]);
 const focusCourt=()=>canvas.current?.focus({preventScroll:true});
 const showCourt=()=>{focusCourt();canvas.current?.scrollIntoView({block:'center',behavior:'auto'});};
 function start(){startMatch(game.current);publish();showCourt();}
 function pause(){if(game.current.phase==='paused'){resumeMatch(game.current);showCourt();}else pauseMatch(game.current);input.current={left:false,right:false,targetX:null};publish();}
 function askReset(){if(game.current.phase==='ready'||game.current.phase==='finished'){reset();return;}resumeAfterReset.current=game.current.phase!=='paused';pauseMatch(game.current);setResetOpen(true);publish();}
 function reset(play=false){game.current=createMatch(difficulty);input.current={left:false,right:false,targetX:null};setResetOpen(false);setAnnouncement('New match. Scores and rally records reset.');if(play)startMatch(game.current);publish();if(play)showCourt();}
 function keepPlaying(){setResetOpen(false);if(resumeAfterReset.current)resumeMatch(game.current);publish();focusCourt();}
 function resetKeys(e){if(e.key==='Escape'){e.preventDefault();keepPlaying();}if(e.key==='Tab'){const buttons=[...e.currentTarget.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);if((e.shiftKey&&index<=0)||(!e.shiftKey&&index===buttons.length-1)){e.preventDefault();buttons[e.shiftKey?buttons.length-1:0].focus();}}}
 function chooseDifficulty(e){const value=e.target.value;setDifficulty(value);game.current=createMatch(value);publish();}
 async function toggleSound(){
  const enabled=!soundRef.current;
  if(enabled){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audio.current??=new Audio();await audio.current.resume();}catch{setAnnouncement('Sound is unavailable in this browser. You can still play.');return;}}
  soundRef.current=enabled;setSound(enabled);
 }
 function keyDown(e){
  if(['ArrowLeft','ArrowRight','KeyA','KeyD','Space','KeyP','Escape','KeyR'].includes(e.code))e.preventDefault();
  if(e.code==='ArrowLeft'||e.code==='KeyA'){input.current.left=true;input.current.targetX=null;}
  if(e.code==='ArrowRight'||e.code==='KeyD'){input.current.right=true;input.current.targetX=null;}
  if(e.repeat)return;
  if(resetOpen){if(e.code==='Escape')keepPlaying();return;}
  if(e.code==='Space'){if(game.current.phase==='ready')start();else if(game.current.phase==='finished')reset(true);else pause();}
  if(e.code==='KeyP'||e.code==='Escape')pause();
  if(e.code==='KeyR')askReset();
 }
 function keyUp(e){if(['ArrowLeft','KeyA'].includes(e.code))input.current.left=false;if(['ArrowRight','KeyD'].includes(e.code))input.current.right=false;}
 function pointer(e){if(e.pointerType!=='mouse'&&e.type!=='pointerdown'&&!e.currentTarget.hasPointerCapture(e.pointerId))return;const rect=e.currentTarget.getBoundingClientRect();input.current.targetX=((e.clientX-rect.left)/rect.width)*COURT.width;if(e.type==='pointerdown'){e.currentTarget.setPointerCapture(e.pointerId);focusCourt();}}
 function moveButton(side,down,e){e.preventDefault();input.current.targetX=null;input.current[side]=down;if(down)e.currentTarget.setPointerCapture(e.pointerId);}
 useEffect(()=>{
  const ctx=canvas.current.getContext('2d'),portrait=new Image();portrait.src='/glen-pixel-portrait.png';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frameId,last=0,lastHud=0,trail=[],particles=[];
  function beep(type){if(!soundRef.current||!audio.current)return;try{const ac=audio.current,osc=ac.createOscillator(),gain=ac.createGain();osc.type='square';osc.frequency.value=type==='hit'?580:type==='point'?220:400;gain.gain.setValueAtTime(.028,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.075);osc.connect(gain);gain.connect(ac.destination);osc.start();osc.stop(ac.currentTime+.08);}catch{}}
  function frame(now){
   const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
   const s=game.current;advanceMatch(s,{axis:Number(input.current.right)-Number(input.current.left),targetX:input.current.targetX},dt);
   if(s.phase==='playing'){trail.push({x:s.ball.x,y:s.ball.y});if(trail.length>8)trail.shift();}else trail=[];
   for(const e of s.events){
    if(['hit','point','serve'].includes(e.type))beep(e.type);
    if(e.type==='hit'&&!reduced)for(let n=0;n<7;n++)particles.push({x:e.x,y:e.y,vx:(Math.random()-.5)*130,vy:(Math.random()-.5)*130,life:.4,color:e.who==='player'?'#ff75aa':'#7bcda4'});
    if(e.type==='point')setAnnouncement(`${s.pointText} Glen ${s.playerScore}, Mossbyte ${s.monsterScore}.`);
    if(e.type==='finished')setAnnouncement(e.winner==='player'?'You beat Mossbyte! Match complete.':'Mossbyte wins this round. Match complete.');
   }
   particles=particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;return p.life>0;});
   paintCourt(ctx,s,{portrait,trail,particles,reducedMotion:reduced});
   if(now-lastHud>100||s.events.length){publish();lastHud=now;}
   frameId=requestAnimationFrame(frame);
  }
  function suspend(){if(document.hidden||!document.hasFocus()){pauseMatch(game.current);input.current={left:false,right:false,targetX:null};publish();}}
  document.addEventListener('visibilitychange',suspend);window.addEventListener('blur',suspend);frameId=requestAnimationFrame(frame);
  return()=>{cancelAnimationFrame(frameId);document.removeEventListener('visibilitychange',suspend);window.removeEventListener('blur',suspend);audio.current?.close().catch(()=>{});};
 },[publish]);
 const running=['playing','serve','paused'].includes(hud.phase);
 return <section className="tennis-game" aria-label="Glen versus Mossbyte pixel tennis">
  <div className="tennis-scoreboard"><div className="tennis-competitor glen"><img src="/glen-pixel-portrait.png" width="48" height="48" alt="Glen’s pixel portrait"/><div><strong>GLEN</strong><span>YOU / PINK RACKET</span></div></div><div className="tennis-score"><span>FIRST TO SEVEN</span><div><strong>{hud.player}</strong><i>:</i><strong>{hud.monster}</strong></div></div><div className="tennis-competitor monster"><div><strong>MOSSBYTE</strong><span>CPU / MINT RACKET</span></div><MonsterBadge/></div></div>
  <div className="tennis-toolbar"><label>DIFFICULTY<select value={difficulty} onChange={chooseDifficulty} disabled={running}>{Object.entries(DIFFICULTIES).map(([key,d])=><option key={key} value={key}>{d.label}</option>)}</select></label><div><button type="button" onClick={toggleSound} aria-pressed={sound}>{sound?'Sound on ♫':'Sound off'}</button><button type="button" onClick={pause} disabled={!running||resetOpen}>{hud.phase==='paused'?'Resume':'Pause'}</button><button type="button" onClick={askReset}>Restart match ↻</button></div></div>
  <div className="tennis-arena"><canvas ref={canvas} width={COURT.width} height={COURT.height} tabIndex={0} onKeyDown={keyDown} onKeyUp={keyUp} onBlur={()=>{input.current={left:false,right:false,targetX:null};}} onPointerDown={pointer} onPointerMove={pointer} aria-label={`Tennis court. Glen ${hud.player}, Mossbyte ${hud.monster}. Move left and right with arrow keys or A and D. Space starts or pauses. Returns are automatic.`}>Use a browser with Canvas support to play pixel tennis.</canvas>
   {hud.phase==='ready'&&<div className="tennis-overlay"><span className="tennis-overlay-label">ONE COURT. ONE MONSTER. YOU.</span><h2>Ready, Glen?</h2><p>Meet the ball with your racket.<br/>The monster has been practising.</p><button type="button" className="primary" onClick={start}>Play match →</button><small>Mouse, keyboard or touch. You swing automatically.</small></div>}
   {hud.phase==='serve'&&<div className="tennis-serve" aria-hidden="true"><span>{hud.pointText||'Let’s play.'}</span><strong>{hud.countdown}</strong><small>{game.current.server==='player'?'YOUR SERVE':'MOSSBYTE SERVES'}</small></div>}
   {hud.phase==='paused'&&!resetOpen&&<div className="tennis-overlay"><span className="tennis-overlay-label">MATCH PAUSED</span><h2>A quick breather.</h2><p>Your score is right where you left it.</p><button type="button" className="primary" onClick={pause}>Resume match →</button></div>}
   {hud.phase==='finished'&&<div className="tennis-overlay"><span className="tennis-overlay-label">MATCH COMPLETE / {hud.player} – {hud.monster}</span><h2>{hud.winner==='player'?'Monster defeated.':'Mossbyte takes it.'}</h2><p>{hud.winner==='player'?'Good hands. Excellent pixels.':'A rematch might be in order.'}<br/>Longest rally: {hud.best} hits.</p><button type="button" className="primary" onClick={()=>reset(true)}>Play again →</button></div>}
   {resetOpen&&<div className="tennis-overlay" role="dialog" aria-modal="true" aria-labelledby="tennis-reset-title" onKeyDown={resetKeys}><span className="tennis-overlay-label">FRESH COURT. FRESH SCORE.</span><h2 id="tennis-reset-title">Restart this match?</h2><p>Scores and rally records will return to zero.</p><div className="tennis-reset-actions"><button type="button" className="primary" autoFocus onClick={()=>reset()}>Restart from zero</button><button type="button" onClick={keepPlaying}>Keep playing</button></div></div>}
  </div>
  <div className="tennis-underboard"><span>RALLY <strong>{hud.rally}</strong></span><span>LONGEST <strong>{hud.best}</strong></span><span>YOUR RETURNS <strong>{hud.returns}</strong></span><span className="tennis-live" role="status" aria-live="polite">{announcement}</span></div>
  <div className="tennis-touch-controls" aria-label="On-screen movement controls"><button type="button" aria-label="Move left" onPointerDown={e=>moveButton('left',true,e)} onPointerUp={e=>moveButton('left',false,e)} onPointerCancel={e=>moveButton('left',false,e)}>← LEFT</button><span>Or drag across the court</span><button type="button" aria-label="Move right" onPointerDown={e=>moveButton('right',true,e)} onPointerUp={e=>moveButton('right',false,e)} onPointerCancel={e=>moveButton('right',false,e)}>RIGHT →</button></div>
 </section>;
}
