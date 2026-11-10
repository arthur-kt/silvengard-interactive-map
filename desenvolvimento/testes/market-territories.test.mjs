import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEconomy} from '../../app/dist/economy-core.js';
import {createMarkets} from '../../app/dist/economy-trade.js';
import {createProvinceModel} from '../../app/dist/province-core.js';
import {buildEconomicMap} from '../../app/dist/economy-map-core.js';
const read=p=>JSON.parse(fs.readFileSync(caminho(p),'utf8'));
const D=read('dist/world.json'),data=read('dist/economy-source.json'),model=createEconomy(D,data,D.economyEdits),markets=createMarkets(D,data,model),pm=createProvinceModel(D,read('dist/province-proposal.json'));pm.importData(D.defaultProvinceEdits);
const context={markets,model,provReports:new Map(),state:{last:null,accounts:{}}};
const map=buildEconomicMap(D,context,pm.data.provinces,pm.provinceAt);
const base=buildEconomicMap(D,{...context,markets:{...markets,territories:null}},pm.data.provinces,pm.provinceAt);
const cellAt=(x,y)=>D.cells[Math.floor(y/D.grid.stepY)*D.grid.columns+Math.floor(x/D.grid.stepX)];

test('Ros Leones has a continuous land corridor from Danumbria to Vilenages',()=>{
 for(let x=760;x<=915;x+=4){const c=cellAt(x,660);assert.ok(c.h>=20);assert.equal(map.marketField[c.i],6,'x='+x);}
 assert.ok(D.cells.some(c=>base.marketField[c.i]!==map.marketField[c.i]));
});
test('unknown North is excluded and Arenor now belongs to Ros Leones',()=>{
 for(const c of D.cells){if(c.state===0)assert.equal(map.marketField[c.i],0);else if(c.h>=20&&c.state===28)assert.equal(map.marketField[c.i],11);else if(c.h<20||c.state!==13)assert.equal(map.marketField[c.i],base.marketField[c.i]);}
 const arenor=D.cities.find(b=>b.name==='Arenor');assert.equal(map.marketField[arenor.cell],6);
 assert.equal(markets.cityMarket({...D.cities[0],state:0}),undefined);
});
test('commercial territory is an overlay and does not change terrain or political geography',()=>{
 const before=read('backups/v42-before-social-goods/dist/world.json');
 assert.deepEqual(D.cells,before.cells);assert.deepEqual(D.defaultProvinceEdits,before.defaultProvinceEdits);for(const b of D.cities)for(const k of ['name','x','y','state','culture','faith','emblem'])assert.deepEqual(b[k],before.cities.find(n=>n.i===b.i)[k]);for(const r of before.routes)assert.ok(D.routes.some(n=>n.id===r.id));
});
