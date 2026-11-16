// v21: fully replaces common primitive trees in the FOUR pilot cities.
// Loads original GLB files only in enterAt(), with a culture-compatible fallback.
import * as THREE from 'three';
import {loadCityGLB21} from './city-glb-v21.js';
import {M_PER_UNIT as M} from './local-field.js?v=81';
const SELECTION={
 1:['oak-old','blossom','birch','cypress','willow'],
 3:['pine','spruce','birch','oak-young'],
 7:['oak-old','oak-young','cypress','birch','willow'],
 1240:['spruce','pine','birch','oak-young']
};
const randFor=x=>{let s=(x|0)>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296}};
async function getManifest(cityId,signal){
 const r=await fetch(`./city-assets/v21/${cityId}.json`,{signal,cache:'no-cache'});
 if(!r.ok)throw new Error(`Catálogo urbano v21 indisponível: ${r.status}`);
 const data=await r.json();
 if(Number(data.cityId)!==Number(cityId)||data.loadWhen!=='enter-local-view'||data.allowBackgroundPreload!==false||!Array.isArray(data.vegetation))
  throw new Error('Manifesto urbano v21 inválido');
 const species=data.vegetation.map(v=>v.species).filter(v=>/^[a-z]+(?:-[a-z]+)?$/.test(v));
 if(species.length<3||species.length>8||new Set(species).size!==species.length)throw new Error('Catálogo de árvores v21 inválido');
 return {data,species};
}
const range=(a,b,r)=>a+(b-a)*r();
function fallbackTree(){
 // Original low-poly fallback, not the pre-v20 tree geometry; never depend on CDNs.
 const verts=[];const inds=[],colors=[];
 const addCone=(radius,h,y,r,g,b)=>{const start=verts.length/3,N=9;
  verts.push(0,y+h,0);colors.push(r,g,b);
  for(let i=0;i<N;i++){const ang=2*Math.PI*i/N;verts.push(Math.cos(ang)*radius,y,Math.sin(ang)*radius);colors.push(r,g,b)}
  for(let i=0;i<N;i++)inds.push(start,start+i+1,start+(i+1)%N+1);
 };
 addCone(.19,4.4,0,.35,.26,.19);addCone(1.9,3.4,1.4,.32,.52,.34);addCone(1.6,3.5,3.3,.28,.54,.36);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(inds);g.computeVertexNormals();g.computeBoundingSphere();
 return {geometry:g,material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}),triangles:inds.length/3};
}
/**
 * Coordinates: x,z are metres centered at the city; blocked receives metres,
 * pathAt receives metres, and local-space group is converted from metres to map units.
 */
export async function mountPilotForestV21({cityId,field,site,blocked,pathAt,anchors=[],seed=1,signal,onProgress}={}){
 let selected=SELECTION[Number(cityId)];if(!selected)return null;
 let manifestError=null;
 try{const cityProfile=await getManifest(cityId,signal);selected=cityProfile.species;}
 catch(e){if(signal?.aborted)throw e;manifestError=String(e.message||e);console.warn('[v21] Usando o catálogo de bioma embutido:',manifestError);}
 const rand=randFor((seed|0)^Math.imul(Number(cityId),7919)),R=site.cityR;
 const rad=Math.min(2350,Math.max(1260,R*1.75));
 const trees=new Map(selected.map(name=>[name,[]]));
 const allowed=(x,z,{urban=false}={})=>{
  if(field.heightM(x,z)<1.25||field.depthM(x,z)>.1)return false;
  if(pathAt){const[dirt,cob]=pathAt(x,z);if(dirt>.095||cob>.09)return false}
  if(blocked?.(x,z,urban?5.1:3.8))return false;
  if(urban){const f=site?.v21CityId===1?.34:.22;if(rand()>f)return false}
  return true;
 };
 // Urban gardens and noble alleys: light planting around city monuments.
 for(const a of anchors){const x=(a.u||0)*M,z=(a.v||0)*M;
  if(!allowed(x,z))continue;const name=selected[Math.floor(rand()*selected.length)];
  trees.get(name).push([x,z,range(.85,1.45,rand),range(0,6.283,rand)]);
 }
 let placed=0;
 for(let i=0;i<12000&&placed<1250;i++){
  const a=rand()*Math.PI*2,r=rad*Math.sqrt(rand()),x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(r<R*.19)continue;
  const f=field.forestAt(x,z),garden=r<R*.9;
  if(rand()>f*(garden?.43:.62))continue;
  if(!allowed(x,z,{urban:garden}))continue;
  const name=selected[Math.floor(rand()*selected.length)];
  trees.get(name).push([x,z,range(.75,1.55,rand),range(0,6.283,rand)]);placed++;
 }
 const group=new THREE.Group();group.name='v21 · bosque GLB cultural';group.userData={cityId,version:21};
 const report={version:21,cityId,newTrees:0,legacyTrees:0,glbTrees:0,fallbackTrees:0,manifestError,assetFailures:[],drawCalls:0,types:[]};
 const tmp=new THREE.Object3D();
 for(const[name,instances]of trees){if(!instances.length)continue;
  const url=`assets/optimized/vegetation/${name}.glb`;
  let model=null,fromGLB=true;
  try{onProgress?.(`Carregando árvore ${name}…`);model=await loadCityGLB21(url,{signal})}
  catch(e){if(signal?.aborted)throw e;fromGLB=false;report.assetFailures.push({model:url,error:String(e.message||e)});model=fallbackTree();console.warn('[v21] Árvore fallback:',url,e)}
  const mesh=new THREE.InstancedMesh(model.geometry,model.material,instances.length);
  mesh.name=`v21 ${name}`;mesh.castShadow=mesh.receiveShadow=true;
  mesh.frustumCulled=false;
  instances.forEach(([x,z,size,angle],i)=>{
   tmp.position.set(x/M,field.heightM(x,z)/M-.05,z/M);
   tmp.rotation.set(0,angle,0);tmp.scale.setScalar(size/M);
   tmp.updateMatrix();mesh.setMatrixAt(i,tmp.matrix);
  });
  mesh.instanceMatrix.needsUpdate=true;group.add(mesh);report.drawCalls++;
  report.newTrees+=instances.length;report[fromGLB?'glbTrees':'fallbackTrees']+=instances.length;
  report.types.push({name,instances:instances.length,source:fromGLB?'GLB':'fallback',triangles:model.triangles});
 }
 return {group,stats:report};
}
