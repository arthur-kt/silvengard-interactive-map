// Silvengard - cidade 3D orientada por perfis do arquivo .map (Azgaar).
// ESM sem dependencias externas: uso no navegador e testes Node.
// As malhas nao sao importacoes geometricas dos SVG Watabou.
const PI=Math.PI;
const TAU=PI*2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rotate=(u,v,a)=>[Math.cos(a)*u-Math.sin(a)*v,Math.sin(a)*u+Math.cos(a)*v];
const round=v=>Math.round(v*1000)/1000;
const seg=(a,b,n=7,noise=0,phase=0)=>{
 const p=[];
 for(let i=0;i<=n;i++){
  const t=i/n,xx=a[0]+(b[0]-a[0])*t,zz=a[1]+(b[1]-a[1])*t;
  const wob=Math.sin(PI*t)*Math.sin(t*PI*2+phase)*noise;
  const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
  p.push([round(xx-(b[1]-a[1])/d*wob),round(zz+(b[0]-a[0])/d*wob)]);
 }
 return p;
};
const road=(pts,w,main=false,extras={})=>({pts,w,main,a:Math.atan2(pts.at(-1)[1],pts.at(-1)[0]),...extras});
const ring=(r,a0=0,div=80,w=1.8,undulation=0)=>{
 const pts=[];
 for(let i=0;i<=div;i++){
  const a=a0+TAU*i/div;
  const rr=r*(1+undulation*(.5*Math.sin(5*a+.75)+.5*Math.sin(9*a-1.2)));
  pts.push([round(rr*Math.cos(a)),round(rr*Math.sin(a))]);
 }
 return road(pts,w,true,{ring:true});
};
const spokes=(R,count,a0,{curve=0.04,inner=12,width=2.3}={})=>{
 const roads=[];
 for(let k=0;k<count;k++){
  const a=a0+k*TAU/count,pts=[];
  for(let j=0;j<=10;j++){
   const t=j/10,r=inner+(R-inner)*t,sw=curve*Math.sin(t*PI)*(1+Math.sin(k*5.4))*R;
   pts.push([round(r*Math.cos(a)-sw*Math.sin(a)),round(r*Math.sin(a)+sw*Math.cos(a))]);
  }
  roads.push(road(pts,width,true,{a}));
 }
 return roads;
};

/** Aplica o perfil de cidade ao terreno local. Nao altera mundo nem coordenadas do Atlas. */
export function applyBlueprintTerrain(site,blueprint){
 if(!blueprint)return site;
 const island=blueprint.terrain?.island;
 if(island){
  site.island={...island};
  site.waterKind='sea';site.lakeR=0;
  site.hasRiver=false;site.riverWidthM=0;
  site.port=true;site.shoreDistM=island.harbourFacingCoastM;
  site.portDir=Number.isFinite(site.waterAng)?site.waterAng:0;
 }
 const mountainWall=blueprint.terrain?.mountainWall;
 if(mountainWall)site.mountainWall={...mountainWall};
 const subterranean=blueprint.terrain?.subterranean;
 if(subterranean){
  site.subterranean={...subterranean};
  site.mountainWall={...(site.mountainWall||{}),...(subterranean.mountainWall||{})};
  site.forest=Math.min(site.forest,.22);
 }
 const woodland=blueprint.terrain?.woodland;
 if(woodland){
  if(woodland.climate)site.climate=woodland.climate;
  if(Number.isFinite(woodland.densityMin))site.forest=Math.max(site.forest,woodland.densityMin);
  if(Number.isFinite(woodland.densityMax))site.forest=Math.min(site.forest,woodland.densityMax);
 }
 const arch=blueprint.classification?.architecture;
 if(arch==='high-elf')site.forest=Math.max(site.forest,.58);
 else if(arch==='woodland-elf')site.forest=Math.max(site.forest,.68);
 else if(arch==='goblin-marsh')site.climate='wet';
 if(blueprint.pattern==='marsh-causeways'){
  site.climate='wet';site.forest=Math.max(site.forest,.36);
 }
 if(blueprint.pattern==='volcanic'){
  site.forest=Math.min(site.forest,.21);
 }
 if(blueprint.pattern==='steppe-camp'){
  site.forest=Math.min(site.forest,.12);
 }
 return site;
}

/** Substitui avenidas meramente radiais por malhas geometricamente variadas. */
export function applyCityBlueprint(layout,blueprint,site){
 if(!layout||!blueprint)return layout;
 const p=blueprint.pattern,R=layout.Rt,angle=layout.a0,seed=blueprint.seed>>>0;
 const phase=(seed%1000)*.017;
 const main=2.7*(layout.wide||1);
 let roads=[],gates=[];
 layout.pattern=p;
 layout.blueprintSource=blueprint.source;
 layout.blueprintName=blueprint.name;
 layout.seed=seed;
 layout.plaza=p==='ruins'?8:p==='steppe-camp'?8:p==='desert-medina'?Math.max(6,layout.plaza):layout.plaza;
 const isCapital=!!layout.capital;
 const hasPort=!!site?.port;
 const intoWater=site?.portDir??0;
 // Quadrícula romana, com anéis e avenidas de aproximação. Elucitor a usa numa ilha.
 if(p==='imperial-grid'){
  const twist=(seed%360)*PI/180*.18,orientation=angle*.36+twist;
  const step=clamp(R/5.8,16,38);
  const n=Math.min(13,Math.ceil(R*.83/step));
  const half=R*.91;
  for(const axis of[0,1])for(let i=-n;i<=n;i++){
   const d=i*step;if(Math.abs(d)>half)continue;
   const line=Math.sqrt(half*half-d*d);
   const one=axis===0?[-line,d]:[d,-line];
   const two=axis===0?[line,d]:[d,line];
   const p1=rotate(...one,orientation),p2=rotate(...two,orientation);
   roads.push(road(seg(p1,p2,Math.max(6,Math.floor(line/8)),(i===0?0:.7),phase+i),
      i===0?main*1.55:Math.abs(i)<2?2.3:1.7,i===0||Math.abs(i)<=1,{grid:true}));
  }
  roads.push(ring(R*.49,orientation,82,main*.73,.012));
  roads.push(ring(R*.76,orientation,98,main*.59,.006));
  gates=[orientation,orientation+PI/2,orientation+PI,orientation+3*PI/2];
  layout.wallShape='squircle';layout.center='fountain';
 }else if(p==='elfic-organic'||p==='forest-settlement'){
  const n=p==='forest-settlement'?5:isCapital?10:7;
  roads=spokes(R*.98,n,angle,{curve:p==='forest-settlement'?.16:.105,inner:layout.plaza+2,width:main*.83});
  roads.push(ring(R*.32,angle,76,1.65,.13));
  roads.push(ring(R*.67,angle+.17,100,1.45,.11));
  if(R>125)roads.push(ring(R*.86,angle,112,1.2,.095));
  gates=roads.slice(0,n).map(r=>r.a);
  layout.wallShape='organic';
 }else if(p==='dwarven-terraces'||p==='fortress'){
  const n=p==='fortress'?5:7;
  roads=spokes(R*.98,n,angle,{curve:p==='fortress'?.02:.115,inner:layout.plaza+3,width:main*.95});
  roads.push(ring(R*.35,angle,72,2.1,p==='fortress'?.01:.04));
  roads.push(ring(R*.65,angle,96,2.05,p==='fortress'?.015:.045));
  if(p==='dwarven-terraces'&&R>110)roads.push(ring(R*.88,angle,110,1.85,.05));
  gates=roads.slice(0,n).map(r=>r.a);
  layout.wallShape=p==='fortress'?'squircle':'terraces';
 }else if(p==='harbor-front'){
  const a=intoWater,side=a+PI/2;
  const D=R*.86;
  // Ribalta: longas ruas paralelas ao cais, conectadas por ruas transversais.
  for(let i=-3;i<=3;i++){
   const longitudinal=rotate(i*R*.22,0,side),from=rotate(i*R*.22,-D,side),to=rotate(i*R*.22,D*.65,side);
   roads.push(road(seg(from,to,11,2,phase+i),i===0?main:1.8,i===0,{portAxis:true}));
  }
  for(let j=-3;j<=3;j++){
   const off=j*R*.24;
   roads.push(road(seg(rotate(-D*.85,off,side),rotate(D*.85,off,side),10,1.3,phase-j),j===0?main:1.65,j===0));
  }
  roads.push(...spokes(R*.91,4,a+PI/4,{curve:.04,inner:layout.plaza+4,width:1.7}));
  gates=[a+PI/2,a-PI/2,a+PI];layout.wallShape='organic';
 }else if(p==='desert-medina'){
  roads=spokes(R*.96,9,angle,{curve:.19,inner:layout.plaza+3,width:main*.85});
  for(const frac of[.19,.36,.53,.7,.87])roads.push(ring(R*frac,angle+frac,76,1.4,frac*.25));
  gates=roads.slice(0,9).map(r=>r.a);
  layout.wallShape='organic';layout.center='market';
 }else if(p==='marsh-causeways'){
  roads=spokes(R*.96,6,angle,{curve:.20,inner:layout.plaza+2,width:2.4});
  for(const frac of[.35,.7])roads.push(ring(R*frac,angle,72,1.75,.19));
  gates=roads.slice(0,6).map(r=>r.a);
  layout.wallShape='organic';layout.center='market';
 }else if(p==='steppe-camp'){
  roads=spokes(R*.95,7,angle,{curve:.045,inner:layout.plaza+3,width:2.1});
  roads.push(ring(R*.58,angle,60,1.35,.08));
  layout.center='market';layout.N=0;layout.walled=false;
  layout.wallShape='none';gates=[];
 }else if(p==='ruins'){
  roads=spokes(R*.95,5,angle,{curve:.07,inner:layout.plaza+3,width:2});
  roads.push(ring(R*.56,angle,72,1.45,.045));
  layout.center='none';layout.N=0;layout.walled=false;
  layout.wallShape='ruined';gates=roads.slice(0,5).map(r=>r.a);
 }else if(p==='volcanic'){
  roads=spokes(R*.99,isCapital?11:8,angle,{curve:.06,inner:layout.plaza+4,width:main});
  roads.push(ring(R*.40,angle,80,2.15,.045));
  roads.push(ring(R*.75,angle,96,1.6,.07));
  layout.wallShape='terraces';gates=roads.slice(0,8).map(r=>r.a);
 }else if(p==='trading-town'||p==='capital-fan'){
  const n=p==='capital-fan'?11:8;
  roads=spokes(R*.98,n,angle,{curve:p==='capital-fan'?.085:.07,inner:layout.plaza+3,width:main});
  roads.push(ring(R*.34,angle,72,2,.035));
  roads.push(ring(R*.66,angle,90,1.6,.05));
  gates=roads.slice(0,n).map(r=>r.a);
  layout.wallShape=p==='capital-fan'?'organic':'round';
 }else{
  roads=spokes(R*.96,isCapital?11:8,angle,{curve:.09,inner:layout.plaza+2,width:main*.9});
  roads.push(ring(R*.45,angle,80,1.8,.08));
  if(R>135)roads.push(ring(R*.75,angle,100,1.5,.06));
  gates=roads.filter(r=>!r.ring).map(r=>r.a);
  layout.wallShape='organic';
 }
 // Uma via axial leva ao porto mesmo quando a cidade e uma capital.
 if(hasPort&&p!=='ruins'&&p!=='steppe-camp'){
  const a=intoWater,extent=Math.max(R*1.02,(site.island?.harbourFacingCoastM||0)/2.2);
  const pts=[];
  for(let i=0;i<=12;i++){
   const rr=layout.plaza+2+(extent-layout.plaza-2)*i/12;
   pts.push([round(Math.cos(a)*rr),round(Math.sin(a)*rr)]);
  }
  roads.push(road(pts,main*1.15,true,{a,portAxis:true}));
 }
 layout.roads=roads;
 layout.gates=gates;
 layout.roadModel=p;
 layout.features=blueprint.features||{};
 layout.urbanDesign=blueprint.urbanDesign||null;
 if(Array.isArray(blueprint.urbanDesign?.districts)&&blueprint.urbanDesign.districts.length)layout.customDistricts=blueprint.urbanDesign.districts;
 if(blueprint.features?.walls&&p!=='ruins'&&p!=='steppe-camp')layout.walled=true;
 if(blueprint.features?.market===false)layout.center='none';
 return layout;
}

/** Raios do perimetro murado, em coordenadas locais (unidades de cena). */
export function wallRadiusAt(layout,a,defaultR){
 const p=layout?.wallShape;
 if(p==='squircle'){
  // superelipse de grau 4: muralha mais quadrada sem vertices afiados
  const co=Math.cos(a),si=Math.sin(a);
  return defaultR/Math.pow(Math.pow(Math.abs(co),4)+Math.pow(Math.abs(si),4),.25);
 }
 if(p==='terraces')return defaultR*(1+.035*Math.sin(6*a+.75));
 if(p==='organic')return defaultR*(1+.038*Math.sin(5*a+.4)+.022*Math.sin(9*a-1.1));
 return defaultR;
}
