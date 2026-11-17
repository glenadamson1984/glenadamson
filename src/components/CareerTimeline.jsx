import { useEffect, useRef, useState } from 'react';

const milestones = [
  { year:'2007', company:'Sentel', dates:'September 2007 – September 2013', title:'Engineering into product leadership', description:'Progressed through engineering and IT roles into Product Owner and Software Development Manager. Contributed to product launches, introduced Scrum and helped connect engineering with the wider business.', tags:['Product ownership','Team leadership','SQL & .NET'] },
  { year:'2013', company:'Glen Dimplex', dates:'September 2013 – November 2014', title:'Senior Product Consultant', description:'Turned complex specifications into deliverable work, building, testing and adapting applications as requirements evolved.', tags:['Product delivery','Software engineering','Collaboration'] },
  { year:'2014', company:'Allstate', dates:'November 2014 – July 2019', title:'From senior engineer to Solutions Architect', description:'Progressed through senior engineering and Technical Lead roles into Solutions Architect and Project Lead. Led a global team supporting critical applications and worked on cloud migration architecture.', tags:['Technical leadership','Architecture','AWS'] },
  { year:'2019', company:'Relative', dates:'August 2019 – March 2021', title:'Senior Full Stack Cloud Engineer', description:'Delivered web and mobile applications across React, React Native, TypeScript and backend services, working with AWS serverless architecture in an Agile team.', tags:['React & React Native','Full stack','Serverless'] },
  { year:'2021', company:'Modern Software', dates:'May 2021 – Present', title:'Founder & Lead Software Consultant', description:'Founded my own consultancy, working directly with businesses from discovery through engineering and launch. Client products include restaurant operations and coroner call-out workflows. The following engagements sit within Modern Software.', tags:['Discovery to delivery','Client products','Consultancy'], link:'https://modern-software.co.uk' },
  { year:'2021', company:'TerraQuest', dates:'June 2021 – June 2022 · Modern Software engagement', title:'Software Consultant', description:'Contributed to a planning-permission application suite for the Northern Ireland Government, using React, Next.js, TypeScript, Gatsby and Azure.', tags:['React & Next.js','Public services','Azure'] },
  { year:'2022', company:'Sensoteq', dates:'June 2022 – September 2025 · Modern Software engagement', title:'Software Consultant', description:'Built cloud-native IoT applications with React and TypeScript, Node.js APIs and AWS serverless services. Worked with stakeholders and supported junior engineers through mentoring.', tags:['IoT interfaces','TypeScript','Mentoring'] },
  { year:'2025', company:'LoweConex', dates:'October 2025 – Present · Modern Software engagement', title:'Software Consultant', description:'Help develop an internal platform with React and TypeScript. Collaborate with product, design and backend colleagues on reusable components, API integration and consistent user journeys.', tags:['React & TypeScript','Reusable UI','Product collaboration'] },
];


const roleHistory = {
  Sentel: [
    { title:'Software Engineer', dates:'September 2007 – March 2009', detail:'Enhanced existing applications and produced operational documentation for system operators.' },
    { title:'Network Engineer', dates:'October 2007 – March 2008', detail:'Managed server setups and firewall rules, and implemented conferencing and remote monitoring software.' },
    { title:'Junior Software Engineer', dates:'March 2008 – September 2008', detail:'Extended two products using .NET 2.0 and Dundas graphic controls.' },
    { title:'Senior Software Engineer', dates:'March 2009 – March 2010', detail:'Contributed to five product launches, designed SQL Server databases and responded to defects.' },
    { title:'IT Manager – Head of Software/Hardware', dates:'March 2010 – September 2012', detail:'Coordinated resources, hardware and software implementation, and collaboration with marketing.' },
    { title:'Product Owner & Software Development Manager', dates:'May 2012 – September 2013', detail:'Oversaw two development teams, introduced Scrum and broke complex applications into manageable delivery tasks.' },
  ],
  Allstate: [
    { title:'Senior Software Consultant', dates:'November 2014 – July 2016', detail:'Designed and built solutions with attention to performance, availability and stability. Explored technical options and maintained engineering documentation.' },
    { title:'Technical Lead Consultant', dates:'July 2016 – October 2018', detail:'Led a global development team supporting critical applications, including agent-facing payment processing and card tokenisation.' },
    { title:'Solutions Architect & Project Lead', dates:'October 2018 – July 2019', detail:'Led cloud migration architecture planning from Pivotal Cloud Foundry towards AWS, providing architecture governance and technology recommendations.' },
  ],
};

export default function CareerTimeline(){
  const [selected,setSelected]=useState(0);
  const [visible,setVisible]=useState(false);
  const section=useRef(null);
  useEffect(()=>{
    if(!('IntersectionObserver' in window)){setVisible(true);return;}
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect();}},{threshold:0.15});
    observer.observe(section.current);return()=>observer.disconnect();
  },[]);
  const item=milestones[selected];
  const roles=roleHistory[item.company] || [{title:item.title,dates:item.dates,detail:item.description}];
  return <section ref={section} className={`career-timeline ${visible?'is-visible':''}`} aria-labelledby="career-title">
    <div className="personal-section-label"><span>THE JOURNEY SO FAR</span><span>ENGINEERING / PRODUCT / PEOPLE</span></div>
    <div className="career-heading"><h2 id="career-title">Built over time<span>.</span></h2><p>From my first engineering roles to building my own business. Select a milestone to explore every role, date and responsibility.</p></div>
    <div className="career-rail" role="group" aria-label="Career milestones">
      {milestones.map((entry,index)=><button key={entry.company} type="button" className={selected===index?'is-selected':''} aria-pressed={selected===index} aria-controls="career-detail" onClick={()=>setSelected(index)} style={{'--milestone':index}}><span className="career-year">{entry.year}</span><span className="career-dot" aria-hidden="true"/><span className="career-company">{entry.company}</span></button>)}
    </div>
    <article id="career-detail" className="career-detail" aria-label={`${item.company}: ${item.title}`}>
      <div key={item.company} className="career-detail-content"><span className="career-date">{item.dates}</span><div className="career-detail-heading"><div><span className="career-employer">{item.company}</span><h3>{item.title}</h3></div><span className="career-index" aria-hidden="true">{String(selected+1).padStart(2,'0')} / 08</span></div>{roles.length>1&&<p>{item.description}</p>}<div className="career-role-history"><span className="career-roles-label">{roles.length===1?'ROLE & RESPONSIBILITIES':`${roles.length} ROLES / CAREER PROGRESSION`}</span><ol>{roles.map(role=><li key={role.title}><span className="career-role-date">{role.dates}</span><h4>{role.title}</h4><p>{role.detail}</p></li>)}</ol>{item.company==='Sentel'&&<p className="career-overlap-note">Some role dates overlap, as recorded in my career history.</p>}</div><div className="career-tags">{item.tags.map(tag=><span key={tag}>{tag}</span>)}</div>{item.link&&<a className="business-link" href={item.link} target="_blank" rel="noreferrer">Explore Modern Software ↗</a>}</div>
    </article>
    <p className="career-context">Since May 2021, consultancy engagements and bespoke client products have been delivered through Modern Software.</p>
  </section>;
}
