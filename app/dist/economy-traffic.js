import * as THREE from 'three';
// Decorative couriers follow the routes carrying estimated goods, not a second simulation.
export function createEconomyTraffic({D,world,point}){
 const group=new THREE.Group();world.add(group);let couriers=[],enabled=true,signature='';
 const wood=new THREE.MeshStandardMaterial({color:'#8b5934',roughness:.9}),cloth=new THREE.MeshStandardMaterial({color:'#e9d6aa',side:THREE.DoubleSide}),dark=new THREE.MeshStandardMaterial({color:'#292a29'});
 function mesh(g,m,parent,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 function update(flows){const sig=[...flows].map(([id,f])=>id+':'+Math.round(f.coins)).join('|');if(sig===signature)return;signature=sig;for(const o of group.children){o.traverse(n=>n.geometry?.dispose());}group.clear();couriers=[];
  for(const f of [...flows.values()].sort((a,b)=>b.coins-a.coins).slice(0,64)){const r=D.routes.find(r=>r.id===f.id);if(!r||r.points.length<2)continue;const sea=r.kind==='sea',o=new THREE.Group();
   if(sea){const hull=mesh(new THREE.ConeGeometry(2.3,7,4),wood,o,0,1,0);hull.rotation.x=Math.PI/2;mesh(new THREE.CylinderGeometry(.22,.22,7,5),wood,o,0,5,0);mesh(new THREE.PlaneGeometry(4,4),cloth,o,1.5,5,0);}
   else {mesh(new THREE.BoxGeometry(4,2.3,5),wood,o,0,2,0);mesh(new THREE.BoxGeometry(4.4,1,4),cloth,o,0,3.5,0);for(const x of [-2.2,2.2])for(const z of [-1.7,1.7]){const wheel=mesh(new THREE.CylinderGeometry(1,1,.5,8),dark,o,x,1,z);wheel.rotation.z=Math.PI/2;}}
   const cumulative=[0];for(let i=1;i<r.points.length;i++)cumulative.push(cumulative.at(-1)+Math.hypot(r.points[i][0]-r.points[i-1][0],r.points[i][1]-r.points[i-1][1]));if(!cumulative.at(-1))continue;group.add(o);couriers.push({o,r,cumulative,total:cumulative.at(-1),phase:couriers.length*.137,sea});
  }
 }
 function tick(now){if(!enabled)return false;for(const c of couriers){const d=((now*.000012+c.phase)%1)*c.total;let i=1;while(c.cumulative[i]<d)i++;const a=c.r.points[i-1],b=c.r.points[i],t=(d-c.cumulative[i-1])/(c.cumulative[i]-c.cumulative[i-1]||1);c.o.position.copy(point(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,c.sea?2:3));c.o.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);}return couriers.length>0;}
 return {group,update,tick,setEnabled(v){enabled=v;group.visible=v;}};
}
