import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {societyField} from '../../app/dist/society-core.js';
import {orderItems} from '../../app/dist/list-order.js';
import {createLandmarkModel,cleanLandmarkEdits,applyLandmarkEdits,LANDMARK_FORMAT} from '../../app/dist/landmark-core.js';
import {bakeEdition} from '../../app/tools/bake-defaults.mjs';
import {createMapEditor,validateMapEdits} from '../../app/dist/editor-core.js';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json'))),P=JSON.parse(fs.readFileSync(caminho('dist/province-proposal.json')));
test('automatic city influence respects water, political borders and disconnected land',()=>{
 const D={revision:1,cultures:[{i:1},{i:2},{i:3}],religions:[{i:30},{i:31},{i:32}],cells:[
 {i:0,p:[0,0],h:30,state:1,c:[1]}, {i:1,p:[1,0],h:30,state:1,c:[0,2]}, {i:2,p:[2,0],h:30,state:2,c:[1,3]}, {i:3,p:[3,0],h:30,state:2,c:[2]}, {i:4,p:[0,2],h:10,state:1,c:[]}, {i:5,p:[0,3],h:30,state:1,c:[]}],cities:[{i:1,cell:0,state:1,culture:1,faith:{i:30},demographics:{population:50}},{i:2,cell:3,state:2,culture:2,faith:{i:31},demographics:{population:500}}]};
 const source={revision:1,culture:[3,3,3,3,3,3],religion:[32,32,32,32,32,32]},m=societyField(D,source);
 assert.deepEqual([...m.culture],[1,1,2,2,-1,3]);assert.deepEqual([...m.religion],[30,30,31,31,-1,32]);assert.equal(m.owner[5],-1);
 D.cities[0].culture=3;D.cities[0].faith.i=32;assert.equal(societyField(D,source).religion[1],32);assert.equal(societyField(D,source).culture[1],3);
 D.cities[0].demographics.population=0;assert.equal(societyField(D,source).owner[0],-1);
});
test('current cities keep their own cultures and faiths without modifying political cells or provinces',()=>{
 const before=JSON.stringify(W),m=societyField(W);for(const b of W.cities.filter(b=>b.demographics.population>0)){assert.equal(m.culture[b.cell],b.culture);assert.equal(m.religion[b.cell],b.faith.i);}
 assert.equal(JSON.stringify(W),before);assert.equal(P.approved,true);
});
test('alphabetical and population orders are deterministic and never mutate the original list',()=>{
 const towns=[{name:'Zeta',demographics:{population:5}},{name:'Álamo',demographics:{population:2}},{name:'Beta',demographics:{population:5}}],before=structuredClone(towns);
 assert.deepEqual(orderItems(towns,'name').map(t=>t.name),['Álamo','Beta','Zeta']);assert.deepEqual(orderItems(towns,'population').map(t=>t.name),['Beta','Zeta','Álamo']);assert.deepEqual(towns,before);
});
test('culture and faith brushes override only painted land and can return to automatic city influence',()=>{
 const D=structuredClone(W),town=D.cities.find(b=>b.i===16),before=structuredClone(town),editor=createMapEditor(D);
 editor.begin();editor.paint(town.x,town.y,8,{cultureOverride:15,religionOverride:31});editor.end();let m=societyField(D);assert.equal(m.culture[town.cell],15);assert.equal(m.religion[town.cell],31);assert.deepEqual(town,before);
 const raw=JSON.parse(JSON.stringify(editor.exportData()));validateMapEdits(raw,D);const saved=bakeEdition(W,{format:'silvengard-atlas-v1',edits:{cities:{},states:{}},mapEdits:raw});assert.equal(societyField(saved).culture[town.cell],15);
 editor.undo();assert.equal(societyField(D).culture[town.cell],town.culture);editor.redo();assert.equal(societyField(D).culture[town.cell],15);
 editor.begin();editor.paint(town.x,town.y,8,{cultureOverride:-1,religionOverride:-1});editor.end();m=societyField(D);assert.equal(m.culture[town.cell],town.culture);assert.equal(m.religion[town.cell],town.faith.i);
 assert.throws(()=>validateMapEdits({...raw,cells:[{i:town.cell,cultureOverride:999}]},D),/Cultura/);
});
test('points support description, creation, deletion, restoring, round-trip and stable identities after saving',()=>{
 const D=structuredClone(W),model=createLandmarkModel(D),first=D.landmarks[0],second=D.landmarks[1],n={id:'poi-user-test',name:'Santuário',kind:'santuário',description:'Primeira linha\nSegunda linha',point:[100,200]};
 model.save({...first,description:'Uma descrição nova'});model.save(n);model.remove(first.id);model.remove(n.id);
 const raw=JSON.parse(JSON.stringify(model.exportData())),copy=structuredClone(W),other=createLandmarkModel(copy);other.importData(raw);assert.ok(!copy.landmarks.some(l=>l.id===first.id));assert.ok(copy.landmarks.some(l=>l.id===second.id));
 other.restore(n.id);assert.equal(copy.landmarks.find(l=>l.id===n.id).description,n.description);other.restore(first.id);assert.equal(copy.landmarks.find(l=>l.id===first.id).description,'Uma descrição nova');
 const edition={format:'silvengard-atlas-v1',edits:{cities:{},states:{}},landmarkEdits:other.exportData()},saved=bakeEdition(W,edition);assert.equal(saved.landmarks.find(l=>l.id===n.id).description,n.description);assert.deepEqual(saved.cities,W.cities);assert.deepEqual(saved.defaultProvinceEdits,W.defaultProvinceEdits);
 const again=createLandmarkModel(saved);again.remove(first.id);const next=applyLandmarkEdits(saved,again.exportData());assert.ok(next.landmarks.some(l=>l.id===second.id));assert.ok(!next.landmarks.some(l=>l.id===first.id));
});
test('malformed coordinates, duplicate points and invalid imports fail before changing any point',()=>{
 const D=structuredClone(W),model=createLandmarkModel(D),before=JSON.stringify(D),base={format:LANDMARK_FORMAT,items:[],deleted:[]};
 for(const point of [[NaN,20],[-1,20],[1921,20],[10,938]])assert.throws(()=>model.save({id:'poi-user-bad',name:'X',kind:'ruínas',description:'',point}));
 assert.throws(()=>cleanLandmarkEdits({...base,deleted:['poi-a','poi-a']}));assert.throws(()=>model.importData({...base,items:[{id:'bad'}]}));assert.equal(JSON.stringify(D),before);
});
