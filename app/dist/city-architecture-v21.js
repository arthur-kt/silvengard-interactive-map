// Silvengard v21: one cultural architectural pipeline for EVERY visible pilot lot.
// V20 authored meshes are deliberately reused: no legacy houses, no maxHouses cap.
import * as THREE from 'three';
import {createArchitecturalPrefab} from './city-architecture-v20.js?v=20.0';
import {V21_KITS} from './urban-v21-core.js';
const W=4.4,D=5.2;
const TINT={residence:'#ffffff',manor:'#f5ecda',shop:'#f4dec1',tavern:'#efcea5',inn:'#eee0c7',workshop:'#c7b9aa',warehouse:'#aca7a0',stables:'#c4b29b',barracks:'#aebbc6',civic:'#f0e3cb',temple:'#e7e5dc'};
const SIGN={shop:'#c5a168',tavern:'#b48046',inn:'#60809e',workshop:'#8b6651',warehouse:'#7e7770',stables:'#a27f57',barracks:'#6d8493',civic:'#c1a979',temple:'#e3d1a6'};
function instancedDetails(group,slots,type,mat,geo,configure){
 if(!slots.length)return 0;
 const mesh=new THREE.InstancedMesh(geo,mat,slots.length),tmp=new THREE.Object3D();
 mesh.name=`v21 ${type}`;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;
 slots.forEach((s,i)=>{configure(tmp,s,i);tmp.updateMatrix();mesh.setMatrixAt(i,tmp.matrix)});
 mesh.instanceMatrix.needsUpdate=true;group.add(mesh);return 1;
}
export function mountArchitecturalKitV21({cityId,assetPack,slots=[],root}={}){
 const theme=V21_KITS[Number(cityId)]||assetPack?.architecture?.theme||'imperial';
 const results={version:21,instances:slots.length,legacyHouses:0,newHouses:slots.filter(s=>['residence','manor'].includes(s.role||'residence')).length,
  legacyTrees:0,drawCalls:0,templates:0,themes:[theme],roles:{},glbBuildings:0,source:'modelos culturais originais v20, expansão v21'};
 if(!root||!slots.length)return results;
 const grouped=new Map();
 for(let i=0;i<slots.length;i++){
  const slot=slots[i],role=slot.role||({house:'residence',smithy:'workshop'}[slot.type]||slot.type||'residence');
  slot.role=role;results.roles[role]=(results.roles[role]||0)+1;
  const floors=role==='manor'?Math.max(2,Math.min(3,slot.floors||2)):Math.max(1,Math.min(3,slot.floors||2));
  const variant=i%3,key=`${variant}:${floors}`;
  if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(slot);
 }
 const all=new THREE.Group();all.name=`v21 · lote urbano completo · ${theme}`;all.userData={cityAssetV21:true,cityId};
 const tmp=new THREE.Object3D();
 for(const[key,items]of grouped){
  const [variant,floors]=key.split(':').map(Number),prototype=createArchitecturalPrefab(theme,variant,floors);
  results.templates++;
  for(const source of prototype.children){
   if(!source.isMesh)continue;
   const inst=new THREE.InstancedMesh(source.geometry,source.material,items.length);
   inst.name=`v21 ${theme} ${key} ${source.userData.kind||'estrutura'}`;
   inst.castShadow=inst.receiveShadow=true;inst.frustumCulled=false;
   items.forEach((slot,i)=>{
    tmp.position.set(...slot.at);tmp.rotation.set(0,slot.rot,0);tmp.scale.set(slot.w/W,1,slot.d/D);
    tmp.updateMatrix();inst.setMatrixAt(i,tmp.matrix);
    inst.setColorAt(i,new THREE.Color(TINT[slot.role]||'#ffffff').multiplyScalar(.9+((i%7)/7)*.13));
   });
   inst.instanceMatrix.needsUpdate=true;inst.instanceColor?.setUsage?.(THREE.StaticDrawUsage);
   all.add(inst);results.drawCalls++;
  }
 }
 // Role markers are 3D, INSTANCED, and never reintroduce the old building mesh.
 const signGroups=new Map();
 for(const s of slots)if(SIGN[s.role]){
  if(!signGroups.has(s.role))signGroups.set(s.role,[]);signGroups.get(s.role).push(s);
 }
 const signGeometry=new THREE.BoxGeometry(.67,.49,.13);
 for(const[role,items]of signGroups){
  const material=new THREE.MeshStandardMaterial({color:SIGN[role],roughness:.8});
  results.drawCalls+=instancedDetails(all,items,`${role} placa`,material,signGeometry,(obj,s)=>{
   const off=s.d/2+.12;
   obj.position.set(s.at[0]+Math.sin(s.rot)*off,s.at[1]+1.82,s.at[2]+Math.cos(s.rot)*off);
   obj.rotation.set(0,s.rot,0);obj.scale.set(1,1,1);
  });
 }
 const chimneyItems=slots.filter(s=>['workshop','tavern','inn','warehouse'].includes(s.role));
 const chimney=new THREE.CylinderGeometry(.22,.28,1.8,7);
 results.drawCalls+=instancedDetails(all,chimneyItems,'chaminés de ofícios',new THREE.MeshStandardMaterial({color:'#6e6660',roughness:1}),chimney,(obj,s)=>{
  obj.position.set(s.at[0]+Math.cos(s.rot)*s.w*.26,s.at[1]+Math.min(3,s.floors)*1.7+1.6,s.at[2]-Math.sin(s.rot)*s.w*.26);
  obj.rotation.set(0,s.rot,0);obj.scale.set(1,1,1);
 });
 const porchItems=slots.filter(s=>['manor','civic','temple'].includes(s.role));
 const columns=new THREE.CylinderGeometry(.17,.18,2.2,9);
 const columnMat=new THREE.MeshStandardMaterial({color:'#d7d1bc',roughness:.87});
 for(const sign of[-1,1])results.drawCalls+=instancedDetails(all,porchItems,`colunas ${sign}`,columnMat,columns,(obj,s)=>{
  const ox=sign*s.w*.32,oz=s.d/2+.85;
  obj.position.set(s.at[0]+Math.cos(s.rot)*ox+Math.sin(s.rot)*oz,s.at[1]+1.1,s.at[2]-Math.sin(s.rot)*ox+Math.cos(s.rot)*oz);
  obj.rotation.set(0,s.rot,0);obj.scale.set(1,1,1);
 });
 root.add(all);
 return results;
}
