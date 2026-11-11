// Silvengard · v44 — gerador de localidades em escala real.
//
// A cidade cresce com a população: núcleo detalhado (casas, praça, igreja, mercado),
// muralhas no limite urbano, malha de quarteirões instanciada até a periferia, porto
// com cais e trapiches quando há água, campos e moinho no entorno. O relevo e a água
// vêm do campo local (local-field.js), então tudo assenta no chão de verdade.
import * as THREE from 'three';
import {Mesher,STYLES,addBuilding,addChurch2,addTownHall,addKeepHall,addFountain,addFence,addWell,addStall,addBarrel,addCrate,addLamp,addTower,addFort,addHaystack,addTent,addPillar,addLog,addWallSegment,addBanner,addHouse,addBoat,addCrane,tc,PAL,portModel} from './settlements.js?v=56';
import {populationRadiusM,M_PER_UNIT} from './local-field.js?v=56';
import {NOISE} from './visuals.js?v=56';

const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const vh=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=vh(ix,iy),b=vh(ix+1,iy),c=vh(ix,iy+1),d=vh(ix+1,iy+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
const CLIMATE={1:'arid',2:'arid',3:'arid',4:'temperate',5:'tropical',6:'temperate',7:'tropical',8:'temperate',9:'cold',10:'cold',11:'cold',12:'wet'};
export const CLIMATE_NAME={arid:'clima árido',tropical:'clima tropical',temperate:'clima temperado',cold:'clima frio',alpine:'terras altas',wet:'terras alagadiças',grass:'campos abertos',boreal:'floresta boreal'};
export function climateOf(cell){if(!cell)return'temperate';if(cell.h>52)return'alpine';return CLIMATE[cell.biome]||'temperate'}

/* ---------- traçado urbano ---------- */
export function makeLayout({pop=400,capital=false,village=false,fort=false,rand=Math.random,radiusUnits=null,port=false,kind=null}){
 const R=Math.max(24,radiusUnits||populationRadiusM(pop)/M_PER_UNIT);
 kind=kind||(fort?'fort':village?'village':capital?'capital':port?'port':'town');
 const plaza=fort?0:kind==='capital'?10.5:kind==='village'?3.4:kind==='port'?5.2:6.2;
 const coreR=fort?R*1.6:clamp(R*.62,16,240);
 const a0=rand()*Math.PI,roads=[];
 const poly=(a,r0,r1,steps,amp,ph,ox=0,oy=0)=>{const pts=[];for(let k=0;k<=steps;k++){const r=r0+(r1-r0)*k/steps,w=(vn(k*.55,ph)-.5)*amp*smooth(0,3,k);pts.push([ox+Math.cos(a)*r-Math.sin(a)*w,oy+Math.sin(a)*r+Math.cos(a)*w])}return pts};
 const wide=clamp(R/210,.8,1.2);
 // avenidas radiais (vilas têm poucas; capitais têm muitas)
 const nRad=fort?3:kind==='village'?2:kind==='port'?9:kind==='capital'?12:clamp(Math.round(R/34)+2,3,10);
 for(let i=0;i<nRad;i++){
  const a=a0+i*Math.PI*2/nRad+(rand()-.5)*.22;
  roads.push({pts:poly(a,Math.max(1,plaza*.8),Math.min(R*1.28+40,R+200),fort?8:kind==='village'?7:12,kind==='village'?2:6,rand()*9),w:(kind==='village'?2.4:2.7)*wide,a,main:true});
 }
 // anéis viários (só cidades maiores)
 const nRings=kind==='village'||kind==='fort'?0:R>400?3:R>220?2:R>110?1:0;
 for(let k=1;k<=nRings;k++){
  const rr=R*(k/(nRings+1))*(.92+rand()*.12)+plaza,pts=[];
  const steps=Math.max(24,Math.round(rr*.22));
  for(let j=0;j<=steps;j++){const a=j/steps*Math.PI*2;pts.push([Math.cos(a)*(rr+(vn(j*.31,k*3.7)-.5)*rr*.11),Math.sin(a)*(rr+(vn(j*.31+5,k*3.7)-.5)*rr*.11)])}
  roads.push({pts,w:1.7*wide,a:0,main:true,ring:true});
 }
 // travessas curtas entre avenidas no núcleo
 const nCross=kind==='village'?0:clamp(Math.round(R/55),1,6);
 for(let i=0;i<nCross;i++){
  const a=a0+(i+.5)*Math.PI*2/Math.max(2,nRad)+(rand()-.5)*.3;
  const r0=plaza+3,r1=coreR*(.55+rand()*.35);
  roads.push({pts:poly(a,r0,r1,5,4,rand()*9),w:1.1*wide,a,main:false});
 }
 // vielas
 const nAlley=kind==='village'?1:clamp(Math.round(R/24),2,14);
 for(let i=0;i<nAlley;i++){
  const a=rand()*Math.PI*2,r0=plaza+2.5,r1=coreR*(.5+rand()*.45);
  roads.push({pts:poly(a+(rand()-.5)*.5,r0,r1,4,3,rand()*9),w:.78,a,main:false});
 }
 const N=clamp(Math.round(coreR*(kind==='village'?.55:.7)),12,150);
 const center=fort?'none':kind==='village'?'well'
  :kind==='port'?['fountain','market'][Math.floor(rand()*2)]
  :kind==='capital'?'fountain':'fountain';
 return {pop,N,Rt:R,plaza,capital,village,fort,roads,a0,coreR,port,wide,kind,center};
}
const pointsAlong=(pts)=>{const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return{cum,total:cum[cum.length-1],at(s){s=Math.max(0,Math.min(cum[cum.length-1]-1e-6,s));let i=1;while(i<cum.length-1&&cum[i]<s)i++;const L=cum[i]-cum[i-1]||1,f=(s-cum[i-1])/L,a=pts[i-1],b=pts[i];return{x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,tx:(b[0]-a[0])/L,ty:(b[1]-a[1])/L}}}};
const axes=r=>[[Math.cos(r),-Math.sin(r)],[Math.sin(r),Math.cos(r)]];
function rectsOverlap(a,b,pad=.2){const A=axes(a.r),B=axes(b.r),dx=b.x-a.x,dz=b.z-a.z;for(const ax of[...A,...B]){const ra=a.hw*Math.abs(ax[0]*A[0][0]+ax[1]*A[0][1])+a.hd*Math.abs(ax[0]*A[1][0]+ax[1]*A[1][1]),rb=b.hw*Math.abs(ax[0]*B[0][0]+ax[1]*B[0][1])+b.hd*Math.abs(ax[0]*B[1][0]+ax[1]*B[1][1]);if(Math.abs(dx*ax[0]+dz*ax[1])>ra+rb+pad)return false}return true}

/* ---------- malha urbana instanciada (periferia densa e barata) ---------- */
function roofGeometry(){
 const x=.5,z=.5,h=.62,P=[],N=[];
 const tri=(n,a,b,c)=>{for(const v of[a,b,c]){P.push(...v);N.push(...n)}};
 const quad=(n,a,b,c,d)=>{tri(n,a,b,c);tri(n,a,c,d)};
 const ny=h/Math.hypot(z,h),nz=z/Math.hypot(z,h);
 quad([0,ny,nz],[-x,0,z],[x,0,z],[x,h,0],[-x,h,0]);
 quad([0,ny,-nz],[x,0,-z],[-x,0,-z],[-x,h,0],[x,h,0]);
 tri([0,0,-1],[x,0,-z],[x,0,z],[x,h,0]);tri([0,0,1],[-x,0,z],[-x,0,-z],[-x,h,0]);
 tri([0,-1,0],[-x,0,z],[x,0,z],[x,0,-z]);tri([0,-1,0],[-x,0,z],[x,0,-z],[-x,0,-z]);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 return g;
}
/** Porta e janelas, em unidades de cena fixas, para a frente (+z) das casas da malha. */
function frontGeometry(){
 const P=[],N=[],C=[];
 const box=(w,h,d,x,y,z,r,g,b)=>{
  const X=w/2,Z=d/2,fs=[1,-1];
  const f=(nx,ny,nz,vs)=>{for(const v of vs){P.push(...v);N.push(nx,ny,nz);C.push(r,g,b)}};
  f(0,0,1,[[x-X,y,z+Z],[x+X,y,z+Z],[x+X,y+h,z+Z],[x-X,y,z+Z],[x+X,y+h,z+Z],[x-X,y+h,z+Z]]);
  f(0,0,-1,[[x+X,y,z-Z],[x-X,y,z-Z],[x-X,y+h,z-Z],[x+X,y,z-Z],[x-X,y+h,z-Z],[x+X,y+h,z-Z]]);
  for(const s of fs){f(s,0,0,s>0?[[x+X,y,z+Z],[x+X,y,z-Z],[x+X,y+h,z-Z],[x+X,y,z+Z],[x+X,y+h,z-Z],[x+X,y+h,z+Z]]:[[x-X,y,z-Z],[x-X,y,z+Z],[x-X,y+h,z+Z],[x-X,y,z-Z],[x-X,y+h,z+Z],[x-X,y+h,z-Z]])}
  f(0,1,0,[[x-X,y+h,z+Z],[x+X,y+h,z+Z],[x+X,y+h,z-Z],[x-X,y+h,z+Z],[x+X,y+h,z-Z],[x-X,y+h,z-Z]]);
 };
 box(.4,.95,.05,0,0,.025,.28,.21,.16);                   // porta
 box(.34,.36,.05,-.82,.85,.025,.15,.23,.3);              // janelas
 box(.34,.36,.05,.82,.85,.025,.15,.23,.3);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
 return g;
}
function roofHipGeometry(){
 const x=.5,z=.5,h=.55,P=[],N=[];
 const tri=(a,b,c)=>{const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const L=Math.hypot(...n)||1;
  for(const w of[a,b,c]){P.push(...w);N.push(n[0]/L,n[1]/L,n[2]/L)}};
 tri([-x,0,z],[x,0,z],[0,h,0]);tri([x,0,-z],[-x,0,-z],[0,h,0]);
 tri([x,0,z],[x,0,-z],[0,h,0]);tri([-x,0,-z],[-x,0,z],[0,h,0]);
 tri([-x,0,z],[x,0,z],[x,0,-z]);tri([-x,0,z],[x,0,-z],[-x,0,-z]);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 return g;
}
function roofFlatGeometry(){
 const g=new THREE.BoxGeometry(1.04,.18,1.04);g.translate(0,.09,0);return g;
}
function addFabric(env){
 const{lay,cx,cy,rand,climate,field,G,landAt,pathAt,addSolid,toW,blocked}=env,style=env.style||STYLES[climate]||STYLES.temperate;
 const R=lay.Rt,r0=Math.max(lay.plaza*1.35,16),max=6000;
 const wallGeo=new THREE.BoxGeometry(1,1,1);wallGeo.translate(0,.5,0);
 const baseGeo=new THREE.BoxGeometry(1.06,.24,1.06);baseGeo.translate(0,.12,0);
 const gableGeo=roofGeometry(),hipGeo=roofHipGeometry(),flatGeo=roofFlatGeometry();
 const frontGeo=frontGeometry();
 const upperGeo=(()=>{
  const P=[],N=[],C=[];
  const box=(w,h,d,x,y,z,r,g,b)=>{
   const X=w/2,Z=d/2;
   const f=(nx,ny,nz,vs)=>{for(const v of vs){P.push(...v);N.push(nx,ny,nz);C.push(r,g,b)}};
   f(0,0,1,[[x-X,y,z+Z],[x+X,y,z+Z],[x+X,y+h,z+Z],[x-X,y,z+Z],[x+X,y+h,z+Z],[x-X,y+h,z+Z]]);
   f(0,0,-1,[[x+X,y,z-Z],[x-X,y,z-Z],[x-X,y+h,z-Z],[x+X,y,z-Z],[x-X,y+h,z-Z],[x+X,y+h,z-Z]]);
  };
  box(.34,.36,.05,-.5,0,.02,.15,.23,.3);box(.34,.36,.05,.5,0,.02,.15,.23,.3);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  return g;
 })();
 const wallMat=new THREE.MeshStandardMaterial({roughness:.92,metalness:0});
 const baseMat=new THREE.MeshStandardMaterial({color:'#9a9184',roughness:1});
 const roofMat=new THREE.MeshStandardMaterial({roughness:.9,metalness:0,side:THREE.DoubleSide});
 const frontMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75});
 const wallUniform={uWallKind:{value:style.wall==='wood'?1:style.wall==='stone'?2:0}};
 wallMat.userData.uWallKind=wallUniform.uWallKind;
 wallMat.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,wallUniform);
  sh.vertexShader='varying vec3 vWP;varying float vBase;varying vec3 vNW;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vNW=normal;
  #ifdef USE_INSTANCING
  vWP=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;vBase=instanceMatrix[3][1];
  #else
  vWP=(modelMatrix*vec4(position,1.)).xyz;vBase=0.;
  #endif`);
  sh.fragmentShader='varying vec3 vWP;varying float vBase;varying vec3 vNW;uniform float uWallKind;\n'+NOISE+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float wn=atlasNoise(vWP.xz*2.3)+.5*atlasNoise(vWP.xz*7.1);
  diffuseColor.rgb*=.92+.11*wn;
  float wallFace=1.-smoothstep(.35,.85,abs(vNW.y));
  float hy=vWP.y-vBase;
  float u=dot(vWP.xz,vec2(.707,.707))*2.8;
  if(uWallKind<.5){                                   // reboco: manchas e fissuras
   float crack=1.-smoothstep(0.,.03,abs(atlasNoise(vWP.xz*4.2+vWP.y*.4)-.5));
   diffuseColor.rgb*=.96+.05*wn;
   diffuseColor.rgb*=1.-.14*crack*wallFace;
  }else if(uWallKind<1.5){                            // madeira: tábuas verticais
   float plank=1.-smoothstep(.78,1.,abs(fract(u)-.5)*2.);
   float beam=1.-smoothstep(.86,1.,abs(fract(hy/2.)-.5)*2.);
   diffuseColor.rgb*=.78+.22*plank;
   diffuseColor.rgb*=.9+.1*beam;
  }else{                                              // pedra: juntas
   vec2 bl=vec2(vWP.x*1.5+mod(floor(hy/.34),2.)*.5,hy/.34);
   vec2 bf=fract(bl);
   float joint=1.-smoothstep(.03,.1,min(min(bf.x,1.-bf.x),min(bf.y,1.-bf.y)));
   float tone=atlasHash(floor(bl))*.16-.08;
   diffuseColor.rgb*=(1.+tone)*(1.-.28*joint);
  }
  diffuseColor.rgb*=mix(.8,1.,smoothstep(0.,1.5,hy));`);
 };
 roofMat.onBeforeCompile=sh=>{
  sh.vertexShader='varying vec3 vWP;varying float vBase;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  vWP=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;vBase=instanceMatrix[3][1];
  #else
  vWP=(modelMatrix*vec4(position,1.)).xyz;vBase=0.;
  #endif`);
  sh.fragmentShader='varying vec3 vWP;varying float vBase;\n'+NOISE+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float rn=atlasNoise(vWP.xz*3.7)+.5*atlasNoise(vWP.xz*11.);
  float rows=1.-smoothstep(.86,1.,abs(fract((vWP.y-vBase)/.32)-.5)*2.);
  diffuseColor.rgb*=(.86+.2*rn)*(.92+.08*rows);`);
 };
 const walls=new THREE.InstancedMesh(wallGeo,wallMat,max),
  bases=new THREE.InstancedMesh(baseGeo,baseMat,max),
  fronts=new THREE.InstancedMesh(frontGeo,frontMat,max),
  uppers=new THREE.InstancedMesh(upperGeo,frontMat,max),
  gables=new THREE.InstancedMesh(gableGeo,roofMat,max),
  hips=new THREE.InstancedMesh(hipGeo,roofMat,max),
  flats=new THREE.InstancedMesh(flatGeo,roofMat,max);
 walls.castShadow=walls.receiveShadow=true;bases.castShadow=bases.receiveShadow=true;gables.castShadow=hips.castShadow=flats.castShadow=true;
 walls.frustumCulled=bases.frustumCulled=fronts.frustumCulled=uppers.frustumCulled=gables.frustumCulled=hips.frustumCulled=flats.frustumCulled=false;
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s3=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const wallCols=style.cols&&style.cols.length?style.cols:['#efe4c8','#e6d6b4','#dfcaa1'];
 let roofCols=style.roofCols&&style.roofCols.length?style.roofCols:['#7c5548','#8a5a46','#6d5044'];
 if(env.snow)roofCols=['#edf2f4','#e3ebee','#f5f8f7'];
 const flatStyle=style.roofKind==='flat';
 let n=0,ng=0,nh=0,nf=0,nu=0;
 const spotOK=(u,v)=>{
  const rr=Math.hypot(u,v);if(rr<r0||rr>R*1.02)return false;
  const mx=cx+u,my=cy+v;
  if(!landAt(mx,my))return false;
  const sd=field?field.shoreM(u*M_PER_UNIT,v*M_PER_UNIT):999;
  if(sd<15)return false;
  const[dirt,cob]=pathAt(u,v);if(dirt>.17||cob>.15)return false;
  if(blocked&&blocked(mx,my,2.2))return false;
  return true;
 };
 const emit=(u,v,w,d,h,rot)=>{
  if(n>=max)return false;
  const mx=cx+u,my=cy+v,gy=G(mx,my);
  const[ax,az]=toW(cx+u,cy+v);
  p.set(ax,gy+.02,az);q.setFromAxisAngle(up,rot);
  s3.set(w,h,d);m4.compose(p,q,s3);walls.setMatrixAt(n,m4);
  walls.setColorAt(n,new THREE.Color(wallCols[Math.floor(rand()*wallCols.length)]).multiplyScalar(.9+rand()*.2));
  p.y=gy+.02+h;
  const townhouse=h>3.1;
  if(flatStyle){
   s3.set(w,1,d);m4.compose(p,q,s3);flats.setMatrixAt(nf,m4);
   flats.setColorAt(nf,new THREE.Color(roofCols[Math.floor(rand()*roofCols.length)]).multiplyScalar(.88+rand()*.24));nf++;
  }else if(townhouse&&rand()<.55){
   s3.set(w*1.1,w*.52,d*1.1);m4.compose(p,q,s3);hips.setMatrixAt(nh,m4);
   hips.setColorAt(nh,new THREE.Color(roofCols[Math.floor(rand()*roofCols.length)]).multiplyScalar(.85+rand()*.28));nh++;
  }else{
   s3.set(w*1.08,w*(style.pitch||.58),d*1.08);m4.compose(p,q,s3);gables.setMatrixAt(ng,m4);
   gables.setColorAt(ng,new THREE.Color(roofCols[Math.floor(rand()*roofCols.length)]).multiplyScalar(.85+rand()*.28));ng++;
  }
  p.set(ax,gy-.06,az);s3.set(w,1,d);m4.compose(p,q,s3);bases.setMatrixAt(n,m4);
  bases.setColorAt(n,new THREE.Color('#9a9184').multiplyScalar(.82+rand()*.32));
  const fz=d/2+.03;
  p.set(ax+Math.sin(rot)*fz,gy+.02,az+Math.cos(rot)*fz);s3.set(1,1,1);m4.compose(p,q,s3);fronts.setMatrixAt(n,m4);
  if(townhouse&&nu<max){
   p.set(ax+Math.sin(rot)*fz,gy+h-.85,az+Math.cos(rot)*fz);m4.compose(p,q,s3);uppers.setMatrixAt(nu,m4);nu++;
  }
  addSolid(mx,my,Math.max(w,d)*.42);
  n++;return true;
 };
 // proporções variadas: casebre, casa alta, casa comprida, torre
 const pickHouse=(r,core)=>{
  const t=rand();
  if(t<.30)return{w:2.5+rand()*1.1,d:3.1+rand()*1.1,h:2.0+rand()*.8};
  if(t<.72)return{w:2.4+rand()*1.0,d:3.4+rand()*1.3,h:(core?3.4:2.8)+rand()*1.9};
  if(t<.90)return{w:4.0+rand()*1.5,d:2.7+rand()*.9,h:2.4+rand()*.8};
  return{w:2.9+rand()*.9,d:2.9+rand()*.9,h:4.6+rand()*2.0};
 };
 // 1. frente de rua
 for(const rd of lay.roads){
  const pp=pointsAlong(rd.pts),step=rd.main?5.8:6.6;
  for(let s=0;s<pp.total&&n<max;s+=step){
   const q2=pp.at(s),r=Math.hypot(q2.x,q2.y);
   if(r<r0||r>R*.99)continue;
   const nx=-q2.ty,ny=q2.tx;
   for(const side of[1,-1]){
    if(rd.ring&&side===1)continue;
    const off=rd.w*1.02+2.2+rand()*1.2;
    const u=q2.x+nx*side*off,v=q2.y+ny*side*off;
    if(!spotOK(u,v))continue;
    const h0=pickHouse(r,r<lay.coreR*1.7);
    emit(u,v,h0.w,h0.d,h0.h,Math.atan2(-nx*side,-ny*side)+(rand()-.5)*.12);
   }
  }
 }
 // 2. fundo dos quarteirões
 let attempts=0;
 while(n<max&&attempts<50000){
  attempts++;
  const r=Math.sqrt(r0*r0+rand()*(R*R-r0*r0));
  const a=rand()*Math.PI*2;
  const spacing=6.5+7.5*(r/R);
  const u=Math.cos(a)*r+(rand()-.5)*spacing*.85,v=Math.sin(a)*r+(rand()-.5)*spacing*.85;
  if(!spotOK(u,v))continue;
  const h0=pickHouse(r,r<lay.coreR*1.7);
  emit(u,v,h0.w,h0.d,h0.h,Math.atan2(-Math.cos(a),-Math.sin(a))+(rand()-.5)*.5);
 }
 walls.count=bases.count=fronts.count=n;uppers.count=nu;
 gables.count=ng;hips.count=nh;flats.count=nf;
 for(const m of[walls,bases,fronts,uppers,gables,hips,flats])if(m.instanceMatrix)m.instanceMatrix.needsUpdate=true;
 for(const m of[walls,bases,gables,hips,flats])if(m.instanceColor)m.instanceColor.needsUpdate=true;
 const group=new THREE.Group();group.name='fabric';
 group.add(walls,bases,fronts);
 if(nu)group.add(uppers);
 if(ng)group.add(gables);if(nh)group.add(hips);if(nf)group.add(flats);
 return {group,count:n};
}

/* ---------- porto ---------- */
function buildHarbour(env){
 const{site,field,cx,cy,rand,toW,G,addSolid,color,style}=env;
 if(!site.port&&site.waterKind==='none')return null;
 const dir=site.portDir;
 const edgeAt=angle=>{
  const start=Math.max(12,site.cityR*.18);
  for(let r=start;r<site.cityR*1.45+160;r+=5){
   const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
   if(field.heightM(x,z)<.5)return{x:x/M_PER_UNIT,z:z/M_PER_UNIT,angle};
  }
  return null;
 };
 const edge=[];for(let k=-5;k<=5;k++){const p=edgeAt(dir+k*.05);if(p)edge.push(p)}
 if(edge.length<4)return null;
 const hs=clamp(site.cityR/350,.45,1.15);   // vila portuária tem cais pequeno
 const m=new Mesher(),extras=[];
 // cais de pedra (posições em unidades de cena)
 for(let i=1;i<edge.length;i++){
  const a=edge[i-1],b=edge[i],dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz);if(L<.5)continue;
  const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,[x,z]=toW(cx+mx,cy+mz);
  m.box('stone',L+1.2,.95,4.6*hs,{at:[x,.55,z],rot:Math.atan2(-dz,dx),tint:tc(PAL.stone,.93)});
  m.box('stone',L+1.2,.18,5.2*hs,{at:[x,.94,z],rot:Math.atan2(-dz,dx),tint:tc(PAL.cobble,.95)});
  addSolid(cx+mx,cy+mz,2.2);
 }
 // trapiches para dentro da água
 const pierIdx=[1,Math.floor(edge.length/2)+1,edge.length-2];
 pierIdx.forEach((idx,pi)=>{
  const p=edge[idx];if(!p)return;
  const ox=Math.cos(p.angle),oz=Math.sin(p.angle),len=(26+rand()*18)*hs/M_PER_UNIT;
  const bx=cx+p.x,by=cy+p.z;
  const ex=bx+ox*len,ey=by+oz*len;
  const[ax,az]=toW(bx,by),[bx2,bz2]=toW(ex,ey);
  m.box('wood',3.2*hs,.34,len,{at:[(ax+bx2)/2,.98,(az+bz2)/2],rot:Math.atan2(-(bz2-az),bx2-ax),tint:tc(PAL.wood,.96)});
  for(let t=0;t<=1.001;t+=.22){
   const px=bx+ox*len*t,pz=by+oz*len*t;
   for(const sd of[-1.35*hs,1.35*hs]){const qx=px-oz*sd,qz=pz+ox*sd,[vx,vz]=toW(qx,qz);
    m.cyl('wood',.17,.2,1.9,6,{at:[vx,-.5,vz],tint:tc(PAL.woodDark,.95)})}
  }
  addSolid(bx,by,2.4);addSolid(ex,ey,2);
  const s=.9+rand()*.4,side=pi%2?1:-1;
  const boatx=ex+(-oz)*2.8*hs*side,boatz=ey+(ox)*2.8*hs*side,[b3x,b3z]=toW(boatx,boatz);
  addBoat(m,{at:[b3x,.06,b3z],rot:p.angle+Math.PI/2,s:s*hs,sail:false});
  addSolid(boatx,boatz,2.2);
 });
 // galpões, guindaste e farol
 const mid=edge[Math.floor(edge.length/2)];
 if(mid){
  for(let i=0;i<2;i++){
   const back=(20+i*14)/M_PER_UNIT,ox=Math.cos(mid.angle),oz=Math.sin(mid.angle);
   const u=mid.x-ox*back+(rand()-.5)*4,v=mid.z-oz*back+(rand()-.5)*4;
   const mx=cx+u,my=cy+v;if(!landAtSafe(env,mx,my))continue;
   const[x,z]=toW(mx,my);
   addBuilding(m,{at:[x,G(mx,my)+.05,z],rot:mid.angle+Math.PI,w:5,d:7.4,floors:2,type:'warehouse',style,R:rand,smoke:null});
   addSolid(mx,my,3.4);
  }
  const ox=Math.cos(mid.angle),oz=Math.sin(mid.angle);
  const[ccx,ccz]=toW(cx+mid.x+ox*2,cy+mid.z+oz*2);
  addCrane(m,{at:[ccx,.95,ccz],rot:mid.angle+Math.PI/2,s:1.1});
  for(const s of[-1,1]){const lx=cx+mid.x-oz*11*s,lz=cy+mid.z+ox*11*s,[lx2,lz2]=toW(lx,lz);
   addLamp(m,{at:[lx2,G(lx,lz)+1.05,lz2]});}
  // conjunto portuário detalhado na cabeceira do trapiche central
  const pp=edge[Math.floor(edge.length/2)+1]||mid;
  const pEx=cx+pp.x+Math.cos(pp.angle)*16,pEy=cy+pp.z+Math.sin(pp.angle)*16;
  const[pmx,pmz]=toW(pEx,pEy);
  const pm=portModel({fortified:false,flag:color});pm.scale.setScalar(1.6*hs);
  pm.position.set(pmx,.4,pmz);pm.rotation.y=-pp.angle;
  extras.push(pm);
 }
 const hg=m.group();hg.name='harbour';
 return {mesh:hg,extras};
}
function landAtSafe(env,mx,my){return env.landAt?env.landAt(mx,my):true}

/* ---------- construção da localidade ---------- */
export function buildTownV2(env){
 const{b,cx,cy,lay,rand,climate,color,G,landAt,toW,addSolid,pathAt,footprintY,special,field,site}=env,style=env.style||STYLES[climate]||STYLES.temperate;
 const m=new Mesher(),placed=[],smoke=[],fields=[],lamps=[],people=[],counts={shop:0,tavern:0,smithy:0};let windmill=null;
 const world=(u,v)=>toW(cx+u,cy+v),flat=(u,v,r)=>{let lo=1e9,hi=-1e9;for(const[dx,dy]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]]){const g=G(cx+u+dx,cy+v+dy);lo=Math.min(lo,g);hi=Math.max(hi,g)}return hi-lo};
 const free=(rc,pad)=>{for(const p of placed)if(rectsOverlap(rc,p,pad))return false;return true};
 const solid=(rc)=>{const long=Math.max(rc.hw,rc.hd),short=Math.min(rc.hw,rc.hd),n=Math.max(1,Math.ceil(long/short*.5)),ax=rc.hw>=rc.hd?axes(rc.r)[0]:axes(rc.r)[1];for(let i=0;i<n;i++){const t=n===1?0:(i/(n-1)-.5)*2*(long-short);addSolid(cx+rc.x+ax[0]*t,cy+rc.z+ax[1]*t,short*.92)}};
 const okPath=(rc)=>{for(const[sx,sz]of[[0,0],[1,1],[1,-1],[-1,1],[-1,-1]]){const ax=axes(rc.r),u=rc.x+ax[0][0]*sx*rc.hw+ax[1][0]*sz*rc.hd,v=rc.z+ax[0][1]*sx*rc.hw+ax[1][1]*sz*rc.hd,[d,c]=pathAt(u,v);if(d>.3||c>.3)return false;if(!landAt(cx+u,cy+v))return false}return true};
 const put=(type,u,v,rot,w,d,floors,opts={})=>{const rc={x:u,z:v,r:rot,hw:w/2,hd:d/2};if(!free(rc,opts.pad??.25)||!okPath(rc)||flat(u,v,Math.min(w,d)/2)>1.6)return false;
  const[x,z]=world(u,v),y=footprintY(cx+u,cy+v,Math.min(w,d)/2)+.05;
  addBuilding(m,{at:[x,y,z],rot,w,d,floors,type,style,R:rand,smoke,gableFront:opts.gableFront});placed.push(rc);solid(rc);return true};
 // ----- frente de água: avenida do cais, antes das casas
 if(lay.kind==='port'&&field&&site&&site.waterKind!=='none'){
  const dir=site.portDir,pts=[];
  for(let k=-7;k<=7;k++){
   const a=dir+k*.05;let edge=null;
   for(let r=lay.Rt*.55;r<lay.Rt*1.5;r+=2){
    if(field.heightM(Math.cos(a)*r*M_PER_UNIT,Math.sin(a)*r*M_PER_UNIT)<.6){edge=r;break}
   }
   if(edge!=null){const back=Math.max(7,edge-9);pts.push([Math.cos(a)*back,Math.sin(a)*back])}
  }
  if(pts.length>=4){
   lay.roads.push({pts,w:2.15*(lay.wide||1),a:dir,main:true,promenade:true});
   const mid=pts[Math.floor(pts.length/2)];
   lay.roads.push({pts:[mid,[mid[0]*.55,mid[1]*.55],[0,0]],w:1.7*(lay.wide||1),a:dir,main:true});
  }
 }
 // ----- marcos centrais
 if(special){placed.push({x:0,z:0,r:0,hw:9,hd:9})}
 else if(lay.fort){const[x,z]=world(0,0);addFort(m,{at:[x,footprintY(cx,cy,9)+.15,z],size:22,flag:color,R:rand});placed.push({x:0,z:0,r:0,hw:13,hd:13});for(let t=-11;t<=11;t+=1.6)for(const[ux,uv]of[[t,-11],[t,11],[-11,t],[11,t]]){if(uv===11&&Math.abs(ux)<2)continue;addSolid(cx+ux,cy+uv,.9)}}
 else{
  const P=lay.plaza,[x0,z0]=world(0,0),gy=G(cx,cy);
  if(lay.center==='well'){addWell(m,{at:[x0,gy+.05,z0],R:rand});addSolid(cx,cy,1.7)}
  else if(lay.center==='market'){addPillar(m,{at:[x0,gy+.05,z0],h:3.6,r:.5});addBanner(m,{at:[x0,gy+3.7,z0],h:1.4,color,scale:.8});addSolid(cx,cy,1.5)}
  else{addFountain(m,{at:[x0,gy+.05,z0]});addSolid(cx,cy,1.8)}
  const dwarven=style===STYLES.dwarven;
  const slots=lay.capital?[['hall',0],['church',2.1],['tavern',-2.1],['market',Math.PI]]:[['church',0],['hall',lay.village?-9:2.4],['tavern',-2.2],['market',Math.PI]];
  for(const[kind,ang]of slots){if(lay.village&&kind==='hall')continue;const a=lay.a0+ang+(lay.a0>1.5?.3:-.3),big=kind==='hall'?7:kind==='church'?6:3.8,dist=P+2.6+big*.75,u=Math.cos(a)*dist,v=Math.sin(a)*dist,rot=Math.atan2(-Math.cos(a),-Math.sin(a)),[x,z]=world(u,v),y=footprintY(cx+u,cy+v,3)+.05;
   if(kind==='market'){for(let i=0;i<(lay.capital?7:lay.village?2:4);i++){const aa=a+(i-2)*.5,uu=Math.cos(aa)*(P*.66),vv=Math.sin(aa)*(P*.66),[xx,zz]=world(uu,vv);addStall(m,{at:[xx,G(cx+uu,cy+vv)+.05,zz],rot:-aa+Math.PI/2,R:rand});addSolid(cx+uu,cy+vv,.9)}continue}
   const rc={x:u,z:v,r:rot,hw:kind==='hall'?4:kind==='church'?3.4:2.5,hd:kind==='hall'?2.7:kind==='church'?6:2.8};if(!free(rc,.3)||!landAt(cx+u,cy+v))continue;
   if(kind==='church')addChurch2(m,{at:[x,y,z],rot,R:rand,style});
   else if(kind==='hall'){lay.capital||dwarven?addKeepHall(m,{at:[x,y,z],flag:color,R:rand}):addTownHall(m,{at:[x,y,z],rot,flag:color,R:rand})}
   else addBuilding(m,{at:[x,y,z],rot,w:5.4,d:5.6,floors:2,type:'tavern',style,R:rand,smoke,gableFront:false});
   placed.push(rc);solid(rc);if(kind==='church'||kind==='hall')lay.landmarks=(lay.landmarks||[]).concat([[u,v]])}
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.3,u=Math.cos(a)*(P*.95),v=Math.sin(a)*(P*.95),[x,z]=world(u,v);addLamp(m,{at:[x,G(cx+u,cy+v)+.05,z]});lamps.push([x,G(cx+u,cy+v)+1.7,z])}
 }
 // ----- distritos: mercado, templo, quartel e oficinas
 {
  const base=lay.a0,dr=Math.max(lay.plaza+5,lay.Rt*.30),dw=Math.max(8,lay.Rt*.24),districts=[];
  const add=(kind,ang,rr,ww)=>districts.push({kind,ang,u:Math.cos(ang)*rr,v:Math.sin(ang)*rr,r:Math.max(7,ww)});
  if(lay.kind!=='fort'){
   add('market',base,dr,dw*1.15);
   add('temple',base+2.05,dr*.92,dw*.9);
  }
  const military=lay.fort||special||!!env.b?.citadel||(lay.walled&&lay.pop>2000);
  if(military)add('military',base+Math.PI*.72,dr*.95,dw);
  add('craft',base-Math.PI*.62,dr*.95,dw);
  add('residential',base+Math.PI,dr*1.05,dw*1.3);
  lay.districts=districts;
  lay.squares=districts.filter(d=>d.kind!=='residential').map(d=>({u:d.u,v:d.v,r:Math.min(d.r*.5,12)}));
  const D=k=>districts.find(d=>d.kind===k);
  const dPut=(d,type,w,dd,fl,pad=.55)=>{
   for(let k=0;k<12;k++){
    const a=d.ang+(k?(k%2?1:-1)*Math.ceil(k/2)*.42:0),rr=d.r*(k<4?.25:.65)*Math.min(1,.9+k*.03);
    const u=d.u+Math.cos(a)*rr,v=d.v+Math.sin(a)*rr;
    if(put(type,u,v,a+Math.PI/2,w,dd,fl,{pad}))return {u,v};
   }
   return null;
  };
  const prop=(kind,u,v)=>{
   const[x,z]=world(u,v),y=G(cx+u,cy+v)+.05;
   if(kind==='wood'){addLog(m,{from:[x-.8,y,z-.2],to:[x+.9,y+.1,z+.4]});addLog(m,{from:[x-.7,y+.3,z+.4],to:[x+.8,y+.2,z-.2]})}
   else if(kind==='metal'){m.box('stone',.8,.45,.55,{at:[x,y,z],tint:tc('#5e5a52')});addBarrel(m,{at:[x+.9,y,z+.4]})}
   else if(kind==='food'){addBarrel(m,{at:[x,y,z]});addBarrel(m,{at:[x+.6,y,z+.3],s:.85});addCrate(m,{at:[x-.6,y,z+.2]})}
   else{addCrate(m,{at:[x,y,z],rot:rand()*.6});addCrate(m,{at:[x+.5,y,z-.3],rot:rand()*.6,s:.8})}
   addSolid(cx+u,cy+v,.8);
  };
  // mercado geral
  {const d=D('market');if(d){
   for(let i=0;i<3;i++){const a=d.ang+(i-1)*.5,rr=d.r*.55,u=d.u+Math.cos(a)*rr,v=d.v+Math.sin(a)*rr;if(!landAt(cx+u,cy+v))continue;const[x,z]=world(u,v);addStall(m,{at:[x,G(cx+u,cy+v)+.05,z],rot:-a+Math.PI/2,R:rand});addSolid(cx+u,cy+v,.8);prop('food',u+.5,v+.5)}
   dPut(d,'warehouse',4.6,5.8,1);
   const[x,z]=world(d.u,d.v);addBanner(m,{at:[x,G(cx+d.u,cy+d.v)+.05,z],h:2.4,color:color,scale:.9});
  }}
  // templo
  {const d=D('temple');if(d){
   const[x,z]=world(d.u,d.v),gy=G(cx+d.u,cy+d.v)+.05;
   m.box('stone',.55,3.1,.55,{at:[x,gy,z],tint:tc(PAL.stone,.96)});
   m.box('stone',1.9,.45,.45,{at:[x,gy+2.15,z],tint:tc(PAL.stone,.96)});
   m.box('gold',.16,.5,.16,{at:[x,gy+2.6,z]});
   addSolid(cx+d.u,cy+d.v,1.3);
   for(const s of[-1,1]){const u=d.u+s*2.2,v=d.v+1.2;if(!landAt(cx+u,cy+v))continue;const[lx,lz]=world(u,v);addLamp(m,{at:[lx,G(cx+u,cy+v)+.05,lz]})}
   dPut(d,'house',3.4,4.2,2,.8);
  }}
  // quartel (quando há estrutura militar)
  {const d=D('military');if(d){
   const at=dPut(d,'barracks',4.8,7.2,2,.7);
   if(at){const[x,z]=world(at.u,at.v);addBanner(m,{at:[x+1.4,G(cx+at.u,cy+at.v)+5.2,z],h:2.6,color,scale:.9})}
   for(let i=0;i<3;i++){const a=d.ang-.4+i*.4,u=d.u+Math.cos(a)*d.r*.75,v=d.v+Math.sin(a)*d.r*.75;if(!landAt(cx+u,cy+v))continue;
    const[x,z]=world(u,v),y=G(cx+u,cy+v)+.03;addLog(m,{from:[x-.4,y,z],to:[x+.4,y+1.6,z-.2],t:.18});addPillar(m,{at:[x,y,z],h:.7,r:.2});addSolid(cx+u,cy+v,.5)}
   const a0=d.ang+d.r*.9/Math.max(1,d.u||1),fence=[];
   for(let i=0;i<4;i++){const a=d.ang-.6+i*.4;fence.push([d.u+Math.cos(a)*d.r*.8,d.v+Math.sin(a)*d.r*.8])}
   for(let i=1;i<fence.length;i++){if(!landAt(cx+fence[i-1][0],cy+fence[i-1][1]))continue;const[p1x,p1z]=world(fence[i-1][0],fence[i-1][1]),[p2x,p2z]=world(fence[i][0],fence[i][1]);addFence(m,{a:[p1x,p1z],b:[p2x,p2z],y0:G(cx+fence[i][0],cy+fence[i][1]),R:rand})}
  }}
  // oficinas: o tipo segue a produção da cidade
  {const d=D('craft');if(d){
   const goods=env.production||[];const top=(goods[0]||'').toLowerCase();
   const kind=/ferro|aço|arma|ferramenta|metal|ourives/.test(top)?'metal':/madeira|lenha|carvão|tábua/.test(top)?'wood':/trigo|grão|pão|cerveja|peixe|carne|sal|vinho|azeite/.test(top)?'food':'goods';
   dPut(d,'smithy',4.2,5.2,1,.6);
   const at=dPut(d,'warehouse',4.4,5.8,1,.6);
   if(at)prop(kind,at.u+1.2,at.v+1.2);
   if(at&&kind==='metal')prop('metal',at.u-1.4,at.v+1.2);
   if(at&&kind==='wood')prop('wood',at.u+1.4,at.v-1.2);
  }}
 }

 // ----- casas ao longo das ruas (núcleo detalhado)
 let count=placed.length;const target=lay.N,limit=lay.coreR*1.02;
 const order=lay.roads.slice().sort((a,c)=>(c.ring?3:c.main?2:c.cross?1:0)-(a.ring?3:a.main?2:a.cross?1:0));
 for(const rd of order){if(count>=target)break;const pp=pointsAlong(rd.pts);
  for(const side of[1,-1]){if(rd.ring&&side===1)continue;let s=rd.ring?0:lay.plaza*.9+3;
   while(s<pp.total-2&&count<target){const q=pp.at(s),r=Math.hypot(q.x,q.y);if(r>limit){s+=5;continue}
    const core=r<lay.Rt*.32,mid=r<lay.Rt*.7,w=(core?3.3:2.9)+rand()*(core?2.1:1.6),d=(core?4.6:4)+rand()*2.2,nx=-q.ty,ny=q.tx;
    const setback=rd.w+(core?.5:mid?1.6:3)+d/2,sd=rd.ring?-1:side;
    const u=q.x+nx*sd*setback,v=q.y+ny*sd*setback,rot=Math.atan2(-nx*sd,-ny*sd);
    let type='house',floors=core?2+(rand()<.4?1:0):1+(rand()<.35?1:0);
    if(rand()<(core?.24:.05)&&counts.shop<18){type='shop';counts.shop++}else if(!core&&!mid&&rand()<.05&&counts.smithy<2){type='smithy';counts.smithy++;floors=1}else if(core&&rand()<.04&&counts.tavern<2){type='tavern';counts.tavern++}
    if(put(type,u,v,rot,w,d,floors,{pad:core?.12:.5})){count++;if(!core&&rand()<.55){const[x,z]=world(u+nx*sd*(d/2+2.2),v+ny*sd*(d/2+2.2));if(landAt(cx+u+nx*sd*(d/2+2.2),cy+v+ny*sd*(d/2+2.2))&&rand()<.4)addHaystack(m,{at:[x,G(cx+u+nx*sd*(d/2+2.2),cy+v+ny*sd*(d/2+2.2))+.05,z],s:.8})}}
    s+=w+(core?.15+rand()*.25:mid?.8+rand()*1.2:2.2+rand()*3.2)}}}
 // ----- bairros soltos no núcleo
 for(let tries=0;count<target&&tries<700;tries++){const a=rand()*6.28,r=lay.coreR*(.35+rand()*.6),u=Math.cos(a)*r,v=Math.sin(a)*r;if(put('house',u,v,Math.atan2(-Math.cos(a),-Math.sin(a))+(rand()-.5)*.7,2.9+rand()*1.5,3.7+rand()*1.7,1+(rand()<.3?1:0)))count++}
 // ----- campos e granjas no entorno
 {const nf=lay.village?2:lay.capital?7:5;
  for(let i=0,k=0;i<nf&&k<160;k++){
   const a=rand()*6.28,r=lay.Rt*(1.12+rand()*.55);
   const u=Math.cos(a)*r,v=Math.sin(a)*r,rot=Math.atan2(-Math.cos(a),-Math.sin(a));
   if(!landAt(cx+u,cy+v))continue;
   if(!put('barn',u,v,rot,4.4,6.4,1,{pad:1.6,gableFront:true}))continue;
   i++;
   put('house',u+Math.cos(a+1.57)*7,v+Math.sin(a+1.57)*7,rot,3.1,3.9,1+(rand()<.3?1:0),{pad:1});
   const fw=10+rand()*6,fd=8+rand()*6,fu=u-Math.cos(a)*11,fv=v-Math.sin(a)*11,fr={x:fu,z:fv,r:rot,hw:fw/2,hd:fd/2};
   if(free(fr,.5)&&landAt(cx+fu,cy+fv)&&flat(fu,fv,5)<2){placed.push(fr);fields.push({x:fu,y:fv,w:fw,d:fd,rot,hue:rand()});
    const ax=axes(rot),c4=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz])=>world(fu+ax[0][0]*sx*fw/2+ax[1][0]*sz*fd/2,fv+ax[0][1]*sx*fw/2+ax[1][1]*sz*fd/2));
    for(let j=0;j<4;j++){const p=c4[j],q=c4[(j+1)%4];addFence(m,{a:p,b:q,y0:G(cx+fu,cy+fv),R:rand})}
   }
  }
 }
 // ----- moinho no ponto mais alto próximo
 {let best=null;for(let t=0;t<60;t++){const a=rand()*6.28,r=lay.Rt*(1.05+rand()*.8),u=Math.cos(a)*r,v=Math.sin(a)*r;if(!landAt(cx+u,cy+v))continue;const g=G(cx+u,cy+v),rc={x:u,z:v,r:0,hw:2.4,hd:2.4};if(free(rc,2)&&(!best||g>best.g))best={u,v,g,rc,a}}
  if(best&&!lay.fort&&!lay.village){placed.push(best.rc);addSolid(cx+best.u,cy+best.v,2.4);const[x,z]=world(best.u,best.v);windmill={x,z,y:footprintY(cx+best.u,cy+best.v,2)+.05,rot:Math.PI/3+(rand()-.5)}}}
 // ----- muralhas no limite da cidade
 let wallR=0;const mm=new Mesher();
 if(lay.walled){wallR=lay.Rt*1.02;const segs=clamp(Math.round(wallR*.9),48,260),gates=lay.roads.filter(r=>r.main&&!r.ring).map(r=>r.a),pts=[];
  for(let i=0;i<=segs;i++){const a=i/segs*Math.PI*2;pts.push([cx+Math.cos(a)*wallR,cy+Math.sin(a)*wallR,a])}
  for(let i=0;i<segs;i++){const a=pts[i],c=pts[i+1],mid=(a[2]+c[2])/2;if(gates.some(g=>Math.abs(Math.atan2(Math.sin(mid-g),Math.cos(mid-g)))<.05))continue;if(!landAtSafe(env,a[0],a[1])||!landAtSafe(env,c[0],c[1]))continue;
   const[ax,az]=toW(a[0],a[1]),[bx,bz]=toW(c[0],c[1]);addWallSegment(mm,{a:[ax,az],b:[bx,bz],y:Math.min(G(a[0],a[1]),G(c[0],c[1])),h:3.1,t:1});addSolid((a[0]+c[0])/2,(a[1]+c[1])/2,wallR*Math.PI*2/segs*.5)}
  for(let i=0;i<segs;i+=Math.max(5,Math.round(segs/16))){if(!landAtSafe(env,pts[i][0],pts[i][1]))continue;const[tx,tz]=toW(pts[i][0],pts[i][1]);addTower(mm,{at:[tx,G(pts[i][0],pts[i][1]),tz],r:1.5,h:5,sides:9,cap:'roof',capH:2.6,tint:tc(PAL.stone,.95),slits:true});addSolid(pts[i][0],pts[i][1],1.6)}
  for(const g of gates){const gx=cx+Math.cos(g)*wallR,gy=cy+Math.sin(g)*wallR;if(!landAtSafe(env,gx,gy))continue;const[tx,tz]=toW(gx,gy);for(const s of[-1,1]){const px=gx+Math.cos(g+Math.PI/2)*s*2.6,py=gy+Math.sin(g+Math.PI/2)*s*2.6,[ux,uz]=toW(px,py);addTower(mm,{at:[ux,G(px,py),uz],r:1.25,h:5.4,sides:8,cap:'roof',capH:2.2,tint:tc(PAL.stone,.97),slits:true});addSolid(px,py,1.3)}}}
 // ----- lampiões nas avenidas (moderados: uma cidade grande não precisa de 800 postes)
 let lampCount=0;
 for(const rd of lay.roads.filter(r=>r.main&&!r.ring)){
  const pp=pointsAlong(rd.pts),step=Math.max(18,lay.Rt*.055);
  for(let s=lay.plaza+5;s<Math.min(pp.total,lay.Rt*1.02)&&lampCount<150;s+=step){
   const q=pp.at(s),u=q.x-q.ty*(rd.w+.9),v=q.y+q.tx*(rd.w+.9);
   if(!landAt(cx+u,cy+v))continue;
   const[x,z]=world(u,v),y=G(cx+u,cy+v);
   addLamp(m,{at:[x,y+.02,z]});lamps.push([x,y+1.7,z]);lampCount++;
  }
 }
 // ----- malha urbana da periferia
 const fabric=addFabric(env);
 // ----- porto
 let harbour=null;try{harbour=buildHarbour({...env,cx,cy,style})}catch(err){console.warn('porto:',err)}
 // ----- moradores (só em ruas de terra firme)
 const walkable=lay.roads.filter(rd=>rd.pts.every(([u,v])=>landAt(cx+u,cy+v)&&(!field||field.heightM(u*M_PER_UNIT,v*M_PER_UNIT)>.9)));
 const npc=0;   // sem pedestres: a cena fica mais limpa e o lugar mais crível
 const mainPool=walkable.filter(rd=>rd.main&&!rd.ring);
 for(let i=0;i<npc;i++){
  const pool=(i%5<3&&mainPool.length)?mainPool:(walkable.length?walkable:lay.roads),rd=pool[Math.floor(rand()*pool.length)],p=rd.pts;
  const t=rand()*(p.length-1),off=(rand()-.5)*rd.w*1.1;
  people.push({path:p,rd,t,dir:rand()<.5?1:-1,sp:.55+rand()*.75,off,col:new THREE.Color(['#8c4f3a','#4b6a7a','#7b7a52','#a27a4f','#5d4f6e','#6e6a5a','#9a5a5a','#3f6b4a'][i%8]),ph:rand()*6.28});
 }
 const groups=[m.group()];if(Object.keys(mm.k).length)groups.push(mm.group());
 if(fabric.count)groups.push(fabric.group);
 if(harbour){groups.push(harbour.mesh,...harbour.extras)}
 return{groups,people,fields,windmill,smoke,lamps,wallR,placed,fabric:fabric.count};
}

/* ---------- pontos de interesse do ermo ---------- */
export function buildWildFeatures(env){
 const{cx,cy,R,rand,climate,G,landAt,toW,addSolid,steep,field}=env,m=new Mesher(),lamps=[],style=STYLES[climate]||STYLES.temperate,used=[],list=[];
 const spot=(minD,maxD)=>{for(let t=0;t<80;t++){const a=rand()*6.28,r=minD+rand()*(maxD-minD),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(!landAt(x,y)||steep(x,y))continue;if(field&&field.shoreM((x-cx)*M_PER_UNIT,(y-cy)*M_PER_UNIT)<20)continue;if(used.some(p=>Math.hypot(p[0]-x,p[1]-y)<45))continue;used.push([x,y]);return[x,y,a]}return null};
 const W=(x,y)=>toW(x,y);
 const kinds={
  camp:(x,y)=>{const[wx,wz]=W(x-cx,y-cy),g=G(x,y)+.03;m.cyl('stone',.75,.8,.18,9,{at:[wx,g,wz],tint:tc('#5a5750')});m.cyl('wood',.12,.1,.5,5,{at:[wx,g+.1,wz],tint:tc('#4a3a2c')});m.box('glass',.22,.34,.22,{at:[wx,g+.16,wz]});lamps.push([wx,g+.6,wz]);
   for(let i=0;i<2;i++){const a=i*2.6+rand(),tx=x+Math.cos(a)*3.2,ty=y+Math.sin(a)*3.2,[ux,uz]=W(tx-cx,ty-cy);addTent(m,{at:[ux,G(tx,ty)+.02,uz],rot:a,color:i?'#b6483c':'#6f8a5e'});addSolid(tx,ty,1.2)}
   for(let i=0;i<3;i++){const a=3.5+i*.7,lx=x+Math.cos(a)*1.9,ly=y+Math.sin(a)*1.9,[ux,uz]=W(lx-cx,ly-cy);addLog(m,{from:[ux-.5,G(lx,ly),uz-.2],to:[ux+.5,G(lx,ly),uz+.3]})}addSolid(x,y,1.1)},
  ruins:(x,y)=>{for(let i=0;i<9;i++){const a=i/9*Math.PI*2,rx=x+Math.cos(a)*6,ry=y+Math.sin(a)*6;if(!landAt(rx,ry))continue;const[ux,uz]=W(rx-cx,ry-cy);if(i%3===0)addPillar(m,{at:[ux,G(rx,ry),uz],h:2+rand()*1.2,broken:rand()<.5});else{const[vx,vz]=W(x+Math.cos(a+.35)*6-cx,y+Math.sin(a+.35)*6-cy);addWallSegment(m,{a:[ux,uz],b:[vx,vz],y:G(rx,ry),h:.8+rand()*1.4,t:.8,crenel:false})}addSolid(rx,ry,1)}
   const[ux,uz]=W(x-cx,y-cy);m.box('stone',1.6,.9,.9,{at:[ux,G(x,y),uz],tint:tc(PAL.stone,.8)});addSolid(x,y,1.3)},
  stones:(x,y)=>{for(let i=0;i<8;i++){const a=i/8*Math.PI*2,sx=x+Math.cos(a)*5,sy=y+Math.sin(a)*5;if(!landAt(sx,sy))continue;const[ux,uz]=W(sx-cx,sy-cy),h=2.2+rand()*1.3;m.box('stone',.8,h,.5,{at:[ux,G(sx,sy)-.2,uz],rot:-a,tint:tc('#9a968a',.9+rand()*.2)});addSolid(sx,sy,.6)}
   const[ux,uz]=W(x-cx,y-cy);m.box('stone',1.6,.8,1.6,{at:[ux,G(x,y),uz],tint:tc('#8f8b80')});m.box('glass',.3,.2,.3,{at:[ux,G(x,y)+.8,uz]});addSolid(x,y,1.4)},
  hut:(x,y)=>{const[ux,uz]=W(x-cx,y-cy),rot=rand()*6.28;addBuilding(m,{at:[ux,G(x,y)+.05,uz],rot,w:3,d:3.6,floors:1,type:'house',style,R:rand});addSolid(x,y,2.1);
   for(let i=0;i<3;i++){const a=rot+2+i*.5,bx=x+Math.cos(a)*3.2,by=y+Math.sin(a)*3.2,[vx,vz]=W(bx-cx,by-cy);addBarrel(m,{at:[vx,G(bx,by)+.03,vz]})}},
  tower:(x,y)=>{const[ux,uz]=W(x-cx,y-cy),g=G(x,y);addTower(m,{at:[ux,g,uz],r:1.7,h:7,sides:9,cap:'roof',capH:2.8,tint:tc(PAL.stone,.9),slits:true,crenel:false});addBanner(m,{at:[ux,g+9.8,uz],h:1.6,color:'#8a3a3a',scale:.8});addSolid(x,y,2)}
 };
 const menu={temperate:['camp','ruins','hut','stones'],tropical:['camp','hut','ruins'],arid:['ruins','camp','stones','tower'],cold:['camp','hut','stones','tower'],alpine:['tower','camp','stones','hut'],wet:['hut','camp','ruins'],grass:['camp','ruins','hut','stones'],boreal:['camp','hut','stones','ruins'],tundra:['stones','camp','ruins'],ice:['stones','camp'],dead:['ruins','stones','camp'],ash:['tower','ruins','camp']}[climate]||['camp','ruins','hut','stones'];
 const n=4+Math.floor(rand()*3);for(let i=0;i<n;i++){const s=spot(Math.max(90,R*.35),R*.9);if(!s)continue;const k=menu[(i+Math.floor(rand()*3))%menu.length];kinds[k](s[0],s[1]);list.push(k)}
 return{group:m.group(),lamps,list};
}
