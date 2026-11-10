// Silvengard · v34 — modo "Ver no local" (estilo street view): andas a pé no ponto escolhido, com terreno,
// vegetação e vilas gerados em alta resolução à escala humana. Não altera os dados do mapa.
import * as THREE from 'three';
import {shared,NOISE,treeMaterial,createOcean} from './visuals.js?v=35';
import {Mesher,retexture,rng,tc,PAL,portModel,addBanner,addHaystack} from './settlements.js?v=35';
import {makeLayout,buildTownV2,buildWildFeatures,climateOf,CLIMATE_NAME} from './town.js?v=35';

const EYE=.8, RADIUS=.36, WALK=2.3, RUN=5.2;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const vh=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=vh(ix,iy),b=vh(ix+1,iy),c=vh(ix,iy+1),d=vh(ix+1,iy+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
const fbm=(x,y)=>.55*vn(x,y)+.3*vn(x*2.1+7.3,y*2.1-3.1)+.15*vn(x*4.3-5.2,y*4.3+9.7);

const PRESETS={
 manha:{label:'Manhã',sun:[-.9,.42,.5],sunC:'#ffd6a0',sunI:2.6,hemiI:1.45,sky:'#f1d9c2',gnd:'#6d6a4a',top:'#6f95b4',hor:'#e6cdb0',fogN:80,fogF:1100,night:0,exp:1.15},
 dia:{label:'Dia',sun:[-.5,1,-.35],sunC:'#fff0d4',sunI:3.3,hemiI:1.75,sky:'#e4eff2',gnd:'#656a4b',top:'#4f86b0',hor:'#bcd6de',fogN:120,fogF:1500,night:0,exp:1.25},
 tarde:{label:'Entardecer',sun:[.95,.17,.45],sunC:'#ff9a52',sunI:2.9,hemiI:1.2,sky:'#e9b48d',gnd:'#5a4a40',top:'#3d4f78',hor:'#f0a370',fogN:60,fogF:950,night:0,exp:1.1},
 noite:{label:'Noite',sun:[.4,.7,.5],sunC:'#9fb4ff',sunI:1.15,hemiI:1.15,sky:'#4a5f96',gnd:'#1c2430',top:'#0a1426',hor:'#27395c',fogN:40,fogF:800,night:1,exp:1.25}
};
const skyCache={};
function skyTexture(top,hor){const k=top+hor;if(skyCache[k])return skyCache[k];const c=document.createElement('canvas');c.width=4;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,top);g.addColorStop(.5,hor);g.addColorStop(1,hor);x.fillStyle=g;x.fillRect(0,0,4,256);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return skyCache[k]=t}
function merge(parts){const pos=[],nor=[];for(const g0 of parts){const g=g0.index?g0.toNonIndexed():g0;pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array)}const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return o}
const at=(g,x,y,z)=>{g.translate(x,y,z);return g};

/* ---------- material do chão local ---------- */
function groundMaterial(){
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const uCenter={value:new THREE.Vector3()},uRad={value:150};m.userData={uCenter,uRad};
 m.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{uSdf:shared.uSdf,uWorld:shared.uWorld,uCenter,uRad});
  shader.vertexShader='attribute vec2 aPath;varying vec2 vPath;varying vec3 vWP;varying vec3 vGN;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPath=aPath;vWP=position;vGN=normal;');
  shader.fragmentShader='varying vec2 vPath;varying vec3 vWP;varying vec3 vGN;uniform sampler2D uSdf;uniform vec2 uWorld;uniform vec3 uCenter;uniform float uRad;\n'+NOISE+shader.fragmentShader
  .replace('#include <color_fragment>',`#include <color_fragment>
  vec2 gp=vWP.xz;vec3 gBase=diffuseColor.rgb;float gSnow=smoothstep(.56,.72,dot(gBase,vec3(.299,.587,.114)));
  float n1=atlasFbm(gp*.35),n2=atlasFbm(gp*1.7+5.),n3=atlasNoise(gp*9.),n4=atlasNoise(gp*38.);
  float gEdge=smoothstep(uRad*.78,uRad*.98,length(gp-uCenter.xz));
  vec3 c=gBase*(.8+.4*n1)*(.9+.2*n2)*(.9+.18*n3)*(.95+.1*n4);
  float slope=1.-clamp(normalize(vGN).y,0.,1.);
  vec3 rock=mix(vec3(.2,.18,.15),vec3(.4,.36,.3),n2)*(.8+.4*n3);
  c=mix(c,rock,smoothstep(.26,.48,slope+(n1-.5)*.12)*(1.-gSnow));
  vec3 dirt=mix(vec3(.30,.22,.14),vec3(.43,.33,.22),n2)*(.85+.3*n3)+step(.93,atlasNoise(gp*14.))*.1;
  c=mix(c,dirt,smoothstep(.15,.7,vPath.x+(n3-.5)*.5));
  vec2 cu=gp/.42;float crow=floor(cu.y);cu.x+=mod(crow,2.)*.5;vec2 cf=fract(cu);float ce=min(min(cf.x,1.-cf.x),min(cf.y,1.-cf.y));float cm=smoothstep(.04,.15,ce);
  vec3 cob=mix(vec3(.24,.21,.18),vec3(.64,.58,.47),atlasHash(floor(cu)+crow))*(.45+.55*cm)*(.85+.3*n2);
  c=mix(c,cob,smoothstep(.3,.7,vPath.y));
  vec2 gU=(gp+uWorld*.5)/uWorld;float gT=-(texture2D(uSdf,gU).r*32.-8.);
  float beach=smoothstep(1.5,.1,gT+(n1-.5)*.8)*(1.-gSnow);vec3 sand=vec3(.64,.54,.34)*(.9+.2*n3);sand=mix(sand,sand*.7,smoothstep(.5,.0,gT));
  c=mix(c,sand,beach*.85);
  float green=step(gBase.r*1.05,gBase.g)*step(gBase.b*1.3,gBase.g)*(1.-vPath.x)*(1.-vPath.y)*(1.-beach);
  float fl=step(.985,atlasNoise(gp*13.))*green;vec3 fc=mix(vec3(.95,.93,.82),mix(vec3(.95,.8,.2),vec3(.7,.5,.9),step(.5,atlasHash(floor(gp*13.)))),step(.35,atlasHash(floor(gp*13.)+3.)));
  c=mix(c,fc,fl*.9);
  float gHt=n3*.5+n4*.3+(1.-cm)*smoothstep(.3,.7,vPath.y)*-.8+smoothstep(.3,.7,vPath.x)*atlasNoise(gp*5.)*.5;
  diffuseColor.rgb=mix(c,gBase,gEdge);`)
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  {float amp=.07*(1.-gEdge)*clamp(1.-length(vViewPosition)/140.,0.,1.);float hh=gHt*amp;vec3 dpdx=dFdx(-vViewPosition),dpdy=dFdy(-vViewPosition);vec3 r1=cross(dpdy,normal),r2=cross(normal,dpdx);float det=dot(dpdx,r1);
   normal=normalize(abs(det)*normal-sign(det)*(dFdx(hh)*r1+dFdy(hh)*r2));}`);
 };
 return m;
}
function grassMaterial(uPlayer){
 const m=new THREE.MeshStandardMaterial({roughness:1,side:THREE.DoubleSide});
 m.onBeforeCompile=shader=>{
  shader.uniforms.uTime=shared.uTime;shader.uniforms.uPlayer=uPlayer;
  shader.vertexShader='uniform float uTime;uniform vec3 uPlayer;varying float vG;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vG=clamp(position.y/.34,0.,1.);
  #ifdef USE_INSTANCING
  {vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float d=length(ip.xz-uPlayer.xz);transformed*=smoothstep(30.,21.,d);
   float ph=ip.x*.7+ip.z*.9;transformed.x+=sin(uTime*2.1+ph)*.07*vG*vG;transformed.z+=cos(uTime*1.7+ph*1.3)*.05*vG*vG;}
  #endif`);
  shader.fragmentShader='varying float vG;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.55,1.25,vG);');
 };
 return m;
}
/* ---------- kit de árvores detalhadas ---------- */
function treeKit(){
 const trunk=merge([at(new THREE.CylinderGeometry(.13,.3,3,8),0,1.5,0),at(new THREE.CylinderGeometry(.04,.09,1.3,5).rotateZ(.9),.55,2.6,0),at(new THREE.CylinderGeometry(.04,.09,1.1,5).rotateZ(-1),-.5,2.4,.1)]);
 const tiers=[];for(let i=0;i<6;i++)tiers.push(at(new THREE.ConeGeometry(1.55-i*.2,1.9,10),0,1.8+i*.95,0));
 const conifer=merge(tiers);
 const round=merge([[0,3.9,0,1.5],[.9,3.5,.5,1.05],[-.9,3.6,-.4,1.1],[.2,4.7,-.2,1],[-.2,3.3,1,.9],[.6,3.4,-.9,.95],[-.7,4.4,.5,.85]].map(([x,y,z,r])=>at(new THREE.IcosahedronGeometry(r,2),x,y,z)));
 const acacia=merge([at(new THREE.SphereGeometry(2.1,10,6).scale(1,.4,1),0,4.2,0),at(new THREE.SphereGeometry(1.2,8,5).scale(1,.4,1),1.3,3.7,.4),at(new THREE.SphereGeometry(1.1,8,5).scale(1,.4,1),-1.2,3.8,-.5)]);
 return{trunk,conifer,round,acacia};
}
const TREE_BIOME={3:['acacia',.004],4:['round',.003],5:['acacia',.02],6:['round',.05],7:['round',.07],8:['round',.07],9:['conifer',.06],10:['conifer',.004],12:['round',.018]};
const GRASS_OK=new Set([3,4,5,6,7,8,9,10,12]);

export function createStreetMode(ctx){
 const {scene,camera,renderer,controls,light,world,D,W,H,surface,cellAt,cellColor,getRelief,getTerrain,getCityModels,toast,title,inhabitants,stateColor,onExit}=ctx;
 const hemi=scene.children.find(o=>o.isHemisphereLight);
 const root=new THREE.Group();root.name='streetMode';root.visible=false;scene.add(root);
 const uPlayer={value:new THREE.Vector3()};
 const gmat=groundMaterial(),grassMat=grassMaterial(uPlayer);
 const kit=treeKit();
 const rockMat=new THREE.MeshStandardMaterial({color:'#8d887b',roughness:1,flatShading:true});
 const S={radiusM:500,R:200,cx:0,cy:0,active:false,picking:false,hud:null,saved:null,built:null,yaw:0,pitch:0,x:0,y:0,eye:0,keys:new Set(),locked:false,drag:null,time:'dia',bob:0,moving:false};
 const relief=()=>getRelief();const G=(x,y)=>surface(x,y)*relief();const toW=(x,y)=>[x-W/2,y-H/2];
 const colCache=new Map();const cc=c=>{let v=colCache.get(c.i);if(!v){v=cellColor(c);colCache.set(c.i,v)}return v};
 function colorAt(mx,my,out){const g=D.grid,gx=Math.max(0,Math.min(g.columns-1.001,mx/g.stepX-.5)),gy=Math.max(0,Math.min(g.rows-1.001,my/g.stepY-.5)),ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,at4=(i,j)=>D.cells[j*g.columns+i];
  const c00=cc(at4(ix,iy)),c10=cc(at4(ix+1,iy)),c01=cc(at4(ix,iy+1)),c11=cc(at4(ix+1,iy+1));
  out.r=(c00.r*(1-fx)+c10.r*fx)*(1-fy)+(c01.r*(1-fx)+c11.r*fx)*fy;out.g=(c00.g*(1-fx)+c10.g*fx)*(1-fy)+(c01.g*(1-fx)+c11.g*fx)*fy;out.b=(c00.b*(1-fx)+c10.b*fx)*(1-fy)+(c01.b*(1-fx)+c11.b*fx)*fy;return out}
 const landAt=(x,y)=>{const c=cellAt(x,y);return c&&c.h>=20&&surface(x,y)>.02};

 /* ---------- colisões ---------- */
 const solids=new Map();const key=(x,y)=>Math.floor(x/6)+','+Math.floor(y/6);
 const addSolid=(x,y,r)=>{const k=key(x,y);(solids.get(k)||solids.set(k,[]).get(k)).push([x,y,r])};
 function resolve(x,y){for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const l=solids.get(key(x+dx*6,y+dy*6));if(!l)continue;for(const[sx,sy,r]of l){const ex=x-sx,ey=y-sy,d=Math.hypot(ex,ey),m=r+RADIUS;if(d<m&&d>1e-4){x=sx+ex/d*m;y=sy+ey/d*m}}}return[x,y]}

 /* ---------- construção ---------- */
 function nearestCity(mx,my,maxD=11){let best=null,bd=maxD;for(const b of D.cities){if(b.excluded)continue;const d=Math.hypot(b.x-mx,b.y-my);if(d<bd){bd=d;best=b}}return best}
 function pathAt(lay,u,v){let dirt=0,cob=0;const r=Math.hypot(u,v);if(r<lay.plaza+.4)cob=1-smooth(lay.plaza-.2,lay.plaza+.6,r);
  for(const rd of lay.roads){const p=rd.pts;for(let i=0;i<p.length-1;i++){const ax=p[i][0],ay=p[i][1],bx=p[i+1][0],by=p[i+1][1],dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((u-ax)*dx+(v-ay)*dy)/(dx*dx+dy*dy||1))),d=Math.hypot(u-ax-dx*t,v-ay-dy*t);
   const k=1-smooth(rd.w*.75,rd.w*1.25,d);if(k>0){const inside=Math.hypot(ax+dx*t,ay+dy*t)<lay.Rt*.9;if(inside)cob=Math.max(cob,k);else dirt=Math.max(dirt,k)}}}
  return[Math.min(1,dirt+cob*.15),cob]}
 function buildGround(cx,cy,R,lay){
  const N=Math.round(R*1.15),stepW=R*2/N,n1=N+1,pos=new Float32Array(n1*n1*3),col=new Float32Array(n1*n1*3),path=new Float32Array(n1*n1*2),c=new THREE.Color();const rl=relief();
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const mx=cx-R+i*stepW,my=cy-R+j*stepW,k=j*n1+i,s=surface(mx,my),edge=1-smooth(R*.8,R*.98,Math.hypot(mx-cx,my-cy));
   const micro=(.012+fbm(mx*.9,my*.9)*.05)*edge;let h=s*rl+micro;if(s<.02||!cellAt(mx,my)||cellAt(mx,my).h<20)h=Math.min(h,-.35);
   pos[k*3]=mx-W/2;pos[k*3+1]=h;pos[k*3+2]=my-H/2;colorAt(mx,my,c);col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;
   if(lay){const[d,cb]=pathAt(lay,mx-lay.cx,my-lay.cy);path[k*2]=d;path[k*2+1]=cb}}
  const idx=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*n1+i,b=a+1,d=a+n1,e=d+1;idx.push(a,d,b,b,d,e)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('aPath',new THREE.BufferAttribute(path,2));g.setIndex(idx);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,gmat);mesh.receiveShadow=true;mesh.frustumCulled=false;gmat.userData.uCenter.value.set(cx-W/2,0,cy-H/2);gmat.userData.uRad.value=R;return mesh}
 function footprintY(x,y,r){let m=1e9;for(const[dx,dy]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]])m=Math.min(m,G(x+dx,y+dy));return m}

 /* ---------- vegetação ---------- */
 let treeMeshes=[],grass=null,grassCenter=[1e9,1e9],people=null,peopleData=[],curLay=null,wild=null;
 const blocked=(x,y,r)=>{for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const l=solids.get(key(x+dx*6,y+dy*6));if(l)for(const[sx,sy,rr]of l)if(Math.hypot(x-sx,y-sy)<rr+r)return true}return false};
 const onPath=(x,y)=>{if(!curLay)return false;const[d,c]=pathAt(curLay,x-curLay.cx,y-curLay.cy);return d>.2||c>.15};
 function scatterTrees(cx,cy,R,rand){
  const lists={conifer:[],round:[],acacia:[]},sp=R>260?2.9:2.3,c=new THREE.Color();let total=0;
  for(let u=-R;u<=R;u+=sp)for(let v=-R;v<=R;v+=sp){const mx=cx+u+(rand()-.5)*sp,my=cy+v+(rand()-.5)*sp;if(Math.hypot(mx-cx,my-cy)>R)continue;
   const cell=cellAt(mx,my);if(!cell||cell.h<20||cell.h>74)continue;const spec=TREE_BIOME[cell.biome];if(!spec)continue;
   const dens=spec[1]*(.3+1.5*fbm(mx*.045,my*.045)),p=dens*sp*sp*(cell.vegetation==='none'?0:1);if(rand()>p)continue;
   if(total>9000)continue;if(surface(mx,my)<.3||blocked(mx,my,1.6)||onPath(mx,my))continue;if(curLay&&Math.hypot(mx-cx,my-cy)<(curLay.walled?curLay.Rt*1.08+10:curLay.Rt*1.08+4))continue;total++;
   const sc=.9+rand()*.8;lists[spec[0]].push([mx,my,sc,rand()*6.28,.8+rand()*.4,rand()]);addSolid(mx,my,.4*sc)}
  const trunkMat=treeMaterial({color:'#6d5a44'}),group=new THREE.Group();const mats={conifer:'#3f6b3a',round:'#4f8a3c',acacia:'#8da24a'};
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),scl=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  for(const[type,items]of Object.entries(lists)){if(!items.length)continue;
   const crown=new THREE.InstancedMesh(kit[type],treeMaterial(),items.length),trunk=type==='acacia'||true?new THREE.InstancedMesh(kit.trunk,trunkMat,items.length):null;
   items.forEach(([mx,my,sc,rot,shade,r],i)=>{pos.set(mx-W/2,G(mx,my)-.1,my-H/2);q.setFromAxisAngle(up,rot);scl.set(sc,sc*(.9+r*.35),sc);m4.compose(pos,q,scl);crown.setMatrixAt(i,m4);trunk.setMatrixAt(i,m4);
    colorAt(mx,my,c);const g=new THREE.Color(mats[type]).lerp(c,.35).offsetHSL((r-.5)*.04,0,0).multiplyScalar(shade);crown.setColorAt(i,g);trunk.setColorAt(i,new THREE.Color('#6d5a44').multiplyScalar(.85+r*.3))});
   crown.castShadow=crown.receiveShadow=true;trunk.castShadow=true;crown.frustumCulled=trunk.frustumCulled=false;group.add(crown,trunk)}
  return group}
 function scatterProps(cx,cy,R,rand){
  const g=new THREE.Group(),rocks=[],bushes=[];
  for(let i=0,nA=Math.min(2600,Math.round(R*R/50));i<nA;i++){const a=rand()*6.28,r=Math.sqrt(rand())*R,mx=cx+Math.cos(a)*r,my=cy+Math.sin(a)*r,cell=cellAt(mx,my);if(!cell||cell.h<20||surface(mx,my)<.3||blocked(mx,my,.8)||onPath(mx,my))continue;
   if(curLay&&Math.hypot(mx-cx,my-cy)<curLay.Rt+4)continue;
   const rocky=cell.h>46||cell.biome===1||cell.biome===2||cell.biome===10;if(rand()<(rocky?.35:.07))rocks.push([mx,my,.3+rand()*(rocky?1.4:.8),rand()*6.28]);else if(GRASS_OK.has(cell.biome)&&rand()<.5)bushes.push([mx,my,.5+rand()*.7,rand()*6.28])}
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),scl=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),c=new THREE.Color();
  if(rocks.length){const im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),rockMat,rocks.length);rocks.forEach(([x,y,s,r],i)=>{pos.set(x-W/2,G(x,y)+s*.25,y-H/2);q.setFromAxisAngle(up,r);scl.set(s*1.2,s*.7,s);m4.compose(pos,q,scl);im.setMatrixAt(i,m4);im.setColorAt(i,new THREE.Color('#8d887b').multiplyScalar(.75+rand()*.5));addSolid(x,y,s*.8)});im.castShadow=im.receiveShadow=true;im.frustumCulled=false;g.add(im)}
  if(bushes.length){const im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({roughness:1,flatShading:true}),bushes.length);bushes.forEach(([x,y,s,r],i)=>{pos.set(x-W/2,G(x,y)+s*.35,y-H/2);q.setFromAxisAngle(up,r);scl.set(s,s*.7,s);m4.compose(pos,q,scl);im.setMatrixAt(i,m4);colorAt(x,y,c);im.setColorAt(i,c.clone().multiplyScalar(.7+rand()*.4))});im.castShadow=im.receiveShadow=true;im.frustumCulled=false;g.add(im)}
  return g}
 function makeGrass(){const P=[],N=[];for(let b=0;b<6;b++){const a=b*Math.PI/3+b*.4,ox=Math.cos(b*2.1)*.05,oz=Math.sin(b*2.1)*.05,h=.26+.1*((b*37)%5)/5,w=.028,c=Math.cos(a),s=Math.sin(a);
   for(const v of[[-w*c+ox,0,-w*s+oz],[w*c+ox,0,w*s+oz],[ox+.03*s,h,oz-.03*c]]){P.push(...v);N.push(0,1,0)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return g}
 function scatterGrass(px,py){
  if(!grass){grass=new THREE.InstancedMesh(makeGrass(),grassMat,9000);grass.frustumCulled=false;grass.receiveShadow=true;root.add(grass)}
  const r=rng(Math.floor(px*31+py*17)),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),scl=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),c=new THREE.Color();let n=0;
  for(let i=0;i<14000&&n<9000;i++){const a=r()*6.28,d=Math.sqrt(r())*29,mx=px+Math.cos(a)*d,my=py+Math.sin(a)*d,cell=cellAt(mx,my);if(!cell||!GRASS_OK.has(cell.biome)||cell.h>78)continue;const s=surface(mx,my);if(s<.25||onPath(mx,my)||blocked(mx,my,.2))continue;
   colorAt(mx,my,c);if(c.r*.299+c.g*.587+c.b*.114>.46)continue;pos.set(mx-W/2,s*relief()+.01,my-H/2);q.setFromAxisAngle(up,r()*6.28);const k=.5+r()*.55;scl.set(k,k*(.8+r()*.5),k);m4.compose(pos,q,scl);grass.setMatrixAt(n,m4);
   grass.setColorAt(n,c.clone().multiplyScalar(1.15+r()*.5).lerp(new THREE.Color('#a7b858'),.32));n++}
  grass.count=n;grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;grassCenter=[px,py]}
 /* moradores */
 function buildPeople(list){
  if(people){root.remove(people.body,people.head);people.body.dispose();people.head.dispose()}people=null;peopleData=list;if(!list.length)return;
  const body=new THREE.InstancedMesh(new THREE.CylinderGeometry(.2,.27,.62,8).translate(0,.4,0),new THREE.MeshStandardMaterial({roughness:.9}),list.length),head=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,8,6).translate(0,.86,0),new THREE.MeshStandardMaterial({color:'#d3a782',roughness:.8}),list.length);
  list.forEach((p,i)=>{body.setColorAt(i,p.col);head.setColorAt(i,new THREE.Color('#d3a782').multiplyScalar(.8+Math.random()*.35))});body.castShadow=head.castShadow=true;body.frustumCulled=head.frustumCulled=false;root.add(body,head);people={body,head}}
 const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_p=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1),_u=new THREE.Vector3(0,1,0);
 function updatePeople(dt,now){if(!people)return;peopleData.forEach((p,i)=>{const pts=p.path;p.t+=p.dir*p.sp*dt/Math.max(1,3.2);if(p.t<0||p.t>pts.length-1.001){p.dir*=-1;p.t=Math.max(0,Math.min(pts.length-1.001,p.t))}
   const k=Math.floor(p.t),f=p.t-k,a=pts[k],b=pts[k+1],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,u=a[0]+dx*f+nx*p.off,v=a[1]+dy*f+ny*p.off,mx=curLay.cx+u,my=curLay.cy+v;
   const bob=Math.abs(Math.sin(now*.006*p.sp+p.ph))*.05;const near=Math.hypot(mx-S.x,my-S.y)<6?.0001:1;_p.set(mx-W/2,G(mx,my)+bob,my-H/2);_q.setFromAxisAngle(_u,Math.atan2(-dx*p.dir,-dy*p.dir));_s.set(near,near,near);_m.compose(_p,_q,_s);people.body.setMatrixAt(i,_m);people.head.setMatrixAt(i,_m)});
  people.body.instanceMatrix.needsUpdate=people.head.instanceMatrix.needsUpdate=true}

 /* ---------- HUD ---------- */
 const el=(h)=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild};
 const hud=el(`<div id="streetHud" hidden><div class="svTop"><div class="svPlace"><small>VISÃO LOCAL</small><b id="svName">—</b><span id="svSub"></span></div><div class="svCompass"><b id="svDir">N</b><span id="svDeg">0°</span></div></div>
  <div class="svPause" id="svPause"><div><b>Clique para olhar ao redor</b><span>WASD mover · Shift correr · mouse olhar · T hora do dia · Esc voltar ao mapa</span></div></div>
  <div class="svBar"><div class="svTimes">${Object.entries(PRESETS).map(([k,v])=>`<button data-time="${k}">${v.label}</button>`).join('')}</div><button id="svExit">⤴ Voltar ao mapa</button></div></div>`);
 const fade=el('<div id="streetFade"></div>'),pickChip=el('<div id="streetPick" hidden><b>Ver no local</b><span>Clique no mapa para escolher onde ficar · Esc cancela</span><div class="svRadius"><em>Raio da localidade</em><button data-r="250">250 m</button><button data-r="500" class="on">500 m</button><button data-r="800">800 m</button></div></div>');
 document.body.append(hud,fade,pickChip);pickChip.querySelectorAll('[data-r]').forEach(b=>b.onclick=e=>{e.stopPropagation();S.radiusM=+b.dataset.r;pickChip.querySelectorAll('[data-r]').forEach(x=>x.classList.toggle('on',x===b))});
 const $h=s=>hud.querySelector(s);
 hud.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.time));$h('#svExit').onclick=()=>exit();
 $h('#svPause').onclick=()=>lock();
 function lock(){try{const p=renderer.domElement.requestPointerLock?.();p?.catch?.(()=>{})}catch{}}
 const DIRS=['N','NE','L','SE','S','SO','O','NO'];
 function applyPreset(name){const p=PRESETS[name]||PRESETS.dia;S.time=name;
  const d=new THREE.Vector3(...p.sun).normalize();S.sunDir=d;light.color.set(p.sunC);light.intensity=p.sunI;hemi.intensity=p.hemiI;hemi.color.set(p.sky);hemi.groundColor.set(p.gnd);
  const fk=p.night?.8:1,RR=S.R||200;scene.fog.color.set(p.hor);scene.fog.near=RR*.2*fk;scene.fog.far=RR*.94*fk;scene.background=skyTexture(p.top,p.hor);shared.uNight.value=p.night;renderer.toneMappingExposure=p.exp;
  hud.querySelectorAll('[data-time]').forEach(b=>b.classList.toggle('active',b.dataset.time===name));S.dirty=true}

 /* ---------- entrada / saída ---------- */
 /* ---------- elementos locais: campos, moinho, fumo, cais ---------- */
 const steep=(x,y)=>Math.abs(G(x+2,y)-G(x,y))+Math.abs(G(x,y+2)-G(x,y))>1.7;
 function addFields(list){if(!list?.length)return;const rows=[];for(const f of list){const n=Math.max(3,Math.floor(f.w/.85));for(let i=0;i<n;i++)rows.push([f,i,n])}
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:1}),rows.length),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),sc=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  rows.forEach(([f,i,n],k)=>{const lx=(i/(n-1)-.5)*(f.w-1.2),ax=[Math.cos(f.rot),-Math.sin(f.rot)],mx=f.x+ax[0]*lx+S.cx,my=f.y+ax[1]*lx+S.cy,h=f.hue<.4?.32:f.hue<.75?.22:.1;
   p.set(mx-W/2,G(mx,my)+h/2,my-H/2);q.setFromAxisAngle(up,f.rot);sc.set(.36,h,f.d-1.2);m4.compose(p,q,sc);im.setMatrixAt(k,m4);im.setColorAt(k,new THREE.Color(f.hue<.4?'#c9aa4f':f.hue<.75?'#7ea34a':'#6b4f35').multiplyScalar(.85+((i*7)%5)*.06))});
  im.receiveShadow=im.castShadow=true;im.frustumCulled=false;root.add(im)}
 function addWindmill(wm){if(!wm)return;const mb=new Mesher(),T=tc(PAL.stone,.98);mb.cyl('stone',2.1,1.4,5.5,10,{at:[wm.x,wm.y,wm.z],tint:T},false);mb.cyl('roof',1.9,0,1.9,10,{at:[wm.x,wm.y+5.5,wm.z],tint:tc(PAL.roof)});
  const fx=Math.sin(wm.rot),fz=Math.cos(wm.rot);mb.box('wood',.8,1.5,.12,{at:[wm.x+fx*1.8,wm.y,wm.z+fz*1.8],rot:wm.rot,tint:tc(PAL.woodDark)});mb.box('glass',.4,.6,.1,{at:[wm.x+fx*1.55,wm.y+3.2,wm.z+fz*1.55],rot:wm.rot});
  const g=mb.group();root.add(g);const hub=new THREE.Group();hub.position.set(wm.x+fx*1.8,wm.y+4.8,wm.z+fz*1.8);hub.rotation.y=wm.rot;const spin=new THREE.Group(),bl=new Mesher();
  for(let k=0;k<4;k++){const a=k*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);bl.beam('wood',[0,0,0],[c*3.8,sn*3.8,0],.13,{tint:tc(PAL.woodDark)});bl.beam('cloth',[c*1.0-sn*.5,sn*1.0+c*.5,0],[c*3.6-sn*.5,sn*3.6+c*.5,0],.62,{tint:tc(PAL.cloth2)})}
  bl.box('wood',.5,.5,.5,{at:[0,-.25,0],tint:tc(PAL.woodDark)});const bg=bl.group();spin.add(bg);hub.add(spin);root.add(hub);S.spin=spin;addSolid(wm.x+W/2,wm.z+H/2,2.3)}
 function addSmoke(pts){if(!pts?.length)return;const per=7,N=pts.length*per,pos=new Float32Array(N*3),ph=new Float32Array(N);let k=0;for(const p of pts)for(let i=0;i<per;i++){pos[k*3]=p[0];pos[k*3+1]=p[1];pos[k*3+2]=p[2];ph[k]=i/per+Math.random()*.1;k++}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('ph',new THREE.BufferAttribute(ph,1));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:shared.uTime,uNight:shared.uNight},vertexShader:'attribute float ph;uniform float uTime;varying float vA;void main(){float t=fract(uTime*.1+ph);vec3 p=position+vec3(t*1.4+sin(t*6.+ph*40.)*.25,t*3.8,sin(t*4.+ph*30.)*.2);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(7.+t*26.)*(260./-mv.z);vA=(1.-t)*smoothstep(0.,.12,t)*.5;}',fragmentShader:'varying float vA;uniform float uNight;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float a=vA*(1.-d*2.);gl_FragColor=vec4(mix(vec3(.78,.76,.72),vec3(.28,.3,.36),uNight),a);}'});
  const pts3=new THREE.Points(g,mat);pts3.frustumCulled=false;root.add(pts3)}
 function addPier(cx,cy,R){let best=null;for(let a=0;a<Math.PI*2;a+=Math.PI/14){for(let r=22;r<R*.75;r+=5){if(!landAt(cx+Math.cos(a)*r,cy+Math.sin(a)*r)){if(!best||r<best.r)best={a,r};break}}}
  if(!best||best.r>R*.6)return;let r=best.r;while(r>10&&!landAt(cx+Math.cos(best.a)*r,cy+Math.sin(best.a)*r))r-=1.5;const px=cx+Math.cos(best.a)*(r+2.5),py=cy+Math.sin(best.a)*(r+2.5);
  const pm=portModel({fortified:false,flag:'#c0392b'});const[wx,wz]=toW(px,py);pm.position.set(wx,-.05*relief()+.28,wz);pm.rotation.y=-best.a;pm.scale.setScalar(1.15);root.add(pm)}

 /* ---------- entrada / saída ---------- */
 async function enterAt(mx,my,opts={}){
  if(S.active)return;const city=opts.cityId!=null?D.cities.find(c=>c.i===opts.cityId):nearestCity(mx,my);const cx=city?city.x:mx,cy=city?city.y:my;
  if(!landAt(cx,cy)){toast?.('Escolha um ponto em terra firme.');return}
  cancelPick();fade.classList.add('on');await new Promise(r=>setTimeout(r,330));
  try{
   const rM=S.radiusM||500,R=Math.round(rM/2.2);S.R=R;S.cx=cx;S.cy=cy;const rand=rng(Math.floor(cx*13+cy*7)+1),cell=cellAt(cx,cy),climate=climateOf(cell);S.climate=climate;
   const cls=city?.settlementClass||'',special=!!(city?.magicSchool||city?.dwarvenFortress),fort=!!(cls.startsWith('Forte')||city?.citadel||city?.dwarvenFortress);
   const lay=city?makeLayout({pop:Math.max(80,inhabitants(D,city)||400),capital:!!city.capital,village:cls==='Vila',fort,rand}):null;curLay=lay;
   if(lay){lay.cx=cx;lay.cy=cy;lay.walled=!!(city.walls||lay.capital||city.citadel)&&!lay.fort&&!special}
   solids.clear();const color=city?stateColor(city):'#c0392b';
   S.ground=buildGround(cx,cy,R,lay);root.add(S.ground);
   if(lay){const t=buildTownV2({b:city,cx,cy,lay,rand,climate,color,G,landAt,toW,addSolid,pathAt:(u,v)=>pathAt(lay,u,v),footprintY,special});t.groups.forEach(g=>root.add(g));buildPeople(t.people);addFields(t.fields);addWindmill(t.windmill);addSmoke(t.smoke);S.lamps=t.lamps;
    const sp=special?ctx.specialModel?.(city):null;if(sp){sp.scale.setScalar(1.8);sp.position.set(cx-W/2,footprintY(cx,cy,8)+.2,cy-H/2);retexture(sp);sp.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});root.add(sp);addSolid(cx,cy,8)}}
   else{buildPeople([]);const wf=buildWildFeatures({cx,cy,R,rand,climate,G,landAt,toW,addSolid,steep});root.add(wf.group);S.features=wf.list}
   S.trees=scatterTrees(cx,cy,R,rand);root.add(S.trees);S.props=scatterProps(cx,cy,R,rand);root.add(S.props);addPier(cx,cy,R);
   const water=createOcean({W:R*3,H:R*3});water.position.set(cx-W/2,-.05*relief(),cy-H/2);root.add(water);
   S.saved={camPos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov,near:camera.near,far:camera.far,fogC:scene.fog.color.clone(),fogN:scene.fog.near,fogF:scene.fog.far,bg:scene.background,lp:light.position.clone(),lt:light.target.position.clone(),lc:light.color.clone(),li:light.intensity,hi:hemi.intensity,hc:hemi.color.clone(),hg:hemi.groundColor.clone(),sc:{l:light.shadow.camera.left,r:light.shadow.camera.right,t:light.shadow.camera.top,b:light.shadow.camera.bottom,n:light.shadow.camera.near,f:light.shadow.camera.far},bias:light.shadow.bias,nb:light.shadow.normalBias,exp:renderer.toneMappingExposure,night:shared.uNight.value,cut:shared.uCut.value.clone(),enabled:controls.enabled,worldVisible:world?world.visible:true};
   let sx,sy,yaw;
   if(lay){let best=null;for(const rd of lay.roads.filter(r=>r.main&&!r.ring)){const e=rd.pts[rd.pts.length-1],ex=cx+e[0],ey=cy+e[1];if(landAt(ex,ey)){const az=Math.atan2(ex-cx,ey-cy),camAz=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z),score=Math.cos(az-camAz);if(!best||score>best.score)best={ex,ey,score}}}
    const e=best||{ex:cx,ey:cy+lay.Rt+14};sx=e.ex;sy=e.ey;yaw=Math.atan2(sx-cx,sy-cy)}
   else{sx=cx;sy=cy;yaw=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z)}
   [sx,sy]=resolve(sx,sy);S.x=sx;S.y=sy;S.yaw=yaw;S.pitch=-.04;S.eye=G(sx,sy)+EYE;S.curCity=city;
   const feat={camp:'acampamento',ruins:'ruínas',stones:'círculo de pedras',hut:'cabana',tower:'torre de vigia'};
   $h('#svName').textContent=city?title(city):'Terras selvagens';
   $h('#svSub').textContent=(city?(city.settlementClass||'Localidade')+' · '+Math.round(lay.pop).toLocaleString('pt-BR')+' hab.':(S.features?.length?'Pontos de interesse: '+[...new Set(S.features.map(k=>feat[k]))].join(', '):'Ermo'))+' · '+CLIMATE_NAME[climate]+' · raio '+rM+' m';
   if(world)world.visible=false;root.visible=true;camera.fov=70;camera.near=.08;camera.far=R*3.4;camera.updateProjectionMatrix();controls.enabled=false;S.active=true;document.body.classList.add('street');hud.hidden=false;
   const lc=light.shadow.camera;lc.left=-70;lc.right=70;lc.top=70;lc.bottom=-70;lc.near=10;lc.far=4200;lc.updateProjectionMatrix();light.shadow.bias=-.0004;light.shadow.normalBias=.08;if(!light.target.parent)scene.add(light.target);
   shared.uCut.value.set(0,0,0,0);scatterGrass(sx,sy);applyPreset(S.time||'dia');S.t0=0;$h('#svPause').classList.add('show');
  }catch(err){console.error('street:',err);toast?.('Não foi possível entrar no local.');exit(true)}
  fade.classList.remove('on');
 }
 function exit(silent){
  if(!S.active&&!silent)return;if(document.pointerLockElement)document.exitPointerLock?.();
  const sv=S.saved;if(sv){camera.position.copy(sv.camPos);controls.target.copy(sv.target);camera.fov=sv.fov;camera.near=sv.near;camera.far=sv.far;camera.updateProjectionMatrix();scene.fog.color.copy(sv.fogC);scene.fog.near=sv.fogN;scene.fog.far=sv.fogF;scene.background=sv.bg;
   light.position.copy(sv.lp);light.target.position.copy(sv.lt);light.color.copy(sv.lc);light.intensity=sv.li;hemi.intensity=sv.hi;hemi.color.copy(sv.hc);hemi.groundColor.copy(sv.hg);const c=light.shadow.camera;Object.assign(c,{left:sv.sc.l,right:sv.sc.r,top:sv.sc.t,bottom:sv.sc.b,near:sv.sc.n,far:sv.sc.f});c.updateProjectionMatrix();light.shadow.bias=sv.bias;light.shadow.normalBias=sv.nb;renderer.toneMappingExposure=sv.exp;shared.uNight.value=sv.night;shared.uCut.value.copy(sv.cut);controls.enabled=sv.enabled}
  if(world)world.visible=true;
  for(const o of[...root.children]){root.remove(o);o.traverse(n=>{if(n.geometry&&n!==grass)n.geometry.dispose?.()})}grass=null;people=null;peopleData=[];solids.clear();curLay=null;S.ground=S.trees=S.props=null;S.spin=null;S.features=null;
  root.visible=false;S.active=false;S.saved=null;document.body.classList.remove('street');hud.hidden=true;S.keys.clear();controls.update();onExit?.();
 }

 /* ---------- seleção do ponto ---------- */
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let marker=null,pickDown=null;
 function hitAt(e){const r=renderer.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);const t=getTerrain();if(!t)return null;const h=ray.intersectObject(t,false)[0];return h?{mx:h.point.x+W/2,my:h.point.z+H/2,p:h.point}:null}
 function pick(){if(S.active||S.picking)return;S.picking=true;pickChip.hidden=false;document.body.classList.add('svPicking');renderer.domElement.style.cursor='crosshair';
  if(!marker){marker=new THREE.Mesh(new THREE.RingGeometry(1.6,2.1,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#f1dda9',transparent:true,opacity:.9,depthTest:false}));marker.renderOrder=9;scene.add(marker)}marker.visible=false;ctx.requestRender?.()}
 function cancelPick(){if(!S.picking)return;S.picking=false;pickChip.hidden=true;document.body.classList.remove('svPicking');renderer.domElement.style.cursor='';if(marker)marker.visible=false;ctx.requestRender?.()}
 addEventListener('pointermove',e=>{if(!S.picking||e.target!==renderer.domElement)return;const h=hitAt(e);if(h&&landAt(h.mx,h.my)){const c=nearestCity(h.mx,h.my,8);const p=c?new THREE.Vector3(c.x-W/2,G(c.x,c.y)+.6,c.y-H/2):h.p;marker.position.set(p.x,p.y+.5,p.z);marker.scale.setScalar(c?2.2:1);marker.visible=true}else if(marker)marker.visible=false;ctx.requestRender?.()},true);
 addEventListener('pointerdown',e=>{if(S.picking&&e.target===renderer.domElement&&e.button===0){pickDown={x:e.clientX,y:e.clientY}}if(S.active&&e.target===renderer.domElement){e.stopImmediatePropagation();if(!S.locked)lock();else S.drag=null}},true);
 addEventListener('pointerup',e=>{if(S.picking&&e.target===renderer.domElement){e.stopImmediatePropagation();if(e.button===0&&pickDown&&Math.hypot(e.clientX-pickDown.x,e.clientY-pickDown.y)<6){const h=hitAt(e);if(h){if(!landAt(h.mx,h.my))toast?.('Escolha um ponto em terra firme.');else enterAt(h.mx,h.my)}}pickDown=null;return}if(S.active&&e.target===renderer.domElement)e.stopImmediatePropagation()},true);
 for(const ev of['click','dblclick','contextmenu'])addEventListener(ev,e=>{if((S.picking||S.active)&&e.target===renderer.domElement)e.stopImmediatePropagation()},true);
 addEventListener('wheel',e=>{if(S.active&&e.target===renderer.domElement){e.stopImmediatePropagation();e.preventDefault()}},{capture:true,passive:false});
 document.addEventListener('pointerlockchange',()=>{S.locked=document.pointerLockElement===renderer.domElement;$h('#svPause').classList.toggle('show',S.active&&!S.locked)});
 document.addEventListener('mousemove',e=>{if(!S.active||!S.locked)return;S.yaw-=e.movementX*.0022;S.pitch=Math.max(-1.35,Math.min(1.35,S.pitch-e.movementY*.0022))});
 addEventListener('keydown',e=>{if(S.picking&&e.key==='Escape'){cancelPick();return}if(!S.active)return;if(e.target.matches?.('input,textarea,select'))return;
  if(e.key==='Escape'&&!S.locked){exit();return}if(e.code==='KeyT'){const ks=Object.keys(PRESETS);applyPreset(ks[(ks.indexOf(S.time)+1)%ks.length]);return}
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){S.keys.add(e.code);e.preventDefault();e.stopImmediatePropagation()}},true);
 addEventListener('keyup',e=>{S.keys.delete(e.code)},true);addEventListener('blur',()=>S.keys.clear());

 /* ---------- quadro a quadro ---------- */
 function update(now){
  if(!S.active)return false;const dt=Math.min(.05,(now-(S.t0||now))/1000);S.t0=now;shared.uTime.value=now*.001;
  const k=S.keys,f=(k.has('KeyW')||k.has('ArrowUp')?1:0)-(k.has('KeyS')||k.has('ArrowDown')?1:0),s=(k.has('KeyD')?1:0)-(k.has('KeyA')?1:0),turn=(k.has('ArrowLeft')?1:0)-(k.has('ArrowRight')?1:0);
  if(turn)S.yaw+=turn*1.6*dt;S.moving=false;
  if(f||s){const l=Math.hypot(f,s),sp=(k.has('ShiftLeft')||k.has('ShiftRight')?RUN:WALK)*dt/l,fx=-Math.sin(S.yaw),fz=-Math.cos(S.yaw),rx=Math.cos(S.yaw),rz=-Math.sin(S.yaw);
   let nx=S.x+(fx*f+rx*s)*sp,ny=S.y+(fz*f+rz*s)*sp;[nx,ny]=resolve(nx,ny);
   if(landAt(nx,ny)){S.x=nx;S.y=ny;S.moving=true}else if(landAt(nx,S.y)){S.x=nx;S.moving=true}else if(landAt(S.x,ny)){S.y=ny;S.moving=true}
   S.bob+=dt*(k.has('ShiftLeft')?11:8)}
  {const dr=Math.hypot(S.x-S.cx,S.y-S.cy),lim=S.R*.9;if(dr>lim){S.x=S.cx+(S.x-S.cx)*lim/dr;S.y=S.cy+(S.y-S.cy)*lim/dr}}
  if(S.spin)S.spin.rotation.z=now*.0007;
  const g=G(S.x,S.y);S.eye+=(g+EYE-S.eye)*(1-Math.exp(-14*dt));
  const by=S.moving?Math.sin(S.bob)*.035:0,wx=S.x-W/2,wz=S.y-H/2;
  camera.position.set(wx,S.eye+by,wz);camera.rotation.set(S.pitch,S.yaw,0,'YXZ');camera.updateMatrixWorld();uPlayer.value.set(wx,g,wz);
  const d=S.sunDir||new THREE.Vector3(-.5,1,-.35).normalize();light.target.position.set(wx,g,wz);light.position.set(wx+d.x*1800,g+d.y*1800,wz+d.z*1800);light.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;
  if(Math.hypot(S.x-grassCenter[0],S.y-grassCenter[1])>7)scatterGrass(S.x,S.y);
  updatePeople(dt,now);
  const bearing=((-S.yaw*180/Math.PI)%360+360)%360;$h('#svDir').textContent=DIRS[Math.round(bearing/45)%8];$h('#svDeg').textContent=Math.round(bearing)+'°';
  return true}
 return{get active(){return S.active},get picking(){return S.picking},pick,cancelPick,enterAt,exit,update,nearestCity,presets:PRESETS,setTime:applyPreset};
}
