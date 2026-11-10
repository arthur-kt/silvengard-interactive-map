import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEconomy,cleanEconomyEdits} from '../../app/dist/economy-core.js';
import {simulateEconomy} from '../../app/dist/economy-simulation.js';
import {createMarkets,atWar,routeFlows,applyEconomicDiplomacy,tradeGraph} from '../../app/dist/economy-trade.js';
import {bakeEdition} from '../../app/tools/bake-defaults.mjs';
const data=JSON.parse(fs.readFileSync(caminho('dist/economy-source.json'))),W=JSON.parse(fs.readFileSync(caminho('dist/world.json')));
function fixture(){
 const D={settings:{distanceScale:1,shipSpeed:11},states:[1,2,3].map(i=>({i,diplomacy:[]})),cities:[{i:1,name:'Mina A',state:1,cell:0,x:0,y:0,visible:true,demographics:{population:1000}},{i:2,name:'Mina B',state:2,cell:1,x:0,y:60,visible:true,demographics:{population:1000}},{i:3,name:'Forja',state:3,cell:2,x:100,y:0,visible:true,demographics:{population:1000}}],cells:[0,1,2].map(i=>({i,h:30,biome:6})),routes:[{id:'A',kind:'road',points:[[0,0],[100,0]]},{id:'B',kind:'road',points:[[0,60],[100,0]]}]};
 const source={...data,markets:[{i:1,centerCity:1,prices:{4:1}},{i:2,centerCity:2,prices:{4:2}}],cityMarkets:{1:1,2:2,3:2},cityReferences:{},ruralSites:[],cityDefaults:{},cityNotes:{},profiles:{1:{population:1000,production:[{goodId:4,units:10}]},2:{population:1000,production:[{goodId:4,units:10}]},3:{population:1000,production:[{goodId:59,units:5,recipe:[{goodId:4,units:5}]}]}}};
 return {D,source,edits:{format:'silvengard-economy-v1',foodPer1000:0}};
}
test('regional market prices are distinct and scale with an edited global reference price',()=>{
 const {D,source,edits}=fixture(),m=createEconomy(D,source,edits),markets=createMarkets(D,source,m);assert.equal(markets.price(D.cities[0],4),1);assert.equal(markets.price(D.cities[1],4),2);
 const changed=createMarkets(D,source,createEconomy(D,source,{...edits,prices:{4:m.price(4)*2}}));assert.equal(changed.price(D.cities[0],4),2);assert.equal(changed.price(D.cities[1],4),4);
});
test('war removes the cheapest enemy supplier and reallocates purchases without mutating the current world',()=>{
 const {D,source,edits}=fixture(),before=JSON.stringify(D),peace=simulateEconomy(D,source,edits,null,[],()=>null);assert.ok(peace.last.trades.some(t=>t.from==='city:1'&&t.to==='city:3'&&t.good===4));
 const war=simulateEconomy(D,source,{...edits,diplomacy:{'1:3':'Enemy'}},null,[],()=>null);assert.ok(!war.last.trades.some(t=>t.from==='city:1'&&t.to==='city:3'));assert.ok(war.last.trades.some(t=>t.from==='city:2'&&t.to==='city:3'&&t.good===4));assert.equal(war.last.production['city:3'][59],5);assert.equal(JSON.stringify(D),before);
 const flows=routeFlows(war.last.trades);assert.ok(flows.get('B').goods[4]>0);assert.ok(!flows.get('A')?.goods[4]);assert.equal(Object.values(war.accounts).reduce((s,a)=>s+a.coins,0),30000);
});
test('commercial routing compares sea and land freight and rejects hostile transit',()=>{
 const {D,source,edits}=fixture();D.routes=[{id:'land',kind:'road',points:[[0,0],[100,0]]},{id:'sea',kind:'sea',points:[[0,0],[0,-60],[100,-60],[100,0]]}];D.cities[0].harbor={waterPoint:[0,0]};D.cities[2].harbor={waterPoint:[100,0]};
 const config=cleanEconomyEdits(edits,D,source),nodes=new Map(D.cities.map(b=>['city:'+b.i,{id:'city:'+b.i,state:b.state}]));const graph=tradeGraph(D,nodes,config);assert.deepEqual(graph.paths.get('city:3').get('city:1').routes,['sea']);assert.ok(graph.paths.get('city:3').get('city:1').seaKm>100);
 D.routes=[{id:'transit',kind:'road',points:[[0,0],[50,0],[100,0]]}];D.cities[1].x=50;D.cities[1].y=0;const blocked=tradeGraph(D,nodes,{...config,diplomacy:{'2:3':'Enemy'}});assert.equal(blocked.paths.get('city:3').has('city:1'),false);
});
test('economic diplomacy is reciprocal, exportable and saved with existing provinces intact',()=>{
 const config=cleanEconomyEdits({...W.economyEdits,diplomacy:{'12:33':'War'}},W,data),D=structuredClone(W);applyEconomicDiplomacy(D,config);assert.ok(atWar(D,config,12,33));assert.equal(D.states.find(s=>s.i===33).diplomacy.find(r=>r.state===12).relation,'War');
 const saved=bakeEdition(W,{format:'silvengard-atlas-v1',edits:{cities:{},states:{}},economyEdits:config});assert.deepEqual(saved.defaultProvinceEdits,W.defaultProvinceEdits);assert.equal(saved.states.find(s=>s.i===12).diplomacy.find(r=>r.state===33).relation,'War');assert.throws(()=>cleanEconomyEdits({...config,seaFreight:-1},W,data),/Frete/);
});
