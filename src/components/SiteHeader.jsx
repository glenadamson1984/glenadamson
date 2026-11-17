import Link from 'next/link';
export default function SiteHeader({active,actions}) {
  return <header className="site-header personal-header"><Link href="/" className="brand"><span className="personal-monogram" aria-hidden="true">GA<span/></span><span>GLEN<span className="brand-light"> / ADAMSON</span></span></Link><div className="personal-header-right"><nav aria-label="Main navigation">{[['/','Home'],['/about','About'],['/portfolio','Portfolio'],['/running','Running'],['/football','Football']].map(([href,label])=><Link key={href} href={href} aria-current={active===label.toLowerCase()?'page':undefined}>{label}{label==='Football'&&<small>PIN</small>}</Link>)}</nav>{actions}</div></header>;
}
