import {economicNodes} from './economy-rural.js?v=43.1';
import {tradeQuote} from './economy-policy.js?v=43.1';
export function marketScarcity(D,data,model,regions,cityMarket,rawPrice,{provinces=[],provinceAt,state,nodes,graph}={}){
 nodes??=economicNodes(D,data,model,provinces,provinceAt);const grouped=new Map(),factors={},details={},byState={};
 const add=(m,g,n)=>m.set(g,(m.get(g)||0)+n),nodeMarket=n=>n.market||cityMarket(n.city||n.cityReference)?.i;
 for(const n of nodes.values()){const market=nodeMarket(n);if(!market)continue;const key=market+':'+n.state;if(!grouped.has(key))grouped.set(key,{market,state:n.state,members:[],population:0});grouped.get(key).members.push(n);grouped.get(key).population+=n.population;}
 for(const scope of grouped.values()){
  const market=regions.find(m=>m.i===scope.market),buyer=scope.members.find(n=>n.city)||scope.members[0],supply=new Map(),demand=new Map();
  for(const seller of nodes.values()){if(nodeMarket(seller)!==scope.market)continue;const path=graph?.paths.get(buyer.id)?.get(seller.id);if(graph&&!path)continue;const rows=state?.last?.production[seller.id]||Object.fromEntries(seller.report.production),stock=state?.accounts?.[seller.id]?.stock||{};
   for(const g of data.goods){if(!tradeQuote(D,model.edits,{sellerState:seller.state,buyerState:buyer.state,good:g.i,price:rawPrice(seller.city||seller.cityReference,g.i),path:path||{freight:0,risk:0}}))continue;const n=(rows[g.i]||0)*(state?.last?model.edits.cycleDays/(state.last.periodDays||30):1)+(stock[g.i]||0);add(supply,g.i,n);}
  }
  for(const n of scope.members)for(const [g,units]of n.report.inputs)add(demand,g,units);
  const available=new Map(supply);for(const [g,n]of demand)available.set(g,Math.max(0,(available.get(g)||0)-n));const s=scope.population/1000*model.edits.cycleDays/30;
  for(const [category,total]of Object.entries({food:s*model.edits.foodPer1000,utilities:s*.1,construction:s*.04,military:s*.035,luxury:s*.03,research:s*.002})){
   let left=total;const options=data.goods.filter(g=>(g.demandCoverage?.[category]||0)>0).sort((a,b)=>rawPrice(market.center,a.i)/a.demandCoverage[category]-rawPrice(market.center,b.i)/b.demandCoverage[category]);for(const g of options){const cover=g.demandCoverage[category],units=Math.min(available.get(g.i)||0,left/cover);add(demand,g.i,units);available.set(g.i,Math.max(0,(available.get(g.i)||0)-units));left-=units*cover;if(left<1e-8)break;}if(left>1e-8&&options.length)add(demand,options[0].i,left/options[0].demandCoverage[category]);
  }
  byState[scope.state]??={};byState[scope.state][scope.market]={};const records={};
  for(const g of data.goods){const have=supply.get(g.i)||0,want=demand.get(g.i)||0,buffer=Math.max(1,want*.25),ratio=(want+buffer)/(have+buffer),factor=have||want?Math.max(.65,Math.min(2.5,1+(model.edits.scarcityStrength??.65)*(ratio-1))):1;byState[scope.state][scope.market][g.i]=factor;records[g.i]={supply:have,demand:want,factor};}
  if(!factors[scope.market]||market.center.state===scope.state){factors[scope.market]=byState[scope.state][scope.market];details[scope.market]=records;}
 }
 return {factors,details,byState};
}
