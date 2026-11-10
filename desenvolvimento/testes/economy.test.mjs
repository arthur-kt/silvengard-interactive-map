import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEconomy,cleanEconomyEdits,toGold,money} from '../../app/dist/economy-core.js';
import {simulateEconomy,cleanEconomyState} from '../../app/dist/economy-simulation.js';
import {createProvinceModel} from '../../app/dist/province-core.js';
import {bakeEdition} from '../../app/tools/bake-defaults.mjs';
import {planEconomyRoutes} from '../ferramentas/economy_routes.mjs';
const read=p=>JSON.parse(fs.readFileSync(caminho(p))),W=read('dist/world.json'),data=read('dist/economy-source.json'),P=read('dist/province-proposal.json');
test('currency conversions use copper precision and rare materials keep the authored price hierarchy',()=>{
 assert.equal(toGold(10,'PP'),1);assert.equal(toGold(100,'PC'),1);assert.equal(toGold(1,'PL'),10);assert.equal(money(.29),'2 PP 9 PC');assert.equal(money(12.34),'12,34 PO');
 const m=createEconomy(W,data);assert.ok(m.price(74)>m.price(72)&&m.price(72)>m.price(4));assert.throws(()=>cleanEconomyEdits({format:'silvengard-economy-v1',prices:{74:1}},W,data),/Lavanthir/);
});
test('special production is attached to the correct city and scenario exclusions always apply',()=>{
 const m=createEconomy(W,data),report=id=>m.city(W.cities.find(b=>b.i===id));
 assert.ok(report(4000).production.has(7));assert.ok(!report(4000).production.has(8));assert.ok(report(184).production.has(8));assert.ok(report(4000).production.has(76));assert.ok(report(23).production.has(72));assert.ok(report(23).production.has(73));assert.ok(report(33).production.has(74));assert.ok(report(33).production.has(75));assert.ok(!report(14).production.has(74));
 assert.equal(report(8).production.size,0);assert.equal(report(2003).production.size,0);for(const g of report(2001).production.keys())assert.ok(!m.goods.get(g).tags.includes('food'));
 assert.throws(()=>cleanEconomyEdits({format:'silvengard-economy-v1',cityProduction:{14:{74:1}}},W,data),/origem/);
});
test('province totals include every urban and rural producer exactly once, with Valar and Adhuc blocked',()=>{
 const p=createProvinceModel(W,P);p.importData(W.defaultProvinceEdits);const m=createEconomy(W,data);
 for(const id of p.data.provinces.filter(p=>p.state===17||[13,12].includes(p.state)).map(p=>p.i)){
  const r=m.province(id,p.provinceAt),expected=new Map(r.rural);for(const b of r.cities)for(const [g,n]of m.city(b).production)expected.set(g,(expected.get(g)||0)+n);for(const [g,n]of r.production)assert.ok(Math.abs(n-expected.get(g))<1e-8);
  if(r.cities.some(b=>b.i===2001)||p.data.provinces.find(p=>p.i===id).state===17)assert.equal(r.rural.size,0);
 }
});
test('manufacturing imports real stock over registered routes, consumes inputs and conserves coins',()=>{
 const D={settings:{distanceScale:1,shipSpeed:11},cultures:[],religions:[],cities:[{i:1,name:'Mina',state:1,cell:0,x:0,y:0,visible:true,demographics:{population:1000}},{i:2,name:'Forja',state:1,cell:1,x:10,y:0,visible:true,demographics:{population:1000}}],cells:[{i:0,h:30,biome:6},{i:1,h:30,biome:6}],routes:[{id:'road',kind:'road',points:[[0,0],[10,0]],fromCity:1,toCity:2}]};
 const small={...data,cityReferences:{},ruralSites:[],cityDefaults:{},cityNotes:{},profiles:{1:{population:1000,production:[{goodId:4,units:10}]},2:{population:1000,production:[{goodId:59,units:5,recipe:[{goodId:4,units:5}]}]}}},edits={format:'silvengard-economy-v1',foodPer1000:0};
 const state=simulateEconomy(D,small,edits,null,[],()=>null);assert.equal(state.last.production['city:2'][59],5);assert.equal(state.last.consumption['city:2'][4],5);assert.ok(state.last.trades.some(t=>t.good===4&&t.from==='city:1'&&t.to==='city:2'));assert.equal(Object.values(state.accounts).reduce((n,a)=>n+a.coins,0),20000);
 const isolated=simulateEconomy({...D,routes:[]},small,edits,null,[],()=>null);assert.equal(isolated.last.production['city:2'],undefined);assert.equal(isolated.last.idle['city:2'][59],5);
 const second=simulateEconomy(D,small,edits,state,[],()=>null);assert.equal(second.cycle,2);assert.equal(Object.values(second.accounts).reduce((n,a)=>n+a.coins,0),20000);
});
test('global routes add only lawful land/water paths, preserve existing routes and can be saved with economic state',()=>{
 const before=JSON.stringify(W),plan=planEconomyRoutes(W,data),D=bakeEdition(W,plan.edition);assert.equal(plan.summary.tradeComponents,1);assert.equal(JSON.stringify(W),before);
 for(const r of plan.edition.networkEdits.routes)for(const xy of r.points){const c=D.cells[Math.floor(xy[1]/D.grid.stepY)*D.grid.columns+Math.floor(xy[0]/D.grid.stepX)];assert.equal(c.h<20,r.kind==='sea');if(r.kind==='road')assert.notEqual(c.state,17);}
 for(const r of W.routes)assert.deepEqual(D.routes.find(v=>v.id===r.id),r);for(const b of W.cities){const next=D.cities.find(v=>v.i===b.i);for(const k of ['demographics','culture','faith','emblem','x','y'])assert.deepEqual(next[k],b[k]);assert.equal(next.majorPort,b.majorPort);}
 const p=createProvinceModel(D,P);p.importData(D.defaultProvinceEdits);const config=createEconomy(D,data).edits,state=simulateEconomy(D,data,config,null,p.data.provinces,p.provinceAt);assert.equal(state.cycle,1);assert.ok(state.last.trades.length>0);assert.ok(!state.accounts['city:8']);assert.ok(!state.accounts['city:2003']);for(const a of Object.values(state.accounts))for(const n of Object.values(a.stock))assert.ok(n>=0);
 assert.ok(D.cities.some(b=>b.magicSchool&&(state.last.production['city:'+b.i]?.[77]||0)>0),'magic research must be feasible in the configured world');assert.ok(state.last.trades.some(t=>t.good===77),'research must circulate as a trade good');
 const saved=bakeEdition(D,{format:'silvengard-atlas-v1',edits:{cities:{},states:{}},economyEdits:config,economyState:state});assert.deepEqual(saved.economyState,state);assert.deepEqual(saved.economyEdits,config);assert.deepEqual(saved.defaultProvinceEdits,W.defaultProvinceEdits);assert.throws(()=>cleanEconomyState({...state,accounts:{'city:1':{coins:-1,stock:{}}}},data),/Caixa/);
});
