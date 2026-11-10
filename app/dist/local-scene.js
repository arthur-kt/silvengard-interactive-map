// Silvengard · v44 — cena local: relevo em faixas de detalhe, água de verdade, floresta.
//
// Tudo é gerado em código a partir do campo local (local-field.js). Nada disso altera
// world.json: o lugar é uma leitura em escala real do ponto escolhido.
import * as THREE from 'three';
import {shared,NOISE} from './visuals.js?v=45';
import {rng} from './settlements.js?v=45';
import {M_PER_UNIT as U,WORLD_M_PER_UNIT,smooth,vnoise,fbm2} from './local-field.js?v=45';

const M=U;                                  // metros por unidade de cena
const col=hex=>new THREE.Color(hex);

/* =====================================================================
   materiais
   ===================================================================== */
export function localGroundMaterial({clip=false}={}){
 const uni={uM:{value:M},uSnow:{value:820},uSand:{value:col('#cdb78c')},uRock:{value:col('#8d867a')},
  uWet:{value:col('#6f6550')},uSnowCol:{value:col('#eef2ef')},uGrassHi:{value:col('#a8bd72')},
  uClip:{value:clip?1:0},uClipR:{value:400},uPlayer:{value:new THREE.Vector2()}};
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 m.userData=uni;
 m.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uni);
  shader.vertexShader='attribute float aShore;attribute float aHeight;attribute vec2 aPath;attribute float aUrban;varying float vShore;varying float vHeight;varying vec2 vPath;varying float vUrban;varying vec3 vGPos;varying vec3 vGN;\n'+
   shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvShore=aShore;vHeight=aHeight;vPath=aPath;vUrban=aUrban;vGPos=position;vGN=normal;');
  shader.fragmentShader='varying float vShore;varying float vHeight;varying vec2 vPath;varying float vUrban;varying vec3 vGPos;varying vec3 vGN;uniform float uM,uSnow,uClip,uClipR;uniform vec2 uPlayer;uniform vec3 uSand,uRock,uWet,uSnowCol,uGrassHi;\n'+NOISE+
   shader.fragmentShader
   .replace('#include <color_fragment>',`#include <color_fragment>
   vec2 gp=vGPos.xz*uM;
   if(uClip>.5&&distance(gp,uPlayer)<uClipR)discard;              // faixas grossas cedem lugar à malha fina
   vec3 base=diffuseColor.rgb;
   float slope=1.-clamp(normalize(vGN).y,0.,1.);
   float n1=atlasFbm(gp*.012),n2=atlasFbm(gp*.085+3.1),n3=atlasNoise(gp*.42),n4=atlasNoise(gp*1.7);
   float dist=length(vViewPosition);
   float fine=1.-smoothstep(30.,130.,dist);
   vec3 c=base*(.88+.2*n1)*(.94+.12*n2);
   c=mix(c,c*1.14+uGrassHi*.08,smoothstep(.42,.78,n1)*.5);
   c*=1.+(n3-.5)*.2*fine;
   // chão urbano: terra batida, cascalho e lajes entre as casas
   float urb=min(1.,vUrban*1.15)*(.55+.45*atlasNoise(gp*.05));
   vec3 packed=mix(vec3(.26,.22,.16),vec3(.38,.32,.24),n2)*(.86+.24*n3);
   c=mix(c,packed,urb*.9);
   c=mix(c,vec3(.47,.43,.36)*(.82+.28*n3),smoothstep(.7,.95,atlasNoise(gp*.22))*urb*.5);
   float rock=smoothstep(.2,.46,slope+(n2-.5)*.14);
   c=mix(c,uRock*(.78+.42*n2),rock*.9);
   float snow=smoothstep(uSnow*.94,uSnow*1.05,vHeight+(n1-.5)*90.)*(1.-smoothstep(.5,.78,slope));
   c=mix(c,uSnowCol,snow*.96);
   float sand=smoothstep(30.,7.,vShore);
   vec3 sandC=uSand*(.9+.16*n3)*(.94+.1*n2);
   c=mix(c,sandC,sand);
   float wet=smoothstep(5.,-1.,vShore);
   c=mix(c,uWet,wet*.5);
   c=mix(c,vec3(.36,.38,.31)*(.8+.3*n2),smoothstep(-.5,-7.,vShore)*.65);
   float cob=0.;                                                   // as ruas são geometria própria
   float dirt=smoothstep(.16,.5,vPath.x);
   vec3 dirtC=mix(vec3(.31,.24,.16),vec3(.46,.36,.24),n2)*(.85+.3*n3);
   c=mix(c,dirtC,dirt*.22);
   diffuseColor.rgb=c;`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   {float amp=.16*(1.-smoothstep(90.,420.,length(vViewPosition)));float hh=(atlasFbm(gp*.5)*.6+atlasNoise(gp*2.1)*.4)*amp;
    vec3 dpdx=dFdx(-vViewPosition),dpdy=dFdy(-vViewPosition);vec3 r1=cross(dpdy,normal),r2=cross(normal,dpdx);float det=dot(dpdx,r1);
    normal=normalize(abs(det)*normal-sign(det)*(dFdx(hh)*r1+dFdy(hh)*r2));}`);
 };
 return m;
}

export function localWaterMaterial(uni){
 const material=new THREE.ShaderMaterial({
  fog:true,transparent:true,depthWrite:true,
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{
   uTime:shared.uTime,uSun:shared.uSun,
   uShallow:{value:col('#5fc0b0')},uMid:{value:col('#2a7f96')},uDeep:{value:col('#0f3b55')},uSky:{value:col('#a9cad6')},uSunColor:{value:col('#ffe6b8')}}]),
  vertexShader:`attribute float aDepth;attribute float aGround;varying vec3 vW;varying float vD;varying float vG;
  #include <fog_pars_vertex>
  void main(){vec4 wp=modelMatrix*vec4(position,1.);vW=wp.xyz;vD=aDepth;vG=aGround;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float uTime;uniform vec3 uSun,uShallow,uMid,uDeep,uSky,uSunColor;varying vec3 vW;varying float vD;varying float vG;
  #include <common>
  #include <fog_pars_fragment>
  ${NOISE}
  void main(){
   if(vD<=.07||vG>-.02)discard;
   vec2 xz=vW.xz;float dist=length(cameraPosition-vW);
   float far=1./(1.+dist*.0011),fine=clamp(1.-dist/900.,0.,1.);
   float t=uTime;
   // três trens de onda com direções e períodos incomensuráveis (sem padrão de grade)
   vec2 g=vec2(0.);
   g+=vec2(.83,.56)*cos(dot(xz,vec2(.83,.56))*.47+t*1.05)*.10;
   g+=vec2(-.42,.91)*cos(dot(xz,vec2(-.42,.91))*.93-t*1.35)*.075;
   g+=vec2(.97,-.24)*cos(dot(xz,vec2(.97,-.24))*1.87+t*.72)*.045*fine;
   vec2 p=xz*.075+vec2(t*.028,-t*.019);float n0=atlasFbm(p);
   g+=vec2(atlasFbm(p+vec2(.11,0.))-n0,atlasFbm(p+vec2(0.,.11))-n0)*1.5*fine;
   g+=vec2(atlasFbm(xz*.33+t*.05),atlasFbm(xz*.33-t*.04))*vec2(.16,-.12)*fine;
   g*=far;
   vec3 n=normalize(vec3(-g.x,1.,-g.y));
   float d=vD;
   vec3 c=mix(uShallow,uMid,smoothstep(.25,4.2,d));c=mix(c,uDeep,smoothstep(4.5,22.,d));
   float mott=atlasFbm(xz*.05+t*.01);
   c*= .92+.16*mott;
   vec3 V=normalize(cameraPosition-vW),L=normalize(uSun);
   float fres=.035+.965*pow(1.-max(dot(n,V),0.),5.);
   c=mix(c*(.66+.34*max(dot(n,L),0.)),uSky*(.92+.2*n.y),clamp(fres*.85,0.,.8));
   vec3 H=normalize(L+V);float nh=max(dot(n,H),0.);
   c+=uSunColor*(pow(nh,180.)*.35*(1.-smoothstep(2.,11.,d))+pow(nh,24.)*.035)*far;
   float shoreB=1.-smoothstep(0.,2.2,d);
   float fn=atlasFbm(xz*.7+vec2(t*.18,-t*.11))*atlasFbm(xz*2.3-t*.2);
   float foam=shoreB*smoothstep(.35,.95,fn)*.9;
   foam+=smoothstep(.35,0.,d)*.35;
   c=mix(c,vec3(.93,.97,.96),clamp(foam,0.,1.)*.75);
   float a=mix(.5,1.,smoothstep(0.,2.2,d));
   gl_FragColor=vec4(c,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   #include <fog_fragment>
  }`});
 material.uniforms.uTime=shared.uTime;material.uniforms.uSun=shared.uSun;
 return material;
}

/* =====================================================================
   relevo em faixas
   ===================================================================== */
function paletteFor(site){
 const a=col(site.grass[0]),b=col(site.grass[1]),c2=col(site.palette[2]||site.grass[1]);
 return (x,z,target)=>{
  const n=fbm2(x*.0021+site.seed*.07,z*.0021-site.seed*.05,site.seed+91);
  const n2=fbm2(x*.018,z*.018,site.seed+97);
  return target.copy(a).lerp(b,n).lerp(c2,n2*.28);
 };
}
function bandGeometry(field,site,{half,step,cx=0,cz=0,inner=0,pathAt=null,forest=true}){
 const n=Math.max(1,Math.ceil(2*half/step)),n1=n+1,s=2*half/n;
 const count=n1*n1;
 const pos=new Float32Array(count*3),colA=new Float32Array(count*3),shore=new Float32Array(count),
  height=new Float32Array(count),path=new Float32Array(count*2),urban=new Float32Array(count);
 const pal=paletteFor(site),tmp=new THREE.Color();
 const R=site.urbanR!==undefined?site.urbanR:site.cityR;
 for(let j=0;j<=n;j++){
  const z=cz-half+j*s;
  for(let i=0;i<=n;i++){
   const x=cx-half+i*s,k=j*n1+i;
   const h=field.heightM(x,z);
   pos[k*3]=x/M;pos[k*3+1]=h/M;pos[k*3+2]=z/M;
   shore[k]=field.shoreM(x,z);height[k]=h;
   const rr=Math.hypot(x,z);
   urban[k]=(1-smooth(R*.86,R*1.14,rr))*(.72+.28*vnoise(x*.02,z*.02,site.seed+5));
   pal(x,z,tmp).multiplyScalar(.92+.16*vnoise(x*.06,z*.06,site.seed+3)).toArray(colA,k*3);
   if(forest){const f=field.forestAt(x,z);if(f>.02){tmp.setRGB(colA[k*3],colA[k*3+1],colA[k*3+2]).multiplyScalar(1-.28*f);colA[k*3]=tmp.r;colA[k*3+1]=tmp.g;colA[k*3+2]=tmp.b}}
   if(pathAt&&x*x+z*z<(R*1.3)*(R*1.3)){const p=pathAt(x,z);path[k*2]=p[0];path[k*2+1]=p[1]}
  }
 }
 const idx=[];
 const inInner=(x,z)=>Math.abs(x)<inner&&Math.abs(z)<inner;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const a=j*n1+i,b=a+1,d=a+n1,e=d+1;
  if(inner>0){
   const x0=cx-half+i*s,z0=cz-half+j*s,x1=x0+s,z1=z0+s;
   if(inInner(x0,z0)&&inInner(x1,z0)&&inInner(x0,z1)&&inInner(x1,z1))continue;
  }
  idx.push(a,d,b,b,d,e);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(pos,3));
 g.setAttribute('color',new THREE.BufferAttribute(colA,3));
 g.setAttribute('aShore',new THREE.BufferAttribute(shore,1));
 g.setAttribute('aHeight',new THREE.BufferAttribute(height,1));
 g.setAttribute('aPath',new THREE.BufferAttribute(path,2));
 g.setAttribute('aUrban',new THREE.BufferAttribute(urban,1));
 g.setIndex(idx);
 g.computeVertexNormals();
 g.computeBoundingSphere();
 return g;
}

/** Terreno em faixas: uma malha fina que acompanha o jogador e quatro faixas estáticas.
 *  As faixas recortam um círculo ao redor do jogador para não cobrirem a malha fina. */
export function buildTerrain({field,site,material,bandMaterial,pathAt}){
 const group=new THREE.Group();group.name='localTerrain';
 const bands=[
  {half:420,step:4.5,near:true},
  {half:1000,step:14},
  {half:2500,step:34},
  {half:6200,step:80},
  {half:15500,step:145}
 ];
 let nearMesh=null,nearCX=1e9,nearCZ=1e9;
 for(const b of bands){
  if(b.near)continue;
  const geo=bandGeometry(field,site,{half:b.half,step:b.step,pathAt});
  const mesh=new THREE.Mesh(geo,bandMaterial||material);mesh.receiveShadow=true;mesh.frustumCulled=false;
  group.add(mesh);
 }
 function buildNear(x,z){
  const snap=18;const cx=Math.round(x/snap)*snap,cz=Math.round(z/snap)*snap;
  if(nearMesh){group.remove(nearMesh);nearMesh.geometry.dispose()}
  const geo=bandGeometry(field,site,{half:420,step:4.5,cx,cz,pathAt});
  nearMesh=new THREE.Mesh(geo,material);nearMesh.receiveShadow=true;nearMesh.frustumCulled=false;
  group.add(nearMesh);nearCX=cx;nearCZ=cz;
 }
 buildNear(0,0);
 return {group,update(x,z){
   if(bandMaterial?.userData?.uPlayer)bandMaterial.userData.uPlayer.value.set(x,z);
   if(Math.hypot(x-nearCX,z-nearCZ)>110)buildNear(x,z);
  },
  get centre(){return[nearCX,nearCZ]},
  dispose(){for(const c of group.children){c.geometry?.dispose()}}};
}

/* =====================================================================
   água (mar, lago ou rio — uma só superfície no nível 0)
   ===================================================================== */
export function buildWater({field,site,material}){
 const group=new THREE.Group();group.name='localWater';
 const bands=site.waterKind==='none'&&!site.hasRiver?[]:
  [{half:Math.min(1700,Math.max(900,site.cityR*1.2)),step:14},
   {half:5200,step:60,inner:null},
   {half:15500,step:240,inner:null}];
 bands.forEach((b,i)=>{if(i)b.inner=bands[i-1].half-20});
 for(const b of bands){
  const n=Math.max(1,Math.ceil(2*b.half/b.step)),n1=n+1,s=2*b.half/n;
  const pos=new Float32Array(n1*n1*3),dep=new Float32Array(n1*n1),gnd=new Float32Array(n1*n1);
  for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
   const k=j*n1+i,x=-b.half+i*s,z=-b.half+j*s;
   const h=field.heightM(x,z);
   pos[k*3]=x/M;pos[k*3+1]=.02;pos[k*3+2]=z/M;
   dep[k]=h<0?-.0-h:0;
   gnd[k]=h;
  }
  const idx=[];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const a=j*n1+i,c=a+1,d=a+n1,e=d+1;
   if(b.inner){const x0=-b.half+i*s,z0=-b.half+j*s,x1=x0+s,z1=z0+s;
    if(Math.abs(x0)<b.inner&&Math.abs(z0)<b.inner&&Math.abs(x1)<b.inner&&Math.abs(z1)<b.inner)continue}
   idx.push(a,d,c,c,d,e);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('aDepth',new THREE.BufferAttribute(dep,1));
  g.setAttribute('aGround',new THREE.BufferAttribute(gnd,1));
  g.setIndex(idx);g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,material);mesh.frustumCulled=false;mesh.renderOrder=2;
  group.add(mesh);
 }
 return group;
}

/* =====================================================================
   ruas, praça e caminhos (geometria própria, cobblestone de verdade)
   ===================================================================== */
export function localRoadMaterial(){
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0,
  polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
 m.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vRP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRP=position;');
  shader.fragmentShader='varying vec3 vRP;\n'+NOISE+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  vec2 gp=vRP.xz*${M.toFixed(2)};
  float n2=atlasFbm(gp*.08+3.1),n3=atlasNoise(gp*.5);
  float urban=diffuseColor.r;
  float rowH=.3+.07*atlasHash(vec2(floor(gp.y/.3),3.));
  float row=floor(gp.y/rowH);
  float bw=.3+.1*atlasHash(vec2(row,7.));
  vec2 cu=vec2(gp.x/bw, gp.y/rowH);cu.x+=mod(row,2.)*.5;
  vec2 cf=fract(cu);
  float ce=min(min(cf.x,1.-cf.x),min(cf.y,1.-cf.y));float cm=smoothstep(.07,.3,ce);
  vec3 stone=mix(vec3(.34,.31,.27),vec3(.56,.51,.43),atlasHash(floor(cu)+row))*(.78+.22*cm)*(.9+.12*n2);
  vec3 dirtC=mix(vec3(.36,.28,.19),vec3(.5,.4,.27),n2)*(.86+.2*n3)+step(.94,atlasNoise(gp*2.6))*.06;
  vec3 c=mix(dirtC,stone,urban);
  c*= .94+.1*n3;
  diffuseColor.rgb=c;`)
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  {float amp=.045;float hh=(1.-cm)*amp;vec3 dpdx=dFdx(-vViewPosition),dpdy=dFdy(-vViewPosition);vec3 r1=cross(dpdy,normal),r2=cross(normal,dpdx);float det=dot(dpdx,r1);
   normal=normalize(abs(det)*normal-sign(det)*(dFdx(hh)*r1+dFdy(hh)*r2));}`);
 };
 return m;
}

/** Malha das ruas: fitas que acompanham o terreno + praça central. */
export function buildRoads({roads,cx,cy,plaza=0,heightAt,toW,urbanR=0,material}){
 const P=[],C=[],I=[];let base=0;
 const push=(u,v,urban)=>{
  const[x,z]=toW(cx+u,cy+v),y=heightAt(u,v)+.05;
  P.push(x,y,z);C.push(urban,urban,urban);
 };
 for(const rd of roads){
  const pts=rd.pts;if(!pts||pts.length<2)continue;
  const seq=[];
  for(let i=0;i<pts.length-1;i++){
   const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);
   const n=Math.max(1,Math.ceil(L/4));
   for(let k=0;k<n;k++){const t=k/n;seq.push([a[0]+dx*t,a[1]+dz*t]);}
  }
  seq.push(pts[pts.length-1]);
  const half=Math.max(.55,rd.w*1.06);
  // corta a rua onde ela encontraria a água (o cais ocupa esse lugar)
  const runs=[];let run=[],lastGood=null;
  for(const p of seq){
   const ok=heightAt(p[0],p[1])>.45;
   if(ok){run.push(p);lastGood=p}
   else if(run.length){runs.push(run);run=[]}
  }
  if(run.length)runs.push(run);
  for(const seq2 of runs){
   if(seq2.length<2)continue;
   const start=base;
   for(let i=0;i<seq2.length;i++){
    const p=seq2[i],a=seq2[Math.max(0,i-1)],b=seq2[Math.min(seq2.length-1,i+1)];
    const tx=b[0]-a[0],tz=b[1]-a[1],L=Math.hypot(tx,tz)||1,nx=-tz/L,nz=tx/L;
    const r=Math.hypot(p[0],p[1]);
    const urban=urbanR&&r<urbanR?1:0;
    push(p[0]+nx*half,p[1]+nz*half,urban);push(p[0]-nx*half,p[1]-nz*half,urban);
    if(i){const a0=start+(i-1)*2,a1=a0+1,b0=start+i*2,b1=b0+1;I.push(a0,b0,a1,a1,b0,b1)}
   }
   base+=seq2.length*2;
  }
 }
 // praça
 if(plaza>0){
  const seg=Math.max(24,Math.round(plaza*4)),c0=base;
  push(0,0,1);
  for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2;push(Math.cos(a)*(plaza+1.7),Math.sin(a)*(plaza+1.7),1)}
  for(let i=0;i<seg;i++)I.push(c0,base+1+i,base+1+(i+1)%seg);
  base+=seg+1;
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
 g.setIndex(I);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;mesh.frustumCulled=false;
 mesh.renderOrder=1;
 return mesh;
}

/* =====================================================================
   floresta e pedras
   ===================================================================== */
function mergeParts(parts){const pos=[],nor=[];for(const g0 of parts){const g=g0.index?g0.toNonIndexed():g0;pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array)}
 const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return o}
const at=(g,x,y,z)=>{g.translate(x,y,z);return g};
function treeKit(){
 const trunk=mergeParts([at(new THREE.CylinderGeometry(.13,.32,3.1,7),0,1.55,0),
  at(new THREE.CylinderGeometry(.05,.1,1.2,5).rotateZ(.9),.55,2.7,0),
  at(new THREE.CylinderGeometry(.05,.1,1,5).rotateZ(-1),-.5,2.5,.1)]);
 const tiers=[];for(let i=0;i<7;i++)tiers.push(at(new THREE.ConeGeometry(1.6-i*.19,2.05,9),0,1.9+i*.92,0));
 const conifer=mergeParts(tiers);
 const round=mergeParts([[0,4.2,0,1.65],[1,3.7,.5,1.15],[-1,3.8,-.45,1.2],[.25,5.1,-.2,1.05],[-.2,3.5,1.05,.95],[.65,3.6,-.95,1],[ -.75,4.7,.5,.9]]
  .map(([x,y,z,r])=>at(new THREE.IcosahedronGeometry(r,2),x,y,z)));
 const acacia=mergeParts([at(new THREE.SphereGeometry(2.3,9,6).scale(1,.38,1),0,4.6,0),
  at(new THREE.SphereGeometry(1.35,8,5).scale(1,.4,1),1.4,4,0.4),
  at(new THREE.SphereGeometry(1.2,8,5).scale(1,.4,1),-1.3,4.1,-.5)]);
 const palm=mergeParts([at(new THREE.CylinderGeometry(.11,.2,4.6,6),0,2.3,0),
  ...[[0,4.7,0],[.9,4.5,.4],[-.9,4.4,-.4],[.3,4.9,.9],[-.3,4.8,-.9]].map(([x,y,z],i)=>
   at(new THREE.SphereGeometry(1.15,7,4).scale(1,.3,1.5).rotateZ(i*.4),x,y,z))]);
 return {trunk,conifer,round,acacia,palm};
}

export function buildForest({field,site,blocked=()=>false,radius=null,seed=1}){
 const R=site.cityR,rad=Math.min(radius||Math.max(1500,R*2.2),2600);
 const rand=rng(seed|0);
 const climate=site.climate;
 const kit=treeKit();
 const kinds=climate==='tropical'?['palm','round','round']:
  climate==='arid'?['acacia','acacia']:
  climate==='boreal'||climate==='alpine'?['conifer','conifer','round']:
  climate==='cold'||climate==='tundra'||climate==='ice'?['conifer']:
  ['round','round','conifer'];
 const mats={conifer:'#5a8b50',round:'#6aa855',acacia:'#a6b261',palm:'#72ab59'};
 const lists={conifer:[],round:[],acacia:[],palm:[]};
 const max=6200;
 let total=0;
 // sorteio por rejeição: a densidade de floresta decide onde as árvores ficam
 for(let attempt=0;attempt<42000&&total<max;attempt++){
  const a=rand()*6.283,r=rad*Math.sqrt(rand()),x=Math.cos(a)*r,z=Math.sin(a)*r;
  const f=field.forestAt(x,z);if(f<.04)continue;
  const clump=.35+1.5*fbm2(x*.0019,z*.0019,seed+7);
  if(rand()>f*clump)continue;
  const h=field.heightM(x,z);if(h<1.2)continue;
  if(r<R*.62)continue;                       // dentro do núcleo urbano quase não há mata
  if(blocked(x,z,2.6))continue;
  const type=kinds[Math.floor(rand()*kinds.length)];
  const sc=(climate==='boreal'||climate==='alpine'?.8:.65)+rand()*.6;
  lists[type].push([x,z,sc,rand()*6.28,.86+rand()*.3,rand()]);
  total++;
 }
 const group=new THREE.Group();group.name='localForest';
 const trunkMat=new THREE.MeshStandardMaterial({color:'#7b6750',roughness:1});
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),sc=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 for(const[type,items]of Object.entries(lists)){
  if(!items.length)continue;
  const crownMat=new THREE.MeshStandardMaterial({color:mats[type],roughness:1,flatShading:false});
  const crown=new THREE.InstancedMesh(kit[type],crownMat,items.length);
  const trunk=new THREE.InstancedMesh(kit.trunk,trunkMat,items.length);
  items.forEach(([x,z,scale,rot,shade,r],i)=>{
   p.set(x/M,field.heightM(x,z)/M-.08,z/M);q.setFromAxisAngle(up,rot);
   sc.set(scale,scale*(.9+r*.3),scale);m4.compose(p,q,sc);
   crown.setMatrixAt(i,m4);trunk.setMatrixAt(i,m4);
   crown.setColorAt(i,new THREE.Color(mats[type]).offsetHSL((r-.5)*.03,0,(r-.5)*.12).multiplyScalar(shade));
   trunk.setColorAt(i,new THREE.Color('#7b6750').multiplyScalar(.85+r*.3));
  });
  crown.castShadow=crown.receiveShadow=true;trunk.castShadow=true;
  crown.frustumCulled=trunk.frustumCulled=false;
  group.add(crown,trunk);
 }
 return group;
}

export function buildScatter({field,site,blocked=()=>false,seed=3}){
 const rand=rng(seed|0),R=site.cityR;
 const rad=Math.min(1800,Math.max(900,R*1.4));
 const rocks=[],bushes=[];
 const count=Math.min(2600,Math.round(rad*rad/260));
 for(let i=0;i<count;i++){
  const a=rand()*6.283,r=Math.sqrt(rand())*rad,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(blocked(x,z,1.2))continue;
  const h=field.heightM(x,z),sd=field.shoreM(x,z);
  if(h<.6)continue;
  const slope=Math.abs(field.heightM(x+3,z)-h)+Math.abs(field.heightM(x,z+3)-h);
  if(sd<4){if(rand()<.5)rocks.push([x,z,.4+rand()*1.1]);continue}
  if(slope>1.4||(site.ranges[0]&&h>site.ranges[0].heightM*.5)||rand()<.22)rocks.push([x,z,.35+rand()*(slope>1?1.8:.8)]);
  else if(rand()<.5)bushes.push([x,z,.5+rand()*.8]);
 }
 const group=new THREE.Group(),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),sc=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const rockMat=new THREE.MeshStandardMaterial({color:'#8b8578',roughness:1,flatShading:true});
 const bushMat=new THREE.MeshStandardMaterial({color:'#587a44',roughness:1,flatShading:true});
 if(rocks.length){const im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),rockMat,rocks.length);
  rocks.forEach(([x,z,size],i)=>{p.set(x/M,field.heightM(x,z)/M+size*.18,z/M);q.setFromAxisAngle(up,rand()*6.28);sc.set(size*1.3,size*.75,size);m4.compose(p,q,sc);im.setMatrixAt(i,m4);im.setColorAt(i,new THREE.Color('#8b8578').multiplyScalar(.75+rand()*.4))});
  im.castShadow=im.receiveShadow=true;im.frustumCulled=false;group.add(im)}
 if(bushes.length){const im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),bushMat,bushes.length);
  bushes.forEach(([x,z,size],i)=>{p.set(x/M,field.heightM(x,z)/M+size*.3,z/M);q.setFromAxisAngle(up,rand()*6.28);sc.set(size,size*.7,size);m4.compose(p,q,sc);im.setMatrixAt(i,m4);im.setColorAt(i,new THREE.Color('#587a44').multiplyScalar(.7+rand()*.5))});
  im.castShadow=im.receiveShadow=true;im.frustumCulled=false;group.add(im)}
 return group;
}

/* =====================================================================
   céu
   ===================================================================== */
const skyCache={};
export function skyTexture(top,hor,bottom){
 const k=top+hor+(bottom||'');
 if(skyCache[k])return skyCache[k];
 const c=document.createElement('canvas');c.width=4;c.height=256;const x=c.getContext('2d');
 const g=x.createLinearGradient(0,0,0,256);
 g.addColorStop(0,top);g.addColorStop(.52,hor);g.addColorStop(1,bottom||hor);
 x.fillStyle=g;x.fillRect(0,0,4,256);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 return skyCache[k]=t;
}
export {M,WORLD_M_PER_UNIT,smooth};
