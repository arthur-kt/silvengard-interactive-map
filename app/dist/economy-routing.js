import {routeReport} from './route-info.js?v=40';
import {piracyField} from './economy-policy.js?v=43.1';
// Endpoint-aware graph: a nearby harbour is not a compulsory call on a trunk.
export function routeGraph(D,nodes,edits,atWar){
 const graph=new Map([...nodes.keys()].map(id=>[id,[]])),reports=new Map(),piracy=piracyField(D,edits);
 function edge(a,b,row){if(!graph.has(a)||!graph.has(b)||a===b)return;graph.get(a).push({to:b,...row});graph.get(b).push({to:a,...row});}
 for(const n of nodes.values())if(n.province&&n.hub){const hub=D.cities.find(b=>'city:'+b.i===n.hub),km=n.connection?.km??(hub&&n.cityReference?Math.hypot(hub.x-n.cityReference.x,hub.y-n.cityReference.y)*D.settings.distanceScale:0);edge(n.id,n.hub,{km,hours:km/4.5,roadKm:km,seaKm:0,route:null,risk:0,states:n.connection?.states||[n.state]});}
 const cellAt=p=>D.grid?D.cells[Math.min(D.grid.rows-1,Math.max(0,Math.floor(p[1]/D.grid.stepY)))*D.grid.columns+Math.min(D.grid.columns-1,Math.max(0,Math.floor(p[0]/D.grid.stepX)))]:null;
 for(const r of D.routes){if(r.enabled===false||r.tradeUse===false)continue;const report=routeReport(D,r);reports.set(r.id,report);const stops=report.stops.filter(s=>nodes.has('city:'+s.id));
  for(let i=0;i<stops.length-1;i++)for(let j=i+1;j<stops.length;j++){
   if(r.kind!=='sea'&&j!==i+1)continue;const a=stops[i],b=stops[j],km=Math.max(0,b.along-a.along),hours=Math.max(0,b.atTime-a.atTime),seaKm=r.kind==='sea'?km:r.kind==='road'?0:Math.max(0,Math.min(km,(km/report.landSpeed-hours)/(1/report.landSpeed-1/report.shipSpeed)||0)),roadKm=km-seaKm;
   const states=new Set([nodes.get('city:'+a.id).state,nodes.get('city:'+b.id).state]);let risk=0,along=0;
   for(let k=1;k<r.points.length;k++){const p=r.points[k],prev=r.points[k-1],length=Math.hypot(p[0]-prev[0],p[1]-prev[1])*D.settings.distanceScale,end=along+length;if(end>=a.along&&along<=b.along){const steps=Math.max(1,Math.ceil(length/6));for(let t=0;t<steps;t++){const cell=cellAt([prev[0]+(p[0]-prev[0])*(t+.5)/steps,prev[1]+(p[1]-prev[1])*(t+.5)/steps]);if(cell?.h<20)risk=Math.max(risk,piracy[cell.i]||0);else if(r.kind!=='sea')states.add(cell?.state);}}along=end;}
   if(roadKm>0&&states.has(28))risk=1-(1-risk)*.975;
   if(seaKm>0&&(edits.navalBlockades||[]).some(block=>block.state===nodes.get('city:'+a.id).state||block.state===nodes.get('city:'+b.id).state))continue;
   if(edits.convoys&&seaKm>0)risk*=.65;
   edge('city:'+a.id,'city:'+b.id,{km,hours,roadKm,seaKm,risk,route:r.id,states:[...states].filter(s=>s!=null)});
  }
 }
 function paths(waterOnly){const result=new Map();for(const buyer of nodes.values()){
  const best=new Map([[buyer.id,{km:0,hours:0,travelDays:0,roadKm:0,seaKm:0,freight:0,risk:0,score:0,routes:[]}]]),pending=new Set([buyer.id]);
  while(pending.size){let a=null;for(const id of pending)if(a===null||best.get(id).score<best.get(a).score||best.get(id).score===best.get(a).score&&best.get(id).hours<best.get(a).hours)a=id;pending.delete(a);
   for(const e of graph.get(a)||[]){if(waterOnly&&e.roadKm>1e-8||e.states.some(s=>s===0||s===17||atWar(D,edits,buyer.state,s)))continue;const old=best.get(a),value={km:old.km+e.km,hours:old.hours+e.hours,travelDays:old.travelDays+e.roadKm/4.5/8+e.seaKm/(D.settings.shipSpeed||11)/24,roadKm:old.roadKm+e.roadKm,seaKm:old.seaKm+e.seaKm,freight:old.freight+e.roadKm*edits.landFreight+e.seaKm*edits.seaFreight*(edits.convoys?1.1:1),risk:1-(1-old.risk)*(1-(e.risk||0)),routes:e.route?[...old.routes,e.route]:old.routes};value.score=(1+value.freight)/(1-value.risk)-1;const prev=best.get(e.to);if(!prev||value.score<prev.score-1e-12||Math.abs(value.score-prev.score)<1e-12&&value.hours<prev.hours){best.set(e.to,value);pending.add(e.to);}}
  }result.set(buyer.id,best);
 }return result;}
 return {paths:paths(false),waterPaths:paths(true),reports};
}
