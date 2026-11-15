import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {caminho} from './base.mjs';
import {siteFor,createField,populationRadiusM,M_PER_UNIT as M} from '../../app/dist/local-field.js';
import {applyBlueprintTerrain,applyCityBlueprint,wallRadiusAt} from '../../app/dist/city-plan-core.js';

const atlas=JSON.parse(fs.readFileSync(caminho('dist/world.json')));
const profiles=JSON.parse(fs.readFileSync(caminho('dist/city-blueprints.json')));
const city=id=>atlas.cities.find(c=>c.i===id);
const profile=id=>profiles.cities[String(id)];
const rands=seed=>{let s=seed>>>0;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296)};
const grid=atlas.grid;
const cellAt=(x,y)=>atlas.cells[Math.max(0,Math.min(grid.rows-1,Math.floor(y/grid.stepY)))*grid.columns+Math.max(0,Math.min(grid.columns-1,Math.floor(x/grid.stepX)))];
const H=h=>h<20?-2:1.4+Math.pow((h-18)/82,1.65)*115;
const surface=(x,y)=>H(cellAt(x,y).h);
const getSite=id=>{
 const c=city(id);
 const pop=c.demographics?.population??(c.population?c.population*1000*2:500);
 return siteFor({D:atlas,point:[c.x,c.y],cellAt,surface,population:pop,city:c});
};
const simpleLayout=id=>{
 const b=profile(id),c=city(id),site=applyBlueprintTerrain(getSite(id),b),
 R=populationRadiusM(c.demographics?.population||45000)/M;
 const lay={Rt:R,plaza:12,a0:rands(b.seed)()*2.7,capital:!!c.capital,walled:!!c.walls,
  pop:c.demographics?.population||45000,kind:c.capital?'capital':'town',wide:1.03,N:120,roads:[],fort:false};
 return {b,lay:applyCityBlueprint(lay,b,site),site};
};

test('todos os centros ativos do atlas possuem perfis sem alterar a localizacao',()=>{
 const active=atlas.cities.filter(c=>!c.excluded);
 assert.equal(Object.keys(profiles.cities).length,active.length);
 assert.equal(active.length,152);
 for(const c of active){
  const b=profile(c.i);
  assert.ok(b,`cidade ${c.i} sem perfil`);
  assert.equal(b.name,c.name);
  assert.ok(Number.isInteger(b.seed)&&b.seed>0);
  assert.ok(b.pattern&&b.patternLabel);
  assert.ok(['watabou-semente','proximidade','identidade','identidade-relocada','historico-cultural'].includes(b.source.mode));
 }
});

test('os 12 geradores Watabou sao associados a suas sementes e links originais',()=>{
 const linked=Object.values(profiles.cities).filter(b=>b.source.watabouUrl);
 assert.equal(linked.length,12);
 for(const b of linked){
  assert.equal(b.source.mode,'watabou-semente');
  assert.ok(b.source.watabouUrl.startsWith('https://watabou.github.io/city-generator/?'));
  assert.equal(Number(new URL(b.source.watabouUrl).searchParams.get('seed')),b.seed);
 }
});

test('Elucitor e uma ilha com oceano a 360 graus e sem pontes de terra',()=>{
 const b=profile(7),site=applyBlueprintTerrain(getSite(7),b),field=createField(site);
 assert.equal(b.name,'Elucitor');
 assert.equal(b.pattern,'imperial-grid');
 assert.equal(site.waterKind,'sea');
 assert.equal(site.island.waterOnAllSides,true);
 assert.equal(site.port,true);
 assert.ok(field.shoreM(0,0)>0&&field.depthM(0,0)===0);
 // Observacao: nos 24 raios, o solo deve passar de positivo a negativo sem reentrar na costa.
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12;
  const shore=field.shoreM(Math.cos(a)*3100,Math.sin(a)*3100);
  assert.ok(shore<0,`falta oceano na direcao ${i*15} graus`);
  assert.ok(field.depthM(Math.cos(a)*3100,Math.sin(a)*3100)>0,`sem agua na direcao ${i*15} graus`);
  for(let r=3500;r<=12000;r+=1250){
   assert.ok(field.shoreM(Math.cos(a)*r,Math.sin(a)*r)<0,`conexao terrestre em ${i*15} graus a ${r}m`);
  }
 }
});

test('capitais com cidadela permanecem cidades completas: malha imperial',()=>{
 const {lay,b}=simpleLayout(7);
 assert.ok(lay.roads.length>16);
 assert.ok(lay.roads.some(r=>r.grid));
 assert.equal(lay.pattern,'imperial-grid');
 assert.ok(lay.gates.length>=4);
 assert.equal(lay.wallShape,'squircle');
 assert.ok(wallRadiusAt(lay,Math.PI/4,lay.Rt)>lay.Rt*1.1);
 assert.equal(b.features.citadel,true);
});

test('geometrias diversas: fortaleza anã, porto, cidade elfíca e as duas Gugacon',()=>{
 const winter=simpleLayout(23),dagorah=simpleLayout(10),velaffeld=simpleLayout(1),
 porto=simpleLayout(18),vulcanic=simpleLayout(33),lost=simpleLayout(14);
 assert.equal(winter.lay.pattern,'fortress');
 assert.equal(dagorah.lay.pattern,'dwarven-terraces');
 assert.equal(velaffeld.lay.pattern,'elfic-organic');
 assert.equal(porto.lay.pattern,'harbor-front');
 assert.equal(vulcanic.lay.pattern,'volcanic');
 assert.equal(lost.lay.pattern,'ruins');
 assert.equal(lost.lay.N,0);
 assert.notDeepEqual(winter.lay.roads,dagorah.lay.roads);
 assert.notDeepEqual(velaffeld.lay.roads,porto.lay.roads);
});

test('cidades deslocadas mantem identidade e adotam referencias fundamentadas',()=>{
 const moved=Object.values(profiles.cities).filter(b=>(b.source.positionDifference||0)>26);
 assert.equal(moved.length,36);
 const borg=profile(3);
 assert.equal(borg.name,'Asgorath');
 assert.equal(borg.source.referenceName,'Asghorat');
 assert.equal(borg.source.mode,'watabou-semente');
 assert.ok(profile(18).source.referenceName);
 assert.ok(profile(18).source.mode==='proximidade');
});

test('a planta 2D desenha o mesmo litoral e as ruas do traçado 3D',async()=>{
 const {drawCityPlan}=await import('../../app/dist/city-plan-preview.js');
 const {b,lay,site}=simpleLayout(7),field=createField(site);
 const stamps=[];let lastColor='';
 const context=new Proxy({}, {
  set(obj,prop,val){obj[prop]=val;if(prop==='fillStyle')lastColor=val;return true},
  get(obj,prop){if(prop in obj)return obj[prop];
   if(prop==='fillRect')return(x,y,w,h)=>{if(x<8||y<8||Math.abs(x-357)<5)stamps.push([x,y,lastColor]);};
   return ()=>{};
  }
 });
 const canvas={width:0,height:0,getContext:()=>context};
 const result=drawCityPlan(canvas,{lay,site,field,blueprint:b});
 assert.equal(canvas.width,720);
 assert.ok(result.planWidthMeters>3500);
 const corner=stamps.filter(x=>x[0]===0&&x[1]===0).at(-1);
 assert.equal(corner[2],'#4c8199','em Elucitor os cantos da planta sao mar');
 assert.ok(stamps.some(([x,y,c])=>Math.abs(x-357)<5&&Math.abs(y-357)<5&&c!=='#4c8199'),'centro da ilha deve ser terra');
});

test('ajustes culturais e campus arcanos foram registrados nos perfis',()=>{
 const velaffeld=profile(1),winter=profile(23),danumbria=profile(2000),crild=profile(223);
 assert.equal(velaffeld.classification?.architecture,'high-elf');
 assert.ok(velaffeld.urbanDesign?.districts?.some(d=>d.kind==='grove'));
 assert.equal(winter.classification?.architecture,'northern-human');
 assert.ok(winter.urbanDesign?.districts?.some(d=>d.kind==='military'));
 assert.equal(danumbria.classification?.magicCampus,true);
 assert.ok(danumbria.urbanDesign?.districts?.some(d=>d.kind==='academy'));
 assert.equal(crild.classification?.architecture,'goblin-marsh');
 assert.ok(crild.urbanDesign?.districts?.some(d=>d.kind==='shanty'));
 for(const id of [16,19,26]){
  const b=profile(id);
  assert.equal(b.pattern,'forest-settlement');
  assert.ok(b.urbanDesign?.districts?.some(d=>d.kind==='grove'));
 }
});
