import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {incomeReport,SOCIAL_CLASSES} from '../../app/dist/economy-income.js';
import {forcedLaborPeople,laborCostFactor} from '../../app/dist/economy-labor.js';
import {simulateEconomy} from '../../app/dist/economy-simulation.js';
import {tradeQuote} from '../../app/dist/economy-policy.js';
import {applyCityEdit} from '../../app/dist/city-editor-core.js';
const read=p=>JSON.parse(fs.readFileSync(caminho(p))),W=read('dist/world.json'),source=read('dist/economy-source.json');
test('peasants have near-subsistence income, visible class shares, and no salary for enslaved residents',()=>{
 const b=W.cities.find(b=>b.state===20&&!b.magicSchool),r=incomeReport(b),p=r.rows.find(r=>r.id==='peasant');
 assert.ok(Math.abs(p.disposable/p.cash-1/101)<1e-10);assert.equal(p.unfree,forcedLaborPeople(b));assert.equal(p.units,(p.residents-p.unfree)/r.profile.householdSize);
 assert.ok(laborCostFactor(b)<1);assert.equal(SOCIAL_CLASSES[0].cashShare,.1);
 const city=structuredClone(b);applyCityEdit(city,{forcedLaborShare:5},W);assert.equal(city.forcedLaborShare,5);assert.equal(city.demographics.population,b.demographics.population);
 assert.throws(()=>applyCityEdit(structuredClone(W.cities.find(b=>b.state===13)),{forcedLaborShare:5},W));
});
test('captive trade uses finite integer cohorts and preserves people and money across cycles',()=>{
 const D={states:[{i:20,diplomacy:[]},{i:24,diplomacy:[]}],settings:{distanceScale:1},cells:[{i:0,h:30,state:20},{i:1,h:30,state:24}],cities:[{i:1,name:'A',state:20,visible:true,x:0,y:0,cell:0,demographics:{population:1000},forcedLaborShare:10},{i:2,name:'B',state:24,visible:true,x:10,y:0,cell:1,demographics:{population:1000},forcedLaborShare:20}],routes:[{id:'road',kind:'road',points:[[0,0],[10,0]],stops:[1,2],stopMode:'explicit'}]};
 const data={...source,profiles:{1:{population:1000,production:[]},2:{population:1000,production:[]}},cityDefaults:{},cityReferences:{},cityMarkets:{1:1,2:1},cityServices:{},ruralSites:[],markets:[{i:1,centerCity:1,prices:{31:5}}]},edits={format:'silvengard-economy-v1',foodPer1000:0,defaultTariff:0,piracyZones:[],initialGoldPerResident:2},a=simulateEconomy(D,data,edits,null,[],()=>null,{instant:true}),b=simulateEconomy(D,data,edits,a,[],()=>null,{instant:true}),people=s=>Object.values(s.accounts).reduce((n,a)=>n+(a.stock[31]||0)+(a.assets[31]||0),0)+s.shipments.filter(t=>t.good===31).reduce((n,t)=>n+t.units,0);
 assert.equal(people(a),300);assert.equal(people(b),300);assert.ok(a.last.trades.some(t=>t.good===31));assert.ok(a.last.trades.every(t=>t.good!==31||Number.isInteger(t.units)));
 assert.equal(b.last.newCapital,0);assert.equal(Object.values(a.accounts).reduce((n,a)=>n+a.coins,0),Object.values(b.accounts).reduce((n,a)=>n+a.coins,0));assert.ok(!Object.values(a.last.production).some(p=>p[31]));
 const quote={sellerState:24,buyerState:13,good:31,price:5,path:{freight:0,risk:0}};assert.equal(tradeQuote(D,{},quote),null);
 assert.equal(tradeQuote(D,{diplomacy:{'20:24':'War'}},{...quote,buyerState:20}),null);
});
test('specialization view separates subsistence without changing economic output',()=>{
 const audit=read('revisao-v42-verificacao.json');assert.ok(audit.specialization.length>10);assert.ok(audit.specialization.find(g=>g.good==='Ferro'));assert.ok(audit.specialization.find(g=>g.good==='Grãos'));assert.equal(audit.forcedLabor.registered,audit.forcedLabor.afterSecond);
 const coa=W.states.find(s=>s.i===20).coa;assert.equal(coa.shield,'horsehead2');assert.equal(coa.charges[0].charge,'wyvern');assert.equal(coa.division.line,'arched');
});
