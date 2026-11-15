import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCity} from './v7-cities-smoke.mjs';
import {urbanCanalCenterXY,bridgeDeckHeight} from '../../app/dist/urban-v7-core.js';
const M=2.2;
const release=obj=>{for(const group of obj.result.groups)group.traverse(o=>o.geometry?.dispose?.());};

test('Elucitor possui Cidade Alta real de mais de 15 m, e a ilha permanece cercada por agua',()=>{
 const obj=makeCity(7);try{
  const t=obj.site.urbanTerraces.find(t=>t.label.includes('Palácio'));
  assert.ok(t,'falta terraceamento do palacio');
  assert.ok(t.heightM>=40);
  const crown=obj.field.heightM(t.x,t.z),opposite=obj.field.heightM(-t.x,-t.z);
  assert.ok(crown-opposite>15,`relevo alto insuficiente: ${crown-opposite}`);
  assert.ok(obj.field.heightM(4000,4000)<0);
  assert.equal(obj.result.v7.palaces,1);
  assert.ok(obj.lay.palaceComplexes[0].radius>20);
 }finally{release(obj)}
});

test('Asgorath e Velaffeld possuem palacios monumentais de estilos diferentes',()=>{
 const a=makeCity(3),v=makeCity(1);
 try{
  assert.equal(a.result.v7.palaces,1);assert.equal(v.result.v7.palaces,1);
  assert.equal(a.lay.palaceComplexes[0].style,'northern');
  assert.equal(v.lay.palaceComplexes[0].style,'high-elf');
  assert.ok(a.lay.palaceComplexes[0].radius>15);
  assert.ok(v.lay.palaceComplexes[0].radius>20);
  assert.ok(v.result.v7.treeHomes>=3);
 }finally{release(a);release(v)}
});

test('Triovorn: bosque urbano com casas nas copas, sem substituir muralhas da Tríplice Elfica',()=>{
 const city=makeCity(19);try{
  assert.equal(city.site.urbanWoodland.style,'woodland-elf');
  assert.ok(city.result.v7.treeHomes>=3);
  assert.ok(city.lay.walled);
  assert.equal(city.lay.pattern,'forest-settlement');
 }finally{release(city)}
});

test('Crild possui tres canais de agua verdadeira, passadicos caminhaveis e palafitas',()=>{
 const city=makeCity(223);try{
  const {site,field,lay,result}=city;
  assert.ok(site.urbanCanals);
  assert.equal(lay.walled,false,'Crild nao deve receber muralhas imperiais genericas');
  for(let i=0;i<3;i++){
   const [x,z]=urbanCanalCenterXY(site,0,i);
   assert.ok(field.heightM(x,z)<0,`canal ${i} sem agua`);
   assert.ok(field.depthM(x,z)>.35,`canal ${i} sem leito de profundidade`);
  }
  assert.ok(result.v7.bridges>=9,`poucas pontes: ${result.v7.bridges}`);
  assert.ok(result.v7.stiltHouses>=15,`poucas palafitas: ${result.v7.stiltHouses}`);
  let bridgeOverWater=0;
  for(const b of lay.bridges){
   const u=(b.a[0]+b.b[0])/2,v=(b.a[1]+b.b[1])/2;
   const deck=bridgeDeckHeight(lay,u,v);
   assert.ok(deck!==null&&deck>b.deckY);
   if(field.heightM(u*M,v*M)<0&&deck>0)bridgeOverWater++;
  }
  assert.ok(bridgeOverWater>6,'pontes devem atravessar os canais e nao apenas terra');
 }finally{release(city)}
});

test('Winterhelm manteve sua serra ao lado e seu urbanismo militar',()=>{
 const city=makeCity(23);try{
  assert.ok(city.site.mountainWall);
  assert.ok(city.lay.districts.some(d=>d.kind==='military'));
 }finally{release(city)}
});
