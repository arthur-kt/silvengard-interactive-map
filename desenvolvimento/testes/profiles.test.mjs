import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {citySourceHTML,cityProfileHTML,stateProfileHTML} from '../../app/dist/profile-ui.js';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json')));
const authorBaseline=JSON.parse(fs.readFileSync(caminho('backups/v42-before-social-goods/dist/world.json')));
const lines=fs.readFileSync(caminhoPai('Mapas/Silvangad%205.0.map'),'utf8').split(/\r?\n/),burgs=JSON.parse(lines[170]),states=JSON.parse(lines[169]);

test('native city populations use the exact original values and documented unit conversion',()=>{
 const original=W.cities.filter(b=>b.sourceProfile.kind==='original');assert.equal(original.length,132);
 for(const b of original){const author=authorBaseline.cities.find(c=>c.i===b.i),override={raw:author.population,inhabitants:author.demographics.population},src=burgs[b.sourceProfile.sourceCityId];assert.equal(b.population,override?.raw??src.population);assert.equal(b.demographics.population,override?.inhabitants??Math.round(src.population*2000));assert.equal(b.demographics.estimated,false);}
 const capital=W.cities.find(b=>b.i===7);assert.equal(capital.demographics.population,1050000);
});

test('all synthetic cities have traceable references and explicitly estimated populations',()=>{
 const inferred=W.cities.filter(b=>b.sourceProfile.kind==='estimated');assert.equal(inferred.length,18);
 for(const b of inferred){assert.ok(b.demographics.population>=0);assert.ok(b.demographics.estimated);assert.ok(burgs[b.sourceProfile.sourceCityId]);assert.ok(b.sourceProfile.method.includes('porte'));assert.equal(citySourceHTML(b),'');}
 const dwarf=inferred.find(b=>b.i===4000);assert.equal(dwarf.culture,15);assert.equal(burgs[dwarf.sourceProfile.sourceCityId].culture,15);
});

test('all current cities and states resolve to local genuine or reference heraldry assets',()=>{
 for(const item of [...W.cities,...W.states.filter(s=>s.i)]){assert.ok(item.emblem,item.name);assert.ok(fs.existsSync(caminho('dist/'+item.emblem)),item.name);assert.ok(item.emblemProvenance?.label);}
 const index=JSON.parse(fs.readFileSync(caminho('dist/heraldry/index.json')));
 for(const [key,file] of Object.entries(index)){
  const svg=fs.readFileSync(caminho('dist/'+file),'utf8');assert.ok(svg.includes('<svg'));assert.ok(!/undefined|NaN/.test(svg.replace(/data:image\/[^"]*/g,'')),key);
  for(const match of svg.matchAll(/(?:href|xlink:href)="#([^"]+)"/g))assert.ok(svg.includes('id="'+match[1]+'"'),key+' / '+match[1]);
 }
});

test('Dragonfall is an independent kingdom with reciprocal neutral relations to Elucitor',()=>{
 const d=W.states.find(s=>s.i===12),e=W.states.find(s=>s.i===13);
 assert.equal(states[12].diplomacy[13],'Vassal');assert.equal(d.formName,'Kingdom');assert.equal(d.fullName,'Reino de Dragonfall');
 assert.equal(d.government.independent,true);assert.deepEqual(d.government.overlords,[]);
 assert.equal(d.diplomacy.find(r=>r.state===13).relation,'Neutral');assert.equal(e.diplomacy.find(r=>r.state===12).relation,'Neutral');
 for(const s of W.states)assert.deepEqual(s.diplomaticHistory,[]);
 for(const s of W.states.filter(s=>s.i))for(const r of s.diplomacy)if(!(s.i===12&&r.state===13)&&!(s.i===13&&r.state===12))assert.equal(r.relation,states[s.i].diplomacy[r.state]);
});

test('missing languages, governors and dynasties remain unset and republics have no invented monarch',()=>{
 for(const b of W.cities)assert.equal(b.language,null);
 for(const s of W.states.filter(s=>s.i)){assert.equal(s.government.ruler,null);assert.equal(s.government.dynasty,null);assert.equal(s.language,null);}
 const kingdom=W.states.find(s=>s.i===12),republic=W.states.find(s=>s.i===26);
 assert.ok(stateProfileHTML(kingdom,{},W).includes('id="editRuler"'));
 assert.ok(!stateProfileHTML(republic,{},W).includes('id="editRuler"'));
 const b=W.cities.find(b=>b.i===4003);assert.ok(!cityProfileHTML(b,{language:'Élfico <do mestre>'}).includes('editLanguage'));
});

test('population swaps preserve all other city facts and all current diplomatic relationships',()=>{
 const old=JSON.parse(fs.readFileSync(caminho('backups/v19-before-clean-fichas/dist/world.json')));
 for(const [a,b] of [[23,34],[138,140]])for(const [target,donor] of [[a,b],[b,a]]){
  const current=W.cities.find(c=>c.i===target),before=old.cities.find(c=>c.i===target),source=old.cities.find(c=>c.i===donor);
  assert.equal(current.demographics.population+(current.demographics.itinerantPopulation||0),source.demographics.population);
  for(const k of ['culture','faith','emblem','sourceProvince','x','y','capital'])assert.deepEqual(current[k],before[k]);
 }
 for(const s of W.states.filter(s=>s.i))assert.deepEqual(s.diplomacy,old.states.find(x=>x.i===s.i).diplomacy);
});

test('city and state sheets keep provenance and languages internal',()=>{
 for(const b of W.cities){const html=cityProfileHTML(b,{});assert.ok(!/\.map|referência|importad|Província|IDIOMA|editLanguage/.test(html));assert.ok(b.sourceProvince);}
 for(const s of W.states.filter(s=>s.i)){const html=stateProfileHTML(s,{},W);assert.ok(!/\.map|referência|arquivo|IDIOMA|declaração de guerra/i.test(html));}
});

test('author heraldry replaces only the four requested state emblems',()=>{
 const expected={20:['horsehead2','wyvern','sanguine'],23:['ironHills','dwarvenPeaks','azure'],34:['spanish','steppeHorse','gules'],26:['boeotian','lionHeadErased','vert']};
 for(const [id,[shield,charge,field]] of Object.entries(expected)){
  const s=W.states.find(s=>s.i===+id);assert.equal(s.coa.shield,shield);assert.equal(s.coa.charges[0].charge,charge);assert.equal(s.coa.t1,field);
  const svg=fs.readFileSync(caminho('dist/'+s.emblem),'utf8');assert.ok(svg.includes('<svg'));assert.ok(!/undefined|NaN/.test(svg.replace(/data:image\/[^"]*/g,'')));
 }
});
