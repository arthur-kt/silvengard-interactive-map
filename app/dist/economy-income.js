import {forcedLaborPeople} from './economy-labor.js?v=43.1';
import {economicPopulation} from './economy-society.js?v=43.1';
export const SOCIAL_CLASSES=[
 {id:'peasant',name:'Camponeses e trabalhadores comuns',lifestyle:6,incomeFactor:1.01,cashShare:.10},
 {id:'modest',name:'Modesto',lifestyle:30,incomeFactor:1.2,cashShare:.5},
 {id:'comfortable',name:'Classe média · confortável',lifestyle:60,incomeFactor:1.3,cashShare:.8},
 {id:'wealthy',name:'Ricos',lifestyle:120,incomeFactor:1.5,cashShare:.9},
 {id:'aristocratic',name:'Aristocracia e elite dirigente',lifestyle:300,incomeFactor:2,cashShare:.95}
];
export function cleanSocialProfile(raw){
 if(!raw||typeof raw!=='object'||!raw.shares)throw Error('Composição social inválida.');
 const shares={};for(const c of SOCIAL_CLASSES){const n=raw.shares[c.id];if(!Number.isFinite(n)||n<0||n>100)throw Error('Percentual social inválido.');shares[c.id]=Math.round(n*100)/100;}
 if(Math.abs(Object.values(shares).reduce((s,n)=>s+n,0)-100)>.011)throw Error('Os cinco percentuais sociais precisam somar 100%.');
 const householdSize=raw.householdSize??3;if(!Number.isFinite(householdSize)||householdSize<1||householdSize>12)throw Error('Pessoas por unidade familiar: use um valor entre 1 e 12.');
 return {shares,householdSize,estimated:raw.estimated!==false};
}
export function defaultSocialProfile(b){
 let v=[88,8,3,.9,.1];
 if(b.capital)v=[78,13,7,1.8,.2];
 else if(b.majorPort)v=[80,12,6,1.8,.2];
 else if(b.magicSchool)v=[70,18,10,1.8,.2];
 else if(b.dwarvenFortress||b.state===23||b.state===35)v=[76,15,7,1.8,.2];
 if(b.state===34)v=[93,5,1.7,.25,.05];
 if(b.state===29)v=[93,5,1.7,.25,.05];
 if(b.i===214)v=[76,15,7,1.8,.2];
 if([1244,4,89].includes(b.i))v=[93,5,1.7,.25,.05];
 if([1239,1240,197].includes(b.i))v=[71,18,8,2.4,.6];
 if(b.i===21)v=[65,19,11,4.2,.8];
 if(b.i===2001)v=[70,20,8,1.8,.2];
 return {shares:Object.fromEntries(SOCIAL_CLASSES.map((c,i)=>[c.id,v[i]])),householdSize:3,estimated:true};
}
export function incomeReport(b){
 const profile=cleanSocialProfile(b.socialProfile||defaultSocialProfile(b)),population=economicPopulation(b),rows=SOCIAL_CLASSES.map(c=>{
  const residents=population*profile.shares[c.id]/100,unfree=c.id==='peasant'?Math.min(residents,forcedLaborPeople(b)):0,units=(residents-unfree)/profile.householdSize,lifestyleCost=units*c.lifestyle,gross=lifestyleCost*c.incomeFactor,cash=gross*c.cashShare,basicCash=lifestyleCost*c.cashShare;
  return {...c,share:profile.shares[c.id],residents,unfree,units,gross,lifestyleCost,cash,basicCash,nonCash:gross-cash,disposable:Math.max(0,cash-basicCash)};
 });
 const total=key=>rows.reduce((s,r)=>s+r[key],0);
 return {population,profile,rows,gross:total('gross'),cash:total('cash'),nonCash:total('nonCash'),basicCash:total('basicCash'),disposable:total('disposable'),lifestyleCost:total('lifestyleCost')};
}
export function aggregateIncome(cities){const reports=cities.map(incomeReport),sum=k=>reports.reduce((s,r)=>s+r[k],0);return {reports,population:sum('population'),gross:sum('gross'),cash:sum('cash'),nonCash:sum('nonCash'),basicCash:sum('basicCash'),disposable:sum('disposable')};}
