import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEconomy,cleanEconomyEdits} from '../../app/dist/economy-core.js';
import {simulateEconomy} from '../../app/dist/economy-simulation.js';
import {createMarkets,tradeGraph} from '../../app/dist/economy-trade.js';
import {tradeQuote,isEmbargoed,cleanTradePolicies} from '../../app/dist/economy-policy.js';
const data=JSON.parse(fs.readFileSync(caminho('dist/economy-source.json')));
function fixture(){const cells=Array.from({length:15},(_,i)=>({i,p:[(i%5)*10+5,Math.floor(i/5)*10+5],h:[5,9].includes(i)?30:10,state:i===5?1:i===9?2:0,biome:6,c:[i%5?i-1:-1,i%5<4?i+1:-1,i-5,i+5].filter(v=>v>=0&&v<15)}));const D={grid:{columns:5,rows:3,stepX:10,stepY:10},cells,settings:{distanceScale:1,shipSpeed:11},states:[1,2,3].map(i=>({i,diplomacy:[]})),cities:[{i:1,name:'Mina',state:1,cell:5,x:5,y:15,visible:true,demographics:{population:1000},harbor:{cell:6,waterPoint:[15,15]}},{i:2,name:'Forja',state:2,cell:9,x:45,y:15,visible:true,demographics:{population:1000},harbor:{cell:8,waterPoint:[35,15]}}],routes:[{id:'sea',kind:'sea',points:[[15,15],[25,15],[35,15]]}]};const source={...data,goods:data.goods.map(g=>g.i===4?{...g,price:1}:g),markets:[],profiles:{1:{population:1000,production:[{goodId:4,units:10}]},2:{population:1000,production:[{goodId:59,units:5,recipe:[{goodId:4,units:5}]}]}},cityReferences:{},cityDefaults:{},cityNotes:{},ruralSites:[],cityMarkets:{}};return {D,source,edits:{format:'silvengard-economy-v1',foodPer1000:0,defaultTariff:0,scarcityStrength:0,piracyZones:[]}};}
test('diplomatic prices apply discounts, distrust and a cost floor; embargoes can target one good',()=>{
 const {D}=fixture(),path={freight:.1,risk:0},args={sellerState:1,buyerState:2,good:4,price:100,cost:0,path};assert.equal(tradeQuote(D,{diplomacy:{'1:2':'Friendly'},defaultTariff:0},args).origin,95);assert.equal(tradeQuote(D,{diplomacy:{'1:2':'Ally'},defaultTariff:0},args).origin,90);assert.ok(Math.abs(tradeQuote(D,{diplomacy:{'1:2':'Suspicion'},defaultTariff:0},args).origin-115)<1e-8);assert.equal(tradeQuote(D,{diplomacy:{'1:2':'Ally'}},{...args,cost:98}).origin,98);
 const policies={embargoes:[{from:2,to:1,goods:[4]}]};assert.ok(isEmbargoed(policies,1,2,4));assert.ok(!isEmbargoed(policies,1,2,59));assert.equal(tradeQuote(D,policies,args),null);assert.equal(tradeQuote(D,{diplomacy:{'1:2':'Enemy'}},args),null);
});
test('tariffs go to the importing state while coins are conserved',()=>{
 const {D,source,edits}=fixture(),state=simulateEconomy(D,source,{...edits,defaultTariff:.1},null,[],()=>null),trade=state.last.trades.find(t=>t.good===4);assert.ok(trade.tariffCoins>0);assert.equal(state.accounts['state:2'].coins,trade.tariffCoins);assert.equal(Object.values(state.accounts).reduce((n,a)=>n+a.coins,0),20000);assert.equal(state.last.production['city:2'][59],5);
 const embargo=simulateEconomy(D,source,{...edits,embargoes:[{from:2,to:1,goods:[4]}]},null,[],()=>null);assert.equal(embargo.last.production['city:2'],undefined);assert.equal(embargo.last.idle['city:2'][59],5);
});
test('naval blockades close sea access and piracy loses cargo without creating money',()=>{
 const {D,source,edits}=fixture(),blocked=simulateEconomy(D,source,{...edits,navalBlockades:[{by:3,state:2}]},null,[],()=>null);assert.equal(blocked.last.production['city:2'],undefined);
 const risk=simulateEconomy(D,source,{...edits,piracyZones:[{state:1,risk:.2,radius:50}]},null,[],()=>null),trade=risk.last.trades.find(t=>t.good===4);assert.ok(trade.lostUnits>0);assert.ok(Math.abs(trade.units-trade.deliveredUnits-trade.lostUnits)<1e-8);assert.ok(Math.abs(trade.deliveredUnits-5)<1e-7);assert.ok(Math.abs(risk.accounts['city:1'].stock[4]+risk.last.consumption['city:2'][4]+trade.lostUnits-10)<1e-8);assert.equal(Object.values(risk.accounts).reduce((n,a)=>n+a.coins,0),20000);
 const config=cleanEconomyEdits(edits,D,source),nodes=new Map(D.cities.map(b=>['city:'+b.i,{id:'city:'+b.i,state:b.state}]));assert.ok(tradeGraph(D,nodes,{...config,navalBlockades:[{by:3,state:2}]}).paths.get('city:1').get('city:2')===undefined);
});
test('scarcity raises local prices, surpluses lower them, and stored stock reduces shortages',()=>{
 const {D,source,edits}=fixture();source.markets=[{i:1,centerCity:1,prices:{9:1}}];source.cityMarkets={1:1,2:1};source.profiles={1:{population:1000,production:[]},2:{population:1000,production:[]}};const model=createEconomy(D,source,{...edits,foodPer1000:1,scarcityStrength:.65}),short=createMarkets(D,source,model,{provinces:[],provinceAt:()=>null});assert.ok(short.price(D.cities[0],9)>1);
 const full=createMarkets(D,source,model,{provinces:[],provinceAt:()=>null,state:{accounts:{'city:1':{stock:{9:100}}}}});assert.ok(full.price(D.cities[0],9)<short.price(D.cities[0],9));assert.ok(full.price(D.cities[0],9)>=.65);
});
test('magic schools manufacture tradable research using actual paper and ink',()=>{
 const {D,source,edits}=fixture();D.cities[1].magicSchool=true;source.profiles={1:{population:1000,production:[{goodId:49,units:10},{goodId:50,units:10}]},2:{population:1000,production:[]}};const state=simulateEconomy(D,source,edits,null,[],()=>null);assert.ok(state.last.production['city:2'][77]>0);assert.ok(state.last.consumption['city:2'][49]>0&&state.last.consumption['city:2'][50]>0);D.cities[1].magicSchool=false;assert.ok(!createEconomy(D,source,edits).city(D.cities[1]).production.has(77));
});
test('policy validation rejects invalid states, goods, rates and piracy risks',()=>{
 const {D,source}=fixture();assert.throws(()=>cleanTradePolicies({embargoes:[{from:1,to:2,goods:[999]}]},D,source));assert.throws(()=>cleanTradePolicies({defaultTariff:-1},D,source));assert.throws(()=>cleanTradePolicies({piracyZones:[{state:1,risk:1,radius:50}]},D,source));
});
