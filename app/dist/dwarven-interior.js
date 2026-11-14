// Silvengard: cidades anas verdadeiramente subterraneas.
// Camaras, corredores, teto rochoso, colunas e caminhos exploraveis em primeira pessoa.
// A geometria interna e sintetizada; o .map do Azgaar nao contem interiores.
import * as THREE from 'three';

const PI=Math.PI,TAU=PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const layouts={
 10:{title:'Dagorah',hub:'Salão dos Reis',wings:['Grande Forja','Galeria dos Clãs','Arsenal de Dagorah','Cripta dos Ancestrais'],motif:'royal'},
 29:{title:'Mauron',hub:'Salão da Pedra',wings:['Forjas de Mauron','Galeria de Mineração','Cofres de Ferro','Mercado Interior'],motif:'mining'},
 4000:{title:'Liotorn',hub:'Bastião da Cordilheira',wings:['Arsenal da Passagem','Galeria de Vigia','Forjas de Liotorn','Salão dos Defensores'],motif:'fortress'},
 176:{title:'Khizdush',hub:'Salão da Profundeza',wings:['Poços de Mineração','Forja Profunda','Galeria dos Mineiros','Câmara dos Veios'],motif:'mining'},
 238:{title:'Adush',hub:'Assembleia de Adush',wings:['Salão dos Clãs','Arquivos de Pedra','Oficinas dos Mestres','Grande Mercado'],motif:'civic'},
 239:{title:'Shararukthu',hub:'Câmara da Montanha',wings:['Armazéns Escavados','Forjas Anãs','Salão dos Ancestrais','Galeria das Pedras'],motif:'civic'},
 127:{title:'Shunzargil',hub:'Salão Ancestral',wings:['Templo das Profundezas','Biblioteca de Pedra','Grande Forja','Galeria das Crônicas'],motif:'ancient'}
};
const norm=(x,z)=>Math.hypot(x,z)||1;
const distanceSegment=(x,z,x0,z0,x1,z1)=>{
 const dx=x1-x0,dz=z1-z0,d2=dx*dx+dz*dz;
 const t=clamp(d2?((x-x0)*dx+(z-z0)*dz)/d2:0,0,1);
 return Math.hypot(x-x0-t*dx,z-z0-t*dz);
};

export function subterraneanProfile(cityId){return layouts[cityId]||null;}

/** Modelo de ocupacao e niveis do piso; pode ser testado sem renderizador WebGL. */
export function makeUndergroundLayout(cityId,seed=0){
 const spec=subterraneanProfile(cityId);if(!spec)return null;
 const length=cityId===10?87:cityId===4000?91:82;
 const angle=(seed%31-15)*.0038;
 const wings=spec.wings.map((name,k)=>{
  const a=k*PI/2+angle;
  return {name,kind:k===0?'forge':k===1?'mines':k===2?'vault':'ancestral',
   u:Math.cos(a)*length,v:Math.sin(a)*length,r:24,level:[1.4,-1.6,2.1,0.7][k]};
 });
 const radius=30;
 // Galerias secundarias interligam residencias, armazens e pequenos oficios.
 const branches=wings.flatMap((w,k)=>[-1,1].map((side,index)=>{
  const len=norm(w.u,w.v),ux=-w.v/len,vz=w.u/len;
  const distance=33;
  return {name:side<0?['Casas dos Forjadores','Ala dos Mineiros','Casas da Guarda','Bairro dos Escribas'][k]:
    ['Oficinas Baixas','Armazens de Pedra','Oficinas de Armas','Camara das Familias'][k],
   u:w.u+ux*side*distance,v:w.v+vz*side*distance,r:14,kind:index===0?'homes':'workshops',parent:w,level:w.level+(side<0?.45:-.35)};
 }));
 const canOccupy=(u,v,pad=0)=>{
  if(Math.hypot(u,v)<=radius-pad)return true;
  for(const w of wings){
   if(Math.hypot(u-w.u,v-w.v)<=w.r-pad)return true;
   if(distanceSegment(u,v,0,0,w.u,w.v)<=10.6-pad&&Math.hypot(u,v)<=length+w.r-pad)return true;
  }
  for(const b of branches){
   if(Math.hypot(u-b.u,v-b.v)<=b.r-pad)return true;
   if(distanceSegment(u,v,b.parent.u,b.parent.v,b.u,b.v)<=7.2-pad)return true;
  }
  return false;
 };
 const floorAt=(u,v)=>{
  let ret=0;
  for(const w of wings){
   const len=norm(w.u,w.v),t=(u*w.u+v*w.v)/len;
   const across=Math.abs(u*w.v-v*w.u)/len;
   if(t>8&&across<Math.max(18,w.r)){
    const k=smooth(22,len-15,t)*(1-smooth(11,w.r+8,across));
    ret+=w.level*k;
   }
  }
  for(const b of branches){
   const d=distanceSegment(u,v,b.parent.u,b.parent.v,b.u,b.v);
   const dd=Math.hypot(u-b.parent.u,v-b.parent.v);
   const weight=(1-smooth(6,22,d))*smooth(5,31,dd);
   ret=ret*(1-weight)+b.level*weight;
  }
  return ret;
 };
 const roomAt=(u,v)=>{
  let dmin=Math.hypot(u,v),name=spec.hub;
  for(const w of [...wings,...branches]){const d=Math.hypot(u-w.u,v-w.v);if(d<dmin){dmin=d;name=w.name}}
  return name;
 };
 const obstacles=[];
 // Colunas no centro; entradas nos eixos ficam livres para cruzar galerias.
 for(let k=0;k<8;k++){
  const a=(k+.5)*TAU/8;
  obstacles.push({u:Math.cos(a)*21.5,v:Math.sin(a)*21.5,r:2.4});
 }
 for(const w of wings)for(let k=0;k<6;k++){
  const a=k*TAU/6+PI/12;
  obstacles.push({u:w.u+Math.cos(a)*16.3,v:w.v+Math.sin(a)*16.3,r:1.8});
 }
 const accessible=(u,v,r=.4)=>{
  for(const [dx,dz] of [[0,0],[r,0],[-r,0],[0,r],[0,-r]])if(!canOccupy(u+dx,v+dz,.5))return false;
  for(const o of obstacles)if(Math.hypot(u-o.u,v-o.v)<r+o.r)return false;
  return true;
 };
 return {id:cityId,seed,spec,radius,length,wings,branches,obstacles,canOccupy,accessible,floorAt,roomAt,
  spawn:{u:0,v:-9,yaw:PI},exit:{u:0,v:-19},span:length+29};
}

function cavernMesh(layout){
 const extent=layout.span+2,step=2.5,cols=Math.ceil(extent*2/step);
 const verts={floor:[],roof:[],rock:[]};
 const colors={floor:[],roof:[],rock:[]};
 const push=(key,a,b,c,color)=>{
  verts[key].push(...a,...b,...c);
  for(let i=0;i<3;i++)colors[key].push(...color);
 };
 const quad=(key,a,b,c,d,col)=>{push(key,a,b,c,col);push(key,a,c,d,col)};
 const noisy=(x,z)=>1.5*Math.sin(x*.09+layout.seed*.005)*Math.cos(z*.12)+.8*Math.sin(x*.27-z*.23+layout.seed*.0002);
 const ceiling=(x,z)=>layout.floorAt(x,z)+16.2+
    3.5*Math.sin(x*.048)*Math.cos(z*.041)+noisy(x,z)+2.9*Math.sin(Math.hypot(x,z)*.13);
 const occupied=(x,z)=>layout.canOccupy(x,z,-1.1);
 const ground=(x,z)=>layout.floorAt(x,z)-.04;
 for(let i=0;i<cols;i++)for(let j=0;j<cols;j++){
  const x=-extent+i*step,z=-extent+j*step;
  if(!occupied(x+step/2,z+step/2))continue;
  const a=[x,ground(x,z),z],b=[x+step,ground(x+step,z),z],c=[x+step,ground(x+step,z+step),z+step],d=[x,ground(x,z+step),z+step];
  const A=[x,ceiling(x,z),z],B=[x+step,ceiling(x+step,z),z],C=[x+step,ceiling(x+step,z+step),z+step],D=[x,ceiling(x,z+step),z+step];
  const k=.85+.13*Math.sin(i*.73+j*.49+layout.seed*.001);
  quad('floor',a,d,c,b,[.39*k,.37*k,.34*k]);
  quad('roof',A,B,C,D,[.23*k,.24*k,.25*k]);
  const boundary=(di,dj)=>!occupied(x+step*(.5+di),z+step*(.5+dj));
  const rockCol=[.31*k,.32*k,.33*k];
  if(boundary(-1,0))quad('rock',a,A,D,d,rockCol);
  if(boundary(1,0))quad('rock',b,c,C,B,rockCol);
  if(boundary(0,-1))quad('rock',a,b,B,A,rockCol);
  if(boundary(0,1))quad('rock',d,D,C,c,rockCol);
 }
 const group=new THREE.Group();group.name='dwarven-cavern';
 for(const key of Object.keys(verts)){
  const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(verts[key],3));
  ge.setAttribute('color',new THREE.Float32BufferAttribute(colors[key],3));ge.computeVertexNormals();
  const ma=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide,flatShading:key==='rock'});
  const mesh=new THREE.Mesh(ge,ma);mesh.name='cavern-'+key;mesh.receiveShadow=true;
  mesh.castShadow=key==='roof';mesh.frustumCulled=false;group.add(mesh);
 }
 return group;
}

const MAT={
 stone:new THREE.MeshStandardMaterial({color:'#8a8983',roughness:1}),
 stoneDark:new THREE.MeshStandardMaterial({color:'#55565a',roughness:1}),
 gold:new THREE.MeshStandardMaterial({color:'#a48d5b',metalness:.45,roughness:.53}),
 steel:new THREE.MeshStandardMaterial({color:'#777d7f',metalness:.5,roughness:.55}),
 wood:new THREE.MeshStandardMaterial({color:'#694c36',roughness:1}),
 ember:new THREE.MeshStandardMaterial({color:'#ff9a31',emissive:'#ff7c16',emissiveIntensity:2.1}),
 fire:new THREE.MeshStandardMaterial({color:'#ddac5e',emissive:'#ff9e42',emissiveIntensity:1.6}),
 shadow:new THREE.MeshStandardMaterial({color:'#272a2e',roughness:1})
};
function furnishing(layout){
 const group=new THREE.Group();group.name='salons-et-galeries';
 const lights=[];
 const box=(name,w,h,d,x,y,z,mat=MAT.stone)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.name=name;group.add(m);return m;
 };
 const cylinder=(name,rb,rt,h,x,y,z,mat=MAT.stone,sides=9)=>{
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,sides),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.name=name;group.add(m);return m;
 };
 const torch=(x,z,h=4.3,illuminate=true)=>{
  const floor=layout.floorAt(x,z);
  cylinder('braseiro-de-ferro',.43,.52,.72,x,floor+.5,z,MAT.steel);
  cylinder('chama',.35,.1,.55,x,floor+1.05,z,MAT.ember,7);
  if(!illuminate)return;
  const light=new THREE.PointLight('#fcb96a',24,65,2.0);light.position.set(x,floor+h,z);light.castShadow=false;group.add(light);lights.push(light);
 };
 // Salão central colunado. As colunas tambem entram na colisao do jogador.
 for(const [k,o] of layout.obstacles.entries()){
  const floor=layout.floorAt(o.u,o.v);
  const h=k<8?13.4:9.6;
  cylinder('coluna-ana',k<8?2.15:1.55,k<8?1.9:1.45,h,o.u,floor+h/2,o.v,MAT.stone,10);
  cylinder('capitel-escavado',k<8?2.7:2,k<8?2.7:2,.68,o.u,floor+h-.16,o.v,MAT.gold,10);
  cylinder('base-do-pilar',k<8?2.65:1.95,k<8?2.65:1.95,.7,o.u,floor+.32,o.v,MAT.stoneDark,10);
 }
 cylinder('plataforma-do-grande-salao',7.6,7.6,.8,0,.1,0,MAT.stone,14);
 for(let j=0;j<4;j++){
  const a=j*PI/2+PI/4,x=Math.cos(a)*10.5,z=Math.sin(a)*10.5;
  torch(x,z);
 }
 const seat=(x,z,y)=>{
  box('trono-esculpido',4.6,2.2,2.7,x,y+1.15,z,MAT.gold);
  box('encosto-do-trono',4.6,6.8,.75,x,y+3.5,z-1.15,MAT.stone);
 };
 // Motivos diferentes para cidade-reino, centro mineiro e fortaleza.
 if(layout.spec.motif==='royal'||layout.spec.motif==='ancient'){
  seat(0,1.6,layout.floorAt(0,1.6)+.65);
  for(const s of[-1,1])box('estandarte-real',1.1,7.2,.13,s*7.9,layout.floorAt(s*7.9,0)+4.2,2,MAT.gold);
 }else{
  cylinder('monumento-das-corporacoes',2.4,1.7,8.4,0,4.7,0,MAT.stone,12);
 }
 // Quatro alas acessiveis por corredores de teto baixo e saloes finais.
 for(const wing of layout.wings){
  const {u,v,r,kind}=wing,floor=layout.floorAt(u,v);
  const toward=Math.atan2(v,u),side=[-Math.sin(toward),Math.cos(toward)];
  torch(u+side[0]*8,v+side[1]*8,6.2,true);
  torch(u-side[0]*8,v-side[1]*8,6.2,false);
  // Arco da galeria: duas colunas e travessa de pedra.
  const gx=Math.cos(toward)*46,gz=Math.sin(toward)*46,gy=layout.floorAt(gx,gz);
  for(const s of[-1,1]){
   const xx=gx+side[0]*s*8,zz=gz+side[1]*s*8;
   cylinder('pilar-da-galeria',1.35,1.25,9,xx,gy+4.5,zz,MAT.stone,9);
  }
  const beam=box('arco-da-galeria',19,2.1,2.2,gx,gy+9.5,gz,MAT.stone);
  beam.rotation.y=-toward;
  if(kind==='forge'){
   for(let j=-1;j<=1;j++){
    const x=u+side[0]*j*8,z=v+side[1]*j*8;
    box('base-da-forja',4.4,1.2,3.3,x,floor+.65,z,MAT.stoneDark);
    box('brasa-da-forja',3.1,.3,2.6,x,floor+1.32,z,MAT.ember);
    box('bigorna-ana',2.3,1.1,1.3,x+3.5,floor+.75,z-1.5,MAT.steel);
    cylinder('chamine',1.15,1.15,7,x-2.4,floor+5,z+2,MAT.stoneDark);
   }
  }else if(kind==='mines'){
   for(let j=0;j<7;j++){
    const x=u+(j%3-1)*5,z=v+((j/3)|0)*4-5;
    box('veio-de-minerio',1.3+j%2,1.7+j%3,1.5,x,floor+1,z,MAT.gold);
    box('suporte-dos-trilhos',4,.3,.45,x,floor+.18,z+2,MAT.wood);
   }
  }else if(kind==='vault'){
   for(let j=0;j<7;j++){
    const x=u+(j%3-1)*7,z=v+((j/3)|0)*6-5;
    box('cofre-de-pedra',4.6,2.5,3.5,x,floor+1.35,z,MAT.stone);
    box('tranca-de-ferro',1.4,.3,.35,x,floor+1.7,z+1.8,MAT.steel);
   }
  }else{
   const altar=box('altar-dos-ancestrais',9,2,4.5,u,floor+1.05,v,MAT.stone);
   for(let k=0;k<6;k++){
    const x=u+Math.cos(k*TAU/6)*12,z=v+Math.sin(k*TAU/6)*12;
    cylinder('estatua-ancestral',1.2,.95,6.6,x,floor+3.4,z,MAT.stoneDark,8);
    cylinder('coroa-de-pedra',1.4,1.45,1,x,floor+7.1,z,MAT.gold,8);
   }
  }
 }
 // Salas secundarias de familias, oficinas e armazens.
 for(const [bi,branch] of layout.branches.entries()){
  const{u,v}=branch,floor=layout.floorAt(u,v);
  torch(u,v,5.1,bi%2===0);
  for(let j=0;j<4;j++){
   const a=j*PI/2+PI/4,px=u+Math.cos(a)*8,pz=v+Math.sin(a)*8;
   if(branch.kind==='homes'){
    box('habitacao-escavada',4.1,2.9,3.8,px,floor+1.6,pz,MAT.stone);
    box('leito-escavado',2.2,.35,1.4,px+1.2,floor+.37,pz+1.5,MAT.wood);
   }else{
    box('deposito-escavado',4.2,3.4,2.3,px,floor+1.75,pz,MAT.stoneDark);
    box('armario-de-metal',1.1,1.4,.65,px,floor+2.1,pz+1.3,MAT.steel);
   }
  }
 }
 // Moldura monumental no acesso principal (na caverna, para retorno a superficie).
 const z=-22;
 for(const x of[-5.8,5.8])cylinder('batente-do-portal',1.2,1.2,9,x,4.6,z,MAT.stone);
 box('lintel-de-pedra',14,2.4,2.1,0,9.2,z,MAT.gold);
 box('sinal-da-saida',3,.35,.35,0,7.7,z+1.5,MAT.fire);
 return {group,lights};
}

/** Insere uma cidade subterranea em seu PROPRIO espaco navegavel do modo local. */
export function buildDwarvenInterior({cityId,blueprint,cx,cy,W,H,baseY=5}){
 if(blueprint?.classification?.dwarvenModel!=='subterranean')return null;
 const layout=makeUndergroundLayout(cityId,blueprint?.seed||0);if(!layout)return null;
 const group=new THREE.Group();group.name='interior-subterraneo-'+cityId;
 group.position.set(cx-W/2,baseY,cy-H/2);
 group.add(cavernMesh(layout));
 const rooms=furnishing(layout);group.add(rooms.group);
 group.visible=false;
 return {group,layout,baseY,cityName:layout.spec.title,
  spawn:layout.spawn,exit:layout.exit,
  accessible:layout.accessible,floorAt:layout.floorAt,roomAt:layout.roomAt};
}

/** Planta esquematica das passagens internas; usa o MESMO modelo da colisao 3D. */
export function drawUndergroundPlan(canvas,layout){
 if(!canvas||!layout)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const W=canvas.width=720,H=canvas.height=720,extent=layout.span+15;
 const scale=(W-86)/(extent*2),x=u=>W/2+u*scale,z=v=>H/2+v*scale;
 ctx.fillStyle='#242627';ctx.fillRect(0,0,W,H);
 // Solo acessivel, definido por igual funcao utilizada pela malha 3D.
 const tile=4;
 for(let py=18;py<H-18;py+=tile)for(let px=18;px<W-18;px+=tile){
  const u=(px+tile/2-W/2)/scale,v=(py+tile/2-H/2)/scale;
  if(!layout.canOccupy(u,v))continue;
  const h=layout.floorAt(u,v);
  ctx.fillStyle=h>1.25?'#9a8970':h<-.7?'#737b80':'#898276';
  ctx.fillRect(px,py,tile+.5,tile+.5);
 }
 // Muralhas do vazio: linhas da borda do piso jogavel.
 ctx.strokeStyle='#383b3a';ctx.lineWidth=3;
 for(const room of [{u:0,v:0,r:layout.radius},...layout.wings,...layout.branches]){
  ctx.beginPath();ctx.arc(x(room.u),z(room.v),room.r*scale,0,TAU);ctx.stroke();
 }
 // Pilares colocados exatamente nos mesmos pontos da cidade navegavel.
 for(const o of layout.obstacles){
  ctx.beginPath();ctx.arc(x(o.u),z(o.v),Math.max(2,o.r*scale),0,TAU);
  ctx.fillStyle='#474846';ctx.fill();ctx.lineWidth=1.1;ctx.strokeStyle='#ddd0b3';ctx.stroke();
 }
 ctx.fillStyle='#e9dcc7';ctx.textAlign='center';ctx.font='bold 19px system-ui';
 ctx.fillText('CIDADE SUBTERRÂNEA · '+layout.spec.title.toUpperCase(),W/2,31);
 ctx.font='12px system-ui';ctx.fillStyle='#e0d1b0';
 ctx.fillText('Passagens em pedra · os salões são acessíveis a pé',W/2,51);
 const bubble=(u,v,label,highlight=false)=>{
  const w=ctx.measureText(label).width+22;
  ctx.fillStyle=highlight?'#b18b53':'#343b3b';ctx.strokeStyle='#baa885';ctx.lineWidth=1;
  ctx.fillRect(x(u)-w/2,z(v)-9,w,19);ctx.strokeRect(x(u)-w/2,z(v)-9,w,19);
  ctx.fillStyle=highlight?'#142020':'#f5e8c9';ctx.fillText(label,x(u),z(v)+4);
 };
 ctx.font='bold 11px system-ui';
 bubble(0,4,layout.spec.hub,true);
 for(const w of layout.wings){
  const dx=w.u/Math.hypot(w.u,w.v),dy=w.v/Math.hypot(w.u,w.v);
  bubble(w.u+dx*1,w.v+dy*2,w.name);
 }
 ctx.font='9px system-ui';
 for(const b of layout.branches)bubble(b.u,b.v,b.kind==='homes'?'Moradias':'Oficinas');
 const exit=layout.exit;ctx.fillStyle='#c3e6c2';ctx.font='bold 12px system-ui';
 ctx.fillText('⇤ Saída',x(exit.u),z(exit.v)-9);
 ctx.strokeStyle='#edd5a0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x(exit.u),z(exit.v),5,0,TAU);ctx.stroke();
 ctx.fillStyle='#cbd4cd';ctx.textAlign='left';ctx.font='12px system-ui';ctx.fillText('N',W-33,25);
 ctx.fillStyle='#b1afa6';ctx.font='11px system-ui';ctx.fillText('WASD para explorar • Shift para correr • E para sair',24,H-20);
 return {rooms:layout.wings.length+layout.branches.length+1,connected:true};
}
