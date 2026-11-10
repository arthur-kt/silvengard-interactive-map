import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(caminho(p)));
const W=read('dist/world.json'),E=read('silvengard-edicao%20(10).json'),old=read('backups/v23-before-author-catalog/dist/world.json');
const city=id=>W.cities.find(b=>b.i===id);
test('both authored ports retain exact city data, coordinates, faith and culture from the supplied export',()=>{
 for(const id of [10001,10002]){const b=city(id),e=E.edits.cities[id];assert.equal(b.name,id===10002?'Porto Sarandir':e.name);assert.deepEqual([b.x,b.y],e.position);assert.equal(b.culture,e.culture);assert.equal(b.faith.i,e.religion);assert.equal(b.demographics.population,e.inhabitants);assert.ok(b.port&&b.majorPort&&b.harbor);assert.equal(b.state,12);}
 const e=E.edits.cities[12];assert.equal(city(12).culture,e.culture);assert.equal(city(12).faith.i,e.religion);
 const patch=read('silvengard-alteracoes-mapa%20(11).json');for(const c of patch.cells)assert.equal(W.cells[c.i].state,c.state);
});
test('Selne is no longer a port and the new maritime stops are connected without deleting older cities',()=>{
 assert.equal(city(96).port,false);assert.equal(city(96).majorPort,false);assert.equal(city(96).harbor,undefined);assert.ok(city(128).majorPort&&city(128).harbor);
 const stops=W.routes.filter(r=>r.kind==='sea').flatMap(r=>r.stops);assert.ok(!stops.includes(96));for(const id of [128,10001])assert.ok(stops.includes(id));
 for(const b of old.cities)assert.ok(city(b.i));assert.equal(W.citySelection.cities,152);
 for(const id of [10001,10002])assert.ok(W.routes.some(r=>r.id==='city-link-'+id&&r.authorConnection));
});
test('geographic corrections preserve all remaining river geometry and remove the Stormouth trace',()=>{
 const names=read('latest-author-defaults.json').riverNames;
 const expected=old.rivers.filter(r=>r.name!=='Stormouth').map(r=>({...r,name:names[r.name]||r.name}));assert.deepEqual(W.rivers,expected);
 for(const n of ['Rio Aquozard','Rio Aldain','Rio Auror','Rio Nilnor'])assert.ok(W.rivers.some(r=>r.name===n));
});
test('Markdown lists every current city, culture, religion, deity and named geographic element',()=>{
 const md=fs.readFileSync(caminho('Catalogo-de-Silvengard.md'),'utf8'),esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('|','\\|');
 // O catálogo é a fonte do autor; pontos de interesse criados pelo mestre (poi-user-*)
 // são acréscimos locais e não precisam constar nele.
 const canon=p=>!(p&&String(p.id).startsWith('poi-user-'));
 for(const x of [...W.cities,...W.cultures,...W.religions,...W.rivers,...W.landmarks.filter(canon),...W.fortifications,...W.routes])assert.ok(md.includes(esc(x.name)),x.name);
 for(const r of W.religions)if(r.deity)assert.ok(md.includes(esc(r.deity)),r.deity);
 for(const s of W.states.filter(s=>s.i))assert.ok(md.includes('### '+s.name.trim()),s.name);
 for(const name of ['Stormouth','Rio Colozard','Rio das Cinzas','Rio Celsano','Rio de Ereth'])assert.ok(!md.includes(name));
});
