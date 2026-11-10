import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {options,simulate,upgradeSeaPace,SEA_PACES} from '../../app/dist/travel-core.js';
import {routeReport} from '../../app/dist/route-info.js';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json'))),town=id=>W.cities.find(b=>b.i===id);

test('Aleravum crosses the same river bank and its complete terrace clears the river',()=>{
 const river=W.rivers.find(r=>r.name==='Ghol-Cha'),a=town(4003),old=[795,466],p=river.points[0],q=river.points[1];
 const side=xy=>(q[0]-p[0])*(xy[1]-p[1])-(q[1]-p[1])*(xy[0]-p[0]);
 assert.ok(side(old)*side([a.x,a.y])<0);
 let minimum=Infinity;
 for(let i=1;i<river.points.length;i++){
  const p=river.points[i-1],q=river.points[i],dx=q[0]-p[0],dy=q[1]-p[1],t=Math.max(0,Math.min(1,((a.x-p[0])*dx+(a.y-p[1])*dy)/(dx*dx+dy*dy)));
  minimum=Math.min(minimum,Math.hypot(a.x-p[0]-t*dx,a.y-p[1]-t*dy));
 }
 assert.ok(minimum>19,`river clearance ${minimum}`);assert.equal(a.state,28);
});

test('Marshell has a single new capital, relocated Grainhem and no retired cities',()=>{
 assert.equal(W.states.find(s=>s.i===34).capital,140);assert.ok(town(140).capital);assert.ok(!town(75).capital);
 assert.deepEqual(W.cities.filter(b=>b.state===34&&b.capital).map(b=>b.i),[140]);
 assert.deepEqual([town(149).x,town(149).y],[615.41,563.085]);
 for(const id of [103,175,192])assert.equal(town(id),undefined);
 for(const r of W.routes)assert.ok(![r.fromCity,r.toCity,...(r.stops||[])].some(id=>[103,175,192].includes(id)));
 for(const id of [140,149])assert.ok(W.routes.some(r=>r.authorConnection&&r.points.some(p=>Math.hypot(p[0]-town(id).x,p[1]-town(id).y)<.1)));
});

test('maritime presets are 6, 11 and 20 km/h and walking remains 4.5',()=>{
 assert.deepEqual(Object.values(SEA_PACES).map(p=>p.speed),[6,11,20]);assert.equal(options().shipSpeed,11);assert.equal(W.settings.shipSpeed,11);
 for(const speed of [6,11,20])assert.equal(simulate([{km:speed*4,sea:true}],{shipSpeed:speed}).moving,4);
 assert.equal(simulate([{km:18,road:true}]).moving,4);
 const sea=W.routes.find(r=>r.kind==='sea');assert.equal(routeReport(W,sea).speed,11);
});

test('old default speeds migrate in party settings without altering plans or history',()=>{
 const data={parties:[{settings:{shipSpeed:4.5},plans:[{settings:{shipSpeed:4.5}}],history:[{moving:10}]},{settings:{shipSpeed:13},plans:[],history:[]}]};
 upgradeSeaPace(data);assert.equal(data.parties[0].settings.shipSpeed,11);assert.equal(data.parties[1].settings.shipSpeed,13);assert.equal(data.parties[0].plans[0].settings.shipSpeed,4.5);assert.equal(data.parties[0].history[0].moving,10);
 data.parties[0].settings.shipSpeed=4.5;upgradeSeaPace(data);assert.equal(data.parties[0].settings.shipSpeed,4.5);
});
