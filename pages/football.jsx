import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { standings } from '../src/lib/football.mjs';

export async function getServerSideProps({req,res}) {
  const { validSession, cookieName } = await import('../src/lib/football-auth.mjs');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  if (!validSession(req.cookies[cookieName])) return {props:{data:null}};
  const data = (await import('../src/data/football.json')).default;
  return {props:{data}};
}

function TeamText({children}) {
  return children.split(/(Tandragee(?: Rovers)?(?:’s|'s)?)/gi).map((part,i)=>
    /^Tandragee/i.test(part)?<strong key={i} style={{color:'#ffad64',fontWeight:700}}>{part}</strong>:part
  );
}

function LeagueTable({rows}) {
  return <div className="football-scroll"><table className="football-table">
    <caption>SSG Green League — 2016 Under 11 Tornadoes</caption>
    <thead><tr>{['Pos','Team','P','W','D','L','GF','GA','GD','Pts','Pts/game'].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{rows.map((q,i)=>{
      const ours=q.team==='Tandragee Rovers';
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
export default function Football({data}) {
  const [block,setBlock]=useState(2),[pin,setPin]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function login(e) {
    e.preventDefault();setBusy(true);setError('');
    try { const r=await fetch('/api/football-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});if(r.ok)window.location.assign('/football');else {setError((await r.json()).error);setBusy(false);} }
    catch {setError('Could not connect. Please try again.');setBusy(false);}
  }
  async function logout(){setBusy(true);try{const r=await fetch('/api/football-session',{method:'DELETE'});if(!r.ok)throw Error();window.location.assign('/football');}catch{setError('Could not log out. Please try again.');setBusy(false);}}
  const rows=data&&block<3?standings(data.blocks[block],block===1?data.block1Teams:[]):[];
  const us=rows.find(q=>q.team==='Tandragee Rovers');
  return <div className="football-theme"><Head><title>Football Progress | Tandragee Rovers 2016</title><meta name="robots" content="noindex,nofollow"/></Head>
    <a className="skip-link" href="#football-main">Skip to content</a>
    <header className="site-header"><Link href="/football" className="brand"><span className="football-mark" aria-hidden="true">TR</span><span>FOOTBALL<span className="brand-light"> / PROGRESS</span></span></Link><div className="header-right"><Link href="/" className="football-link">Running progress ↗</Link>{data&&<button onClick={logout} disabled={busy}>Log out</button>}</div></header>
    <main id="football-main"><section className="hero"><div><span className="eyebrow"><span className="status-dot"/><TeamText>TANDRAGEE ROVERS TORNADOES 2016</TeamText></span><h1>26–27 season <span>Progress</span><span className="title-dot">.</span></h1><p>Green League · Under 11 · SSG</p></div>{data&&<span className="football-season">2026 / 2027</span>}</section>
    {!data?<section className="football-card football-login"><span className="eyebrow">FOOTBALL LOGIN</span><h2>Your season, in one place.</h2><p>Enter your PIN to view the team’s progress.</p><form onSubmit={login}><label htmlFor="football-pin">PIN</label><input id="football-pin" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="current-password" required value={pin} onChange={e=>setPin(e.target.value)} aria-describedby={error?'login-error':undefined}/><button className="primary" disabled={busy}>{busy?'Checking…':'Unlock football progress →'}</button></form>{error&&<p id="login-error" role="alert">{error}</p>}</section>:<>
    <nav className="dashboard-controls" aria-label="Season blocks"><div className="tabs football-tabs">{[1,2,3,4].map(n=><button key={n} aria-current={block===n?'page':undefined} onClick={()=>setBlock(n)} className={block===n?'selected':''}>Block {n}</button>)}</div><span className="personal-label">UPDATED {data.updated.toUpperCase()}</span></nav>
    {block>2?<section className="football-card football-empty"><span className="eyebrow">BLOCK {block}</span><h2>No information yet</h2><p>Fixtures, results and findings will appear here when this block begins.</p></section>:<>
    <div className="football-section-heading"><div><span className="eyebrow">BLOCK {block}</span><h2>{block===1?'The opening block':'A new mix in Green'}</h2></div><span className="football-period">{block===1?'Weeks 1–8 · Week 8 cancelled':'Weeks 9–11 recorded'}</span></div>
    {block===2&&<section className="football-card"><h3>Who joined Green?</h3><p className="football-note">Two teams moved down from Blue and two moved up from Yellow. Records below cover scored Block 1 fixtures.</p><div className="football-scroll"><table className="football-table arrivals"><thead><tr>{['Team','Previous league','P','W','D','L','Pts','Change'].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{data.arrivals.map(q=><tr key={q.team}><th scope="row">{q.team}</th><td><span className={`league-tag ${q.league.toLowerCase()}`}>{q.league}</span><small>{q.league==='Blue'?'Under 11 Earthquakes':'Under 11 Hurricanes'}</small></td>{['p','w','d','l','pts'].map(k=><td key={k}>{q[k]}</td>)}<td>{q.league==='Blue'?'Down to Green':'Up to Green'}</td></tr>)}</tbody></table></div><p className="football-note">Bourneview had no wins or points in their five scored Blue matches. Dromore earned 6 points from two wins and three defeats. Hanover earned 10 points from three wins and a draw. Rathfriland won all five scored matches for 15 points.</p></section>}
    <section className="football-metrics" aria-label="Tandragee summary">{[['Position',`${rows.indexOf(us)+1} / ${rows.filter(q=>q.p).length}`],['Played',us.p],['Record',`${us.w}W · ${us.d}D · ${us.l}L`],['Points per game',(us.pts/us.p).toFixed(2)]].map(([label,value])=><div className="football-card" key={label}><span className="eyebrow">{label}</span><strong>{value}</strong></div>)}</section>
    <section className="football-card"><h3>Block {block} league table</h3><LeagueTable rows={rows}/><p className="football-note">3 points per win, 1 per draw. Order: points, goal difference, goals scored. Points per game = points ÷ matches played. Blank scores and no-match entries are excluded. Teams without scored results are unranked.</p></section>
    <section className="football-card"><h3><TeamText>Tandragee’s fixtures</TeamText></h3><div className="football-fixtures">{data.blocks[block].filter(m=>m.home==='Tandragee Rovers'||m.away==='Tandragee Rovers').map(m=><div key={m.week}><span>Week {m.week}</span><p><TeamText>{m.home}</TeamText> <strong>{m.hg===null||m.ag===null?'—':`${m.hg}–${m.ag}`}</strong> <TeamText>{m.away}</TeamText></p>{(m.hg===null||m.ag===null)&&<small>Score not recorded</small>}</div>)}</div></section>
    <section className="football-card"><h3>Findings so far</h3>{block===1?<p><TeamText>Tandragee finished lowest among the seven teams with scored results: one draw and four defeats. Week 8 was cancelled due to the storm. Five listed fixtures across the league have missing scores, including Seagoe v Tandragee in week 1. The recalled 4–2 defeat is unconfirmed and is excluded from this table.</TeamText></p>:<><p><TeamText>Tandragee have one win and two defeats, with 9 goals scored and 12 conceded. Hanover and St. Mary’s have won both their matches. Seagoe have lost to St. Mary’s and Annagh, both returning Green teams.</TeamText></p><p>We’ll add results through the end of Block 2, provisionally around week 16. Compare points per game if match counts remain uneven, alongside score margins and opponents faced when reviewing Blue or Yellow moves.</p></>}</section>
    </>}
    <footer className="football-footer"><p>Unofficial ability-group monitoring · Updated as results are reviewed.</p><a href={data.source} target="_blank" rel="noreferrer">Source results spreadsheet ↗</a></footer>{error&&<p role="alert">{error}</p>}
    </>}
    </main></div>;
}
