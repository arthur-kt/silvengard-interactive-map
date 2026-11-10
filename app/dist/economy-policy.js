import {laborCostFactor,SLAVE_TRADING_STATES} from './economy-labor.js?v=43.1';
export const RELATION_RATES={Ally:.9,Friendly:.95,Neutral:1,Unknown:1,Suspicion:1.15,Rival:1.2,Enemy:1.35};
export function cleanTradePolicies(raw,D,data){
 const states=new Set((D.states||[]).map(s=>s.i).filter(i=>i&&i!==17)),goods=new Set(data.goods.map(g=>g.i)),embargoes=[],navalBlockades=[],piracyZones=[],stateTariffs={};
 const number=(n,min,max,label)=>{if(!Number.isFinite(n)||n<min||n>max)throw Error(label+' inválido.');return n;};
 const defaultTariff=number(raw.defaultTariff??.05,0,1,'Tarifa padrão'),scarcityStrength=number(raw.scarcityStrength??.65,0,2,'Escassez');
 for(const [id,rate]of Object.entries(raw.stateTariffs||{})){if(!states.has(+id))throw Error('Estado da tarifa inválido.');stateTariffs[id]=number(rate,0,1,'Tarifa');}
 if(!Array.isArray(raw.embargoes??[])||(raw.embargoes?.length||0)>1000)throw Error('Embargos inválidos.');
 for(const e of raw.embargoes||[]){if(!states.has(e.from)||!states.has(e.to)||e.from===e.to||!Array.isArray(e.goods)||e.goods.some(g=>!goods.has(g)))throw Error('Embargo inválido.');const row={from:e.from,to:e.to,goods:[...new Set(e.goods)].sort((a,b)=>a-b)};if(!embargoes.some(r=>r.from===row.from&&r.to===row.to&&JSON.stringify(r.goods)===JSON.stringify(row.goods)))embargoes.push(row);}
 if(!Array.isArray(raw.navalBlockades??[])||(raw.navalBlockades?.length||0)>500)throw Error('Bloqueios navais inválidos.');
 for(const b of raw.navalBlockades||[]){if(!states.has(b.by)||!states.has(b.state)||b.by===b.state)throw Error('Bloqueio naval inválido.');if(!navalBlockades.some(r=>r.by===b.by&&r.state===b.state))navalBlockades.push({by:b.by,state:b.state});}
 const defaults=[{state:32,risk:.14,radius:90},{state:20,risk:.12,radius:90}].filter(z=>states.has(z.state));
 if(!Array.isArray(raw.piracyZones??defaults)||(raw.piracyZones?.length||0)>100)throw Error('Zonas de pirataria inválidas.');
 for(const z of raw.piracyZones??defaults){if(!states.has(z.state))throw Error('Zona de pirataria inválida.');piracyZones.push({state:z.state,risk:number(z.risk,0,.5,'Risco de pirataria'),radius:number(z.radius,4,300,'Alcance da pirataria')});}
 if(raw.convoys!==undefined&&typeof raw.convoys!=='boolean')throw Error('Configuração de comboios inválida.');return {defaultTariff,stateTariffs,scarcityStrength,embargoes,navalBlockades,piracyZones,convoys:raw.convoys??false};
}
export function tradeRelation(D,edits,a,b){
 if(a===b)return 'Neutral';const key=[a,b].sort((a,b)=>a-b).join(':'),override=edits.diplomacy?.[key];if(override)return override;
 const relations=[D.states?.find(s=>s.i===a)?.diplomacy?.find(r=>r.state===b)?.relation,D.states?.find(s=>s.i===b)?.diplomacy?.find(r=>r.state===a)?.relation].filter(Boolean);
 if((D.activeWars||[]).some(p=>p.includes(a)&&p.includes(b))||relations.includes('War'))return 'War';if(relations.includes('Enemy'))return 'Enemy';return relations[0]||'Neutral';
}
export function isEmbargoed(edits,a,b,g){return a!==b&&(edits.embargoes||[]).some(e=>(e.from===a&&e.to===b||e.from===b&&e.to===a)&&(!e.goods.length||e.goods.includes(g)));}
export function tradeQuote(D,edits,{sellerState,buyerState,good,price,cost=0,path}){
 const relation=tradeRelation(D,edits,sellerState,buyerState);if((relation==='War'||relation==='Enemy'&&!D.economicReview)||isEmbargoed(edits,sellerState,buyerState,good)||!path)return null;
 if(good===31&&(!SLAVE_TRADING_STATES.includes(sellerState)||!SLAVE_TRADING_STATES.includes(buyerState)))return null;
 const multiplier=sellerState===buyerState?1:(RELATION_RATES[relation]??1)*((D.localTradeAgreements||[]).find(a=>a.states.includes(sellerState)&&a.states.includes(buyerState))?.rate??1),origin=Math.max(price*multiplier,cost),freight=origin*path.freight,tariffRate=sellerState===buyerState?0:edits.stateTariffs?.[buyerState]??edits.defaultTariff??.05,tariff=origin*tariffRate,risk=Math.min(.95,Math.max(0,path.risk||0)),survival=1-risk,shippedPrice=origin+freight+tariff;
 return {origin,freight,tariff,tariffRate,risk,survival,multiplier,relation,shippedPrice,delivered:shippedPrice/survival,costFloor:cost};
}
// A pricing floor, not an automatic debit to a treasury. Actual purchased inputs
// are tracked in inventory; labour/extraction uses a configurable reference model.
export function referenceUnitCost(model,market,city,g){const good=model.goods?.get(g),base=model.price(g);const labour=((good?.labourHours||0)*.25+(good?.unskilledHours||0)*.025)*laborCostFactor(city);if(!good?.recipes?.length)return labour||base*.5;const recipes=good.recipes.map(r=>Object.entries(r).reduce((s,[id,n])=>s+n*market.price(city,+id),0));return Math.min(...recipes)+(labour||base*.15);}
export function quotedUnitCost(model,markets,city,g,account){return Math.max(referenceUnitCost(model,markets,city,g),account?.stock?.[g]>0&&account.stockCosts?.[g]!==undefined?account.stockCosts[g]/account.stock[g]:0);}
export function piracyField(D,edits){
 const field=new Float32Array(D.cells?.length||0),g=D.grid;if(!g)return field;const step=Math.min(g.stepX,g.stepY);
 for(const zone of edits.piracyZones||[]){if(!zone.risk)continue;const distance=new Int16Array(D.cells.length).fill(-1),queue=[];
  for(const c of D.cells){if(c.h<20||c.state!==zone.state)continue;for(const id of c.c||[]){if(D.cells[id]?.h<20&&distance[id]<0){distance[id]=0;queue.push(id);}}}
  for(let j=0;j<queue.length;j++){const id=queue[j],d=distance[id],risk=zone.risk*(1-d*step/zone.radius);field[id]=Math.max(field[id],risk);if((d+1)*step>zone.radius)continue;const col=id%g.columns;for(const next of [col? id-1:-1,col<g.columns-1?id+1:-1,id-g.columns,id+g.columns])if(next>=0&&next<D.cells.length&&D.cells[next].h<20&&distance[next]<0){distance[next]=d+1;queue.push(next);}}
 }
 return field;
}
