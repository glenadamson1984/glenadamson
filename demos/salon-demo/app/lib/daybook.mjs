export const STORAGE_KEY='glen-salon-daybook-v1';
export const stylists=['Ava','Maya','Leo'];
export const services=[{id:'cut',name:'Cut & finish',duration:45,price:48},{id:'colour',name:'Colour & finish',duration:90,price:95},{id:'blowdry',name:'Blow-dry',duration:30,price:30}];
export const seed=[
 {id:'a1',client:'Sophie Reed',stylist:'Ava',service:'cut',start:540,status:'Completed'},
 {id:'a2',client:'Olivia Chen',stylist:'Maya',service:'colour',start:540,status:'In service'},
 {id:'a3',client:'Emily Walsh',stylist:'Leo',service:'cut',start:555,status:'Arrived'},
 {id:'a4',client:'Amelia Brooks',stylist:'Ava',service:'colour',start:615,status:'Scheduled'},
 {id:'a5',client:'Charlotte Bell',stylist:'Leo',service:'blowdry',start:630,status:'Scheduled'},
 {id:'a6',client:'Isla Morgan',stylist:'Maya',service:'cut',start:660,status:'Scheduled'},
 {id:'a7',client:'Grace Taylor',stylist:'Ava',service:'cut',start:750,status:'Scheduled'},
 {id:'a8',client:'Freya James',stylist:'Leo',service:'colour',start:735,status:'Scheduled'},
];
export function freshDay(){return seed.map(a=>({...a}));}
export function timeLabel(mins){return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;}
export function decorate(a){const s=services.find(s=>s.id===a.service);return {...a,serviceName:s.name,duration:s.duration,price:s.price,time:timeLabel(a.start),end:timeLabel(a.start+s.duration),statusClass:a.status.toLowerCase().replaceAll(' ','-'),nextLabel:({Scheduled:'Check in',Arrived:'Start service','In service':'Complete'})[a.status],canCancel:['Scheduled','Arrived'].includes(a.status)};}
export function validateBooking(input,appointments){
 if(typeof input.client!=='string'||input.client.trim().length<2||input.client.trim().length>60)return 'Enter a client name between 2 and 60 characters.';
 if(!stylists.includes(input.stylist))return 'Choose a stylist.';
 const service=services.find(s=>s.id===input.service);if(!service)return 'Choose a service.';
 if(!Number.isInteger(input.start)||input.start<540||input.start+service.duration>1080)return 'Choose a time that fits within 09:00–18:00.';
 if(input.start%15!==0)return 'Choose a time in 15-minute steps.';
 const clash=appointments.find(a=>a.stylist===input.stylist&&a.status!=='Cancelled'&&input.start<a.start+services.find(s=>s.id===a.service).duration&&input.start+service.duration>a.start);
 return clash?`${input.stylist} already has a booking at ${timeLabel(clash.start)}. Choose another time or stylist.`:'';
}
export function advanceStatus(status){return ({Scheduled:'Arrived',Arrived:'In service','In service':'Completed'})[status]||status;}
export function validSavedDay(value){return Array.isArray(value)&&value.length<=200&&new Set(value.map(a=>a?.id)).size===value.length&&value.every(a=>a&&typeof a.id==='string'&&typeof a.client==='string'&&a.client.length>=2&&a.client.length<=60&&stylists.includes(a.stylist)&&services.some(s=>s.id===a.service)&&Number.isInteger(a.start)&&a.start>=540&&a.start+services.find(s=>s.id===a.service).duration<=1080&&['Scheduled','Arrived','In service','Completed','Cancelled'].includes(a.status));}
