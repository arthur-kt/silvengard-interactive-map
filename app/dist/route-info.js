import {routePieces} from './hybrid-core.js?v=24';
// Distances and time follow the geometry; hybrid legs use their own speeds.
export function routeReport(D,route,{scale=D.settings.distanceScale,pace='normal',hours=8,shipSpeed=D.settings.shipSpeed??11}={}){
 const points=route.points||[],cumulative=[0],times=[0],kinds=routePieces(route).flatMap(p=>Array(Math.max(0,p.points.length-1)).fill(p.kind)),landSpeed=({fast:6,normal:4.5,slow:3}[pace]||4.5);let roadKm=0,seaKm=0;
 for(let i=1;i<points.length;i++){const distance=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]),water=kinds[i-1]==='sea';cumulative.push(cumulative.at(-1)+distance);times.push(times.at(-1)+distance*scale/(water?shipSpeed:landSpeed));if(water)seaKm+=distance*scale;else roadKm+=distance*scale;}
 const sea=route.kind==='sea',stops=[];
 for(const b of D.cities){
  if(!b.visible||b.excluded||sea&&!b.harbor)continue;
  const positions=route.kind==='mixed'?[[b.x,b.y],...(b.harbor?[b.harbor.waterPoint]:[])]:[sea?b.harbor.waterPoint:[b.x,b.y]];let distance=Infinity,along=0,atTime=0;
  for(const pos of positions){
  for(let i=1;i<points.length;i++){
   const a=points[i-1],z=points[i],dx=z[0]-a[0],dy=z[1]-a[1],den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((pos[0]-a[0])*dx+(pos[1]-a[1])*dy)/den)):0;
   const d=Math.hypot(pos[0]-a[0]-t*dx,pos[1]-a[1]-t*dy);
   if(d<distance){distance=d;along=cumulative[i-1]+Math.sqrt(den)*t;atTime=times[i-1]+(times[i]-times[i-1])*t;}
  }
  }
  if(distance<=6.01&&(route.stopMode!=='explicit'||(route.stops||[]).includes(b.i)||route.fromCity===b.i||route.toCity===b.i))stops.push({id:b.i,name:b.name,along:along*scale,offset:distance*scale,atTime});
 }
 stops.sort((a,b)=>a.along-b.along||a.id-b.id);
 for(let i=0;i<stops.length;i++){stops[i].legKm=i?stops[i].along-stops[i-1].along:0;stops[i].legHours=i?stops[i].atTime-stops[i-1].atTime:0;}
 const km=(cumulative.at(-1)||0)*scale,moving=times.at(-1)||0,speed=route.kind==='mixed'?(moving?km/moving:landSpeed):sea?shipSpeed:landSpeed,legs=stops.slice(1);
 return {km,moving,speed,landSpeed,shipSpeed,roadKm,seaKm,hours,days:moving?Math.ceil((moving-1e-9)/hours):0,stops,
  averageLegKm:legs.length?legs.reduce((s,p)=>s+p.legKm,0)/legs.length:null,
  averageLegHours:legs.length?legs.reduce((s,p)=>s+p.legHours,0)/legs.length:null};
}
