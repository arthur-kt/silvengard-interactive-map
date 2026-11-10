import {escapeHTML as esc,normalize,renderMarkdown,descendants,eraEvents} from './history-core.js?v=35';
import {createHistoryFacts} from './history-facts.js?v=36';
const labels={world:'Mundo',timeline:'Cronologia',state:'Estados',province:'Províncias',city:'Cidades',culture:'Culturas',religion:'Religiões',institution:'Instituições'};
const eras=['Era Primordial','Era dos Dragões','Era dos Impérios','Era Contemporânea'];
export function createHistoryReader({D,selectCity,selectState,focus,provinces,provinceAt,provinceOpen,cityTitle,toast}){
 let data=null,sections=new Map(),records=new Map(),tab='world',current='world',era=4,request=0,previousFocus=null,searchIndex=new Map(),compact=false;
 let archive=null,pending=null,loadedAt=0;
 async function getArchive(refresh=false){
  if(pending)return pending;if(archive&&!refresh&&Date.now()-loadedAt<30000)return archive;
  pending=(async()=>{let response=await fetch('./api/history',{cache:'no-store'});if(response.status===404)response=await fetch('./history-archive.json',{cache:'no-store'});if(!response.ok)throw Error('Não foi possível ler as histórias.');archive=await response.json();loadedAt=Date.now();return archive;})();
  try{return await pending;}finally{pending=null;}
 }
 const facts=createHistoryFacts({getData:()=>getArchive(),open:(kind,id)=>open(kind,id)});
 const dialog=document.createElement('dialog');dialog.id='historyReader';dialog.setAttribute('aria-label','Histórias de Silvengard');document.body.append(dialog);
 dialog.innerHTML=`<div class="loreHead"><div class="loreBrand"><span>✧</span><div><small>O ACERVO DE SILVENGARD</small><b>Memórias do mundo</b></div></div><div><button id="loreRefresh" title="Reler os arquivos de história">↻ Atualizar histórias</button><button id="loreClose" aria-label="Fechar histórias">✕</button></div></div><div class="loreShell"><nav class="loreNav" aria-label="Categorias de história"><div id="loreTabs"></div><label class="loreSearch">Buscar no acervo<input id="loreSearch" type="search" placeholder="Nome ou trecho da história…"></label><label id="loreStateLabel">Estado<select id="loreState"><option value="">Todos os estados</option></select></label><div id="loreList"></div><p id="loreStatus" role="status"></p></nav><main id="loreMain" tabindex="-1"></main></div>`;
 const $=s=>dialog.querySelector(s);$('#loreTabs').innerHTML=Object.entries(labels).map(([key,label])=>`<button data-lore-tab="${key}">${label}</button>`).join('');
 $('#loreState').insertAdjacentHTML('beforeend',D.states.filter(s=>s.i).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(s=>`<option value="${s.i}">${esc(s.name.trim())}</option>`).join(''));
 const libraryButton=document.createElement('button');libraryButton.id='loreLibrary';libraryButton.textContent='Explorar histórias';libraryButton.hidden=true;$('#loreRefresh').before(libraryButton);libraryButton.onclick=()=>{$('.loreBrand b').textContent='Memórias do mundo';compact=false;dialog.classList.remove('lorePopup');libraryButton.hidden=true;renderList();};
 function close(){dialog.close();previousFocus?.focus?.();}
 $('#loreClose').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('keydown',e=>{e.stopPropagation();});dialog.addEventListener('keyup',e=>e.stopPropagation());
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 async function load(){
  const token=++request;$('#loreStatus').textContent='Abrindo os arquivos…';$('#loreRefresh').disabled=true;
  try{
   const next=await getArchive(true);if(token!==request)return;data={...next,records:next.records.filter(r=>r.kind!=='appendix')};sections=new Map(data.sections.map(s=>[s.id,s]));records=new Map(data.records.map(r=>[r.id,r]));
   searchIndex=new Map(data.records.map(r=>[r.id,normalize(r.name+' '+(r.intro||'')+' '+(r.chapters||[]).map(id=>sections.get(id)?.displayMarkdown||'').join(' '))]));
   $('#loreStatus').textContent=`${data.records.filter(r=>r.kind==='state').length} estados · ${data.records.filter(r=>r.kind==='province').length} províncias · ${data.records.filter(r=>r.kind==='city').length} cidades`;
   renderList();if(tab==='timeline')timeline();else article(current);
  }catch(error){$('#loreStatus').textContent=error.message;if(!data)$('#loreMain').innerHTML=`<div class="loreEmpty"><h1>O acervo não abriu</h1><p>${esc(error.message)}</p><p>Confira os três documentos em historic_archives e tente atualizar novamente.</p></div>`;toast?.(error.message);}
  finally{if(token===request)$('#loreRefresh').disabled=false;}
 }
 function renderList(){
  for(const b of dialog.querySelectorAll('[data-lore-tab]')){b.classList.toggle('active',b.dataset.loreTab===tab);b.setAttribute('aria-pressed',b.dataset.loreTab===tab);}
  $('#loreStateLabel').hidden=!['state','province','city','institution'].includes(tab);const q=normalize($('#loreSearch').value),sid=+$('#loreState').value;
  const entries=data.records.filter(r=>r.kind===tab&&(!sid||$('#loreStateLabel').hidden||r.stateId===sid)&&(!q||searchIndex.get(r.id)?.includes(q))).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  $('#loreList').innerHTML=tab==='timeline'?'<p class="loreHint">Quatro eras, uma história. Escolha uma era e abra os acontecimentos.</p>':entries.map(r=>`<button class="loreIndex ${r.id===current?'active':''}" data-lore-record="${esc(r.id)}"><b>${esc(r.name)}</b>${r.stateId&&r.kind!=='state'?'<small>'+esc(stateName(r.stateId))+'</small>':''}</button>`).join('')||'<p class="loreHint">Nenhum capítulo encontrado nesta seleção.</p>';
  for(const b of dialog.querySelectorAll('[data-lore-record]'))b.onclick=()=>choose(b.dataset.loreRecord);
 }
 function stateName(id){return D.states.find(s=>s.i===id)?.name.trim()||'';}
 function choose(id){const r=records.get(id);if(!r)return;current=id;tab=r.kind;renderList();article(id);}
 function recordButton(id,label){const r=records.get(id);return r?`<button data-lore-link="${esc(id)}">${esc(label||r.name)} ↗</button>`:'';}
 function bindLinks(root){for(const b of root.querySelectorAll('[data-lore-link]'))b.onclick=()=>choose(b.dataset.loreLink);for(const b of root.querySelectorAll('[data-lore-map]'))b.onclick=()=>locate(records.get(b.dataset.loreMap));}
 function locate(r){
  if(!r?.target)return;const t=r.target;close();if(t.kind==='city')selectCity(t.id,true);else if(t.kind==='state')selectState(t.id,true);else{
   const p=provinces().find(p=>p.i===t.id),cell=D.cells.find(c=>c.h>=20&&provinceAt(c.i)?.i===t.id);if(!p||!cell)return;
   selectState(p.state);provinceOpen?.(cell.i);focus(...(p.labelPoint||cell.p),220);
  }
 }
 function sectionHTML(root,seen=new Set()){
  const s=sections.get(root);if(!s||seen.has(root)||s.displayHidden)return '';seen.add(root);
  const heading=Math.max(2,Math.min(4,s.level-1));
  let children=s.children;
  if(s.document==='places'&&s.title.startsWith('Estado:'))children=[...children].sort((a,b)=>{
   const rank=id=>{const t=sections.get(id)?.title||'';return t.startsWith('Identidade')?0:t.startsWith('Casa soberana')?1:t.startsWith('História integral')?2:t.startsWith('Tradições dinásticas')?3:t.startsWith('Instituições')?4:t.startsWith('Províncias')?5:6;};return rank(a)-rank(b);
  });
  const nested=children.map(id=>sectionHTML(id,seen)).join('');
  const content=`<div class="loreProse">${renderMarkdown(s.displayMarkdown||'')}</div>${nested}`;
  return s.displayTransparent?content:`<section class="loreSection" id="lore-section-${s.id}"><h${heading}>${esc(s.displayTitle||s.title)}</h${heading}>${content}</section>`;
 }
 function article(id){
  if(!data)return;const r=records.get(id);if(!r)return;current=r.id;$('.loreBrand b').textContent=compact?r.name:'Memórias do mundo';
  const chapters=(r.chapters||[]).map(id=>sections.get(id)).filter(Boolean),events=r.timeline||[];
  const entity=r.target?.kind==='city'?D.cities.find(b=>b.i===r.target.id):r.stateId?D.states.find(s=>s.i===r.stateId):null;
  const province=r.kind==='city'?provinceAt(D.cities.find(b=>b.i===r.target?.id)?.cell)?.i:null;
  const government=(r.government||'').trim().split(/\n\s*\n/)[0];
  $('#loreMain').innerHTML=`<div class="loreHero loreStoryHero">${entity?.emblem?`<img class="loreArms" src="${esc(entity.emblem)}" alt="Brasão de ${esc(r.name)}">`:''}<small>${esc(labels[r.kind]||'HISTÓRIA')} ${r.stateId&&r.kind!=='state'?' / '+esc(stateName(r.stateId)):''}</small><h1>${esc(r.name)}</h1><div class="loreActions">${r.target?`<button data-lore-map="${esc(r.id)}">⌖ Ver no mapa</button>`:''}${r.kind==='city'&&province?recordButton('province:'+province,'História da província'):''}${r.stateId&&r.kind!=='state'?recordButton('state:'+r.stateId,'História do estado'):''}${r.kind==='world'?'<button id="loreToTimeline">◷ Cronologia do mundo</button>':''}</div>${r.intro?'<div class="loreIdentity">'+renderMarkdown(r.intro)+'</div>':''}${government?'<section class="loreGovernment"><span>CASA GOVERNANTE · '+esc(data.present)+'</span>'+renderMarkdown(government)+'</section>':''}${r.deity?`<p class="loreDeity">Divindade · <strong>${esc(r.deity)}</strong></p>`:''}</div><div class="loreReading">${chapters.length>1?`<nav class="loreChapterNav" aria-label="Capítulos desta história"><div><small>EXPLORAR A HISTÓRIA</small>${events.length?'<button id="loreLocalJump">◷ Linha do tempo · '+events.length+' marcos</button>':''}</div><div class="loreChapterRail">${chapters.map((s,i)=>`<button data-lore-anchor="${s.id}"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(s.displayTitle)}</b></button>`).join('')}</div></nav>`:''}<div id="loreArticle">${chapters.map((s,i)=>`<section class="loreChapter" id="lore-section-${s.id}">${normalize(s.displayTitle)!==normalize(r.name)?`<div class="loreChapterHeading"><span>${String(i+1).padStart(2,'0')}</span><h2>${esc(s.displayTitle)}</h2></div>`:''}<div class="loreProse">${renderMarkdown(s.displayMarkdown)}</div></section>`).join('')}</div>${r.contexts?contextsHTML(r):''}${events.length?`<section id="loreLocalTimeline" class="loreLocalTimeline"><div class="loreChapterHeading"><span>◷</span><h2>Linha do tempo de ${esc(r.name)}</h2></div><div class="loreLocalRail" aria-label="Cronologia desta história">${events.map((e,i)=>`<button data-lore-local="${i}"><small>${esc(e.date)}</small><b>${esc(e.title)}</b></button>`).join('')}</div><article id="loreLocalDetail" aria-live="polite"></article></section>`:''}</div>`;
  $('#loreMain').scrollTop=0;bindLinks($('#loreMain'));
  for(const b of dialog.querySelectorAll('[data-lore-anchor]'))b.onclick=()=>$('#lore-section-'+b.dataset.loreAnchor)?.scrollIntoView({behavior:'smooth',block:'start'});
  if($('#loreToTimeline'))$('#loreToTimeline').onclick=()=>{compact=false;dialog.classList.remove('lorePopup');libraryButton.hidden=true;switchTab('timeline');};
  if($('#loreLocalJump'))$('#loreLocalJump').onclick=()=>$('#loreLocalTimeline').scrollIntoView({behavior:'smooth',block:'start'});
  const showLocal=index=>{const e=events[index];if(!e)return;const identical=normalize(e.title)===normalize(e.markdown.replace(/[*`]/g,''));const heading=identical?(e.markdown.match(/\*\*([^*]+)\*\*/)?.[1]||'Acontecimento'):e.title;for(const b of dialog.querySelectorAll('[data-lore-local]'))b.classList.toggle('active',+b.dataset.loreLocal===index);$('#loreLocalDetail').innerHTML=`<small>${esc(e.date)}</small><h3>${esc(heading)}</h3><div class="loreProse">${renderMarkdown(e.markdown)}</div><div class="loreRelated">${e.links.map(id=>recordButton(id)).join('')}</div>`;bindLinks($('#loreLocalDetail'));};
  for(const b of dialog.querySelectorAll('[data-lore-local]'))b.onclick=()=>showLocal(+b.dataset.loreLocal);if(events.length)showLocal(0);
  for(const b of dialog.querySelectorAll('[data-lore-context]'))b.onclick=()=>{const content=$('#loreContextBody');content.innerHTML=sectionHTML(b.dataset.loreContext);content.scrollIntoView({behavior:'smooth'});};
 }
 function contextsHTML(r){
  return `<section class="loreContexts"><h2>Contextos regionais</h2><p>Os capítulos abaixo descrevem a sociedade de cada região e suas diferentes comunidades.</p>${r.contexts.length?'<div class="loreRelated">'+r.contexts.map(c=>`<button data-lore-context="${c.section}">${esc(c.name)} ↗</button>`).join('')+'</div><div id="loreContextBody">'+(!r.sections.length?sectionHTML(r.contexts[0].section):'')+'</div>':''}</section>`;
 }
 function timeline(selected){
  if(!data)return;const events=eraEvents(data.events,era);selected=events.some(e=>e.id===selected)?selected:events[0]?.id;
  $('#loreMain').innerHTML=`<div class="loreHero loreTimelineHero"><small>CRONOLOGIA CONTINENTAL · PRESENTE ${esc(data.present)}</small><h1>As quatro eras</h1><p>O calendário AQD segue uma contagem contínua. Tradições míticas e datas aproximadas conservam sua incerteza.</p></div><div class="loreEras">${eras.map((name,i)=>`<button data-lore-era="${i+1}" class="${era===i+1?'active':''}"><span>${['I','II','III','IV'][i]}</span><b>${name}</b><small>${['Tempo mítico','c. 1.800 anos','1–1250 AQD','1251–1277 AQD'][i]}</small></button>`).join('')}</div><div class="loreTimeGrid"><div class="loreTimeline" aria-label="Acontecimentos da era">${events.map(e=>`<button data-lore-time="${e.id}" class="loreEvent ${e.id===selected?'active':''}" aria-pressed="${e.id===selected}"><span class="loreTimeDot"></span><small>${esc(e.date)}</small><b>${esc(e.title)}</b></button>`).join('')}</div><article id="loreEventDetail" aria-live="polite"></article></div>`;
  for(const b of dialog.querySelectorAll('[data-lore-era]'))b.onclick=()=>{era=+b.dataset.loreEra;timeline();};for(const b of dialog.querySelectorAll('[data-lore-time]'))b.onclick=()=>{eventDetail(b.dataset.loreTime);if(dialog.clientWidth<850)$('#loreEventDetail').scrollIntoView({behavior:'smooth',block:'start'});};eventDetail(selected);$('#loreMain').scrollTop=0;
 }
 function eventDetail(id){const e=data.events.find(e=>e.id===id);if(!e)return;
  for(const b of dialog.querySelectorAll('[data-lore-time]')){b.classList.toggle('active',b.dataset.loreTime===id);b.setAttribute('aria-pressed',b.dataset.loreTime===id);}
  $('#loreEventDetail').innerHTML=`<small>${esc(e.date)} · ${esc(eras[e.era-1])}</small><h2>${esc(e.title)}</h2><div class="loreProse">${renderMarkdown(e.markdown)}</div><div class="loreRelated">${e.links.map(id=>recordButton(id)).join('')}</div><button id="loreEventChapter">Ler o contexto desta era ↗</button>`;bindLinks($('#loreEventDetail'));
  $('#loreEventChapter').onclick=()=>{choose('world');const chapter=(records.get('world')?.chapters||[]).find(id=>normalize(sections.get(id)?.displayTitle||'').startsWith(['primeira era','segunda era','terceira era','quarta era'][e.era-1]));const target=$('#lore-section-'+chapter);if(target){for(let p=target;p&&p!==dialog;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;target.scrollIntoView({behavior:'smooth'});}};
 }
 function switchTab(kind){tab=kind;$('#loreSearch').value='';$('#loreState').value='';renderList();if(kind==='timeline')timeline();else{const first=data?.records.find(r=>r.kind===kind);if(first)article(first.id);}}
 for(const b of dialog.querySelectorAll('[data-lore-tab]'))b.onclick=()=>switchTab(b.dataset.loreTab);
 $('#loreSearch').oninput=renderList;$('#loreState').onchange=renderList;$('#loreRefresh').onclick=load;
 async function open(kind='world',id){previousFocus=document.activeElement;compact=false;dialog.classList.remove('lorePopup');libraryButton.hidden=true;current=id==null?kind:kind+':'+id;tab=kind;if(!dialog.open)dialog.showModal();$('#loreState').value='';$('#loreSearch').value='';if(data){renderList();if(tab==='timeline')timeline();else article(current);}await load();$('#loreClose').focus();}
 return {open,close,decorate:facts.decorate};
}
