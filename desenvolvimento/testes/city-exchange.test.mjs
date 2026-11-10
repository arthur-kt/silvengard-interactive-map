import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSwapEdition} from '../ferramentas/swap_vitravion_cities.mjs';
import {bakeEdition} from '../../app/tools/bake-defaults.mjs';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json')));
test('Vir and Lirion exchange locations and fortifications while preserving each city identity and facts',()=>{
 const e=buildSwapEdition(W),D=bakeEdition(W,e),before=[16,31].map(id=>W.cities.find(b=>b.i===id)),after=[16,31].map(id=>D.cities.find(b=>b.i===id));
 assert.deepEqual([after[0].x,after[0].y],[before[1].x,before[1].y]);assert.deepEqual([after[1].x,after[1].y],[before[0].x,before[0].y]);
 for(let i=0;i<2;i++)for(const k of ['i','name','culture','demographics','population','faith','emblem','coa','sourceProfile'])assert.deepEqual(after[i][k],before[i][k],k);
 assert.equal(after[0].settlementClass,'Forte élfico');assert.equal(after[0].walls,true);assert.equal(after[1].settlementClass,'Cidade');assert.equal(after[1].citadel,false);assert.equal(after[1].walls,false);
 assert.deepEqual(D.defaultProvinceEdits,W.defaultProvinceEdits);assert.deepEqual(D.landmarks,W.landmarks);
 for(const patch of e.networkEdits.routes){const old=W.routes.find(r=>r.id===patch.id),next=D.routes.find(r=>r.id===patch.id);assert.deepEqual(next.points.map(p=>p.slice(0,2)),old.points.map(p=>p.slice(0,2)));for(const key of ['fromCity','toCity'])assert.equal(next[key],old[key]===16?31:old[key]===31?16:old[key]);}
});
