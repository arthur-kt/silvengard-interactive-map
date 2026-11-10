import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {routeReport} from '../../app/dist/route-info.js';
import {cleanNetwork} from '../../app/dist/network-core.js';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json')));

test('route inspector measures city intervals along bent geometry and pace changes',()=>{
 const D={settings:{distanceScale:1.5},cities:[{i:1,name:'A',x:0,y:0,visible:true},{i:2,name:'B',x:10,y:10,visible:true},{i:3,name:'C',x:20,y:10,visible:true},{i:4,name:'Hidden',x:10,y:0,visible:false}]};
 const route={kind:'road',points:[[0,0],[0,10],[10,10],[20,10]]};
 const r=routeReport(D,route);assert.equal(r.km,45);assert.equal(r.moving,10);assert.equal(r.days,2);
 assert.deepEqual(r.stops.map(s=>s.id),[1,2,3]);assert.deepEqual(r.stops.map(s=>s.legKm),[0,30,15]);
 assert.equal(r.averageLegKm,22.5);assert.equal(r.averageLegHours,5);
 assert.equal(routeReport(D,route,{pace:'fast'}).moving,7.5);
 assert.equal(routeReport(D,route,{pace:'slow'}).moving,15);
});

test('sea inspector uses actual harbour positions and adjustable ship speed',()=>{
 const D={settings:{distanceScale:1},cities:[{i:1,name:'Port',x:0,y:50,visible:true,harbor:{waterPoint:[0,0]}},{i:2,name:'Port 2',x:30,y:40,visible:true,harbor:{waterPoint:[30,0]}}]};
 const r=routeReport(D,{kind:'sea',points:[[0,0],[30,0]]},{shipSpeed:6});assert.equal(r.moving,5);assert.deepEqual(r.stops.map(s=>s.id),[1,2]);
});

test('canonical world omits cities and routes retired by the author',()=>{
 assert.equal(W.cities.length,152);assert.ok(W.cities.every(b=>b.visible&&!b.excluded));
 const ids=new Set(W.cities.map(b=>b.i));
 for(const r of W.routes){for(const id of [r.fromCity,r.toCity,...(r.stops||[])])if(id!=null)assert.ok(ids.has(id),r.name);}
 for(const id of W.citySelection.removedRouteIds)assert.ok(!W.routes.some(r=>r.id===id));
 const old=JSON.parse(fs.readFileSync(caminho('backups/v16-before-route-inspector/dist/world.json')));
 const retired=old.routes.find(r=>W.citySelection.removedRouteIds.includes(r.id));
 const imported=cleanNetwork({format:'silvengard-network-v1',baseVersion:13,routes:[{...retired,controls:[retired.points[0],retired.points.at(-1)]}],deleted:[]},W);
 assert.deepEqual(imported.routes,[]);
 const app=fs.readFileSync(caminho('dist/app.js'),'utf8'),html=fs.readFileSync(caminho('dist/index.html'),'utf8');
 assert.ok(!html.includes('id="allCities"'));assert.ok(!app.includes('id="cityIncluded"'));
 assert.ok(html.includes('data-layer="mist" checked'));
});

test('Aleravum academy is in Veniun at Vathnis and Gannas stays in Piglia',()=>{
 const a=W.cities.find(b=>b.i===4003),g=W.cities.find(b=>b.i===130);
 assert.equal(a.name,'Aleravum');assert.equal(a.state,28);assert.ok(a.magicSchool);
 assert.equal(g.name,'Gannas');assert.equal(g.state,33);assert.ok(!g.magicSchool);
 const river=W.rivers.find(r=>r.name==='Ghol-Cha');assert.ok(a.x>river.points[0][0]);assert.ok(Math.hypot(a.x-river.points[0][0],a.y-river.points[0][1])<30);
});
