import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {indexLore,loreForCity} from '../../app/dist/local-lore.js';
import {resolveMaterialPreset} from '../../app/dist/material-presets.js';

const base=new URL('../../app/dist/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,base),'utf8'));
const world=read('world.json');
const blueprint=read('city-blueprints.json');
const archive=read('history-archive.json');
const descriptions=read('city-descriptions-v17.json');
const records=new Map(archive.records.filter(r=>r.kind==='city').map(r=>[r.target?.id,r]));
const sections=new Map(archive.sections.map(s=>[s.id,s]));

test('Navï Velaffëll has all 15 approved descriptions, matching world city IDs',()=>{
 const cities=world.cities.filter(c=>c.state===14);
 assert.equal(cities.length,15);
 assert.equal(Object.keys(descriptions.cities).length,cities.length);
 for(const city of cities){
  const desc=descriptions.cities[city.i];
  assert.ok(desc,`missing city ${city.i}`);
  assert.equal(desc.name,city.name);
  assert.equal(blueprint.cities[String(city.i)].description1277,desc.description1277);
  assert.ok(desc.description1277.length>250);
  assert.match(desc.description1277,/[.!?]$/);
 }
});

test('Archive presents new details while preserving prior canonical history and chapter counts',()=>{
 const lore=indexLore(archive);
 for(const c of world.cities.filter(c=>c.state===14)){
  const rec=records.get(c.i),s=sections.get(rec.sections[0]);
  assert.ok(s.markdown.includes(`naviv17:urbano:${c.i}`),c.name);
  assert.ok(s.markdown.includes('Identidade urbana e vida cotidiana (1277 AQD)'),c.name);
  assert.ok(s.displayMarkdown.includes(descriptions.cities[String(c.i)].description1277),c.name);
  const quote=loreForCity(lore,c.i).quote;
  assert.ok(quote&&!quote.startsWith('Ainda não foi registrada'),c.name);
  assert.ok(!quote.includes('A localidade possui a vida urbana'),c.name);
 }
 assert.equal(archive.records.length,366);
 assert.equal(archive.sections.length,1592);
});

test('Special descriptions do not turn two sanctuaries into the same world church headquarters',()=>{
 assert.match(descriptions.cities['67'].description1277,/regional/i);
 assert.match(descriptions.cities['67'].description1277,/Elucitor/i);
 assert.match(descriptions.cities['189'].description1277,/Pedra Áurea/);
 assert.match(descriptions.cities['189'].description1277,/Velaffeld/);
 assert.match(descriptions.cities['96'].description1277,/não deve ser confundida com Garnalos/);
});

test('New materials remain optional: no CC0 jpgs bundled, special palettes active',()=>{
 const textureDir=new URL('textures/cc0/',base);
 const jpg=fs.readdirSync(textureDir).filter(s=>s.endsWith('.jpg'));
 assert.equal(jpg.length,0);
 for(const [city,expected] of [['Velaffeld','navi-capital'],['Garnalos','navi-sacred'],['Karno\'ande','navi-forest'],['Allanan','navi-port'],['Sahtalys','navi-arcane']]){
  assert.equal(resolveMaterialPreset({cityName:city}).id,expected);
 }
});
