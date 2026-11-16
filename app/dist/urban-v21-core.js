// Silvengard Atlas — V21 city-specific physical planning (no world-map edits).
// Pure ESM: safe to test in Node, imported only by the local city runtime.
import {makeCastamorAccessRoad} from './imperial-v12-core.js?v=72';

export const V21_PILOT_IDS=Object.freeze([1,3,7,1240]);
export const V21_KITS=Object.freeze({1:'high-elf',3:'northern',7:'imperial',1240:'imperial'});
export const isV21Pilot=id=>V21_PILOT_IDS.includes(Number(id));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const P=Math.PI;
export const V21_DENSITY=Object.freeze({
 harbour:.75,market:.56,residential:.45,craft:.56,military:.23,
 noble:.21,palace:.04,high:.18,temple:.12,grove:.07,academy:.19
});

export function applyPilotSiteV21(site,blueprint){
 if(!isV21Pilot(blueprint?.cityId))return false;
 const id=Number(blueprint.cityId);
 site.v21CityId=id;
 if(id===1240){
  // The old town radius was smaller than the hill itself. Put the settlement BELOW
  // a genuinely high, broad fortification plateau instead of on the hillside.
  site.cityR=Math.max(665,site.cityR);site.urbanR=site.cityR;
  site.imperialV12={...site.imperialV12,citadelHill:{...(site.imperialV12?.citadelHill||{}),x:0,z:0,heightM:148,plateauM:116,radiusM:405}};
 }else if(id===7){
  // Keep the historic, fully surrounded island; no political/map edits.
  site.forest=Math.min(site.forest,.55);
 }else if(id===1){site.forest=Math.max(site.forest,.62)}
 return true;
}

const axialRoad=(ang,start,end,width,steps=26)=>{
 const pts=[];for(let i=0;i<=steps;i++){
  const r=start+(end-start)*i/steps;
  pts.push([Math.cos(ang)*r,Math.sin(ang)*r]);
 }
 return {pts,w:width,a:ang,main:true,v21:true,processional:true};
};

/** Call AFTER applyCityBlueprint and BEFORE planUrbanV7Site. */
export function preparePilotLayoutV21(lay,site,blueprint){
 const id=Number(blueprint?.cityId);
 if(!isV21Pilot(id)||!lay)return null;
 const R=lay.Rt,port=site.portDir||0,fromPort=port+P;
 const specs=(lay.customDistricts||[]).map(s=>({...s}));
 const update=(kind,change)=>{const s=specs.find(d=>d.kind===kind);if(s)Object.assign(s,change)};
 const v21={id,kit:V21_KITS[id],schema:21,seed:blueprint.seed,roadsAdded:0,
  minSetback:1.3,reserves:[],districtDensity:{...V21_DENSITY}};
 if(id===7){
  // Opposite coast, on a higher terrace, NOT the dense central square.
  update('palace',{absoluteAngle:fromPort,radiusFactor:.69,widthFactor:.19,label:'Palácio Imperial · Cidade Alta'});
  update('high',{absoluteAngle:fromPort+.19,radiusFactor:.49,widthFactor:.16,label:'Cidade Alta · Patamares'});
  update('noble',{absoluteAngle:fromPort-.60,radiusFactor:.53,widthFactor:.21});
  update('residential',{absoluteAngle:port+P*.56,radiusFactor:.66,widthFactor:.26});
  v21.reserves.push({kind:'palace',u:Math.cos(fromPort)*R*.69,v:Math.sin(fromPort)*R*.69,r:R*.255});
  lay.roads.push(axialRoad(fromPort,lay.plaza*.8,R*.84,5.6));v21.roadsAdded++;
  lay.roads.push(axialRoad(port,lay.plaza*.8,R*.95,4.0));v21.roadsAdded++;
  lay.squares=(lay.squares||[]).concat([{u:Math.cos(fromPort)*R*.41,v:Math.sin(fromPort)*R*.41,r:Math.min(16,R*.065)}]);
  lay.gates=[...new Set([...(lay.gates||[]),fromPort])];
  v21.minSetback=2.2;
 }else if(id===1240){
  const hill=site.imperialV12.citadelHill;
  lay.imperialV12={...(lay.imperialV12||{}),citadelHill:{...hill}};
  lay.roads=lay.roads.filter(r=>!r.access);
  const road=makeCastamorAccessRoad({radiusM:hill.radiusM,plateauM:hill.plateauM,angle:-P/2-1.7*2*P});
  lay.roads.push({...road,w:3.1,v21:true,access:true});v21.roadsAdded++;
  // Protect slopes while keeping the switchback road physically traversable.
  v21.reserves.push({kind:'cliff',u:0,v:0,r:(hill.radiusM-18)/2.2});
  update('residential',{radiusFactor:.88,widthFactor:.20,label:'Povoado ao Pé da Fortaleza'});
  update('market',{radiusFactor:.82,widthFactor:.16});
  update('noble',{radiusFactor:.87,widthFactor:.13});
  update('military',{radiusFactor:.82,widthFactor:.15});
  update('temple',{radiusFactor:.86,widthFactor:.14});
  update('craft',{radiusFactor:.84,widthFactor:.15});
  v21.minSetback=2.1;
 }else if(id===1){
  // Curving ceremonial access; keep an elven organic mesh, never a Roman grid.
  update('noble',{radiusFactor:.58,widthFactor:.25});
  update('grove',{radiusFactor:.48,widthFactor:.24});
  update('palace',{radiusFactor:.36,widthFactor:.23});
  lay.roads.push(axialRoad(fromPort,lay.plaza+2,R*.65,3.7));v21.roadsAdded++;
  v21.minSetback=2.4;
 }else if(id===3){
  update('palace',{radiusFactor:.42,widthFactor:.20});
  update('military',{radiusFactor:.62,widthFactor:.21});
  update('market',{radiusFactor:.37,widthFactor:.22});
  lay.roads.push(axialRoad(fromPort,lay.plaza+3,R*.76,4.0));v21.roadsAdded++;
  v21.minSetback=2.0;
 }
 lay.customDistricts=specs;
 lay.v21=v21;
 return v21;
}

export function districtUseV21(lay,u,v){
 if(!lay?.districts?.length)return 'residential';
 let selected='residential',best=Infinity;
 for(const d of lay.districts){
  const distance=Math.hypot(u-d.u,v-d.v)/(d.r||1);
  if(distance<1.22&&distance<best){best=distance;selected=d.kind}
 }
 return selected;
}

export function zonedLotV21(lay,u,v,rand=Math.random){
 const R=lay.Rt,r=Math.hypot(u,v),district=districtUseV21(lay,u,v);
 if(r>R*1.005)return {allowed:false,district,reason:'outside'};
 for(const p of lay.v21?.reserves||[]){
  const distance=Math.hypot(u-p.u,v-p.v);
  if(distance<p.r)return {allowed:false,district,reason:p.kind};
 }
 const occupancy=lay.v21?.districtDensity?.[district]??.45;
 return {allowed:rand()<occupancy,district,reason:'density'};
}

export function classifyParcelV21(district,rand=Math.random){
 const x=rand();
 const weighted={
  harbour:[['residence',.42],['warehouse',.19],['tavern',.12],['inn',.10],['workshop',.09],['shop',.08]],
  market:[['shop',.36],['residence',.25],['inn',.10],['tavern',.10],['workshop',.12],['warehouse',.07]],
  craft:[['workshop',.32],['residence',.33],['warehouse',.17],['shop',.12],['stables',.06]],
  military:[['barracks',.23],['stables',.24],['warehouse',.13],['residence',.40]],
  noble:[['manor',.73],['residence',.20],['inn',.07]],
  palace:[['civic',.55],['manor',.45]],
  temple:[['temple',.28],['inn',.19],['residence',.53]],
  high:[['manor',.30],['residence',.56],['civic',.14]],
  grove:[['manor',.24],['residence',.76]],
  residential:[['residence',.88],['shop',.08],['tavern',.04]]
 }[district]||[['residence',1]];
 let sum=0;for(const[role,w]of weighted){sum+=w;if(x<=sum)return role}
 return weighted.at(-1)[0];
}

export function v21CityAudit(lay){
 return {pilot:!!lay?.v21,cityId:lay?.v21?.id||null,reservations:lay?.v21?.reserves||[],
  roadsAdded:lay?.v21?.roadsAdded||0,kit:lay?.v21?.kit||null};
}
