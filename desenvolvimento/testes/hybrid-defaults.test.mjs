import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mixedParts,flattenParts} from '../../app/dist/hybrid-core.js';
import {createRouter,simulate} from '../../app/dist/travel-core.js';
import {routeReport} from '../../app/dist/route-info.js';
import {createNetworkModel,cleanNetwork} from '../../app/dist/network-core.js';
import {bakeEdition} from '../../app/tools/bake-defaults.mjs';
const read=p=>JSON.parse(fs.readFileSync(caminho(p))),W=read('dist/world.json');

test('a hybrid crosses registered ports and calculates each mode at its own speed',()=>{
 const towns=[45,2002].map(i=>W.cities.find(b=>b.i===i)),raw=createRouter(W).trace(towns.map(b=>[b.x,b.y]),'mixed'),parts=mixedParts(W,raw),route={id:'test-mixed',name:'Teste híbrido',kind:'mixed',points:flattenParts(parts),parts,controls:towns.map(b=>[b.x,b.y])};
 assert.ok(parts.some(p=>p.kind==='road'));assert.ok(parts.some(p=>p.kind==='sea'));
 const report=routeReport(W,route);assert.ok(Math.abs(report.moving-report.roadKm/4.5-report.seaKm/11)<1e-8);
 const fast=routeReport(W,route,{shipSpeed:20});assert.ok(fast.moving<report.moving);assert.equal(fast.roadKm,report.roadKm);
 const D=structuredClone(W),model=createNetworkModel(D);model.save(route);const exported=JSON.parse(JSON.stringify(model.exportData()));assert.equal(cleanNetwork(exported,D).routes.find(r=>r.id===route.id).kind,'mixed');
 const copy=structuredClone(W),other=createNetworkModel(copy);other.importData(exported);assert.deepEqual(copy.routes.find(r=>r.id===route.id).parts,parts);
 const result=simulate([{km:36,road:true},{km:88,sea:true}],{shipSpeed:11,hours:8});assert.equal(result.moving,16);assert.equal(result.seaMoving,8);
});
test('hybrid routing cannot switch between land and sea without a port',()=>{
 const D={...W,cities:W.cities.map(b=>({...b,harbor:null}))},towns=[26,2002].map(i=>D.cities.find(b=>b.i===i));
 assert.throws(()=>createRouter(D).trace(towns.map(b=>[b.x,b.y]),'mixed'),/caminho|marítima/);
});
test('the supplied edition 11 is the exact saved default, including its maritime geometry',()=>{
 const E=read('silvengard-edicao%20(11).json'),current=W.cities.find(b=>b.i===10002);assert.equal(current.name,'Porto Sarandir');
 assert.deepEqual([W.cities.find(b=>b.i===18).x,W.cities.find(b=>b.i===18).y],E.edits.cities[18].position);
 const sea=E.networkEdits.routes.find(r=>r.id==='sea-trunk-north'),actual=W.routes.find(r=>r.id===sea.id);assert.deepEqual(actual.points,sea.points.map(p=>p.slice(0,2)));assert.deepEqual(actual.stops,sea.stops);
 const copy=bakeEdition(W,{format:'silvengard-atlas-v1',exportedAt:'test',journeys:{version:1,parties:[],active:null},edits:{cities:{23:{inhabitants:1234,name:'Winterhelm'}},states:{}},mapEdits:{format:'silvengard-map-edits-v1',baseRevision:W.revision,grid:W.grid,cells:[]}});
 assert.equal(copy.cities.find(b=>b.i===23).demographics.population,1234);assert.notEqual(W.cities.find(b=>b.i===23).demographics.population,1234);assert.ok(copy.savedDefaults.id);assert.deepEqual(copy.defaultJourneys,W.defaultJourneys);
});
test('approved province boundaries preserve political cells and remain editable',()=>{
 const p=read('dist/province-proposal.json');assert.equal(p.approved,true);assert.equal(p.cellProvinces.length,W.cells.length);assert.equal(p.provinces.filter(p=>p.state===13).length,13);
 const provinces=new Map(p.provinces.map(p=>[p.i,p]));for(const c of W.cells){const id=p.cellProvinces[c.i];if(c.h<20||!c.state){assert.equal(id,0);continue;}assert.equal(provinces.get(id)?.state,c.state);}
 assert.ok(!W.cells.some(c=>Object.hasOwn(c,'province')));assert.equal(W.provinces,undefined);
});
