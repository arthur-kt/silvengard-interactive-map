import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {caminho} from './base.mjs';
import {siteFor,createField,populationRadiusM,M_PER_UNIT} from '../../app/dist/local-field.js';

const D=JSON.parse(fs.readFileSync(caminho('dist/world.json'),'utf8'));
const g=D.grid;
const cellAt=(x,y)=>D.cells[Math.max(0,Math.min(g.rows-1,Math.floor(y/g.stepY)))*g.columns+Math.max(0,Math.min(g.columns-1,Math.floor(x/g.stepX)))];
const H=h=>h<20?-2:1.4+Math.pow((h-18)/82,1.65)*115;
const surface=(x,y)=>H(cellAt(x,y).h);
const popOf=c=>c.demographics?.population??(c.population?c.population*1000*2:400);
const city=id=>D.cities.find(c=>c.i===id);
const build=id=>{const c=city(id);return {c,site:siteFor({D,point:[c.x,c.y],cellAt,surface,population:popOf(c),city:c})}};

test('o raio urbano cresce com a população e tem limites',()=>{
 assert.ok(populationRadiusM(120)>=95);
 assert.ok(populationRadiusM(400)<populationRadiusM(5000));
 assert.ok(populationRadiusM(5000)<populationRadiusM(40000));
 assert.ok(populationRadiusM(1e9)<=2900);
 assert.equal(Math.round(populationRadiusM(40000)),Math.round(populationRadiusM(40000)));
});

test('cidade portuária: água grande, porto coerente e serra no horizonte',()=>{
 const {site}=build(18);
 assert.equal(site.waterKind,'sea');
 assert.ok(site.shoreDistM>site.cityR*.5,'a frente de água não pode ficar dentro do centro');
 assert.ok(site.shoreDistM<=3000,'a frente de água precisa continuar próxima da cidade');
 assert.ok(site.cityR>900,'uma cidade de 39 mil habitantes não pode ser uma aldeia');
 assert.ok(site.ranges.length>=1,'o relevo do entorno deve virar serra visível');
 for(const r of site.ranges){assert.ok(r.distM>=2000&&r.distM<=13000);assert.ok(r.heightM>=120&&r.heightM<=1900)}
});

test('cidade de lago: o lago é um corpo d\'água amplo, não uma poça',()=>{
 const {site}=build(7);
 assert.equal(site.waterKind,'lake');
 assert.ok(site.lakeR>=380,'raio do lago');
 assert.ok(site.lakeR<=3100);
 assert.ok(site.shoreDistM>=site.cityR*.5);
});

test('campo local: terra no centro, água no lago e nenhum valor inválido',()=>{
 const {site}=build(7),f=createField(site);
 const h0=f.heightM(0,0);
 assert.ok(Number.isFinite(h0));
 assert.ok(h0>-1&&h0<80,'o centro da cidade fica em terra firme');
 assert.ok(f.depthM(0,0)===0);
 // na direção da água, a profundidade cresce
 const a=site.waterAng,far=site.shoreDistM+200;
 assert.ok(f.depthM(Math.cos(a)*far,Math.sin(a)*far)>0.2,'deve haver água depois da margem');
 // nenhum NaN numa malha ampla e floresta sempre entre 0 e 1
 for(let x=-3000;x<=3000;x+=250)for(let z=-3000;z<=3000;z+=250){
  const h=f.heightM(x,z),d=f.depthM(x,z),s=f.shoreM(x,z),fo=f.forestAt(x,z);
  assert.ok(Number.isFinite(h)&&Number.isFinite(d)&&Number.isFinite(s)&&Number.isFinite(fo),`amostra ${x},${z}`);
  assert.ok(fo>=0&&fo<=1);
 }
});

test('campo local é determinístico e contínuo',()=>{
 const {site}=build(23),a=createField(site),b=createField(site);
 for(const[x,z]of[[0,0],[320,-120],[-800,600],[1500,900]]){
  assert.equal(a.heightM(x,z),b.heightM(x,z));
 }
 let prev=a.heightM(0,0);
 for(let d=5;d<=1200;d+=5){
  const h=a.heightM(d*.6,d*.8);
  assert.ok(Math.abs(h-prev)<8,`degrau de relevo em ${d} m`);
  prev=h;
 }
});

test('fora da cidade o chão urbano desliga',()=>{
 const {site}=build(18);
 assert.equal(site.urbanR,site.cityR);
 const wild={...site,urbanR:0};
 const f=createField(wild);
 assert.equal(f.heightM(0,0),createField(site).heightM(0,0));
 assert.ok(Number.isFinite(f.forestAt(600,-400)));
 assert.ok(site.cityR/M_PER_UNIT>100);
});
