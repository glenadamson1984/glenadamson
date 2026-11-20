import Head from 'next/head';
import {useRouter} from 'next/router';
const origin='https://www.glenadamson.co.uk';
const pages={
 '/':['Glen Adamson | Software Engineer & Modern Software Founder','Glen Adamson: software engineer and founder of Modern Software in Northern Ireland. Explore working software projects, creative experiments and personal interests.'],
 '/about':['About Glen Adamson | Software Engineering & Career','Meet Glen Adamson, founder of Modern Software. Explore his software engineering career, consultancy experience, design interests and grassroots football coaching.'],
 '/portfolio':['Software Development Portfolio | Glen Adamson','Explore Glen Adamson’s working software prototypes, including Modern Warehouse, an Ember salon daybook and interactive tools. View demos and source code.'],
 '/playground':['Pixel Tennis: Glen vs Mossbyte | Glen Adamson','Play Glen versus Mossbyte: a pixel tennis game with keyboard, mouse and touch controls. A creative software experiment by Glen Adamson.'],
 '/running':['RunningPrep | Your Running, Compared Over Time','Explore RunningPrep: week-on-week and year-on-year running trends, pace, distance and consistency. A product preview by Modern Software.'],
 '/coaching':['Football Coaching Portadown | Glen Adamson','Explore a future one-to-one football coaching concept in Portadown, Northern Ireland. Parent expressions of interest; lessons are not yet available.'],
 '/pixel-me':['Pixel Me | Free Photo to Pixel Art Tool','Convert a photo into pixel art in your browser. Original, pink and mint palettes, adjustable detail and a free PNG download. No upload or account required.'],
};
export default function SiteSEO({privateView=false}){
 const {pathname}=useRouter();const entry=pages[pathname];const noindex=!entry||privateView;
 const canonical=origin+(pathname==='/'?'':pathname);
 const person={'@context':'https://schema.org','@type':'Person','@id':origin+'/#person',name:'Glen Adamson',url:origin,jobTitle:'Software Engineer and Founder',worksFor:{'@type':'Organization',name:'Modern Software',url:'https://modern-software.co.uk'},sameAs:['https://www.linkedin.com/in/glenadamson','https://github.com/glenadamson1984'],image:origin+'/glen-pixel-portrait.png'};
 return <Head>{entry&&<title>{entry[0]}</title>}{entry&&<meta name="description" content={entry[1]} key="description"/>}<meta name="robots" content={noindex?'noindex,follow':'index,follow'} key="robots"/>{entry&&<link rel="canonical" href={canonical} key="canonical"/>}{entry&&<><meta property="og:type" content={pathname==='/about'?'profile':'website'}/><meta property="og:site_name" content="Glen Adamson"/><meta property="og:title" content={entry[0]}/><meta property="og:description" content={entry[1]}/><meta property="og:url" content={canonical}/><meta property="og:image" content={origin+'/glen-pixel-portrait.png'}/><meta property="og:locale" content="en_GB"/><meta name="twitter:card" content="summary"/><meta name="twitter:title" content={entry[0]}/><meta name="twitter:description" content={entry[1]}/><meta name="twitter:image" content={origin+'/glen-pixel-portrait.png'}/></>}{['/','/about'].includes(pathname)&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(person).replace(/</g,'\\u003c')}}/>}</Head>;
}
