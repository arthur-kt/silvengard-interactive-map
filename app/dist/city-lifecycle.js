import {mixedParts,flattenParts} from './hybrid-core.js?v=24';
import {applyCityEdit,cleanCityEdit} from './city-editor-core.js?v=43.1';
import {createRouter} from './travel-core.js?v=24';
import {simplify} from './network-core.js?v=40';
import {routeReport} from './route-info.js?v=40';

export function newCity(D,id,raw){
 if(!Number.isSafeInteger(id)||id<10000||D.cities.some(b=>b.i===id))throw Error('Identificador de cidade inválido.');
 if(typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>100)throw Error('Informe um nome de até 100 caracteres.');
 if(!raw.position)throw Error('Escolha a localização da cidade.');
 const e=cleanCityEdit(raw,D),g=D.grid,c=D.cells[Math.floor(e.position[1]/g.stepY)*g.columns+Math.floor(e.position[0]/g.stepX)];
 if(D.cities.some(b=>Math.hypot(b.x-e.position[0],b.y-e.position[1])<4))throw Error('Escolha um ponto mais distante da outra cidade.');
 const culture=e.culture??D.states.find(s=>s.i===c.state)?.culture??0;
 const b={i:id,name:raw.name.trim(),notes:String(raw.notes||'').slice(0,20000),visible:true,excluded:false,capital:false,x:e.position[0],y:e.position[1],cell:c.i,state:c.state,culture,settlementClass:'Cidade',population:0,demographics:{population:0},faith:{...D.religions.find(r=>r.i===0)},originalFeatures:{},port:false,majorPort:false,citadel:false,walls:false,temple:false,plaza:false,shanty:false,magicSchool:false,dwarvenFortress:false};
 return applyCityEdit(b,{inhabitants:0,...e},D);
}
export function connectNewCity(D,b){
 const router=createRouter(D),near=D.cities.filter(c=>c.i!==b.i).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y)).slice(0,4);
 for(const c of near){try{const points=router.trace([[b.x,b.y],[c.x,c.y]],'road');return {id:'city-link-'+b.i,kind:'road',group:'roads',name:'Caminho local · '+b.name+' → '+c.name,majorRoute:false,enabled:true,fromCity:b.i,toCity:c.i,stateIds:[...new Set([b.state,c.state])],points,controls:simplify(points,4)};}catch{}}
 return null;
}
function clipPath(points,start,end){
 const out=[];let distance=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),next=distance+length;
  if(next>=start&&distance<=end&&length){const lo=Math.max(0,(start-distance)/length),hi=Math.min(1,(end-distance)/length);if(hi>=lo){for(const t of [lo,hi]){const p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];if(!out.length||Math.hypot(p[0]-out.at(-1)[0],p[1]-out.at(-1)[1])>.001)out.push(p);}}}distance=next;
 }return out;
}
export function planCityDeletion(D,id){
 const b=D.cities.find(c=>c.i===id);if(!b)throw Error('Cidade não encontrada.');
 const cities=D.cities.filter(c=>c.i!==id),next={...D,cities},routes=[];let removed=0,adjusted=0;
 for(const r of D.routes){
  const attached=r.fromCity===id||r.toCity===id||r.stops?.includes(id);
  if(!attached){routes.push(r);continue;}
  if(r.kind==='mixed'&&b.harbor){removed++;continue;}const report=routeReport(next,r,{scale:1}),stops=report.stops;
  const endpoint=r.fromCity===id||r.toCity===id;
  // A dead-end link no longer connects two places. Through roads remain usable.
  if(endpoint&&stops.length<2){removed++;continue;}
  let points=r.points;
  if(endpoint&&stops.length>=2){const start=r.fromCity===id?stops[0].along:0,end=r.toCity===id?stops.at(-1).along:report.km;points=clipPath(points,start,end);if(points.length<2){removed++;continue;}}
  const fromCity=r.fromCity===id?stops[0]?.id??null:r.fromCity,toCity=r.toCity===id?stops.at(-1)?.id??null:r.toCity;
  const stateIds=[...new Set([fromCity,toCity,...stops.map(s=>s.id)].map(i=>cities.find(c=>c.i===i)?.state).filter(Boolean))];
  routes.push({...r,...(r.kind==='mixed'?{parts:mixedParts(next,points)}:{}),fromCity,toCity,stops:(r.stops||[]).filter(i=>i!==id),stateIds,points,controls:points===r.points?r.controls:simplify(points,4)});adjusted++;
 }
 return {cities,routes,removed,adjusted};
}
export function repairCapitals(D){
 for(const s of D.states.filter(s=>s.i))if(!D.cities.some(b=>b.i===s.capital&&b.state===s.i)){
  s.capital=D.cities.filter(b=>b.state===s.i).sort((a,b)=>(b.demographics?.population||0)-(a.demographics?.population||0)||a.i-b.i)[0]?.i??0;
 }
 for(const b of D.cities){const desired=D.states.some(s=>s.i===b.state&&s.capital===b.i);if(!!b.capital!==desired)b.capital=desired;}
}
