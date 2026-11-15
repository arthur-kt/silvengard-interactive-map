// v19: authored 3D prefabs fetched and decoded ONLY while a local scene is open.
// Model geometry and materials belong to street.root and are disposed on exit.
import * as THREE from 'three';
const BASE='./city-assets/models/';

function candidatePositions(d,lay){
 const out=[];
 // Start at the outer edge of a relevant district to leave its central landmark intact.
 for(const mul of[1.35,1.65,1.95,2.2,2.6])for(let i=0;i<12;i++){
  const angle=d.ang+i*Math.PI/6;
  const rad=d.r*mul;
  const u=d.u+Math.cos(angle)*rad,v=d.v+Math.sin(angle)*rad;
  if(Math.hypot(u,v)<lay.Rt*.96)out.push([u,v]);
 }
 // Fallback: spare outer ring; never hide a palace or temple to fit a prefab.
 for(let i=0;i<18;i++){
  const a=i*Math.PI/9+lay.a0,rad=lay.Rt*.79;
  out.push([Math.cos(a)*rad,Math.sin(a)*rad]);
 }
 return out;
}
export async function mountCityModelsV19({pack,root,lay,cx,cy,W,H,Gmap,landAt,blockedAt,addSolid,onProgress,fetcher=fetch}={}){
 const result={requested:pack?.models?.length||0,placed:0,skipped:0,failed:0,triangles:0};
 if(!lay||!pack?.models?.length)return result;
 for(const model of pack.models){
  const district=lay.districts?.find(d=>d.kind===model.district);
  if(!district){result.skipped++;continue}
  const rad=6*(model.scale||1);
  const location=candidatePositions(district,lay).find(([u,v])=>{
   const mx=cx+u,my=cy+v;
   if(!landAt(mx,my)||blockedAt(mx,my,rad))return false;
   const h=Gmap(mx,my);
   return Number.isFinite(h)&&[[-3,0],[3,0],[0,-3],[0,3]].every(([du,dv])=>Math.abs(Gmap(mx+du,my+dv)-h)<1.7);
  });
  if(!location){result.skipped++;continue}
  onProgress?.('Montando construções especiais…');
  let g;
  try{
   const response=await fetcher(BASE+model.file,{cache:'force-cache'});
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const json=await response.json();
   g=new THREE.ObjectLoader().parse(json);
   if(!g?.isObject3D)throw new Error('Modelo 3D inválido');
  }catch(e){console.warn('[v19] Modelo opcional indisponível:',model.file,e);result.failed++;continue}
  const [u,v]=location,mx=cx+u,my=cy+v;
  g.position.set(mx-W/2,Gmap(mx,my)+.06,my-H/2);g.scale.setScalar(model.scale||1);
  g.rotation.y=district.ang+Math.PI/2;
  g.name='v19 · '+(g.name||model.file);
  g.userData.cityAssetV19=true;
  g.traverse(o=>{
   if(o.isMesh){o.castShadow=true;o.receiveShadow=true;
    const geom=o.geometry;
    if(geom){const count=geom.index?geom.index.count:geom.attributes.position?.count||0;result.triangles+=Math.floor(count/3)}
   }
  });
  root.add(g);addSolid(mx,my,rad);result.placed++;
 }
 return result;
}
