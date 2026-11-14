// Silvengard · v44 — geografia local em escala real.
//
// O mapa-múndi é grande: 1 unidade do mapa vale 1,5 km (settings.distanceScale). Uma
// célula da grade tem 6 km de lado — mais que a cidade inteira. Por isso a visão local
// não pode apenas "dar zoom" no terreno do mapa: ela reconstrói o lugar a partir do
// contexto real (costa, lago, rio, relevo, bioma) e sintetiza o detalhe que o mapa não
// tem, mantendo as proporções: a cidade cresce com a população, a costa fica onde o
// porto exige, o corpo d'água tem o tamanho do corpo d'água original e as montanhas
// ficam a quilômetros, com centenas de metros de altura.
//
// Este módulo é matemática pura (sem three.js), para poder ser testado no Node.

export const M_PER_UNIT=2.2;          // metros por unidade de cena (altura dos olhos = 1,76 m)
export const WORLD_M_PER_UNIT=1500;   // metros por unidade do mapa-múndi
export const V_MPU=26;                // metros por unidade de relevo do mapa (picos de 116 u ≈ 3 km)

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

/* ---------- ruído determinístico ---------- */
function hash2(x,y,seed=0){
 let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(seed|0,2654435761);
 h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;
}
export function vnoise(x,y,seed=0){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const a=hash2(ix,iy,seed),b=hash2(ix+1,iy,seed),c=hash2(ix,iy+1,seed),d=hash2(ix+1,iy+1,seed);
 return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
export function fbm2(x,y,seed=0){
 return .55*vnoise(x,y,seed)+.3*vnoise(x*2.03+7.3,y*2.03-3.1,seed+11)+.15*vnoise(x*4.11-5.2,y*4.11+9.7,seed+23);
}
/** Ruído "ridged" (cristas) — bom para serras e picos. */
export function ridged(x,y,seed=0){
 const n=1-Math.abs(2*vnoise(x,y,seed)-1);
 return n*n;
}

/* ---------- população → tamanho urbano ---------- */
/** A população do Atlas inclui os arredores rurais. Só uma fração mora no núcleo urbano,
 *  e a cena é uma representação compacta: vila de 1.500 hab. ≈ 80 m de raio, cidade de
 *  39 mil ≈ 265 m, capital de 1 milhão ≈ 620 m. */
const URBAN_SHARE=.18;
export function populationRadiusM(pop){
 const urban=Math.max(120,Number(pop)||400)*URBAN_SHARE;
 return clamp(32+2.8*Math.sqrt(urban),32,620);
}

/* ---------- bioma → caráter local ---------- */
const CLIMATE_BY_BIOME={1:'arid',2:'arid',3:'savanna',4:'grass',5:'tropical',6:'temperate',7:'tropical',
 8:'temperate',9:'boreal',10:'tundra',11:'ice',12:'wet',13:'dead',14:'ash',15:'ash',16:'ash'};
const FOREST_BY_BIOME={1:.02,2:.04,3:.18,4:.22,5:.72,6:.78,7:.9,8:.82,9:.7,10:.12,11:0,12:.5,13:.25,14:.05,15:.05,16:.35};
const PALETTE_BY_BIOME={
 1:['#c8b881','#b9a774','#dcc99a'],2:['#aaa67f','#9d9974','#c3be95'],3:['#a2a774','#8f9a67','#b9b183'],
 4:['#91a57e','#7d9670','#a9b48c'],5:['#6e9468','#5d8a5d','#8aa578'],6:['#659073','#54805f','#7d9c80'],
 7:['#477d63','#3d6f57','#5d8f72'],8:['#568271','#487362','#6f9784'],9:['#718b7c','#5f7a6c','#879c8e'],
 10:['#adb6a2','#99a491','#c2c8b5'],11:['#dbe3dc','#c8d2cb','#eef3ef'],12:['#6d8b70','#5c7a60','#86a187'],
 13:['#888779','#767568','#a09f8f'],14:['#858b89','#737978','#9aa09e'],15:['#302f32','#262529','#47454a'],
 16:['#a9956a','#968356','#c2ad80']
};
const BIOME_GRASS={1:['#c8b881','#b9a774'],2:['#aaa67f','#9d9974'],3:['#a2a774','#8f9a67'],
 4:['#91a57e','#7d9670'],5:['#6e9468','#5d8a5d'],6:['#659073','#54805f'],7:['#477d63','#3d6f57'],
 8:['#568271','#487362'],9:['#718b7c','#5f7a6c'],10:['#adb6a2','#99a491'],11:['#dbe3dc','#c8d2cb'],
 12:['#6d8b70','#5c7a60'],13:['#888779','#767568'],14:['#858b89','#737978'],15:['#302f32','#262529'],
 16:['#a9956a','#968356']};

/* ---------- leitura do mundo ---------- */
function cellIndexAt(D,x,y){
 const g=D.grid;
 return clamp(Math.floor(y/g.stepY),0,g.rows-1)*g.columns+clamp(Math.floor(x/g.stepX),0,g.columns-1);
}
function gridRight(D,x,y){const g=D.grid,c=Math.floor(x/g.stepX);return c<g.columns-1?D.cells[cellIndexAt(D,x+g.stepX,y)]:null}
function gridLeft(D,x,y){const g=D.grid,c=Math.floor(x/g.stepX);return c>0?D.cells[cellIndexAt(D,x-g.stepX,y)]:null}
function gridDown(D,x,y){const g=D.grid,r=Math.floor(y/g.stepY);return r<g.rows-1?D.cells[cellIndexAt(D,x,y+g.stepY)]:null}
function gridUp(D,x,y){const g=D.grid,r=Math.floor(y/g.stepY);return r>0?D.cells[cellIndexAt(D,x,y-g.stepY)]:null}

/** Encontra o corpo d'água mais próximo e mede o seu tamanho andando pela grade. */
function nearestWater(D,cx,cy,maxUnits=42){
 const g=D.grid,cols=g.columns,rows=g.rows,stepX=g.stepX,stepY=g.stepY;
 const x0=clamp(Math.floor((cx-maxUnits)/stepX),0,cols-1),x1=clamp(Math.ceil((cx+maxUnits)/stepX),0,cols-1);
 const y0=clamp(Math.floor((cy-maxUnits)/stepY),0,rows-1),y1=clamp(Math.ceil((cy+maxUnits)/stepY),0,rows-1);
 let best=null;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const c=D.cells[y*cols+x];if(!c||c.h>=20)continue;
  const d=Math.hypot(c.p[0]-cx,c.p[1]-cy);
  if(!best||d<best.d)best={d,cell:c,gx:x,gy:y};
 }
 if(!best)return {kind:'none',distUnits:Infinity};
 // preenchimento: oceano tem milhares de células; lago tem poucas
 const seen=new Uint8Array(cols*rows);const stack=[best.gy*cols+best.gx];seen[stack[0]]=1;
 let count=0,sx=0,sy=0,border=false;
 while(stack.length&&count<2600){
  const i=stack.pop(),c=D.cells[i];count++;sx+=c.p[0];sy+=c.p[1];
  const x=i%cols,y=(i/cols)|0;
  if(x===0||y===0||x===cols-1||y===rows-1)border=true;
  for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=cols||yy>=rows)continue;
   const j=yy*cols+xx;if(seen[j])continue;if(D.cells[j].h>=20)continue;
   seen[j]=1;stack.push(j);
  }
 }
 const areaM2=count*stepX*WORLD_M_PER_UNIT*stepY*WORLD_M_PER_UNIT;
 return {kind:border||count>=2600?'sea':'lake',distUnits:best.d,count,areaM2,
  cx:sx/count,cy:sy/count,cell:best.cell,x:best.cell.p[0],y:best.cell.p[1]};
}

function nearestRiver(D,cx,cy,maxUnits=34){
 let best=null;
 for(const r of D.rivers||[]){
  const pts=r.points||[];if(pts.length<2)continue;
  for(let i=0;i<pts.length-1;i++){
   const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1;
   const t=clamp(((cx-a[0])*dx+(cy-a[1])*dy)/L2,0,1);
   const px=a[0]+dx*t,py=a[1]+dy*t,d=Math.hypot(cx-px,cy-py);
   if(d>maxUnits)continue;
   if(!best||d<best.d)best={d,x:px,y:py,tx:dx/Math.sqrt(L2),ty:dy/Math.sqrt(L2),river:r};
  }
 }
 return best;
}

/** Perfil do relevo no entorno: direção e altura da serra mais próxima. */
function nearestRange(D,cx,cy,baseH,maxUnits=58){
 const g=D.grid,cols=g.columns,rows=g.rows;
 const x0=clamp(Math.floor((cx-maxUnits)/g.stepX),0,cols-1),x1=clamp(Math.ceil((cx+maxUnits)/g.stepX),0,cols-1);
 const y0=clamp(Math.floor((cy-maxUnits)/g.stepY),0,rows-1),y1=clamp(Math.ceil((cy+maxUnits)/g.stepY),0,rows-1);
 let top=null,second=null,front=null;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const c=D.cells[y*cols+x];if(!c||c.h<20)continue;
  const d=Math.hypot(c.p[0]-cx,c.p[1]-cy);if(d<12)continue;
  const rise=c.h-baseH;
  if(rise<7)continue;
  if(!top||rise>top.rise)top={rise,d,cell:c};
 }
 if(top){
  // frente da serra: a célula alta mais próxima (a encosta, não o pico mais distante)
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const c=D.cells[y*cols+x];if(!c||c.h<20)continue;
   const d=Math.hypot(c.p[0]-cx,c.p[1]-cy);if(d<10)continue;
   if(c.h-baseH<top.rise*.55)continue;
   if(!front||d<front.d)front={d,cell:c};
  }
  const aTop=Math.atan2(top.cell.p[1]-cy,top.cell.p[0]-cx);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const c=D.cells[y*cols+x];if(!c||c.h<20)continue;
   const d=Math.hypot(c.p[0]-cx,c.p[1]-cy);if(d<12||d>top.d*1.35)continue;
   const rise=c.h-baseH;if(rise<7)continue;
   const da=Math.abs(Math.atan2(Math.sin(Math.atan2(c.p[1]-cy,c.p[0]-cx)-aTop),Math.cos(Math.atan2(c.p[1]-cy,c.p[0]-cx)-aTop)));
   if(da<1.0)continue;
   if(!second||rise>second.rise)second={rise,d,cell:c};
  }
 }
 return {top,second,front};
}

/**
 * Modelo do lugar: tudo o que o mapa sabe sobre o ponto, convertido para metros.
 * @param {object} p  {D, point:[x,y], cellAt, surface, population, city, seaLevel}
 */
export function siteFor({D,point,cellAt,surface,population=400,city=null,seaLevel=-.05}){
 const [cx,cy]=point;
 const cell=cellAt(cx,cy)||null;
 const biome=cell?.biome??4;
 const hCell=cell?.h??24;
 const climate=CLIMATE_BY_BIOME[biome]||'temperate';
 const cityR=populationRadiusM(population);
 const water=nearestWater(D,cx,cy);
 const river=nearestRiver(D,cx,cy);
 const range=nearestRange(D,cx,cy,hCell);

 // A costa fica longe no mapa (uma célula = 6 km). Aqui ela é aproximada para a
 // escala do lugar, mas sem perder a ordem de grandeza: o mar/lago tem centenas de
 // metros a alguns quilômetros, e a cidade portuária termina no cais.
 let waterKind=water.kind,shoreDistM=0,lakeR=0;
 if(water.kind!=='none'){
  const raw=Math.max(90,(water.distUnits-1.6)*62+70);
  shoreDistM=clamp(raw,90,2600);
  if(water.kind==='lake'){
   lakeR=clamp(320+260*Math.sqrt(Math.max(1,water.count)),380,3100);
   shoreDistM=clamp(Math.max(shoreDistM,cityR*.88),180,2400);
  }else{
   shoreDistM=clamp(Math.max(shoreDistM,cityR*.88),120,2800);
  }
  // cidade portuária ou de lago: a frente de água encosta na cidade. Se o mapa já
  // coloca a água muito perto (menos de 60% do raio), respeita; senão, traz a margem
  // para o limite urbano — a representação compacta não pode deixar o cais longe.
  if(city?.port||city?.majorPort||city?.harbor||water.kind==='lake')
   shoreDistM=clamp(shoreDistM<cityR*.6?shoreDistM:cityR*.98,60,2800);
 }
 // rio: só interessa se passa perto e não é a mesma água
 let riverDistM=0,riverWidthM=0,riverAng=0;
 if(river&&river.d<16){
  riverDistM=clamp(Math.max(120+river.d*70,cityR*.62),110,1600);
  riverWidthM=clamp((river.river.width||1)*38,14,140);
  riverAng=Math.atan2(river.y-cy,river.x-cx);
 }
 // direção da água (para o mar/lago) e do rio
 const waterAng=water.kind!=='none'?Math.atan2(water.y-cy,water.x-cx):0;
 // relevo: encosta suave da cidade + serra
 let gx=0,gy=0;
 if(surface){const e=4;const sxp=surface(cx+e,cy),sxm=surface(cx-e,cy),syp=surface(cx,cy+e),sym=surface(cx,cy-e);
  gx=clamp((sxp-sxm)/(2*e)*V_MPU/WORLD_M_PER_UNIT,-.09,.09);
  gy=clamp((syp-sym)/(2*e)*V_MPU/WORLD_M_PER_UNIT,-.09,.09);}
 const baseM=surface?Math.max(0,(surface(cx,cy)-seaLevel)*V_MPU):0;
 const ranges=[];
 if(range.top){
  const ang=Math.atan2(range.top.cell.p[1]-cy,range.top.cell.p[0]-cx);
  const frontD=range.front?range.front.d:range.top.d;
  const distM=clamp(2000+frontD*260,2200,11500);
  const heightM=clamp(range.top.rise*V_MPU*.92,140,1900);
  ranges.push({ang,distM,heightM,halfLenM:clamp(distM*1.05+cityR*.4,2400,12000),
   spreadM:clamp(heightM*1.9+260,700,2600),seed:Math.round(range.top.cell.i*7+13)});
  if(range.second){
   const ang2=Math.atan2(range.second.cell.p[1]-cy,range.second.cell.p[0]-cx);
   const dist2=clamp(2400+range.second.d*260,2600,12500);
   ranges.push({ang:ang2,distM:dist2,heightM:clamp(range.second.rise*V_MPU*.8,120,1500),
    halfLenM:clamp(dist2*.9,2200,10000),spreadM:clamp(range.second.rise*V_MPU*.8*1.7+260,700,2200),seed:Math.round(range.second.cell.i*5+29)});
  }
 }
 const forest=clamp((FOREST_BY_BIOME[biome]??.5)*(water.kind==='sea'||water.kind==='lake'?.95:1),0,1);
 // neve: bioma manda; altitude manda no resto
 let snowCover=0,snowLineM=850;
 if(biome===11){snowCover=1;snowLineM=0}
 else if(biome===10){snowCover=.92;snowLineM=0}
 else if(biome===9){snowCover=.62;snowLineM=120}
 else if(biome===13||biome===14||biome===15){snowCover=0;snowLineM=900}
 else if(hCell>=56){snowCover=.18;snowLineM=380}
 else if(hCell>=44){snowCover=.06;snowLineM=560}
 const palette=PALETTE_BY_BIOME[biome]||PALETTE_BY_BIOME[4];
 return {
  cx,cy,point:[cx,cy],seed:Math.round(cx*13+cy*7)+11,
  cell,biome,climate,hCell,baseM,slope:[gx,gy],
  cityR,urbanR:cityR,waterKind,waterAng,shoreDistM,lakeR,
  snowCover,snowLineM,snowy:snowCover>.18,
  hasRiver:riverWidthM>0,riverDistM,riverWidthM,riverAng,
  ranges,forest,palette,grass:BIOME_GRASS[biome]||BIOME_GRASS[4],
  port:!!(city?.port||city?.majorPort||city?.harbor),
  portDir:waterAng,
  name:city?.name||null,
  waterAreaM2:water.areaM2||0,waterCells:water.count||0
 };
}

/**
 * Campo contínuo do lugar: altura, profundidade, distância à água e floresta, tudo em
 * metros relativos ao centro da cidade. x = leste, z = sul.
 */
export function createField(site){
 const seed=site.seed|0;
 const nx=Math.cos(site.waterAng),nz=Math.sin(site.waterAng);      // para a água
 const tx=-nz,tz=nx;                                              // ao longo da costa
 const sea=site.waterKind==='sea',lake=site.waterKind==='lake';
 const R=site.cityR;

 // desenho da costa/lagoa
 function coastSD(x,z){
  if(site.waterKind==='none')return 1e6;
  if(site.island){
   // Ilha completa de Elucitor: o oceano deve existir em TODAS as direcoes.
   // A enseada principal e mais proxima; a ilha cresce nas outras margens.
   const shape=site.island,ang=Math.atan2(z,x),dist=Math.hypot(x,z);
   const rx=shape.radiusEastWestM||1750,rz=shape.radiusNorthSouthM||1620;
   const co=Math.cos(ang),si=Math.sin(ang);
   const radius=1/Math.sqrt(co*co/(rx*rx)+si*si/(rz*rz));
   const delta=Math.atan2(Math.sin(ang-site.portDir),Math.cos(ang-site.portDir));
   const cove=Math.exp(-delta*delta/(.34*.34));
   const coast=radius-(radius-(shape.harbourFacingCoastM||940))*cove;
   const irregular=88*Math.sin(5*ang+seed*.11)+51*Math.sin(9*ang-seed*.17);
   const inlet=42*(fbm2(co*4.3+seed*.19,si*4.3-seed*.23,seed+73)-.5);
   return coast+irregular+inlet-dist;
  }
  if(sea){
   const along=x*nx+z*nz,side=x*tx+z*tz;
   let D=site.shoreDistM;
   D+=(fbm2(side/1250+seed*.37,3.7,seed)-.5)*520;
   D+=(fbm2(side/330+seed*.71,8.1,seed+5)-.5)*150;
   if(site.port){
    const w=Math.max(320,R*1.1);
    D-=Math.min(D*.5,R*.42*Math.exp(-(side*side)/(w*w)));                              // enseada do porto
    D+=Math.min(R*.3,Math.abs(side))*.12*(Math.exp(-((side-w*1.5)**2)/(w*w*.4))+Math.exp(-((side+w*1.5)**2)/(w*w*.4))); // pontas
   }
   return D-along;
  }
  // lago: círculo irregular
  const lx=nx*(site.shoreDistM+site.lakeR),lz=nz*(site.shoreDistM+site.lakeR);
  const dx=x-lx,dz=z-lz,d=Math.hypot(dx,dz)||1;
  const ang=Math.atan2(dz,dx);
  const wob=site.lakeR*(.2*(fbm2(Math.cos(ang)*1.7+seed*.13,Math.sin(ang)*1.7+seed*.29,seed+3)-.5)
                     +.09*(fbm2(Math.cos(ang)*5.1+seed*.7,Math.sin(ang)*5.1,seed+9)-.5));
  return d-(site.lakeR+wob);
 }
 function riverSD(x,z){
  if(!site.hasRiver)return 1e6;
  const rx=Math.cos(site.riverAng),rz=Math.sin(site.riverAng);
  const rtx=-rz,rtz=rx;
  const along=x*rx+z*rz,side=x*rtx+z*rtz;
  const wob=(fbm2(side/420+seed*.51,2.3,seed+17)-.5)*260;
  return Math.abs(along-(site.riverDistM+wob))-site.riverWidthM*.5;
 }
 const shoreAt=(x,z)=>Math.min(coastSD(x,z),riverSD(x,z));

 // distância à água com sinal: positiva em terra
 const sdCache={x:NaN,z:NaN,v:0};
 function shoreM(x,z){
  if(x===sdCache.x&&z===sdCache.z)return sdCache.v;
  const v=shoreAt(x,z);sdCache.x=x;sdCache.z=z;sdCache.v=v;return v;
 }

 // morros, vales e serras
 function inlandM(x,z){
  const r=Math.hypot(x,z);
  const sd=shoreM(x,z);
  const slope=site.slope[0]*x+site.slope[1]*z;
  const near=smooth(150,620,r),mid=smooth(380,1900,r),far=smooth(1100,4600,r);
  const rangeAmp=site.ranges.length?site.ranges[0].heightM*.05:0;
  const hills=
    (fbm2(x/1500+seed*.19,z/1500-seed*.11,seed+31)-.5)*2*(18+rangeAmp)*far +
    (fbm2(x/520+seed*.41,z/520+seed*.23,seed+37)-.5)*2*30*mid +
    (fbm2(x/170+seed*.67,z/170-seed*.53,seed+41)-.5)*2*8.5*near +
    (fbm2(x/46+seed*.13,z/46+seed*.79,seed+43)-.5)*2*2.1;
  // o interior sobe devagar: 1 m a cada 250 m terra adentro (até 60 m)
  const rise=Math.min(60,Math.max(0,sd)*.004);
  let h=1.6+rise+slope*.6+hills;
  // serras: perfil assimétrico (encosta da frente mais larga), sem degraus
  for(const rg of site.ranges){
   const rx=Math.cos(rg.ang),rz=Math.sin(rg.ang),rtx=-rz,rtz=rx;
   const along=x*rx+z*rz-rg.distM;
   const spread=rg.spreadM*(along<0?1.8:1);
   const across=Math.exp(-(along*along)/(spread*spread));
   if(across<1e-4)continue;
   const s=Math.abs(x*rtx+z*rtz)/rg.halfLenM;
   const taper=1-smooth(.62,1.16,s);
   const crest=.62+.22*Math.sin((x*rtx+z*rtz)/950+rg.seed*.7)+.26*fbm2((x*rtx+z*rtz)/2300,rg.seed*.3,seed+61);
   h+=rg.heightM*across*taper*Math.max(.34,crest);
  }
  // terraço urbano: a cidade assenta num chão quase plano, levemente inclinado
  const pad=1-smooth(R*.86,R*1.32,r);
  h=h*(1-.6*pad)+1.9*pad;
  return h;
 }

 const depthMax=sea?30:lake?11:3.2;
 function depthProfile(sd){ // sd<=0
  const t=clamp(-sd/(sea?520:lake?260:90),0,1);
  return .18+depthMax*(t*t*(3-2*t));
 }

 const heightM=(x,z)=>{
  const sd=shoreM(x,z);
  if(sd<=0)return -depthProfile(sd);
  const land=inlandM(x,z);
  const d=sd;
  // praia → terra: 0,4 m junto à água, 6 m a 45 m, depois o relevo
  const beach=.35+6.2*smooth(0,48,d)+3.4*smooth(48,190,d);
  const w=smooth(45,260,d);
  return Math.max(.05,beach*(1-w)+Math.max(land,.3)*w);
 };
 const depthM=(x,z)=>Math.max(0,-heightM(x,z));

 function forestAt(x,z){
  const sd=shoreM(x,z);if(sd<14)return 0;
  const r=Math.hypot(x,z);
  const pad=1-smooth(R*.8,R*1.2,r);
  const f=site.forest*(.45+.85*fbm2(x/620+seed*.31,z/620-seed*.17,seed+71));
  const alt=heightM(x,z);
  const treeLine=1-smooth(650+site.forest*300,1150,alt);
  return clamp(f*(1-.92*pad)*treeLine,0,1);
 }

 return {site,heightM,depthM,shoreM,forestAt,waterLevel:0,
  debug:{inlandM,coastSD,riverSD},
  bounds:{near:R*1.35+320,mid:Math.max(3600,R*1.7),far:Math.max(15000,R*3.4)}};
}
