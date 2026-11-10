import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createProvinceModel,cleanProvinceEdits,PROVINCE_FORMAT} from '../../app/dist/province-core.js';
import {bakeEdition} from '../../app/tools/bake-defaults.mjs';
const read=p=>JSON.parse(fs.readFileSync(caminho(p))),D=read('dist/world.json'),P=read('dist/province-proposal.json');
test('requested city transfers change provincial territories and preserve neighboring seats',()=>{
 const m=createProvinceModel(D,P),inProvince=city=>m.provinceAt(D.cities.find(b=>b.i===city).cell);
 assert.equal(inProvince(35).seat,1240);assert.equal(inProvince(1242).seat,1244);assert.equal(inProvince(68).seat,1239);
 assert.ok(m.stats(inProvince(1239).i).cities.length>=2);for(const p of P.provinces.filter(p=>p.state===13))assert.equal(inProvince(p.seat).i,p.i);
});
test('brush preserves water, states and official geography; undo and redo restore complete strokes',()=>{
 const before=JSON.stringify(D.cells),m=createProvinceModel(D,P),p=P.provinces.find(p=>p.seat===1239),city=D.cities.find(b=>b.i===1243),old=m.provinceAt(city.cell).i;
 m.begin();assert.ok(m.paint(city.x,city.y,12,p.i)>0);m.end();assert.equal(m.provinceAt(city.cell).i,p.i);
 const exported=m.exportData();assert.ok(exported.cells.length);for(const c of exported.cells)assert.equal(D.cells[c.i].state,p.state);
 m.undo();assert.equal(m.provinceAt(city.cell).i,old);m.redo();assert.equal(m.provinceAt(city.cell).i,p.i);
 m.begin();m.paint(960,470,1800,p.i);m.end();for(const c of D.cells)if(c.h<20||c.state!==p.state)assert.equal(m.data.cellProvinces[c.i],P.cellProvinces[c.i]);assert.equal(JSON.stringify(D.cells),before);
});
test('province edits round-trip names and boundaries, refresh population, and save with defaults',()=>{
 const m=createProvinceModel(D,P),p=P.provinces.find(p=>p.seat===1240),town=D.cities.find(b=>b.i===1244);
 m.rename(p.i,'Ducado do Sul');m.begin();m.paint(town.x,town.y,8,p.i);m.end();
 const data=JSON.parse(JSON.stringify(m.exportData())),other=createProvinceModel(D,P);other.importData(data);assert.deepEqual(other.exportData(),data);
 assert.equal(other.data.provinces.find(a=>a.i===p.i).name,'Ducado do Sul');const stats=other.stats(p.i);assert.ok(stats.cities.some(b=>b.i===1244));assert.equal(stats.population,stats.cities.reduce((n,b)=>n+b.demographics.population,0));
 const edition={format:'silvengard-atlas-v1',edits:{cities:{},states:{}},provinceEdits:data};const saved=bakeEdition(D,edition);assert.deepEqual(saved.defaultProvinceEdits,data);assert.deepEqual(saved.cities,D.cities);assert.deepEqual(saved.defaultJourneys,D.defaultJourneys);assert.equal(saved.provinces,undefined);
});
test('reject incompatible, duplicate, cross-state, water and invalid name edits before applying them',()=>{
 const m=createProvinceModel(D,P),id=P.provinces[0].i,base={format:PROVINCE_FORMAT,base:P.version,names:{},cells:[]};
 for(const raw of [{...base,base:'wrong'},{...base,names:{[id]:' '}},{...base,cells:[{i:D.cells.find(c=>c.h<20).i,province:id}]},{...base,cells:[{i:D.cells.find(c=>c.h>=20&&c.state!==P.provinces[0].state).i,province:id}]},{...base,cells:[{i:P.provinces[0].seed,province:id},{i:P.provinces[0].seed,province:id}]}])assert.throws(()=>m.importData(raw));
 assert.deepEqual(cleanProvinceEdits(base,D,P),base);assert.deepEqual(m.exportData(),base);
});
