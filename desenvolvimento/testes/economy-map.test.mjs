import {caminho,caminhoPai,lerJSON,lerTexto} from './base.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createProvinceModel} from '../../app/dist/province-core.js';
import {createEconomy} from '../../app/dist/economy-core.js';
import {createMarkets} from '../../app/dist/economy-trade.js';
import {simulateEconomy} from '../../app/dist/economy-simulation.js';
import {buildEconomicMap,goodColor,goodSymbol} from '../../app/dist/economy-map-core.js';
const read=p=>JSON.parse(fs.readFileSync(caminho(p))),D=read('dist/world.json'),data=read('dist/economy-source.json'),pm=createProvinceModel(D,read('dist/province-proposal.json'));pm.importData(D.defaultProvinceEdits);pm.pruneEmpty();
const model=createEconomy(D,data,D.economyEdits),provinces=pm.data.provinces,markets=createMarkets(D,data,model),provReports=new Map(provinces.map(p=>[p.i,model.province(p.i,pm.provinceAt)])),state=simulateEconomy(D,data,model.edits,null,provinces,pm.provinceAt),snapshot={model,markets,provReports,state},map=buildEconomicMap(D,snapshot,provinces,pm.provinceAt,{goodsBasis:'total'});
test('Seven Cities replace less fitting goods with actual extraction and retain their identity',()=>{
 const previous=read('backups/v30-before-economic-maps/world.json'),total=new Map();for(const b of D.cities.filter(b=>b.state===23)){const old=previous.cities.find(x=>x.i===b.i);const {socialProfile,...identity}=b;assert.deepEqual(identity,old);const report=model.city(b);assert.ok([4,5,6,7,8].some(g=>report.production.has(g)),b.name);for(const [g,n]of report.production)total.set(g,(total.get(g)||0)+n);for(const g of [4,5,6,7,8])if(report.production.has(g))assert.equal(state.last.production['city:'+b.i][g],report.production.get(g));}
 for(const g of [4,5,6,7,8])assert.ok(total.get(g)>0);assert.equal(total.get(71)||0,0);assert.deepEqual(D.cells,previous.cells);for(const r of previous.routes)assert.ok(D.routes.some(n=>n.id===r.id));assert.deepEqual(D.defaultProvinceEdits,previous.defaultProvinceEdits);
});
test('market territories honor every active city, cover land across states and exclude Valar',()=>{
 for(const b of D.cities.filter(b=>b.state!==17&&b.demographics?.population>0))assert.equal(map.marketField[b.cell],markets.cityMarket(b).i,b.name);
 for(const c of D.cells){if(c.h<20||c.state===17||c.state===0)assert.equal(map.marketField[c.i],0);else assert.ok(map.marketInfo.has(map.marketField[c.i]));}
 assert.ok([...map.marketInfo.values()].some(m=>m.states.size>1));assert.equal(map.marketInfo.size,10);
});
test('goods map selects the actual dominant product by value and preserves the full production list',()=>{
 for(const p of provinces){const r=map.provinceGoods.get(p.i),sorted=[...r.production].sort((a,b)=>b[1]*model.price(b[0])-a[1]*model.price(a[0])||a[0]-b[0]);assert.equal(r.good,sorted[0]?.[0]||0);assert.ok(/^#[0-9a-f]{6}$/i.test(r.color));if(r.good){const cell=D.cells[Math.floor(r.point[1]/D.grid.stepY)*D.grid.columns+Math.floor(r.point[0]/D.grid.stepX)];assert.equal(pm.provinceAt(cell.i)?.i,p.i);}}
 assert.equal(goodSymbol(model.goods.get(4)),'Fe');assert.equal(goodSymbol(model.goods.get(8)),'Au');assert.notEqual(goodColor(4),goodColor(8));
});
test('directional market links and market production reconcile with individual transfers',()=>{
 let cross=0;for(const t of state.last.trades){const a=map.accountMarket.get(t.from),b=map.accountMarket.get(t.to);if(a&&b&&a!==b)cross+=t.coins;}
 assert.equal([...map.links.values()].reduce((s,l)=>s+l.coins,0),cross);const incoming=[...map.marketInfo.values()].reduce((s,m)=>s+m.incoming,0),outgoing=[...map.marketInfo.values()].reduce((s,m)=>s+m.outgoing,0);assert.ok(Math.abs(incoming*100-cross)<1e-6);assert.ok(Math.abs(incoming-outgoing)<1e-6);
 for(const l of map.links.values()){assert.notEqual(l.from,l.to);assert.ok(map.marketInfo.has(l.from)&&map.marketInfo.has(l.to));assert.ok(l.goods.size>0);for(const id of l.routes)assert.ok(D.routes.some(r=>r.id===id));}
 let mapped=0;for(const [account,rows]of Object.entries(state.last.production))if(map.accountMarket.has(account))for(const [g,n]of Object.entries(rows))mapped+=n*model.price(+g);assert.ok(Math.abs(mapped-[...map.marketInfo.values()].reduce((s,m)=>s+m.baseValue,0))<1e-6);
});
