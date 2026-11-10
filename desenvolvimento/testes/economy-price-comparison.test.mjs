import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {compareMarketPrice,priceDifference,createMarketComparisons} from '../../app/dist/economy-price-comparison.js';
test('price references use the base, all-market simple mean and nearest three other centres',()=>{
 const regions=[{i:1,center:{x:0,y:0,p:12}},{i:2,center:{x:10,y:0,p:8}},{i:3,center:{x:20,y:0,p:10}},{i:4,center:{x:30,y:0,p:14}},{i:5,center:{x:1000,y:0,p:1}}],markets={regions,price:b=>b.p},r=compareMarketPrice({market:regions[0],goodId:4,markets,basePrice:8,offers:[{origin:8,freight:2},{origin:10,freight:1}]});
 assert.equal(r.vsBase,50);assert.equal(r.globalMean,9);assert.ok(Math.abs(r.vsGlobal-100/3)<1e-9);assert.deepEqual(r.neighbours.map(m=>m.i),[2,3,4]);assert.equal(r.nearMean,32/3);assert.equal(r.vsNear,12.5);assert.equal(r.freightMean,1.5);assert.equal(r.originMean,9);assert.equal(r.deliveredMean,10.5);assert.notEqual(r.deliveredMean,r.local+r.freightMean);
});
test('no external supply is distinct from free freight and zero references never become infinity',()=>{
 const market={i:1,center:{x:0,y:0}},markets={regions:[market],price:()=>0},r=compareMarketPrice({market,goodId:4,markets,basePrice:0});assert.equal(r.vsBase,0);assert.equal(r.vsNear,null);assert.equal(r.freightMean,null);assert.equal(r.deliveredMean,null);assert.equal(priceDifference(3,0),null);
 const free=compareMarketPrice({market,goodId:4,markets,basePrice:0,offers:[{origin:2,freight:0}]});assert.equal(free.freightMean,0);assert.equal(free.deliveredMean,2);
});
test('freight quotes exclude internal suppliers and enemies and follow actual route distance',()=>{
 const cities=[1,2,3].map((i,k)=>({i,state:i,name:'Cidade '+i,cell:k,x:[0,100,50][k],y:0,visible:true,demographics:{population:1000}})),D={states:cities.map(b=>({i:b.i,diplomacy:[]})),cities,settings:{distanceScale:1,shipSpeed:11},routes:[{id:'road',kind:'road',points:[[0,0],[100,0]]}]},regions=cities.map(b=>({i:b.i,center:b})),prices={1:12,2:4,3:8},c={markets:{regions,price:b=>prices[b.i]},model:{price:()=>3},edits:{cycleDays:30,defaultTariff:0,landFreight:.0005,seaFreight:.00015,diplomacy:{}},state:{last:{production:{'city:1':{4:10},'city:2':{4:10},'city:3':{4:10}}}},provReports:new Map()},thematic={accountMarket:new Map(cities.map(b=>['city:'+b.i,b.i]))},original=JSON.stringify(D);
 const r=createMarketComparisons(D,c,thematic,[])(regions[0],4);assert.equal(r.supplierCount,2);assert.ok(Math.abs(r.freightMean-.2)<1e-8);assert.ok(Math.abs(r.deliveredMean-6.2)<1e-8);
 const war={...c,edits:{...c.edits,diplomacy:{'1:2':'Enemy'}}},blocked=createMarketComparisons(D,war,thematic,[])(regions[0],4);assert.equal(blocked.supplierCount,1);assert.ok(Math.abs(blocked.deliveredMean-8.2)<1e-8);assert.equal(JSON.stringify(D),original);
 // A market can cross political borders: another member may still buy from an enemy of its centre.
 D.cities.push({i:4,state:4,name:'Entrada neutra',cell:3,x:20,y:0,visible:true,demographics:{population:1000}});D.states.push({i:4,diplomacy:[]});thematic.accountMarket.set('city:4',1);
 const mixed=createMarketComparisons(D,war,thematic,[])(regions[0],4);assert.equal(mixed.supplierCount,2);assert.equal(mixed.offerCount,3);assert.ok(Math.abs(mixed.freightMean-.16)<1e-8);
});
