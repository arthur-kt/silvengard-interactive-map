import {routeGraph} from './economy-routing.js?v=43.1';
import {economicNodes} from './economy-rural.js?v=43.1';
import {marketScarcity} from './economy-scarcity.js?v=43.1';
import {routeReport} from './route-info.js?v=40';
export const pairKey=(a,b)=>[+a,+b].sort((a,b)=>a-b).join(':');
export function atWar(D,edits,a,b){
 if(a===b||!a||!b)return false;
 const override=edits.diplomacy?.[pairKey(a,b)];
 if(override)return override==='War'||override==='Enemy'&&!D.economicReview;
 if((D.activeWars||[]).some(p=>p.includes(a)&&p.includes(b)))return true;
 return [a,b].some((id,i)=>(D.states?.find(s=>s.i===id)?.diplomacy||[]).some(r=>r.state===[b,a][i]&&(r.relation==='War'||r.relation==='Enemy'&&!D.economicReview)));
}
export function applyEconomicDiplomacy(D,edits){
 for(const [pair,relation]of Object.entries(edits.diplomacy||{})){const [a,b]=pair.split(':').map(Number);for(const [id,other]of [[a,b],[b,a]]){const s=D.states.find(s=>s.i===id);if(!s)continue;s.diplomacy??=[];let row=s.diplomacy.find(r=>r.state===other);if(!row)s.diplomacy.push(row={state:other});Object.assign(row,{relation,label:({War:'Em guerra',Enemy:'Inimizade',Rival:'Rivalidade',Neutral:'Neutra',Friendly:'Amistosa',Ally:'Aliada',Suspicion:'Desconfiança'})[relation]});}}
}
export function createMarkets(D,data,model,context=null){
 const active=D.cities.filter(b=>b.state!==17&&b.demographics?.population>0),regions=(data.markets||[]).map(m=>{
  const center=active.find(b=>b.i===m.centerCity)||active.find(b=>data.cityReferences[b.i]===m.centerCity)||active.filter(b=>data.cityMarkets[b.i]===m.i).sort((a,b)=>b.demographics.population-a.demographics.population)[0];
  return center?{...m,center,name:'Mercado de '+center.name}:null;
 }).filter(Boolean);
 const cityMarket=b=>!b||b.state===17||data.authorMarketDefaults?.territories?.excludedStates?.includes(b.state)||data.cityMarkets[b.i]===null?undefined:regions.find(m=>m.i===data.cityMarkets[b.i])||[...regions].sort((a,c)=>Math.hypot(b.x-a.center.x,b.y-a.center.y)-Math.hypot(b.x-c.center.x,b.y-c.center.y))[0];
 const rawPrice=(b,g)=>{const m=cityMarket(b),base=model.price(g),original=data.goods.find(v=>v.i===g)?.price||base;return Math.round((m?.prices?.[g]??original)*(original?base/original:1)*100)/100;};
 const prepared=context?{...context,nodes:context.nodes||economicNodes(D,data,model,context.provinces||[],context.provinceAt)}:null;if(prepared)prepared.graph=tradeGraph(D,prepared.nodes,model.edits);
 const scarcity=context?marketScarcity(D,data,model,regions,cityMarket,rawPrice,prepared):{factors:{},details:{}};
 const price=(b,g)=>{const m=cityMarket(b),recorded=context?.recordedPrices?.[m?.i]?.[g];return Number.isFinite(recorded)?recorded:Math.round(rawPrice(b,g)*(scarcity.byState?.[b?.state]?.[m?.i]?.[g]??scarcity.factors[m?.i]?.[g]??1)*100)/100;};
 return {regions,cityMarket,price,rawPrice,scarcity:scarcity.details,territories:data.authorMarketDefaults?.territories};
}
export function tradeGraph(D,nodes,edits){return routeGraph(D,nodes,edits,atWar);}
export function routeFlows(trades){const out=new Map();for(const t of trades||[])for(const id of new Set(t.routes||[])){if(!out.has(id))out.set(id,{id,coins:0,trades:0,goods:{},directions:[]});const row=out.get(id);row.coins+=t.coins;row.trades++;row.goods[t.good]=(row.goods[t.good]||0)+t.units;row.directions.push({from:t.from,to:t.to});}return out;}
