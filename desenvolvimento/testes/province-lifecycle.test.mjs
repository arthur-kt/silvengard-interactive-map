import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createProvinceModel,cleanProvinceEdits} from '../../app/dist/province-core.js';
import {bakeEdition} from '../../app/tools/bake-defaults.mjs';
const read=p=>JSON.parse(fs.readFileSync(caminho(p))),W=read('dist/world.json'),P=read('dist/province-proposal.json');
test('only provinces without assigned land are pruned, preserving every authored territory and name',()=>{
 const m=createProvinceModel(W,P);m.importData(read('silvengard-provincias%20(2).json'));const cells=m.data.cellProvinces.slice(),before=new Map(m.data.provinces.map(p=>[p.i,p.name]));const removed=m.pruneEmpty();assert.equal(removed.length,12);assert.deepEqual(m.data.cellProvinces,cells);
 assert.ok(m.data.provinces.some(p=>p.i===29));for(const p of m.data.provinces)assert.equal(p.name,before.get(p.i));m.undo();assert.equal(m.data.provinces.length,79);m.redo();assert.equal(m.data.provinces.length,67);
 const e=JSON.parse(JSON.stringify(m.exportData())),copy=createProvinceModel(W,P);copy.importData(e);assert.deepEqual(copy.exportData(),e);assert.throws(()=>copy.remove(29),/território/);
});
test('created provinces can be painted, undone, exported and saved; occupied provinces cannot be deleted',()=>{
 const m=createProvinceModel(W,P);if(W.defaultProvinceEdits)m.importData(W.defaultProvinceEdits);const p=m.create(13,'Ducado novo'),city=W.cities.find(b=>b.i===1244),old=m.provinceAt(city.cell).i;
 m.begin();m.paint(city.x,city.y,8,p.i);m.end();assert.equal(m.provinceAt(city.cell).i,p.i);assert.throws(()=>m.remove(p.i),/Transfira/);
 const e=JSON.parse(JSON.stringify(m.exportData())),copy=createProvinceModel(W,P);copy.importData(e);assert.equal(copy.provinceAt(city.cell).name,'Ducado novo');
 const saved=bakeEdition(W,{format:'silvengard-atlas-v1',edits:{cities:{},states:{}},provinceEdits:e});assert.deepEqual(saved.defaultProvinceEdits,e);
 m.begin();m.paint(city.x,city.y,8,old);m.end();assert.equal(m.stats(p.i).count,0);m.remove(p.i);assert.ok(!m.data.provinces.some(v=>v.i===p.i));m.undo();assert.equal(m.data.provinces.find(v=>v.i===p.i).name,'Ducado novo');
});
test('invalid province creation and deleting occupied provinces through imports are rejected before mutation',()=>{
 const m=createProvinceModel(W,P),before=JSON.stringify(m.data);for(const [state,name]of [[0,'Nome'],[999,'Nome'],[13,'  ']])assert.throws(()=>m.create(state,name));
 const raw={format:'silvengard-province-edits-v1',base:P.version,names:{},cells:[],deleted:[10]};assert.throws(()=>m.importData(raw),/território/);assert.equal(JSON.stringify(m.data),before);
 const created=m.create(13,'X'),e=m.exportData();assert.throws(()=>cleanProvinceEdits({...e,created:[...e.created,...e.created]},W,P),/duplicada/);assert.ok(created.i>79);
});
