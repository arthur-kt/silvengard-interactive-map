// Silvengard v7 - arquitetura monumental, aldeias nas copas e canais com palafitas.
// Uma unica fonte de geometria para as cenas locais. Nao altera world.json nem os Estados.
import * as THREE from 'three';
import {addTower,addBuilding,addBanner,addBoat,tc,PAL,STYLES} from './settlements.js?v=56';
import {V7_M,V7_CANAL_BANDS,urbanCanalCenterXY,urbanCanalSignedDistance,canalCenterAcross} from './urban-v7-core.js?v=70';

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const inR=(a,b)=>Math.hypot(a,b);
const inside=(landAt,cx,cy,u,v)=>landAt(cx+u,cy+v);

export function addMonumentalPalaceV7({m,d,lay,rand,cx,cy,world,G,landAt,footprintY,color,styleName,addSolid}){
 if(!styleName)return null;
 const u=d.u,v=d.v,rot=d.ang+Math.PI/2,R=lay.Rt;
 const size=clamp(R*.105,10,31);  // complexo de 45 a 135 m de largura
 if(!inside(landAt,cx,cy,u,v))return null;
 const [x,z]=world(u,v),y=footprintY(cx+u,cy+v,5)+.08;
 const bronze=tc('#b48f60'),ivory=tc('#e2d6b9'),granite=tc('#9aa2a2');
 const stone=styleName==='imperial'?tc('#d1bea0'):styleName==='high-elf'?tc('#dce2d4'):tc('#a1a5a7');
 const roof=styleName==='high-elf'?tc('#49766e'):styleName==='imperial'?tc('#a46c4e'):tc('#505e69');
 const rel=(dx,dz)=>[u+Math.cos(rot)*dx+Math.sin(rot)*dz,v-Math.sin(rot)*dx+Math.cos(rot)*dz];
 const W=(dx,dz)=>world(...rel(dx,dz));
 const B=(kind,dx,dz,w,h,deep,dy=0,tint=stone)=>{
  const [bx,bz]=W(dx,dz);m.box(kind,w,h,deep,{at:[bx,y+dy,bz],rot,tint});
 };
 const tower=(dx,dz,rr,hh,capH=rr*1.3)=>{
  const [tx,tz]=W(dx,dz);
  addTower(m,{at:[tx,y+1.15,tz],r:rr,h:hh,sides:styleName==='high-elf'?10:8,
   cap:'roof',capH,tint:stone,capTint:roof,slits:styleName==='northern'});
  const [uu,vv]=rel(dx,dz);addSolid(cx+uu,cy+vv,rr*.85);
 };
 // Fundação e pátio murado: escala regional em vez do pequeno salão da v6.
 B('stone',0,0,size*2.6,1.1,size*1.95,-.35,styleName==='imperial'?tc('#bbae97'):granite);
 const wallH=styleName==='northern'?size*.37:size*.27;
 const xw=size*1.29,zw=size*.98;
 for(const side of[-1,1]){
  B('stone',side*xw,0,size*.18,wallH,size*1.95,.8,stone);
  B('stone',0,side*zw,size*2.55,wallH,size*.15,.8,stone);
 }
 // O portal e marcado por duas torres, os habitantes podem voar e observar o patio.
 const towerHeight=size*(styleName==='high-elf'?1.32:styleName==='northern'?1.06:.83);
 for(const sx of[-1,1])for(const sz of[-1,1])tower(sx*xw,sz*zw,size*(styleName==='high-elf'?.115:.14),towerHeight,size*.21);
 B('stone',0,0,size*1.35,size*.58,size*.75,1.04,stone);
 B('roof',0,0,size*1.42,size*.15,size*.81,1.04+size*.58,roof);
 B('stone',0,-size*.53,size*.58,size*.38,size*.37,1.06,stone);
 B('roof',0,-size*.53,size*.63,size*.12,size*.4,1.04+size*.38,roof);
 // Ala administrativa e aposentos de corte, distintos dos quarteiroes residenciais.
 for(const side of[-1,1]){
  B('stone',side*size*.86,-size*.23,size*.37,size*.31,size*.9,1.04,stone);
  B('roof',side*size*.86,-size*.23,size*.43,size*.12,size*.98,1.04+size*.31,roof);
  const [xx,zz]=W(side*size*.88,-size*.82);
  addBanner(m,{at:[xx,y+wallH+2,zz],h:1.8,color,scale:.8});
 }
 // Galeria de colunas, pátio cerimonial e monumentalidade imperial / alto-élfica.
 if(styleName!=='northern'){
  for(const side of[-1,1])for(let i=0;i<8;i++){
   const dx=(i-3.5)*size*.23,dz=side*size*.79, [tx,tz]=W(dx,dz);
   m.cyl('stone',size*.033,size*.045,size*.40,8,{at:[tx,y+1.1,tz],tint:ivory});
   m.box('stone',size*.10,size*.07,size*.10,{at:[tx,y+1.1+size*.40,tz],tint:ivory});
  }
  B('stone',0,size*.79,size*1.9,size*.13,size*.27,1.1+size*.41,ivory);
 }
 if(styleName==='imperial'){
  // Escadaria voltada para a cidade baixa. Blocos acompanham a encosta real.
  for(let i=0;i<18;i++){
   const t=(i+1)/20,rr=R*(.28*(1-t)+.03*t),a=d.ang;
   const su=Math.cos(a)*rr,sv=Math.sin(a)*rr;
   if(!inside(landAt,cx,cy,su,sv))continue;
   const [tx,tz]=world(su,sv),ground=G(cx+su,cy+sv);
   m.box('stone',size*.48,.16,1.9,{at:[tx,ground+.06,tz],rot:d.ang+Math.PI/2,tint:ivory});
  }
  // Arcos triunfais e colunas com acrotérios dourados.
  for(const side of[-1,1]){
   const [tx,tz]=W(side*size*.35,size*.38);
   m.cyl('stone',size*.07,size*.07,size*.37,10,{at:[tx,y+1.1,tz],tint:ivory});
   m.cyl('gold',size*.12,0,size*.18,8,{at:[tx,y+1.1+size*.37,tz]});
  }
 }else if(styleName==='high-elf'){
  // Torres arcanas esguias e pavilhao central enraizado no bosque.
  tower(0,-size*.30,size*.19,size*1.64,size*.38);
  for(const side of[-1,1]){
   const [tx,tz]=W(side*size*.46,size*.25);
   m.cyl('gold',size*.055,size*.055,size*.52,8,{at:[tx,y+1.1,tz]});
   m.cyl('gold',size*.14,0,size*.17,8,{at:[tx,y+1.1+size*.52,tz]});
  }
 }else{
  // Asgorath: baluarte de pedra espessa, torres de vigia e grande salao de guarda.
  B('stone',0,size*.52,size*.92,size*.34,size*.36,1.0,granite);
  for(const side of[-1,1])tower(side*size*.50,-size*.40,size*.13,size*.86,size*.14);
  for(let i=0;i<6;i++)B('stone',(i-2.5)*size*.31,size*.88,size*.14,size*.12,size*.13,1.1+wallH,granite);
 }
 // Colisao apenas nos muros/edificios, preservando os patios visitaveis.
 addSolid(cx+u,cy+v,size*.35);
 for(const side of[-1,1]){
  const [ax,az]=rel(side*size*.92,0);addSolid(cx+ax,cy+az,size*.18);
 }
 return {u,v,radius:size*1.33,height:wallH+towerHeight,style:styleName,label:d.label};
}

export function buildLivingGroveV7({m,d,world,cx,cy,G,landAt,addSolid,rand,style,extras}){
 const count=5+(d.r>17?3:0),trees=[];
 for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2+.3,rr=i===0?0:d.r*(.42+.13*rand());
  const u=d.u+Math.cos(angle)*rr,v=d.v+Math.sin(angle)*rr;
  if(!inside(landAt,cx,cy,u,v))continue;
  const [x,z]=world(u,v),base=G(cx+u,cy+v),h=8.6+rand()*5.8,s=1.0+rand()*1.1;
  m.cyl('wood',s*.66,s*.34,h,10,{at:[x,base,z],tint:tc('#635743')},false);
  for(const a of[-.8,.8]){
   const bx=x+Math.cos(angle+a)*s*1.9,bz=z+Math.sin(angle+a)*s*1.9;
   m.beam('wood',[x,base+h*.57,z],[bx,base+h*.88,bz],s*.22,{tint:tc('#71634a')});
  }
  const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry(2.75*s,1),new THREE.MeshStandardMaterial({color:i%3===0?'#4f8f65':i%3===1?'#60936e':'#6b9c65',roughness:1}));
  foliage.position.set(x,base+h+.4*s,z);foliage.scale.y=.76;foliage.castShadow=foliage.receiveShadow=true;
  extras.add(foliage);
  const foliageTop=new THREE.Mesh(new THREE.IcosahedronGeometry(1.7*s,1),new THREE.MeshStandardMaterial({color:'#78a477',roughness:1}));
  foliageTop.position.set(x+s*.7,base+h+1.2*s,z-s*.7);foliageTop.castShadow=foliageTop.receiveShadow=true;
  extras.add(foliageTop);
  if(i<4){
   const level=base+h*.63;
   m.box('wood',5.6,.36,5.1,{at:[x,level,z],tint:tc('#9d8c66')});
   addBuilding(m,{at:[x,level+.38,z],rot:angle,w:3.1,d:3.45,floors:1,type:'house',style:style||STYLES.arcane,R:rand});
   trees.push({x,z,y:level,u,v});
  }
  addSolid(cx+u,cy+v,s*.85);
 }
 // Passarelas suspensas: conectam os pavilhoes sem depender de solo plano.
 for(let i=1;i<trees.length;i++){
  const a=trees[i-1],b=trees[i],dy=Math.abs(a.y-b.y);
  if(Math.hypot(a.x-b.x,a.z-b.z)>36||dy>4.5)continue;
  m.beam('wood',[a.x,a.y-.08,a.z],[b.x,b.y-.08,b.z],.62,{tint:tc('#a29372')});
  for(const sign of[-1,1]){
   const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;
   const ox=-dz/L*sign*.46,oz=dx/L*sign*.46;
   m.beam('wood',[a.x+ox,a.y+.7,a.z+oz],[b.x+ox,b.y+.7,b.z+oz],.12,{tint:tc('#685942')});
  }
 }
 return trees.length;
}

function roadSamples(rd,step=1.05){
 const points=rd.pts||[],out=[];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dist=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(dist/step));
  for(let k=0;k<n;k++){const t=k/n;out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}
 }
 if(points.length)out.push(points.at(-1));
 return out;
}
export function buildCanalBridgesV7({m,lay,site,field,cx,cy,world,G,addSolid}){
 if(!site?.urbanCanals)return [];
 const bridges=[],occupied=[];
 for(const rd of lay.roads){
  if(bridges.length>=34)break;
  const points=roadSamples(rd),isWet=([u,v])=>field.debug.urbanCanalSD(u*V7_M,v*V7_M)<-.15;
  let first=-1;
  for(let i=1;i<points.length;i++){
   if(first<0){if(!isWet(points[i-1])&&isWet(points[i]))first=i-1;continue}
   if(isWet(points[i]))continue;
   const a=points[Math.max(0,first-2)],b=points[Math.min(points.length-1,i+2)];first=-1;
   const dx=b[0]-a[0],dz=b[1]-a[1],len=inR(dx,dz),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
   if(len<2.2||len>33||inR(...mid)>lay.Rt*.99)continue;
   if(occupied.some(p=>inR(p[0]-mid[0],p[1]-mid[1])<12))continue;
   if(field.shoreM(a[0]*V7_M,a[1]*V7_M)<1||field.shoreM(b[0]*V7_M,b[1]*V7_M)<1)continue;
   const y=Math.max(G(cx+a[0],cy+a[1]),G(cx+b[0],cy+b[1]))+.22;
   const rot=Math.atan2(-dz,dx),[x,z]=world(...mid),w=Math.max(2.15,(rd.w||1.5)*2.20);
   m.box('wood',len+.8,.24,w,{at:[x,y,z],rot,tint:tc('#907258')});
   for(const side of[-1,1]){
    const nx=-dz/len*side*w*.47,nz=dx/len*side*w*.47;
    const [ax,az]=world(a[0]+nx,a[1]+nz),[bx,bz]=world(b[0]+nx,b[1]+nz);
    m.beam('wood',[ax,y+.7,az],[bx,y+.7,bz],.14,{tint:tc('#594a38')});
    for(let k=0;k<=3;k++){
     const t=k/3;
     const xx=ax+(bx-ax)*t,zz=az+(bz-az)*t;
     m.box('wood',.12,.8,.12,{at:[xx,y+.04,zz],tint:tc('#68523b')});
    }
   }
   const bInfo={a,b,deckY:y,width:w,kind:'canal',length:len};
   bridges.push(bInfo);occupied.push(mid);
  }
 }
 lay.bridges=bridges;
 return bridges;
}

export function addMarshStiltsV7({m,site,field,lay,cx,cy,world,G,addSolid,rand,style}){
 if(!site?.urbanCanals)return 0;
 let count=0;
 const R=site.cityR;
 for(let i=0;i<V7_CANAL_BANDS.length;i++){
  const b=V7_CANAL_BANDS[i];
  for(let k=0;k<12;k++){
   const along=(-.56+k*.095)*R;
   const near=urbanCanalCenterXY(site,along,i),a=site.urbanCanals.angle;
   // uma fileira de palafitas de cada lado do canal, parcialmente sobre a agua
   const sign=k%2?-1:1,dist=sign*b.width*.51,xx=near[0]-Math.sin(a)*dist,zz=near[1]+Math.cos(a)*dist;
   const u=xx/V7_M,v=zz/V7_M;
   if(inR(u,v)>lay.Rt*.88||field.shoreM(xx,zz)<-11)continue;
   if((lay.bridges||[]).some(b=>{
    const dx=b.b[0]-b.a[0],dz=b.b[1]-b.a[1],t=clamp(((u-b.a[0])*dx+(v-b.a[1])*dz)/(dx*dx+dz*dz||1),0,1);
    return Math.hypot(u-b.a[0]-t*dx,v-b.a[1]-t*dz)<Math.max(3.2,b.width*.55);
   }))continue;
   const [x,z]=world(u,v),rot=a+Math.PI/2+(rand()-.5)*.33,
    base=G(cx+u,cy+v),y=Math.max(1.35,base+.76),w=2.9+rand()*1.2,d=3.1+rand()*1.2;
   m.box('wood',w+.6,.27,d+.8,{at:[x,y-.20,z],rot,tint:tc('#8b785d')});
   const c=Math.cos(rot),s=Math.sin(rot);
   for(const side of[-1,1])for(const end of[-1,1]){
    const px=x+c*side*w*.46+s*end*d*.45,pz=z-s*side*w*.46+c*end*d*.45;
    m.box('wood',.19,y-base+.2,.19,{at:[px,base,pz],tint:tc('#66523c')});
   }
   addBuilding(m,{at:[x,y+.10,z],rot,w,d,floors:k%3===0?2:1,type:'house',style:style||STYLES.wet,R:rand});
   if(k%2===0){
    const [bx,bz]=world(near[0]/V7_M,near[1]/V7_M);
    addBoat(m,{at:[bx,.13,bz],rot:a,s:.56+rand()*.22,sail:false});
   }
   addSolid(cx+u,cy+v,1.25);count++;
  }
 }
 return count;
}
