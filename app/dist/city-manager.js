import {applyCityEdit,cleanCityEdit,planCityMove} from './city-editor-core.js?v=43.1';
import {newCity,connectNewCity,planCityDeletion,repairCapitals} from './city-lifecycle.js?v=24';
import {cleanNetwork} from './network-core.js?v=40';
import {readCityEditor} from './city-editor-ui.js?v=43.1';
export function createCityManager({D,getEdits,save,toast,refresh,selectCity,network,painting,biomeNames,beginPick,endPick,clearSelection,journeys}){
 const activeOriginals=new Map(D.cities.map(b=>[b.i,structuredClone(b)])),originals=new Map(activeOriginals);for(const [id,archived]of Object.entries(D.defaultCityArchive||{})){originals.set(+id,structuredClone(archived.city));if(typeof getEdits().cities[id]?.deleted!=='boolean')getEdits().cities[id]=structuredClone(archived.edit);}let moving=null,lastMove=null,creating=null;const baseCapitals=new Map(D.states.map(s=>[s.i,s.capital]));
 const fields=['x','y','cell','state','harbor','population','demographics','culture','faith','settlementClass','port','majorPort','citadel','walls','temple','plaza','shanty','magicSchool','dwarvenFortress','dwarven','originalFeatures'];
 function applyStored(reset=false){
  if(reset){lastMove=null;D.cities=[...activeOriginals.values()].map(b=>structuredClone(b));for(const s of D.states)s.capital=baseCapitals.get(s.i);}
  for(const [id,raw]of Object.entries(getEdits().cities))if(raw.created&&!D.cities.some(b=>b.i===+id)){try{D.cities.push(newCity(D,+id,raw));}catch(e){toast('Cidade não carregada: '+e.message);}}
  for(const b of D.cities){
   if(reset&&originals.has(b.i)){const original=originals.get(b.i);for(const k of fields){if(Object.hasOwn(original,k))b[k]=structuredClone(original[k]);else delete b[k];}b.state=D.cells[b.cell].state;}
   const raw=getEdits().cities[b.i];if(!raw||!['inhabitants','culture','religion','settlementClass','features','position'].some(k=>Object.hasOwn(raw,k)))continue;
   try{Object.assign(b,applyCityEdit(structuredClone(b),raw,D));}catch(e){toast('Ficha de '+b.name+': '+e.message);}
  }
  D.cities=D.cities.filter(b=>!getEdits().cities[b.i]?.deleted);
  repairCapitals(D);
 }
 function storeForm(id){
  const b=D.cities.find(b=>b.i===id),$=s=>document.querySelector(s),old=getEdits().cities[id]||{};
  const edit=readCityEditor(D,b),trial=applyCityEdit(structuredClone(b),edit,D),biome=+$('#cityBiome').value;
  if(!Number.isInteger(biome)||!biomeNames[biome]||biome===0)throw Error('Bioma inválido.');
  getEdits().cities[id]={...old,...edit,name:$('#editName').value.trim()||b.name,notes:$('#editNotes').value,visible:true};
  Object.assign(b,trial);save();
  if(biome!==D.cells[b.cell].biome)painting().setCityBiome(b.cell,biome);
  refresh();selectCity(id);return true;
 }
 function cancel(){if(moving===null&&!creating)return;moving=null;const wasCreating=!!creating;creating=null;endPick();if(wasCreating)clearSelection();else selectCity(lastId);}
 let lastId=null;
 function start(id){
  try{storeForm(id);lastId=id;moving=id;beginPick();
   const panel=document.querySelector('#detail');panel.insertAdjacentHTML('beforeend','<div class="cityMoveNotice" role="status">Clique em um novo ponto em terra. Os caminhos ligados à cidade serão ajustados.<button id="cancelCityMove">Cancelar mudança</button></div>');
   document.querySelector('#cancelCityMove').onclick=cancel;panel.scrollTop=panel.scrollHeight;
  }catch(e){toast(e.message);}
 }
 function pick(xy){
  if(creating){try{
   const id=Math.max(10000,...D.cities.map(b=>b.i),...Object.keys(getEdits().cities).map(Number))+1;
   const raw={...creating,created:true,position:[...xy]},b=newCity(D,id,raw),link=creating.connect?connectNewCity(D,b):null;
   D.cities.push(b);getEdits().cities[id]={...raw,culture:b.culture,religion:b.faith.i,visible:true};repairCapitals(D);
   if(link)network().replaceRoutes([...D.routes,link]);save();creating=null;endPick();refresh();selectCity(id);
   toast(link?'Cidade criada e conectada por estrada':'Cidade criada; ajuste a ficha e as rotas como preferir');
  }catch(e){toast(e.message);}return;}
  if(moving===null)return;
  try{
   const result=planCityMove(D,moving,xy),id=moving;
   const rollback={id,city:structuredClone(D.cities.find(b=>b.i===id)),routes:structuredClone(D.routes),edit:structuredClone(getEdits().cities[id])};
   // Build every replacement before changing city or route data.
   network().replaceRoutes(result.routes);rollback.afterRoutes=JSON.stringify(D.routes);
   Object.assign(D.cities.find(b=>b.i===id),result.city);
   getEdits().cities[id]={...getEdits().cities[id],position:[...xy]};save();lastMove=rollback;moving=null;endPick();refresh();selectCity(id);
   toast('Localização salva · '+result.changed+' caminho(s) ajustado(s)');
  }catch(e){toast('Mudança não aplicada: '+e.message);}
 }
 function undo(id){
  if(lastMove?.id!==id)return;
  if(JSON.stringify(D.routes)!==lastMove.afterRoutes)return toast('As rotas foram editadas depois da mudança. Use Mudar localização para reposicionar novamente.');
  const b=D.cities.find(b=>b.i===id),old=lastMove.city;
  network().replaceRoutes(lastMove.routes);for(const k of ['x','y','cell'])b[k]=old[k];b.state=D.cells[b.cell].state;
  if((b.port||b.majorPort)&&old.harbor)b.harbor=structuredClone(old.harbor);else delete b.harbor;
  const edit=getEdits().cities[id];if(lastMove.edit?.position)edit.position=[...lastMove.edit.position];else delete edit.position;
  lastMove=null;save();refresh();selectCity(id);toast('Localização e caminhos anteriores restaurados');
 }
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function create(){
  cancel();const d=document.createElement('dialog');d.className='journeyConfirm';
  d.innerHTML=`<form><h2>Criar cidade</h2><label>Nome<input name="name" maxlength="100" required></label><label>População<input name="inhabitants" type="number" min="0" max="10000000000" step="1" value="0" required></label><label>Cultura<select name="culture"><option value="">Conforme a região</option>${D.cultures.map(c=>`<option value="${c.i}">${esc(c.name)}</option>`).join('')}</select></label><label>Religião<select name="religion">${D.religions.map(r=>`<option value="${r.i}">${esc(r.name)}</option>`).join('')}</select></label><label class="checkRow"><input name="connect" type="checkbox" checked>Conectar por estrada, se houver acesso por terra</label><p class="source">Depois escolha um ponto no mapa. A ficha completa será aberta para edição.</p><div class="editorActions"><button type="button" data-cancel>Cancelar</button><button>Escolher local no mapa</button></div></form>`;
  d.querySelector('[data-cancel]').onclick=()=>d.close();d.onclose=()=>d.remove();
  d.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);creating={name:String(f.get('name')).trim(),inhabitants:Number(f.get('inhabitants')),religion:Number(f.get('religion')),connect:!!f.get('connect')};if(f.get('culture')!=='')creating.culture=Number(f.get('culture'));d.close();beginPick();document.querySelector('#status').textContent='Criar cidade: clique em terra · Esc cancela';const panel=document.querySelector('#detail');panel.hidden=false;panel.innerHTML='<div class="cityMoveNotice" role="status">Escolha a localização da nova cidade no mapa.<button id="cancelCreateCity">Cancelar criação</button></div>';document.querySelector('#cancelCreateCity').onclick=cancel;};document.body.append(d);d.showModal();
 }
 function remove(id){
  const b=D.cities.find(b=>b.i===id);if(!b)return;cancel();const plan=planCityDeletion(D,id),d=document.createElement('dialog');d.className='journeyConfirm';
  d.innerHTML=`<form method="dialog"><h2>Excluir ${esc(b.name)}?</h2><p>${plan.removed} ligação(ões) sem destino será(ão) removida(s); ${plan.adjusted} rota(s) será(ão) ajustada(s). Os caminhos que continuam servindo outras cidades serão mantidos.</p>${b.capital?'<p>Se houver outra cidade no estado, a mais populosa assumirá como capital.</p>':''}<p>Você poderá restaurar a cidade em “Restaurar excluídas”. O histórico das jornadas será preservado.</p><div class="editorActions"><button value="cancel">Cancelar</button><button value="delete">Excluir cidade</button></div></form>`;
  d.onclose=()=>{if(d.returnValue==='delete'){
   const changed=D.routes.filter(r=>plan.routes.find(n=>n.id===r.id)!==r);
   const old=getEdits().cities[id]||{};getEdits().cities[id]={...old,name:old.name||b.name,position:[b.x,b.y],inhabitants:b.demographics.population,culture:b.culture,religion:b.faith?.i??0,settlementClass:b.settlementClass||'Cidade',features:Object.fromEntries(['port','majorPort','citadel','walls','temple','plaza','shanty','magicSchool','dwarvenFortress'].map(k=>[k,!!b[k]])),deleted:true,restoreRoutes:changed};
   D.cities=plan.cities;network().replaceRoutes(plan.routes);repairCapitals(D);journeys()?.forgetCity(b);lastMove=null;save();refresh();clearSelection();toast('Cidade excluída; disponível em Restaurar excluídas');
  }d.remove();};document.body.append(d);d.showModal();
 }
 function restore(id){
  const raw=getEdits().cities[id];if(!raw?.deleted)return;
  try{const b=raw.created?newCity(D,+id,raw):applyCityEdit(structuredClone(originals.get(+id)),raw,D);if(!b)throw Error('Cidade indisponível.');D.cities.push(b);raw.deleted=false;
   const archive=new Map((raw.restoreRoutes||[]).map(r=>[r.id,r])),routes=D.routes.map(r=>archive.get(r.id)||r);for(const r of archive.values())if(!routes.some(n=>n.id===r.id))routes.push(r);
   const known=new Set(D.cities.map(c=>c.i));network().replaceRoutes(routes.filter(r=>![r.fromCity,r.toCity,...(r.stops||[])].some(i=>i!=null&&!known.has(i))));delete raw.restoreRoutes;
   if(originals.get(+id)?.capital){const state=D.states.find(s=>s.i===b.state);if(state)state.capital=+id;}
   repairCapitals(D);save();refresh();selectCity(+id);toast('Cidade e ligações restauradas');
  }catch(e){toast('Não foi possível restaurar: '+e.message);}
 }
 function showDeleted(){
  const list=Object.entries(getEdits().cities).filter(([,v])=>v.deleted),d=document.createElement('dialog');d.className='journeyConfirm';
  d.innerHTML='<h2>Cidades excluídas</h2>'+list.map(([id,v])=>`<button class="townLink" data-restore="${id}">Restaurar ${esc(v.name||originals.get(+id)?.name||id)}</button>`).join('')+(list.length?'':'<p>Nenhuma cidade excluída.</p>')+'<button data-close>Fechar</button>';
  d.querySelectorAll('[data-restore]').forEach(el=>el.onclick=()=>{const id=+el.dataset.restore;d.close();restore(id);});d.querySelector('[data-close]').onclick=()=>d.close();d.onclose=()=>d.remove();document.body.append(d);d.showModal();
 }
 function validate(raw){const edit=cleanCityEdit(raw,D);if(raw.restoreRoutes){if(!Array.isArray(raw.restoreRoutes)||raw.restoreRoutes.length>500)throw Error('Arquivo de restauração inválido.');const ids=new Set([...originals.keys(),...D.cities.map(c=>c.i),...raw.restoreRoutes.flatMap(r=>[r.fromCity,r.toCity,...(r.stops||[])]).filter(Number.isSafeInteger)]);edit.restoreRoutes=cleanNetwork({format:'silvengard-network-v1',baseVersion:D.networkDefaults.version,routes:raw.restoreRoutes,deleted:[]},{...D,cities:[...ids].map(i=>({i}))}).routes;}return edit;}
 function reconcileRoutes(){
  let routes=D.routes;for(const [id,raw]of Object.entries(getEdits().cities))if(raw.deleted){
   const ghost=originals.get(+id)|| (raw.created?newCity(D,+id,raw):null);if(ghost)routes=planCityDeletion({...D,cities:[...D.cities,ghost],routes},+id).routes;
  }
  if(JSON.stringify(routes)!==JSON.stringify(D.routes))network().replaceRoutes(routes);
 }
 return {create,remove,showDeleted,restore,reconcileRoutes,applyStored,storeForm,start,cancel,pick,undo,canUndo:id=>lastMove?.id===id,isPicking:()=>moving!==null||!!creating,validate};
}
