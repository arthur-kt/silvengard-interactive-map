// Silvengard v7: plano fisico das capitais, florestas urbanas e canais de Crild.
// Matematica pura e deterministica: compartilhada por terreno, construtor 3D e planta 2D.
export const V7_M=2.2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

export function blueprintDistrictMetres(lay,spec,site){
 const a=Number.isFinite(spec.absoluteAngle)?spec.absoluteAngle:
  (spec.usePortDir&&site?.port?(site.portDir||0)+(spec.angleOffset||0):lay.a0+(spec.angleOffset||0));
 const r=Number.isFinite(spec.radiusM)?spec.radiusM/V7_M:Math.max(lay.plaza+4,lay.Rt*(spec.radiusFactor||.3));
 const width=Number.isFinite(spec.widthM)?spec.widthM/V7_M:Math.max(7,lay.Rt*(spec.widthFactor||.24));
 return {x:Math.cos(a)*r*V7_M,z:Math.sin(a)*r*V7_M,radius:width*V7_M,angle:a};
}

export function urbanTerraceHeight(terraces,x,z){
 if(!terraces?.length)return 0;
 let h=0;
 for(const t of terraces){
  const rx=(x-t.x)/Math.max(4,t.radiusM),rz=(z-t.z)/Math.max(4,t.radiusM),d=Math.hypot(rx,rz);
  if(d>=1.3)continue;
  const elev=t.heightM*(1-smooth(.40,1.3,d));
  h=Math.max(h,elev);
 }
 return h;
}

export const V7_CANAL_BANDS=[
 {offset:-.49,phase:.32,width:19},
 {offset:-.17,phase:2.3,width:23},
 {offset:.31,phase:4.4,width:17},
];
export function canalAxis(site,x,z){
 const a=site?.urbanCanals?.angle??0,c=Math.cos(a),s=Math.sin(a);
 return {along:x*c+z*s,across:-x*s+z*c};
}
export function canalCenterAcross(site,along,index){
 const c=site.urbanCanals,band=V7_CANAL_BANDS[index];
 const wave=Math.sin(along/(c.radiusM*.32)+band.phase)*c.radiusM*.036;
 const broad=Math.sin(along/(c.radiusM*.66)-band.phase*.4)*c.radiusM*.017;
 return band.offset*c.radiusM+wave+broad;
}
export function urbanCanalSignedDistance(site,x,z){
 if(!site?.urbanCanals)return Infinity;
 const c=site.urbanCanals,{along,across}=canalAxis(site,x,z);
 let min=Infinity;
 for(let i=0;i<V7_CANAL_BANDS.length;i++){
  const band=V7_CANAL_BANDS[i];
  const mid=canalCenterAcross(site,along,i),off=Math.abs(across-mid)-band.width*.5;
  // bordas fechadas na cabeceira interior, abertas na orla, criando canais finitos
  const alongOff=Math.max(c.startM-along,along-c.endM);
  min=Math.min(min,Math.max(off,alongOff));
 }
 return min;
}
export function urbanCanalCenterXY(site,along,index){
 const angle=site.urbanCanals.angle,side=canalCenterAcross(site,along,index);
 return [Math.cos(angle)*along-Math.sin(angle)*side,Math.sin(angle)*along+Math.cos(angle)*side];
}
export function planUrbanV7Site(site,lay,blueprint){
 if(!site||!lay||!blueprint)return site;
 const arch=blueprint.classification?.architecture;
 if(arch==='high-elf'||arch==='woodland-elf')site.urbanWoodland={style:arch,density:arch==='woodland-elf'?.70:.58};
 const v7=blueprint.urbanV7||{};
 site.urbanTerraces=(v7.terraces||[]).map(t=>{
  const spec=lay.v21?lay.customDistricts?.find(d=>d.kind===t.kind):blueprint.urbanDesign?.districts?.find(d=>d.kind===t.kind);
  if(!spec)return null;
  const point=blueprintDistrictMetres(lay,spec,site);
  return {x:point.x,z:point.z,radiusM:Math.max(42,lay.Rt*V7_M*(t.radiusFactor||.27)),heightM:t.heightM,label:spec.label};
 }).filter(Boolean);
 if(v7.canals){
  const R=site.cityR;
  site.urbanCanals={angle:site.portDir||0,radiusM:R,startM:-R*.78,
   endM:Math.max(R*1.35,(site.shoreDistM||0)+80)};
 }
 site.urbanV7={...v7};
 return site;
}

// piso de pontes: usado na física a pé; null significa terreno normal/água.
export function bridgeDeckHeight(layout,u,v){
 for(const b of layout?.bridges||[]){
  const dx=b.b[0]-b.a[0],dz=b.b[1]-b.a[1],len2=dx*dx+dz*dz||1;
  const t=clamp(((u-b.a[0])*dx+(v-b.a[1])*dz)/len2,0,1);
  if(t<=.015||t>=.985)continue;
  const dist=Math.hypot(u-(b.a[0]+t*dx),v-(b.a[1]+t*dz));
  if(dist<b.width*.43)return b.deckY+.24;
 }
 return null;
}
