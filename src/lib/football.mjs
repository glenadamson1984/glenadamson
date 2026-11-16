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
