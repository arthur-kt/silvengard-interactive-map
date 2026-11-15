import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeCity} from './v7-cities-smoke.mjs';
import {castamorHillHeight,miningPassPoint,miningRidgeHeight,cityImperialRole} from '../../app/dist/imperial-v12-core.js';
const D=JSON.parse(fs.readFileSync(new URL('../../app/dist/world.json',import.meta.url)));
const drop=city=>city.result.groups.forEach(group=>group.traverse(o=>o.geometry?.dispose?.()));
const city=(id,fn)=>{const c=makeCity(id);try{fn(c)}finally{drop(c)}};
test('identidades e nomes conferem com as cidades imperiais e nao alteram world.json',()=>{
 for(const [id,n,role] of [[1240,'Castamor','castamor'],[20,'Lorvus','lorvus'],[1244,'Alia','alia'],[27,'Tramor','tramor'],[15,'Ignis','rimae-fort'],[17,'Nostris','rimae-fort'],[28,'Vostris','rimae-fort'],[161,'Bomaria','rimae-market']]){
  assert.equal(D.cities.find(c=>c.i===id).name,n);
  assert.equal(cityImperialRole(id),role);
 }
 assert.ok(D.fortifications.some(x=>x.name==='Muralha de Rimae'));
});
test('Castamor tem morro central real, mais alto que suas bordas, castelo e acesso espiral',()=>city(1240,c=>{
 const R=c.site.imperialV12.citadelHill.radiusM;
 assert.ok(c.field.heightM(0,0)-c.field.heightM(R+190,0)>65);
 assert.ok(castamorHillHeight(c.site,0,0)>=70);
 assert.ok(c.lay.roads.some(r=>r.access&&r.pts.length>=200));
 assert.ok(c.result.v12.castamor.castle);
 assert.ok(c.result.v12.castamor.ruinedWatchtower);
 assert.ok(c.lay.walled);
}));
test('Lorvus permanece pobre e pequena: mina e forja, duas bocas e tecido urbano limitado',()=>city(20,c=>{
 const mine=c.site.imperialV12.miningPass;
 const p=miningPassPoint(c.site,mine.centerM,66),clear=miningPassPoint(c.site,mine.centerM,0);
 assert.ok(miningRidgeHeight(c.site,p.x,p.z)>75,'faltam paredes de montanha ao lado do tunel');
 assert.ok(miningRidgeHeight(c.site,clear.x,clear.z)<3,'passagem deve atravessar o relevo em nivel baixo');
 assert.ok(c.result.v12.lorvus.minePass&&c.result.v12.lorvus.forge);
 assert.equal(c.result.v12.lorvus.exits,2);
 assert.ok(c.result.fabric<=88,`tecido urbano exagerado: ${c.result.fabric}`);
 assert.equal(c.lay.walled,false);
 assert.equal(c.lay.center,'well');
 assert.ok(c.lay.roads.some(r=>r.mineRoad));
}));
test('Condado de Alia com pomares, celeiros, lavoura e traçado rural, sem muralhas',()=>city(1244,c=>{
 assert.equal(c.b.classification.imperialProvince,'Condado de Alia');
 assert.equal(c.lay.pattern,'forest-settlement');
 assert.ok(c.result.v12.alia.orchards>=10);
 assert.ok(c.result.v12.alia.fields>=3);
 assert.equal(c.lay.walled,false);
 assert.ok(c.result.fabric<=380);
}));
test('Tramor eh um entreposto provincial modesto com mercado e sem cidadela',()=>city(27,c=>{
 assert.equal(c.b.classification.imperialProvince,'Marca de Althor');
 assert.ok(c.result.v12.tramor.marketStalls>=1);
 assert.equal(c.lay.walled,false);
 assert.ok(c.result.fabric<=165);
}));
for(const id of [15,17,28])test(`Rimae ${id}: linha militar com torres e segmentos fisicos`,()=>city(id,c=>{
 assert.equal(c.b.classification.imperialProvince,'Protetorado de Rimae');
 assert.ok(c.result.v12.rimae.rampartSections>=7);
 assert.ok(c.result.v12.rimae.signalTowers>=1);
 assert.ok(c.lay.roads.some(r=>r.borderRoad));
}));
test('Bomaria inclui pequeno pavilhao de tregua sem transformar-se em fortaleza',()=>city(161,c=>{
 assert.ok(c.result.v12.bomaria.trucePavilion);
 assert.equal(c.lay.walled,false);
}));
