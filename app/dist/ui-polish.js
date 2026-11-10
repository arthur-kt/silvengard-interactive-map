// Silvengard · UI v33 — pequenos ajustes de interface. Não toca na lógica do atlas:
// agrupa as camadas (com memória), adiciona atalhos de teclado e dicas nos botões.
const $=s=>document.querySelector(s),store={get(k,d){try{const v=localStorage.getItem('silvengard.ui.'+k);return v===null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('silvengard.ui.'+k,JSON.stringify(v))}catch{}}};

function groupLayers(){
 const box=$('#layerOptions');if(!box||box.dataset.grouped)return;box.dataset.grouped='1';
 const labels=[...box.children].filter(el=>el.tagName==='LABEL');
 const isLook=el=>el.querySelector('#shadowToggle,#waterToggle,#relief');
 const groups=[{id:'map',title:'Camadas do mapa',first:labels.find(l=>!isLook(l)),members:labels.filter(l=>!isLook(l)),closed:false},
               {id:'look',title:'Aparência',first:labels.find(isLook),members:labels.filter(isLook),closed:true}];
 for(const g of groups){
  if(!g.first)continue;
  const head=document.createElement('div');head.className='lgroup';head.setAttribute('role','button');head.tabIndex=0;head.innerHTML='<i>▾</i>'+g.title;
  box.insertBefore(head,g.first);
  const apply=closed=>{head.classList.toggle('closed',closed);head.setAttribute('aria-expanded',String(!closed));for(const m of g.members)m.classList.toggle('hiddenByGroup',closed)};
  let closed=store.get('group.'+g.id,g.closed);apply(closed);
  const toggle=()=>{closed=!closed;store.set('group.'+g.id,closed);apply(closed)};
  head.onclick=toggle;head.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};
 }
}

function splitHeaderLabels(){
 for(const id of ['sidebarToggle','editorBtn','routesBtn','journeysBtn','economyBtn']){
  const el=document.getElementById(id);if(!el||el.children.length||el.dataset.split)continue;
  const m=/^(\S)\s+(.+)$/.exec(el.textContent.trim());if(!m)continue;el.dataset.split='1';
  const ico=document.createElement('span'),lbl=document.createElement('span');ico.className='ico';ico.textContent=m[1];lbl.className='lbl';lbl.textContent=m[2];
  el.replaceChildren(ico,lbl);
 }
}

function hints(){
 const tips={sidebarToggle:'Explorar estados, cidades e lugares',editorBtn:'Editar o mapa',routesBtn:'Editar rotas e estradas',journeysBtn:'Planejar jornadas',economyBtn:'Economia e mercados',helpBtn:'Ajuda',fullBtn:'Tela cheia',layersBtn:'Camadas (L)',topView:'Câmera de cima',home:'Visão do mundo'};
 for(const [id,t] of Object.entries(tips)){const el=document.getElementById(id);if(el){if(!el.title)el.title=t;if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',t)}}
 const s=$('#search');if(s)s.setAttribute('aria-keyshortcuts','/');
}

function shortcuts(){
 addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const t=e.target,typing=t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable);
  if(e.key==='Escape'&&t?.id==='search'){t.blur();return}
  if(typing||document.querySelector('dialog[open]'))return;
  if(e.key==='/'){
   e.preventDefault();const sb=$('#sidebar');
   if(sb&&(sb.hidden||sb.classList.contains('collapsed')))$('#sidebarToggle')?.click();
   setTimeout(()=>{$('#search')?.focus();$('#search')?.select()},30);
  }else if(e.key==='l'||e.key==='L'){$('#layersBtn')?.click()}
 });
}

function streetEntry(){
 const tools=$('#topTools');if(!tools||$('#streetBtn'))return;
 const b=document.createElement('button');b.id='streetBtn';b.type='button';b.title='Ver no local: caminhar pelo ponto escolhido (V)';b.innerHTML='<span class="ico">👁</span><span class="lbl"> Ver no local</span>';
 b.onclick=()=>{const s=window.__street;if(!s)return;s.picking?s.cancelPick():s.pick()};tools.append(b);
 addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.key.toLowerCase()!=='v')return;const t=e.target;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;if(document.querySelector('dialog[open]')||window.__street?.active)return;b.click()});
}

function boot(){
 try{streetEntry();groupLayers();splitHeaderLabels();hints();shortcuts()}catch(err){console.warn('ui-polish:',err)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
