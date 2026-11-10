import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {consumptionPlan,luxuryDemand} from '../../app/dist/economy-consumption.js';
import {simulateEconomy} from '../../app/dist/economy-simulation.js';
import {createEconomy} from '../../app/dist/economy-core.js';
import {applyMarketTerritories} from '../../app/dist/market-territories.js';
const read=p=>JSON.parse(fs.readFileSync(caminho(p))),W=read('dist/world.json'),source=read('dist/economy-source.json');
const social=id=>({shares:{peasant:id==='peasant'?100:0,modest:0,comfortable:0,wealthy:id==='wealthy'?100:0,aristocratic:0},householdSize:3,estimated:false});
function fixture(){const D={states:[{i:1,diplomacy:[]}],settings:{distanceScale:1},cells:[{i:0,h:30,biome:6,state:1},{i:1,h:30,biome:6,state:1}],cities:[1,2].map(i=>({i,name:'C'+i,state:1,visible:true,x:(i-1)*10,y:0,cell:i-1,demographics:{population:1000},socialProfile:social(i===1?'peasant':'wealthy')})),routes:[{id:'r',kind:'road',points:[[0,0],[10,0]],stops:[1,2],stopMode:'explicit'}]},goods=source.goods.map(g=>({...g,recipes:[]})),data={...source,goods,profiles:{1:{population:1000,production:goods.filter(g=>[13,26,27,51,63,71].includes(g.i)).map(g=>({goodId:g.i,units:1000,recipe:[]}))},2:{population:1000,production:[]}},cityDefaults:{},cityReferences:{},cityServices:{},ruralSites:[],markets:[{i:1,centerCity:1,prices:{}}],cityMarkets:{1:1,2:1},calibration:{...source.calibration,finiteCaptiveTrade:false,socialConsumption:true}},edits={format:'silvengard-economy-v1',foodPer1000:0,initialGoldPerResident:1,scarcityStrength:0,defaultTariff:0,piracyZones:[]};return {D,data,edits};}
test('social strata determine actual luxury demand, baskets and consumption, with no automatic credit',()=>{
 const {D,data,edits}=fixture(),rich=simulateEconomy(D,data,edits,null,[],()=>null,{instant:true});
 assert.equal(rich.last.householdConsumption['city:1'].luxurySpent,0);
 const r=rich.last.householdConsumption['city:2'];assert.ok(r.luxurySpent>0);assert.ok(r.luxurySpent<=r.luxuryBudget+1e-7);assert.ok(rich.last.consumption['city:2'][63]>0);assert.ok(rich.last.consumption['city:2'][26]>0);
 D.cities[1].socialProfile=social('peasant');const poor=simulateEconomy(D,data,edits,null,[],()=>null,{instant:true});assert.equal(poor.last.householdConsumption['city:2'].luxurySpent,0);assert.equal(poor.last.consumption['city:2']?.[63]||0,0);
 D.cities[1].socialProfile=social('wealthy');const empty=simulateEconomy(D,data,{...edits,initialGoldPerResident:0},null,[],()=>null,{instant:true});assert.equal(empty.last.householdConsumption['city:2'].luxurySpent,0);assert.equal(Object.values(empty.accounts).reduce((n,a)=>n+a.coins,0),0);
 const next=simulateEconomy(D,data,edits,rich,[],()=>null,{instant:true});assert.equal(next.last.newCapital,0);assert.equal(Object.values(next.accounts).reduce((n,a)=>n+a.coins,0),Object.values(rich.accounts).reduce((n,a)=>n+a.coins,0));
});
test('farmers reserve almost all income for basics and have no luxury allocation',()=>{
 const b={demographics:{population:300},socialProfile:social('peasant')},plan=consumptionPlan(b);assert.equal(plan.luxuryBudget,0);assert.ok(plan.basicBudget>plan.classes[0].cash*.98);assert.equal(luxuryDemand(b,source).size,0);
});
test('commercial food abstraction preserves the original unit and approved populations',()=>{
 const previous=read('backups/v43-before-consumption/dist/world.json'),old=read('backups/v43-before-consumption/dist/economy-source.json'),before=createEconomy(previous,old,previous.economyEdits),after=createEconomy(W,source,W.economyEdits);
 assert.equal(source.calibration.foodEconomyShare,.01);assert.equal(W.economyEdits.foodPer1000,previous.economyEdits.foodPer1000*.01);
 for(const id of [7,4,1244]){const b=W.cities.find(b=>b.i===id),p=previous.cities.find(b=>b.i===id);assert.equal(b.demographics.population,p.demographics.population);assert.ok(Math.abs(after.city(b).production.get(9)-before.city(p).production.get(9)*.01)<1e-5);}
 for(const b of W.cities.filter(b=>b.state===28))assert.equal(source.cityMarkets[b.i],11);
 const field=new Uint16Array(W.cells.length);applyMarketTerritories(W,field,source.authorMarketDefaults.territories,new Set(source.markets.map(m=>m.i)),()=>null);for(const c of W.cells.filter(c=>c.state===28&&c.h>=20))assert.equal(field[c.i],11);
 const coa=W.states.find(s=>s.i===20).coa;assert.deepEqual(coa,{t1:'sanguine',charges:[{charge:'wyvern',t:'sable',p:'e',size:1.5}],division:{division:'perPile',line:'arched',t:'sable'},shield:'horsehead2'});
});
