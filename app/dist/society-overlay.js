import * as THREE from 'three';
import {societyField,societyCategory,societyColor} from './society-core.js?v=27.1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createSocietyOverlay({D,source,title,selectCity,showDetail,onHistoryCard}){
 let field=societyField(D,source),mode='natural';const colors=new Map(),legend=document.createElement('aside');legend.id='societyLegend';legend.hidden=true;document.body.append(legend);
 const color=(kind,id)=>{const key=kind+':'+field[kind][id];if(!colors.has(key))colors.set(key,new THREE.Color(societyColor(kind,field[kind][id])));return colors.get(key);};
 function render(){
  legend.hidden=!['culture','religion'].includes(mode);if(legend.hidden)return;
  const ids=new Set(D.cells.filter(c=>c.h>=20).map(c=>field[mode][c.i])),entries=[...ids].map(id=>societyCategory(D,mode,id)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  legend.innerHTML=`<b>${mode==='culture'?'Culturas':'Religiões'}</b><p>${D.cells.some(c=>c[mode+'Override']>=0)?'Cidades e ajustes manuais':'Entornos das cidades · atualização automática'}</p><div class="societyKeys">${entries.map(e=>`<button type="button" data-society-entry="${e.i}"><i style="background:${societyColor(mode,e.i)}"></i><span>${esc(e.name)}${mode==='religion'&&e.deity?'<small>'+esc(e.deity)+'</small>':''}</span></button>`).join('')}</div><p>Clique no terreno para consultar a região ou em uma cidade para abrir sua ficha.</p>`;
  for(const button of legend.querySelectorAll('[data-society-entry]'))button.onclick=()=>{const cell=D.cells.find(c=>c.h>=20&&field[mode][c.i]===+button.dataset.societyEntry);if(cell)open(cell.i,mode);};
 }
 function describe(id,kind){const e=societyCategory(D,kind,field[kind][id]),b=field.cities[field.owner[id]];return e.name+(b?' · '+title(b):'');}
 function open(id,kind){
  const c=D.cells[id];if(c?.h<20)return;const e=societyCategory(D,kind,field[kind][id]),b=field.cities[field.owner[id]];
  showDetail(`<div class="badge">${kind==='culture'?'CULTURA':'RELIGIÃO'}</div><h2>${esc(e.name)}</h2>${kind==='religion'&&e.deity?`<div class="fact"><span>Divindade</span><b>${esc(e.deity)}</b></div>`:''}${b?`<h3>Entorno de ${esc(title(b))}</h3><div class="fact"><span>Cultura</span><b>${esc(societyCategory(D,'culture',b.culture).name)}</b></div><div class="fact"><span>Religião</span><b>${esc(societyCategory(D,'religion',b.faith?.i??-1).name)}</b></div><button id="societyCity">Ver cidade ↗</button>`:'<p class="muted">Região sem cidade habitada próxima.</p>'}`);
  onHistoryCard?.(document.querySelector('#detail'),kind,e.i,{stateId:b?.state});if(b)document.querySelector('#societyCity').onclick=()=>selectCity(b.i,true);
 }
 return {color,describe,open,setMode(value){mode=value;render();},refreshManual(ids){for(const id of ids){const c=D.cells[id];if(c.h<20)continue;field.culture[id]=c.cultureOverride>=0?c.cultureOverride:field.automaticCulture[id];field.religion[id]=c.religionOverride>=0?c.religionOverride:field.automaticReligion[id];}colors.clear();render();},refresh(){field=societyField(D,source);colors.clear();render();}};
}
