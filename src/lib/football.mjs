export function standings(matches, teams = []) {
  const table = new Map(teams.map(team => [team, { team, p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0 }]));
  for (const m of matches) {
    for (const team of [m.home, m.away]) if (!table.has(team)) table.set(team,{team,p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0});
    if (!Number.isFinite(m.hg) || !Number.isFinite(m.ag)) continue;
    for (const [team,gf,ga] of [[m.home,m.hg,m.ag],[m.away,m.ag,m.hg]]) {
      const q=table.get(team);q.p++;q.w+=Number(gf>ga);q.d+=Number(gf===ga);q.l+=Number(gf<ga);q.gf+=gf;q.ga+=ga;q.gd=q.gf-q.ga;q.pts=3*q.w+q.d;
    }
  }
  return [...table.values()].sort((a,b)=>Number(b.p>0)-Number(a.p>0)||b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.team.localeCompare(b.team));
}

export const LEAGUES = [
  {id:'red',name:'Red',group:'Dynamos',color:'#f4838f'},
  {id:'blue',name:'Blue',group:'Earthquakes',color:'#84b4ff'},
  {id:'green',name:'Green',group:'Tornadoes',color:'#7bcda4',team:'Tandragee Rovers'},
  {id:'yellow',name:'Yellow',group:'Hurricanes',color:'#f5d66d',team:'Tandragee Rovers Youth'},
];
export function leagueData(data,id) {
  return id==='green'?data:id==='yellow'?data.hurricanes:data.leagues[id];
}
export function leagueTeams(data,block) {
  return data.teamsByBlock?.[block] || (block===1?data.block1Teams:[]) || [];
}
export function scoreCoverage(data,block) {
  const fixtures=data.blocks[block] || [];
  const scored=fixtures.filter(m=>Number.isFinite(m.hg)&&Number.isFinite(m.ag)).length;
  return {listed:fixtures.length,scored,missing:fixtures.length-scored,cancelled:(data.cancelled?.[block]||[]).length};
}
// Membership comes from fixture listings, including cancelled matches, not bye notes.
export function blockMoves(data,id) {
  const selected=leagueData(data,id);
  const first=new Set(leagueTeams(selected,1)),second=new Set(leagueTeams(selected,2));
  const result=[];
  for(const [direction,teams,otherBlock] of [['Joined',[...second].filter(t=>!first.has(t)),1],['Left',[...first].filter(t=>!second.has(t)),2]]) {
    for(const team of teams.sort()) {
      const matches=LEAGUES.filter(l=>l.id!==id&&leagueTeams(leagueData(data,l.id),otherBlock).includes(team));
      const other=matches.length===1?matches[0]:null;
      const previous=direction==='Joined'?(other?leagueData(data,other.id):null):selected;
      const stats=previous?standings(previous.blocks[1],leagueTeams(previous,1)).find(q=>q.team===team)||null:null;
      result.push({team,direction,league:other?.name||'Not listed',group:other?.group||'',stats});
    }
  }
  return result;
}
