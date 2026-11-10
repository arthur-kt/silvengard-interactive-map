import {getListOrder,setListOrder,orderItems,orderHTML} from './list-order.js?v=27.1';
import * as THREE from 'three';
import {createProvinceMenu} from './province-menu.js?v=36';
import {cleanProvinceEdits} from './province-core.js?v=27.1';
import {validateMapEdits} from './editor-core.js?v=27.1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function createProvincePreview({D,world,point,showDetail,selectState,onSelect,title,...options}){
 const response=await fetch('./province-proposal.json?v=26',{cache:'no-store'});if(!response.ok)throw Error('Divisão de províncias indisponível.');
 const ring=new THREE.LineLoop(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#ffe4a0',depthTest:false}));ring.visible=false;ring.renderOrder=22;world.add(ring);
 function cursor(xy,radius){ring.visible=!!xy;if(xy){const vertices=[];for(let i=0;i<64;i++){const a=i*Math.PI/32;vertices.push(point(xy[0]+Math.cos(a)*radius,xy[1]+Math.sin(a)*radius,2));}ring.geometry.dispose();ring.geometry=new THREE.BufferGeometry().setFromPoints(vertices);}options.redraw();}
 const proposal=await response.json(),menu=createProvinceMenu({D,proposal,onSelect,title,...options,cursor,onChange:commit=>{if(commit)rebuild();options.onChange(commit);}}),data=menu.data,byId=new Map(data.provinces.map(p=>[p.i,p])),group=new THREE.Group();world.add(group);group.visible=false;
 const provinceAt=menu.model.provinceAt;
 const colors=new Map(data.provinces.map(p=>[p.i,new THREE.Color(p.color)]));
 function rebuild(){
 colors.clear();for(const p of data.provinces)colors.set(p.i,new THREE.Color(p.color));
 for(const old of [...group.children]){old.geometry.dispose();old.material.dispose();group.remove(old);}
 const positions=[];
 for(const c of D.cells){if(c.h<20)continue;const p=provinceAt(c.i);if(!p)continue;for(let k=0;k<c.v.length;k++){
  const a=c.v[k],b=c.v[(k+1)%c.v.length],adj=D.vertices[a].c.find(i=>i!==c.i&&D.vertices[b].c.includes(i)),other=D.cells[adj];
  if(other?.h>=20&&other.state===c.state&&provinceAt(adj)?.i!==p.i&&c.i<adj){const pa=point(...D.vertices[a].p,1.4),pb=point(...D.vertices[b].p,1.4);positions.push(pa.x,pa.y,pa.z,pb.x,pb.y,pb.z);}
 }}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const edges=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#203c3c',transparent:true,opacity:.8,depthTest:false}));edges.renderOrder=9;group.add(edges);
 }rebuild();
 function open(id){
  const p=provinceAt(id);if(!p)return false;onSelect(p);
  const cities=orderItems(D.cities.filter(b=>provinceAt(b.cell)?.i===p.i),getListOrder(),title),seat=D.cities.find(b=>b.i===p.seat);
  showDetail(`<div class="badge">PROVÍNCIA</div><h2>${esc(p.name)}</h2><div class="fact"><span>Estado</span><b>${esc(D.states.find(s=>s.i===p.state)?.name.trim())}</b></div><div class="fact"><span>Sede</span><b>${esc(seat&&provinceAt(seat.cell)?.i===p.i?title(seat):'Não definida')}</b></div><h3>Cidades e localidades</h3>${orderHTML("provinceDetailOrder","Ordenar cidades")}${cities.map(b=>'<div class="fact"><span>'+esc(title(b))+'</span></div>').join('')||'<p class="muted">Sem sede urbana nesta área.</p>'}<button id="provinceGoState">Ver estado ↗</button><p class="source">No modo Províncias, clique uma vez para abrir o estado; clique novamente no terreno desse estado para abrir uma província.</p>`);
  options.onHistoryCard?.(document.querySelector('#detail'),'province',p.i);const econ=document.createElement('button');econ.textContent='Economia da província';econ.onclick=()=>options.onEconomy?.(p.i);document.querySelector('#provinceGoState').before(econ);const total=cities.reduce((sum,b)=>sum+(b.demographics?.population||0),0),button=document.createElement('button');button.textContent='Editar província e limites';button.onclick=()=>menu.open(p.i);document.querySelector('#provinceGoState').before(button);const fact=document.createElement('p');fact.className='provinceNotice';fact.textContent=total.toLocaleString('pt-BR')+' habitantes nas localidades · '+cities.length+' localidades';document.querySelector('#provinceGoState').before(fact);
  document.querySelector('#provinceDetailOrder').onchange=e=>{setListOrder(e.target.value);open(id);};document.querySelector('#provinceGoState').onclick=()=>selectState(p.state);return true;
 }
 function validate(raw,mapEdits){const patches=new Map(mapEdits?validateMapEdits(mapEdits,D).cells.map(c=>[c.i,c]):[]),target=patches.size?{...D,cells:D.cells.map(c=>patches.has(c.i)?{...c,...patches.get(c.i)}:c)}:D;return cleanProvinceEdits(raw,target,proposal);}
 return {data,group,provinceAt,open,openMenu:menu.open,close:menu.close,refresh:menu.refresh,exportData:menu.exportData,importData:menu.importData,validate,color:id=>colors.get(provinceAt(id)?.i)||new THREE.Color('#7e9290')};
}
