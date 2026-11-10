import {cleanForcedLaborShare,slaveTradeAllowed} from './economy-labor.js?v=43.1';
import {mixedParts,flattenParts} from './hybrid-core.js?v=24';
import {createRouter} from './travel-core.js?v=24';
import {simplify} from './network-core.js?v=40';
import {cleanSocialProfile} from './economy-income.js?v=43.1';
export const CITY_FLAGS=['port','majorPort','citadel','walls','temple','plaza','shanty','magicSchool','dwarvenFortress'];
export const CITY_CLASSES=['Cidade','Vila','Povoado','Forte','Forte élfico'];
export function cleanCityEdit(raw,D){
 const e={};if(raw.forcedLaborShare!==undefined)e.forcedLaborShare=cleanForcedLaborShare(raw.forcedLaborShare,{...D.cities?.find(b=>b.i===raw.id),state:raw.state??20});if(raw.socialProfile!==undefined)e.socialProfile=cleanSocialProfile(raw.socialProfile);
 for(const k of ['created','deleted'])if(Object.hasOwn(raw,k)){if(typeof raw[k]!=='boolean')throw Error('Edição de cidade inválida.');e[k]=raw[k];}
 if(raw.created&&(!raw.position||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>100))throw Error('Cidade criada sem nome ou localização.');
 if(raw.created)e.name=raw.name.trim();
 if(Object.hasOwn(raw,'inhabitants')){if(!Number.isSafeInteger(raw.inhabitants)||raw.inhabitants<0||raw.inhabitants>1e10)throw Error('Informe uma população inteira entre 0 e 10 bilhões.');e.inhabitants=raw.inhabitants;}
 if(Object.hasOwn(raw,'culture')){if(!D.cultures.some(c=>c.i===raw.culture))throw Error('Cultura inválida.');e.culture=raw.culture;}
 if(Object.hasOwn(raw,'religion')){if(!D.religions.some(r=>r.i===raw.religion))throw Error('Religião inválida.');e.religion=raw.religion;}
 if(Object.hasOwn(raw,'settlementClass')){if(!CITY_CLASSES.includes(raw.settlementClass))throw Error('Tipo de localidade inválido.');e.settlementClass=raw.settlementClass;}
 if(Object.hasOwn(raw,'features')){if(!raw.features||typeof raw.features!=='object')throw Error('Características inválidas.');e.features={};for(const k of Object.keys(raw.features)){if(!CITY_FLAGS.includes(k)||typeof raw.features[k]!=='boolean')throw Error('Característica inválida.');e.features[k]=raw.features[k];}if(e.features.majorPort&&!e.features.port)throw Error('Um porto principal também precisa ser um porto.');}
 if(Object.hasOwn(raw,'position')){const p=raw.position,g=D.grid;if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<0||p[1]<0||p[0]>=g.columns*g.stepX||p[1]>=g.rows*g.stepY)throw Error('Posição fora do mapa.');const c=D.cells[Math.floor(p[1]/g.stepY)*g.columns+Math.floor(p[0]/g.stepX)];if(c.h<20)throw Error('A cidade precisa ficar em terra.');e.position=[...p];}
 return e;
}
function harborAt(D,xy){let best=null,dist=Infinity;for(const c of D.cells){if(c.h>=20)continue;const d=Math.hypot(c.p[0]-xy[0],c.p[1]-xy[1]);if(d<dist){dist=d;best=c;}}if(dist>32)throw Error('Escolha um ponto mais perto da costa para este porto.');return {cell:best.i,waterPoint:[...best.p],approachDistance:dist};}
export function applyCityEdit(b,raw,D){
 const e=cleanCityEdit(raw,D);
 const wasPort=!!(b.port||b.majorPort),wasMajor=!!b.majorPort;
 if(e.inhabitants!==undefined){b.demographics={...b.demographics,population:e.inhabitants};b.population=e.inhabitants/(D.settings.populationRate*D.settings.urbanization);}
 if(e.socialProfile!==undefined)b.socialProfile=e.socialProfile;if(e.forcedLaborShare!==undefined){cleanForcedLaborShare(e.forcedLaborShare,b);if(e.forcedLaborShare>(b.socialProfile?.shares?.peasant??100))throw Error("O trabalho escravizado deve estar incluído no estrato de trabalhadores comuns.");b.forcedLaborShare=e.forcedLaborShare;}
 if(e.culture!==undefined)b.culture=e.culture;
 if(e.religion!==undefined){const r=D.religions.find(r=>r.i===e.religion);b.faith={...r};}
 if(e.settlementClass!==undefined)b.settlementClass=e.settlementClass;
 if(e.features){Object.assign(b,e.features);b.originalFeatures={...b.originalFeatures,...Object.fromEntries(['citadel','walls','temple','plaza','shanty','port'].filter(k=>k in e.features).map(k=>[k,e.features[k]]))};}
 if(e.culture!==undefined||e.features&&Object.hasOwn(e.features,'dwarvenFortress'))b.dwarven=b.culture===15||!!b.dwarvenFortress;
 if(e.position){[b.x,b.y]=e.position;const g=D.grid;b.cell=Math.floor(b.y/g.stepY)*g.columns+Math.floor(b.x/g.stepX);b.state=D.cells[b.cell].state;}
 if(!b.port&&!b.majorPort)delete b.harbor;
 else if(e.position&&(b.harbor||b.majorPort)||!wasPort||!wasMajor&&b.majorPort||e.features?.port&&!b.harbor)b.harbor=harborAt(D,[b.x,b.y]);
 return b;
}
// Reconnect only the part of a route that touched the old site; retain its other bends.
export function planCityMove(D,id,position){
 const before=D.cities.find(c=>c.i===id);if(!before)throw Error('Cidade não encontrada.');
 const edit=cleanCityEdit({position},D),next=applyCityEdit(structuredClone(before),edit,D);
 if(before.capital&&next.state!==before.state)throw Error('Escolha um ponto dentro do estado desta capital.');
 if(D.cities.some(c=>c.i!==id&&Math.hypot(c.x-next.x,c.y-next.y)<4))throw Error('Escolha um ponto um pouco mais distante da outra cidade.');
 const router=createRouter(D);let changed=0;
 const routes=D.routes.map(route=>{
  const sea=route.kind==='sea',origin=sea?before.harbor?.waterPoint:[before.x,before.y],destination=sea?next.harbor?.waterPoint:[next.x,next.y];
  if(!origin||!destination||route.enabled===false)return route;
  const pts=route.points;let index=-1,best=Infinity;for(let i=0;i<pts.length;i++){const d=Math.hypot(pts[i][0]-origin[0],pts[i][1]-origin[1]);if(d<best){index=i;best=d;}}
  const explicit=route.fromCity===id||route.toCity===id||route.stops?.includes(id);
  if(best>12&&!explicit)return route;
  if(best>40)return route;
  let start=index,end=index;while(start>0&&Math.hypot(pts[start][0]-origin[0],pts[start][1]-origin[1])<12)start--;while(end<pts.length-1&&Math.hypot(pts[end][0]-origin[0],pts[end][1]-origin[1])<12)end++;
  const atStart=index===0||(route.fromCity===id&&index<3),atEnd=index===pts.length-1||(route.toCity===id&&index>pts.length-4);
  const anchors=[...(!atStart?[pts[start].slice(0,2)]:[]),destination,...(!atEnd?[pts[end].slice(0,2)]:[])];
  if(anchors.length<2)return route;
  if(route.kind==='mixed'&&before.harbor)throw Error('Antes de mover um porto ligado a uma rota híbrida, ajuste essa rota no editor.');const link=router.trace(anchors,route.kind==='mixed'?'mixed':sea?'sea':'road');
  const points=[...(!atStart?pts.slice(0,start):[]),...link,...(!atEnd?pts.slice(end+1):[])].map(p=>p.slice(0,2));
  const owners=[route.fromCity,route.toCity,...(route.stops||[])].map(i=>i===id?next:D.cities.find(c=>c.i===i)).filter(Boolean).map(c=>c.state);
  const stateIds=[...new Set([...points.map(p=>router.nearest(p).state),...owners].filter(Boolean))];
  changed++;return {...route,points,...(route.kind==='mixed'?{parts:mixedParts(D,points)}:{}),controls:simplify(points,3),stateIds};
 });
 return {city:next,routes,changed};
}
