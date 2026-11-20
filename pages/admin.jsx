import Link from 'next/link';
import SiteHeader from '../src/components/SiteHeader';
import SiteFooter from '../src/components/SiteFooter';
export async function getServerSideProps(context){const {requireAdmin}=await import('../src/server/private-access.mjs');return requireAdmin(context,'/admin')||{props:{isMaster:true}};}
export default function Admin(){return <div className="personal-site"><SiteHeader/><main className="portfolio-heading"><span className="personal-kicker">PRIVATE WORKSPACE</span><h1>Welcome back<span>.</span></h1><p>Your personal dashboards. These links only appear after admin login.</p><div className="project-links"><Link href="/football">Football statistics</Link><Link href="/running-dashboard">My RunningPrep dashboard</Link><button onClick={async()=>{const r=await fetch('/api/master-session',{method:'DELETE'});if(r.ok)location.assign('/');}}>Sign out</button></div></main><SiteFooter/></div>;}
