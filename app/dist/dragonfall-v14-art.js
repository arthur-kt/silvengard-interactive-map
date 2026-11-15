// Silvengard v14 — marcos de Dragonfall: plano urbano e escala legiveis em 3D.
// Componentes cênicos novos são interpretações de 1277 AQD; não estabelecem fatos canônicos.
import {addTower,addBanner,addTent,addStall,addCrate,addBarrel,addPillar,tc} from './settlements.js?v=56';
const ST={stone:'#b5aea2',basalt:'#555159',nord:'#8d9399',snow:'#c2c6cf',elf:'#d9dacf',wood:'#77644b',ash:'#666161',desert:'#c5a781',copper:'#9b6c48'};
const PI=Math.PI;
export const DRAGONFALL_V14_ROLES={
 'ereth-forest-river':'bosque élfico','dragonbane-royal-elfin':'capital de herança dupla',
 'halfling-river-trade':'mercado halfling','sole-arcane-tower':'última torre arcana',
 'dagorah-clan-forges':'salão dos clãs','khajitt-wetland-citadel':'assentamento khajitt',
 'savhalla-caravan':'cidade caravaneira','ash-fall-harbour':'porto das cinzas',
 'windbear-winter-fort':'fortaleza do inverno','gugacon-volcanic-restoration':'cidade vulcânica',
 'rinnton-raven-garrison':'bastião fronteiriço','clifshore-watch-coast':'vigia marítima',
 'lakenford-winter-watch':'posto da neve','nilhelm-uninhabited':'ruínas desabitadas',
 'sardinhas-woodland-fishers':'vila pesqueira','naril-elfic-port':'porto alto-élfico',
 'sarandir-dragonborn-harbour':'porto reconstruído de Gugacon'};
export function buildDragonfallV14(env){
 const {m,lay,cx,cy,G,world,landAt,addSolid,rand,color}=env;
 const profile=lay.dragonfallV14;
 if(!profile)return null;
 const role=profile.role,marks=[];
 const position=(u,v)=>{const [x,z]=world(u,v);return [x,G(cx+u,cy+v)+.06,z]};
 const safe=(u,v)=>landAt(cx+u,cy+v);
 const district=(kind)=>lay.districts?.find(d=>d.kind===kind);
 const spot=(kind,defRadius=.35)=>{const d=district(kind);return d?[d.u,d.v]:[Math.cos(lay.a0)*lay.Rt*defRadius,Math.sin(lay.a0)*lay.Rt*defRadius]};
 const mark=(label,u,v)=>{marks.push({label,u,v});lay.landmarks=(lay.landmarks||[]).concat([[u,v]])};
 const box=(kind,u,v,w,h,d,offset=0,shade=ST.stone,rot=0)=>{if(!safe(u,v))return false;const[x,y,z]=position(u,v);m.box(kind,w,h,d,{at:[x,y+offset,z],rot,tint:tc(shade)});return true};
 const col=(u,v,h=4,r=.25,shade=ST.stone)=>{if(!safe(u,v))return false;const[x,y,z]=position(u,v);m.cyl('stone',r,r*.88,h,9,{at:[x,y,z],tint:tc(shade)});return true};
 const tower=(u,v,h=10,shade=ST.stone,cap='#637183',rad=1.6)=>{if(!safe(u,v))return false;const[x,y,z]=position(u,v);addTower(m,{at:[x,y,z],r:rad,h,sides:9,cap:'roof',capH:h*.31,tint:tc(shade),capTint:tc(cap),slits:true});addSolid(cx+u,cy+v,rad*.65);return true};
 const banners=(u,v,h=5)=>{if(!safe(u,v))return;const[x,y,z]=position(u,v);addBanner(m,{at:[x,y,z],h,color,scale:.8})};
 const altar=(u,v,shade=ST.stone)=>{box('stone',u,v,3.8,.58,3.3,0,shade);col(u-1.65,v+1.3,2.7,.22,shade);col(u+1.65,v+1.3,2.7,.22,shade);box('stone',u,v+1.3,4.1,.34,.65,2.5,shade)};
 const arch=(u,v,shade=ST.elf,broken=false)=>{for(const s of [-1,1]){box('stone',u+s*2.5,v,.7,broken&&s===1?2.4:4.8,.75,0,shade)}box('stone',u,v,6.1,.62,1.05,broken?2.15:4.6,shade)};
 const monoliths=(u,v,shade=ST.nord)=>{for(let k=0;k<7;k++){const a=k*PI*2/7,uu=u+Math.cos(a)*4.7,vv=v+Math.sin(a)*4.7;col(uu,vv,2.2+(k%3)*.6,.42,shade)}};
 const grove=(u,v,shade=ST.elf)=>{for(let i=0;i<6;i++){const a=i*PI/3,uu=u+Math.cos(a)*6.5,vv=v+Math.sin(a)*6.5;if(!safe(uu,vv))continue;const[x,y,z]=position(uu,vv);m.cyl('wood',.27,.23,3.6,8,{at:[x,y,z],tint:tc(ST.wood)});m.cyl('roof',2.1,.05,3.9,9,{at:[x,y+2.8,z],tint:tc(i%2?'#668a6d':'#547a66')})}arch(u,v,shade)};
 const cargo=(u,v,n=6)=>{for(let i=0;i<n;i++){const uu=u+(i%3-1)*2.3,vv=v+Math.floor(i/3)*2.6;if(!safe(uu,vv))continue;const[x,y,z]=position(uu,vv);if(i%2)addBarrel(m,{at:[x,y,z]});else addCrate(m,{at:[x,y,z],rot:rand()*1.2,s:.95})}};
 const market=(u,v,n=4)=>{for(let i=0;i<n;i++){const a=i*PI*2/n,r=4.4,uu=u+Math.cos(a)*r,vv=v+Math.sin(a)*r;if(!safe(uu,vv))continue;const[x,y,z]=position(uu,vv);addStall(m,{at:[x,y,z],rot:a,R:rand})}};
 const forge=(u,v)=>{box('stone',u,v,4.0,2.7,3.3,0,ST.basalt);box('stone',u+1.2,v,1.6,5,1.6,2.1,ST.ash);box('glass',u-.6,v+1.65,1.1,.85,.15,.7,'#c97536');cargo(u+5,v,3)};
 const cityErs=(u,v,shade=ST.stone)=>{for(let i=0;i<4;i++)arch(u+(i%2)*6.5,v+(i>1?6.5:0),shade,i===3)};
 const woodFence=(u,v,shade=ST.wood)=>{for(let i=0;i<7;i++){const t=i*2.3-6.9;box('wood',u+t,v,.2,1.6,.2,0,shade);if(i<6)box('wood',u+t+1.1,v,2.3,.16,.15,.72,shade)}};
 const winterWatch=(u,v)=>{tower(u,v,11,ST.nord,'#555c69',1.8);box('stone',u+3.7,v,5.4,2.4,3.6,0,ST.snow);box('roof',u+3.7,v,6.3,.6,4.5,2.45,'#545a64');banners(u,v+3,5.5)};
 const seaWatch=(u,v)=>{tower(u,v,12,ST.stone,'#425e74',2.0);box('stone',u+2.5,v,3.6,2.5,3.1,0,ST.stone);box('glass',u,v,1.0,.8,.1,9.9,'#daa45a')};
 const fishRacks=(u,v)=>{for(let k=0;k<4;k++){let xx=u+k*2.7;if(!safe(xx,v))continue;for(let s of[-1,1])col(xx+s*.75,v,1.9,.09,ST.wood);box('wood',xx,v,1.9,.18,.15,1.65,ST.wood)}cargo(u,v+3,4)};
 const k=role;
 if(k==='dragonbane-royal-elfin'){
  const [u,v]=spot('noble');cityErs(u,v,ST.elf);mark('Arcadas élficas antigas',u,v);const [t,q]=spot('temple');altar(t,q,ST.stone);mark('Templo de Mátilla',t,q);
 }else if(k==='ereth-forest-river'||k==='naril-elfic-port'){
  const [u,v]=spot('grove');grove(u,v,ST.elf);mark('Bosque alto-élfico',u,v);const[t,q]=spot(k==='naril-elfic-port'?'harbour':'temple');arch(t,q,ST.elf);cargo(t+4,q,4);mark(k==='naril-elfic-port'?'Cais élfico':'Jardins de Gavanon',t,q);
 }else if(k==='halfling-river-trade'){
  const [u,v]=spot('grove');woodFence(u,v);for(let i=0;i<4;i++){let a=i*PI/2;let uu=u+Math.cos(a)*5,vv=v+Math.sin(a)*5;col(uu,vv,1.9,.16,ST.wood);box('roof',uu,vv,1.6,1.6,1.7,1.7,'#699261')};mark('Hortas dos halflings',u,v);const[t,q]=spot('market');market(t,q,5);mark('Feira das balsas',t,q);
 }else if(k==='sole-arcane-tower'){
  const [u,v]=spot('academy');tower(u,v,23,'#aaa7ac','#5b6a91',2.25);for(let i=0;i<4;i++){const a=i*PI/2;box('stone',u+Math.cos(a)*4,v+Math.sin(a)*4,2.8,1.1+i*.35,2.2,0,ST.ash)}mark('Torre Solitária sobrevivente',u,v);const[t,q]=spot('temple');altar(t,q,'#aaa8b6');mark('Santuário de Gavanon',t,q);
 }else if(k==='dagorah-clan-forges'){
  const[u,v]=spot('craft');forge(u,v);forge(u+7,v+4);mark('Forjas dos clãs',u,v);
 }else if(k==='khajitt-wetland-citadel'){
  const[u,v]=spot('grove');monoliths(u,v,'#807f72');woodFence(u+5,v,ST.wood);mark('Pátio do Grande Espírito',u,v);const[t,q]=spot('market');market(t,q,5);mark('Feira khajitt',t,q);
 }else if(k==='savhalla-caravan'){
  const[u,v]=spot('caravan');for(let i=0;i<7;i++){const a=i*PI*2/7;const t=u+Math.cos(a)*7,q=v+Math.sin(a)*7;if(!safe(t,q))continue;const[x,y,z]=position(t,q);addTent(m,{at:[x,y,z],rot:a,color:i%3===0?'#a85e3a':'#bca27b'})}mark('Pátio das caravanas',u,v);const[t,q]=spot('market');market(t,q,6);cargo(t+7,q,4);mark('Mercado de Amestris',t,q);
 }else if(k==='ash-fall-harbour'){
  const[u,v]=spot('harbour');cityErs(u,v,ST.ash);cargo(u+4,v,7);mark('Docas marcadas pela cinza',u,v);const[t,q]=spot('craft');box('stone',t,q,5,2,3.5,0,ST.ash);for(let i=0;i<5;i++)col(t+i*2-4,q+5,2.8+(i%2)*1,.21,ST.ash);mark('Estaleiros reconstruídos',t,q);
 }else if(k==='windbear-winter-fort'){
  const[u,v]=spot('temple');monoliths(u,v,ST.nord);mark('Pedras do Grande Norte',u,v);const[t,q]=spot('military');winterWatch(t,q);mark('Vigia Windbear',t,q);
 }else if(k==='gugacon-volcanic-restoration'){
  const[u,v]=spot('temple');for(let i=0;i<6;i++){const a=i*PI/3;const t=u+Math.cos(a)*6,q=v+Math.sin(a)*6;col(t,q,3.4+(i%3)*1.0,.85,ST.basalt)}mark('Terraço vulcânico',u,v);const[t,q]=spot('craft');forge(t,q);mark('Oficinas de recuperação',t,q);
 }else if(k==='sarandir-dragonborn-harbour'){
  const[u,v]=spot('temple');for(let j=0;j<6;j++){const a=j*PI/3;col(u+Math.cos(a)*4.3,v+Math.sin(a)*4.3,4.3,.34,'#c2c8ca')}box('stone',u,v,4.6,.8,4.6,0,'#b5c0cb');mark('Pátio de Bahamut',u,v);const[t,q]=spot('harbour');cargo(t,q,9);tower(t+7,q,7,ST.basalt,'#b0a79c',1.1);mark('Porto novo de Sarandir',t,q);
 }else if(k==='rinnton-raven-garrison'){
  const[u,v]=spot('military');winterWatch(u,v);tower(u+5,v+5,8,ST.nord,'#636875',1.2);mark('Bastião Corvenhal',u,v);const[t,q]=spot('craft');cargo(t,q,5);mark('Depósitos militares',t,q);
 }else if(k==='clifshore-watch-coast'){
  const[u,v]=spot('military');seaWatch(u,v);mark('Torre do litoral',u,v);const[t,q]=spot('harbour');fishRacks(t,q);mark('Cais dos pescadores',t,q);
 }else if(k==='lakenford-winter-watch'){
  const[u,v]=spot('military');winterWatch(u,v);woodFence(u+5,v);mark('Guarda da Neve',u,v);const[t,q]=spot('temple');monoliths(t,q,ST.nord);mark('Pedras do Grande Norte',t,q);
 }else if(k==='nilhelm-uninhabited'){
  const u=lay.Rt*.2,v=-lay.Rt*.15;tower(u,v,7,'#777778','#777778',1.2);for(let i=0;i<6;i++){const a=i*PI/3;box('stone',u+Math.cos(a)*8,v+Math.sin(a)*8,2.8,.6,2.2,0,ST.ash)}mark('Vestígios de Nilhelm',u,v);
 }else if(k==='sardinhas-woodland-fishers'){
  const[u,v]=spot('harbour');fishRacks(u,v);mark('Pesca da vila',u,v);const[t,q]=spot('grove');grove(t,q,'#b3c9af');mark('Bosque costeiro',t,q);
 }
 lay.dragonfallMarks=marks;
 return {role,landmarks:marks.length,labels:marks.map(q=>q.label)};
}
