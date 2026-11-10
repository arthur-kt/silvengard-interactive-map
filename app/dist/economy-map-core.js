import {economicPopulation} from './economy-society.js?v=43.1';
import {economicNodes} from './economy-rural.js?v=43.1';
import {populationDescription} from './economy-society.js?v=43.1';
import {applyMarketTerritories} from './market-territories.js?v=43.1';
// Pure thematic model: the same production and transfers used in the ledger.
export const ECONOMIC_MODES=[['economicMarkets','Mercados'],['economicGoods','Bens produzidos'],['economicTrade','Comércio · fluxos'],['economicProduction','Quantidade de um bem'],['economicPrice','Preços']];
export const MARKET_COLORS=['#a9c86c','#da9a68','#8eabd4','#c4a0d1','#d5bf70','#74b7ae','#cc8791','#9eb6cb','#bdad84','#a3b785'];
const sum=(rows,g,n)=>rows.set(g,(rows.get(g)||0)+n);
export function goodColor(id){const fixed={0:'#59636a',1:'#508268',2:'#9d968c',3:'#cbc5b8',4:'#899cae',5:'#c2875c',6:'#8bbdb8',7:'#c9d8e8',8:'#e3bb50',9:'#bbc369',10:'#c6a782',11:'#71b8d6',12:'#83986c',34:'#575267',53:'#6395be',58:'#b5a187',59:'#be736a',72:'#d8cfb6',73:'#b9ad97',74:'#b15c51',75:'#d17656',76:'#c48c65',77:'#a580d0'};if(fixed[id])return fixed[id];const h=(id*.61803398875)%1,s=.4,l=.58;const hue=(p,q,t)=>{if(t<0)t++;if(t>1)t--;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;},q=l+s-l*s,p=2*l-q;return '#'+[hue(p,q,h+1/3),hue(p,q,h),hue(p,q,h-1/3)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');}
export function goodSymbol(g){if(!g)return '—';const fixed={1:'♠',2:'◆',3:'◇',4:'Fe',5:'Cu',6:'Sn',7:'Ag',8:'Au',9:'🌾',10:'🐂',11:'🐟',12:'🏹',18:'♞',23:'💎',34:'⬟',53:'⛵',58:'⚒',59:'⚔',72:'🦴',73:'🦴',74:'🌋',75:'🌋',76:'⚒',77:'✦'};return fixed[g.i]||(g.tags?.includes('food')?'🌾':g.kind==='manufacture'?'⚒':'◈');}
export function buildEconomicMap(D,c,provinces,provinceAt,{goodsBasis='specialization'}={}){
 const towns=D.cities.filter(b=>b.state!==17&&!c.markets.territories?.excludedStates?.includes(b.state)&&b.demographics?.population>0),accountMarket=new Map(),accountState=new Map(),marketInfo=new Map(),provinceGoods=new Map(),goodsField=new Uint16Array(D.cells.length),marketField=new Uint16Array(D.cells.length),links=new Map();
 for(const m of c.markets.regions)marketInfo.set(m.i,{...m,color:MARKET_COLORS[(m.i-2+MARKET_COLORS.length)%MARKET_COLORS.length],cities:[],registeredCities:[],provinces:[],provinceParticipants:new Map(),accounts:[],production:new Map(),stock:new Map(),states:new Map(),localValue:0,baseValue:0,incoming:0,outgoing:0,internal:0});
 for(const b of D.cities.filter(b=>!b.excluded)){const m=marketInfo.get(c.markets.cityMarket(b)?.i);if(!m)continue;m.registeredCities.push(b);const p=provinceAt(b.cell);if(p){if(!m.provinceParticipants.has(p.i))m.provinceParticipants.set(p.i,{province:p,cities:[]});m.provinceParticipants.get(p.i).cities.push(b);}}
 const bind=(key,state,market)=>{if(!marketInfo.has(market))return;accountMarket.set(key,market);accountState.set(key,state);marketInfo.get(market).accounts.push(key);};
 for(const b of towns){const id=c.markets.cityMarket(b)?.i;if(!marketInfo.has(id))continue;bind('city:'+b.i,b.state,id);marketInfo.get(id).cities.push(b);}
 const ruralNodes=economicNodes(D,c.model.data,c.model,provinces,provinceAt);
 for(const n of ruralNodes.values())if(n.province){bind(n.id,n.state,n.market);const m=marketInfo.get(n.market);if(m&&!m.provinces.some(p=>p.i===n.province.i))m.provinces.push(n.province);if(m&&!m.provinceParticipants.has(n.province.i))m.provinceParticipants.set(n.province.i,{province:n.province,cities:[]});}
 for(const p of provinces){const r=c.provReports.get(p.i);
  const rows=new Map();for(const id of [...[...ruralNodes.values()].filter(n=>n.province?.i===p.i).map(n=>n.id),...(r?.cities||[]).map(b=>'city:'+b.i)])for(const [g,n]of Object.entries(c.state.last?.production[id]||{}))sum(rows,+g,n);
  const candidates=new Map(rows),foodNeed=(r?.cities||[]).reduce((n,b)=>n+economicPopulation(b),0)/1000*c.model.edits.foodPer1000*c.model.edits.cycleDays/30,foodOutput=[...rows].reduce((n,[g,q])=>n+q*(c.model.goods.get(g)?.demandCoverage?.food||0),0),surplus=foodOutput?Math.max(0,1-foodNeed/foodOutput):0;
  if(goodsBasis==='specialization')for(const [g,q]of rows)if(c.model.goods.get(g)?.demandCoverage?.food)candidates.set(g,q*surplus);
  // Subsistence is discounted only in this thematic view; production and food remain unchanged.
  if(![...candidates.values()].some(n=>n>1e-8))for(const [g,n]of rows)candidates.set(g,n);
  const dominant=[...candidates].filter(([g,n])=>n>1e-8).sort((a,b)=>b[1]*c.model.price(b[0])-a[1]*c.model.price(a[0])||a[0]-b[0])[0],g=dominant?.[0]||0;
  provinceGoods.set(p.i,{province:p,good:g,units:dominant?.[1]||0,value:dominant?(dominant[1]*c.model.price(g)):0,production:rows,commercialProduction:candidates,goodsBasis,color:goodColor(g),point:p.labelPoint});
 }
 const seeds=towns.map(b=>({x:b.x,y:b.y,market:accountMarket.get('city:'+b.i),id:b.i}));
 const centers=new Map();for(const cell of D.cells){if(cell.h<20||cell.state===17)continue;let nearest=null,best=Infinity;for(const seed of seeds){const d=(cell.p[0]-seed.x)**2+(cell.p[1]-seed.y)**2;if(d<best||d===best&&seed.id<nearest.id){nearest=seed;best=d;}}marketField[cell.i]=nearest?.market||0;const p=provinceAt(cell.i);if(p){const r=provinceGoods.get(p.i);goodsField[cell.i]=r?.good||0;let center=centers.get(p.i);if(!center)centers.set(p.i,center={x:0,y:0,n:0,cells:[]});center.x+=cell.p[0];center.y+=cell.p[1];center.n++;center.cells.push(cell);}}
 applyMarketTerritories(D,marketField,c.markets.territories,new Set(marketInfo.keys()),provinceAt);
 for(const b of towns)marketField[b.cell]=accountMarket.get('city:'+b.i)||0;
 for(const [id,center]of centers){const x=center.x/center.n,y=center.y/center.n,cell=center.cells.reduce((best,c)=>(c.p[0]-x)**2+(c.p[1]-y)**2<(best.p[0]-x)**2+(best.p[1]-y)**2?c:best);provinceGoods.get(id).point=cell.p;}
 for(const [account,market]of accountMarket){const m=marketInfo.get(market),sid=accountState.get(account);if(!m.states.has(sid))m.states.set(sid,{id:sid,cities:m.cities.filter(b=>b.state===sid).length,value:0});const state=m.states.get(sid);
  for(const [g,n]of Object.entries(c.state.last?.production[account]||{})){sum(m.production,+g,n);m.baseValue+=n*c.model.price(+g);m.localValue+=n*c.markets.price(m.center,+g);state.value+=n*c.model.price(+g);}
  for(const [g,n]of Object.entries(c.state.accounts[account]?.stock||{}))sum(m.stock,+g,n);
 }
 for(const t of c.state.last?.trades||[]){const from=accountMarket.get(t.from),to=accountMarket.get(t.to);if(!from||!to)continue;if(from===to){marketInfo.get(from).internal+=t.coins/100;continue;}marketInfo.get(from).outgoing+=t.coins/100;marketInfo.get(to).incoming+=t.coins/100;const key=from+':'+to;if(!links.has(key))links.set(key,{key,from,to,coins:0,trades:0,goods:new Map(),routes:new Set()});const link=links.get(key);link.coins+=t.coins;link.trades++;sum(link.goods,t.good,t.units);for(const r of t.routes||[])link.routes.add(r);}
 const goods=new Map();for(const r of provinceGoods.values())if(r.good){if(!goods.has(r.good))goods.set(r.good,{good:r.good,provinces:0,value:0});const row=goods.get(r.good);row.provinces++;row.value+=r.value;}
 return {marketField,goodsField,marketInfo,provinceGoods,accountMarket,links,goods,model:c.model};
}
