import * as THREE from 'three';
// Visual layer v12: procedural terrain shading, animated water, wind in the trees, soft shadows.
// All of it is cosmetic; map data, ids and geometry positions are untouched.
export const shared={uTime:{value:0},uPolitical:{value:0},uSdf:{value:null},uWorld:{value:new THREE.Vector2(1920,937)},uSun:{value:new THREE.Vector3(-600,1000,-450).normalize()},uNight:{value:0},uCut:{value:new THREE.Vector4(0,0,0,0)}};
export const NOISE=`
float atlasHash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float atlasNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(atlasHash(i),atlasHash(i+vec2(1,0)),f.x),mix(atlasHash(i+vec2(0,1)),atlasHash(i+vec2(1,1)),f.x),f.y);}
float atlasFbm(vec2 p){return .55*atlasNoise(p)+.3*atlasNoise(p*2.07+vec2(7.3,-3.1))+.15*atlasNoise(p*4.31+vec2(-5.2,9.7));}
`;

export function shoreTexture(field){
 const t=new THREE.DataTexture(field.data,field.cols,field.rows,THREE.RedFormat,THREE.UnsignedByteType);
 t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;t.unpackAlignment=1;t.needsUpdate=true;
 shared.uSdf.value=t;shared.uWorld.value.set(field.width,field.height);return t;
}

export function terrainMaterial(){
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{uSdf:shared.uSdf,uWorld:shared.uWorld,uPolitical:shared.uPolitical});
  shader.vertexShader='varying vec3 vAtlasPosition;\nvarying vec3 vAtlasNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAtlasPosition=position;\nvAtlasNormal=normal;');
  shader.fragmentShader='varying vec3 vAtlasPosition;\nvarying vec3 vAtlasNormal;\nuniform sampler2D uSdf;\nuniform vec2 uWorld;\nuniform float uPolitical;\n'+NOISE+shader.fragmentShader
  .replace('#include <color_fragment>',`#include <color_fragment>
  vec2 axz=vAtlasPosition.xz;float aElev=vAtlasPosition.y;
  float aLum=dot(diffuseColor.rgb,vec3(.299,.587,.114));
  float aSnow=smoothstep(.56,.72,aLum);
  float aSlope=1.-clamp(normalize(vAtlasNormal).y,0.,1.);
  float aMacro=atlasFbm(axz*.02),aMid=atlasFbm(axz*.11+3.7),aFine=atlasNoise(axz*1.9);
  float aStrata=.5+.5*sin(aElev*1.15+atlasFbm(axz*.045)*6.);
  vec3 aRock=mix(vec3(.14,.125,.11),vec3(.31,.28,.245),clamp(aStrata*.4+aMid*.75,0.,1.))*(.85+.3*aFine);
  float aRockMask=smoothstep(.2,.42,aSlope+(aMid-.5)*.14)*smoothstep(1.5,8.,aElev);
  vec3 aCol=diffuseColor.rgb;
  aCol=mix(aCol,aRock,aRockMask*(1.-aSnow));
  aCol=mix(aCol,aRock*1.15,smoothstep(.42,.66,aSlope+(aMid-.5)*.12)*aSnow);
  aCol*=.9+.2*aMid;
  aCol=mix(aCol,aCol*vec3(1.08,1.04,.86),smoothstep(.55,.8,aMacro)*.5*(1.-aSnow));
  aCol=mix(aCol,aCol*vec3(.86,.97,.9),smoothstep(.55,.2,aMacro)*.4*(1.-aSnow));
  aCol*=.95+.1*aFine;
  {float aNear=clamp(1.-length(vViewPosition)/420.,0.,1.);float aSp=atlasNoise(axz*7.3);aCol*=1.-aNear*(.07*smoothstep(.55,.95,aSp)*(1.-aSnow)-.03*smoothstep(.5,.1,aSp));}
  vec2 aUv=(axz+uWorld*.5)/uWorld;
  float aT=-(texture2D(uSdf,aUv).r*32.-8.);
  float aBeach=smoothstep(1.7,.1,aT+(aMid-.5)*.9)*(1.-smoothstep(2.5,6.,aElev))*(1.-aSnow);
  vec3 aSand=vec3(.64,.54,.34)*(.92+.16*aFine);
  aSand=mix(aSand,aSand*.72,smoothstep(.55,.0,aT));
  aCol=mix(aCol,aSand,aBeach*.85);
  {
  vec3 aPol=diffuseColor.rgb;
  float aTl=dot(aCol,vec3(.299,.587,.114));
  vec3 aTint=aPol*(.55+1.05*aTl);
  aTint=mix(vec3(dot(aTint,vec3(.299,.587,.114))),aTint,.9);
  aTint=mix(aTint,aCol*1.04,clamp(aRockMask*.5+aSnow*.4,0.,.65));
  aTint=mix(aTint,aCol,aBeach*.6);
  aTint*=.93+.12*aFine;
  float aEdge=length(fwidth(aPol))/max(length(fwidth(vAtlasPosition.xz)),1e-4);
  aTint*=1.-.30*smoothstep(.025,.11,aEdge)*(1.-aSnow*.4);
  diffuseColor.rgb=mix(aCol,aTint,uPolitical);
 }`)
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  {
   float amp=(mix(.10,.45,aRockMask)+.2*aSnow)*clamp(1.-length(vViewPosition)/1800.,0.,1.);
   vec2 bq=mix(axz,vec2(dot(axz,vec2(.707,.707)),aElev*1.3),smoothstep(.18,.55,aSlope));
   float bh=atlasFbm(bq*.34)*amp;
   vec3 dpdx=dFdx(-vViewPosition),dpdy=dFdy(-vViewPosition);
   vec3 r1=cross(dpdy,normal),r2=cross(normal,dpdx);
   float det=dot(dpdx,r1);
   vec3 grad=sign(det)*(dFdx(bh)*r1+dFdy(bh)*r2);
   normal=normalize(abs(det)*normal-grad);
  }`);
 };
 return material;
}

export function createOcean({W,H}){
 const color=hex=>new THREE.Color(hex);
 const material=new THREE.ShaderMaterial({
  fog:true,
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:shared.uTime,uSdf:shared.uSdf,uWorld:shared.uWorld,uSun:shared.uSun,
   uShallow:{value:color('#62bdb4')},uMid:{value:color('#2f8296')},uDeep:{value:color('#143f58')},uSky:{value:color('#a9cad6')},uSunColor:{value:color('#ffe6b8')}}]),
  vertexShader:`varying vec3 vW;
  #include <fog_pars_vertex>
  void main(){vec4 wp=modelMatrix*vec4(position,1.);vW=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float uTime;uniform sampler2D uSdf;uniform vec2 uWorld;uniform vec3 uSun,uShallow,uMid,uDeep,uSky,uSunColor;varying vec3 vW;
  #include <common>
  #include <fog_pars_fragment>
  ${NOISE}
  void main(){
   vec2 xz=vW.xz;vec2 uv=clamp((xz+uWorld*.5)/uWorld,0.,1.);
   float sd=texture2D(uSdf,uv).r*32.-8.;
   vec2 ao=abs(xz)/(uWorld*.5)-1.;sd=mix(sd,24.,smoothstep(0.,.06,max(ao.x,ao.y)));
   float dist=length(cameraPosition-vW);
   float calm=mix(.35,1.,smoothstep(0.,5.,sd)),far=1./(1.+dist*.0016);
   vec2 g=vec2(0.);
   float fineFade=clamp(1.-dist/900.,0.,1.);
   g+=vec2(.8,.6)*cos(dot(xz,vec2(.8,.6))*.42+uTime*1.05)*.15*clamp(1.-dist/2500.,0.,1.);
   g+=vec2(-.45,.89)*cos(dot(xz,vec2(-.45,.89))*.77-uTime*1.4)*.10*fineFade;
   vec2 p=xz*.09+vec2(uTime*.03,-uTime*.02);float n0=atlasFbm(p);
   g+=vec2(atlasFbm(p+vec2(.12,0.))-n0,atlasFbm(p+vec2(0.,.12))-n0)*1.3;
   vec2 p2=xz*.45+vec2(-uTime*.12,uTime*.09);float m0=atlasNoise(p2);
   g+=vec2(atlasNoise(p2+vec2(.15,0.))-m0,atlasNoise(p2+vec2(0.,.15))-m0)*.35*fineFade;
   g*=calm*far;
   vec3 n=normalize(vec3(-g.x,1.,-g.y));
   vec3 col=mix(uShallow,uMid,smoothstep(.2,4.,sd));col=mix(col,uDeep,smoothstep(3.,16.,sd));
   float cs=atlasNoise(xz*.35+uTime*.15);col+=vec3(.05,.1,.09)*smoothstep(1.2,0.,sd)*pow(1.-abs(cs*2.-1.),5.);
   vec3 V=normalize(cameraPosition-vW),L=normalize(uSun);
   float fres=.03+.97*pow(1.-max(dot(n,V),0.),5.);
   col=mix(col*(.65+.35*max(dot(n,L),0.)),uSky*(.85+.25*n.y),clamp(fres*.9,0.,.85));
   vec3 H=normalize(L+V);float nh=max(dot(n,H),0.);col+=uSunColor*(pow(nh,160.)*.3+pow(nh,36.)*.05)*calm*far*2.;
   float w=sd+.18+(atlasFbm(xz*.35+uTime*.05)-.5)*.35;
   float band=smoothstep(1.15,0.,w)*smoothstep(-.3,0.,w);
   float pulse=.5+.5*sin(w*8.-uTime*1.5+atlasNoise(xz*.5)*5.);
   float foam=band*(.35+.65*smoothstep(.3,.9,pulse*atlasFbm(xz*.6)*1.7))+smoothstep(.22,0.,w)*smoothstep(-.3,0.,w)*.5;
   col=mix(col,vec3(.93,.97,.96),clamp(foam,0.,1.)*.85);
   gl_FragColor=vec4(col,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   #include <fog_fragment>
  }`});
 // UniformsUtils.merge clones values, so reconnect the clock and live shore field.
 material.uniforms.uTime=shared.uTime;material.uniforms.uSdf=shared.uSdf;material.uniforms.uWorld=shared.uWorld;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(W*3,H*4),material);mesh.rotation.x=-Math.PI/2;return mesh;
}

export function riverMaterial(){
 const m=new THREE.MeshBasicMaterial({color:'#ffffff',vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 m.onBeforeCompile=shader=>{
  shader.uniforms.uTime=shared.uTime;
  shader.vertexShader='attribute vec2 riverUV;\nvarying vec2 vRiverUV;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRiverUV=riverUV;');
  shader.fragmentShader='uniform float uTime;\nvarying vec2 vRiverUV;\n'+NOISE+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float rf=atlasFbm(vec2(vRiverUV.x*1.6+3.,vRiverUV.y*.28-uTime*.8));
  float across=abs(vRiverUV.x);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.55,.8,.84),smoothstep(.52,.8,rf)*.4*(1.-across*.7));
  diffuseColor.rgb*=1.-.22*smoothstep(.45,1.,across);`);
 };
 return m;
}

export function treeMaterial(extra={}){
 const m=new THREE.MeshStandardMaterial({roughness:1,...extra});
 m.onBeforeCompile=shader=>{
  shader.uniforms.uTime=shared.uTime;shader.uniforms.uCut=shared.uCut;
  shader.vertexShader='uniform float uTime;uniform vec4 uCut;\nvarying float vTreeY;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vTreeY=position.y;
  #ifdef USE_INSTANCING
  {vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float ph=ip.x*.13+ip.z*.17;
   float sw=sin(uTime*1.7+ph)+.5*sin(uTime*2.9+ph*1.7);float up=max(position.y-1.,0.);
   transformed.x+=sw*.045*up;transformed.z+=cos(uTime*1.3+ph)*.03*up;if(uCut.w>0.){vec2 dd=ip.xz-uCut.xz;if(dot(dd,dd)<uCut.w*uCut.w)transformed*=0.;}}
  #endif`);
  shader.fragmentShader='varying float vTreeY;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.7,1.12,smoothstep(.6,4.6,vTreeY));');
 };
 return m;
}

function merge(parts){const pos=[],nor=[];for(const g0 of parts){const g=g0.index?g0.toNonIndexed():g0;pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array)}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return out}
const at=(g,x,y,z)=>{g.translate(x,y,z);return g};
export function treeGeometries(){
 const trunk=new THREE.CylinderGeometry(.16,.3,2.9,5);trunk.translate(0,1.45,0);
 const conifer=merge([at(new THREE.ConeGeometry(1.2,2.1,7),0,2.0,0),at(new THREE.ConeGeometry(.95,1.9,7),0,3.0,0),at(new THREE.ConeGeometry(.64,1.6,7),0,4.0,0)]);
 const round=merge([at(new THREE.IcosahedronGeometry(1.15,1),0,3.0,0),at(new THREE.IcosahedronGeometry(.8,1),.6,3.55,.2),at(new THREE.IcosahedronGeometry(.85,1),-.55,3.35,-.35)]);
 const tropical=merge([at(new THREE.SphereGeometry(1.3,6,4).scale(1,.62,1),0,3.9,0),at(new THREE.SphereGeometry(.8,5,4).scale(1,.6,1),.8,3.6,.3)]);
 const acacia=merge([at(new THREE.CylinderGeometry(1.8,1.2,.45,7),0,3.2,0),at(new THREE.CylinderGeometry(1.1,.9,.35,7),.3,3.6,.1)]);
 return {trunk,conifer,round,tropical,acacia};
}

export function skyTexture(){
 const c=document.createElement('canvas');c.width=4;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
 g.addColorStop(0,'#1d4452');g.addColorStop(.55,'#34677a');g.addColorStop(1,'#5b8b99');x.fillStyle=g;x.fillRect(0,0,4,256);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function setupShadows(renderer,light){
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 light.castShadow=true;light.shadow.mapSize.set(4096,4096);
 const s=light.shadow.camera;s.left=-1250;s.right=1250;s.top=900;s.bottom=-900;s.near=50;s.far=4600;s.updateProjectionMatrix();
 light.shadow.bias=-.0005;light.shadow.normalBias=1.1;light.shadow.radius=2.5;
}
export function markShadows(obj){obj.traverse(o=>{if(o.isMesh&&!o.material?.isMeshBasicMaterial&&!o.material?.isShaderMaterial){o.castShadow=true;o.receiveShadow=true}})}
