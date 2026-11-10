import fs from 'node:fs';
import {createRouter} from '../../app/dist/travel-core.js';
import {simplify,lengthOf} from '../../app/dist/network-core.js';
import {applyCityEdit} from '../../app/dist/city-editor-core.js';
import {routeReport} from '../../app/dist/route-info.js';
export function planEconomyRoutes(W,data){
 const D=structuredClone(W),towns=D.cities.filter(b=>b.state!==17&&b.demographics?.population>0),parent=new Map(towns.map(b=>[b.i,b.i])),added=[],cityEdits={};
 const root=i=>{let x=i;while(parent.get(x)!==x)x=parent.get(x);while(i!==x){const next=parent.get(i);parent.set(i,x);i=next;}return x;},join=(a,b)=>{if(parent.has(a)&&parent.has(b))parent.set(root(b),root(a));};
 for(const r of D.routes.filter(r=>r.enabled!==false)){const stops=routeReport(D,r).stops.filter(s=>parent.has(s.id));for(let i=1;i<stops.length;i++)join(stops[i-1].id,stops[i].id);}
 // Water and forbidden land are only masks in the router copy; terrain is never changed.
 const routing={...D,cells:D.cells.map(c=>c.state===17?{...c,h:10}:c)},router=createRouter(routing),landGroup=new Int32Array(D.cells.length).fill(-1),waterGroup=new Int32Array(D.cells.length).fill(-1);
 function components(mask,array){let group=0;for(const c of D.cells){if(array[c.i]>=0||!mask(c))continue;const q=[c.i];array[c.i]=group;for(let k=0;k<q.length;k++)for(const id of D.cells[q[k]].c)if(array[id]<0&&mask(D.cells[id])){array[id]=group;q.push(id);}group++;}}
 components(c=>c.h>=20&&c.state!==17,landGroup);components(c=>c.h<20,waterGroup);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),seaRouter=createRouter(D);
 // Prefer pairs in the same original market, without treating transactions as paths.
 const preference=(a,b)=>distance(a,b)*(data.cityMarkets[a.i]!=null&&data.cityMarkets[a.i]===data.cityMarkets[b.i]? .8:1);
 function road(a,b){const points=router.trace([[a.x,a.y],[b.x,b.y]],'road'),r={id:`economy-land-${Math.min(a.i,b.i)}-${Math.max(a.i,b.i)}`,name:`Ligação comercial · ${a.name} — ${b.name}`,kind:'road',majorRoute:false,enabled:true,points,controls:simplify(points,3),fromCity:a.i,toCity:b.i,stops:[a.i,b.i],stateIds:[...new Set(points.map(p=>router.nearest(p).state).filter(Boolean))]};added.push(r);join(a.i,b.i);}
 while(true){let best=null;for(let i=0;i<towns.length;i++)for(let j=i+1;j<towns.length;j++){const a=towns[i],b=towns[j];if(root(a.i)===root(b.i)||landGroup[a.cell]<0||landGroup[a.cell]!==landGroup[b.cell])continue;const s=preference(a,b);if(!best||s<best.score)best={a,b,score:s};}if(!best)break;road(best.a,best.b);}
 const waters=D.cells.filter(c=>c.h<20),ports=[];
 for(const b of towns){let water=b.harbor?D.cells[b.harbor.cell]:null,near=water?distance({x:water.p[0],y:water.p[1]},b):Infinity;
  if(!water)for(const c of waters){const d=Math.hypot(c.p[0]-b.x,c.p[1]-b.y);if(d<near){near=d;water=c;}}
  if(near<=32&&water)ports.push({b,water,near,existing:!!b.harbor,body:waterGroup[water.i]});
 }
 const failed=new Set();
 while(true){let best=null;for(let i=0;i<ports.length;i++)for(let j=i+1;j<ports.length;j++){const a=ports[i],b=ports[j],key=[a.b.i,b.b.i].sort((a,b)=>a-b).join('-');if(root(a.b.i)===root(b.b.i)||a.body!==b.body||failed.has(key))continue;const s=preference(a.b,b.b)+(a.existing?0:45)+(b.existing?0:45);if(!best||s<best.score)best={a,b,key,score:s};}if(!best)break;
  const {a,b,key}=best;let points;try{points=seaRouter.trace([a.water.p,b.water.p],'sea');}catch{failed.add(key);continue;}
  for(const port of [a,b])if(!port.b.harbor){applyCityEdit(port.b,{features:{port:true}},D);cityEdits[port.b.i]={features:{port:true}};port.existing=true;}
  const long=lengthOf(points)>130,r={id:'economy-sea-'+key,name:`${long?'Rota':'Ligação'} comercial marítima · ${a.b.name} — ${b.b.name}`,kind:'sea',majorRoute:long,enabled:true,points,controls:simplify(points,3),fromCity:a.b.i,toCity:b.b.i,stops:[a.b.i,b.b.i],stateIds:[...new Set([a.b.state,b.b.state])]};added.push(r);join(a.b.i,b.b.i);
 }
 return {edition:{format:'silvengard-atlas-v1',exportedAt:new Date().toISOString(),edits:{cities:cityEdits,states:{}},networkEdits:{format:'silvengard-network-v1',baseVersion:D.networkDefaults.version,routes:added,deleted:[]}},summary:{newRoads:added.filter(r=>r.kind==='road').length,newSeaLinks:added.filter(r=>r.kind==='sea').length,minorHarbors:Object.keys(cityEdits).length,inhabitedCities:towns.length,tradeComponents:new Set(towns.map(b=>root(b.i))).size}};
}
if(process.argv[2]==='--prepare'){const base=new URL('../',import.meta.url),W=JSON.parse(fs.readFileSync(new URL('dist/world.json',base))),data=JSON.parse(fs.readFileSync(new URL('dist/economy-source.json',base))),plan=planEconomyRoutes(W,data);fs.writeFileSync(new URL('backups/v28-economy-routes.json',base),JSON.stringify({baseId:W.savedDefaults.id,...plan}));console.log(JSON.stringify(plan.summary));}
