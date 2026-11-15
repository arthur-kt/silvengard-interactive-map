import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {caminho} from './base.mjs';
import {makeUndergroundLayout,buildDwarvenInterior,subterraneanProfile,caveFlightBounds} from '../../app/dist/dwarven-interior.js';
import {applyBlueprintTerrain} from '../../app/dist/city-plan-core.js';

const profiles=JSON.parse(fs.readFileSync(caminho('dist/city-blueprints.json'))).cities;
const inside=[10,29,4000,176,238,239,127];
const hybrid=[237,177],surface=[36,92,170,150,110];

// Entrada -> eixo central -> cada ala, com deslocamento usando a mesma restricao
// da camara de primeira pessoa e verificacao das pequenas rampas de desnivel.
function canWalkStraight(layout,a,b){
 for(let i=0;i<=300;i++){
  const t=i/300,u=a.u+(b.u-a.u)*t,v=a.v+(b.v-a.v)*t;
  if(!layout.accessible(u,v,.4))return {ok:false,u,v,i};
 }
 return {ok:true};
}

test('sete cidades anas recebem interiores reais, com pisos, tetos e alcovas',()=>{
 for(const id of inside){
  const b=profiles[id];assert.equal(b.classification.dwarvenModel,'subterranean');
  assert.ok(b.terrain.mountainWall&&b.terrain.subterranean);
  assert.ok(subterraneanProfile(id));
  const cave=buildDwarvenInterior({cityId:id,blueprint:b,cx:50,cy:60,W:150,H:120});
  assert.ok(cave,`interior ausente em ${id}`);
  assert.equal(cave.layout.wings.length,4);
  assert.equal(cave.layout.branches.length,8);
  assert.ok(cave.group.children.length>=2);
  assert.ok(cave.group.getObjectByName('cavern-roof'));
  assert.ok(cave.group.getObjectByName('cavern-rock'));
  assert.ok(cave.group.getObjectByName('cavern-floor'));
  const roof=cave.group.getObjectByName('cavern-roof').geometry;
  const floor=cave.group.getObjectByName('cavern-floor').geometry;
  assert.ok(roof.attributes.position.count>1000);
  assert.ok(floor.attributes.position.count>1000);
  let ceilingMax=-Infinity,floorMin=Infinity;
  const ry=roof.attributes.position.array,fy=floor.attributes.position.array;
  for(let i=1;i<ry.length;i+=3)ceilingMax=Math.max(ceilingMax,ry[i]);
  for(let i=1;i<fy.length;i+=3)floorMin=Math.min(floorMin,fy[i]);
  assert.ok(ceilingMax>floorMin+12);
  assert.ok(cave.accessible(cave.spawn.u,cave.spawn.v));
  assert.ok(cave.layout.accessible(cave.exit.u,cave.exit.v));
  for(const wing of cave.layout.wings){
   assert.ok(cave.accessible(wing.u,wing.v));
   const walk=canWalkStraight(cave.layout,{u:0,v:0},{u:wing.u,v:wing.v});
   assert.ok(walk.ok,`sem passagem livre a ${wing.name} em ${id}: ${JSON.stringify(walk)}`);
   assert.equal(cave.roomAt(wing.u,wing.v),wing.name);
  }
  for(const branch of cave.layout.branches){
   assert.ok(cave.accessible(branch.u,branch.v));
   const walk=canWalkStraight(cave.layout,branch.parent,branch);
   assert.ok(walk.ok,`sem passagem livre a ${branch.name} em ${id}: ${JSON.stringify(walk)}`);
   assert.equal(cave.roomAt(branch.u,branch.v),branch.name);
  }
  // Paredes solidas e pilares, impedindo atravessar a rocha.
  assert.equal(cave.accessible(cave.layout.span+100,0),false);
  for(const o of cave.layout.obstacles)assert.equal(cave.accessible(o.u,o.v),false);
  for(const c of cave.group.children)c.traverse(o=>o.geometry?.dispose?.());
 }
});

test('duas hibridas nao ativam caverna total e cinco ficam completamente na superficie',()=>{
 for(const id of hybrid){
  const b=profiles[id];assert.equal(b.classification.dwarvenModel,'hybrid');
  const site=applyBlueprintTerrain({ranges:[],forest:.5,port:false},b);
  assert.ok(site.mountainWall);assert.equal(site.subterranean,undefined);
  assert.equal(buildDwarvenInterior({cityId:id,blueprint:b,cx:0,cy:0,W:10,H:10}),null);
 }
 for(const id of surface){
  const b=profiles[id];assert.equal(b.classification.dwarvenModel,'surface');
  const site=applyBlueprintTerrain({ranges:[],forest:.5,port:false},b);
  assert.equal(site.subterranean,undefined);assert.equal(site.mountainWall,undefined);
  assert.equal(buildDwarvenInterior({cityId:id,blueprint:b,cx:0,cy:0,W:10,H:10}),null);
 }
});


test('voo nas sete cavernas respeita o piso, o teto e as paredes de pedra',()=>{
 const eye=1.72/2.2,base=17.3;
 for(const id of inside){
  const layout=makeUndergroundLayout(id,profiles[id].seed);
  const points=[layout.spawn,{u:0,v:0},...layout.wings,...layout.branches];
  for(const p of points){
   assert.ok(layout.accessible(p.u,p.v),`sala inacessivel ${id}`);
   const {min,max}=caveFlightBounds(layout,p.u,p.v,base,eye);
   const floor=base+layout.floorAt(p.u,p.v);
   const roof=base+layout.ceilingAt(p.u,p.v);
   assert.ok(min>floor&&min<floor+.2,`nivel minimo incorreto em ${id}`);
   assert.ok(max>min+2.5,`sem espaco para voo em ${id}`);
   assert.ok(max+eye<=roof-.54,`camara atravessa teto em ${id}`);
  }
  assert.equal(layout.accessible(layout.span+30,0),false,'nao permite voar fora da rocha');
 }
});
