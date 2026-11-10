import {cleanTradePolicies} from './economy-policy.js?v=43.1';
import {economicPopulation,residentPopulation} from './economy-society.js?v=43.1';
import {ruralAllocation} from './economy-rural.js?v=43.1';
export const ECONOMY_FORMAT='silvengard-economy-v1';
export const COINS={PC:1,PP:10,PO:100,PL:1000};
export function toGold(amount,coin='PO'){if(!Number.isFinite(amount)||!(coin in COINS))throw Error('Valor monetário inválido.');return Math.round(amount*COINS[coin])/100;}
export function money(gold){const cp=Math.round(gold*100),sign=cp<0?'−':'',n=Math.abs(cp),f=v=>v.toLocaleString('pt-BR',{maximumFractionDigits:2});if(n>=100)return sign+f(n/100)+' PO';const sp=Math.floor(n/10),c=n%10;return sign+(sp?sp+' PP'+(c?' '+c+' PC':''):c+' PC');}
export function cleanEconomyEdits(raw,D,data){
 if(raw?.format!==ECONOMY_FORMAT)throw Error('Configuração econômica inválida.');
 const cycleDays=raw.cycleDays??30,ruralScale=raw.ruralScale??data.defaultRuralScale??1,foodPer1000=raw.foodPer1000??D.economyEdits?.foodPer1000??data.calibration?.foodDemandPer1000Per30Days??.5,initialGoldPerResident=raw.initialGoldPerResident??D.economyEdits?.initialGoldPerResident??.1,prices={},cityProduction={},valid=new Set(data.goods.map(g=>g.i));
 if(!Number.isInteger(cycleDays)||cycleDays<1||cycleDays>365||!Number.isFinite(ruralScale)||ruralScale<0||ruralScale>100)throw Error('Ciclo ou capacidade rural inválidos.');
 if(!Number.isFinite(foodPer1000)||foodPer1000<0||foodPer1000>100||!Number.isFinite(initialGoldPerResident)||initialGoldPerResident<0||initialGoldPerResident>10000)throw Error('Demanda ou caixa inicial inválidos.');
 for(const [id,v]of Object.entries(raw.prices||{})){if(!valid.has(+id)||!Number.isFinite(v)||v<0||v>1e9)throw Error('Preço inválido.');prices[id]=Math.round(v*100)/100;}
 const price=id=>prices[id]??data.goods.find(g=>g.i===id).price;
 if(!(price(74)>price(72)&&price(72)>price(4)))throw Error('Lavanthir deve valer mais que ossos de dragão, e ossos mais que ferro.');
 for(const [id,rows]of Object.entries(raw.cityProduction||{})){
  if(!D.cities.some(b=>b.i===+id))continue;if(!rows||typeof rows!=='object'||Array.isArray(rows))throw Error('Produção urbana inválida.');cityProduction[id]={};
  for(const [g,v]of Object.entries(rows)){if(!valid.has(+g)||!Number.isFinite(v)||v<0||v>1e9)throw Error('Capacidade produtiva inválida.');if(+g===72&&+id!==23||+g===74&&+id!==33)throw Error('Este material bruto só é produzido em sua origem definida.');cityProduction[id][g]=v;}
 }
 const landFreight=raw.landFreight??.0005,seaFreight=raw.seaFreight??.00015,diplomacy={};
 for(const n of [landFreight,seaFreight])if(!Number.isFinite(n)||n<0||n>.1)throw Error('Frete inválido.');
 for(const [key,relation]of Object.entries(raw.diplomacy||{})){const pair=key.split(':').map(Number);if(pair.length!==2||pair[0]>=pair[1]||!pair.every(i=>D.states?.some(s=>s.i===i))||!['Neutral','Friendly','Ally','Suspicion','Rival','Enemy','War'].includes(relation))throw Error('Relação diplomática inválida.');diplomacy[key]=relation;}
 return {format:ECONOMY_FORMAT,cycleDays,ruralScale,foodPer1000,initialGoldPerResident,prices,cityProduction,landFreight,seaFreight,diplomacy,...cleanTradePolicies(raw,D,data)};
}
export function createEconomy(D,data,raw={format:ECONOMY_FORMAT}){
 const edits=cleanEconomyEdits(raw,D,data),goods=new Map(data.goods.map(g=>[g.i,g])),price=id=>edits.prices[id]??goods.get(id)?.price??0,factor=edits.cycleDays/data.baseCycleDays;
 const food=id=>goods.get(id)?.tags.includes('food'),add=(m,id,n)=>{if(n>0)m.set(id,(m.get(id)||0)+n);};
 function city(b){
  const production=new Map(),inputs=new Map(),jobs=[],reference=data.profiles[b.i]||data.profiles[data.cityReferences[b.i]],alive=![0,17].includes(b.state)&&residentPopulation(b)>0;
  const adhuc=b.i===2001,dead=[13,14,15].includes(D.cells[b.cell]?.biome),allowed=id=>!((adhuc||dead)&&food(id))&&!(id===53&&!b.port&&!b.majorPort)&&!(id===72&&b.i!==23)&&!(id===74&&b.i!==33)&&!(id===77&&!b.magicSchool)&&!goods.get(id)?.nonStock&&!goods.get(id)?.eventOnly;
  if(alive){
   const scale=(economicPopulation(b)/(reference?.population||economicPopulation(b)))*factor;
   const overrides={...(b.magicSchool&&goods.has(77)?{77:Math.min(4,Math.max(.5,Math.sqrt(b.demographics.population/10000)))}:{}),...(data.cityDefaults[b.i]||{}),...(edits.cityProduction[b.i]||{})};
   for(const row of reference?.production||[]){if(Object.hasOwn(overrides,row.goodId)||adhuc||!allowed(row.goodId))continue;add(production,row.goodId,row.units*scale);for(const r of row.recipe||[])add(inputs,r.goodId,r.units*scale);jobs.push({good:row.goodId,capacity:row.units*scale,recipe:(row.recipe||[]).map(r=>({good:r.goodId,units:r.units/row.units}))});}
   for(const [key,base]of Object.entries(overrides)){const id=+key;if(!allowed(id)||!base)continue;add(production,id,base*factor);const recipe=goods.get(id)?.recipes?.[0];if(recipe)for(const [g,n]of Object.entries(recipe))add(inputs,+g,n*base*factor);jobs.push({good:id,capacity:base*factor,recipe:Object.entries(recipe||{}).map(([g,n])=>({good:+g,units:n}))});}
  }
  return totals({production,inputs,jobs,cities:[b],note:alive?data.cityNotes[b.i]||'':'Localidade sem atividade econômica.',incompleteCost:production.has(74)});
 }
 function totals(result){result.gross=[...result.production].reduce((sum,[id,n])=>sum+n*price(id),0);result.inputCost=[...result.inputs].reduce((sum,[id,n])=>sum+n*price(id),0);return result;}
 function eligible(c,id){if(!c||c.h<20||[0,17].includes(c.state)||[13,14,15].includes(c.biome)||id===31||id===19)return false;const tags=goods.get(id)?.tags||[];if(tags.includes('food')&&[1,2,10,11].includes(c.biome)&&id!==17&&id!==11)return false;return true;}
 function provinceBase(id,provinceAt){
  const towns=D.cities.filter(b=>provinceAt(b.cell)?.i===id),production=new Map(),inputs=new Map(),rural=new Map();let incompleteCost=false;
  for(const b of towns){const r=city(b);for(const [g,n]of r.production)add(production,g,n);for(const [g,n]of r.inputs)add(inputs,g,n);incompleteCost ||= r.incompleteCost;}
  const blocked=towns.some(b=>b.i===2001)||D.cells.some(c=>c.h>=20&&provinceAt(c.i)?.i===id&&c.state===17);let ruralSites=0;
  if(!blocked)for(const site of data.ruralSites){const c=D.cells[site.cell];if(provinceAt(site.cell)?.i!==id||!eligible(c,site.goodId))continue;add(rural,site.goodId,site.units*factor*edits.ruralScale);ruralSites++;}
  for(const [g,n]of rural)add(production,g,n);
  return totals({production,inputs,rural,ruralSites,cities:towns,incompleteCost,note:blocked?'Sem extração rural nesta região.':''});
 }
 function balance(report){return [...new Set([...report.production.keys(),...report.inputs.keys()])].map(id=>({id,produced:report.production.get(id)||0,used:report.inputs.get(id)||0,balance:(report.production.get(id)||0)-(report.inputs.get(id)||0)}));}
 function connections(ids){const set=new Set(ids),out=[];for(const r of D.routes){if(r.enabled===false)continue;const stops=[...new Set([r.fromCity,...(r.stops||[]),r.toCity].filter(i=>D.cities.some(b=>b.i===i)))];if(stops.some(i=>set.has(i)))out.push({id:r.id,name:r.name,kind:r.kind,partners:stops.filter(i=>!set.has(i))});}return out;}
 const ruralCache=new Map();
 function ruralAccounts(provinceAt){if(!ruralCache.has(provinceAt)){const ps=new Map();for(const c of D.cells){const p=provinceAt(c.i);if(p)ps.set(p.i,p);}ruralCache.set(provinceAt,ruralAllocation(D,data,[...ps.values()],provinceAt,model).groups);}return ruralCache.get(provinceAt);}
 function province(id,provinceAt){const r=provinceBase(id,provinceAt),rural=new Map();for(const n of ruralAccounts(provinceAt))if(n.province.i===id)for(const [g,q]of n.rural)add(rural,g,q);r.rural=rural;r.production=new Map(rural);r.ruralPopulation=ruralAccounts(provinceAt).filter(n=>n.province.i===id).reduce((s,n)=>s+n.population,0);for(const b of r.cities)for(const [g,q]of city(b).production)add(r.production,g,q);return totals(r);}
 const model={data,edits,goods,price,city,province,provinceBase,ruralAccounts,balance,connections,eligible};return model;
}
