import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeCity} from './v7-cities-smoke.mjs';
import {DRAGONFALL_V14_ROLES} from '../../app/dist/dragonfall-v14-art.js';
import {materialPreset,resolveMaterialPreset} from '../../app/dist/material-presets.js';
const world=JSON.parse(fs.readFileSync(new URL('../../app/dist/world.json',import.meta.url),'utf-8'));
const bp=JSON.parse(fs.readFileSync(new URL('../../app/dist/city-blueprints.json',import.meta.url),'utf-8')).cities;
const dragonIds=world.cities.filter(c=>c.state===12).map(c=>c.i).sort((a,b)=>a-b);
const expected=[2,3,4,5,10,11,12,18,23,33,34,51,120,2003,2004,10001,10002].sort((a,b)=>a-b);
test('Dragonfall: 17 localidades presentes, sem adicionar cidades ao mapa-múndi',()=>{
 assert.deepEqual(dragonIds,expected);
 for(const id of expected){
  assert.ok(bp[String(id)]?.dragonfallV14,'sem perfil v14: '+id);
  assert.ok(DRAGONFALL_V14_ROLES[bp[String(id)].dragonfallV14.role]);
  assert.ok(bp[String(id)].urbanDesign?.districts?.length||id===2003);
 }
});
test('Dragonfall: todas as cenas geram marcos, bairros e geometria 3D válida',()=>{
 for(const id of expected){
  const {c,b,lay,result,site}=makeCity(id);
  assert.equal(c.state,12);
  assert.equal(lay.dragonfallV14.role,b.dragonfallV14.role);
  assert.ok(result.v14,`Cidade ${c.name} sem arte v14`);
  assert.ok(result.v14.landmarks>=1,`Cidade ${c.name} sem marcos`);
  assert.equal(lay.dragonfallMarks.length,result.v14.landmarks);
  for(const marker of lay.dragonfallMarks){
   assert.ok(Number.isFinite(marker.u)&&Number.isFinite(marker.v),'coordenada não-finita');
  }
  assert.ok(result.groups.length>=1);
  if(id===2003){
   assert.equal(b.pattern,'ruins');assert.equal(lay.pop,0);assert.equal(result.fabric,0);assert.equal(result.people.length,0);
  }else{
   assert.ok(result.people.length>0,`${c.name} sem circulação urbana`);
  }
  if([2,10001,2004].includes(id))assert.ok(result.v7?.treeHomes>0,`árvores élficas ausentes em ${c.name}`);
  if(id===3)assert.ok((result.v7?.palaces||0)>0,'Asgorath perdeu palácio');
  if(id===10)assert.ok(site.subterranean,'Dagorah perdeu galerias');
  if(id===23)assert.ok(site.mountainWall,'Winterhelm perdeu serra');
  for(const group of result.groups)group.traverse(o=>o.geometry?.dispose?.());
 }
});
test('Dragonfall: escolas, culturas e tamanho seguem a fonte',()=>{
 assert.equal(bp['4'].classification.architecture,'halfling');
 assert.equal(bp['11'].classification.architecture,'khajitt');
 assert.equal(bp['12'].classification.architecture,'husajita');
 assert.equal(bp['33'].classification.architecture,'draconato-volcanic');
 assert.equal(bp['10002'].classification.architecture,'draconato-volcanic');
 assert.equal(bp['2003'].features.empty,true);
 assert.equal(bp['5'].classification.magicCampus,true);
 assert.equal(world.cities.find(c=>c.i===2003).demographics.population,0);
 assert.equal(world.cities.find(c=>c.i===12).demographics.population,5000);
});
test('Dragonfall: materiais mudam por cultura e ambiente',()=>{
 const profiles={Asgorath:'dragonfall-royal',Ereth:'dragonfall-elfic',Savhalla:'dragonfall-caravan',Dagorah:'dragonfall-dwarven','Porto das Cinzas':'dragonfall-ash','Porto Sarandir':'dragonfall-volcanic',Rivertown:'dragonfall-halfling'};
 for(const [name,id] of Object.entries(profiles)){
  const m=resolveMaterialPreset({cityName:name});
  assert.equal(m.id,id);
  assert.ok(m.ground.rock&&m.roads.stoneA);
 }
 assert.ok(materialPreset('imperial').roads.stoneA);
});
test('Elucitor: os perfis imperiais e v12 continuam disponíveis',()=>{
 for(const id of [7,15,17,20,27,28,1240,1244,161])assert.ok(bp[String(id)]);
 assert.equal(bp['7'].pattern,'imperial-grid');
 assert.equal(bp['1240'].imperialV12.kind,'castamor');
 assert.equal(bp['20'].imperialV12.kind,'lorvus');
});
