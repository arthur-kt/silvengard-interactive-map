import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cleanSocialProfile,incomeReport} from '../../app/dist/economy-income.js';
import {cleanCityEdit,applyCityEdit} from '../../app/dist/city-editor-core.js';
import {createEconomy} from '../../app/dist/economy-core.js';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json'))),data=JSON.parse(fs.readFileSync(caminho('dist/economy-source.json')));
test('household estimates are editable, normalized, and do not add rural residents',()=>{
 const city=structuredClone(W.cities.find(b=>b.i===7)),profile=structuredClone(city.socialProfile),before=incomeReport(city);
 assert.equal(before.population,1050000);assert.ok(Math.abs(before.rows.reduce((n,r)=>n+r.units,0)-350000)<1e-6);
 assert.ok(Math.abs(before.cash+before.nonCash-before.gross)<1e-6);assert.ok(before.disposable<before.cash);
 profile.householdSize=6;const edit=JSON.parse(JSON.stringify(cleanCityEdit({socialProfile:profile},W)));applyCityEdit(city,edit,W);
 assert.equal(incomeReport(city).gross,before.gross/2);assert.equal(city.demographics.population,1050000);
 assert.throws(()=>cleanSocialProfile({...profile,shares:{...profile.shares,peasant:0}}),/100/);
 assert.equal(incomeReport(W.cities.find(b=>b.i===8)).gross,0);
 assert.equal(data.calibration.populationScope,'city-and-hinterland');assert.equal(data.calibration.incomeCreatesCoins,false);
});
test('physical units and recipes preserve metals and livestock inputs',()=>{
 const good=i=>data.goods.find(g=>g.i===i);assert.equal(good(9).massTonnes,.1);assert.equal(good(9).foodPeopleDays,200);
 assert.ok(good(57).recipes.every(r=>r[5]>0&&r[6]>0));
 assert.equal(good(10).demandCoverage.food,undefined);assert.equal(good(30).demandCoverage.food,undefined);
 assert.ok(good(82).catalysts[30]>0);assert.ok(good(83).catalysts[10]>0);
 assert.ok(good(74).price>good(72).price&&good(72).price>good(4).price);
 const m=createEconomy(W,data,W.economyEdits);assert.ok(m.city(W.cities.find(b=>b.i===7)).production.get(61)>0);
 for(const b of W.cities)assert.deepEqual(b.socialProfile,cleanSocialProfile(b.socialProfile));
});
test('new market assignments and social profiles are included in the persistent checkpoint',()=>{
 const cp=JSON.parse(fs.readFileSync(caminho('economic-review-defaults.json')));
 for(const id of [233,52,142])assert.equal(data.cityMarkets[id],4);assert.equal(data.cityMarkets[199],8);
 for(const b of W.cities.filter(b=>b.state===31))assert.equal(data.cityMarkets[b.i],3);
 for(const b of W.cities)assert.deepEqual(cp.demographics[b.i].socialProfile,b.socialProfile);
});
