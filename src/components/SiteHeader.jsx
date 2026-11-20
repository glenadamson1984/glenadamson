import {useEffect,useState} from 'react';
import Link from 'next/link';
export default function SiteHeader({active,actions}) {
  const [admin,setAdmin]=useState(false);
  useEffect(()=>{let live=true;fetch('/api/master-session',{cache:'no-store'}).then(r=>r.json()).then(s=>{if(live)setAdmin(s.authenticated===true);}).catch(()=>{});return()=>{live=false;};},[]);
  return <header className="site-header personal-header"><Link href="/" className="brand"><span className="personal-monogram" aria-hidden="true">GA<span/></span><span>GLEN<span className="brand-light"> / ADAMSON</span></span></Link><div className="personal-header-right"><nav aria-label="Main navigation">{[['/','Home'],['/about','About'],['/portfolio','Portfolio'],['/playground','Playground'],...(admin?[['/admin','Admin'],['/football','Football']]:[])].map(([href,label])=><Link key={href} href={href} aria-current={active===label.toLowerCase()?'page':undefined}>{label}{label==='Football'&&<small>PIN</small>}</Link>)}</nav>{actions}</div></header>;
}
