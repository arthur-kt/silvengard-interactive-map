// Silvengard Atlas: campanhas persistentes, fichas de personagem e jornadas.
// Narrativas vivem em app/campaigns/*.json e são relidas do servidor local.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp = value => { try {return value ? new Date(value).toLocaleString('pt-BR') : '—';} catch {return '—';} };
const uid = () => (globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const mod = (text) => String(text || '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>');
function markdown(value) {
  const lines = esc(value).split(/\r?\n/);let result = '', listOpen = false;
  const close = () => {if (listOpen) {result += '</ul>';listOpen = false;}};
  for (const line of lines) {
    if (!line.trim()) {close();continue;}
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {close();result += `<h${heading[1].length + 3}>${mod(heading[2])}</h${heading[1].length + 3}>`;continue;}
    const bullet = line.match(/^\s*[-*]\s+(.+)/);
    if (bullet) {if (!listOpen) {result += '<ul>';listOpen = true;}result += `<li>${mod(bullet[1])}</li>`;continue;}
    close();result += `<p>${mod(line)}</p>`;
  }
  close();return result || '<p class="campaignMuted">Ainda não registrado.</p>';
}
function downloadJson(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');a.href = url;a.download = name;a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function request(url, method = 'GET', data = null, revision = null) {
  const headers = {'Accept': 'application/json'};
  if (data !== null) headers['Content-Type'] = 'application/json';
  if (revision !== null) headers['If-Match'] = revision;
  let response;
  try { response = await fetch(url, {method, headers, body: data === null ? undefined : JSON.stringify(data), cache:'no-store'}); }
  catch { throw new Error('Servidor local indisponível. Abra pelo Silvengard-Atlas.exe ou Iniciar-Atlas.cmd.'); }
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error || `Erro HTTP ${response.status}. Verifique o servidor do Atlas.`);
  if (!json) throw new Error('Esta instalação não oferece a API de campanhas. Reinicie o servidor após instalar o upgrade.');
  return json;
}

export function createCampaigns({characters, journeys, toast = () => {}, onJourneysOpen = () => {}, onCharacterOpen = () => {}, onCharacterImport = () => {}} = {}) {
  const panel = document.createElement('aside');
  panel.id = 'campaigns';panel.hidden = true;panel.setAttribute('aria-label', 'Campanhas de RPG');
  document.body.append(panel);
  const state = {list: [], active: null, activeId: '', sheets: [], errors: [], search: '', editing: false, lastError: '', loading: false};
  const $ = selector => panel.querySelector(selector);
  let operation = Promise.resolve();
  function notify(message) {toast(message);}
  function ensureServerError(error) {state.lastError = error.message || String(error);render();}
  function currentRoute() {return state.active?.party?.journeyPartyId ? journeys.getParty(state.active.party.journeyPartyId) : null;}
  function sheetFor(id) {return state.sheets.find(item => String(item.id) === String(id));}
  function isOpen() {return !panel.hidden;}

  async function refreshSheets() {
    try {state.sheets = await characters.listSheets();}
    catch (error) {console.warn('Fichas indisponíveis:', error);state.sheets = [];}
  }
  async function loadCampaign(id, force = false) {
    if (!id) {state.active = null;state.activeId = '';render();return;}
    if (!force && state.activeId === id && state.active) return;
    state.active = await request(`/api/campaigns/${encodeURIComponent(id)}`);
    state.activeId = id;
    try {localStorage.setItem('silvengard-campaign-active', id);} catch {}
    render();
  }
  async function reload(force = false) {
    if (state.editing) return;
    try {
      const next = await request('/api/campaigns');
      const oldActive = state.active;
      state.list = next.campaigns || [];
      state.errors = next.errors || [];
      state.lastError = '';
      let id = state.activeId;
      if (!id) {try {id = localStorage.getItem('silvengard-campaign-active') || '';} catch {}}
      if (!state.list.some(c => c.id === id)) id = state.list[0]?.id || '';
      const summary = state.list.find(c => c.id === id);
      if (summary && (!oldActive || id !== oldActive.id || summary._revision !== oldActive._revision || force)) {
        await loadCampaign(id, true);
      } else if (!summary) {state.active = null;state.activeId = '';render();}
      else if (force) render();
    } catch (error) {ensureServerError(error);}
  }
  async function mutate(change) {
    // Calcula cada alteração somente após o término da anterior, evitando concorrência na UI.
    operation = operation.catch(() => {}).then(async () => {
      const active = state.active;
      if (!active) throw new Error('Selecione uma campanha.');
      const next = structuredClone(active);delete next._revision;
      change(next);
      try {
        const saved = await request(`/api/campaigns/${encodeURIComponent(active.id)}`, 'PUT', next, active._revision);
        state.active = saved;state.activeId = saved.id;
        state.list = state.list.map(c => c.id === saved.id ? {...c, ...saved} : c);
        render();return saved;
      } catch (error) {notify(error.message);throw error;}
    });
    return operation;
  }
  function field(name, label, value = '', extra = '') {
    return `<label class="campaignField"><span>${esc(label)}</span><input name="${name}" value="${esc(value)}" ${extra}></label>`;
  }
  function area(name, label, value = '', rows = 5) {
    return `<label class="campaignField"><span>${esc(label)}</span><textarea name="${name}" rows="${rows}">${esc(value)}</textarea></label>`;
  }
  function choices(name, label, options, selected = '') {
    return `<label class="campaignField"><span>${esc(label)}</span><select name="${name}">${options.map(([key, title]) => `<option value="${esc(key)}" ${String(key) === String(selected) ? 'selected' : ''}>${esc(title)}</option>`).join('')}</select></label>`;
  }
  function dialog({title, intro = '', form, saveLabel = 'Salvar alterações', onSave}) {
    const modal = document.createElement('dialog');modal.className = 'campaignDialog';
    modal.innerHTML = `<form><header><div class="eyebrow">CRÔNICAS DO ATLAS</div><h2>${esc(title)}</h2>${intro ? `<p>${esc(intro)}</p>` : ''}</header><div class="campaignDialogBody">${form}</div><p class="campaignDialogError" role="alert" hidden></p><footer><button type="button" data-cancel>Cancelar</button><button type="submit" class="campaignPrimary">${esc(saveLabel)}</button></footer></form>`;
    document.body.append(modal);state.editing = true;
    modal.querySelector('[data-cancel]').onclick = () => modal.close();
    modal.addEventListener('close', () => {modal.remove();state.editing = false;void reload();}, {once:true});
    modal.querySelector('form').onsubmit = async event => {
      event.preventDefault();const submit = modal.querySelector('[type=submit]');submit.disabled = true;const error = modal.querySelector('.campaignDialogError');error.hidden = true;
      try {const data = Object.fromEntries(new FormData(event.currentTarget).entries());await onSave(data);modal.close();}
      catch (e) {error.textContent = e.message;error.hidden = false;submit.disabled = false;}
    };
    modal.showModal();
  }
  function openNew(initial = null) {
    dialog({title: 'Nova campanha', intro:'Cada campanha terá um arquivo próprio em app/campaigns/ e sua história independente.',
      form: field('title', 'Nome da campanha', initial?.title || '', 'maxlength="140" required autofocus') +
        field('subtitle', 'Subtítulo (opcional)', initial?.subtitle || '', 'maxlength="240"') +
        `<div class="campaignFormRow">${field('year', 'Ano de Silvengard', initial?.year || '1277 AQD', 'maxlength="80"')}${field('region', 'Região inicial', initial?.region || '', 'maxlength="180"')}</div>` +
        area('premise','Contexto inicial',initial?.premise || '',5),
      saveLabel:'Criar campanha',onSave: async v => {
        const raw = initial ? {...initial, ...v} : {...v,party:{name:'',members:[],journeyPartyId:''},npcs:[],events:[],summary:'',status:'Em andamento'};
        delete raw._revision;delete raw.id;const created = await request('/api/campaigns','POST',raw);
        state.active = created;state.activeId = created.id;
        try {localStorage.setItem('silvengard-campaign-active', created.id);} catch {}
        await reload(true);notify('Campanha criada no arquivo local.');
      }});
  }
  function editAbout() {
    const c = state.active;
    dialog({title: 'Identidade e contexto',
      form:field('title','Título',c.title,'maxlength="140" required') + field('subtitle','Subtítulo',c.subtitle,'maxlength="240"') +
        `<div class="campaignFormRow">${choices('status','Situação',[['Em andamento','Em andamento'],['Planejada','Planejada'],['Concluída','Concluída'],['Em pausa','Em pausa']],c.status)}${field('year','Ano',c.year,'maxlength="80"')}</div>` +
        field('region','Região ou cenário',c.region,'maxlength="180"') +
        area('premise','Contexto da campanha (antes das sessões)',c.premise,9) +
        area('summary','Situação atual e objetivos da equipe',c.summary,6),
      onSave: v => mutate(c => Object.assign(c,v))});
  }
  function editMember(id = null) {
    const c = state.active;const m = c.party.members.find(i => i.id === id) || {};
    const taken = new Set(c.party.members.filter(item => item.id !== id).map(item => String(item.sheetId)));
    const options = [['','Sem ficha (personagem manual)'],...state.sheets.filter(sheet => !taken.has(String(sheet.id)) || String(sheet.id) === String(m.sheetId)).map(sheet => [sheet.id, `${sheet.name} · Nv ${sheet.level} · ${sheet.classLine}`])];
    dialog({title: id ? 'Editar integrante' : 'Adicionar ao grupo',
      intro:'Vincule uma ficha importada ou registre um personagem ainda sem ficha.',
      form:choices('sheetId','Ficha de personagem',options,m.sheetId || '') +
        field('name','Nome exibido (opcional se houver ficha)',m.name || '', 'maxlength="140"') +
        field('role','Papel na equipe',m.role || '', 'maxlength="140" placeholder="Batedor, líder, curandeiro…"') +
        area('notes','Notas sobre o personagem',m.notes || '',4),
      onSave: v => mutate(c => {
        const item = {...v,id: id || uid()};
        if (id) c.party.members = c.party.members.map(i => i.id === id ? item : i);
        else c.party.members.push(item);
      })});
  }
  function editNpc(id = null) {
    const npc = state.active.npcs.find(item => item.id === id) || {};
    dialog({title: id ? 'Editar personagem importante' : 'Novo personagem importante',
      form:field('name','Nome',npc.name || '', 'required maxlength="140"') +
        `<div class="campaignFormRow">${field('role','Papel na história',npc.role || '', 'maxlength="160"')}${field('affiliation','Facção / aliança',npc.affiliation || '', 'maxlength="160"')}</div>` +
        field('location','Localização conhecida',npc.location || '', 'maxlength="160"') +
        area('description','Relação com a campanha, encontros e informações relevantes',npc.description || '',8),
      onSave: v => mutate(c => {const item = {...v,id: id || uid()};c.npcs = id ? c.npcs.map(i => i.id === id ? item : i) : [...c.npcs,item];})});
  }
  function editEvent(id = null) {
    const event = state.active.events.find(item => item.id === id) || {};
    dialog({title: id ? 'Editar acontecimento' : 'Registrar acontecimento',
      intro:'Escreva o que realmente aconteceu na mesa. É possível organizar por sessão, ano, capítulo e lugar.',
      form:field('title','Título do acontecimento',event.title || '', 'required maxlength="180"') +
        `<div class="campaignFormRow">${field('when','Data ou ano fictício',event.when || state.active.year, 'maxlength="100"')}${field('session','Sessão',event.session || '', 'maxlength="100" placeholder="Sessão 4"')}</div>` +
        `<div class="campaignFormRow">${field('chapter','Capítulo',event.chapter || '', 'maxlength="140"')}${field('place','Local',event.place || '', 'maxlength="180"')}</div>` +
        choices('type','Tipo',[['event','Acontecimento'],['discovery','Descoberta'],['combat','Conflito'],['roleplay','Interpretação'],['milestone','Marco da campanha']],event.type || 'event') +
        area('body','Narrativa (aceita títulos, negrito e listas simples em Markdown)',event.body || '',12),
      onSave: v => mutate(c => {const item = {...v,id: id || uid()};c.events = id ? c.events.map(e => e.id === id ? item : e) : [...c.events,item];})});
  }
  function initials(name) {return String(name || '?').trim().split(/\s+/).slice(0,2).map(i => i[0] || '').join('').toUpperCase();}
  function renderParty(c) {
    return `<section class="campaignSection" id="campaignParty"><div class="campaignSectionHead"><div><span class="campaignKicker">A COMPANHIA</span><h3>${esc(c.party.name || 'O grupo de aventureiros')}</h3></div><div class="campaignActions"><button data-action="rename-party">Renomear</button><button data-action="add-member" class="campaignPrimary">+ Personagem</button></div></div>
      <div class="campaignPartyGrid">${c.party.members.map(m => {const sheet = sheetFor(m.sheetId);const name = m.name || sheet?.name || 'Personagem sem nome';
        return `<article class="campaignMember"><div class="campaignMemberTop"><span class="campaignPortrait">${sheet?.image?.startsWith('data:image/') ? `<img src="${esc(sheet.image)}" alt="">` : esc(initials(name))}</span><div><h4>${esc(name)}</h4><small>${esc(m.role || 'Aventureiro')}${sheet ? ` · Nível ${sheet.level}` : ''}</small></div></div><p>${esc(sheet ? `${sheet.classLine} · ${sheet.race?.name || '—'}` : 'Ficha ainda não vinculada')}</p>${m.notes ? `<p class="campaignMuted">${esc(m.notes)}</p>` : ''}
        <div class="campaignItemActions">${sheet ? `<button data-action="open-sheet" data-id="${esc(m.sheetId)}">Ver ficha ↗</button><button data-action="update-sheet" data-id="${esc(m.sheetId)}">↻ Atualizar ficha</button>` : '<button data-action="import-sheet">Importar ficha</button>'}<button data-action="edit-member" data-id="${esc(m.id)}" title="Editar integrante">Editar</button><button data-action="remove-member" data-id="${esc(m.id)}" title="Remover integrante">×</button></div></article>`;}).join('') || '<div class="campaignEmptyInline">Nenhum aventureiro foi adicionado. Importe uma ficha em <b>Fichas</b> ou registre o primeiro personagem.</div>'}</div></section>`;
  }
  function renderJourney(c) {
    const route = currentRoute();const history = route?.history || [];
    const selector = [['','Não associar grupo'],...journeys.listParties().map(p => [p.id,p.name])];
    return `<section class="campaignSection" id="campaignJourney"><div class="campaignSectionHead"><div><span class="campaignKicker">ROTA DOS AVENTUREIROS</span><h3>Jornada pelo continente</h3></div><button data-action="open-journey" ${!route ? 'disabled' : ''}>Abrir jornadas no mapa ↗</button></div>
      <div class="campaignRouteSurface"><div class="campaignRouteControls"><label>Grupo de Jornadas associado<select id="campaignJourneySelect">${selector.map(([id,name]) => `<option value="${esc(id)}" ${c.party.journeyPartyId === id ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label><button data-action="create-journey">+ Novo grupo</button></div>
      ${route ? `<div class="campaignRouteStats"><div><small>POSIÇÃO ATUAL</small><strong>${esc(route.location?.label || 'Não marcada')}</strong></div><div><small>TRECHOS PERCORRIDOS</small><strong>${history.length}</strong></div><div><small>DISTÂNCIA REGISTRADA</small><strong>${history.reduce((n, h) => n + (Number(h.distance) || 0), 0).toLocaleString('pt-BR',{maximumFractionDigits:1})} km</strong></div></div>
      <label class="campaignVisibility"><input id="campaignJourneyVisible" type="checkbox" ${route.showOnMap !== false ? 'checked' : ''}> Mostrar este grupo e seu percurso no mapa</label>
      ${history.length ? `<div class="campaignRouteHistory">${history.slice().reverse().slice(0,8).map(h => `<div><strong>${esc(h.name)}</strong><span>${esc(h.from)} → ${esc(h.to)}</span><small>${Number(h.distance || 0).toLocaleString('pt-BR',{maximumFractionDigits:1})} km · ${stamp(h.date)}</small></div>`).join('')}</div>` : '<p class="campaignMuted">Nenhum trajeto foi registrado ainda. Em Jornadas, marque a posição, simule a rota e clique em “Registrar como percorrido”.</p>'}`
      : '<p class="campaignMuted">Associe ou crie um grupo. A posição atual, os trechos realmente percorridos e o histórico passarão a aparecer aqui automaticamente.</p>'}</div></section>`;
  }
  function renderNpcs(c) {
    return `<section class="campaignSection" id="campaignNpcs"><div class="campaignSectionHead"><div><span class="campaignKicker">ALIADOS · RIVAIS · CONTATOS</span><h3>Personagens importantes</h3></div><button class="campaignPrimary" data-action="add-npc">+ Adicionar</button></div>
      <div class="campaignNpcs">${c.npcs.map(n => `<article class="campaignNpc"><div class="campaignNpcHead"><span>${esc(initials(n.name))}</span><div><h4>${esc(n.name)}</h4><small>${esc(n.role || 'Personagem importante')}</small></div></div>${n.affiliation ? `<p><b>Facção:</b> ${esc(n.affiliation)}</p>` : ''}${n.location ? `<p><b>Última localização:</b> ${esc(n.location)}</p>` : ''}<div class="campaignNpcText">${markdown(n.description)}</div><div class="campaignItemActions"><button data-action="edit-npc" data-id="${esc(n.id)}">Editar</button><button data-action="remove-npc" data-id="${esc(n.id)}">Remover</button></div></article>`).join('') || '<div class="campaignEmptyInline">Registre NPCs conhecidos pela equipe, suas facções e sua importância para a aventura.</div>'}</div></section>`;
  }
  function renderEvents(c) {
    const query = state.search.trim().toLocaleLowerCase('pt-BR');
    const events = [...c.events].reverse().filter(e => !query || [e.title,e.body,e.when,e.place,e.chapter,e.session].some(v => String(v || '').toLocaleLowerCase('pt-BR').includes(query)));
    const types = {event:'Acontecimento',discovery:'Descoberta',combat:'Conflito',roleplay:'Interpretação',milestone:'Marco'};
    return `<section class="campaignSection campaignChronicle" id="campaignHistory"><div class="campaignSectionHead"><div><span class="campaignKicker">ANAIS DA AVENTURA</span><h3>História da campanha</h3><p>Os acontecimentos vividos pela equipe, do mais recente ao mais antigo.</p></div><button class="campaignPrimary" data-action="add-event">+ Novo acontecimento</button></div>
      <div class="campaignChronicleTools"><input id="campaignEventSearch" type="search" value="${esc(state.search)}" placeholder="Buscar na história…" aria-label="Buscar acontecimentos"><span>${plural(c.events.length,'registro')}</span></div>
      <div class="campaignTimeline">${events.map((e, index) => `<article class="campaignMoment"><div class="campaignTimelineMark">${e.type === 'discovery' ? '✦' : e.type === 'combat' ? '⚔' : e.type === 'milestone' ? '★' : '◆'}</div><div class="campaignMomentBody"><div class="campaignMomentMeta"><span>${esc(types[e.type] || 'Acontecimento')}</span>${e.when ? `<span>${esc(e.when)}</span>` : ''}${e.session ? `<span>${esc(e.session)}</span>` : ''}</div><h4>${esc(e.title || 'Acontecimento sem título')}</h4>${e.chapter || e.place ? `<p class="campaignPlace">${[e.chapter,e.place].filter(Boolean).map(esc).join(' · ')}</p>` : ''}<div class="campaignProse">${markdown(e.body)}</div><div class="campaignItemActions"><button data-action="edit-event" data-id="${esc(e.id)}">Editar registro</button><button data-action="remove-event" data-id="${esc(e.id)}">Excluir</button></div></div></article>`).join('') || (query ? '<div class="campaignEmptyInline">Nenhum acontecimento corresponde à busca.</div>' : '<div class="campaignEmptyInline">O pergaminho está em branco. Registre a primeira sessão, uma descoberta ou um marco na jornada da equipe.</div>')}</div></section>`;
  }
  function renderActive(c) {
    return `<div class="campaignHero"><span class="campaignHeroTop">CRÔNICAS DE SILVENGARD <span>✦</span> ${esc(c.year || 'Era Contemporânea')}</span><h2>${esc(c.title)}</h2><p>${esc(c.subtitle || 'Uma história em construção no mundo conhecido.')}</p><div class="campaignPills"><span>${esc(c.status)}</span>${c.region ? `<span>⌖ ${esc(c.region)}</span>` : ''}<span>${plural(c.party.members.length,'aventureiro')}</span><span>${plural(c.events.length,'acontecimento')}</span></div><div class="campaignHeroActions"><button class="campaignPrimary" data-action="edit-about">✎ Editar campanha</button><button data-action="export">↓ Exportar JSON</button><button data-action="delete-campaign" class="campaignDanger">Excluir</button></div></div>
      <nav class="campaignAnchor" aria-label="Seções da campanha"><a href="#campaignContext">Contexto</a><a href="#campaignParty">Equipe</a><a href="#campaignJourney">Jornada</a><a href="#campaignNpcs">Personagens</a><a href="#campaignHistory">História</a></nav>
      <section class="campaignSection" id="campaignContext"><div class="campaignSectionHead"><div><span class="campaignKicker">ANTES DE TUDO COMEÇAR</span><h3>Contexto da campanha</h3></div><button data-action="edit-about">Editar</button></div><div class="campaignContextGrid"><div class="campaignProse">${markdown(c.premise)}</div><aside><span class="campaignKicker">ONDE ESTAMOS AGORA</span><div class="campaignProse">${markdown(c.summary)}</div></aside></div></section>
      ${renderParty(c)}${renderJourney(c)}${renderNpcs(c)}${renderEvents(c)}<footer class="campaignFoot">Arquivo de dados: <code>app/campaigns/${esc(c.id)}.json</code> · última gravação ${esc(stamp(c.updatedAt))} · alterações externas são relidas automaticamente.</footer>`;
  }
  function render() {
    if (panel.hidden) return;
    const c = state.active;
    panel.innerHTML = `<header class="campaignHeading"><div><div class="eyebrow">ATLAS VIVO · EDIÇÃO DO MESTRE</div><h2>Campanhas</h2></div><div class="campaignHeadingActions"><button data-action="refresh" title="Reler os arquivos do disco">↻ Sincronizar</button><button data-action="close" class="campaignClose" aria-label="Fechar campanhas">×</button></div></header>
      <div class="campaignLayout"><aside class="campaignLibrary"><div class="campaignLibraryHeader"><span>MINHAS CAMPANHAS</span><strong>${state.list.length}</strong></div><div class="campaignLibraryList">${state.list.map(item => `<button class="campaignLibraryItem ${item.id === state.activeId ? 'active' : ''}" data-action="choose" data-id="${esc(item.id)}"><span>✦</span><div><strong>${esc(item.title)}</strong><small>${esc(item.status)} · ${esc(item.year)}</small></div></button>`).join('') || '<p class="campaignLibraryEmpty">Crie sua primeira campanha para começar a crônica.</p>'}</div><button data-action="new" class="campaignPrimary campaignNew">+ Nova campanha</button><button data-action="import">↑ Importar campanha JSON</button><input type="file" id="campaignImport" accept=".json,application/json" hidden><div class="campaignLibraryHint">Os relatos ficam em <code>app/campaigns/</code>. É possível editar os arquivos externamente.</div></aside>
      <main class="campaignMain">${state.lastError ? `<div class="campaignError" role="alert">${esc(state.lastError)} <button data-action="refresh">Tentar novamente</button></div>` : ''}${state.errors.length ? `<div class="campaignError">${state.errors.map(i=>`${esc(i.file)}: ${esc(i.error)}`).join('<br>')}</div>` : ''}${c ? renderActive(c) : `<div class="campaignWelcome"><div>✦</div><small>AS CRÔNICAS AGUARDAM</small><h2>Toda lenda começa com uma companhia.</h2><p>Crie uma campanha para reunir os personagens, acompanhar sua jornada, apresentar aliados e inimigos e escrever a história das sessões.</p><button class="campaignPrimary" data-action="new">Criar primeira campanha</button></div>`}</main></div>`;
    const search = $('#campaignEventSearch');if (search) search.oninput = event => {
      state.search = event.target.value;
      // Só redesenha a cronologia, sem reiniciar o campo de busca.
      const section = $('#campaignHistory');
      if (section && state.active) {
        const holder = document.createElement('div');holder.innerHTML = renderEvents(state.active);
        section.querySelector('.campaignTimeline').innerHTML = holder.querySelector('.campaignTimeline').innerHTML;
      }
    };
    const select = $('#campaignJourneySelect');if (select) select.onchange = async event => {
      const choice = event.target.value;
      try {await mutate(item => {item.party.journeyPartyId = choice;});}
      catch {select.value = c.party.journeyPartyId || '';}
    };
    const visible = $('#campaignJourneyVisible');if (visible) visible.onchange = event => {
      journeys.setPartyVisible(c.party.journeyPartyId, event.target.checked);
      render();
    };
  }
  async function switchCampaign(id) {state.search='';try {await loadCampaign(id,true);} catch(error) {ensureServerError(error);}}
  function confirmRemove(message) {return window.confirm(message);}
  panel.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');if (!button) return;
    const action = button.dataset.action,id = button.dataset.id;
    try {
      switch (action) {
        case 'close': close();return;
        case 'refresh': await refreshSheets();await reload(true);notify('Campanhas relidas do disco.');return;
        case 'new': openNew();return;
        case 'choose': await switchCampaign(id);return;
        case 'import': $('#campaignImport').click();return;
        case 'edit-about': editAbout();return;
        case 'rename-party': dialog({title:'Nome da companhia',form:field('name','Nome do grupo de aventureiros',state.active.party.name, 'maxlength="140" required'),onSave:v => mutate(c => {c.party.name = v.name;})});return;
        case 'add-member': editMember();return;
        case 'edit-member': editMember(id);return;
        case 'remove-member': if(confirmRemove('Remover o personagem desta campanha? A ficha continuará disponível no Atlas.')) await mutate(c => {c.party.members = c.party.members.filter(m => m.id !== id);});return;
        case 'open-sheet': close();await onCharacterOpen(id);return;
        case 'update-sheet': characters.requestReplaceSheet(id);return;
        case 'import-sheet': close();onCharacterImport();return;
        case 'create-journey': {
          const route = journeys.createParty(state.active.party.name || state.active.title);
          await mutate(c => {c.party.journeyPartyId = route.id;});notify('Grupo de Jornadas criado e associado à campanha.');return;
        }
        case 'open-journey': close();onJourneysOpen(state.active.party.journeyPartyId);return;
        case 'add-npc': editNpc();return;
        case 'edit-npc': editNpc(id);return;
        case 'remove-npc': if(confirmRemove('Excluir este personagem importante da campanha?')) await mutate(c => {c.npcs = c.npcs.filter(n => n.id !== id);});return;
        case 'add-event': editEvent();return;
        case 'edit-event': editEvent(id);return;
        case 'remove-event': if(confirmRemove('Excluir este acontecimento da história? O arquivo anterior continuará no backup automático.')) await mutate(c => {c.events = c.events.filter(e => e.id !== id);});return;
        case 'export': {
          const clean = structuredClone(state.active);delete clean._revision;
          downloadJson(clean, `${state.active.id}.json`);notify('Crônica exportada para JSON.');return;
        }
        case 'delete-campaign': {
          const c = state.active;
          if (!confirmRemove(`Excluir "${c.title}"? O arquivo será movido para app/campaigns/.backups/ e poderá ser recuperado.`)) return;
          await request(`/api/campaigns/${encodeURIComponent(c.id)}`,'DELETE',null,c._revision);
          state.active=null;state.activeId='';await reload(true);notify('Campanha arquivada no backup e removida da lista.');return;
        }
      }
    } catch (error) {notify(error.message);}
  });
  panel.addEventListener('change', async event => {
    if (event.target.id !== 'campaignImport') return;
    const file = event.target.files?.[0];event.target.value='';if (!file) return;
    if (file.size > 2_000_000) {notify('Limite de 2 MB para o JSON de campanha.');return;}
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || typeof imported !== 'object' || !Array.isArray(imported.events) || !imported.party) throw Error('Arquivo não contém uma crônica no formato de campanha Silvengard.');
      openNew(imported);
    } catch(error) {notify('Não foi possível importar: ' + error.message);}
  });
  document.addEventListener('silvengard:characters-updated', async () => {
    if (!isOpen()) return;
    await refreshSheets();render();
  });
  document.addEventListener('silvengard:journeys-updated', () => {if (isOpen() && !state.editing) render();});
  // Não há leitura contínua de fundo: a checagem ocorre somente enquanto a aba está aberta.
  const timer = setInterval(() => {if (isOpen() && !state.editing) void reload();}, 7500);
  async function open() {
    panel.hidden = false;state.lastError = '';
    render();await Promise.all([refreshSheets(),reload(true)]);render();
  }
  function close() {panel.hidden=true;}
  return {open,close,reload,panel,dispose:() => clearInterval(timer),get active(){return state.active;}};
}
