import {economicNodes} from './economy-rural.js?v=43.1';
import {populationDescription} from './economy-society.js?v=43.1';
import {tradeGraph} from './economy-trade.js?v=43.1';
import {tradeQuote,quotedUnitCost} from './economy-policy.js?v=43.1';
export const priceDifference=(price,reference)=>reference>0?(price/reference-1)*100:price===0&&reference===0?0:null;
// Each market gets equal weight. Neighbours are the three closest other centres.
// Freight uses accessible supplier/destination pairs, not the local price twice.
export function compareMarketPrice({market,goodId,markets,basePrice,offers=[]}){
 const local=markets.price(market.center,goodId),regions=markets.regions,average=rows=>rows.length?rows.reduce((sum,m)=>sum+markets.price(m.center,goodId),0)/rows.length:null;
 const neighbours=regions.filter(m=>m.i!==market.i).sort((a,b)=>Math.hypot(a.center.x-market.center.x,a.center.y-market.center.y)-Math.hypot(b.center.x-market.center.x,b.center.y-market.center.y)||a.i-b.i).slice(0,3),globalMean=average(regions),nearMean=average(neighbours),valid=offers.filter(o=>Number.isFinite(o.origin)&&o.origin>=0&&Number.isFinite(o.freight)&&o.freight>=0);
 const freightMean=valid.length?valid.reduce((sum,o)=>sum+o.freight,0)/valid.length:null,originMean=valid.length?valid.reduce((sum,o)=>sum+o.origin,0)/valid.length:null,tariffMean=valid.length?valid.reduce((sum,o)=>sum+(o.tariff||0),0)/valid.length:null,riskMean=valid.length?valid.reduce((sum,o)=>sum+(o.risk||0),0)/valid.length:null;
 return {local,base:basePrice,globalMean,nearMean,neighbours,vsBase:priceDifference(local,basePrice),vsGlobal:globalMean===null?null:priceDifference(local,globalMean),vsNear:nearMean===null?null:priceDifference(local,nearMean),supplierCount:new Set(valid.map((o,i)=>o.supplier??i)).size,offerCount:valid.length,freightMean,originMean,tariffMean,riskMean,deliveredMean:valid.length?valid.reduce((sum,o)=>sum+(o.delivered??o.origin+o.freight+(o.tariff||0)),0)/valid.length:null};
}
export function createMarketComparisons(D,c,thematic,provinces){
 const nodes=economicNodes(D,c.model.data,c.model,provinces,c.provinceAt||(()=>null));for(const n of nodes.values())n.city??=n.cityReference;
  const {paths,waterPaths}=tradeGraph(D,nodes,c.edits),cache=new Map();
 return (market,goodId)=>{const key=market.i+':'+goodId;if(cache.has(key))return cache.get(key);const offers=[],buyers=D.cities.filter(b=>nodes.has('city:'+b.i)&&thematic.accountMarket.get('city:'+b.i)===market.i);
  for(const [id,rows]of Object.entries(c.state.last?.production||{})){if(!(rows[goodId]>1e-8)||thematic.accountMarket.get(id)===market.i)continue;const seller=nodes.get(id);if(!seller?.city)continue;const cost=quotedUnitCost(c.model,c.markets,seller.city,goodId,c.state.accounts?.[id]);for(const buyer of buyers){const path=(c.model.goods?.get(goodId)?.transport?waterPaths:paths).get('city:'+buyer.i)?.get(id),quote=tradeQuote(D,c.edits,{sellerState:seller.state,buyerState:buyer.state,good:goodId,price:c.markets.price(seller.city,goodId),cost,path});if(quote)offers.push({supplier:id,buyer:buyer.i,...quote});}}
  const report=compareMarketPrice({market,goodId,markets:c.markets,basePrice:c.model.price(goodId),offers});cache.set(key,report);return report;
 };
}
