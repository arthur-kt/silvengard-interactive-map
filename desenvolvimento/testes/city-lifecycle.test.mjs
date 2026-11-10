import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newCity,connectNewCity,planCityDeletion,repairCapitals} from '../../app/dist/city-lifecycle.js';
import {routeReport} from '../../app/dist/route-info.js';
import {populationField,populationColor} from '../../app/dist/population-core.js';
import {createCityManager} from '../../app/dist/city-manager.js';
import {createNetworkModel} from '../../app/dist/network-core.js';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json')));

test('a created city survives a JSON round trip, inherits regional culture, and connects over land',()=>{
 const near=W.cities.find(b=>b.i===23),raw={created:true,name:'Cidade de teste',inhabitants:1250,religion:30,position:[near.x+5,near.y+4]};
 const b=newCity(W,20001,raw),again=newCity(W,20001,JSON.parse(JSON.stringify(raw)));
 assert.deepEqual(b,again);assert.equal(b.demographics.population,1250);assert.equal(b.faith.i,30);assert.equal(b.state,12);
 const road=connectNewCity(W,b);assert.equal(road.fromCity,b.i);assert.ok(road.points.every(p=>W.cells[Math.floor(p[1]/W.grid.stepY)*W.grid.columns+Math.floor(p[0]/W.grid.stepX)].h>=20));
 const plan=planCityDeletion({...W,cities:[...W.cities,b],routes:[...W.routes,road]},b.i);assert.ok(!plan.routes.some(r=>r.id===road.id));
 assert.throws(()=>newCity(W,20001,{...raw,position:W.cells.find(c=>c.h<20).p}),/terra/);
});
test('removing a port cleans every route reference and drops dead ends without altering map cells',()=>{
 const before=JSON.stringify(W.cells),plan=planCityDeletion(W,18);assert.ok(plan.removed+plan.adjusted>0);
 assert.ok(!plan.cities.some(b=>b.i===18));for(const r of plan.routes){assert.notEqual(r.fromCity,18);assert.notEqual(r.toCity,18);assert.ok(!r.stops?.includes(18));assert.ok(r.points.length>=2);}
 assert.equal(JSON.stringify(W.cells),before);assert.ok(W.cities.some(b=>b.i===18));
});
test('removing an intermediate stop preserves the continuous principal road',()=>{
 const r=W.routes.find(r=>r.kind==='road'&&r.majorRoute),stops=routeReport(W,r).stops;
 const middle=stops.find((s,i)=>i>0&&i<stops.length-1&&s.id!==r.fromCity&&s.id!==r.toCity);assert.ok(middle);
 const plan=planCityDeletion(W,middle.id),after=plan.routes.find(n=>n.id===r.id);assert.ok(after);assert.deepEqual(after.points,r.points);
});
test('deleting a capital assigns one remaining capital and handles a state with no cities',()=>{
 const d=structuredClone(W),old=d.states.find(s=>s.i===34).capital;d.cities=d.cities.filter(b=>b.i!==old);repairCapitals(d);
 const s=d.states.find(s=>s.i===34);assert.notEqual(s.capital,old);assert.equal(d.cities.filter(b=>b.state===34&&b.capital).length,1);
 d.cities=d.cities.filter(b=>b.state!==34);repairCapitals(d);assert.equal(s.capital,0);
});
test('population heat changes with city counts, leaves water untouched, and handles an empty city',()=>{
 const zero=W.cities.find(b=>b.i===2003),data=populationField({...W,cities:[zero]});assert.equal(data.max,0);assert.ok(data.field.every(v=>v===0));
 const heat=populationField(W);assert.ok(heat.max>0);for(const c of W.cells)if(c.h<20)assert.equal(heat.field[c.i],0);
 const a=populationColor(100,heat.max),b=populationColor(heat.max,heat.max);assert.ok(b[1]<a[1]);assert.ok(b[0]>b[1]);
});
test('reopening a deletion retains the canonical network baseline and restoring the capital restores its office',()=>{
 const D=structuredClone(W),id=140,plan=planCityDeletion(D,id),archive=D.routes.filter(r=>plan.routes.find(n=>n.id===r.id)!==r);
 const edits={cities:{[id]:{deleted:true,restoreRoutes:archive}},states:{}},baseline=structuredClone(D.routes);let model;
 const manager=createCityManager({D,getEdits:()=>edits,save(){},toast(){},refresh(){},selectCity(){},clearSelection(){},journeys:()=>null,network:()=>({replaceRoutes(routes){model.replaceAll(routes);}})});
 manager.applyStored();assert.ok(!D.cities.some(b=>b.i===id));assert.deepEqual(D.routes,baseline);assert.notEqual(D.states.find(s=>s.i===34).capital,id);
 model=createNetworkModel(D);manager.reconcileRoutes();assert.ok(D.routes.every(r=>r.fromCity!==id&&r.toCity!==id&&!r.stops?.includes(id)));
 manager.restore(id);assert.equal(D.states.find(s=>s.i===34).capital,id);assert.ok(D.cities.find(b=>b.i===id).capital);
 model.importData({format:'silvengard-network-v1',baseVersion:D.networkDefaults.version,routes:[],deleted:[]});assert.equal(D.routes.length,baseline.length);
});
