import {incomeReport} from './economy-income.js?v=43.1';
// Class spending envelopes are references, not new coins deposited into accounts.
export const LUXURY_SHARES={peasant:0,modest:.02,comfortable:.15,wealthy:.35,aristocratic:.5};
const baskets={peasant:[],modest:[[13,4],[39,3],[38,3]],comfortable:[[13,3],[39,2],[51,3],[47,1],[27,1]],wealthy:[[63,3],[26,2],[27,2],[51,1],[71,1],[13,1]],aristocratic:[[63,3],[26,2],[25,1],[71,1],[3,1],[36,1],[13,1]]};
export function consumptionPlan(city,days=30){
 const income=incomeReport(city),scale=days/30,classes=income.rows.map(r=>({id:r.id,name:r.name,residents:r.residents,cash:r.cash*scale,basicBudget:r.basicCash*scale,disposable:r.disposable*scale,luxuryBudget:r.disposable*scale*LUXURY_SHARES[r.id],basket:baskets[r.id]}));
 return {classes,luxuryBudget:classes.reduce((n,r)=>n+r.luxuryBudget,0),basicBudget:classes.reduce((n,r)=>n+r.basicBudget,0)};
}
export function luxuryDemand(city,data,days=30){const rows=new Map(),plan=consumptionPlan(city,days);for(const r of plan.classes){if(r.luxuryBudget<=0)continue;const basket=r.basket.filter(([id])=>data.goods.some(g=>g.i===id&&!g.inactive)),total=basket.reduce((n,[,w])=>n+w,0);for(const [id,w]of basket){const g=data.goods.find(g=>g.i===id);if(g.price>0)rows.set(id,(rows.get(id)||0)+r.luxuryBudget*w/total/g.price);}}return rows;}
