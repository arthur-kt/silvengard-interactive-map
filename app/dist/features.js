import * as THREE from 'three';
import {riverMaterial,treeMaterial,treeGeometries} from './visuals.js?v=35';
// Genuine 3D water ribbons with banks, projected onto the same terrain as the towns.
export function watercourses({D,world,point}){
 const group=new THREE.Group(),paths=[];
 
 const waterMaterial=riverMaterial();
 for(const r of D.rivers){
  if(r.points.length<2)continue;
  const curve=new THREE.CatmullRomCurve3(r.points.map(p=>new THREE.Vector3(p[0],0,p[1])),false,'centripetal');
  const length=curve.getLength(),steps=Math.max(6,Math.ceil(length/2.2)),pts=curve.getPoints(steps);paths.push({points:pts.map(p=>[p.x,p.z]),width:r.width||1,name:r.name});
  function ribbon(extra,offset,material){const positions=[],indices=[],colors=[],riverUV=[];let wetRun=0,along=0;
   for(let i=0;i<pts.length;i++){const wetCenter=point(pts[i].x,pts[i].z).y<0;wetRun=wetCenter?wetRun+1:0;if(i)along+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z);const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,w=((r.width||1)*(r.major?.8:.45)+(r.width||1)*.2*i/steps+extra)/2;
    for(const sign of [-1,-.65,0,.65,1]){const x=pts[i].x-sign*dz/l*w,y=pts[i].z+sign*dx/l*w;const p=point(x,y,offset);const wet=p.y<offset;if(wet)p.y=-1.36;positions.push(p.x,p.y,p.z);riverUV.push(sign,along);const color=new THREE.Color('#3d7275');let alpha=Math.abs(sign)===1?0:Math.abs(sign)>.6?.85:1;if(wetCenter){color.lerp(new THREE.Color('#244a59'),Math.min(1,wetRun/4));alpha*=extra?0:Math.max(0,1-wetRun/5)}colors.push(color.r,color.g,color.b,alpha)}
    if(i&&wetRun<=4){const j=i*5;for(let k=0;k<4;k++)indices.push(j-5+k,j-4+k,j+k,j-4+k,j+1+k,j+k)}}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));geo.setAttribute('riverUV',new THREE.Float32BufferAttribute(riverUV,2));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);mesh.renderOrder=extra?1:2;group.add(mesh);
  }
  ribbon(0,.12,waterMaterial);
 }
 world.add(group);return {group,paths};
}
function distanceSegment(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)}
export function nature({D,world,point,rand,paths}){
 const group=new THREE.Group();world.add(group);
 const leaves={conifer:[],broadleaf:[],gold:[],tropical:[],acacia:[],dead:[]};
 const riverSegments=paths.flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,w:r.width/2+2})));const buckets=new Map();
 for(const s of riverSegments){const x=Math.floor((s.a[0]+s.b[0])/2/24),y=Math.floor((s.a[1]+s.b[1])/2/24),key=x+','+y;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(s)}
 function wet(x,y){const ix=Math.floor(x/24),iy=Math.floor(y/24);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const s of buckets.get((ix+a)+','+(iy+b))||[])if(distanceSegment(x,y,s.a,s.b)<s.w)return true;return false}
 const verts=D.vertices;for(const c of D.cells){let vegetationSeed=(c.i+0x9e3779b9)>>>0;vegetationSeed=Math.imul(vegetationSeed^(vegetationSeed>>>16),0x21f0aaad);vegetationSeed=Math.imul(vegetationSeed^(vegetationSeed>>>15),0x735a2d97);vegetationSeed=(vegetationSeed^(vegetationSeed>>>15))>>>0;const cellRandom=()=>{vegetationSeed=(Math.imul(vegetationSeed,1664525)+1013904223)>>>0;return vegetationSeed/4294967296;};const custom=c.vegetation&&c.vegetation!=='auto';if(c.h<20||c.vegetation==='none'||(!custom&&(c.h>72||c.biome===14)))continue;
  const biome=c.biome,thinning=(!custom&&c.h>38?Math.max(.08,1-(c.h-38)/30):1)*(c.woodland??1),target=thinning*(D.grid?c.area*(custom?(c.vegetation==='dead'?5:10):({3:1,5:9,6:10,7:11,8:10,9:11,12:6,13:5,16:8})[biome]||0)/360:(({3:1,5:6,6:8,7:9,8:8,9:9,12:4,13:7,16:6})[biome]||0)),n=Math.floor(target)+(cellRandom()<target%1?1:0);
  for(let j=0;j<n;j++){const a=verts[c.v[Math.floor(cellRandom()*c.v.length)]].p,t=.2+cellRandom()*.68,x=c.p[0]+(a[0]-c.p[0])*t,y=c.p[1]+(a[1]-c.p[1])*t;
   if((D.farmland||[]).some(f=>Math.hypot(x-f.point[0],y-f.point[1])<f.radius)||wet(x,y)||D.cities.some(b=>b.visible&&!b.excluded&&Math.hypot(b.x-x,b.y-y)<(b.capital?14:b.citadel?11:8)))continue;
   const kind=custom?c.vegetation:biome===13?'dead':[6,8,9].includes(biome)?'conifer':biome===3?'acacia':biome===7?'tropical':[5,16].includes(biome)?'gold':biome===8||biome===12?'broadleaf':(cellRandom()<.04?'gold':'broadleaf');
   leaves[kind].push({x,y,s:1.5+cellRandom()*1.5,snow:c.snow||0,autumn:biome===16,rot:cellRandom()*Math.PI*2,shade:.85+cellRandom()*.3});
  }
 }
 const {trunk:trunkGeometry,conifer,round,tropical,acacia}=treeGeometries();
 const obj=new THREE.Object3D(),trunkMat=treeMaterial({color:'#79664e'});
 for(const [kind,items] of Object.entries(leaves)){
  if(!items.length)continue;const trunk=new THREE.InstancedMesh(trunkGeometry,trunkMat,items.length);group.add(trunk);
  const geo=kind==='conifer'?conifer:kind==='tropical'?tropical:kind==='acacia'?acacia:round;
  let crowns;if(kind!=='dead'){crowns=new THREE.InstancedMesh(geo,treeMaterial(),items.length);group.add(crowns)}
  const deadBranches=[];
  items.forEach((t,i)=>{obj.position.copy(point(t.x,t.y,.1));obj.scale.set(t.s*.7,t.s*.68,t.s*.7);obj.rotation.y=t.rot;obj.updateMatrix();trunk.setMatrixAt(i,obj.matrix);
   if(crowns){crowns.setMatrixAt(i,obj.matrix);const color={conifer:'#315e46',broadleaf:'#467e4a',gold:'#879640',tropical:'#277d5b',acacia:'#a2a351'}[kind];crowns.setColorAt(i,new THREE.Color(t.autumn?'#bd8848':color).lerp(new THREE.Color('#d8e3df'),t.snow*.65).offsetHSL((rand()-.5)*.035,(rand()-.5)*.08,0).multiplyScalar(t.shade??(.85+rand()*.3)))}
   else{const p=obj.position,s=t.s;for(let k=0;k<3;k++){const angle=t.rot+k*2.1;deadBranches.push(p.x,p.y+(1.2+k*.45)*s*.68,p.z,p.x+Math.cos(angle)*s*.8,p.y+(2.3+k*.3)*s*.68,p.z+Math.sin(angle)*s*.8)}}
  });
  if(deadBranches.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(deadBranches,3));group.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#69665b'})))}
 }
 return group;
}
export function valarMist({D,world,point,rand}){
 const group=new THREE.Group();world.add(group);const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,3,64,64,64);gradient.addColorStop(0,'rgba(219,226,224,.75)');gradient.addColorStop(.45,'rgba(207,220,219,.32)');gradient.addColorStop(1,'rgba(200,214,214,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const texture=new THREE.CanvasTexture(canvas),baseMaterial=new THREE.SpriteMaterial({map:texture,color:'#d2dcd9',opacity:.46,transparent:true,depthWrite:false});
 const sprites=[];for(const c of D.cells){if(c.state!==17||c.h<20||(D.grid&&rand()>.20))continue;const sprite=new THREE.Sprite(baseMaterial);sprite.position.copy(point(...c.p,4+rand()*5));sprite.scale.set(32+rand()*22,10+rand()*9,1);sprite.userData.baseX=sprite.position.x;sprite.userData.phase=rand()*Math.PI*2;group.add(sprite);sprites.push(sprite)}
 return {group,tick(time){for(const sprite of sprites)sprite.position.x=sprite.userData.baseX+Math.sin(time*.00012+sprite.userData.phase)*2.3}};
}
export function places({D,world,point}){
 const group=new THREE.Group();world.add(group);const material=new THREE.MeshStandardMaterial({color:'#a3a28a',roughness:1});for(const l of D.landmarks||[]){if(!['ruínas','mansão','povoado'].includes(l.kind))continue;const g=new THREE.Group();g.position.copy(point(...l.point,.4));for(let i=0;i<4;i++){const block=new THREE.Mesh(new THREE.BoxGeometry(1.4,2+i*.5,1.6),material);block.position.set((i%2)*3,1+i*.25,Math.floor(i/2)*3);g.add(block)}group.add(g)}return group;
}

export function volcanicDetail({D,point}){const g=new THREE.Group();if(!D.volcano)return g;const p=point(...D.volcano.point,.2);const lava=new THREE.Mesh(new THREE.CircleGeometry(D.volcano.radius,28),new THREE.MeshStandardMaterial({color:'#b85728',emissive:'#6a1707',emissiveIntensity:.65,roughness:.9,side:THREE.DoubleSide}));lava.rotation.x=-Math.PI/2;lava.position.copy(p);g.add(lava);const ring=new THREE.Mesh(new THREE.RingGeometry(D.volcano.radius,D.volcano.radius+1.7,28),new THREE.MeshStandardMaterial({color:'#45352a',roughness:1,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.copy(p);ring.position.y-=.06;g.add(ring);return g}

// Stone enclosures distinguish forts from ordinary towns at every zoom level.
export function fortModel({stone,roof}){
 const g=new THREE.Group(),wallMat=stone;
 for(let side=0;side<4;side++){
  const wall=new THREE.Mesh(new THREE.BoxGeometry(10,2.8,.8),wallMat);wall.position.set(0,1.4,side%2?0:side===0?-5:5);if(side%2){wall.rotation.y=Math.PI/2;wall.position.x=side===1?-5:5}g.add(wall);
  for(let k=0;k<7;k++){const merlon=new THREE.Mesh(new THREE.BoxGeometry(.7,.75,.9),wallMat);merlon.position.set(-4.5+k*1.5,3.05,side===0?-5:5);if(side%2)merlon.position.set(side===1?-5:5,3.05,-4.5+k*1.5);g.add(merlon)}
 }
 for(const x of [-5,5])for(const z of [-5,5]){const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.5,5,8),wallMat);tower.position.set(x,2.5,z);g.add(tower);const rim=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.55,.6,8),wallMat);rim.position.set(x,5,z);g.add(rim)}
 const gate=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.4,.1),new THREE.MeshStandardMaterial({color:'#43392f',roughness:1}));gate.position.set(0,1.2,5.45);g.add(gate);return g;
}
export function landscapeDetails({D,world,point}){
 const g=new THREE.Group();world.add(g);const stone=new THREE.MeshStandardMaterial({color:'#989180',roughness:1});
 for(const wall of D.fortifications||[])for(let k=1;k<wall.points.length;k++){
  const a=wall.points[k-1],b=wall.points[k],len=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(len/2),angle=Math.atan2(b[0]-a[0],b[1]-a[1]);
  for(let i=0;i<steps;i++){const t=(i+.5)/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,p=point(x,y);if(p.y<0)continue;const broken=i%17===5||i%17===6,h=broken?.45:2.7+(i%3)*.22;const block=new THREE.Mesh(new THREE.BoxGeometry(.95,h,len/steps+.05),stone);block.position.copy(p);block.position.y+=h/2;block.rotation.y=angle;g.add(block);if(!broken&&i%3===0){const top=new THREE.Mesh(new THREE.BoxGeometry(1.1,.6,.8),stone);top.position.copy(block.position);top.position.y+=h/2;top.rotation.y=angle;g.add(top)}}
 }
 const wetMaterial=new THREE.MeshStandardMaterial({color:'#41645c',roughness:.65,transparent:true,opacity:.72,side:THREE.DoubleSide});
 const reedPositions=[];
 const marshRandom=n=>{const v=Math.sin(n*127.1+17.37)*43758.5453;return v-Math.floor(v)};
 for(const [i,origin] of (D.marshes||[]).entries()){
  const xy=[origin[0]+(marshRandom(i*3)-.5)*14,origin[1]+(marshRandom(i*3+1)-.5)*8];
  const p=point(...xy,.14);if(p.y<0)continue;const r=.8+(i%5)*.24;
  const pool=new THREE.Mesh(new THREE.CircleGeometry(r,9),wetMaterial);pool.rotation.x=-Math.PI/2;pool.position.copy(p);pool.scale.y=.45+marshRandom(i*3+2)*.5;pool.rotation.z=marshRandom(i+19)*Math.PI;g.add(pool);
  for(let k=0;k<5;k++){const angle=k*2.4+i,x=xy[0]+Math.cos(angle)*r*1.3,y=xy[1]+Math.sin(angle)*r*.8,a=point(x,y,.1);reedPositions.push(a.x,a.y,a.z,a.x+.1,a.y+.8+(k%3)*.3,a.z+.15)}
 }
 const reeds=new THREE.BufferGeometry();reeds.setAttribute('position',new THREE.Float32BufferAttribute(reedPositions,3));g.add(new THREE.LineSegments(reeds,new THREE.LineBasicMaterial({color:'#616e42'})));
 const fieldColors=['#b6a768','#c5b277','#aea17a','#929b68'];
 for(const f of D.farmland||[]){for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){
  if(Math.abs(row)+Math.abs(col)>3||row===0&&col===0)continue;
  const cx=f.point[0]+col*6,cy=f.point[1]+row*6,positions=[],idx=[];
  for(let v=0;v<4;v++)for(let u=0;u<4;u++){const p=point(cx-2.6+u*1.73,cy-2.5+v*1.67,.18);positions.push(p.x,p.y,p.z)}
  for(let v=0;v<3;v++)for(let u=0;u<3;u++){const i=v*4+u;idx.push(i,i+1,i+4,i+1,i+5,i+4)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(idx);geo.computeVertexNormals();g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:fieldColors[(row+col+8)%4],roughness:1,side:THREE.DoubleSide})));
  const furrows=[];for(let n=0;n<7;n++){const x=cx-2.3+n*.74;for(let v=0;v<5;v++){const a=point(x,cy-2.3+v*.92,.22),b=point(x,cy-2.3+(v+1)*.92,.22);furrows.push(a.x,a.y,a.z,b.x,b.y,b.z)}}const lines=new THREE.BufferGeometry();lines.setAttribute('position',new THREE.Float32BufferAttribute(furrows,3));g.add(new THREE.LineSegments(lines,new THREE.LineBasicMaterial({color:'#e0c382',transparent:true,opacity:.65})));
 }}return g;
}


export function dwarvenModel(){
 const g=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:'#68717a',roughness:.95}),metal=new THREE.MeshStandardMaterial({color:'#bc9558',metalness:.5,roughness:.65});
 const foundation=new THREE.Mesh(new THREE.BoxGeometry(12,.8,12),stone);foundation.position.y=-.15;g.add(foundation);g.add(fortModel({stone,roof:metal}));
 for(const x of [-2.8,2.8]){const pier=new THREE.Mesh(new THREE.BoxGeometry(2,4.5,2.3),stone);pier.position.set(x,2.25,5.6);g.add(pier);const cap=new THREE.Mesh(new THREE.ConeGeometry(1.65,1.1,4),metal);cap.rotation.y=Math.PI/4;cap.position.set(x,5,5.6);g.add(cap);}
 const lintel=new THREE.Mesh(new THREE.BoxGeometry(7,1.4,1.8),stone);lintel.position.set(0,4,5.9);g.add(lintel);
 const door=new THREE.Mesh(new THREE.BoxGeometry(2.8,3.2,.35),new THREE.MeshStandardMaterial({color:'#293238',roughness:.9}));door.position.set(0,1.6,6.65);g.add(door);
 for(const sign of [-1,1]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.25,2.5,.25),metal);bar.position.set(sign*.15,3.2,6.95);bar.rotation.z=sign*.72;g.add(bar);const head=new THREE.Mesh(new THREE.BoxGeometry(1.3,.4,.4),metal);head.position.set(sign*.9,4.1,6.95);head.rotation.z=sign*.28;g.add(head);}
 const keep=new THREE.Mesh(new THREE.BoxGeometry(4,4.5,4),stone);keep.position.set(0,2.25,-.8);g.add(keep);const roof=new THREE.Mesh(new THREE.ConeGeometry(3.2,1.5,4),metal);roof.rotation.y=Math.PI/4;roof.position.set(0,5.2,-.8);g.add(roof);return g;
}
export function harborModel({fortified=false}){const g=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#927347',roughness:.9}),white=new THREE.MeshStandardMaterial({color:'#e8d8af',roughness:.9,side:THREE.DoubleSide});for(const x of [-3,0,3]){const deck=new THREE.Mesh(new THREE.BoxGeometry(1.1,.35,7),wood);deck.position.set(x,.1,0);g.add(deck);}const cross=new THREE.Mesh(new THREE.BoxGeometry(8,.4,1.2),wood);cross.position.set(0,.3,2.8);g.add(cross);const hull=new THREE.Mesh(new THREE.BoxGeometry(2.2,.9,5),wood);hull.position.set(5,.2,0);g.add(hull);const mast=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,5,5),wood);mast.position.set(5,2.6,0);g.add(mast);const sail=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.3),white);sail.position.set(6.1,3.1,0);g.add(sail);if(fortified){const guard=new THREE.Mesh(new THREE.BoxGeometry(2,3,2),new THREE.MeshStandardMaterial({color:'#858b82',roughness:1}));guard.position.set(-4,1.5,2);g.add(guard);}return g;}

export function mageTowerModel(){
 const g=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:'#b6b7bd',roughness:.82}),roof=new THREE.MeshStandardMaterial({color:'#564577',metalness:.22,roughness:.5}),trim=new THREE.MeshStandardMaterial({color:'#cbb477',metalness:.4,roughness:.5}),glow=new THREE.MeshStandardMaterial({color:'#9ce0ed',emissive:'#529dbe',emissiveIntensity:.5,roughness:.3});
 const add=(geometry,mat,y,x=0,z=0)=>{const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);g.add(m);return m};
 add(new THREE.CylinderGeometry(5.5,6,.65,12),stone,.15);
 add(new THREE.CylinderGeometry(2.55,3.4,9,12),stone,4.9);
 add(new THREE.CylinderGeometry(3.25,3.25,.5,12),trim,8.9);
 add(new THREE.CylinderGeometry(3,2.7,3.2,12),stone,10.7);
 add(new THREE.ConeGeometry(4,5.5,12),roof,14.9);
 add(new THREE.OctahedronGeometry(.85),glow,18.6);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;const w=add(new THREE.BoxGeometry(.65,1.35,.22),glow,10.7,Math.sin(a)*3,Math.cos(a)*3);w.rotation.y=a;}
 add(new THREE.CylinderGeometry(1.2,1.5,6,8),stone,3.4,3.5,1.4);
 add(new THREE.ConeGeometry(1.8,3.2,8),roof,7.9,3.5,1.4);
 const door=add(new THREE.BoxGeometry(1.5,2.5,.2),roof,1.75,0,3.25);
 return g;
}
