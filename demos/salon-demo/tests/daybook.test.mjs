import test from 'node:test';import assert from 'node:assert/strict';
import {freshDay,validateBooking,advanceStatus,validSavedDay,decorate} from '../app/lib/daybook.mjs';
test('clashes consider full duration, stylist, adjacency and cancellations',()=>{
 const day=freshDay(),input={client:'Test Client',stylist:'Ava',service:'cut',start:570};
 assert.match(validateBooking(input,day),/already has/);
 assert.equal(validateBooking({...input,start:585,service:'blowdry'},day),'');
 assert.match(validateBooking({...input,start:585,service:'colour'},day),/already has/);
 assert.equal(validateBooking({...input,start:540,stylist:'Leo'},day.map(a=>({...a,status:'Cancelled'}))),'');
 assert.match(validateBooking({...input,start:1065},day),/09:00/);
 assert.match(validateBooking({...input,client:' '},day),/client name/);
});
test('workflow transitions are bounded and stored records are validated',()=>{
 assert.equal(advanceStatus('Scheduled'),'Arrived');assert.equal(advanceStatus('Arrived'),'In service');assert.equal(advanceStatus('In service'),'Completed');assert.equal(advanceStatus('Completed'),'Completed');
 assert.equal(validSavedDay(freshDay()),true);assert.equal(validSavedDay([{...freshDay()[0],service:'unknown'}]),false);assert.equal(validSavedDay([...freshDay(),freshDay()[0]]),false);
 assert.equal(decorate(freshDay()[0]).end,'09:45');
 const edited=freshDay();edited[0].status='Cancelled';assert.equal(freshDay()[0].status,'Completed');
});
