import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildShoreField,shapeRelief} from '../../app/dist/terrain-shape.js';
const read=n=>JSON.parse(fs.readFileSync(caminho(n),'utf8'));
const W=read('dist/world.json'),E=read('silvengard-edicao (9).json'),town=id=>W.cities.find(b=>b.i===id);

test('all 49 author city edits and all supplied paint fields are baked exactly',()=>{
 for(const [id,edit] of Object.entries(E.edits.cities)){if(!edit.visible){assert.equal(town(+id),undefined);continue;}for(const [key,value] of Object.entries(edit))assert.deepEqual(town(+id)[key],value,`${id}/${key}`);}
 for(const patch of E.mapEdits.cells)for(const [key,value] of Object.entries(patch))if(key!=='i')assert.deepEqual(W.cells[patch.i][key],value,`${patch.i}/${key}`);
 assert.equal(W.authorCityDefaults.editedCities,50);
});

test('academy list, Allanan harbour and approved island name match the author',()=>{
 const expected=[5,168,189,226,2000,4002,4003];
 assert.deepEqual(W.cities.filter(b=>b.magicSchool).map(b=>b.i).sort((a,b)=>a-b),expected);
 assert.ok(!town(129).magicSchool);assert.ok(town(129).capital);
 assert.equal(town(4002).name,'Sahtalys');assert.equal(town(4002).state,14);
 assert.ok(W.cells[town(4002).cell].h>=20);
 const island=new Set([town(4002).cell]),queue=[town(4002).cell];
 for(let k=0;k<queue.length;k++)for(const j of W.cells[queue[k]].c)if(W.cells[j].h>=20&&!island.has(j)){island.add(j);queue.push(j)}
 assert.ok(island.size<100);assert.ok(!island.has(town(61).cell));
 assert.ok(town(61).majorPort&&town(61).harbor);
 assert.ok(W.routes.some(r=>r.kind==='sea'&&r.stops.includes(61)));
});

test('the two requested northern moves stay on their political territory',()=>{
 assert.deepEqual([town(70).x,town(70).y],[1320.4,624.5]);assert.equal(town(70).state,14);
 assert.deepEqual([town(104).x,town(104).y],[397.26,470.4]);assert.equal(town(104).state,46);
 assert.ok(town(104).y<town(104).beforeAuthorMove[1]);
});

test('the Solitary Tower terrace supports the whole foundation without changing map data',()=>{
 const height=h=>h<20?-2:1.4+Math.pow((h-18)/82,1.65)*115;
 const vh=W.vertices.map(v=>{const cs=v.c.map(i=>W.cells[i]);return cs.some(c=>c.h<20)?-.2:cs.reduce((s,c)=>s+height(c.h),0)/cs.length});
 const stats=shapeRelief({D:W,vertexH:vh,field:buildShoreField(W),height,keepNear:W.cities.filter(b=>!b.excluded).map(b=>[b.x,b.y])});
 const terrace=stats.platforms.find(p=>p.city===5);assert.ok(terrace);
 const b=town(5),vs=W.vertices.map((v,i)=>({d:Math.hypot(v.p[0]-b.x,v.p[1]-b.y),h:vh[i]})).filter(v=>v.d<=8.5);
 assert.ok(vs.length>=8);assert.ok(vs.every(v=>Math.abs(v.h-terrace.level)<1e-5));
 assert.ok(terrace.level>height(W.cells[b.cell].h));
});
