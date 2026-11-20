import SiteFooter from '../src/components/SiteFooter';
import SiteHeader from '../src/components/SiteHeader';
import Head from 'next/head';
import { useState } from 'react';
import { standings } from '../src/lib/football.mjs';

export async function getServerSideProps({req,res}) {
  const {requireAdmin}=await import('../src/server/private-access.mjs');
  const denied=requireAdmin({req,res},'/football');if(denied)return denied;
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow');

  const data = (await import('../src/data/football.json')).default;
  return {props:{data,isMaster:true}};
}

function TeamText({children}) {
  return children.split(/(Tandragee(?: Rovers)?(?:’s|'s)?)/gi).map((part,i)=>
    /^Tandragee/i.test(part)?<strong key={i} style={{color:'#ffad64',fontWeight:700}}>{part}</strong>:part
  );
}

function LeagueTable({rows,teamName,league,group}) {
  return <div className="football-scroll"><table className="football-table">
    <caption>SSG {league} League — 2016 Under 11 {group}</caption>
    <thead><tr>{['Pos','Team','P','W','D','L','GF','GA','GD','Pts','Pts/game'].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{rows.map((q,i)=>{
      const ours=q.team===teamName;
      const cellStyle={color:ours?'#ffad64':'#f5f5f5',...(ours?{fontWeight:700}:{})};
      return <tr key={q.team} className={ours?'our-team':''}>
        <td style={cellStyle}>{q.p?i+1:'—'}</td>
        <th style={cellStyle} scope="row">{q.team}</th>
        {['p','w','d','l','gf','ga','gd','pts'].map(k=><td key={k} style={cellStyle}>{k==='gd'&&q[k]>0?'+':''}{q[k]}</td>)}
        <td style={cellStyle}>{q.p?(q.pts/q.p).toFixed(2):'—'}</td>
      </tr>;
    })}</tbody>
  </table></div>;
}
function GroupMoves({moves,league}) {
  const change=m=>{
    if(m.league==='Not listed')return m.direction==='Joined'?`Joined ${league}`:`No longer listed in ${league}`;
    const from=m.direction==='Joined'?m.league:league,to=m.direction==='Joined'?league:m.league;
    const levels={Yellow:0,Green:1,Blue:2,Red:3};
    return `${levels[to]>levels[from]?'Up':'Down'} from ${from} to ${to}`;
  };
  return <section className="football-card"><h3>Who moved between blocks?</h3><p className="football-note">Changes in the listed {league} fixtures from Block 1 to Block 2. Records show scored Block 1 matches. A missing listing does not confirm a promotion or relegation.</p><div className="football-scroll"><table className="football-table arrivals"><thead><tr>{['Team','Change','P','W','D','L','Pts'].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{moves.map(m=><tr key={m.team}><th scope="row">{m.team}</th><td>{change(m)}<small>{m.league==='Not listed'?(m.direction==='Joined'?'Previous Under 11 group not found':'No Block 2 listing under this name'):(m.direction==='Joined'?`From ${m.league} — ${m.group}`:`To ${m.league} — ${m.group}`)}</small></td>{['p','w','d','l','pts'].map(k=><td key={k}>{m.stats?.p?m.stats[k]:'—'}</td>)}</tr>)}</tbody></table></div></section>;
}
export default function Football({data}) {
  const [team,setTeam]=useState('tornadoes');
  const [block,setBlock]=useState(2),[pin,setPin]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function login(e) {
    e.preventDefault();setBusy(true);setError('');
    try { const r=await fetch('/api/master-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});if(r.ok)window.location.assign('/football');else {setError((await r.json()).error);setBusy(false);} }
    catch {setError('Could not connect. Please try again.');setBusy(false);}
  }
  async function logout(){setBusy(true);try{const r=await fetch('/api/master-session',{method:'DELETE'});if(!r.ok)throw Error();window.location.assign('/football');}catch{setError('Could not log out. Please try again.');setBusy(false);}}
  const group=team==='hurricanes'?'Hurricanes':'Tornadoes';
  const league=team==='hurricanes'?'Yellow':'Green';
  const teamColor=team==='hurricanes'?'#f5d66d':'#7bcda4';
  const teamName=team==='hurricanes'?'Tandragee Rovers Youth':'Tandragee Rovers';
  const selected=data&&(team==='hurricanes'?data.hurricanes:data);
  const rows=selected&&block<3?standings(selected.blocks[block],block===1?selected.block1Teams:[]):[];
  const us=rows.find(q=>q.team===teamName);
  return <div className="football-theme" style={{'--team-accent':teamColor}}><Head><title>Football Progress | Tandragee Rovers 2016</title><meta name="robots" content="noindex,nofollow"/></Head>
    <a className="skip-link" href="#football-main">Skip to content</a>
    <SiteHeader active="football" actions={data&&<button onClick={logout} disabled={busy}>Log out</button>}/>
    <main id="football-main"><section className="hero"><div>{data?<nav className="football-team-tabs" aria-label="Tandragee teams">{['tornadoes','hurricanes'].map(id=><button key={id} aria-pressed={team===id} onClick={()=>setTeam(id)}>TANDRAGEE ROVERS {id.toUpperCase()} 2016</button>)}</nav>:<span className="eyebrow">TANDRAGEE ROVERS 2016</span>}<h1><span style={{color:data?teamColor:undefined,fontWeight:600}}>26–27</span> season <span>Progress</span><span className="title-dot">.</span></h1><p>{data?`${league} League · Under 11 ${group} · SSG`:"Under 11 · SSG"}</p></div>{data&&<span className="football-season">2026 / 2027</span>}</section>
    {!data?<section className="football-card football-login"><span className="eyebrow">FOOTBALL LOGIN</span><h2>Your season, in one place.</h2><p>Enter your PIN to view the team’s progress.</p><form onSubmit={login}><label htmlFor="football-pin">PIN</label><input id="football-pin" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="current-password" required value={pin} onChange={e=>setPin(e.target.value)} aria-describedby={error?'login-error':undefined}/><button className="primary" disabled={busy}>{busy?'Checking…':'Unlock football progress →'}</button></form>{error&&<p id="login-error" role="alert">{error}</p>}</section>:<>
    <nav className="dashboard-controls" aria-label="Season blocks"><div className="tabs football-tabs">{[1,2,3,4].map(n=><button key={n} aria-current={block===n?'page':undefined} onClick={()=>setBlock(n)} className={block===n?'selected':''}>Block {n}</button>)}</div><span className="personal-label">UPDATED {data.updated.toUpperCase()}</span></nav>
    {block>2?<section className="football-card football-empty"><span className="eyebrow">BLOCK {block}</span><h2>No information yet</h2><p>Fixtures, results and findings will appear here when this block begins.</p></section>:<>
    <div className="football-section-heading"><div><span className="eyebrow">BLOCK {block}</span><h2>{block===1?'The opening block':`A new mix in ${league}`}</h2></div><span className="football-period">{block===1?'Weeks 1–8 · Week 8 cancelled':'Weeks 9–11 recorded'}</span></div>
    {block===2&&<GroupMoves moves={selected.moves} league={league}/>}
    {team==='hurricanes'&&<section className="football-card"><h3>Source notes</h3><p className="football-note">Week 5’s “Ambassadors” entry is treated as Ambassadors Bears, matching the other Hurricanes listings. “Seagoe fc” appears once in Block 1 Yellow and is kept separate from Green’s Seagoe. Hanover remains in the week 9 Yellow no-match note, but their scored Block 2 fixtures are in Green.</p></section>}
    <section className="football-metrics" aria-label="Tandragee summary">{[['Position',`${rows.indexOf(us)+1} / ${rows.filter(q=>q.p).length}`],['Played',us.p],['Record',`${us.w}W · ${us.d}D · ${us.l}L`],['Points per game',(us.pts/us.p).toFixed(2)]].map(([label,value])=><div className="football-card" key={label}><span className="eyebrow">{label}</span><strong>{value}</strong></div>)}</section>
    <section className="football-card"><h3>Block {block} league table</h3><LeagueTable rows={rows} teamName={teamName} league={league} group={group}/><p className="football-note">3 points per win, 1 per draw. Order: points, goal difference, goals scored. Points per game = points ÷ matches played. Blank scores and no-match entries are excluded. Teams without scored results are unranked.</p></section>
    <section className="football-card"><h3><TeamText>Tandragee’s fixtures</TeamText></h3><div className="football-fixtures">{selected.blocks[block].filter(m=>m.home===teamName||m.away===teamName).map(m=><div key={m.week}><span>Week {m.week}</span><p><TeamText>{m.home}</TeamText> <strong>{m.hg===null||m.ag===null?'—':`${m.hg}–${m.ag}`}</strong> <TeamText>{m.away}</TeamText></p>{(m.hg===null||m.ag===null)&&<small>Score not recorded</small>}</div>)}</div></section>
    <section className="football-card"><h3>Findings so far</h3>{team==='hurricanes'?<><p><TeamText>{block===1?'Tandragee Rovers Youth lost all five Block 1 matches, scoring 10 and conceding 26. Rathfriland Youth won all five of theirs. Hanover were unbeaten with three wins and a draw. Both moved up to Green for Block 2.':'Tandragee Rovers Youth have one draw and two defeats in Block 2, scoring 7 and conceding 11. Their 3–3 draw with Markethill earned their first point of the recorded season. Dromore Amateurs Colts lead Yellow with three wins from three matches.'}</TeamText></p><p>All {block===1?'23':'9'} listed Hurricanes fixtures in this block have both scores entered. Match counts differ, so points per game helps compare form.</p></>:<><p><TeamText>{block===1?'Tandragee finished lowest among the seven teams with scored results: one draw and four defeats. Week 8 was cancelled due to the storm. Five listed fixtures across the league have missing scores, including Seagoe v Tandragee in week 1. The recalled 4–2 defeat is unconfirmed and is excluded from this table.':'Tandragee have one win and two defeats, with 9 goals scored and 12 conceded. Hanover and St. Mary’s have won both their matches. Seagoe have lost to St. Mary’s and Annagh, both returning Green teams.'}</TeamText></p></>}{block===2&&<p>We’ll add results through the end of Block 2, provisionally around week 16. Compare points per game if match counts remain uneven, alongside score margins and opponents faced when reviewing group moves.</p>}</section>
    </>}
    <footer className="football-footer"><p>Unofficial ability-group monitoring · Updated as results are reviewed.</p><a href={data.source} target="_blank" rel="noreferrer">Source results spreadsheet ↗</a></footer>{error&&<p role="alert">{error}</p>}
    </>}
    <SiteFooter/></main></div>;
}
