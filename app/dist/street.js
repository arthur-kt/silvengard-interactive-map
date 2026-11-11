// Silvengard · v44 — "Ver no local" em escala real.
//
// A visão local deixou de ser um zoom no mapa. Ao entrar, o Atlas lê o contexto do
// ponto (costa, lago, rio, serra, bioma, população) e reconstrói o lugar em metros:
// a cidade cresce com os habitantes, o mar/lago tem o tamanho do corpo d'água original,
// as montanhas ficam a quilômetros e o horizonte chega a 15 km. A pé, correndo, pulando
// ou voando (dois toques no espaço), com moradores que só andam em terra firme.
import * as THREE from 'three';
import {shared,treeMaterial} from './visuals.js?v=56';
import {Mesher,retexture,rng,tc,PAL,STYLES} from './settlements.js?v=56';
import {makeLayout,buildTownV2,buildWildFeatures,climateOf,CLIMATE_NAME} from './town.js?v=56';
import {siteFor,createField,M_PER_UNIT as M} from './local-field.js?v=56';
import {buildTerrain,localGroundMaterial,buildWater,localWaterMaterial,buildForest,buildScatter,skyTexture,localRoadMaterial,buildRoads} from './local-scene.js?v=56';
import {indexLore,loreForCity} from './local-lore.js?v=56';

const EYE_M=1.72, WALK_M=2.8, RUN_M=10.5, FLY_M=110, FLY_V=45, JUMP_V=5.9, GRAV=17.5;
const EYE=EYE_M/M, WALK=WALK_M/M, RUN=RUN_M/M, FLY=FLY_M/M, FLYV=FLY_V/M, JUMP=JUMP_V/M, G=GRAV/M;
const RADIUS=.4;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};

const PRESETS={
 manha:{label:'Manhã',sun:[-.9,.42,.5],sunC:'#ffd6a0',sunI:2.1,hemiI:1.05,sky:'#f1d9c2',gnd:'#6d6a4a',top:'#5b87ab',hor:'#e3c7a6',bottom:'#f0d9bd',fogN:420,fogF:9500,night:0,exp:1.0},
 dia:{label:'Dia',sun:[-.45,1,-.3],sunC:'#fff0d4',sunI:2.45,hemiI:1.15,sky:'#e4eff2',gnd:'#656a4b',top:'#3f7fb2',hor:'#c3d9e0',bottom:'#bcd6de',fogN:520,fogF:12500,night:0,exp:1.05},
 tarde:{label:'Entardecer',sun:[.95,.17,.45],sunC:'#ff9a52',sunI:2.2,hemiI:1.0,sky:'#e9b48d',gnd:'#5a4a40',top:'#33507f',hor:'#f0a370',bottom:'#e9a878',fogN:500,fogF:12000,night:0,exp:1.0},
 noite:{label:'Noite',sun:[.4,.7,.5],sunC:'#9fb4ff',sunI:1.0,hemiI:.9,sky:'#4a5f96',gnd:'#1c2430',top:'#081226',hor:'#27395c',bottom:'#1c2b47',fogN:300,fogF:7000,night:1,exp:1.1}
};
const DIRS=['N','NE','L','SE','S','SO','O','NO'];

function merge(parts){const pos=[],nor=[];for(const g0 of parts){const g=g0.index?g0.toNonIndexed():g0;pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array)}
 const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return o}
const at=(g,x,y,z)=>{g.translate(x,y,z);return g};

export function createStreetMode(ctx){
 const {scene,camera,renderer,controls,light,world,D,W,H,surface,cellAt,getRelief,toast,title,inhabitants,stateColor,onExit}=ctx;
 const hemi=scene.children.find(o=>o.isHemisphereLight);
 const root=new THREE.Group();root.name='streetMode';root.visible=false;scene.add(root);
 const S={active:false,entering:false,picking:false,hud:null,saved:null,built:null,x:0,y:0,feet:0,vy:0,yaw:0,pitch:0,
  keys:new Set(),locked:false,time:'dia',bob:0,moving:false,grounded:true,flying:false,lastSpace:0,
  cx:0,cy:0,cityR:120,site:null,field:null,R:500,lay:null,curCity:null};
 let gmat=null,gmatBand=null,wmat=null,roadsMat=null,terrain=null,forest=null,scatter=null,water=null,grass=null,grassMat=null,
  people=null,peopleData=[],solids=new Map(),lamps=[],spin=null,fieldsMesh=null,nearInfo=null;

 /* ---------- colisões ---------- */
 const key6=(x,y)=>Math.floor(x/6)+','+Math.floor(y/6);
 const addSolid=(x,y,r)=>{const k=key6(x,y);let l=solids.get(k);if(!l){l=[];solids.set(k,l)}l.push([x,y,r])};
 function blockedAt(x,y,r=.6){
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const l=solids.get(key6(x+dx*6,y+dy*6));if(!l)continue;
   for(const[sx,sy,rr]of l)if(Math.hypot(x-sx,y-sy)<rr+r)return true}
  return false;
 }
 function resolve(x,y){
  if(S.flying&&S.feet>G+(1.2/M))return[x,y];
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const l=solids.get(key6(x+dx*6,y+dy*6));if(!l)continue;
   for(const[sx,sy,r]of l){const ex=x-sx,ey=y-sy,d=Math.hypot(ex,ey),m=r+RADIUS;if(d<m&&d>1e-4){x=sx+ex/d*m;y=sy+ey/d*m}}}
  return[x,y];
 }
 const Grel=(x,z)=>S.field?S.field.heightM(x,z)/M:0;                 // metros locais -> unidades
 const Gmap=(mx,my)=>S.field?S.field.heightM((mx-S.cx)*M,(my-S.cy)*M)/M:0;
 const landAt=(mx,my)=>{if(!S.field)return false;const x=(mx-S.cx)*M,z=(my-S.cy)*M;return S.field.heightM(x,z)>.55&&S.field.depthM(x,z)<.05};
 // terra firme segundo o mapa (serve para escolher o ponto antes de existir campo local)
 const worldLand=(mx,my)=>{const c=cellAt(mx,my);return !!c&&c.h>=20&&surface(mx,my)>.02};
 const toW=(x,y)=>[x-W/2,y-H/2];
 function footprintY(mx,my,r){let m=1e9;for(const[dx,dy]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]])m=Math.min(m,Gmap(mx+dx,my+dy));return m}

 /* ---------- ruas: campo de caminho acelerado ---------- */
 function makePathField(lay){
  if(!lay)return()=>[0,0];
  const segs=[];
  for(const rd of lay.roads){const p=rd.pts;for(let i=0;i<p.length-1;i++)segs.push([p[i][0],p[i][1],p[i+1][0],p[i+1][1],rd.w])}
  const cell=26,grid=new Map(),put=(x,y,i)=>{const k=Math.floor(x/cell)+','+Math.floor(y/cell);let l=grid.get(k);if(!l){l=[];grid.set(k,l)}l.push(i)};
  segs.forEach((s,i)=>{const[x0,y0,x1,y1,w]=s,pad=w+2;const ax=Math.min(x0,x1)-pad,bx=Math.max(x0,x1)+pad,ay=Math.min(y0,y1)-pad,by=Math.max(y0,y1)+pad;
   for(let x=ax;x<=bx+cell;x+=cell)for(let y=ay;y<=by+cell;y+=cell)put(x,y,i)});
  const plaza=lay.plaza,Rt=lay.Rt;
  return (u,v)=>{
   const r=Math.hypot(u,v);if(r>Rt*1.4)return[0,0];
   let dirt=0,cob=0;
   if(r<plaza+.5)cob=1-smooth(plaza-.2,plaza+.7,r);
   const list=grid.get(Math.floor(u/cell)+','+Math.floor(v/cell));
   if(list)for(const i of list){
    const[x0,y0,x1,y1,w]=segs[i],dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1;
    const t=Math.max(0,Math.min(1,((u-x0)*dx+(v-y0)*dy)/L2));
    const d=Math.hypot(u-x0-dx*t,v-y0-dy*t),k=1-smooth(w*.55,w*.95,d);
    if(k>0){const inside=Math.hypot(x0+dx*t,y0+dy*t)<Rt*.95;if(inside)cob=Math.max(cob,k);else dirt=Math.max(dirt,k)}
   }
   return[Math.min(1,dirt+cob*.15),cob];
  };
 }

 /* ---------- moradores ---------- */
 function personGeometry(){
  const legs=merge([at(new THREE.BoxGeometry(.075,.34,.09),-.062,.17,0),at(new THREE.BoxGeometry(.075,.34,.09),.062,.17,0)]);
  const torso=at(new THREE.CylinderGeometry(.115,.145,.36,8),0,.52,0);
  return merge([legs,torso]);
 }
 function buildPeople(list){
  if(people){root.remove(people.body,people.head);people.body.geometry.dispose();people.head.geometry.dispose();
   people.body.material.dispose();people.head.material.dispose()}
  people=null;peopleData=list||[];if(!peopleData.length)return;
  const body=new THREE.InstancedMesh(personGeometry(),new THREE.MeshStandardMaterial({roughness:.92}),peopleData.length);
  const head=new THREE.InstancedMesh(new THREE.SphereGeometry(.105,8,6).translate(0,.78,0),new THREE.MeshStandardMaterial({color:'#d5a983',roughness:.85}),peopleData.length);
  peopleData.forEach((p,i)=>{body.setColorAt(i,p.col);head.setColorAt(i,new THREE.Color('#d5a983').multiplyScalar(.82+Math.random()*.3))});
  body.castShadow=head.castShadow=true;body.frustumCulled=head.frustumCulled=false;
  root.add(body,head);people={body,head};
  updatePeople(0,0,true);
 }
 const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_p=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1),_u=new THREE.Vector3(0,1,0);
 function updatePeople(dt,now,init=false){
  if(!people||!S.field)return;
  peopleData.forEach((p,i)=>{
   const pts=p.path;if(!pts||pts.length<2)return;
   if(!init)p.t+=p.dir*p.sp*dt;                               // metros por segundo / comprimento de trecho
   if(p.t<0||p.t>pts.length-1.001){p.dir*=-1;p.t=Math.max(0,Math.min(pts.length-1.001,p.t))}
   const k=Math.floor(p.t),f=p.t-k,a=pts[k],b=pts[k+1]||pts[k],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
   const u=a[0]+dx*f+nx*p.off,v=a[1]+dy*f+ny*p.off,mx=S.cx+u,my=S.cy+v;
   const lx=u*M,lz=v*M;
   if(S.field.heightM(lx,lz)<.5){p.dir*=-1;return}                    // nunca caminha na água
   if(!init&&Math.hypot(mx-S.x,my-S.y)>190/M)return;                  // longe: não gasta quadro
   const bob=Math.abs(Math.sin(now*.008*p.sp+p.ph))*.055;
   _p.set(mx-W/2,Grel(lx,lz)+bob,my-H/2);
   _q.setFromAxisAngle(_u,Math.atan2(-dx*p.dir,-dy*p.dir));
   _m.compose(_p,_q,_s);people.body.setMatrixAt(i,_m);people.head.setMatrixAt(i,_m);
  });
  people.body.instanceMatrix.needsUpdate=people.head.instanceMatrix.needsUpdate=true;
 }

 /* ---------- grama próxima ---------- */
 function grassGeometry(){
  const P=[],N=[];for(let b=0;b<7;b++){const a=b*Math.PI/3+b*.4,ox=Math.cos(b*2.1)*.04,oz=Math.sin(b*2.1)*.04,h=.2+.09*((b*37)%5)/5,w=.02,c=Math.cos(a),s=Math.sin(a);
   for(const v of[[-w*c+ox,0,-w*s+oz],[w*c+ox,0,w*s+oz],[ox+.02*s,h,oz-.02*c]]){P.push(...v);N.push(0,1,0)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return g}
 function grassMaterial(){
  const m=new THREE.MeshStandardMaterial({roughness:1,side:THREE.DoubleSide});
  const uPlayer={value:new THREE.Vector3()};m.userData.uPlayer=uPlayer;
  m.onBeforeCompile=sh=>{
   sh.uniforms.uTime=shared.uTime;sh.uniforms.uPlayer=uPlayer;
   sh.vertexShader='uniform float uTime;uniform vec3 uPlayer;varying float vG;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vG=clamp(position.y/.3,0.,1.);
   #ifdef USE_INSTANCING
   {vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float d=length(ip.xz-uPlayer.xz);transformed*=smoothstep(34.,24.,d);
    float ph=ip.x*.7+ip.z*.9;transformed.x+=sin(uTime*2.3+ph)*.06*vG*vG;transformed.z+=cos(uTime*1.8+ph*1.3)*.045*vG*vG;}
   #endif`);
   sh.fragmentShader='varying float vG;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.5,1.3,vG);');
  };
  return m;
 }
 let grassCenter=[1e9,1e9];
 const GRASS=false;   // os tufos de grama ficavam flutuando perto das paredes; o chão já tem cor
 function scatterGrass(px,py){
  if(!GRASS)return;
  if(!grass){grass=new THREE.InstancedMesh(grassGeometry(),grassMat,5200);grass.frustumCulled=false;grass.receiveShadow=true;root.add(grass)}
  const r=rng(Math.floor(px*31+py*17)),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),sc=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),c=new THREE.Color();
  let n=0;
  for(let i=0;i<12000&&n<5200;i++){
   const a=r()*6.28,d=Math.sqrt(r())*46,mx=px+Math.cos(a)*d,my=py+Math.sin(a)*d,lx=(mx-S.cx)*M,lz=(my-S.cy)*M;
   const h=S.field.heightM(lx,lz);if(h<.8||S.field.depthM(lx,lz)>.1)continue;
   const sd=S.field.shoreM(lx,lz);if(sd<10)continue;
   if(Math.hypot(lx,lz)<S.cityR*.95&&r()<.82)continue;               // cidade: pouca grama solta
   const[dirt,cob]=nearInfo?nearInfo(lx/M,lz/M):[0,0];if(dirt>.25||cob>.2)continue;
   if(blockedAt(mx,my,.25))continue;
   c.copy(new THREE.Color(S.site.grass[0])).lerp(new THREE.Color(S.site.grass[1]),r()).multiplyScalar(1.12+r()*.45).lerp(new THREE.Color('#a7b858'),.22);
   pos.set(mx-W/2,h+ .02,my-H/2);q.setFromAxisAngle(up,r()*6.28);
   const k=.55+r()*.6;sc.set(k,k*(.8+r()*.5),k);m4.compose(pos,q,sc);grass.setMatrixAt(n,m4);grass.setColorAt(n,c);n++;
  }
  grass.count=n;grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;grassCenter=[px,py];
 }

 /* ---------- elementos rurais ---------- */
 function addFields(list){
  if(!list?.length)return;const rows=[];
  for(const f of list){const n=Math.max(3,Math.floor(f.w/.85));for(let i=0;i<n;i++)rows.push([f,i,n])}
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:1}),rows.length),
   m4=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),sc=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  rows.forEach(([f,i,n],k)=>{
   const lx=(i/(n-1)-.5)*(f.w-1.2),ax=[Math.cos(f.rot),-Math.sin(f.rot)],mx=f.x+ax[0]*lx+S.cx,my=f.y+ax[1]*lx+S.cy,h=f.hue<.4?.32:f.hue<.75?.22:.1;
   p.set(mx-W/2,Gmap(mx,my)+h/2,my-H/2);q.setFromAxisAngle(up,f.rot);sc.set(.36,h,f.d-1.2);m4.compose(p,q,sc);im.setMatrixAt(k,m4);
   im.setColorAt(k,new THREE.Color(f.hue<.4?'#c9aa4f':f.hue<.75?'#7ea34a':'#6b4f35').multiplyScalar(.85+((i*7)%5)*.06));
  });
  im.receiveShadow=im.castShadow=true;im.frustumCulled=false;root.add(im);fieldsMesh=im;
 }
 function addWindmill(wm){
  if(!wm)return;const mb=new Mesher(),T=tc(PAL.stone,.98);
  mb.cyl('stone',2.4,1.5,6.4,10,{at:[wm.x,wm.y,wm.z],tint:T},false);mb.cyl('roof',2.1,0,2.1,10,{at:[wm.x,wm.y+6.4,wm.z],tint:tc(PAL.roof)});
  const fx=Math.sin(wm.rot),fz=Math.cos(wm.rot);
  mb.box('wood',.9,1.7,.13,{at:[wm.x+fx*2,wm.y,wm.z+fz*2],rot:wm.rot,tint:tc(PAL.woodDark)});
  mb.box('glass',.45,.7,.1,{at:[wm.x+fx*1.7,wm.y+3.7,wm.z+fz*1.7],rot:wm.rot});
  const g=mb.group();root.add(g);
  const hub=new THREE.Group();hub.position.set(wm.x+fx*2,wm.y+5.6,wm.z+fz*2);hub.rotation.y=wm.rot;
  const sp=new THREE.Group(),bl=new Mesher();
  for(let k=0;k<4;k++){const a=k*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);
   bl.beam('wood',[0,0,0],[c*4.2,sn*4.2,0],.14,{tint:tc(PAL.woodDark)});
   bl.beam('cloth',[c*1.1-sn*.55,sn*1.1+c*.55,0],[c*4-sn*.55,sn*4+c*.55,0],.68,{tint:tc(PAL.cloth2)})}
  bl.box('wood',.55,.55,.55,{at:[0,-.28,0],tint:tc(PAL.woodDark)});
  const bg=bl.group();sp.add(bg);hub.add(sp);root.add(hub);spin=sp;addSolid(wm.x+W/2,wm.z+H/2,2.6);
 }
 function addSmoke(pts){
  if(!pts?.length)return;const per=7,N=pts.length*per,pos=new Float32Array(N*3),ph=new Float32Array(N);let k=0;
  for(const p of pts)for(let i=0;i<per;i++){pos[k*3]=p[0];pos[k*3+1]=p[1];pos[k*3+2]=p[2];ph[k]=i/per+Math.random()*.1;k++}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('ph',new THREE.BufferAttribute(ph,1));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:shared.uTime,uNight:shared.uNight},vertexShader:'attribute float ph;uniform float uTime;varying float vA;void main(){float t=fract(uTime*.1+ph);vec3 p=position+vec3(t*1.5+sin(t*6.+ph*40.)*.3,t*4.2,sin(t*4.+ph*30.)*.2);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(7.+t*26.)*(260./-mv.z);vA=(1.-t)*smoothstep(0.,.12,t)*.45;}',fragmentShader:'varying float vA;uniform float uNight;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float a=vA*(1.-d*2.);gl_FragColor=vec4(mix(vec3(.78,.76,.72),vec3(.28,.3,.36),uNight),a);}'});
  const pts3=new THREE.Points(g,mat);pts3.frustumCulled=false;root.add(pts3);
 }

 /* ---------- HUD ---------- */
 const el=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild};
 const hud=el(`<div id="streetHud" hidden>
  <div class="svTop"><div class="svPlace"><small>VISÃO LOCAL</small><b id="svName">—</b><span id="svSub"></span><em id="svLore" hidden></em></div>
   <div class="svCompass"><b id="svDir">N</b><span id="svDeg">0°</span></div></div>
  <div class="svState"><b id="svMode">A pé</b><span id="svAlt">—</span><em id="svDistrict" hidden></em></div>
  <div class="svPause" id="svPause"><div><b>Clique para olhar ao redor</b><span>WASD mover · Shift correr · Espaço pular · 2× Espaço voar · C descer · T hora · Esc mapa</span></div></div>
  <div class="svToast" id="svToast"></div>
  <div class="svBar"><div class="svTimes">${Object.entries(PRESETS).map(([k,v])=>`<button data-time="${k}">${v.label}</button>`).join('')}</div>
   <button id="svFly" title="Ligar/desligar o voo (2× Espaço ou F)">🕊 Voo</button>
   <button id="svExit">⤴ Voltar ao mapa</button></div></div>`);
 const fade=el('<div id="streetFade"></div>'),pickChip=el('<div id="streetPick" hidden><b>Ver no local</b><span>Clique no mapa para descer no lugar · Esc cancela</span></div>');
 document.body.append(hud,fade,pickChip);
 const $h=s=>hud.querySelector(s);
 let toastTimer=0;
 function hudToast(msg){const t=$h('#svToast');if(!t)return;t.textContent=msg;t.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),2600)}
 hud.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.time));
 $h('#svExit').onclick=()=>exit();
 $h('#svFly').onclick=()=>toggleFlight();
 $h('#svPause').onclick=()=>lock();
 function lock(){try{const p=renderer.domElement.requestPointerLock?.();p?.catch?.(()=>{})}catch{}}

 function applyPreset(name){
  const p=PRESETS[name]||PRESETS.dia;S.time=name;
  const d=new THREE.Vector3(...p.sun).normalize();S.sunDir=d;
  shared.uSun.value.copy(d);
  light.color.set(p.sunC);light.intensity=p.sunI;hemi.intensity=p.hemiI;hemi.color.set(p.sky);hemi.groundColor.set(p.gnd);
  scene.fog.color.set(p.hor);scene.fog.near=p.fogN/M;scene.fog.far=p.fogF/M;
  scene.background=skyTexture(p.top,p.hor,p.bottom);
  shared.uNight.value=p.night;renderer.toneMappingExposure=p.exp;
  hud.querySelectorAll('[data-time]').forEach(b=>b.classList.toggle('active',b.dataset.time===name));
 }
 function setMode(){
  const m=$h('#svMode');if(!m)return;
  m.textContent=S.flying?'Voo':S.moving?(S.keys.has('ShiftLeft')||S.keys.has('ShiftRight')?'Correndo':'Andando'):'A pé';
  m.classList.toggle('fly',S.flying);
 }
 const DISTRICT_NAME={market:'Mercado',temple:'Templo',military:'Quartel',craft:'Oficinas',residential:'Bairro'};
 function updateDistrict(){
  const elD=$h('#svDistrict');if(!elD)return;
  let txt='';
  if(S.lay?.districts){
   let best=null;
   for(const d of S.lay.districts){
    const dd=Math.hypot((S.x-S.cx)-d.u,(S.y-S.cy)-d.v);
    if(dd<d.r*1.35&&(!best||dd<best.dd))best={d,dd};
   }
   if(best)txt='Distrito · '+(DISTRICT_NAME[best.d.kind]||best.d.kind);
  }
  if(txt!==elD.textContent){elD.textContent=txt;elD.hidden=!txt}
 }

 /* ---------- voo / pulo ---------- */
 function toggleFlight(force){
  if(!S.active)return;
  const on=force!==undefined?!!force:!S.flying;
  S.flying=on;S.vy=0;S.grounded=!on;
  const b=$h('#svFly');if(b)b.classList.toggle('on',on);
  hudToast(on?'Voo ativado · Espaço sobe, C desce, 2× Espaço desliga':'Voo desligado');
  setMode();
 }
 function jump(){
  if(S.flying||!S.grounded)return;
  S.vy=JUMP;S.grounded=false;
 }
 function spaceTap(){
  const now=performance.now();
  if(now-S.lastSpace<340){S.lastSpace=0;toggleFlight();return}
  S.lastSpace=now;
  if(!S.flying)jump();
 }

 /* ---------- entrada ---------- */
 function nearestCity(mx,my,maxD=2){
  let best=null,bd=maxD;
  for(const b of D.cities){if(b.excluded)continue;const d=Math.hypot(b.x-mx,b.y-my);if(d<bd){bd=d;best=b}}
  return best;
 }
 // ponto de terra firme mais próximo (permite descer perto de água/lagos)
 function findLand(mx,my){
  if(worldLand(mx,my))return[mx,my];
  for(let r=1;r<=10;r+=1)for(let a=0;a<Math.PI*2;a+=.4){
   const x=mx+Math.cos(a)*r,y=my+Math.sin(a)*r;
   if(worldLand(x,y))return[x,y];
  }
  return null;
 }
 let loreIndex=null,loreLoading=null;
 function loadLore(){
  if(loreIndex)return Promise.resolve(loreIndex);
  if(!loreLoading)loreLoading=fetch('./history-archive.json',{cache:'force-cache'})
   .then(r=>r.ok?r.json():null).then(a=>{if(a)loreIndex=indexLore(a);return loreIndex}).catch(()=>null);
  return loreLoading;
 }
 loadLore();
 let econIndex=null,econLoading=null;
 function loadEconomy(){
  if(econIndex)return Promise.resolve(econIndex);
  if(!econLoading)econLoading=fetch('./economy-source.json',{cache:'force-cache'})
   .then(r=>r.ok?r.json():null).then(E=>{
    if(E)econIndex={goods:new Map((E.goods||[]).map(g=>[String(g.i),g.name])),defaults:E.cityDefaults||{}};
    return econIndex;
   }).catch(()=>null);
  return econLoading;
 }
 loadEconomy();
 function topProduction(cityId,n=3){
  if(!econIndex||cityId==null)return [];
  const d=econIndex.defaults[String(cityId)]||{};
  return Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,n)
   .map(([gid])=>econIndex.goods.get(String(gid))).filter(Boolean);
 }
 async function enterAt(mx,my,opts={}){
  if(S.active||S.entering)return;
  S.entering=true;
  const city=opts.cityId!=null?D.cities.find(c=>c.i===opts.cityId):nearestCity(mx,my);
  let cx=city?city.x:mx,cy=city?city.y:my;
  if(!city){const land=findLand(cx,cy);if(!land){S.entering=false;toast?.('Escolha um ponto em terra firme.');return}[cx,cy]=land}
  if(!S.field&&!cellAt(cx,cy)){S.entering=false;toast?.('Escolha um ponto em terra firme.');return}
  cancelPick();
  fade.classList.add('on');
  await new Promise(r=>setTimeout(r,380));
  try{
   let lore=null,production=[];
   if(city){
    try{
     const [idxL,idxE]=await Promise.race([
      Promise.all([loadLore(),loadEconomy()]),
      new Promise(r=>setTimeout(()=>r([null,null]),1400))
     ]);
     lore=idxL?loreForCity(idxL,city.i):null;
     if(idxE)econIndex=idxE;
     production=topProduction(city.i);
    }catch{}
   }
   const cell=cellAt(cx,cy);
   const climate=climateOf(cell);
   const pop=city?Math.max(120,inhabitants(D,city)||400):140;
   const t0=performance.now();
   const site=siteFor({D,point:[cx,cy],cellAt,surface,population:pop,city});
   if(!city){site.cityR=110;site.port=false;site.urbanR=0}
   const specific=!!lore&&!/^Ainda não foi registrada/i.test(lore.quote||'');
   const tr=specific?lore.traits:null;
   if(tr){
    if(tr.snow){site.snowCover=Math.max(site.snowCover,.6);site.snowLineM=Math.min(site.snowLineM,150);site.snowy=true}
    if(tr.port&&site.waterKind!=='none')site.port=true;
    if(tr.forest)site.forest=Math.min(1,site.forest+.12);
    if(tr.desert&&(site.biome===1||site.biome===2))site.palette=site.palette;
   }
   const field=createField(site);
   const tSite=performance.now();
   S.site=site;S.field=field;S.cx=cx;S.cy=cy;S.cityR=site.cityR;S.R=site.cityR*2+1200;
   const cls=city?.settlementClass||'',special=!!(city?.magicSchool||city?.dwarvenFortress),
    fort=!!(cls.startsWith('Forte')||city?.citadel||city?.dwarvenFortress);
   const rand=rng(Math.floor(cx*13+cy*7)+1);
   const kind=!city?'wild':fort?'fort':city.capital?'capital':(pop<1500||cls==='Vila'||cls==='Povoado')?'village':site.port?'port':'town';
   const lay=city?makeLayout({pop,capital:!!city.capital,village:kind==='village',fort,rand,port:site.port,kind}):null;
   S.lay=lay;
   if(lay){lay.cx=cx;lay.cy=cy;lay.walled=(!!(city.walls||lay.capital||city.citadel)||!!tr?.walls)&&!lay.fort&&!special&&(pop>1200||!!city.citadel)}
   // estilo pela cultura/clima (a história entra no traçado, não na paleta)
   let style=city?.dwarven||city?.dwarvenFortress?STYLES.dwarven:city?.magicSchool?STYLES.arcane:STYLES[climate]||STYLES.temperate;
   if(site.snowy&&style!==STYLES.cold&&style!==STYLES.dwarven)style={...style,roofCols:['#edf2f4','#e3ebee','#f5f8f7']};
   S.style=style;
   solids.clear();lamps=[];spin=null;fieldsMesh=null;
   const pathAtLocal=makePathField(lay);
   nearInfo=pathAtLocal;
   const pathAtMetres=(x,z)=>pathAtLocal(x/M,z/M);
   const color=city?stateColor(city):'#c0392b';
   // materiais e cena
   gmat=localGroundMaterial();gmat.userData.uSnow.value=site.snowLineM;
   gmat.userData.uSnowCover.value=site.snowCover;
   gmatBand=localGroundMaterial({clip:true});gmatBand.userData.uSnow.value=site.snowLineM;
   gmatBand.userData.uClipR.value=402;gmatBand.userData.uSnowCover.value=site.snowCover;
   wmat=localWaterMaterial();
   terrain=buildTerrain({field,site,material:gmat,bandMaterial:gmatBand,pathAt:pathAtMetres});
   terrain.group.position.set(cx-W/2,0,cy-H/2);
   root.add(terrain.group);
   water=buildWater({field,site,material:wmat});
   water.position.set(cx-W/2,.01,cy-H/2);root.add(water);
   const tTerrain=performance.now();
   // cidade ou ermo
   if(lay){
    const t=buildTownV2({b:city,cx,cy,lay,rand,climate,color,G:Gmap,landAt,
     toW,addSolid,pathAt:pathAtLocal,footprintY,special,field,site,blocked:blockedAt,style,snow:site.snowy,production});
    t.groups.forEach(g=>root.add(g));
    buildPeople([]);addFields(t.fields);addWindmill(t.windmill);addSmoke(t.smoke);lamps=t.lamps||[];
    roadsMat=localRoadMaterial({snow:site.snowy?.55:0});
    const roads=buildRoads({roads:lay.roads,cx,cy,plaza:lay.fort?0:lay.plaza,squares:lay.squares||[],heightAt:(u,v)=>Gmap(cx+u,cy+v),toW,urbanR:lay.Rt*.94,material:roadsMat});
    root.add(roads);
    const sp=special?ctx.specialModel?.(city):null;
    if(sp){sp.scale.setScalar(2.1);sp.position.set(cx-W/2,footprintY(cx,cy,10)+.2,cy-H/2);retexture(sp);
     sp.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});root.add(sp);addSolid(cx,cy,9)}
   }else{
    buildPeople([]);
    const wf=buildWildFeatures({cx,cy,R:320/M,rand,climate,G:Gmap,landAt,toW:(u,v)=>toW(cx+u,cy+v),addSolid,steep:()=>false,field});
    root.add(wf.group);lamps=wf.lamps||[];
   }
   // floresta e pedras
   const blockedLocal=(x,z,r)=>{const mx=cx+x/M,my=cy+z/M;return blockedAt(mx,my,r/M)};
   const tTown=performance.now();
   forest=buildForest({field,site,blocked:blockedLocal,radius:Math.min(2600,Math.max(1500,site.cityR*2.2)),seed:Math.floor(cx*7+cy*3)});
   forest.position.set(cx-W/2,0,cy-H/2);
   root.add(forest);
   scatter=buildScatter({field,site,blocked:blockedLocal,seed:Math.floor(cx+cy*3)});
   scatter.position.set(cx-W/2,0,cy-H/2);
   root.add(scatter);
   const tNature=performance.now();
   S.timing={site:Math.round(tSite-t0),terrain:Math.round(tTerrain-tSite),town:Math.round(tTown-tTerrain),nature:Math.round(tNature-tTown),total:Math.round(performance.now()-t0)};
   grassMat=grassMaterial();
   grass=null;
   // posição inicial: numa avenida, olhando para o centro (ou para o porto)
   let sx,sy,yaw;
   if(lay){
    // começa junto à praça, olhando para fora por uma avenida (rua livres à frente)
    const lookAz=Math.atan2(controls.target.x-camera.position.x,controls.target.z-camera.position.z);
    const mains=lay.roads.filter(r=>r.main&&!r.ring);
    let best=null;
    for(const rd of mains){
     const pts=rd.pts;let idx=-1;
     for(let i=0;i<pts.length;i++){if(Math.hypot(pts[i][0],pts[i][1])>lay.plaza+9){idx=i;break}}
     if(idx<0)continue;
     const p=pts[idx],a=pts[Math.max(0,idx-1)],b=pts[Math.min(pts.length-1,idx+1)];
     let tx=b[0]-a[0],tz=b[1]-a[1];
     if(tx*p[0]+tz*p[1]<0){tx=-tx;tz=-tz}              // sentido para fora do centro
     const L=Math.hypot(tx,tz)||1,az=Math.atan2(tx/L,tz/L);
     const score=Math.cos(az-lookAz)+Math.hypot(p[0],p[1])*.0004;
     if(!best||score>best.score)best={p,tx:tx/L,tz:tz/L,score};
    }
    if(best&&landAt(cx+best.p[0],cy+best.p[1])&&!blockedAt(cx+best.p[0],cy+best.p[1],.9)){
     sx=cx+best.p[0];sy=cy+best.p[1];yaw=Math.atan2(-best.tx,-best.tz);
    }else{
     const p=mains[0]?.pts.at(-1)||[0,lay.coreR*.7];sx=cx+p[0];sy=cy+p[1];
     yaw=Math.atan2(-(cx-sx),-(cy-sy));
    }
   }else{sx=cx;sy=cy;yaw=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z)}
   if(!landAt(sx,sy)){sx=cx;sy=cy}
   [sx,sy]=resolve(sx,sy);
   S.x=sx;S.y=sy;S.yaw=yaw;S.pitch=-.03;S.feet=Gmap(sx,sy);S.camY=S.feet+EYE;S.vy=0;S.grounded=true;S.flying=false;S.curCity=city;
   // câmera e atmosfera
   const sv={camPos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov,near:camera.near,far:camera.far,
    fogC:scene.fog.color.clone(),fogN:scene.fog.near,fogF:scene.fog.far,bg:scene.background,lp:light.position.clone(),lt:light.target.position.clone(),
    lc:light.color.clone(),li:light.intensity,hi:hemi.intensity,hc:hemi.color.clone(),hg:hemi.groundColor.clone(),
    sc:{l:light.shadow.camera.left,r:light.shadow.camera.right,t:light.shadow.camera.top,b:light.shadow.camera.bottom,n:light.shadow.camera.near,f:light.shadow.camera.far},
    bias:light.shadow.bias,nb:light.shadow.normalBias,exp:renderer.toneMappingExposure,night:shared.uNight.value,cut:shared.uCut.value.clone(),
    enabled:controls.enabled,worldVisible:world?world.visible:true,shadowSize:light.shadow.mapSize.x};
   S.saved=sv;
   if(world)world.visible=false;root.visible=true;
   camera.fov=72;camera.near=.12;camera.far=18000/M;camera.updateProjectionMatrix();controls.enabled=false;
   const lc=light.shadow.camera;lc.left=-150;lc.right=150;lc.top=150;lc.bottom=-150;lc.near=20;lc.far=6000;lc.updateProjectionMatrix();
   light.shadow.bias=-.0004;light.shadow.normalBias=.12;if(!light.target.parent)scene.add(light.target);
   if(light.shadow.mapSize.x!==2048){light.shadow.mapSize.set(2048,2048);light.shadow.map?.dispose();light.shadow.map=null}
   shared.uCut.value.set(0,0,0,0);
   scatterGrass(sx,sy);
   applyPreset(S.time||'dia');
   $h('#svName').textContent=city?title(city):'Terras selvagens';
   const feat=['camp','ruins','stones','hut','tower'];
   const extra=city?(site.port?' · porto':'')+(lay.walled?' · muralhas':''):'';
   $h('#svSub').textContent=(city
      ?(city.settlementClass||'Localidade')+' · '+Math.round(lay.pop).toLocaleString('pt-BR')+' hab.'+extra
      :'Ermo · pontos de interesse')+' · '+CLIMATE_NAME[climate]+(site.snowy?' · neve':'')+(production.length?' · produz '+production.slice(0,2).join(' e '):'')+' · horizonte 15 km';
   const loreEl=$h('#svLore');
   if(specific&&lore?.quote){loreEl.textContent='“'+lore.quote+'”';loreEl.hidden=false}
   else{loreEl.hidden=true;loreEl.textContent=''}
   $h('#svAlt').textContent='alt. '+(S.feet*M).toFixed(1)+' m';
   S.active=true;S.t0=0;document.body.classList.add('street');hud.hidden=false;setMode();
   $h('#svPause').classList.add('show');
   S.entering=false;
  }catch(err){console.error('street:',err);S.entering=false;toast?.('Não foi possível entrar no local.');exit(true)}
  fade.classList.remove('on');
 }

 /* ---------- saída ---------- */
 function disposeScene(){
  for(const o of[...root.children]){
   root.remove(o);
   o.traverse(n=>{
    if(n.geometry)n.geometry.dispose?.();
    const mats=Array.isArray(n.material)?n.material:(n.material?[n.material]:[]);
    for(const m of mats){if(m===gmat||m===wmat)continue;m.dispose?.()}
   });
  }
  grass=null;people=null;peopleData=[];terrain=null;water=null;forest=null;scatter=null;lamps=[];spin=null;fieldsMesh=null;
  solids.clear();
  gmat?.dispose();wmat?.dispose();gmatBand?.dispose();roadsMat?.dispose();gmat=null;wmat=null;gmatBand=null;roadsMat=null;
  grassMat?.dispose();grassMat=null;
  S.field=null;S.site=null;S.lay=null;nearInfo=null;
 }
 function exit(silent){
  if(!S.active&&!silent)return;
  if(document.pointerLockElement)document.exitPointerLock?.();
  const sv=S.saved;
  if(sv){camera.position.copy(sv.camPos);controls.target.copy(sv.target);camera.fov=sv.fov;camera.near=sv.near;camera.far=sv.far;camera.updateProjectionMatrix();
   scene.fog.color.copy(sv.fogC);scene.fog.near=sv.fogN;scene.fog.far=sv.fogF;scene.background=sv.bg;
   light.position.copy(sv.lp);light.target.position.copy(sv.lt);light.color.copy(sv.lc);light.intensity=sv.li;
   hemi.intensity=sv.hi;hemi.color.copy(sv.hc);hemi.groundColor.copy(sv.hg);
   const c=light.shadow.camera;Object.assign(c,{left:sv.sc.l,right:sv.sc.r,top:sv.sc.t,bottom:sv.sc.b,near:sv.sc.n,far:sv.sc.f});c.updateProjectionMatrix();
   light.shadow.bias=sv.bias;light.shadow.normalBias=sv.nb;renderer.toneMappingExposure=sv.exp;
   if(sv.shadowSize&&light.shadow.mapSize.x!==sv.shadowSize){light.shadow.mapSize.set(sv.shadowSize,sv.shadowSize);light.shadow.map?.dispose();light.shadow.map=null}
   shared.uNight.value=sv.night;shared.uCut.value.copy(sv.cut);controls.enabled=sv.enabled}
  if(world)world.visible=true;
  disposeScene();
  root.visible=false;S.active=false;S.flying=false;S.saved=null;S.keys.clear();
  document.body.classList.remove('street');hud.hidden=true;hud.querySelector('#svFly')?.classList.remove('on');
  controls.update();onExit?.();
 }

 /* ---------- seleção do ponto ---------- */
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let marker=null,pickDown=null;
 function hitAt(e){
  const r=renderer.domElement.getBoundingClientRect();
  ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
  ray.setFromCamera(ndc,camera);
  const t=ctx.getTerrain?.();if(!t)return null;
  const h=ray.intersectObject(t,false)[0];return h?{mx:h.point.x+W/2,my:h.point.z+H/2,p:h.point}:null;
 }
 function pick(){
  if(S.active||S.picking)return;
  S.picking=true;pickChip.hidden=false;document.body.classList.add('svPicking');renderer.domElement.style.cursor='crosshair';
  if(!marker){marker=new THREE.Mesh(new THREE.RingGeometry(1.6,2.1,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#f1dda9',transparent:true,opacity:.9,depthTest:false}));marker.renderOrder=9;scene.add(marker)}
  marker.visible=false;ctx.requestRender?.();
 }
 function cancelPick(){
  if(!S.picking)return;S.picking=false;pickChip.hidden=true;document.body.classList.remove('svPicking');renderer.domElement.style.cursor='';
  if(marker)marker.visible=false;ctx.requestRender?.();
 }
 addEventListener('pointermove',e=>{
  if(!S.picking||e.target!==renderer.domElement)return;
  const h=hitAt(e);if(h&&(worldLand(h.mx,h.my)||findLand(h.mx,h.my))){const c=nearestCity(h.mx,h.my,2);const p=c?new THREE.Vector3(c.x-W/2,Gmap(c.x,c.y)+.6,c.y-H/2):h.p;marker.position.set(p.x,p.y+.5,p.z);marker.scale.setScalar(c?2.2:1);marker.visible=true}else if(marker)marker.visible=false;
  ctx.requestRender?.();
 },true);
 addEventListener('pointerdown',e=>{
  if(S.picking&&e.target===renderer.domElement&&e.button===0)pickDown={x:e.clientX,y:e.clientY};
  if(S.active&&e.target===renderer.domElement){e.stopImmediatePropagation();if(!S.locked)lock()}
 },true);
 addEventListener('pointerup',e=>{
  if(S.picking&&e.target===renderer.domElement){
   e.stopImmediatePropagation();
   if(e.button===0&&pickDown&&Math.hypot(e.clientX-pickDown.x,e.clientY-pickDown.y)<6){const h=hitAt(e);if(h){const land=findLand(h.mx,h.my);if(!land)toast?.('Escolha um ponto em terra firme.');else enterAt(land[0],land[1])}}
   pickDown=null;return;
  }
  if(S.active&&e.target===renderer.domElement)e.stopImmediatePropagation();
 },true);
 for(const ev of['click','dblclick','contextmenu'])addEventListener(ev,e=>{if((S.picking||S.active)&&e.target===renderer.domElement)e.stopImmediatePropagation()},true);
 addEventListener('wheel',e=>{if(S.active&&e.target===renderer.domElement){e.stopImmediatePropagation();e.preventDefault()}},{capture:true,passive:false});
 document.addEventListener('pointerlockchange',()=>{S.locked=document.pointerLockElement===renderer.domElement;$h('#svPause').classList.toggle('show',S.active&&!S.locked)});
 document.addEventListener('mousemove',e=>{if(!S.active||!S.locked)return;S.yaw-=e.movementX*.0022;S.pitch=Math.max(-1.35,Math.min(1.35,S.pitch-e.movementY*.0022))});
 addEventListener('keydown',e=>{
  if(S.picking&&e.key==='Escape'){cancelPick();return}
  if(!S.active)return;
  if(e.target.matches?.('input,textarea,select'))return;
  if(e.key==='Escape'&&!S.locked){exit();return}
  if(e.code==='KeyT'&&!e.repeat){const ks=Object.keys(PRESETS);applyPreset(ks[(ks.indexOf(S.time)+1)%ks.length]);return}
  if(e.code==='KeyF'&&!e.repeat){toggleFlight();return}
  if(e.code==='Space'){if(!e.repeat){spaceTap();S.keys.add('Space')}e.preventDefault();return}
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','ControlLeft','KeyC'].includes(e.code)){S.keys.add(e.code);e.preventDefault();e.stopImmediatePropagation()}
 },true);
 addEventListener('keyup',e=>{S.keys.delete(e.code)},true);
 addEventListener('blur',()=>S.keys.clear());

 /* ---------- quadro a quadro ---------- */
 function update(now){
  if(!S.active)return false;
  const dt=Math.min(.05,(now-(S.t0||now))/1000);S.t0=now;shared.uTime.value=now*.001;
  const k=S.keys;
  const f=(k.has('KeyW')||k.has('ArrowUp')?1:0)-(k.has('KeyS')||k.has('ArrowDown')?1:0),
   st=(k.has('KeyD')?1:0)-(k.has('KeyA')?1:0),
   turn=(k.has('ArrowLeft')?1:0)-(k.has('ArrowRight')?1:0);
  if(turn)S.yaw+=turn*1.7*dt;
  const shift=k.has('ShiftLeft')||k.has('ShiftRight');
  S.moving=false;
  const speedM=S.flying?FLY*(shift?2.2:1):(shift?RUN:WALK);
  if(f||st){
   const l=Math.hypot(f,st),sp=speedM*dt/l/ M;                 // unidades por quadro
   const fx=-Math.sin(S.yaw),fz=-Math.cos(S.yaw),rx=Math.cos(S.yaw),rz=-Math.sin(S.yaw);
   let nx=S.x+(fx*f+rx*st)*sp,ny=S.y+(fz*f+rz*st)*sp;
   [nx,ny]=resolve(nx,ny);
   const canWalk=(x,y)=>{
    if(S.flying)return true;
    if(!landAt(x,y))return false;
    if(S.field.depthM((x-S.cx)*M,(y-S.cy)*M)>.55)return false;      // não atravessa água funda a pé
    const climb=(Gmap(x,y)-Gmap(S.x,S.y))*M;
    return climb<1.8||S.vy>0;                                      // não escala paredes
   };
   let moved=false;
   if(canWalk(nx,ny)){S.x=nx;S.y=ny;moved=true}
   else if(canWalk(nx,S.y)){S.x=nx;moved=true}
   else if(canWalk(S.x,ny)){S.y=ny;moved=true}
   if(moved){S.moving=true;S.bob+=dt*(shift?13:9)}
  }
  // física vertical
  if(S.flying){
   const up=(k.has('Space')||k.has('KeyE')?1:0)-(k.has('ControlLeft')||k.has('KeyC')?1:0);
   S.feet+=up*FLYV*dt;
   const g=Gmap(S.x,S.y);
   S.feet=Math.max(g+ .1/M,Math.min(S.feet,g+1800/M));
   S.vy=0;S.grounded=false;
  }else{
   S.vy-=GRAV*dt;S.feet+=S.vy*dt;
   const g=Gmap(S.x,S.y);
   if(S.feet<=g){S.feet=g;S.vy=0;S.grounded=true}else S.grounded=false;
  }
  // limites do lugar
  const dxm=(S.x-S.cx)*M,dym=(S.y-S.cy)*M,dr=Math.hypot(dxm,dym),lim=S.site?Math.max(4500,S.cityR*5):3200;
  if(dr>lim){S.x=S.cx+dxm/dr*lim/M;S.y=S.cy+dym/dr*lim/M}
  if(spin)spin.rotation.z=now*.0008;
  if(terrain)terrain.update((S.x-S.cx)*M,(S.y-S.cy)*M);
  // câmera
  const by=S.moving&&S.grounded?Math.sin(S.bob)*.03:0;
  const wx=S.x-W/2,wz=S.y-H/2;
  const target=S.feet+EYE+by;
  S.camY=S.camY==null?target:S.camY+(target-S.camY)*(1-Math.exp(-14*dt));
  camera.position.set(wx,S.camY,wz);camera.rotation.set(S.pitch,S.yaw,0,'YXZ');camera.updateMatrixWorld();
  if(grassMat)grassMat.userData.uPlayer.value.set(wx,S.feet,wz);
  const d=S.sunDir||new THREE.Vector3(-.5,1,-.35).normalize();
  light.target.position.set(wx,S.feet,wz);light.position.set(wx+d.x*2200*(M===M?1:1),S.feet+d.y*2200,wz+d.z*2200);
  light.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;
  // grama local
  if(Math.hypot(S.x-grassCenter[0],S.y-grassCenter[1])*M>34)scatterGrass(S.x,S.y);
  updatePeople(dt,now);
  const bearing=((-S.yaw*180/Math.PI)%360+360)%360;
  $h('#svDir').textContent=DIRS[Math.round(bearing/45)%8];
  $h('#svDeg').textContent=Math.round(bearing)+'°';
  $h('#svAlt').textContent=(S.flying?'voo · ':'alt. ')+Math.round(S.feet*M)+' m';
  updateDistrict();
  setMode();
  return true;
 }

 return {get active(){return S.active},get picking(){return S.picking},pick,cancelPick,enterAt,exit,update,nearestCity,presets:PRESETS,setTime:applyPreset,
  debug:{
   state:()=>({x:S.x,y:S.y,cx:S.cx,cy:S.cy,feet:S.feet,yaw:S.yaw,pitch:S.pitch,flying:S.flying,grounded:S.grounded,city:S.curCity?.i,radius:S.cityR,timing:S.timing,
    site:S.site?{water:S.site.waterKind,shore:S.site.shoreDistM,lake:S.site.lakeR,ranges:S.site.ranges.map(r=>({d:r.distM,h:r.heightM}))}:null}),
   pose:(x,y,yaw,pitch=.0)=>{if(!S.active)return false;S.x=x;S.y=y;if(yaw!=null)S.yaw=yaw;S.pitch=pitch;S.feet=Gmap(x,y);S.vy=0;S.grounded=true;return true},
   look:(yaw,pitch=0)=>{S.yaw=yaw;S.pitch=pitch;return true},
   fly:(on=true)=>{toggleFlight(on);return S.flying},
   view:(dx,dz,h=2,yaw=null,pitch=0)=>{if(!S.active)return false;
    S.x=S.cx+dx/M;S.y=S.cy+dz/M;S.feet=Gmap(S.x,S.y)+h/M;S.vy=0;S.grounded=!S.flying;
    if(yaw!=null)S.yaw=yaw;S.pitch=pitch;return true},
   hint:(on=false)=>{$h('#svPause').classList.toggle('show',!!on);return true},
   probe:(x,z)=>S.field?{h:S.field.heightM(x,z),depth:S.field.depthM(x,z),shore:S.field.shoreM(x,z),forest:S.field.forestAt(x,z)}:null,
   path:(u,v)=>nearInfo?nearInfo(u,v):null,
   water:(on=true)=>{if(water)water.visible=!!on;return true},
   people:()=>({count:peopleData.length,shown:people?peopleData.length:0}),
   sites:()=>({cityR:S.cityR,lay:S.lay?{N:S.lay.N,Rt:S.lay.Rt,coreR:S.lay.coreR,roads:S.lay.roads.length,walled:!!S.lay.walled}:null,
    placed:S.lay?.placed?.length,lamps:lamps.length,near:terrain?.centre,harbour:!!root.getObjectByName('harbour')}),
   teleportLocal:(dx,dz)=>{S.x=S.cx+dx/M;S.y=S.cy+dz/M;S.feet=Gmap(S.x,S.y);S.vy=0;return true},
   quality:(shadows=true)=>{renderer.shadowMap.enabled=!!shadows;ctx.requestRender?.();return true}
  }};
}
