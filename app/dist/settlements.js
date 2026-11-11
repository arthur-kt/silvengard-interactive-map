// Silvengard · v34 — modelos de localidades (casas, torres, fortalezas, portos) com materiais procedurais.
// Tudo é gerado em código (sem imagens): alvenaria, telhas, reboco, madeira e palha são calculados no shader
// a partir de coordenadas locais de cada edifício, para o padrão acompanhar as paredes em qualquer rotação.
import * as THREE from 'three';
import {shared,NOISE} from './visuals.js?v=56';

export const PAL={stone:'#dfcba2',cobble:'#b9aa8c',plaster:'#f1e8d0',roof:'#76584b',roofRed:'#8a5a46',wood:'#79664e',woodDark:'#4f4030',gold:'#d8b977',glass:'#25343b',thatch:'#c9b06a',cloth:'#b6483c',cloth2:'#e6d8b0'};
export const rng=seed=>{let a=(seed|0)+0x6D2B79F5;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
export const tc=(hex,v=1)=>{const c=new THREE.Color(hex).multiplyScalar(v);return[c.r,c.g,c.b]};
const KIND_TINT={glass:tc('#25343b'),gold:tc('#d8b977'),water:tc('#3f8aa0')};

/* ---------- geometria ---------- */
function boxTris(w,h,d){const x=w/2,z=d/2,P=[],N=[];const f=(n,a,b,c,e)=>{for(const v of[a,b,c,a,c,e]){P.push(...v);N.push(...n)}};
 f([0,0,1],[-x,0,z],[x,0,z],[x,h,z],[-x,h,z]);f([0,0,-1],[x,0,-z],[-x,0,-z],[-x,h,-z],[x,h,-z]);
 f([1,0,0],[x,0,z],[x,0,-z],[x,h,-z],[x,h,z]);f([-1,0,0],[-x,0,-z],[-x,0,z],[-x,h,z],[-x,h,-z]);
 f([0,1,0],[-x,h,z],[x,h,z],[x,h,-z],[-x,h,-z]);f([0,-1,0],[-x,0,-z],[x,0,-z],[x,0,z],[-x,0,z]);return[P,N]}
function gableTris(w,h,d,o){const X=w/2+o,Z=d/2+o,L=Math.hypot(Z,h),ny=Z/L,nz=h/L,S=[],SN=[],E=[],EN=[];
 const q=(n,a,b,c,e)=>{for(const v of[a,b,c,a,c,e]){S.push(...v);SN.push(...n)}};
 q([0,ny,nz],[-X,0,Z],[X,0,Z],[X,h,0],[-X,h,0]);q([0,ny,-nz],[X,0,-Z],[-X,0,-Z],[-X,h,0],[X,h,0]);
 const x=w/2,z=d/2;for(const v of[[x,0,z],[x,0,-z],[x,h,0]]){E.push(...v);EN.push(1,0,0)}for(const v of[[-x,0,-z],[-x,0,z],[-x,h,0]]){E.push(...v);EN.push(-1,0,0)}
 return{S,SN,E,EN}}
function cylTris(r0,r1,h,n,cap){const P=[],N=[],s=(r0-r1)/h,il=1/Math.hypot(1,s);
 for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
  const b1=[r0*c1,0,r0*s1],b0=[r0*c0,0,r0*s0],t0=[r1*c0,h,r1*s0],t1=[r1*c1,h,r1*s1],n0=[c0*il,s*il,s0*il],n1=[c1*il,s*il,s1*il];
  for(const[v,nn]of[[b1,n1],[b0,n0],[t0,n0],[b1,n1],[t0,n0],[t1,n1]]){P.push(...v);N.push(...nn)}
  if(cap&&r1>0){for(const v of[[0,h,0],t1,t0]){P.push(...v);N.push(0,1,0)}}}
 return[P,N]}

/* ---------- materiais procedurais ---------- */
const PATTERN={
stone:`vec2 uv=triUV(bLoc,bN);float rowH=.34;float row=floor(uv.y/rowH);float bw=.75+.4*atlasHash(vec2(row,3.));
 float u=uv.x/bw+atlasHash(vec2(row,7.))*9.;float blk=floor(u);float eu=min(fract(u),1.-fract(u))*bw,ev=min(fract(uv.y/rowH),1.-fract(uv.y/rowH))*rowH;
 float mortar=1.-smoothstep(.014,.04,min(eu,ev));float tone=atlasHash(vec2(blk,row))*.24-.12;float gr=atlasFbm(uv*3.1);
 bMul=vec3((1.+tone)*(1.-.45*gr))*mix(1.,.5,mortar)*(.94+.1*atlasNoise(uv*26.));bH=-mortar*.8+atlasNoise(uv*16.)*.25;bA=.035;`,
plaster:`vec2 uv=triUV(bLoc,bN);float gr=atlasFbm(uv*vec2(1.3,1.1));float dirt=(1.-smoothstep(0.,1.3,bLoc.y))*.22;
 float crack=1.-smoothstep(.0,.018,abs(atlasNoise(uv*4.7)-.5));float lime=smoothstep(.55,.8,atlasFbm(uv*1.4+4.));
 bMul=vec3((1.04-.14*gr)*(1.-dirt)*(1.-.16*crack)*(1.+.05*lime)*(.96+.08*atlasNoise(uv*30.)));bH=atlasFbm(uv*9.)*.5-crack*.4;bA=.02;`,
roof:`vec2 uv=triUV(bLoc,bN);float rowH=.26;float row=floor(uv.y/rowH);float off=mod(row,2.)*.5;float u=uv.x/.34+off;float tile=floor(u);
 float fu=fract(u),fv=fract(uv.y/rowH);float edge=smoothstep(0.,.07,min(fu,1.-fu));float lap=mix(.58,1.,smoothstep(0.,.55,fv));
 float tone=atlasHash(vec2(tile,row))*.28-.14;float moss=smoothstep(.62,.82,atlasFbm(uv*.9+2.));
 bMul=vec3((1.+tone)*lap*mix(.5,1.,edge))*mix(vec3(1.),vec3(.72,.95,.7),moss*.6);bH=lap*.5+edge*.5;bA=.05;`,
wood:`vec2 uv=triUV(bLoc,bN);float pl=floor(uv.x/.22);float fu=fract(uv.x/.22);float gap=1.-smoothstep(0.,.06,min(fu,1.-fu));
 float gr=atlasNoise(vec2(uv.x*7.+pl*13.,uv.y*.8));float tone=atlasHash(vec2(pl,1.))*.22-.11;
 bMul=vec3((.78+.34*gr+tone)*(1.-gap*.5));bH=-gap+gr*.3;bA=.025;`,
thatch:`vec2 uv=triUV(bLoc,bN);float st=atlasNoise(vec2(uv.x*26.,uv.y*3.2));float bands=.5+.5*sin(uv.y*18.+atlasNoise(uv*4.)*3.);
 bMul=vec3(.7+.4*st)*(.88+.14*bands);bH=st*.8+bands*.2;bA=.05;`,
glass:`bMul=vec3(1.);`,gold:`bMul=vec3(1.);`,water:`bMul=vec3(.92+.16*atlasNoise(bLoc.xz*5.));`,
cloth:`vec2 uv=triUV(bLoc,bN);float w=.5+.5*sin(uv.x*26.)*sin(uv.y*26.);bMul=vec3(.9+.14*w)*(1.-.18*(1.-smoothstep(0.,.9,bLoc.y)));bH=w*.3;bA=.01;`
};
const cache=new Map();
export function buildingMaterial(kind,{baked=false,color=null}={}){
 const key=kind+(baked?':b:'+(color?color.getHexString():''):'');if(cache.has(key))return cache.get(key);
 const m=new THREE.MeshStandardMaterial({vertexColors:!baked,roughness:kind==='glass'?.25:kind==='water'?.12:kind==='gold'?.34:kind==='roof'?.88:.94,metalness:kind==='gold'?.55:0,side:kind==='roof'||kind==='cloth'||kind==='thatch'?THREE.DoubleSide:THREE.FrontSide});
 if(color)m.color.copy(color);
 m.customProgramCacheKey=()=>'bld:'+kind+(baked?':b':'');
 m.onBeforeCompile=shader=>{
  shader.uniforms.uTime=shared.uTime;shader.uniforms.uNight=shared.uNight;
  const wave=kind==='cloth'?'\ntransformed.z+=sin(uTime*3.+transformed.x*2.6)*.13*clamp(transformed.x/1.1,0.,1.);':'';
  shader.vertexShader=`uniform float uTime;varying vec3 vLoc;varying vec3 vLn;${baked?'':'attribute vec3 aLoc;attribute vec3 aLn;'}\n`+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvLoc=${baked?'position':'aLoc'};vLn=${baked?'normal':'aLn'};${wave}`);
  shader.fragmentShader=`varying vec3 vLoc;varying vec3 vLn;uniform float uNight;\n${NOISE}\nvec2 triUV(vec3 p,vec3 n){vec3 a=abs(n);return a.y>.55?p.xz:(a.x>a.z?p.zy:p.xy);}\n`+shader.fragmentShader
  .replace('#include <color_fragment>',`#include <color_fragment>
  vec3 bN=normalize(vLn),bLoc=vLoc,bMul=vec3(1.);float bH=0.,bA=0.;float bLod=1.-smoothstep(70.,260.,length(vViewPosition));
  ${PATTERN[kind]}
  diffuseColor.rgb*=mix(vec3(1.),bMul,bLod);`)
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  if(bA>0.){float hh=bH*bA*bLod;vec3 dpdx=dFdx(-vViewPosition),dpdy=dFdy(-vViewPosition);vec3 r1=cross(dpdy,normal),r2=cross(normal,dpdx);float det=dot(dpdx,r1);
   normal=normalize(abs(det)*normal-sign(det)*(dFdx(hh)*r1+dFdy(hh)*r2));}`)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\n${kind==='glass'?'totalEmissiveRadiance+=vec3(1.,.62,.24)*uNight*(.6+.4*atlasNoise(vLoc.xy*3.+vLoc.z))*1.1;':''}`);
 };
 cache.set(key,m);return m;
}
/** Dá alvenaria/telhas aos modelos antigos (torre de magos, fortaleza anã) sem mexer na geometria. */
export function retexture(root){root.traverse(o=>{if(!o.isMesh||!o.material?.isMeshStandardMaterial||o.userData.retex)return;const m=o.material;if(m.emissive&&m.emissive.getHex()>0)return;
 const hsl={};m.color.getHSL(hsl);const kind=hsl.h<.12&&hsl.s>.18&&hsl.l<.45?'roof':hsl.l<.2?'wood':'stone';o.material=buildingMaterial(kind,{baked:true,color:m.color});o.userData.retex=true;o.castShadow=o.receiveShadow=true})}

/* ---------- construtor de malhas fundidas ---------- */
export class Mesher{
 constructor(){this.k={}}
 B(kind){return this.k[kind]??={p:[],n:[],l:[],ln:[],c:[]}}
 push(kind,P,N,o={}){const b=this.B(kind),[ax,ay,az]=o.at||[0,0,0],cr=Math.cos(o.rot||0),sr=Math.sin(o.rot||0),t=KIND_TINT[kind]||o.tint||[1,1,1],lo=o.loc||[0,0,0],sc=o.scale||1;
  for(let i=0;i<P.length;i+=3){const x=P[i]*sc,y=P[i+1]*sc,z=P[i+2]*sc,nx=N[i],ny=N[i+1],nz=N[i+2];
   b.p.push(ax+x*cr+z*sr,ay+y,az-x*sr+z*cr);b.n.push(nx*cr+nz*sr,ny,-nx*sr+nz*cr);b.l.push(x+lo[0],y+lo[1],z+lo[2]);b.ln.push(nx,ny,nz);b.c.push(t[0],t[1],t[2])}}
 box(kind,w,h,d,o){const[P,N]=boxTris(w,h,d);this.push(kind,P,N,o)}
 cyl(kind,r0,r1,h,n,o,cap=true){const[P,N]=cylTris(r0,r1,h,n,cap);this.push(kind,P,N,o)}
 gable(kind,wallKind,w,h,d,over,o,wallTint){const g=gableTris(w,h,d,over);this.push(kind,g.S,g.SN,o);this.push(wallKind,g.E,g.EN,{...o,tint:wallTint||o.tint})}
 quad(kind,w,h,o){const P=[],N=[];for(const v of[[0,0,0],[w,0,0],[w,h,0],[0,0,0],[w,h,0],[0,h,0]]){P.push(...v);N.push(0,0,1)}this.push(kind,P,N,o)}
 shed(kind,w,h,d,o){const x=w/2,z=d/2,L=Math.hypot(d,h),ny=d/L,nz=h/L,P=[],N=[];for(const v of[[-x,0,z],[x,0,z],[x,h,-z],[-x,0,z],[x,h,-z],[-x,h,-z]]){P.push(...v);N.push(0,ny,nz)}this.push(kind,P,N,o)}
 beam(kind,p0,p1,t,o={}){const dx=p1[0]-p0[0],dy=p1[1]-p0[1],dz=p1[2]-p0[2],L=Math.hypot(dx,dy,dz);if(L<1e-4)return;const[P,N]=boxTris(t,L,t),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx/L,dy/L,dz/L)),v=new THREE.Vector3(),P2=[],N2=[];
  for(let i=0;i<P.length;i+=3){v.set(P[i],P[i+1],P[i+2]).applyQuaternion(q);P2.push(v.x+p0[0],v.y+p0[1],v.z+p0[2]);v.set(N[i],N[i+1],N[i+2]).applyQuaternion(q);N2.push(v.x,v.y,v.z)}this.push(kind,P2,N2,o)}
 group(){const g=new THREE.Group();for(const[kind,b]of Object.entries(this.k)){if(!b.p.length)continue;const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));
  geo.setAttribute('aLoc',new THREE.Float32BufferAttribute(b.l,3));geo.setAttribute('aLn',new THREE.Float32BufferAttribute(b.ln,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));
  const mesh=new THREE.Mesh(geo,buildingMaterial(kind));mesh.castShadow=mesh.receiveShadow=true;mesh.userData.kind=kind;g.add(mesh)}return g}
}
const rel=(at,rot,dx,dy,dz)=>{const c=Math.cos(rot),s=Math.sin(rot);return[at[0]+dx*c+dz*s,at[1]+dy,at[2]-dx*s+dz*c]};

/* ---------- peças ---------- */
export function addHouse(m,{at,rot=0,w=1.8,d=2.2,h=1.7,roof=1.1,level=0,stone=false,R=Math.random,thatch=false}){
 const seed=R()*50,lo=[seed*3.1,seed*1.7,seed*4.3],wk=stone?'stone':'plaster',base=stone?PAL.stone:PAL.plaster,v=.86+R()*.22,hue=R();
 const wt=tc(hue<.25?'#e2cfa5':hue<.5?'#e9dcc0':hue<.75?'#d8c6a0':'#eadfc4',v),rt=tc(R()<.35?PAL.roofRed:PAL.roof,.85+R()*.3),wd=tc(PAL.wood,.9+R()*.2);
 m.box('stone',w+.14,1.1,d+.14,{at:[at[0],at[1]-.95,at[2]],rot,tint:tc(PAL.stone,.78),loc:lo});
 m.box(wk,w,h,d,{at,rot,tint:wt,loc:lo});
 m.gable(thatch?'thatch':'roof',wk,w,roof,d,.22,{at:[at[0],at[1]+h,at[2]],rot,tint:thatch?tc(PAL.thatch,.9+R()*.2):rt,loc:lo},wt);
 m.box(level?'wood':'wood',.5,1.0,.08,{at:rel(at,rot,(R()-.5)*w*.4,0,d/2+.02),rot,tint:tc(PAL.woodDark,1),loc:lo});
 if(level>=1){
  for(const sx of[-1,1])for(const sz of[-1,1])m.box('wood',.11,h,.11,{at:rel(at,rot,sx*(w/2),0,sz*(d/2)),rot,tint:wd,loc:lo});
  if(!stone)for(const sz of[-1,1])m.box('wood',w+.02,.1,.07,{at:rel(at,rot,0,h*.52,sz*(d/2+.01)),rot,tint:wd,loc:lo});
  for(const sz of[-1,1])for(const sx of[-1,1]){const p=rel(at,rot,sx*w*.26,h*.52,sz*(d/2+.03));m.box('glass',.34,.4,.05,{at:p,rot,tint:[1,1,1]});
   m.box('wood',.1,.4,.07,{at:rel(at,rot,sx*w*.26-.25,h*.52,sz*(d/2+.03)),rot,tint:wd});m.box('wood',.1,.4,.07,{at:rel(at,rot,sx*w*.26+.25,h*.52,sz*(d/2+.03)),rot,tint:wd});m.box('wood',.5,.07,.12,{at:rel(at,rot,sx*w*.26,h*.52-.08,sz*(d/2+.04)),rot,tint:wd})}
  m.box('stone',.34,roof*.8+.3,.34,{at:rel(at,rot,w*.28,h+roof*.35,0),rot,tint:tc(PAL.stone,.85),loc:lo});
  m.box('stone',.55,.12,.4,{at:rel(at,rot,0,0,d/2+.3),rot,tint:tc(PAL.stone,.8)});
 }
}
export function addTower(m,{at,r=1,h=4,sides=8,cap='roof',capH=2,crenel=false,tint=tc(PAL.stone),capTint,slits=false}){
 m.cyl('stone',r*1.08,r*.96,h,sides,{at,tint,loc:[at[0]*.7,0,at[2]*.7]},false);
 if(crenel){for(let i=0;i<sides*2;i++){const a=i/(sides*2)*Math.PI*2;m.box('stone',.42,.42,.3,{at:[at[0]+Math.cos(a)*r*.98,at[1]+h,at[2]+Math.sin(a)*r*.98],rot:-(a+Math.PI/2),tint})}m.cyl('stone',r*1.05,r*1.05,.12,sides,{at:[at[0],at[1]+h-.12,at[2]],tint:tc(PAL.stone,.85)});}
 else m.cyl(cap==='gold'?'gold':'roof',r*1.35,0,capH,sides,{at:[at[0],at[1]+h,at[2]],tint:capTint||(cap==='gold'?[1,1,1]:tc(PAL.roof)),loc:[at[0],0,at[2]]});
 if(slits)for(let i=0;i<3;i++){const a=i*2.1+.4;m.box('glass',.08,.5,.06,{at:[at[0]+Math.cos(a)*r*1.0,at[1]+h*.6,at[2]+Math.sin(a)*r*1.0],rot:-(a+Math.PI/2)})}
}
export function addPyramidTower(m,{at,w=2.4,h=6,cap='gold',capH=2.8,tint=tc(PAL.stone)}){
 m.box('stone',w,h,w,{at,tint});m.box('stone',w+.34,.5,w+.34,{at:[at[0],at[1]+h-.1,at[2]],tint:tc(PAL.stone,.9)});
 m.cyl(cap==='gold'?'gold':'roof',w*.82,0,capH,4,{at:[at[0],at[1]+h+.4,at[2]],rot:Math.PI/4,tint:cap==='gold'?[1,1,1]:tc(PAL.roof)});
 for(const s of[-1,1])m.box('glass',.34,.7,.05,{at:[at[0],at[1]+h*.72,at[2]+s*(w/2+.02)]}),m.box('glass',.05,.7,.34,{at:[at[0]+s*(w/2+.02),at[1]+h*.72,at[2]]});
}
export function addBanner(m,{at,h=3,color='#c0392b',scale=1}){m.cyl('wood',.05*scale,.05*scale,h,5,{at},true);m.quad('cloth',1.3*scale,.8*scale,{at:[at[0],at[1]+h-.85*scale,at[2]],tint:tc(color)})}
export function addWallSegment(m,{a,b,h=2.8,t=.8,y=0,tint=tc(PAL.stone,.94),crenel=true}){
 const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),rot=Math.atan2(-dz,dx),cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2;
 m.box('stone',L,h+1.2,t,{at:[cx,y-1.2,cz],rot,tint,loc:[cx*.5,0,cz*.5]});
 if(crenel){const n=Math.max(1,Math.floor(L/1.2));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;if(i%2)continue;m.box('stone',L/n*.7,.62,t*1.1,{at:[cx+Math.cos(rot)*u*L,y+h,cz-Math.sin(rot)*u*L],rot,tint})}}
}
export function addFort(m,{at=[0,0,0],size=10,flag='#c0392b',R=Math.random,courtyard=true,houses=true}){
 const S=size/2,T=tc(PAL.stone,.96),gate=1.3,corners=[[-S,-S],[S,-S],[S,S],[-S,S]];
 const W=(p,q)=>addWallSegment(m,{a:[at[0]+p[0],at[2]+p[1]],b:[at[0]+q[0],at[2]+q[1]],y:at[1],tint:T});
 W([-S,-S],[S,-S]);W([S,-S],[S,S]);W([-S,S],[-S,S]);W([-S,-S],[-S,S]);W([-S,S],[-gate-.2,S]);W([gate+.2,S],[S,S]);
 for(const[x,z]of corners){addTower(m,{at:[at[0]+x,at[1],at[2]+z],r:1.4,h:5,sides:9,cap:'roof',capH:2.6,tint:T,slits:true})}
 // gatehouse
 m.box('stone',gate*2+1.8,4.2,2.3,{at:[at[0],at[1],at[2]+S],tint:T});for(const sx of[-1,1])addTower(m,{at:[at[0]+sx*(gate+.5),at[1],at[2]+S+.9],r:.8,h:4.9,sides:7,cap:'roof',capH:2,tint:T});
 m.box('wood',gate*1.5,2.2,.12,{at:[at[0],at[1]+.02,at[2]+S+1.1],tint:tc(PAL.woodDark,.8)});m.box('stone',gate*1.5+.4,.4,.5,{at:[at[0],at[1]+2.1,at[2]+S+1.12],tint:tc(PAL.stone,.8)});
 if(courtyard)m.box('stone',size-1.4,.14,size-1.4,{at:[at[0],at[1]+.02,at[2]],tint:tc(PAL.cobble,.9)});
 // keep
 m.box('stone',3.6,5,3.6,{at:[at[0],at[1]+.1,at[2]-1.2],tint:tc(PAL.stone,1.02)});m.box('stone',4.1,.5,4.1,{at:[at[0],at[1]+4.7,at[2]-1.2],tint:tc(PAL.stone,.9)});
 m.cyl('roof',3,0,2.6,4,{at:[at[0],at[1]+5.2,at[2]-1.2],rot:Math.PI/4,tint:tc(PAL.roof)});
 for(const s of[-1,1]){m.box('glass',.3,.6,.05,{at:[at[0]+s*.8,at[1]+3.1,at[2]-1.2+1.82]});m.box('glass',.05,.6,.3,{at:[at[0]+s*1.82,at[1]+3.1,at[2]-1.2]})}
 addBanner(m,{at:[at[0],at[1]+7.7,at[2]-1.2],h:2.4,color:flag});
 if(houses){addHouse(m,{at:[at[0]-3.1,at[1]+.05,at[2]+2.4],rot:Math.PI/2,w:1.4,d:2.6,h:1.4,roof:.9,stone:true,R});addHouse(m,{at:[at[0]+3.2,at[1]+.05,at[2]+2.6],rot:-Math.PI/2,w:1.3,d:2,h:1.3,roof:.85,stone:true,R})}
}
export function addWell(m,{at,R=Math.random}){m.cyl('stone',.62,.62,.62,10,{at,tint:tc(PAL.stone,.9)},false);m.cyl('stone',.5,.5,.1,10,{at:[at[0],at[1]+.5,at[2]],tint:tc('#2c4a55')});
 for(const s of[-1,1])m.box('wood',.1,1.3,.1,{at:[at[0]+s*.55,at[1]+.5,at[2]]});m.gable('roof','wood',1.5,.5,1.0,.15,{at:[at[0],at[1]+1.7,at[2]],rot:Math.PI/2,tint:tc(PAL.roof)},tc(PAL.wood))}
export function addStall(m,{at,rot=0,R=Math.random}){const c=R()<.5?PAL.cloth:'#3f6c78';for(const sx of[-1,1])for(const sz of[-1,1])m.box('wood',.07,1.5,.07,{at:rel(at,rot,sx*.7,0,sz*.5),rot});
 m.box('wood',1.5,.55,.8,{at:rel(at,rot,0,0,0),rot,tint:tc(PAL.wood,.9)});m.box('cloth',1.7,.07,1.2,{at:rel(at,rot,0,1.5,0),rot,tint:tc(c)});m.box('cloth',1.7,.2,.06,{at:rel(at,rot,0,1.3,.6),rot,tint:tc(PAL.cloth2)})}
export function addBarrel(m,{at,s=1}){m.cyl('wood',.3*s,.3*s,.7*s,8,{at,tint:tc(PAL.wood,.9)});m.cyl('wood',.33*s,.33*s,.08*s,8,{at:[at[0],at[1]+.22*s,at[2]],tint:tc(PAL.woodDark)},false)}
export function addCrate(m,{at,rot=0,s=1}){m.box('wood',.7*s,.6*s,.7*s,{at,rot,tint:tc(PAL.wood,.95)})}
export function addKeepHall(m,{at,flag,R=Math.random}){const T=tc(PAL.stone,1.02);m.box('stone',4.6,3.2,3,{at:[at[0]-.4,at[1],at[2]],tint:T});m.gable('roof','stone',4.6,1.7,3,.28,{at:[at[0]-.4,at[1]+3.2,at[2]],tint:tc(PAL.roof)},T);
 addPyramidTower(m,{at:[at[0]+2.4,at[1],at[2]-.3],w:2.5,h:7.2,cap:'gold',capH:3.2});
 for(const sx of[-1,1])addTower(m,{at:[at[0]-2.4+sx*0,at[1],at[2]+sx*1.7],r:.62,h:4.2,sides:7,cap:'roof',capH:1.5});
 for(const x of[-1.6,-.4,.8])m.box('glass',.4,.8,.05,{at:[at[0]+x,at[1]+1.6,at[2]+1.52]});addBanner(m,{at:[at[0]+2.4,at[1]+10.6,at[2]-.3],h:2,color:flag,scale:.9})}
export function addChurch(m,{at,R=Math.random}){const T=tc(PAL.stone,1);m.box('stone',2.2,1.9,3.4,{at:[at[0],at[1],at[2]+.2],tint:T});m.gable('roof','stone',3.4,1.2,2.2,.2,{at:[at[0],at[1]+1.9,at[2]+.2],rot:Math.PI/2,tint:tc(PAL.roof)},T);
 addPyramidTower(m,{at:[at[0],at[1],at[2]-2],w:1.5,h:4.4,cap:'roof',capH:2.4});m.box('glass',.4,.9,.05,{at:[at[0],at[1]+.7,at[2]+1.92]});}
export function addLamp(m,{at,h=1.6}){m.cyl('wood',.04,.04,h,5,{at});m.box('glass',.2,.28,.2,{at:[at[0],at[1]+h,at[2]]});}
export function addRingWall(m,{center=[0,0,0],radius,gates=[],y=0,segments=48,towerEvery=6,flag}){
 const T=tc(PAL.stone,.95);let prev=null;const pts=[];
 for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;pts.push([center[0]+Math.cos(a)*radius,center[2]+Math.sin(a)*radius,a])}
 for(let i=0;i<segments;i++){const a=pts[i],b=pts[i+1];const mid=(a[2]+b[2])/2;if(gates.some(g=>Math.abs(Math.atan2(Math.sin(mid-g),Math.cos(mid-g)))<.11))continue;addWallSegment(m,{a:[a[0],a[1]],b:[b[0],b[1]],y,tint:T,h:2.8,t:.9})}
 for(let i=0;i<segments;i+=towerEvery)addTower(m,{at:[pts[i][0],y,pts[i][1]],r:1.25,h:4.2,sides:8,cap:'roof',capH:2.2,tint:T,slits:true});
}
/* ---------- modelos de mapa ---------- */
export function settlementModel({b,capital=false,village=false,fort=false,color='#c0392b'}){
 const R=rng((b.i|0)*7919+13),m=new Mesher();
 if(fort){addFort(m,{size:10,flag:color,R})}
 else{
  m.cyl('stone',capital?3.6:2.6,capital?3.6:2.6,.16,20,{at:[0,.0,0],tint:tc(PAL.cobble,.92)});
  if(capital)addKeepHall(m,{at:[0,.1,-.2],flag:color,R});else addChurch(m,{at:[0,.1,-.3],R});
  const n=capital?12:village?3:5;
  for(let k=0;k<n;k++){const a=k*2.399+R()*.3,s=capital?4.6+(k%3)*1.9:4.1+R()*.5,x=Math.cos(a)*s,z=Math.sin(a)*s,rot=Math.atan2(-Math.cos(a),-Math.sin(a));
   addHouse(m,{at:[x,0,z],rot,w:1.6+R()*.5,d:2+R()*.5,h:1.5+R()*.4,roof:.95+R()*.4,stone:capital&&k%3===0,thatch:village&&R()<.5,R})}
  if(!village){addWell(m,{at:[capital?1.7:1.5,.1,capital?2.2:2],R});for(let k=0;k<(capital?3:1);k++)addStall(m,{at:[-1.8+k*1.8,.1,capital?3.2:2.8],rot:0,R})}
 }
 return m.group();
}
export function portModel({fortified=false,flag='#c0392b'}={}){
 const m=new Mesher(),R=rng(77);
 m.box('wood',8,.35,6.6,{at:[0,0,0],tint:tc(PAL.wood,1.02)});
 for(let i=0;i<5;i++)for(const s of[-1,1])m.cyl('wood',.15,.15,1.7,6,{at:[-3.7+i*1.85,-1.35,s*3.2],tint:tc(PAL.woodDark,.9)});
 m.box('wood',8.4,.18,.3,{at:[0,.3,3.4],tint:tc(PAL.woodDark)});m.box('wood',8.4,.18,.3,{at:[0,.3,-3.4],tint:tc(PAL.woodDark)});
 addHouse(m,{at:[-2.7,.3,-1.5],rot:Math.PI/2,w:2.6,d:3,h:1.9,roof:1.2,stone:true,R,level:0});
 for(let i=0;i<3;i++)addBarrel(m,{at:[2.2+i*.55,.3,-2.3],s:1});addCrate(m,{at:[2.4,.3,-1.2],rot:.3});addCrate(m,{at:[2.4,.9,-1.2],rot:.9,s:.8});
 m.cyl('wood',.12,.12,2.6,6,{at:[.4,.3,2.4],tint:tc(PAL.woodDark)});m.box('wood',2.2,.14,.14,{at:[1.3,2.7,2.4],tint:tc(PAL.woodDark)});m.box('wood',.04,1.5,.04,{at:[2.3,1.25,2.4],tint:tc('#2b2b2b')});
 // barco
 m.box('wood',2,.6,4.8,{at:[5.2,-.1,0],tint:tc(PAL.woodDark,1.1)});m.box('wood',2.4,.45,5.2,{at:[5.2,.5,0],tint:tc(PAL.wood,.95)});m.box('wood',2,.5,1.3,{at:[5.2,.95,-1.7],tint:tc(PAL.wood,.85)});
 m.cyl('wood',.1,.14,5.2,6,{at:[5.2,.9,.3],tint:tc(PAL.woodDark)});m.quad('cloth',2.4,3.2,{at:[5.2,2.6,.3],rot:Math.PI/2,tint:tc(PAL.cloth2)});
 if(fortified){m.box('stone',2.2,3.2,2.2,{at:[-3.8,0,2.2],tint:tc(PAL.stone,.95)});m.box('stone',2.6,.4,2.6,{at:[-3.8,3.1,2.2],tint:tc(PAL.stone,.85)});m.cyl('roof',1.6,0,1.4,4,{at:[-3.8,3.5,2.2],rot:Math.PI/4,tint:tc(PAL.roof)});addBanner(m,{at:[-3.8,4.9,2.2],h:1.5,color:flag,scale:.8})}
 else{m.cyl('stone',1.05,.78,5.6,10,{at:[-3.4,.3,2.6],tint:tc(PAL.stone,1.02)},false);m.cyl('glass',.62,.62,.9,8,{at:[-3.4,5.9,2.6]});m.cyl('roof',.95,0,1.1,8,{at:[-3.4,6.8,2.6],tint:tc(PAL.roof)});m.cyl('gold',.14,.14,.4,6,{at:[-3.4,7.8,2.6]})}
 return m.group();
}

/* =====================================================================
   v35 — arquitetura por estilo (clima/bioma) e edifícios com mais carácter
   ===================================================================== */
export const STYLES={
 temperate:{wall:'plaster',cols:['#f1e8d0','#e8d9b8','#dcc9a2','#efe3c8','#e3d2ac'],roofKind:'roof',roofCols:[PAL.roof,PAL.roofRed,'#6a4f44'],timber:true,quoins:true,pitch:.58,shutters:true},
 cold:{wall:'wood',cols:['#8a6d4b','#7a5f42','#9a7a55','#6f573d'],roofKind:'plaster',roofCols:['#eef3f5','#e4ecef'],timber:false,quoins:false,pitch:.95,shutters:true,snow:true},
 arid:{wall:'plaster',cols:['#d9b98a','#cfa877','#e2c79c','#c99f6c','#e8d2a8'],roofKind:'flat',roofCols:['#d9b98a'],timber:false,quoins:false,pitch:0,shutters:false,awnings:true},
 tropical:{wall:'plaster',cols:['#f2d9a0','#e9b8a0','#c8dcb0','#efe6cc','#e8c48a'],roofKind:'thatch',roofCols:[PAL.thatch,'#b89c58'],timber:false,quoins:false,pitch:1,shutters:true,raise:.5},
 alpine:{wall:'stone',upper:'wood',cols:[PAL.stone,'#d2c09a'],roofKind:'roof',roofCols:['#5e4a42','#6b564a','#54443c'],timber:true,quoins:false,pitch:.8,shutters:true},
 wet:{wall:'wood',cols:['#8a7152','#7d6648','#6f5a3f'],roofKind:'thatch',roofCols:['#a99455','#9a864c'],timber:false,quoins:false,pitch:.95,shutters:false,raise:1.1},
 dwarven:{wall:'stone',cols:['#c9b48c','#b7a27a','#d3c19c','#a8926b'],roofKind:'roof',roofCols:['#5b544a','#6a6155','#4e4840'],timber:false,quoins:true,pitch:.42,shutters:false},
 arcane:{wall:'plaster',cols:['#e6e1d2','#d8d2c0','#eee8d8','#cfc9b8'],roofKind:'roof',roofCols:['#3f5c78','#4a6884','#35506a'],timber:false,quoins:true,pitch:.7,shutters:true}
};
const pick=(a,R)=>a[Math.floor(R()*a.length)%a.length];
export function addFence(m,{a,b,y0=0,R=Math.random}){const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.round(L/1.3)),rot=Math.atan2(-dz,dx);
 for(let i=0;i<=n;i++){const u=i/n;m.box('wood',.1,.8,.1,{at:[a[0]+dx*u,y0,a[1]+dz*u],tint:tc(PAL.wood,.85)})}
 for(const h of[.35,.62])m.box('wood',L,.07,.05,{at:[(a[0]+b[0])/2,y0+h,(a[1]+b[1])/2],rot,tint:tc(PAL.wood,.95)})}
export function addFountain(m,{at}){m.cyl('stone',1.7,1.55,.5,16,{at,tint:tc(PAL.stone,.95)});m.cyl('water',1.45,1.45,.06,16,{at:[at[0],at[1]+.46,at[2]]});m.cyl('stone',.28,.24,1.5,8,{at:[at[0],at[1]+.4,at[2]],tint:tc(PAL.stone)});m.cyl('stone',.8,.55,.22,12,{at:[at[0],at[1]+1.5,at[2]],tint:tc(PAL.stone,1.05)});m.cyl('water',.7,.7,.05,12,{at:[at[0],at[1]+1.7,at[2]]});m.cyl('gold',.1,0,.4,6,{at:[at[0],at[1]+1.72,at[2]]})}
export function addTent(m,{at,rot=0,color='#b6483c'}){m.cyl('cloth',1.3,0,1.6,4,{at,rot:rot+Math.PI/4,tint:tc(color)});m.box('wood',.04,2,.04,{at:[at[0],at[1]+1.5,at[2]]})}
export function addPillar(m,{at,h=2.4,r=.3,broken=false}){m.cyl('stone',r*1.15,r,broken?h*.55:h,8,{at,tint:tc(PAL.stone,.85)});if(!broken)m.box('stone',r*2.8,.22,r*2.8,{at:[at[0],at[1]+h,at[2]],tint:tc(PAL.stone,.9)})}
export function addLog(m,{from,to,t=.32}){m.beam('wood',[from[0],from[1]+t/2,from[2]],[to[0],to[1]+t/2,to[2]],t,{tint:tc('#5f4a36',.95)})}
export function addHaystack(m,{at,s=1}){m.cyl('thatch',.95*s,.35*s,1.1*s,9,{at,tint:tc('#d2b96a')});m.cyl('thatch',.35*s,0,.5*s,9,{at:[at[0],at[1]+1.1*s,at[2]],tint:tc('#c8ae5e')})}

/** Barco de carga de rio/porto: casco, proa, mastro, vela e leme. */
export function addBoat(m,{at,rot=0,s=1,sail=true,color=PAL.cloth2}){
 const T=tc(PAL.woodDark,.95),W=tc(PAL.wood,.98);
 m.box('wood',2.1*s,.52*s,5*s,{at:[at[0],at[1]+.1*s,at[2]],rot,tint:T});
 m.box('wood',1.7*s,.3*s,4.2*s,{at:[at[0],at[1]+.52*s,at[2]],rot,tint:W});
 m.cyl('wood',1.05*s,.05*s,.5*s,4,{at:[at[0]+Math.sin(rot)*2.7*s,at[1]+.18*s,at[2]+Math.cos(rot)*2.7*s],rot:rot+Math.PI/4,tint:W}); // proa
 m.box('wood',.9*s,.5*s,1.1*s,{at:[at[0]-Math.sin(rot)*1.7*s,at[1]+.75*s,at[2]-Math.cos(rot)*1.7*s],rot,tint:T});                    // cabine
 m.cyl('wood',.09*s,.13*s,4.6*s,6,{at:[at[0],at[1]+.6*s,at[2]],tint:T});
 if(sail)m.quad('cloth',2.4*s,2.9*s,{at:[at[0]+Math.sin(rot)*1.2*s,at[1]+2.2*s,at[2]+Math.cos(rot)*1.2*s],rot:rot+Math.PI/2,tint:tc(color)});
 m.box('wood',.08*s,1.4*s,.6*s,{at:[at[0]-Math.sin(rot)*2.3*s,at[1]+.4*s,at[2]-Math.cos(rot)*2.3*s],rot,tint:T});
}
/** Guindaste de cais: dois postes, lança inclinada e cabo com gancho. */
export function addCrane(m,{at,rot=0,s=1}){
 const T=tc(PAL.woodDark,1),W=tc(PAL.wood,.95);
 for(const dx of[-.5,.5])m.box('wood',.22*s,4.2*s,.22*s,{at:[at[0]+Math.cos(rot)*dx*s,at[1],at[2]-Math.sin(rot)*dx*s],rot,tint:W});
 m.box('wood',1.5*s,.2*s,.2*s,{at:[at[0],at[1]+1.1*s,at[2]],rot,tint:W});
 m.beam('wood',[at[0],at[1]+3.9*s,at[2]],[at[0]+Math.cos(rot)*4.6*s,at[1]+5.4*s,at[2]-Math.sin(rot)*4.6*s],.16*s,{tint:T});
 m.beam('wood',[at[0]+Math.cos(rot)*4.3*s,at[1]+5.2*s,at[2]-Math.sin(rot)*4.3*s],[at[0]+Math.cos(rot)*4.3*s,at[1]+1.4*s,at[2]-Math.sin(rot)*4.3*s],.05*s,{tint:tc('#2b2b2b')});
 m.box('wood',.55*s,.45*s,.55*s,{at:[at[0]+Math.cos(rot)*4.3*s,at[1]+1.2*s,at[2]-Math.sin(rot)*4.3*s],rot,tint:tc(PAL.wood,.9)});
}

/** Edifício com andares, empena, vigas, janelas, porta, chaminé e detalhes por tipo.
 *  Frente = +z local. `smoke` recebe as bocas de chaminé (posições no mundo). */
export function addBuilding(m,o){
 const{at,rot=0,w=3.6,d=4.6,floors=2,type='house',style=STYLES.temperate,R=Math.random,smoke=null}=o,fh=1.5,H=floors*fh,lo=[R()*50,R()*30,R()*40];
 const tall=type==='barn'?1.9:1,HH=H*tall,wk=type==='smithy'||type==='warehouse'?'stone':style.wall,uk=style.upper&&floors>1?style.upper:wk;
 const base=type==='smithy'||type==='warehouse'?PAL.stone:pick(style.cols,R),wt=tc(base,.9+R()*.2),rc=pick(style.roofCols,R),rt=tc(rc,.86+R()*.28),wd=tc(PAL.wood,.88+R()*.22),dark=tc(PAL.woodDark,1);
 const raise=style.raise||0,jet=style.timber&&floors>1&&type!=='barn'?.24:0,Y=at[1]+raise;
 const A=(dx,dy,dz)=>rel([at[0],Y,at[2]],rot,dx,dy,dz);
 const box=(k,bw,bh,bd,dx,dy,dz,tint,extra=0)=>m.box(k,bw,bh,bd,{at:A(dx,dy,dz),rot:rot+extra,tint,loc:lo});
 const bm=(k,p0,p1,t,tint)=>m.beam(k,p0,p1,t,{at:[at[0],Y,at[2]],rot,tint,loc:lo});
 // base / estacas
 if(raise){for(const sx of[-1,1])for(const sz of[-1,1])m.cyl('wood',.13,.13,raise+.9,6,{at:rel([at[0],Y-raise-.9,at[2]],rot,sx*(w/2-.2),0,sz*(d/2-.2)),tint:dark});box('wood',w+.5,.14,d+.5,0,-.1,0,wd)}
 else box('stone',w+.16,.9,d+.16,0,-.8,0,tc(PAL.stone,.78));
 // corpo (andar térreo + andares com balanço)
 const gh=Math.min(HH,fh*tall);box(wk,w,gh,d,0,0,0,wt);
 for(let f=1;f<floors;f++){box(uk,w+(jet?.04:0),fh,d+jet,0,f*fh,jet/2,uk===wk?wt:tc(base,.8),0);if(jet)box('wood',w+.06,.14,d+jet+.06,0,f*fh-.07,jet/2,wd)}
 if(tall>1)box(wk,w,HH-gh,d,0,gh,0,wt);
 const D=d+jet;
 // telhado
 const span=o.gableFront===false?D:w,len=o.gableFront===false?w:D,rh=Math.max(.5,span*.5*(style.pitch||.58)*(type==='barn'?1.1:1)),over=.24;
 if(style.roofKind==='flat'){box(wk,w+.1,.2,d+.1,0,HH,0,wt);for(const[bw,bd,dx,dz]of[[w+.1,.14,0,d/2],[w+.1,.14,0,-d/2],[.14,d,w/2,0],[.14,d,-w/2,0]])box(wk,bw,.38,bd,dx,HH,dz,wt);
  if(style.awnings&&R()<.6)m.shed('cloth',w*.8,.4,1.0,{at:A(0,1.35,d/2+.5),rot,tint:tc(R()<.5?PAL.cloth:'#3f6c78')})}
 else{const front=o.gableFront!==false,gk=style.roofKind;
  m.gable(gk,wk,front?D+.0:w,rh,front?w:D,over,{at:A(0,HH,jet/2),rot:rot+(front?Math.PI/2:0),tint:gk==='plaster'?tc(rc,1):rt,loc:lo},wt);
 }
 // fachada: portas e janelas
 const zf=(f)=>f>0?d/2+jet:d/2,n=Math.max(1,Math.round(w/1.4)),dIdx=Math.floor(R()*n);
 for(let f=0;f<floors;f++){for(let i=0;i<n;i++){const x=((i+.5)/n-.5)*w,zz=zf(f)+.02;
  if(f===0&&i===dIdx){box('wood',.62,1.15,.1,x,0,zz,dark);box('stone',.84,.13,.16,x,1.15,zz,tc(PAL.stone,.9));box('stone',.84,.1,.5,x,0,d/2+.26,tc(PAL.stone,.8));
   if(R()<.4&&style.roofKind!=='flat'){m.shed(style.roofKind==='thatch'?'thatch':'roof',1.3,.35,.9,{at:A(x,1.3,d/2+.45),rot,tint:rt});for(const s of[-1,1])box('wood',.08,1.3,.08,x+s*.6,0,d/2+.85,wd)}continue}
  const y0=f*fh+.55;box('wood',.52,.64,.08,x,y0-.04,zz,wd);box('glass',.38,.5,.1,x,y0+.03,zz+.01,null);
  if(style.shutters){for(const s of[-1,1])box('wood',.17,.6,.06,x+s*.35,y0-.02,zz+.01,dark)}
  box('stone',.62,.07,.16,x,y0-.1,zz+.03,tc(PAL.stone,.85));
  if(R()<.18&&f>0)box('cloth',.5,.14,.14,x,y0-.2,zz+.1,tc(R()<.5?'#c75a6a':'#e0b23a'));}}
 for(let f=0;f<floors;f++){const y0=f*fh+.55;for(const s of[-1,1]){if(R()<.8)box('glass',.08,.5,.36,s*(w/2+.02),y0,0,null,0)}
  const nb=Math.max(1,n-1);for(let i=0;i<nb;i++){const x=((i+.5)/nb-.5)*w*.8;box('glass',.36,.5,.08,x,y0,-d/2-.02,null)}}
 // enxaimel: postes, vigas de piso e escoras
 if(style.timber&&wk==='plaster'||style.timber==='upper'){for(const sx of[-1,1])for(const sz of[-1,1])bm('wood',[sx*w/2,0,sz*(sz>0?zf(floors-1):d/2)],[sx*w/2,HH,sz*(sz>0?zf(floors-1):d/2)],.13,wd);
  for(let f=1;f<floors;f++)for(const sz of[-1,1])bm('wood',[-w/2,f*fh,sz>0?zf(f)+.03:-d/2-.03],[w/2,f*fh,sz>0?zf(f)+.03:-d/2-.03],.12,wd);
  for(let f=1;f<floors;f++){const z=zf(f)+.04;for(let i=0;i<=n;i++){const x=(i/n-.5)*w;bm('wood',[x,f*fh,z],[x,(f+1)*fh,z],.09,wd);if(i<n){const x2=((i+1)/n-.5)*w;i%2?bm('wood',[x,f*fh+.06,z],[x2,(f+1)*fh-.06,z],.07,wd):bm('wood',[x,(f+1)*fh-.06,z],[x2,f*fh+.06,z],.07,wd)}}}}
 // cunhais de pedra
 if(style.quoins&&wk==='plaster')for(const sx of[-1,1])for(let k=0;k*.5<gh-.3;k++)box('stone',.3,.4,.3,sx*(w/2),k*.5,d/2-(k%2?.02:.0),tc(PAL.stone,.92));
 // chaminé
 if(!style.snow||R()<.9){const cx=(R()<.5?-1:1)*w*.28;if(style.roofKind!=='flat'||R()<.3){box('stone',.46,rh+.9+(style.roofKind==='flat'?.3:0),.46,cx,HH,0,tc(PAL.stone,.85));box('stone',.62,.1,.62,cx,HH+rh+.8,0,tc(PAL.stone,.75));if(smoke&&R()<.7)smoke.push(A(cx,HH+rh+1,0))}}
 // extras por tipo
 const fz=d/2+jet;
 if(type==='tavern'){bm('wood',[w/2-.1,1.8,fz],[w/2-.1,1.8,fz+.9],.06,wd);box('wood',.55,.45,.05,w/2-.1,1.28,fz+.9,tc(R()<.5?'#a33':'#c9a24d',.95));for(const s of[-1,1]){addBarrel(m,{at:A(s*1.0,0,fz+.7)})}box('wood',1.2,.08,.45,-.6,.45,fz+.7,wd);box('wood',.08,.45,.45,-1.15,0,fz+.7,wd);box('wood',.08,.45,.45,-.05,0,fz+.7,wd)}
 if(type==='shop'&&style.roofKind!=='flat'){m.shed('cloth',w*.85,.45,1.0,{at:A(0,1.35,fz+.5),rot,tint:tc(R()<.5?PAL.cloth:'#3f6c78')});box('wood',w*.5,.5,.5,0,0,fz+.7,wd)}
 if(type==='smithy'){box('stone',.7,.5,.5,w/2+.5,0,.4,tc(PAL.stone,.8));box('glass',.3,.2,.06,w/2+.5,.5,.64,null);box('wood',.3,.5,.3,w/2+.9,0,-.6,dark);box('wood',.5,.1,.5,w/2+.9,.5,-.6,dark)}
 if(type==='barn'){box('wood',2,2.3,.1,0,0,d/2+.03,dark);box('wood',.8,.9,.08,0,HH-.2,d/2+.03,dark);box('wood',.15,2.3,.1,-1.05,0,d/2+.03,wd);box('wood',.15,2.3,.1,1.05,0,d/2+.03,wd);bm('wood',[-1,0,d/2+.08],[1,2.3,d/2+.08],.1,wd);bm('wood',[1,0,d/2+.08],[-1,2.3,d/2+.08],.1,wd)}
 if(floors>=2&&(type==='tavern'||R()<.16)&&style.roofKind!=='flat'){box('wood',w*.55,.12,.8,0,fh,fz+.4,wd);for(let i=0;i<=4;i++)box('wood',.06,.55,.06,(i/4-.5)*w*.55,fh,fz+.78,wd);box('wood',w*.55,.06,.06,0,fh+.55,fz+.78,wd)}
}
export function addChurch2(m,{at,rot=0,R=Math.random,style=STYLES.temperate}){
 const T=tc(PAL.stone,1.02),A=(dx,dy,dz)=>rel(at,rot,dx,dy,dz),B=(k,w,h,d,dx,dy,dz,t)=>m.box(k,w,h,d,{at:A(dx,dy,dz),rot,tint:t||T});
 B('stone',3.2,3,6.6,0,0,.6);m.gable('roof','stone',6.6,1.7,3.2,.28,{at:A(0,3,.6),rot:rot+Math.PI/2,tint:tc(style.roofKind==='plaster'?'#eef3f5':PAL.roof)},T);
 B('stone',5.8,2.6,2.2,0,0,.4);m.gable('roof','stone',2.2,1.5,5.8,.25,{at:A(0,2.6,.4),rot,tint:tc(style.roofKind==='plaster'?'#eef3f5':PAL.roof)},T);
 B('stone',2.4,7.2,2.4,0,0,-3.2);B('stone',2.7,.4,2.7,0,6.6,-3.2,tc(PAL.stone,.9));
 for(const s of[-1,1]){B('glass',.12,.9,.5,s*1.2,5.1,-3.2);}for(const z of[-1,1])B('glass',.5,.9,.12,0,5.1,-3.2+z*1.2);
 m.cyl(style.roofKind==='plaster'?'plaster':'roof',1.9,0,3.8,4,{at:A(0,7.1,-3.2),rot:rot+Math.PI/4,tint:tc(style.roofKind==='plaster'?'#eef3f5':PAL.roof)});m.cyl('gold',.08,.08,.7,5,{at:A(0,10.9,-3.2)});m.box('gold',.4,.08,.08,{at:A(0,11.35,-3.2),rot});
 for(let i=0;i<4;i++)for(const s of[-1,1])B('stone',.4,2.2,.5,s*1.75,0,-.7+i*1.5);
 B('glass',1,1.1,.08,0,1.7,-.58+0,null);B('wood',.9,1.5,.08,0,0,3.95,tc(PAL.woodDark));B('stone',1.2,.18,.5,0,1.5,4.15);
 for(const s of[-1,1])B('glass',.4,1.0,.08,s*.9,1.1,3.95);B('glass',.9,.9,.08,0,2.2,4.0);
}
export function addTownHall(m,{at,rot=0,flag='#c0392b',R=Math.random}){
 const T=tc(PAL.stone,1),P=tc('#efe3c8',1),A=(dx,dy,dz)=>rel(at,rot,dx,dy,dz),B=(k,w,h,d,dx,dy,dz,t)=>m.box(k,w,h,d,{at:A(dx,dy,dz),rot,tint:t});
 B('stone',7,2.5,4.2,0,0,0,T);B('plaster',6.6,2.2,3.9,0,2.5,0,P);m.gable('roof','plaster',7,1.7,4.1,.3,{at:A(0,4.7,0),rot,tint:tc(PAL.roof)},P);
 for(let i=-1;i<=1;i++){B('glass',.8,1.5,.1,i*2,0,2.12,null);B('stone',1,.2,.2,i*2,1.5,2.14,tc(PAL.stone,.85))}
 for(let i=-2;i<=2;i++)B('glass',.4,.55,.1,i*1.2,3.3,1.98,null);
 for(let i=0;i<=4;i++)m.cyl('stone',.2,.17,2.5,7,{at:A(-2.8+i*1.4,0,2.45),tint:T});B('stone',6.9,.2,.5,0,2.5,2.4,tc(PAL.stone,.9));
 B('stone',2,3,2,0,4.7,0,T);m.cyl('gold',1.5,0,2.4,4,{at:A(0,7.7,0),rot:rot+Math.PI/4});B('glass',.7,.7,.08,0,5.7,1.04,null);addBanner(m,{at:A(0,10.1,0),h:1.6,color:flag,scale:.8});
}
