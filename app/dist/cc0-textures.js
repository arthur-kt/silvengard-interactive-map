// Silvengard v10: CC0 imagery sourced by the optional Windows installer.
// Works offline, keeps the original procedural shaders when JPGs are missing.
import * as THREE from 'three';

export const CC0_SLOTS={
  paving:'PavingStones036', stone:'Bricks001', rock:'Rocks001',
  wood:'Planks001', roofing:'RoofingTiles001',
  ground:'Ground103', mud:'Ground051'
};
const cache=new Map();
const fallback=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
fallback.wrapS=fallback.wrapT=THREE.RepeatWrapping;
fallback.colorSpace=THREE.SRGBColorSpace;fallback.needsUpdate=true;

export function getCC0Slot(name){
 if(cache.has(name))return cache.get(name);
 const obj={texture:fallback,ready:0,source:CC0_SLOTS[name]||''};
 cache.set(name,obj);return obj;
}
// Carregar apenas slots requisitados pelo manifesto da cidade (v19).
// As imagens permanecem no cache HTTP do navegador; a memoria GPU e liberada ao sair.
const pending=new Map();
async function loadOne(name){
 const slot=getCC0Slot(name);
 if(slot.ready===1)return true;
 if(pending.has(name))return pending.get(name);
 const promise=(async()=>{
  try{
   const tex=await new THREE.TextureLoader().loadAsync(`./textures/cc0/${name}.jpg`);
   tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
   tex.anisotropy=4;slot.texture=tex;slot.ready=1;return true;
  }catch(_){return false}
 })();
 pending.set(name,promise);
 try{return await promise}finally{pending.delete(name)}
}
export async function preloadCC0Textures(names=Object.keys(CC0_SLOTS)){
 const unique=[...new Set((Array.isArray(names)?names:Object.keys(CC0_SLOTS)).filter(n=>Object.hasOwn(CC0_SLOTS,n)))];
 const results=await Promise.all(unique.map(loadOne));
 return Object.fromEntries(unique.map((name,i)=>[name,results[i]]));
}
export function releaseCC0Textures(){
 for(const name of Object.keys(CC0_SLOTS)){
  const slot=getCC0Slot(name);
  if(slot.ready&&slot.texture!==fallback)slot.texture.dispose();
  slot.texture=fallback;slot.ready=0;
 }
 pending.clear();
}
export function cc0Uniforms(name){
 const slot=getCC0Slot(name);
 return {uCC0Map:{get value(){return slot.texture;}},uCC0Mix:{get value(){return slot.ready?0.7:0;}}};
}
export function cc0Counts(){
 return Object.fromEntries(Object.keys(CC0_SLOTS).map(k=>[k,getCC0Slot(k).ready===1]));
}
