// Silvengard v20: authored, reusable architectural meshes, instanced per city.
// The local-city module imports this ONLY when the player explicitly enters a city.
// This is genuine geometry replacement for core houses (not a ground recolor).
import * as THREE from 'three';
import {Mesher,tc} from './settlements.js?v=20.0';

const BASE_W=4.4,BASE_D=5.2,UP=new THREE.Vector3(0,1,0);
const PALETTES={
 imperial:{wall:'#d3c5af',upper:'#efe1c8',roof:'#a0523c',wood:'#685041',dark:'#49382e',trim:'#a18c72',metal:'#bca276',leaf:'#6b956a'},
 'high-elf':{wall:'#d7e5d9',upper:'#f0f1e7',roof:'#427d78',wood:'#9b886e',dark:'#526459',trim:'#c5d5cc',metal:'#c7ad6c',leaf:'#5a9976'},
 'wood-elf':{wall:'#b7c0a0',upper:'#e3d7b0',roof:'#5f8b56',wood:'#73583e',dark:'#514832',trim:'#8a9975',metal:'#b6a86a',leaf:'#4f8a51'},
 dwarf:{wall:'#8f8d85',upper:'#aea69a',roof:'#5a5958',wood:'#665043',dark:'#373e41',trim:'#c6b293',metal:'#bf8c53',leaf:'#6b7b5b'},
 northern:{wall:'#aaa49a',upper:'#c8bca8',roof:'#4e5963',wood:'#6b4f3e',dark:'#3f332b',trim:'#a29a88',metal:'#b5a37b',leaf:'#617965'},
 draconato:{wall:'#625b61',upper:'#8b7f83',roof:'#4b353d',wood:'#614a48',dark:'#322d35',trim:'#a28d83',metal:'#bb8255',leaf:'#6a7064'},
 goblin:{wall:'#776b57',upper:'#9a8067',roof:'#615c4b',wood:'#6d5236',dark:'#392f2c',trim:'#93856a',metal:'#b9875b',leaf:'#69815b'},
 desert:{wall:'#d4b792',upper:'#e5cca8',roof:'#ad7850',wood:'#9a7050',dark:'#654836',trim:'#eee0c0',metal:'#caa164',leaf:'#829a5c'},
 port:{wall:'#b9b4a7',upper:'#ddd5bf',roof:'#5e7180',wood:'#726451',dark:'#46535a',trim:'#b3a58e',metal:'#c7a274',leaf:'#6b9380'},
 timber:{wall:'#d6c6a9',upper:'#eee0c7',roof:'#765344',wood:'#6b4f39',dark:'#48372c',trim:'#b5a385',metal:'#bb9d68',leaf:'#668a66'}
};
export const ARCHITECTURAL_THEMES=Object.freeze(Object.keys(PALETTES));
const shade=(x,n)=>tc(x,n);
const box=(m,kind,w,h,d,x,y,z,color,rot=0)=>m.box(kind,w,h,d,{at:[x,y,z],rot,tint:shade(color)});
const beam=(m,kind,a,b,t,color)=>m.beam(kind,a,b,t,{tint:shade(color)});
const cyl=(m,kind,r0,r1,h,n,x,y,z,color)=>m.cyl(kind,r0,r1,h,n,{at:[x,y,z],tint:shade(color)});

/** 3D models with genuine relief: masonry, framed windows, roof dormers, porches,
    corner buttresses, balconies, chimneys and culture-specific ornament. */
export function createArchitecturalPrefab(theme='timber',variant=0,floors=2){
 if(!PALETTES[theme])theme='timber';variant=Math.max(0,Math.min(2,variant|0));floors=Math.max(1,Math.min(3,floors|0));
 const p=PALETTES[theme],m=new Mesher(),W=BASE_W,D=BASE_D,F=1.65;
 const tall=theme==='high-elf'?1.12:theme==='dwarf'?.90:theme==='wood-elf'?1.08:1;
 const h=floors*F*tall, fz=D/2, sid=W/2;
 const wood=theme==='wood-elf'||theme==='goblin'||theme==='northern'||theme==='timber';
 const rocky=theme==='dwarf'||theme==='draconato';
 const flat=theme==='desert'||(theme==='dwarf'&&variant===2)||theme==='draconato'&&variant===2;
 const roofH=theme==='northern'?2.35:theme==='high-elf'?2.18:rocky?1.20:theme==='wood-elf'?1.65:1.65;
 const elevated=theme==='wood-elf'?.55:theme==='goblin'?.32:0;
 // Stone plinth, foundation and wall masses
 box(m,'stone',W+.4,.28,D+.4,0,-.32,0,p.trim);
 if(elevated){for(const sx of[-1,1])for(const sz of[-1,1])cyl(m,'wood',.18,.15,elevated+.7,7,sx*1.92,-.55,sz*2.3,p.wood);
   box(m,'wood',W+.35,.18,D+.35,0,elevated-.08,0,p.wood)}
 box(m,rocky?'stone':wood?'wood':'plaster',W,h,D,0,elevated,0,p.wall);
 if(floors>1){box(m,'plaster',W-.16,F*(floors-1)*tall,D-.16,0,elevated+F*tall,0,p.upper);
   for(let y=1;y<floors;y++)box(m,'stone',W+.12,.12,D+.12,0,elevated+y*F*tall-.07,0,p.trim)}
 // Vertical quoins / timbers / external structural braces
 for(const sx of[-1,1])for(const sz of[-1,1]){
  const kind=wood?'wood':'stone',c=wood?p.dark:p.trim;
  box(m,kind,.22,h+.25,.22,sx*(sid-.01),elevated-.08,sz*(fz-.01),c);
  if(!wood)for(let k=0;k<Math.ceil(h/.47);k++)box(m,'stone',.32,.3,.38,sx*sid,elevated+k*.47,sz*fz,p.trim);
 }
 if(wood)for(let f=0;f<floors;f++){
  const y=elevated+f*F*tall,z=fz+.03;
  beam(m,'wood',[-sid+.08,y+.12,z],[sid-.08,y+F*tall-.12,z],.085,p.dark);
  beam(m,'wood',[sid-.08,y+.12,z],[-sid+.08,y+F*tall-.12,z],.085,p.dark);
 }
 // Door with solid frame, carved lintel, steps and door studs
 box(m,'wood',.94,1.38,.2,0,elevated, fz+.10,p.dark);
 for(const sx of[-1,1])box(m,'stone',.17,1.55,.23,sx*.54,elevated,fz+.13,p.trim);
 box(m,'stone',1.29,.19,.32,0,elevated+1.48,fz+.15,p.trim);
 box(m,'gold',.11,.11,.08,.32,elevated+.78,fz+.27,p.metal);
 for(let i=0;i<3;i++)box(m,'stone',1.35-i*.12,.12,.36+i*.14,0,elevated-.13-i*.14,fz+.33+i*.17,p.trim);
 // Window modules + side windows (actual frames, shutters, mullions, lintels)
 for(let f=0;f<floors;f++)for(const x of[-1.30,1.30]){
  const yy=elevated+f*F*tall+.68;
  box(m,'stone',.91,1.02,.14,x,yy-.15,fz+.05,p.trim);
  box(m,'glass',.69,.76,.06,x,yy-.04,fz+.15,theme==='high-elf'?'#4c7a83':'#334c54');
  box(m,'wood',.07,.82,.10,x,yy-.05,fz+.22,p.wood);
  box(m,'wood',.73,.07,.12,x,yy+.26,fz+.20,p.wood);
  box(m,'stone',1.10,.15,.34,x,yy+.79,fz+.13,p.trim);
  box(m,'stone',1.01,.12,.30,x,yy-.27,fz+.19,p.trim);
  if(wood||variant===1){for(const s of[-1,1])box(m,'wood',.19,.85,.1,x+s*.53,yy-.09,fz+.20,p.dark)}
  if(theme==='high-elf'){
   cyl(m,'stone',.30,0,.52,7,x,yy+.78,fz+.20,p.trim);
   box(m,'gold',.17,.38,.12,x,yy+1.12,fz+.23,p.metal);
  }
 }
 for(const s of[-1,1])for(let f=0;f<floors;f++){
  const y=elevated+f*F*tall+.78;
  box(m,'glass',.08,.75,.57,s*(sid+.05),y,-.65,p.dark);
  box(m,'wood',.14,.81,.12,s*(sid+.12),y,-.65,p.trim);
 }
 // Roof structure with physical overhang/ridge geometry; different silhouettes by theme
 const yRoof=elevated+h;
 if(flat){
  box(m,'stone',W+.48,.22,D+.48,0,yRoof,0,p.trim);
  for(const sz of[-1,1])box(m,'stone',W+.60,.62,.25,0,yRoof+.23,sz*fz,p.wall);
  for(const sx of[-1,1])box(m,'stone',.25,.62,D+.6,sx*sid,yRoof+.23,0,p.wall);
  if(variant!==2){for(let n=0;n<4;n++)box(m,'stone',.29,.43,.32,(n-1.5)*1.1,yRoof+.80,-fz+.13,p.trim)}
 }else{
  const roofKind=theme==='wood-elf'?'roof':theme==='goblin'?'wood':'roof';
  m.gable(roofKind,wood?'wood':'plaster',W+.55,roofH,D+.65,.40,{at:[0,yRoof,0],tint:shade(p.roof)},shade(p.upper));
  beam(m,'wood',[-sid-.25,yRoof+roofH,-.02],[sid+.25,yRoof+roofH,-.02],.16,p.dark);
  for(const sx of[-1,1])beam(m,'wood',[sx*(sid+.25),yRoof,-fz-.2],[sx*(sid+.25),yRoof+roofH,0],.105,p.trim);
  // Two roof dormers, a clear new silhouette relative to v19 houses
  if(floors>1&&variant!==2){for(const x of[-1.08,1.08]){
    const yy=yRoof+.48,zz=fz*.67;
    box(m,'plaster',.97,.90,.83,x,yy,zz,p.upper);
    m.gable('roof','plaster',1.25,.57,1.18,.13,{at:[x,yy+.88,zz],tint:shade(p.roof)},shade(p.upper));
    box(m,'glass',.51,.52,.09,x,yy+.17,zz+.44,p.dark);
    box(m,'stone',.74,.10,.18,x,yy+.77,zz+.47,p.trim);
   }}
 }
 // Chimney, visible eaves and drainspout
 if(theme!=='wood-elf'&&theme!=='goblin'){
  const x=variant===1?-1.23:1.23;
  box(m,'stone',.58,roofH+1.1,.54,x,yRoof+.12,-.64,p.trim);
  box(m,'stone',.78,.18,.72,x,yRoof+roofH+.95,-.64,p.trim);
  box(m,'wood',.13,h+roofH*.32,.14,sid+.17,elevated+.08,-fz+.20,p.dark);
 }
 // Theme-specific physical additions, not color swaps
 if(theme==='imperial'||theme==='port'){
  // Roman-ish portico/arcade and cornice, taller than the simple old facade
  box(m,'stone',W+.52,.25,D+.52,0,yRoof-.13,0,p.trim);
  for(const x of[-1.66,1.66]){
   cyl(m,'stone',.16,.13,1.95,10,x,elevated-.06,fz+1.02,p.trim);
   box(m,'stone',.42,.17,.42,x,elevated+1.86,fz+1.02,p.trim);
  }
  box(m,'stone',3.7,.21,.6,0,elevated+2.04,fz+1.0,p.trim);
  if(theme==='port')for(const x of[-1.8,1.8])box(m,'cloth',.16,.65,.14,x,elevated+1.52,fz+1.17,'#587b92');
 }
 if(theme==='high-elf'){
  // Slender roof turrets and roof crest recognizable from afar
  for(const s of[-1,1]){
   const x=s*(sid-.25),z=-fz+.2;
   cyl(m,'stone',.45,.39,h*.66,10,x,elevated+.05,z,p.trim);
   cyl(m,'roof',.68,0,2.25,10,x,elevated+h*.66,z,p.roof);
   cyl(m,'gold',.07,.03,.52,7,x,elevated+h*.66+2.2,z,p.metal);
  }
  if(variant===0){for(const x of[-.9,.9])cyl(m,'stone',.12,.12,1.55,9,x,yRoof+.25,fz*.10,p.trim)}
 }
 if(theme==='wood-elf'){
  // Raised platform, wooden balustrade, living branches and foliage
  box(m,'wood',W+.78,.17,1.48,0,elevated-.11,fz+.47,p.wood);
  for(const x of[-2,-1.0,0,1.0,2])box(m,'wood',.09,.65,.10,x,elevated+.13,fz+1.12,p.dark);
  box(m,'wood',4.12,.10,.12,0,elevated+.75,fz+1.12,p.wood);
  for(const s of[-1,1]){
   beam(m,'wood',[s*sid,elevated+.13,-fz],[s*(sid+.55),yRoof+.78,-fz+.15],.20,p.wood);
   cyl(m,'wood',.24,.20,h+.7,8,s*(sid+.38),-.15,-fz+.40,p.wood);
  }
  for(let i=0;i<4;i++)cyl(m,'roof',.38,.02,.65,7,-1.6+i*1.05,yRoof+.65,-fz+.05,p.leaf);
 }
 if(theme==='northern'){
  // Deep roof eaves, wooden struts, projecting porch and crossed ridge logs
  for(const sx of[-1,1])for(const z of[-2.25,2.25])beam(m,'wood',[sx*sid,elevated+.22,z],[sx*(sid+.6),yRoof+.66,z],.19,p.dark);
  box(m,'wood',2.6,.15,1.4,0,elevated+1.95,fz+.64,p.wood);
  for(const x of[-1.14,1.14])cyl(m,'wood',.12,.13,1.95,7,x,elevated+.02,fz+1.09,p.dark);
  if(!flat)for(const x of[-1.55,0,1.55])box(m,'wood',.12,.18,5.96,x,yRoof+.02,0,p.trim);
 }
 if(theme==='dwarf'){
  // Heavy buttresses, masonry piers, lower arches and forge vent
  for(const sx of[-1,1])for(const zz of[-1.85,1.85]){
   box(m,'stone',.56,2.2,.70,sx*(sid+.18),elevated-.04,zz,p.trim);
   box(m,'stone',.68,.20,.85,sx*(sid+.18),elevated+2.12,zz,p.metal);
  }
  m.cyl('stone',.92,.84,1.0,8,{at:[0,yRoof+1.02,-fz+.62],tint:shade(p.trim)});
  cyl(m,'gold',.31,.31,.08,9,0,yRoof+1.95,-fz+.62,p.metal);
 }
 if(theme==='draconato'){
  for(const sx of[-1,1]){
   box(m,'stone',.68,h+.60,.92,sx*sid,elevated-.26,fz-.22,p.trim);
   cyl(m,'stone',.49,0,1.2,5,sx*sid,yRoof+.22,fz-.22,p.dark);
  }
  box(m,'gold',1.3,.20,.23,0,elevated+1.45,fz+.18,p.metal);
 }
 if(theme==='goblin'){
  for(const sx of[-1,1]){
   beam(m,'wood',[sx*sid,-.5,fz+.60],[sx*(sid+.65),yRoof-.02,fz+.6],.13,p.dark);
   box(m,'wood',.27,.55,.46,sx*(sid+.4),yRoof+.30,-.2,p.trim);
  }
  box(m,'cloth',W*.78,.14,.85,0,elevated+1.4,fz+.74,p.roof);
 }
 if(theme==='desert'){
  for(const sx of[-1,1])cyl(m,'stone',.20,.18,2.20,9,sx*1.65,elevated,fz+.85,p.trim);
  box(m,'cloth',3.8,.14,.96,0,elevated+2.18,fz+.62,p.roof);
  for(const x of[-1.35,0,1.35])box(m,'stone',.16,.84,.12,x,yRoof+.22,fz+.07,p.trim);
 }
 // Visible upper-level balcony on 1/3 of prefabs
 if(floors>=2&&variant===1){
  box(m,'wood',2.75,.16,1.05,0,elevated+F*tall-.05,fz+.54,p.wood);
  for(let i=0;i<=6;i++)box(m,'wood',.09,.64,.09,-1.28+i*.43,elevated+F*tall+.06,fz+1.01,p.dark);
  box(m,'wood',2.7,.09,.13,0,elevated+F*tall+.70,fz+1.01,p.trim);
 }
 const group=m.group();group.name=`v20-${theme}-${variant}-${floors}`;
 group.userData={theme,variant,floors,geometry:'authored-instanced',base:[BASE_W,BASE_D]};
 return group;
}

export function mountArchitecturalKitV20({assetPack,slots=[],root}={}){
 const result={instances:0,drawCalls:0,trianglesPerTemplate:0,themes:[],templates:0};
 if(!assetPack?.architecture?.enabled||!slots.length||!root)return result;
 const theme=PALETTES[assetPack.architecture.theme]?assetPack.architecture.theme:'timber';
 const grouped=new Map();
 slots.forEach((slot,i)=>{
  const variant=i%3,floors=Math.min(3,Math.max(1,slot.floors|0));
  const key=`${variant}:${floors}`;
  if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push(slot);
 });
 const all=new THREE.Group();all.name='v20 · edifícios arquitetônicos instanciados';all.userData.cityAssetV20=true;
 const tmp=new THREE.Object3D();
 for(const [key,items]of grouped){
  const [variant,floors]=key.split(':').map(Number),prototype=createArchitecturalPrefab(theme,variant,floors);
  result.templates++;
  for(const source of prototype.children){
   if(!source.isMesh)continue;
   const inst=new THREE.InstancedMesh(source.geometry,source.material,items.length);
   inst.name=`v20 ${theme} ${key} ${source.userData.kind||'surface'}`;
   inst.castShadow=inst.receiveShadow=true;inst.frustumCulled=false;
   items.forEach((slot,i)=>{
    tmp.position.set(...slot.at);
    tmp.rotation.set(0,slot.rot,0);
    tmp.scale.set(slot.w/BASE_W,1,slot.d/BASE_D);
    tmp.updateMatrix();inst.setMatrixAt(i,tmp.matrix);
    inst.setColorAt(i,new THREE.Color().setHSL(.08,.05,.89+(i%5)*.027));
   });
   inst.instanceMatrix.needsUpdate=true;
   if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
   all.add(inst);result.drawCalls++;
   const g=source.geometry;
   result.trianglesPerTemplate+=Math.floor((g.index?.count||g.attributes.position?.count||0)/3);
  }
 }
 result.instances=slots.length;result.themes=[theme];root.add(all);
 return result;
}
