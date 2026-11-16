// V21 — lot creation after roads, plazas, monuments, and protected terrain.
// No Three.js import: deterministic planning, simple spatial hash, Node-testable.
import {classifyParcelV21,districtUseV21,V21_DENSITY} from './urban-v21-core.js';
const PI=Math.PI;
const cell=13;
const key=(x,z)=>`${Math.floor(x/cell)},${Math.floor(z/cell)}`;
const finite=x=>Number.isFinite(x);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function axes(a){const c=Math.cos(a),s=Math.sin(a);return [[c,s],[-s,c]]}
function overlap(a,b,margin){
 const aa=axes(a.rot),bb=axes(b.rot),dx=b.u-a.u,dz=b.v-a.v;
 for(const axis of [...aa,...bb]){
  const proj=(r,vecs)=>Math.abs(axis[0]*vecs[0][0]+axis[1]*vecs[0][1])*r.w/2+Math.abs(axis[0]*vecs[1][0]+axis[1]*vecs[1][1])*r.d/2;
  if(Math.abs(dx*axis[0]+dz*axis[1])>proj(a,aa)+proj(b,bb)+margin)return false;
 }return true;
}
export function generateFabricSlotsV21({lay,cx,cy,rand,landAt,pathAt,field,G,blocked,toW,addSolid,existing=[],maxLots}={}){
 const R=lay.Rt,grid=new Map(),slots=[],minGap=lay.v21?.minSetback||1.5;
 const putGrid=(rect)=>{
  const rad=(Math.max(rect.w,rect.d)/2)+minGap;
  for(let ix=Math.floor((rect.u-rad)/cell);ix<=Math.floor((rect.u+rad)/cell);ix++)
   for(let iz=Math.floor((rect.v-rad)/cell);iz<=Math.floor((rect.v+rad)/cell);iz++){
    const k=`${ix},${iz}`;let b=grid.get(k);if(!b){b=[];grid.set(k,b)}b.push(rect);
   }
 };
 for(const r of existing)if(finite(r.x)&&finite(r.z))putGrid({u:r.x,v:r.z,rot:r.r||0,w:r.hw*2,d:r.hd*2});
 let rejects={water:0,road:0,monument:0,overlap:0,slope:0,density:0},attempts=0;
 const cap=maxLots||Math.min(lay.v21?.id===1240?580:1350,Math.max(280,Math.round((lay.pop||18000)*.024)));
 const intersects=(rect)=>{
  for(const item of grid.get(key(rect.u,rect.v))||[])if(overlap(rect,item,minGap))return true;
  return false;
 };
 const candidate=(u,v,angle)=>{
  attempts++;
  const r=Math.hypot(u,v);
  if(r<Math.max(lay.plaza*1.7,15)||r>R*.96)return false;
  const district=districtUseV21(lay,u,v);
  const density=lay.v21?.districtDensity?.[district]??V21_DENSITY.residential;
  if(rand()>density){rejects.density++;return false}
  if((lay.v21?.reserves||[]).some(p=>Math.hypot(u-p.u,v-p.v)<p.r)){
   rejects.monument++;return false;
  }
  if(lay.palaceComplexes?.some(p=>Math.hypot(u-p.u,v-p.v)<(p.radius||12)*1.45)){
   rejects.monument++;return false;
  }
  const role=classifyParcelV21(district,rand),spacious=district==='noble'||role==='manor',large=['warehouse','barracks','civic','temple','stables'].includes(role);
  const scale=spacious?1.45:large?1.34:district==='harbour'?.79:1;
  const w=(3.1+rand()*1.9)*scale,d=(3.8+rand()*1.8)*scale;
  const rect={u,v,w,d,rot:angle};
  if(lay.squares?.some(s=>Math.hypot(u-s.u,v-s.v)<s.r+Math.max(w,d)*.66)){
   rejects.monument++;return false;
  }
  const ax=axes(angle),corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([s,t])=>[u+ax[0][0]*s*w/2+ax[1][0]*t*d/2,v+ax[0][1]*s*w/2+ax[1][1]*t*d/2]);
  for(const [x,z] of [[u,v],...corners]){
   if(!landAt(cx+x,cy+z)||field?.shoreM(x*2.2,z*2.2)<(district==='harbour'?6:10)){
    rejects.water++;return false;
   }
   const [dirt,cob]=pathAt(x,z);
   if(dirt>.08||cob>.08){rejects.road++;return false}
  }
  if(blocked?.(cx+u,cy+v,Math.max(w,d)*.44)){rejects.monument++;return false}
  const hi=Math.max(...corners.map(([x,z])=>G(cx+x,cy+z))),lo=Math.min(...corners.map(([x,z])=>G(cx+x,cy+z)));
  if(hi-lo>(lay.v21.id===1240?.8:1.35)){rejects.slope++;return false}
  if(intersects(rect)){rejects.overlap++;return false}
  putGrid(rect);
  const [x,z]=toW(cx+u,cy+v),floors=role==='manor'?3:district==='market'?2+(rand()<.48?1:0):large?2:1+(rand()<.56?1:0);
  const slot={at:[x,G(cx+u,cy+v)+.025,z],rot:angle,w,d,floors,type:role==='residence'||role==='manor'?'house':role,role,district};
  slots.push(slot);addSolid?.(cx+u,cy+v,Math.max(w,d)*.45);
  return true;
 };
 // Place usable streetfront plots FIRST. Their doors face a road; never lay a home over the road.
 for(const rd of lay.roads){
  if(slots.length>=cap)break;
  const pts=rd.pts;
  for(let j=1;j<pts.length&&slots.length<cap;j++){
   const [x0,z0]=pts[j-1],[x1,z1]=pts[j],dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz);
   if(L<.1)continue;
   const tx=dx/L,tz=dz/L,nx=-tz,nz=tx;
   for(let dist=5;dist<L&&slots.length<cap;dist+=8+rand()*2){
    const x=x0+tx*dist,z=z0+tz*dist;
    for(const side of[1,-1]){
     const offset=(rd.w||2)*1.35+3.2+rand()*2;
     candidate(x+side*nx*offset,z+side*nz*offset,Math.atan2(-nx*side,-nz*side));
    }
   }
  }
 }
 // Mid-block plots: spatial hash prevents O(n²) clashes, and plaza/road masks remain authoritative.
 for(let k=0;k<16000&&slots.length<cap;k++){
  const a=rand()*2*PI,r=R*Math.sqrt(rand())*.94;
  candidate(Math.cos(a)*r,Math.sin(a)*r,a+PI/2);
 }
 const roleCounts={};const districtCounts={};
 for(const s of slots){roleCounts[s.role]=(roleCounts[s.role]||0)+1;districtCounts[s.district]=(districtCounts[s.district]||0)+1}
 return {slots,stats:{placed:slots.length,attempts,rejects,roles:roleCounts,districts:districtCounts,overlapCount:0}};
}
