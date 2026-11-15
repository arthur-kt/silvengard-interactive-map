// Silvengard v12 — marcos arquitetonicos do interior de Elucitor, nao uma nova cidade.
import * as THREE from 'three';
import {addBuilding,addTower,addBanner,addHaystack,addBarrel,addCrate,addStall,addFence,addWell,tc,STYLES} from './settlements.js?v=56';
import {miningPassPoint,rimaeRampartLine,IMPERIAL_V12_M} from './imperial-v12-core.js?v=72';
const M=IMPERIAL_V12_M;
const beige=tc('#c0b6aa'),dark=tc('#5c5d60'),iron=tc('#55545a'),wood=tc('#76644f');
const safe=(env,u,v)=>env.landAt(env.cx+u,env.cy+v);
const point=(env,u,v)=>{const [x,z]=env.world(u,v);return [x,env.G(env.cx+u,env.cy+v)+.04,z]};

export function buildCastamorV12(env){
 const {m,lay,addSolid,color}=env;
 const H=lay.imperialV12?.citadelHill;if(!H)return null;
 const [x,y,z]=point(env,0,0),r=24,stone=tc('#a9a5a3'),roof=tc('#65717d');
 const place=(u,v,w,h,d,kind='stone',c=stone,dy=0)=>{const [px,,pz]=point(env,u,v);m.box(kind,w,h,d,{at:[px,y+dy,pz],tint:c})};
 // Plateau amplo, muros independentes e um portal no acesso da encosta.
 place(0,0,51,1.35,51,'stone',tc('#77777b'),-1.2);
 const sides=[-1,1];
 for(const s of sides){place(s*r,0,2.5,7,48,'stone');}
 for(const s of sides){
  const forward=s===1?1:-1;
  for(const k of [-1,1]){const x0=k*15;
   place(x0,s*r,18,6.4,2.7,'stone');}
  // Vao livre com dintel elevado: permite entrar a pe no patio.
  place(0,s*r,12,1.1,2.7,'stone',tc('#a5a39d'),6.35);
 }
 // Quatro torres de esquina, duas torres de vigia e um donjon altissimo.
 for(const sx of sides)for(const sz of sides){
  const [tx,,tz]=point(env,sx*r,sz*r);
  addTower(m,{at:[tx,y+.4,tz],r:3.3,h:14,sides:8,cap:'roof',capH:6.5,tint:stone,capTint:roof,slits:true});
  addSolid(env.cx+sx*r,env.cy+sz*r,2.9);
 }
 place(0,-5,13.4,22,14,'stone',tc('#b6b2aa'),.6);
 place(0,-5,16.3,1.3,16.3,'stone',tc('#8b8a8b'),22.6);
 for(const q of [-1,1]){
  const [ax,,az]=point(env,q*9,-11);
  addTower(m,{at:[ax,y+1,az],r:2.2,h:21,sides:8,cap:'roof',capH:7,tint:beige,capTint:roof,slits:true});
 }
 // Alojamentos, salao antigo e capela: o espaco aberto permite explorar o patio.
 place(-13,10,12,7.5,10,'stone',tc('#c0b6a5'),.5);
 place(-13,10,13,1,11,'roof',roof,8);
 place(13,11,11,9,10,'stone',tc('#a9a6a3'),.5);
 place(13,11,12.6,1,11,'roof',roof,9.4);
 place(1,15,5,6,7,'stone',tc('#d3c7b4'),.6);
 place(1,15,5.5,.6,7.5,'roof',tc('#9496a3'),6.6);
 // Crenelatura no recinto exterior para leitura a distancia.
 for(let n=-21;n<=21;n+=3){for(const side of sides){place(n,side*r,1.7,1.15,2.8,'stone',stone,7.2);place(side*r,n,2.9,1.15,1.8,'stone',stone,7.2)}}
 const [bx,,bz]=point(env,0,-5);addBanner(m,{at:[bx,y+25,bz],h:4.6,color,scale:1.2});
 // Torre velha semi-arruinada nos arredores: vestigio proposto, nao fato canonico.
 const ru=lay.Rt*.73,ra=lay.a0+1.15,ux=Math.cos(ra)*ru,vz=Math.sin(ra)*ru;
 if(safe(env,ux,vz)){
  const [rx,ry,rz]=point(env,ux,vz);
  m.cyl('stone',2.2,2,7.2,8,{at:[rx,ry,rz],tint:tc('#686971')},false);
  m.box('stone',1.4,.75,3.3,{at:[rx+1.15,ry+7.1,rz],rot:.34,tint:tc('#888783')});
  for(let i=0;i<5;i++){const a=i*1.31;m.box('stone',.95,.4,.6,{at:[rx+Math.cos(a)*4,ry+.2,rz+Math.sin(a)*4],tint:tc('#85817c')})}
  addSolid(env.cx+ux,env.cy+vz,2.2);
 }
 // Interdicao da area do recinto para que o tecido comum nao a atravesse.
 for(let t=-r;t<=r;t+=5){for(const s of sides){addSolid(env.cx+s*r,env.cy+t,1.15);if(Math.abs(t)>6)addSolid(env.cx+t,env.cy+s*r,1.15)}}
 addSolid(env.cx,env.cy-5,6.7);
 return {castle:true,centralHill:true,ruinedWatchtower:true,radius:r,height:33};
}

export function buildLorvusV12(env){
 const {m,addSolid,lay}=env;
 const spec=lay.imperialV12?.miningPass;if(!spec)return null;
 const ang=spec.angle,rot=-ang;
 const P=(fw,side=0)=>{const c=miningPassPoint(env.site,fw,side);return [c.x/M,c.z/M]};
 const put=(fw,side,kind,w,h,d,dy=0,tint=dark)=>{
  const [u,v]=P(fw,side),[x,y,z]=point(env,u,v);m.box(kind,w,h,d,{at:[x,y+dy,z],rot,tint});return {u,v,x,y,z};
 };
 // Um tunel de passagem aberto nas duas faces de uma crista rochosa.
 const from=151,to=248,length=(to-from)/M;
 // Paredes de sustentacao, vigas e cobertura de pedra sem bloquear o piso caminhavel.
 const center=(from+to)/2;
 for(const sign of [-1,1]){
  const ref=put(center,sign*11,'stone',length,5,2.8,.10,tc('#74716d'));
  for(let f=from;f<=to;f+=13){const [u,v]=P(f,sign*10.5);if(safe(env,u,v))addSolid(env.cx+u,env.cy+v,1.0)}
 }
 const ceiling=put(center,0,'stone',length,1.6,13,7.1,tc('#565756'));
 for(let f=from;f<=to;f+=14){
  for(const side of [-1,1])put(f,side*8.5,'wood',.8,6.2,1.2,.3,tc('#554334'));
  put(f,0,'wood',1.1,.65,19,6.3,tc('#655440'));
 }
 // Duas bocas claramente distinguiveis, com guarda-corpos e pequenas chapas de ferro.
 let entrances=0;
 for(const f of [from-8,to+8]){
  // Nao fechar o vao: somente travessa superior e postes laterais.
  put(f,0,'stone',2.1,1.4,14,5.2,tc('#a69c89'));
  for(const s of [-1,1]){put(f,s*7.2,'stone',2,6.5,2,0,tc('#8c867a'))}
  entrances++;
 }
 // Uma unica oficina de porte aldeao e um forno de fundicao rustico junto a mina.
 const fw=from-34,side=26;
 const at=put(fw,side,'stone',6.4,3.6,5.8,0,tc('#938679'));
 put(fw,side,'roof',7.1,.85,6.6,3.6,tc('#66554d'));
 const furnace=put(fw+12,side+3,'stone',3.8,4.8,4.1,0,tc('#786f65'));
 put(fw+12,side+3,'stone',1.6,3.8,1.6,4.7,tc('#655a50'));
 put(fw+12,side+3,'glass',1.2,1.1,.18,.35,tc('#ce763a'));
 // Tres carrinhos pequenos e pilhas de minerio; sem tecnologia fabril gigantesca.
 for(let j=0;j<3;j++){
  const f=fw+j*9,sd=-22;const cr=put(f,sd,'wood',3.0,1.0,2.15,.1,tc('#77674f'));
  put(f,sd,'stone',2.1,.8,1.4,1.12,tc(j%2?'#77716f':'#615c59'));
  for(const s of [-1,1])put(f+s*1.0,sd,'stone',.65,.75,.5,-.5,tc('#393c41'));
 }
 for(let j=0;j<4;j++){const [u,v]=P(fw+j*9,side+13),[x,y,z]=point(env,u,v);m.cyl('stone',1.1,.44,1.3,7,{at:[x,y,z],tint:tc('#807d78')})}
 addSolid(env.cx+at.u,env.cy+at.v,3.4);
 addSolid(env.cx+furnace.u,env.cy+furnace.v,2.7);
 return {minePass:true,exits:entrances,forge:true,smallScale:true,roof:true};
}

export function buildAliaV12(env,extras,fields){
 const {m,lay,addSolid,rand}=env;let orchards=0,barns=0;
 const R=lay.Rt;
 const leave=()=>rand();
 const foliage=new THREE.MeshStandardMaterial({color:'#799f69',roughness:1});
 for(const parcel of [[.53,-.32],[.58,.48],[-.61,.23],[-.54,-.46]]){
  const bu=parcel[0]*R,bv=parcel[1]*R;
  for(let i=0;i<11;i++){
   const u=bu+(i%4-1.5)*6.8,v=bv+(Math.floor(i/4)-1)*7.9;
   if(Math.hypot(u,v)>R*.95||!safe(env,u,v)||env.pathAt(u,v)[1]>.12)continue;
   const [x,y,z]=point(env,u,v);const h=2.5+leave()*1.3;
   m.cyl('wood',.23,.15,h,7,{at:[x,y,z],tint:tc('#77684b')},false);
   const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(1.6+leave()*.65,1),foliage);
   tree.position.set(x,y+h+1,z);tree.castShadow=tree.receiveShadow=true;
   extras.add(tree);orchards++;addSolid(env.cx+u,env.cy+v,.45);
  }
 }
 // Campos na orla urbana, celeiros de escala domestica e cercas rusticas.
 for(const [i,a] of [1,2,3,4,5,6,7,8].entries()){
  const ang=i*Math.PI/4+.18,r=R*(1.05+(.11*(i%2))),u=Math.cos(ang)*r,v=Math.sin(ang)*r;
  if(!safe(env,u,v))continue;
  fields.push({x:u,y:v,w:12+4*leave(),d:9+4*leave(),rot:ang,hue:leave()});
  if(i%3===0){
   const [x,y,z]=point(env,u,v);addBuilding(m,{at:[x,y,z],rot:ang,w:4.8,d:6.4,floors:1,type:'barn',style:{...STYLES.temperate,roofKind:'thatch',pitch:.74},R:rand});
   addHaystack(m,{at:[x+4,y,z],s:1.1});addSolid(env.cx+u,env.cy+v,2.4);barns++;
  }
 }
 return {orchards,barns,fields:fields.length};
}
export function buildTramorV12(env){
 const {m,lay,rand}=env;const a=lay.a0+.35,R=lay.Rt,ang=lay.a0;
 const spots=[[.37,0],[.43,.18],[-.23,.25]];let marketStalls=0;
 for(const [r,aoff] of spots){
  const u=Math.cos(ang+aoff)*r*R,v=Math.sin(ang+aoff)*r*R;
  if(!safe(env,u,v))continue;
  const [x,y,z]=point(env,u,v);
  addStall(m,{at:[x,y,z],rot:ang+aoff,R:rand});marketStalls++;
 }
 return {marketStalls};
}
export function buildRimaeV12(env){
 const {m,lay,addSolid}=env;const angles=lay.imperialV12?.rampartBearings||[];
 let towers=0,wallSections=0;
 for(const [idx,a]of angles.entries()){
  const line=rimaeRampartLine(a,lay.Rt*M*.91,Math.min(1300,lay.Rt*M+960),43);
  const norm=[-Math.sin(a),Math.cos(a)];
  for(let j=1;j<line.length;j++){
   const p=line[j-1],q=line[j];const midX=(p.x+q.x)*.5+norm[0]*14,midZ=(p.z+q.z)*.5+norm[1]*14;
   const mu=midX/M,mv=midZ/M;
   if(!safe(env,mu,mv))continue;
   const [x,y,z]=point(env,mu,mv);
   const len=Math.hypot(q.x-p.x,q.z-p.z)/M;
   // Trecho de muralha real, ligado visualmente a linha de vigia.
   m.box('stone',len+.5,2.65,1.1,{at:[x,y-.25,z],rot:-a,tint:tc('#99968c')});
   m.box('stone',len+.7,.32,1.4,{at:[x,y+2.48,z],rot:-a,tint:tc('#b4ae9e')});
   wallSections++;
   if(j%5===0&&safe(env,mu,mv)){
    addTower(m,{at:[x,y,z],r:1.5,h:5.4,sides:8,cap:'roof',capH:2.1,slits:true,tint:tc('#a9a298'),capTint:tc('#6b6661')});
    addSolid(env.cx+mu,env.cy+mv,1.2);towers++;
   }
  }
  // Posto de vigia e braseiro de sinais proximo ao forte.
  const b=line[0];if(b){
   const [x,y,z]=point(env,b.x/M,b.z/M);
   m.cyl('stone',1.5,1.5,1.2,9,{at:[x,y,z],tint:tc('#898178')});
   m.cyl('wood',.9,.7,.55,9,{at:[x,y+1.2,z],tint:tc('#744d35')});
   m.cyl('gold',.36,0,1.4,7,{at:[x,y+1.6,z],tint:tc('#d99942')});
  }
 }
 return {rampartSections:wallSections,signalTowers:towers,connectedOnWorldMap:true};
}
export function buildBomariaV12(env){
 const {m,lay,addSolid}=env;const u=lay.Rt*.22,v=-lay.Rt*.19;
 if(!safe(env,u,v))return null;
 const [x,y,z]=point(env,u,v);
 m.box('stone',7.2,.58,6.4,{at:[x,y,z],tint:tc('#bcb49e')});
 for(const sx of [-1,1])for(const sz of [-1,1])m.cyl('stone',.32,.32,3.6,8,{at:[x+sx*3.1,y+.6,z+sz*2.65],tint:tc('#e0d0af')});
 m.box('stone',7.1,.35,6.4,{at:[x,y+4.0,z],tint:tc('#c6baa5')});
 addSolid(env.cx+u,env.cy+v,2.9);
 return {trucePavilion:true};
}
