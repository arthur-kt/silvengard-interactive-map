import {escapeHTML as esc,normalize,renderMarkdown,eraEvents} from './history-core.js?v=37';
import {createHistoryFacts} from './history-facts.js?v=37';
import {bindLineages,houseColor,renderLineageTree,renderSuccessionRuler,treeStats} from './history-lineage.js?v=2';

const labels={world:'Mundo',timeline:'Cronologia',state:'Estados',province:'Províncias',city:'Cidades',culture:'Culturas',religion:'Religiões',lineage:'Linhagens',institution:'Instituições',conflict:'Conflitos'};
const conflictResults={conquest:'Conquista',repression:'Repressão',truce:'Trégua',compromise:'Compromisso',defeat:'Derrota',liberation:'Libertação',occupation:'Ocupação',indecisive:'Sem vencedor',victory:'Vitória'};
const eras=['Era Primordial','Era dos Dragões','Era dos Impérios','Era Contemporânea'];
const eraDates=['Tempo mítico','c. 1.800 anos','1–1250 AQD','1251–1277 AQD'];

function roman(number){const table=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let out='';for(const [value,glyph] of table){while(number>=value){out+=glyph;number-=value;}}return out;}

export function createHistoryReader({D,selectCity,selectState,focus,provinces,provinceAt,provinceOpen,cityTitle,toast}){
 let data=null,sections=new Map(),records=new Map(),tab='world',current='world',era=4,request=0,previousFocus=null,searchIndex=new Map(),compact=false;
 let archive=null,pending=null,loadedAt=0,stack=[],timelineSelected=null,timelineIds=[],worldEra=4;
 let fontScale=Number(localStorage.getItem('silvengard-lore-font'))||1;
 async function getArchive(refresh=false){
  if(pending)return pending;if(archive&&!refresh&&Date.now()-loadedAt<30000)return archive;
  pending=(async()=>{let response=await fetch('./api/history',{cache:'no-store'});if(response.status===404)response=await fetch('./history-archive.json',{cache:'no-store'});if(!response.ok)throw Error('Não foi possível ler as histórias.');archive=await response.json();loadedAt=Date.now();return archive;})();
  try{return await pending;}finally{pending=null;}
 }
 const facts=createHistoryFacts({getData:()=>getArchive(),open:(kind,id)=>open(kind,id)});
 const dialog=document.createElement('dialog');dialog.id='historyReader';dialog.setAttribute('aria-label','Histórias de Silvengard');document.body.append(dialog);
 dialog.innerHTML=`<div class="loreHead"><div class="loreBrand"><span>✧</span><div><small>O ACERVO DE SILVENGARD</small><b>Memórias do mundo</b></div></div><div class="loreHeadTools"><button id="loreBack" hidden title="Voltar ao verbete anterior">← Voltar</button><div class="loreType" role="group" aria-label="Tamanho do texto"><button id="loreFontDown" title="Diminuir o texto">A−</button><button id="loreFontUp" title="Aumentar o texto">A+</button></div><button id="loreRefresh" title="Reler os arquivos de história">↻ Atualizar histórias</button><button id="loreClose" aria-label="Fechar histórias">✕</button></div></div><div class="loreProgress" aria-hidden="true"><i></i></div><div class="loreShell"><nav class="loreNav" aria-label="Categorias de história"><div id="loreTabs"></div><label class="loreSearch">Buscar no acervo<input id="loreSearch" type="search" placeholder="Nome ou trecho da história…"></label><label id="loreStateLabel">Estado<select id="loreState"><option value="">Todos os estados</option></select></label><div id="loreList"></div><p id="loreStatus" role="status"></p></nav><main id="loreMain" tabindex="-1"></main></div>`;
 const $=selector=>dialog.querySelector(selector);
 $('#loreTabs').innerHTML=Object.entries(labels).map(([key,label])=>`<button data-lore-tab="${key}">${label}</button>`).join('');
 $('#loreState').insertAdjacentHTML('beforeend',D.states.filter(s=>s.i).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(s=>`<option value="${s.i}">${esc(s.name.trim())}</option>`).join(''));
 const libraryButton=document.createElement('button');libraryButton.id='loreLibrary';libraryButton.textContent='Explorar histórias';libraryButton.hidden=true;$('#loreRefresh').before(libraryButton);
 libraryButton.onclick=()=>{$('.loreBrand b').textContent='Memórias do mundo';compact=false;dialog.classList.remove('lorePopup');libraryButton.hidden=true;stack=[];renderList();if(tab==='timeline')timeline();else if(tab==='lineage')lineageIndex();else article(current);};
 function applyFont(){dialog.style.setProperty('--lore-font',fontScale);localStorage.setItem('silvengard-lore-font',String(fontScale));}
 function close(){dialog.close();previousFocus?.focus?.();}
 $('#loreClose').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 $('#loreFontDown').onclick=()=>{fontScale=Math.max(.85,Math.round((fontScale-.05)*100)/100);applyFont();};
 $('#loreFontUp').onclick=()=>{fontScale=Math.min(1.3,Math.round((fontScale+.05)*100)/100);applyFont();};
 $('#loreBack').onclick=()=>back();
 applyFont();

 function back(){
  const previous=stack.pop();
  if(!previous){$('#loreBack').hidden=true;return;}
  $('#loreBack').hidden=stack.length===0;
  if(previous==='lineage-index'){tab='lineage';renderList();lineageIndex();return;}
  if(previous==='conflict-index'){tab='conflict';renderList();conflictIndex();return;}
  current=previous;const r=records.get(previous);if(r)tab=r.kind;renderList();if(tab==='lineage')lineageArticle(records.get(previous));else if(tab==='conflict')conflictArticle(records.get(previous));else article(previous);
 }
 function pushHistory(){if(current&&stack[stack.length-1]!==current)stack.push(current);if(stack.length>40)stack.shift();$('#loreBack').hidden=false;}

 async function load(){
  const token=++request;$('#loreStatus').textContent='Abrindo os arquivos…';$('#loreRefresh').disabled=true;
  try{
   const next=await getArchive(true);if(token!==request)return;data={...next,records:next.records.filter(r=>r.kind!=='appendix')};
   sections=new Map(data.sections.map(s=>[s.id,s]));records=new Map(data.records.map(r=>[r.id,r]));
   searchIndex=new Map(data.records.map(r=>[r.id,normalize(r.name+' '+(r.intro||'')+' '+(r.government||'')+' '+(r.chapters||[]).map(id=>sections.get(id)?.displayMarkdown||'').join(' ')+(r.lineage?JSON.stringify(r.lineage):'')+(r.successions?JSON.stringify(r.successions):'')+(r.conflict?JSON.stringify(r.conflict):''))]));
   const count=kind=>data.records.filter(r=>r.kind===kind).length;
   $('#loreStatus').textContent=`${count('state')} estados · ${count('province')} províncias · ${count('city')} cidades · ${count('lineage')} linhagens · ${count('conflict')} conflitos`;
   renderList();
   if(tab==='timeline')timeline();
   else if(tab==='lineage'){const line=records.get(current);if(line?.kind==='lineage')lineageArticle(line);else lineageIndex();}
   else if(tab==='conflict'){const war=records.get(current);if(war?.kind==='conflict')conflictArticle(war);else conflictIndex();}
   else article(current);
  }catch(error){$('#loreStatus').textContent=error.message;if(!data)$('#loreMain').innerHTML=`<div class="loreEmpty"><h1>O acervo não abriu</h1><p>${esc(error.message)}</p><p>Confira os três documentos em historic_archives e tente atualizar novamente.</p></div>`;toast?.(error.message);}
  finally{if(token===request)$('#loreRefresh').disabled=false;}
 }
 function resetProgress(){const bar=dialog.querySelector('.loreProgress i');if(bar)bar.style.width='0%';}
 function stateName(id){return D.states.find(s=>s.i===id)?.name.trim()||'';}
 function stateRecord(id){return records.get('state:'+id);}
 function lineageList(stateId){return data?data.records.filter(r=>r.kind==='lineage'&&(!stateId||r.stateId===stateId)):[];}

 function renderList(){
  for(const b of dialog.querySelectorAll('[data-lore-tab]')){b.classList.toggle('active',b.dataset.loreTab===tab);b.setAttribute('aria-pressed',b.dataset.loreTab===tab);}
  $('#loreStateLabel').hidden=!['state','province','city','institution','lineage'].includes(tab);const q=normalize($('#loreSearch').value),sid=+$('#loreState').value;
  const filter=r=>r.kind===tab&&(!sid||$('#loreStateLabel').hidden||r.stateId===sid)&&(!q||searchIndex.get(r.id)?.includes(q));
  const entries=data?data.records.filter(filter).sort((a,b)=>tab==='conflict'?((a.conflict?.start||9999)-(b.conflict?.start||9999)):a.name.localeCompare(b.name,'pt-BR')):[];
  $('#loreList').innerHTML=tab==='timeline'?'<p class="loreHint">Quatro eras, uma história. Escolha uma era e abra os acontecimentos.</p>':tab==='lineage'&&!entries.length?'<p class="loreHint">Nenhuma casa encontrada nesta seleção.</p>':entries.map(r=>`<button class="loreIndex ${r.id===current?'active':''}" data-lore-record="${esc(r.id)}"><b>${esc(r.name)}</b>${r.stateId&&r.kind!=='state'?'<small>'+esc(stateName(r.stateId))+' · '+esc(labels[r.kind]||'')+'</small>':''}${r.kind==='lineage'&&r.lineage?`<em>${treeStats(r.lineage).nodes} nomes · ${esc(r.lineage.type||'linhagem')}</em>`:''}${r.kind==='conflict'&&r.conflict?`<em>${esc(r.conflict.years)} · ${esc(conflictResults[r.conflict.result]||'Conflito')}</em>`:''}</button>`).join('')||'<p class="loreHint">Nenhum capítulo encontrado nesta seleção.</p>';
  for(const b of dialog.querySelectorAll('[data-lore-record]'))b.onclick=()=>choose(b.dataset.loreRecord);
 }
 function choose(id,{remember=true}={}){
  const r=records.get(id);if(!r)return;if(remember&&current&&current!==id)pushHistory();current=id;tab=r.kind;renderList();
  if(r.kind==='lineage')lineageArticle(r);else article(id);
  $('#loreMain').scrollTop=0;
 }
 function recordButton(id,label){const r=records.get(id);return r?`<button data-lore-link="${esc(id)}">${esc(label||r.name)} ↗</button>`:'';}
 function bindLinks(root){
  for(const b of root.querySelectorAll('[data-lore-link]'))b.onclick=()=>choose(b.dataset.loreLink);
  for(const b of root.querySelectorAll('[data-lore-map]'))b.onclick=()=>locate(records.get(b.dataset.loreMap));
  for(const b of root.querySelectorAll('[data-lore-seat]'))b.onclick=()=>{const city=D.cities.find(item=>item.i===+b.dataset.loreSeat);if(city){close();selectCity(city.i,true);}};
  for(const b of root.querySelectorAll('[data-lore-dynasty]'))b.onclick=()=>{const state=+b.dataset.loreDynasty;const first=lineageList(state)[0];if(first)choose(first.id);};
  for(const b of root.querySelectorAll('[data-lore-ruler]'))b.onclick=()=>{const detail=root.querySelector('#loreRulerDetail');if(detail){detail.open=!detail.open;if(detail.open)detail.scrollIntoView({behavior:'smooth',block:'nearest'});}};
 }
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
   const rank=id=>{const t=sections.get(id)?.title||'';return t.startsWith('Identidade')?0:t.startsWith('Casa soberana')?1:t.startsWith('Tradições')?2:t.startsWith('Casas, sucessões')?3:t.startsWith('História integral')?4:t.startsWith('Instituições')?5:t.startsWith('Províncias')?6:7;};return rank(a)-rank(b);
  });
  const nested=children.map(id=>sectionHTML(id,seen)).join('');
  const content=`<div class="loreProse">${renderMarkdown(s.displayMarkdown||'')}</div>${nested}`;
  return s.displayTransparent?content:`<section class="loreSection" id="lore-section-${s.id}"><h${heading}>${esc(s.displayTitle||s.title)}</h${heading}>${content}</section>`;
 }

 function lineageOf(id){return records.get(id)?.lineage;}
 function chapterHTML(s,index,total){
  const ids=s.lineageIds||[];
  const trees=ids.map(id=>{const line=lineageOf(id);return line?renderLineageTree(line):'';}).join('');
  const heading=normalize(s.displayTitle)!==normalize(currentRecordName())?`<div class="loreChapterHeading"><span>${String(index+1).padStart(2,'0')}</span><h2>${esc(s.displayTitle)}</h2></div>`:'';
  return `<section class="loreChapter" id="lore-section-${s.id}" data-chapter="${s.id}">${heading}<div class="loreProse">${renderMarkdown(s.displayMarkdown||'')}</div>${trees}</section>`;
 }
 let currentRec=null;
 function currentRecordName(){return currentRec?.name||'';}

 function successionFor(stateId){const state=stateRecord(stateId);return state?.successions?.length?state.successions:[];}

 function lineageCard(r){
  const stats=treeStats(r.lineage);
  return `<button class="loreDynastyCard" data-lore-link="${esc(r.id)}" style="--house-color:${houseColor(r.name)}"><span class="loreDynastySigil">❖</span><small>${esc(stateName(r.stateId))}</small><h3>${esc(r.name)}</h3><p>${esc(r.lineage.type||'Linhagem')}${r.lineage.seat?' · '+esc(r.lineage.seat):''}</p><span class="loreDynastyStats">${stats.nodes} nomes · ${stats.generations} gerações</span></button>`;
 }

 function dynastyStrip(stateId){
  const lines=lineageList(stateId);if(!lines.length)return '';
  const successions=successionFor(stateId);
  return `<section class="loreDynastyStrip"><div class="loreDynastyHead"><small>CASAS, SUCESSÕES E LINHAGENS</small><p>Cada casa conserva seu próprio direito: parentesco não equivale a coroa automática. Abra uma casa para percorrer a árvore e os reinados.</p></div><div class="loreDynastyGrid">${lines.map(lineageCard).join('')}</div>${successions.length?`<details class="loreRulerInline"><summary>Ver a régua de reinados · ${successions[0].entries.length} governantes</summary>${renderSuccessionRuler(successions[0],{present:1277})}${successions.length>1?`<details class="loreRulerDetailBox"><summary>Outras sucessões e ofícios (${successions.length-1})</summary>${successions.slice(1).map(item=>renderSuccessionRuler(item,{present:1277})).join('')}</details>`:''}</details>`:''}</section>`;
 }

 function article(id){
  if(!data)return;const r=records.get(id);if(!r)return;
  if(r.kind==='state'){stateArticle(r);return;}
  if(r.kind==='world'){worldArticle(r);return;}
  if(r.kind==='conflict'){conflictArticle(r);return;}
  genericArticle(r);
 }
 function actionsHTML(r,extra=''){
  return `<div class="loreActions">${r.target?`<button data-lore-map="${esc(r.id)}">⌖ Ver no mapa</button>`:''}${extra}${r.stateId&&r.kind!=='state'?recordButton('state:'+r.stateId,'História do estado'):''}</div>`;
 }
 function genericArticle(r){
  current=r.id;currentRec=r;$('.loreBrand b').textContent=compact?r.name:'Memórias do mundo';
  const chapters=(r.chapters||[]).map(sid=>sections.get(sid)).filter(Boolean),events=r.timeline||[];
  const entity=r.target?.kind==='city'?D.cities.find(b=>b.i===r.target.id):r.stateId?D.states.find(s=>s.i===r.stateId):null;
  const province=r.kind==='city'?provinceAt(D.cities.find(b=>b.i===r.target?.id)?.cell)?.i:null;
  const government=(r.government||'').trim().split(/\n\s*\n/)[0];
  const hero=`<div class="loreHero loreStoryHero">${entity?.emblem?`<img class="loreArms" src="${esc(entity.emblem)}" alt="Brasão de ${esc(r.name)}">`:''}<small>${esc(labels[r.kind]||'HISTÓRIA')} ${r.stateId&&r.kind!=='state'?' / '+esc(stateName(r.stateId)):''}</small><h1>${esc(r.name)}</h1>${actionsHTML(r,r.kind==='city'&&province?recordButton('province:'+province,'História da província'):'')}${r.intro?'<div class="loreIdentity">'+renderMarkdown(r.intro)+'</div>':''}${government?'<section class="loreGovernment"><span>CASA GOVERNANTE · '+esc(data.present)+'</span>'+renderMarkdown(government)+'</section>':''}${r.deity?`<p class="loreDeity">Divindade · <strong>${esc(r.deity)}</strong></p>`:''}</div>`;
  const nav=chapters.length>1?`<nav class="loreChapterNav" aria-label="Capítulos desta história"><div><small>EXPLORAR A HISTÓRIA</small>${events.length?'<button id="loreLocalJump">◷ Linha do tempo · '+events.length+' marcos</button>':''}</div><div class="loreChapterRail">${chapters.map((s,i)=>`<button data-lore-anchor="${s.id}"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(s.displayTitle)}</b></button>`).join('')}</div></nav>`:'';
  const body=chapters.map((s,i)=>chapterHTML(s,i,chapters.length)).join('');
  const localTimeline=localTimelineHTML(r);
  $('#loreMain').innerHTML=`${hero}<div class="loreReading">${nav}<div id="loreArticle">${body}</div>${r.contexts?contextsHTML(r):''}${localTimeline}</div>`;
  $('#loreMain').scrollTop=0;resetProgress();bindLinks($('#loreMain'));
  for(const b of dialog.querySelectorAll('[data-lore-anchor]'))b.onclick=()=>$('#lore-section-'+b.dataset.loreAnchor)?.scrollIntoView({behavior:'smooth',block:'start'});
  if($('#loreLocalJump'))$('#loreLocalJump').onclick=()=>$('#loreLocalTimeline')?.scrollIntoView({behavior:'smooth',block:'start'});
  for(const b of dialog.querySelectorAll('[data-lore-context]'))b.onclick=()=>{const content=$('#loreContextBody');content.innerHTML=sectionHTML(b.dataset.loreContext);content.scrollIntoView({behavior:'smooth'});};
  bindLocalTimeline(r);bindLineages($('#loreMain'));watchChapters();
 }

 function localTimelineHTML(r){
  const events=r.timeline||[];
  if(!events.length)return '';
  return `<section id="loreLocalTimeline" class="loreLocalTimeline"><div class="loreSectionHead"><small>LINHA DO TEMPO</small><h2>${esc(r.name)} em ordem</h2><p>Os marcos que a crônica associa a este ${r.kind==='city'?'lugar':'Estado'}. Clique em um para ler o acontecimento.</p></div><div class="loreLocalRail" aria-label="Cronologia desta história">${events.map((e,i)=>`<button data-lore-local="${i}"><small>${esc(e.date)}</small><b>${esc(e.title)}</b></button>`).join('')}</div><article id="loreLocalDetail" aria-live="polite"></article></section>`;
 }
 function bindLocalTimeline(r){
  const events=r.timeline||[];if(!events.length)return;
  const showLocal=index=>{const e=events[index];if(!e)return;const identical=normalize(e.title)===normalize(e.markdown.replace(/[*`]/g,''));const heading=identical?(e.markdown.match(/\*\*([^*]+)\*\*/)?.[1]||''):e.title;for(const b of dialog.querySelectorAll('[data-lore-local]'))b.classList.toggle('active',+b.dataset.loreLocal===index);$('#loreLocalDetail').innerHTML=`<small>${esc(e.date)}</small><h3>${heading?`<h3>${esc(heading)}</h3>`:''}<div class="loreProse">${renderMarkdown(e.markdown)}</div><div class="loreRelated">${e.links.map(id=>recordButton(id)).join('')}</div>`;bindLinks($('#loreLocalDetail'));};
  for(const b of dialog.querySelectorAll('[data-lore-local]'))b.onclick=()=>showLocal(+b.dataset.loreLocal);
  showLocal(0);
 }

 function stateArticle(r){
  current=r.id;currentRec=r;$('.loreBrand b').textContent='Memórias do mundo';
  const state=D.states.find(s=>s.i===r.stateId)||D.states.find(s=>s.i===r.target?.id);
  const capital=D.cities.find(b=>b.i===state?.capital);
  const groups=r.storyGroups||[],houses=r.houseChapters||[],institutions=r.institutionChapters||[];
  const ordered=[...groups.flatMap(g=>g.chapters),...houses,...institutions];
  const counter={n:0},total=ordered.length;
  const groupHTML=(title,intro,ids,key)=>ids.length?`<section class="loreStoryGroup" id="lore-group-${esc(key)}"><div class="loreGroupHead"><small>${esc(key.startsWith('era')?'CAPÍTULOS':key==='houses'?'SUCESSÕES':'INSTITUIÇÕES')}</small><h2>${esc(title)}</h2><p>${esc(intro)}</p></div>${ids.map(sid=>chapterHTML(sections.get(sid),counter.n++,total)).join('')}</section>`:'';
  const story=groups.map(g=>groupHTML(g.title,g.intro,g.chapters,g.key)).join('');
  const housesHTML=groupHTML('Casas, sucessões e linhagens','Árvores de parentesco e casas cadetes. Parentesco não equivale a coroa automática.',houses,'houses');
  const institutionsHTML=groupHTML('Instituições e ofícios','Ordens, conselhos e tradições que organizam o poder.',institutions,'institutions');
  const government=(r.government||'').trim().split(/\n\s*\n/)[0];
  const hero=`<div class="loreHero loreStoryHero">${state?.emblem?`<img class="loreArms" src="${esc(state.emblem)}" alt="Brasão de ${esc(r.name)}">`:''}<small>ESTADO · ${esc(data.present)}</small><h1>${esc(r.name)}</h1><div class="loreActions"><button data-state-map="${r.stateId}">⌖ Ver no mapa</button>${lineageList(r.stateId).length?`<button data-lore-dynasty="${r.stateId}">❖ Árvores e linhagens</button>`:''}<button data-group-jump="local">◷ Linha do tempo</button></div></div>`;
  const currentSection=`<section class="loreCurrent"><div class="loreSectionHead"><small>O ESTADO EM 1277</small><h2>Como está hoje</h2></div>${r.intro?`<div class="loreProse">${renderMarkdown(r.intro)}</div>`:''}${government?`<div class="loreGovernment"><span>CASA GOVERNANTE · ${esc(data.present)}</span>${renderMarkdown(government)}</div>`:''}<div class="loreFacts"><div><span>Capital</span><b>${esc(capital?cityTitle(capital.name):'Não informada')}</b></div><div><span>Casas e linhagens</span><b>${lineageList(r.stateId).length}</b></div><div><span>Marcos na linha do tempo</span><b>${(r.timeline||[]).length}</b></div><div><span>Leitura</span><b>${groups.length} blocos · ${total} capítulos</b></div></div></section>`;
  const dynasty=dynastyStrip(r.stateId);
  const groupJumps=`<div class="loreGroupJump">${groups.map(g=>`<button data-story-group="${g.key}">${esc(g.title)}</button>`).join('')}${houses.length?'<button data-story-group="houses">Casas e sucessões</button>':''}${institutions.length?'<button data-story-group="institutions">Instituições</button>':''}</div>`;
  const nav=ordered.length>1?`<nav class="loreChapterNav" aria-label="Capítulos desta história"><div><small>EXPLORAR A HISTÓRIA</small><button data-group-jump="local">◷ Linha do tempo</button></div>${groupJumps}<div class="loreChapterRail">${ordered.map((sid,i)=>{const section=sections.get(sid);return `<button data-lore-anchor="${sid}"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(section?.displayTitle||'')}</b></button>`;}).join('')}</div></nav>`:'';
  $('#loreMain').innerHTML=`${hero}<div class="loreReading">${nav}${currentSection}${dynasty}${localTimelineHTML(r)}${story}${housesHTML}${institutionsHTML}</div>`;
  $('#loreMain').scrollTop=0;resetProgress();bindLinks($('#loreMain'));
  for(const b of dialog.querySelectorAll('[data-state-map]'))b.onclick=()=>{const id=+b.dataset.stateMap;close();selectState(id,true);};
  for(const b of dialog.querySelectorAll('[data-lore-anchor]'))b.onclick=()=>$('#lore-section-'+b.dataset.loreAnchor)?.scrollIntoView({behavior:'smooth',block:'start'});
  for(const b of dialog.querySelectorAll('[data-group-jump]'))b.onclick=()=>document.querySelector('#loreLocalTimeline')?.scrollIntoView({behavior:'smooth',block:'start'});
  for(const b of dialog.querySelectorAll('[data-story-group]'))b.onclick=()=>$('#lore-group-'+b.dataset.storyGroup)?.scrollIntoView({behavior:'smooth',block:'start'});
  bindLocalTimeline(r);bindLineages($('#loreMain'));watchChapters();
 }

 function worldTimelineHTML(){
  const events=eraEvents(data.events,worldEra);
  return `<section class="loreWorldTimeline" id="loreWorldTimeline"><div class="loreSectionHead"><small>LINHA DO TEMPO DO MUNDO</small><h2>Da criação a 1277 AQD</h2><p>Escolha uma era para percorrer os marcos. As datas aproximadas continuam aproximadas.</p></div><div class="loreEraPills">${eras.map((name,i)=>{const count=data.events.filter(e=>e.era===i+1).length;return `<button data-world-era="${i+1}" class="${worldEra===i+1?'active':''}" aria-pressed="${worldEra===i+1}"><span>${['I','II','III','IV'][i]}</span><b>${esc(name)}</b><small>${count} marcos</small></button>`;}).join('')}</div><div class="loreWorldRail" aria-label="Acontecimentos da era">${events.map(e=>`<button data-world-event="${esc(e.id)}"><small>${esc(e.date)}</small><b>${esc(e.title)}</b></button>`).join('')}</div><div id="loreWorldDetail" class="loreWorldDetail" aria-live="polite"></div></section>`;
 }
 function showWorldEvent(id){
  const event=data.events.find(e=>e.id===id);if(!event)return;
  for(const b of dialog.querySelectorAll('[data-world-event]'))b.classList.toggle('active',b.dataset.worldEvent===id);
  $('#loreWorldDetail').innerHTML=`<small>${esc(event.date)} · ${esc(eras[event.era-1])}</small><h3>${esc(event.title)}</h3><div class="loreProse">${renderMarkdown(event.markdown)}</div><div class="loreRelated">${event.links.map(link=>recordButton(link)).join('')}</div>`;
  bindLinks($('#loreWorldDetail'));
 }
 function bindWorldTimeline(){
  const section=$('#loreWorldTimeline');if(!section)return;
  for(const b of section.querySelectorAll('[data-world-era]'))b.onclick=()=>{worldEra=+b.dataset.worldEra;const holder=document.createElement('div');holder.innerHTML=worldTimelineHTML();section.replaceWith(holder.firstElementChild);bindWorldTimeline();showWorldEvent(eraEvents(data.events,worldEra)[0]?.id);};
  for(const b of section.querySelectorAll('[data-world-event]'))b.onclick=()=>showWorldEvent(b.dataset.worldEvent);
  showWorldEvent(eraEvents(data.events,worldEra)[0]?.id);
 }
 function worldArticle(r){
  current=r.id;currentRec=r;$('.loreBrand b').textContent='Memórias do mundo';
  const groups=r.storyGroups||[];const counter={n:0};const total=groups.reduce((sum,g)=>sum+g.chapters.length,0);
  const hero=`<div class="loreHero loreTimelineHero"><small>HISTÓRIA DO MUNDO · PRESENTE ${esc(data.present)}</small><h1>Silvengard</h1>${r.opening?`<div class="loreIdentity">${renderMarkdown(r.opening)}</div>`:''}<div class="loreActions"><button data-world-action="myth">◇ Mitologia e criação</button><button data-world-action="timeline">◷ Cronologia completa</button><button data-world-action="states">⚑ Os dezenove Estados</button></div></div>`;
  const nav=groups.length?`<nav class="loreChapterNav" aria-label="Blocos da história do mundo"><div><small>EXPLORAR O MUNDO</small></div><div class="loreChapterRail">${groups.map(g=>`<button data-group-anchor="${g.key}"><span>◈</span><b>${esc(g.title)}</b></button>`).join('')}</div></nav>`:'';
  const body=groups.map(g=>`<section class="loreStoryGroup" id="lore-group-${esc(g.key)}"><div class="loreGroupHead"><small>${esc(g.key==='myth'?'ORIGENS':g.key==='history'?'HISTÓRIA':g.key==='present'?'PRESENTE':'MEMÓRIAS')}</small><h2>${esc(g.title)}</h2><p>${esc(g.intro)}</p></div>${g.chapters.map(sid=>chapterHTML(sections.get(sid),counter.n++,total)).join('')}</section>`).join('');
  $('#loreMain').innerHTML=`${hero}<div class="loreReading">${worldTimelineHTML()}${nav}${body}</div>`;
  $('#loreMain').scrollTop=0;resetProgress();bindLinks($('#loreMain'));
  for(const b of dialog.querySelectorAll('[data-group-anchor]'))b.onclick=()=>$('#lore-group-'+b.dataset.groupAnchor)?.scrollIntoView({behavior:'smooth',block:'start'});
  for(const b of dialog.querySelectorAll('[data-world-action]'))b.onclick=()=>{const action=b.dataset.worldAction;if(action==='timeline')switchTab('timeline');else if(action==='states')switchTab('state');else $('#lore-group-myth')?.scrollIntoView({behavior:'smooth',block:'start'});};
  bindWorldTimeline();bindLineages($('#loreMain'));watchChapters();
 }

 function amount(value){const match=String(value??'').match(/\d[\d.]*/);return match?Number(match[0].replace(/\./g,'')):0;}
 function conflictCard(r){
  const c=r.conflict||{},result=conflictResults[c.result]||'Conflito';
  return `<button class="loreConflictCard is-${esc(c.result||'indecisive')}" data-lore-link="${esc(r.id)}"><small>${esc(c.years||'')}</small><h3>${esc(c.name)}</h3><p>${esc(c.kind||'')}</p><div class="loreConflictMeta"><span><b>${esc(c.totalStrength||'—')}</b> efetivo</span><span><b>${esc(c.totalCasualties||'—')}</b> baixas</span></div><em>${esc(result)} · ${esc(c.victor||'—')}</em></button>`;
 }
 function conflictIndex(){
  if(!data)return;current='conflict-index';currentRec=null;
  const all=data.records.filter(r=>r.kind==='conflict').sort((a,b)=>((a.conflict?.start||0)-(b.conflict?.start||0)));
  if(!all.length){$('#loreMain').innerHTML='<div class="loreEmpty"><h1>Nenhum conflito recebido</h1><p>O servidor do Atlas pode estar com uma versão anterior. Clique com o botão direito no ícone da bandeja, escolha <b>Reiniciar servidor</b> e recarregue esta página com Ctrl+F5.</p></div>';return;}
  const groups=new Map();
  for(const r of all){const label=centuryKey(`${r.conflict?.start||0} AQD`);if(!groups.has(label))groups.set(label,[]);groups.get(label).push(r);}
  $('#loreMain').innerHTML=`<div class="loreHero loreTimelineHero"><small>CONFLITOS E GUERRAS · ATÉ ${esc(data.present)}</small><h1>O preço das coroas</h1><p>Guerras, revoltas, cercos e ocupações dos dezenove Estados, com comandantes, forças, baixas e objetivos. Clique em um conflito para abrir a ficha completa.</p><p class="loreEstimateNote">Efetivos e baixas são estimativas de campanha do Atlas; a crônica não registra números exatos.</p></div><div class="loreConflictIndex">${[...groups.entries()].map(([label,list])=>`<section class="loreConflictGroup"><div class="loreConflictGroupHead"><h2>${esc(label)}</h2><span>${list.length} ${list.length===1?'conflito':'conflitos'}</span></div><div class="loreConflictGrid">${list.map(conflictCard).join('')}</div></section>`).join('')}</div>`;
  $('#loreMain').scrollTop=0;resetProgress();bindLinks($('#loreMain'));
 }
 function conflictArticle(r){
  if(!data||!r)return;currentRec=r;current=r.id;
  const c=r.conflict||{},sides=c.sides||[],maxStrength=Math.max(1,...sides.map(side=>amount(side.strength)));
  const result=conflictResults[c.result]||'Conflito';
  const sideHTML=(side,index)=>{const strength=amount(side.strength),casualties=amount(side.casualties),rate=strength?Math.round((casualties/strength)*100):0;return `<article class="loreSide" style="--side-color:${houseColor(side.name,index)}"><small>LADO ${index+1}</small><h3>${esc(side.name)}</h3><p class="loreSideCommanders"><b>Comando:</b> ${esc(side.commanders||'não registrado')}</p><div class="loreSideNumbers"><div><span>Força</span><b>${esc(side.strength||'—')}</b></div><div><span>Baixas</span><b>${esc(side.casualties||'—')}</b></div></div><div class="loreSideBar"><i style="width:${Math.max(4,Math.min(100,(strength/maxStrength)*100))}%"></i><small>força comparada</small></div><div class="loreSideBar is-casualty"><i style="width:${Math.max(2,Math.min(100,rate))}%"></i><small>${rate}% do efetivo perdido</small></div><p class="loreSideObjective"><b>Objetivo:</b> ${esc(side.objective||'não registrado')}</p></article>`;};
  const hero=`<div class="loreHero loreStoryHero loreConflictHero"><small>CONFLITO · ${esc(c.years||'')}</small><h1>${esc(c.name)}</h1><p class="loreLineageType">${esc(c.kind||'Conflito')}${c.place?' · '+esc(c.place):''}</p><div class="loreActions">${(c.links||[]).map(id=>recordButton(id)).join('')}</div><div class="loreResult is-${esc(c.result||'indecisive')}"><span>RESULTADO · ${esc(result)}</span><b>${esc(c.victor||'—')}</b><p>${esc(c.outcome||'')}</p></div></div>`;
  const stats=`<div class="loreConflictStats"><div><span>Período</span><b>${esc(c.years||'—')}</b></div><div><span>Força total</span><b>${esc(c.totalStrength||'—')}</b></div><div><span>Baixas totais</span><b>${esc(c.totalCasualties||'—')}</b></div><div><span>Lados</span><b>${sides.length}</b></div></div>`;
  $('#loreMain').innerHTML=`${hero}<div class="loreReading"><section class="loreConflictBody">${stats}<div class="loreSectionHead"><small>O CONFLITO</small><h2>Como começou</h2></div><div class="loreProse">${renderMarkdown(c.summary||'')}</div><div class="loreObjectiveBlock"><small>OBJETIVOS</small><p>${esc(c.objectives||'')}</p></div><div class="loreSectionHead"><small>OS LADOS</small><h2>Forças, comandos e baixas</h2></div><div class="loreSidesGrid">${sides.map(sideHTML).join('')}</div><p class="loreEstimateNote">Efetivos e baixas são estimativas de campanha do Atlas; a crônica não registra números exatos. A barra de força compara cada lado com o maior efetivo; a barra de baixas mostra a porcentagem do próprio efetivo perdida em combate.</p></section></div>`;
  $('#loreMain').scrollTop=0;resetProgress();bindLinks($('#loreMain'));watchChapters();
 }

 function contextsHTML(r){
  return `<section class="loreContexts"><h2>Contextos regionais</h2><p>Os capítulos abaixo descrevem a sociedade de cada região e suas diferentes comunidades.</p>${r.contexts.length?'<div class="loreRelated">'+r.contexts.map(c=>`<button data-lore-context="${c.section}">${esc(c.name)} ↗</button>`).join('')+'</div><div id="loreContextBody">'+(!r.sections.length?sectionHTML(r.contexts[0].section):'')+'</div>':''}</section>`;
 }

 function lineageArticle(r){
  if(!data||!r)return;currentRec=r;current=r.id;
  const state=stateRecord(r.stateId);const others=lineageList(r.stateId).filter(item=>item.id!==r.id);
  const section=sections.get(r.sections[0]);const parent=section?sections.get(section.parent):null;
  const seatName=String(r.lineage.seat||'').split('·')[0].trim();const seatCity=D.cities.find(item=>normalize(item.name)===normalize(seatName));
  const intro=parent?.displayMarkdown?`<div class="loreIdentity">${renderMarkdown(parent.displayMarkdown)}</div>`:'';
  const successions=successionFor(r.stateId);
  const ruler=successions.length?`<div class="loreLineageRuler"><div class="loreSectionHead"><small>REINADOS E GOVERNOS</small><h2>Régua de sucessão de ${esc(stateName(r.stateId))}</h2></div>${renderSuccessionRuler(successions[0],{present:1277})}${successions.length>1?`<details class="loreRulerDetailBox"><summary>Outras sucessões e ofícios (${successions.length-1})</summary>${successions.slice(1).map(item=>renderSuccessionRuler(item,{present:1277})).join('')}</details>`:''}</div>`:'';
  $('#loreMain').innerHTML=`<div class="loreHero loreStoryHero loreLineageHero"><small>LINHAGEM / ${esc(stateName(r.stateId))}</small><h1>${esc(r.name)}</h1><p class="loreLineageType">${esc(r.lineage.type||'Casa e sucessão')}${r.lineage.seat?' · '+esc(r.lineage.seat):''}</p><div class="loreActions">${state?recordButton('state:'+r.stateId,'História de '+stateName(r.stateId)):''}${seatCity?`<button data-lore-seat="${seatCity.i}">⌖ Ver ${esc(seatCity.name)} no mapa</button>`:''}</div>${intro}</div><div class="loreReading">${renderLineageTree(r.lineage,{present:data.present})}${ruler}${others.length?`<section class="loreOtherHouses"><div class="loreSectionHead"><small>MESMO ESTADO</small><h2>Outras casas e linhagens</h2></div><div class="loreDynastyGrid">${others.map(lineageCard).join('')}</div></section>`:''}</div>`;
  $('#loreMain').scrollTop=0;resetProgress();bindLinks($('#loreMain'));bindLineages($('#loreMain'));watchChapters();
 }

 function lineageIndex(){
  if(!data)return;current='lineage-index';currentRec=null;
  const groups=new Map();for(const r of lineageList()){if(!groups.has(r.stateId))groups.set(r.stateId,[]);groups.get(r.stateId).push(r);}
  const sid=+$('#loreState').value;const order=[...groups.keys()].filter(id=>!sid||id===sid).sort((a,b)=>stateName(a).localeCompare(stateName(b),'pt-BR'));
  $('#loreMain').innerHTML=`<div class="loreHero loreTimelineHero"><small>CASAS, DINASTIAS E CONSELHOS · PRESENTE ${esc(data.present)}</small><h1>Quem governa, quem herda</h1><p>Árvores genealógicas, casas cadetes e réguas de reinado dos dezenove Estados. O parentesco é mostrado como a crônica o registra — sem transformar linhagem em direito automático ao trono.</p></div><div class="loreDynastyIndex">${order.map(id=>`<section class="loreDynastyGroup"><div class="loreDynastyGroupHead"><h2>${esc(stateName(id))}</h2><span>${groups.get(id).length} ${groups.get(id).length===1?'casa':'casas'}</span></div><div class="loreDynastyGrid">${groups.get(id).map(lineageCard).join('')}</div></section>`).join('')||'<p class="loreHint">Nenhuma casa nesta seleção.</p>'}</div>`;
  $('#loreMain').scrollTop=0;resetProgress();bindLinks($('#loreMain'));
 }

 function timeline(selected){
  if(!data)return;const all=eraEvents(data.events,era);const query=normalize($('#loreTimeSearch')?.value||'');
  const events=all.filter(e=>!query||normalize(e.title+' '+e.markdown+' '+e.date).includes(query));
  selected=timelineSelected||selected;timelineSelected=events.some(e=>e.id===selected)?selected:events[0]?.id;selected=timelineSelected;timelineIds=events.map(e=>e.id);
  const groups=new Map();for(const e of events){const key=era===1?'Tempo mítico':era===2?'Era dos Dragões':centuryKey(e.date);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
  $('#loreMain').innerHTML=`<div class="loreHero loreTimelineHero"><small>CRONOLOGIA CONTINENTAL · PRESENTE ${esc(data.present)}</small><h1>As quatro eras</h1><p>O calendário AQD segue uma contagem contínua. Tradições míticas e datas aproximadas conservam sua incerteza.</p></div><div class="loreEras">${eras.map((name,i)=>`<button data-lore-era="${i+1}" class="${era===i+1?'active':''}" aria-pressed="${era===i+1}"><span>${['I','II','III','IV'][i]}</span><b>${name}</b><small>${eraDates[i]}</small></button>`).join('')}</div><div class="loreTimeTools"><label>Buscar nesta era<input id="loreTimeSearch" type="search" value="${esc($('#loreTimeSearch')?.value||'')}" placeholder="Cidade, guerra, personagem…"></label><span>${events.length} marcos</span><small>Use ↑ e ↓ para percorrer</small></div><div class="loreTimeGrid"><div class="loreTimeline" aria-label="Acontecimentos da era">${[...groups.entries()].map(([label,list])=>`<div class="loreCentury"><span>${esc(label)}</span><i>${list.length}</i></div>${list.map(e=>`<button data-lore-time="${e.id}" class="loreEvent ${e.id===selected?'active':''}" aria-pressed="${e.id===selected}"><span class="loreTimeDot"></span><small>${esc(e.date)}</small><b>${esc(e.title)}</b></button>`).join('')}`).join('')||'<p class="loreHint">Nenhum marco com esse termo.</p>'}</div><article id="loreEventDetail" aria-live="polite"></article></div>`;
  for(const b of dialog.querySelectorAll('[data-lore-era]'))b.onclick=()=>{era=+b.dataset.loreEra;timelineSelected=null;timeline();};
  for(const b of dialog.querySelectorAll('[data-lore-time]'))b.onclick=()=>{eventDetail(b.dataset.loreTime);if(dialog.clientWidth<850)$('#loreEventDetail').scrollIntoView({behavior:'smooth',block:'start'});};
  $('#loreTimeSearch').oninput=()=>{const input=$('#loreTimeSearch'),caret=input.selectionStart;timeline(timelineSelected);const next=$('#loreTimeSearch');if(next){next.focus();try{next.setSelectionRange(caret,caret);}catch{}}};
  eventDetail(timelineSelected);$('#loreMain').scrollTop=0;resetProgress();
 }
 function centuryKey(date){
  const year=Number((String(date).replace(/^c\.\s*/,'').replace(/^(II|III|IV|I)-/,'').match(/\d+/)||[])[0]);
  if(!Number.isFinite(year))return 'Datas aproximadas';
  const century=Math.floor((year-1)/100)+1,from=(century-1)*100+1,to=century*100;
  return `Século ${roman(century)} · ${from}–${to}`;
 }
 function eventDetail(id){const e=data.events.find(e=>e.id===id);if(!e)return;timelineSelected=id;
  for(const b of dialog.querySelectorAll('[data-lore-time]')){b.classList.toggle('active',b.dataset.loreTime===id);b.setAttribute('aria-pressed',b.dataset.loreTime===id);}
  $('#loreEventDetail').innerHTML=`<small>${esc(e.date)} · ${esc(eras[e.era-1])}</small><h2>${esc(e.title)}</h2><div class="loreProse">${renderMarkdown(e.markdown)}</div><div class="loreRelated">${e.links.map(id=>recordButton(id)).join('')}</div><button id="loreEventChapter">Ler o contexto desta era ↗</button>`;bindLinks($('#loreEventDetail'));
  $('#loreEventChapter').onclick=()=>{choose('world');const chapter=(records.get('world')?.chapters||[]).find(id=>normalize(sections.get(id)?.displayTitle||'').startsWith(['primeira era','segunda era','terceira era','quarta era'][e.era-1]));const target=$('#lore-section-'+chapter);if(target){for(let p=target;p&&p!==dialog;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;target.scrollIntoView({behavior:'smooth'});}};
 }
 function switchTab(kind){tab=kind;$('#loreSearch').value='';renderList();if(kind==='timeline'){timeline();return;}if(kind==='lineage'){lineageIndex();return;}if(kind==='conflict'){conflictIndex();return;}const first=data?.records.find(r=>r.kind===kind);if(first)article(first.id);}
 for(const b of dialog.querySelectorAll('[data-lore-tab]'))b.onclick=()=>switchTab(b.dataset.loreTab);
 $('#loreSearch').oninput=()=>{renderList();if(tab==='lineage')lineageIndex();};$('#loreState').onchange=()=>{renderList();if(tab==='lineage')lineageIndex();};$('#loreRefresh').onclick=load;

 $('#loreMain').addEventListener('scroll',()=>{
  const main=$('#loreMain');const max=main.scrollHeight-main.clientHeight;const bar=dialog.querySelector('.loreProgress i');if(bar)bar.style.width=`${max>0?Math.min(100,(main.scrollTop/max)*100):0}%`;
 },{passive:true});
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
  if(/INPUT|SELECT|TEXTAREA/.test(event.target.tagName)||tab!=='timeline')return;
  const ids=timelineIds.length?timelineIds:eraEvents(data?.events||[],era).map(e=>e.id);const index=ids.indexOf(timelineSelected);
  const next=ids[Math.max(0,Math.min(ids.length-1,index+(event.key==='ArrowDown'?1:-1)))];if(next){event.preventDefault();eventDetail(next);$(`[data-lore-time="${next}"]`)?.scrollIntoView({block:'nearest'});}
 });
 let chapterObserver=null;
 function watchChapters(){
  chapterObserver?.disconnect();const main=$('#loreMain');if(!main||!('IntersectionObserver'in window))return;
  const links=[...dialog.querySelectorAll('[data-lore-anchor]')];if(!links.length)return;
  chapterObserver=new IntersectionObserver(entries=>{
   for(const entry of entries){if(!entry.isIntersecting)continue;const id=entry.target.id.replace('lore-section-','');for(const b of links)b.classList.toggle('active',b.dataset.loreAnchor===id);}
  },{root:main,rootMargin:'-15% 0px -70% 0px'});
  for(const section of main.querySelectorAll('.loreChapter'))chapterObserver.observe(section);
 }

 async function open(kind='world',id){
  previousFocus=document.activeElement;compact=false;dialog.classList.remove('lorePopup');libraryButton.hidden=true;
  const record=id==null?kind:(typeof id==='string'&&id.includes(':')?id:kind+':'+id);
  current=record;tab=record.includes(':')?record.split(':')[0]:kind;stack=[];$('#loreBack').hidden=true;
  if(!dialog.open)dialog.showModal();$('#loreState').value='';$('#loreSearch').value='';
  if(data){renderList();if(tab==='timeline')timeline();else if(tab==='lineage'){const line=records.get(current);if(line?.kind==='lineage')lineageArticle(line);else lineageIndex();}else if(tab==='conflict'){const war=records.get(current);if(war?.kind==='conflict')conflictArticle(war);else conflictIndex();}else article(current);}
  await load();$('#loreClose').focus();
 }
 return {open,close,decorate:facts.decorate};
}
