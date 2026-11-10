import {buildNetworkIndex} from './network-core.js?v=40';
export const SEA_PACES={slow:{speed:6,label:'Lento'},normal:{speed:11,label:'Médio'},fast:{speed:20,label:'Rápido'}};
export const PACES={fast:{speed:6,label:'Rápido',effect:'−5 na Percepção Passiva'},normal:{speed:4.5,label:'Normal',effect:'Sem modificadores'},slow:{speed:3,label:'Lento',effect:'Permite Furtividade'}};
const num=(v,d,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):d;
export function options(o={}){return {pace:PACES[o.pace]?o.pace:'normal',mode:['foot','mount','vehicle'].includes(o.mode)?o.mode:'foot',hours:num(o.hours,8,1,24),scale:num(o.scale,1.5,.001,10000),terrain:['auto','easy','difficult'].includes(o.terrain)?o.terrain:'auto',gallop:!!o.gallop,rest:num(o.rest,8,0,24),fresh:!!o.fresh,load:num(o.load,0,0,1e8),capacity:num(o.capacity,0,0,1e8),shipSpeed:num(o.shipSpeed,11,.1,100)}};
export const difficult=c=>!!c&&(c.h>=50||c.biome===12||((c.vegetation&&c.vegetation!=='auto'?!['none','acacia'].includes(c.vegetation):[6,8,9,13].includes(c.biome))&&(c.woodland??1)>=.65));
export function simulate(segments,input={}){
 const o=options(input),distance=segments.reduce((s,a)=>s+a.km,0),activities=segments.map(a=>({effort:a.km*((a.road||a.sea)?1:o.terrain==='difficult'||o.terrain==='auto'&&a.difficult?2:1),sea:!!a.sea}));
 const effort=activities.reduce((s,a)=>s+a.effort,0);if(!Number.isFinite(effort)||effort<0)throw Error('Distância inválida');
 const warnings=[],blocked=o.mode==='vehicle'&&o.load>5*o.capacity;if(blocked)warnings.push('Carga excede 5 × a capacidade normal dos animais de tração.');const pace=o.mode==='vehicle'?'normal':o.pace,speed=PACES[pace].speed,days=[];if(effort/(Math.max(12,o.shipSpeed)*o.hours)>10000)throw Error('Viagem muito longa: reveja a escala.');
 let index=0,movingTotal=0,restTotal=0,seaMoving=0;while(index<activities.length&&activities[index].effort<1e-8)index++;
 for(let day=1;index<activities.length;day++){
  if(day>100000)throw Error('Viagem muito longa: reveja a escala.');let budget=o.hours,moving=0,landHours=0,rest=0,galloped=0;
  while(budget>1e-8&&index<activities.length){const a=activities[index],gallop=!a.sea&&o.mode==='mount'&&o.gallop&&galloped<1-1e-8,velocity=a.sea?o.shipSpeed:gallop?12:speed,t=Math.min(budget,a.effort/velocity,gallop?1-galloped:Infinity);a.effort-=t*velocity;budget-=t;moving+=t;if(a.sea)seaMoving+=t;else landHours+=t;if(gallop)galloped+=t;if(a.effort<1e-8)index++;while(index<activities.length&&activities[index].effort<1e-8)index++;if(gallop&&galloped>=1-1e-8&&index<activities.length)rest=o.rest;}
  const saves=Array.from({length:Math.max(0,Math.floor(landHours+1e-8)-8)},(_,i)=>({hour:9+i,dc:11+i}));days.push({day,moving,landHours,rest,galloped,saves});movingTotal+=moving;restTotal+=rest;
 }
 if(o.mode==='mount'&&days.some(d=>d.landHours>8)&&!o.fresh)warnings.push('Use montarias frescas para sustentar dias mais longos.');if(o.mode==='mount'&&o.fresh&&days.some(d=>d.landHours>8))warnings.push('Trocas não dispensam a marcha forçada dos personagens nos trechos terrestres.');
 return {distance,effort,moving:movingTotal,rest:restTotal,days,elapsed:days.length?days.slice(0,-1).reduce((s,d)=>s+Math.max(24,d.moving+d.rest),0)+days.at(-1).moving+days.at(-1).rest:0,blocked,warnings,effect:PACES[pace].effect,speed,seaDistance:segments.filter(s=>s.sea).reduce((v,s)=>v+s.km,0),seaMoving,shipSpeed:o.shipSpeed};
}
// A* uses the cell graph, not straight lines through bays or lakes.
class Heap{a=[];push(x){let i=this.a.length;this.a.push(x);while(i){let p=(i-1)>>1;if(this.a[p][0]<=x[0])break;this.a[i]=this.a[p];i=p;}this.a[i]=x;}pop(){const first=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(2*i+1<this.a.length){let j=2*i+1;if(j+1<this.a.length&&this.a[j+1][0]<this.a[j][0])j++;if(last[0]<=this.a[j][0])break;this.a[i]=this.a[j];i=j;}this.a[i]=last;}return first;}get length(){return this.a.length;}}
export function createRouter(D){
 const g=D.grid;let reference=null,network=null;const index=()=>{if(!network||reference!==D.routes){reference=D.routes;network=buildNetworkIndex(D);}return network;},nearest=p=>index().nearest(p);
 function path(a,b,terrain='auto',kind='journey'){if(kind==='mixed')kind='journey';
  const net=index(),start=nearest(a),end=nearest(b),pass=c=>kind==='road'?c.h>=20:kind==='sea'?c.h<20:c.h>=20||!!net.sea[c.i];
  if(!pass(start)||!pass(end))throw Error(kind==='sea'?'Marque os pontos marítimos na água.':'Escolha terra, um porto ou uma rota marítima cadastrada.');if(start.i===end.i)return [a,b];
  const cost=new Float64Array(D.cells.length).fill(Infinity),parent=new Int32Array(D.cells.length).fill(-1),heap=new Heap();cost[start.i]=0;const heuristic=c=>Math.hypot(c.p[0]-end.p[0],c.p[1]-end.p[1]);heap.push([heuristic(start),start.i,0]);let found=false;
  while(heap.length){const [,id,old]=heap.pop();if(old!==cost[id])continue;if(id===end.i){found=true;break;}const c=D.cells[id],x=id%g.columns,y=Math.floor(id/g.columns),edges=[];
   for(const dx of [-1,0,1])for(const dy of [-1,0,1]){if(!(dx||dy)||x+dx<0||x+dx>=g.columns||y+dy<0||y+dy>=g.rows)continue;const n=id+dx+dy*g.columns,v=D.cells[n];if(!pass(v)||(c.h<20)!==(v.h<20))continue;if(dx&&dy&&((D.cells[id+dx].h<20)!==(c.h<20)||(D.cells[id+dy*g.columns].h<20)!==(c.h<20)))continue;edges.push({id:n,distance:Math.hypot(dx*g.stepX,dy*g.stepY)});}
   if(kind==='journey')edges.push(...(net.portEdges.get(id)||[]));for(const edge of edges){const v=D.cells[edge.id],normal=kind!=='journey'||net.road[edge.id]||v.h<20||c.h<20,newCost=old+edge.distance*(!normal&&terrain==='auto'&&difficult(v)?2:1);if(newCost<cost[edge.id]){cost[edge.id]=newCost;parent[edge.id]=id;heap.push([newCost+heuristic(v),edge.id,newCost]);}}
  }
  if(!found)throw Error('Não há caminho neste traçado. Cadastre uma rota marítima entre os portos para atravessar o mar.');const ids=[end.i];while(ids.at(-1)!==start.i){const n=parent[ids.at(-1)];if(n<0)throw Error('Caminho incompleto');ids.push(n);}ids.reverse();return [a,...ids.map(i=>D.cells[i].p),b];
 }
 function route(waypoints,scale=1.5,terrain='auto'){
  if(waypoints.length<2)return {points:waypoints.map(p=>p.xy),segments:[]};const points=[],segments=[],net=index();for(let i=1;i<waypoints.length;i++){const leg=path(waypoints[i-1].xy,waypoints[i].xy,terrain);points.push(...(i===1?leg:leg.slice(1)));if(points.length>15000)throw Error('Divida a rota em trechos menores.');}
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],ca=nearest(a),cb=nearest(b),length=Math.hypot(a[0]-b[0],a[1]-b[1]),boarding=(net.portEdges.get(ca.i)||[]).some(e=>e.id===cb.i),steps=Math.max(1,Math.ceil(length/Math.min(g.stepX,g.stepY)*2));if(length<1e-8)continue;
   for(let j=0;j<steps;j++){const t=(j+.5)/steps,c=nearest([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]),sea=boarding||c.h<20,road=!sea&&!!net.road[c.i];if(c.h<20&&!boarding&&!net.sea[c.i]&&!(ca.h<20&&cb.h<20&&net.sea[ca.i]&&net.sea[cb.i]))throw Error('O trecho sai das rotas marítimas cadastradas.');segments.push({km:length/steps*scale,sea,road,difficult:!sea&&!road&&difficult(c)});}}
  return {points,segments};
 }
 function trace(controls,kind){const out=[];for(let i=1;i<controls.length;i++){const leg=path(controls[i-1],controls[i],'easy',kind);out.push(...(i===1?leg:leg.slice(1)));if(out.length>15000)throw Error('Divida este traçado em rotas menores.');}return out;}
 return {route,nearest,trace,isSeaPoint:p=>!!index().sea[nearest(p).i]};
}
export function cleanJourneys(raw){
 if(!raw||!Array.isArray(raw.parties)||raw.parties.length>50)throw Error('Arquivo de jornadas inválido');
 const text=(x,n=100)=>String(x??'').slice(0,n),pos=p=>{if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<0||p[0]>1920||p[1]<0||p[1]>937)throw Error('Posição inválida');return [...p];},waypoints=xs=>{if(!Array.isArray(xs)||xs.length>200)throw Error('Rota inválida');return xs.map(p=>({xy:pos(p.xy),label:text(p.label)}));};
 const ids=new Set();const parties=raw.parties.map((p,i)=>{const id=text(p.id)||'party-'+i;if(ids.has(id))throw Error('Grupos duplicados');ids.add(id);return {id,name:text(p.name)||'Grupo',players:text(p.players,1000),location:p.location?{xy:pos(p.location.xy),label:text(p.location.label)}:null,waypoints:waypoints(p.waypoints||[]),settings:options(p.settings),history:(p.history||[]).slice(-100).map(h=>{if(!Array.isArray(h.points)||h.points.length>15000)throw Error('Histórico inválido');return {name:text(h.name),date:text(h.date),points:h.points.map(pos),distance:num(h.distance,0,0,1e9),moving:num(h.moving,0,0,1e9),elapsed:num(h.elapsed,0,0,1e10),from:text(h.from),to:text(h.to)};}),plans:(p.plans||[]).slice(-50).map(r=>({name:text(r.name),waypoints:waypoints(r.waypoints),settings:options(r.settings)}))};});
 return {version:1,seaPaceVersion:Number.isInteger(raw.seaPaceVersion)?raw.seaPaceVersion:0,scaleVersion:Number.isInteger(raw.scaleVersion)?raw.scaleVersion:0,defaultScale:options({scale:raw.defaultScale}).scale,active:parties.some(p=>p.id===raw.active)?raw.active:parties[0]?.id||null,parties};
}

// Update the old default only in active party settings; saved plans/history retain their values.
export function upgradeSeaPace(data){if(data.seaPaceVersion===17)return data;for(const p of data.parties||[])if(p.settings.shipSpeed===4.5)p.settings.shipSpeed=11;data.seaPaceVersion=17;return data;}
