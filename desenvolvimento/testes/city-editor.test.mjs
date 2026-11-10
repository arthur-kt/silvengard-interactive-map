import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cleanCityEdit,applyCityEdit,planCityMove} from '../../app/dist/city-editor-core.js';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json')));

test('editing inhabitants, including zero, preserves the city culture, faith, features and position',()=>{
 const before=structuredClone(W.cities.find(b=>b.i===18)),after=applyCityEdit(structuredClone(before),{inhabitants:0},W);
 const expected=structuredClone(before);expected.demographics.population=0;expected.population=0;assert.deepEqual(after,expected);
});
test('religion selects its associated deity and invalid edits are rejected before mutation',()=>{
 const b=structuredClone(W.cities[0]),faith=W.religions.find(r=>r.deity&&r.i!==b.faith.i);
 applyCityEdit(b,{religion:faith.i},W);assert.equal(b.faith.deity,faith.deity);assert.equal(b.faith.i,faith.i);
 const before=structuredClone(b);assert.throws(()=>applyCityEdit(b,{inhabitants:10,religion:-1},W));assert.deepEqual(b,before);
 for(const inhabitants of [-1,NaN,Infinity,1.5])assert.throws(()=>cleanCityEdit({inhabitants},W));
});
test('a land city move reconnects the attached roads, preserves other routes and survives serialization',()=>{
 const b=W.cities.find(b=>b.i===23),destination=[b.x+5,b.y+4];
 const initial=JSON.stringify(W),result=planCityMove(W,b.i,destination);
 assert.equal(JSON.stringify(W),initial);assert.ok(result.changed>0);
 assert.deepEqual([result.city.x,result.city.y],destination);assert.equal(result.city.faith.i,b.faith.i);assert.equal(result.city.culture,b.culture);
 const changed=result.routes.filter((r,i)=>r!==W.routes[i]);
 for(const r of changed){const endpoint=r.kind==='sea'?result.city.harbor.waterPoint:destination;assert.ok(r.points.some(p=>Math.hypot(p[0]-endpoint[0],p[1]-endpoint[1])<.01));assert.ok(r.points.every(p=>{const h=W.cells[Math.floor(p[1]/W.grid.stepY)*W.grid.columns+Math.floor(p[0]/W.grid.stepX)].h;return r.kind==='sea'?h<20:h>=20;}));}
 const restored=JSON.parse(JSON.stringify({position:destination})),copy=applyCityEdit(structuredClone(b),restored,W);assert.equal(copy.cell,result.city.cell);
});
test('water relocation and ports too far inland fail without altering any city or path',()=>{
 const before=JSON.stringify(W),water=W.cells.find(c=>c.h<20).p;assert.throws(()=>planCityMove(W,23,water),/terra/);
 const inland=W.cities.find(b=>b.i===140);assert.throws(()=>planCityMove(W,18,[inland.x,inland.y]),/costa/);assert.equal(JSON.stringify(W),before);
});
test('port relocation reconnects a sea lane over water and retains its state in the route filter',()=>{
 const b=W.cities.find(b=>b.i===18),result=planCityMove(W,18,[b.x+4,b.y]);
 const changed=result.routes.filter((r,i)=>r!==W.routes[i]&&r.kind==='sea');assert.ok(changed.length);
 for(const r of changed){assert.ok(r.stateIds.includes(12));assert.ok(r.points.some(p=>Math.hypot(p[0]-result.city.harbor.waterPoint[0],p[1]-result.city.harbor.waterPoint[1])<.01));for(const p of r.points)assert.ok(W.cells[Math.floor(p[1]/W.grid.stepY)*W.grid.columns+Math.floor(p[0]/W.grid.stepX)].h<20);}
});
test('the latest political strokes are included without losing prior approved paint fields',()=>{
 const patch=JSON.parse(fs.readFileSync(caminho('silvengard-alteracoes-mapa%20(9).json')));
 for(const p of patch.cells)assert.equal(W.cells[p.i].state,p.state);
 const old=JSON.parse(fs.readFileSync(caminho('backups/v21-before-city-editor/author-map-defaults.json')));
 const overrides=new Map(patch.cells.map(c=>[c.i,c]));
 for(const p of old.cells)for(const [k,v] of Object.entries(p))if(k!=='i'&&!(k in (overrides.get(p.i)||{})))assert.deepEqual(W.cells[p.i][k],v);
});
