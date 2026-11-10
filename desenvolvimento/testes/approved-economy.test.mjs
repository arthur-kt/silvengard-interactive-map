import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEconomy} from '../../app/dist/economy-core.js';
import {simulateEconomy} from '../../app/dist/economy-simulation.js';
import {tradeQuote} from '../../app/dist/economy-policy.js';
import {createMarkets,atWar} from '../../app/dist/economy-trade.js';
import {routeReport} from '../../app/dist/route-info.js';
const W=JSON.parse(fs.readFileSync(caminho('dist/world.json'))),source=JSON.parse(fs.readFileSync(caminho('dist/economy-source.json')));
function fixture(kind='road',km=100){const cities=[1,2].map((i,k)=>({i,name:'C'+i,state:i,cell:k,x:k*km,y:0,visible:true,majorPort:kind==='sea',port:kind==='sea',harbor:kind==='sea'?{waterPoint:[k*km,0]}:undefined,demographics:{population:1000}})),D={economicReview:{version:40},states:[{i:1,diplomacy:[]},{i:2,diplomacy:[]}],settings:{distanceScale:1,shipSpeed:11},cells:[{i:0,h:30,biome:6},{i:1,h:30,biome:6}],cities,routes:[{id:'r',kind,points:[[0,0],[km,0]],fromCity:1,toCity:2,stops:[1,2],stopMode:'explicit'}]},data={...source,cityReferences:{},cityDefaults:{},cityServices:{},cityNotes:{},ruralSites:[],markets:[{i:1,centerCity:1,prices:{4:2}}],cityMarkets:{1:1,2:1},profiles:{1:{population:1000,production:[{goodId:4,units:10}]},2:{population:1000,production:[{goodId:59,units:5,recipe:[{goodId:4,units:5}]}]}}},edits={format:'silvengard-economy-v1',foodPer1000:0,scarcityStrength:0,defaultTariff:0,piracyZones:[]};return {D,data,edits};}
test('author-approved capital census and itinerant communities are preserved exactly',()=>{
 for(const [id,n]of [[7,1050000],[1,250000],[3,100000],[5,8000],[10,18000],[30,18000]])assert.equal(W.cities.find(b=>b.i===id).demographics.population,n);
 const nomads=W.cities.filter(b=>b.state===34);assert.equal(nomads.reduce((n,b)=>n+b.demographics.population,0),25500);assert.equal(nomads.reduce((n,b)=>n+b.demographics.population+(b.demographics.itinerantPopulation||0),0),124832);
 const lost=W.cities.find(b=>b.i===14);assert.equal(lost.demographics.populationKnown,false);assert.equal(lost.demographics.population,0);assert.equal(createEconomy(W,source,W.economyEdits).city(lost).production.size,0);
});
test('food units have consistent edible weight, person-days and demand',()=>{
 const grain=source.goods.find(g=>g.i===9);assert.equal(grain.massTonnes*1000/source.calibration.foodKgPerPersonDay,grain.foodPeopleDays);assert.ok(Math.abs(W.economyEdits.foodPer1000/grain.demandCoverage.food*grain.foodPeopleDays-1000*30*source.calibration.foodEconomyShare)<1e-8);
 const report=createEconomy(W,source,W.economyEdits).city(W.cities.find(b=>b.i===4));assert.equal(grain.massTonnes,.1);assert.equal(grain.foodPeopleDays,200);assert.ok(report.production.get(9)>100&&report.production.get(9)<200);assert.equal(source.goods.find(g=>g.i===10).demandCoverage?.food||0,0);
});
test('completed ships cannot be shipped over land, while components can',()=>{
 const {D,data,edits}=fixture();for(const b of D.cities){b.majorPort=true;b.port=true;}
 data.profiles[1].production=[{goodId:53,units:2},{goodId:79,units:10}];data.profiles[2].production=[];
 const s=simulateEconomy(D,data,edits,null,[],()=>null);assert.ok(!s.last.trades.some(t=>t.good===53));assert.ok(!s.accounts['city:2'].assets[53]);
 data.profiles[2].production=[{goodId:58,units:1,recipe:[{goodId:79,units:1}]}];const parts=simulateEconomy(D,data,edits,null,[],()=>null);assert.ok(parts.last.trades.some(t=>t.good===79&&t.roadKm>0));
});
test('a sea fleet remains installed across cycles and only its wear is consumed',()=>{
 const {D,data,edits}=fixture('sea');data.profiles[1].production=[{goodId:53,units:2}];data.profiles[2].production=[];const a=simulateEconomy(D,data,edits,null,[],()=>null),b=simulateEconomy(D,data,edits,a,[],()=>null);
 assert.ok(a.accounts['city:2'].assets[53]>0);assert.ok(!a.last.consumption['city:2']?.[53]);assert.ok(b.last.consumption['city:2'][53]<a.accounts['city:2'].assets[53]*.01);assert.ok(b.accounts['city:2'].assets[53]>0);
 assert.equal(Object.values(a.accounts).reduce((s,n)=>s+n.coins,0),Object.values(b.accounts).reduce((s,n)=>s+n.coins,0));
});
test('long-haul purchases are reserved in transit and arrive in a later saved cycle',()=>{
 const {D,data,edits}=fixture('road',1000),a=simulateEconomy(D,data,{...edits,cycleDays:1},null,[],()=>null);assert.ok(a.shipments.length>0);assert.ok(!a.last.production['city:2']);assert.ok(a.shipments.every(t=>t.arrivalDay>a.elapsedDays));
 const b=simulateEconomy(D,data,{...edits,cycleDays:30},a,[],()=>null);assert.ok(b.last.arrivals.some(t=>t.to==='city:2'));assert.ok(b.last.production['city:2'][59]>0);
 const instant=simulateEconomy(D,data,{...edits,cycleDays:1},null,[],()=>null,{instant:true});assert.ok(instant.last.production['city:2'][59]>0);assert.equal(instant.shipments.length,0);
});
test('hostility charges a surcharge; active war blocks trade and removes inaccessible scarcity supply',()=>{
 const {D,data,edits}=fixture(),path={freight:0,risk:0};assert.equal(atWar(D,{diplomacy:{'1:2':'Enemy'}},1,2),false);assert.equal(atWar(D,{diplomacy:{'1:2':'War'}},1,2),true);
 assert.equal(tradeQuote(D,{...edits,diplomacy:{'1:2':'Enemy'}},{sellerState:1,buyerState:2,good:4,price:10,path}).origin,13.5);assert.equal(tradeQuote(D,{...edits,diplomacy:{'1:2':'War'}},{sellerState:1,buyerState:2,good:4,price:10,path}),null);
 const peaceModel=createEconomy(D,data,{...edits,scarcityStrength:.65}),peace=createMarkets(D,data,peaceModel,{provinces:[],provinceAt:()=>null}),warModel=createEconomy(D,data,{...edits,scarcityStrength:.65,diplomacy:{'1:2':'War'}}),war=createMarkets(D,data,warModel,{provinces:[],provinceAt:()=>null});assert.ok(war.price(D.cities[1],4)>peace.price(D.cities[1],4));
});
test('production follows academy, dwarf, desert, port and dead-land roles',()=>{
 const model=createEconomy(W,source,W.economyEdits),r=i=>model.city(W.cities.find(b=>b.i===i));for(const b of W.cities.filter(b=>b.magicSchool)){assert.ok(r(b.i).production.has(77));assert.ok(!r(b.i).production.has(61));}
 for(const b of W.cities.filter(b=>b.state===23))assert.ok(r(b.i).production.has(76));assert.ok(r(10002).production.has(11));assert.ok(r(142).production.has(53));assert.ok(r(9).production.has(20));assert.ok(!r(9).production.has(61));
 assert.equal(r(8).production.size,0);assert.equal(r(2003).production.size,0);for(const g of r(2001).production.keys())assert.ok(!(model.goods.get(g).demandCoverage?.food>0));for(const b of W.cities)assert.ok(!r(b.i).production.has(31)&&!r(b.i).production.has(62));
});
test('commercial calls are attached to their real city or harbour after relocation',()=>{
 for(const r of W.routes.filter(r=>r.tradeUse!==false)){const report=routeReport(W,r);assert.ok(report.stops.length>=2,r.id);assert.ok(report.stops.every(s=>s.offset<=9.016),r.id);}
});
test('a new war retains prepaid cargo instead of delivering it across the embargo',()=>{
 const {D,data,edits}=fixture('road',1000),first=simulateEconomy(D,data,{...edits,cycleDays:1},null,[],()=>null),war=simulateEconomy(D,data,{...edits,cycleDays:30,diplomacy:{'1:2':'War'}},first,[],()=>null);
 assert.ok(war.shipments.some(t=>t.to==='city:2'&&t.hold==='war'));assert.ok(!war.last.arrivals.some(t=>t.to==='city:2'));assert.ok(!war.last.production['city:2']);
 assert.equal(Object.values(war.accounts).reduce((n,a)=>n+a.coins,0),Object.values(first.accounts).reduce((n,a)=>n+a.coins,0));
 const resumed=simulateEconomy(D,data,{...edits,cycleDays:30},war,[],()=>null);assert.ok(resumed.last.arrivals.some(t=>t.to==='city:2'));
});
test('the persistent checkpoint preserves unknown census and seasonal communities on rebuild',()=>{
 const checkpoint=JSON.parse(fs.readFileSync(caminho('economic-review-defaults.json')));
 for(const id of [14,140,179,143,149,75,138,214]){const b=W.cities.find(b=>b.i===id),patch=checkpoint.demographics[id];assert.ok(patch,b.name);assert.deepEqual(patch.demographics,b.demographics);if(b.seasonalVisitors)assert.equal(patch.seasonalVisitors,b.seasonalVisitors);if(b.economicStatus)assert.equal(patch.economicStatus,b.economicStatus);}
 assert.ok(checkpoint.priorRevisionIds.length>0);assert.deepEqual(checkpoint.economyEdits,W.economyEdits);
});
