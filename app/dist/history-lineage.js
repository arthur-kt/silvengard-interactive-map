import {escapeHTML as esc} from './history-core.js?v=37';

const ROYAL = /(rei|rainha|imperador|imperatriz|califa|príncipe|princesa|soberano|soberana|monarca|barão|baronesa|conde|condessa|duque|duquesa|príncipe)/i;
const HEIR = /(herdeiro|herdeira|sucess|primeiro na linha|candidat)/i;
const CONSORT = /(consorte|esposa|esposo|casamento|casada|casado)/i;
const MILITARY = /(chefe|capitão|capitã|comandante|cavaleiro|general|senhor de|senhora de|guarda|oficial|patrulha)/i;
const CIVIC = /(magistrad|jurista|administrad|estudios|escriba|chanceler|intendente|conselheiro|delegad|representante|pesquisador|médic)/i;

const HOUSES = ['#9a6b3f', '#3f6b62', '#6b4a7a', '#8a4b4b', '#4b6382', '#7a6a35', '#4f7a58', '#7a4f68', '#5c6b3f', '#6b5a45'];

export function houseColor(name, index = 0) {
  let hash = 0;
  for (const char of String(name || '')) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return HOUSES[(hash + index) % HOUSES.length];
}

export function treeStats(lineage) {
  let nodes = 0, generations = 0;
  const walk = (list, depth) => {
    if (list?.length) generations = Math.max(generations, depth);
    for (const node of list || []) {
      nodes += 1;
      walk(node.children, depth + 1);
    }
  };
  walk(lineage?.roots, 1);
  return {nodes, generations};
}

function sigil(node) {
  const role = `${node.role} ${node.name}`;
  if (node.name === '⋯' || /gera[çc][õo]es intermedi/i.test(node.role)) return '⋯';
  if (ROYAL.test(role)) return '♛';
  if (HEIR.test(role)) return '◈';
  if (CONSORT.test(role)) return '⚭';
  if (MILITARY.test(role)) return '⚔';
  if (CIVIC.test(role)) return '✦';
  if (/(casa|ramo|linhagem|família)/i.test(role)) return '❖';
  return '•';
}

function tone(node) {
  const role = `${node.role} ${node.name}`;
  if (node.name === '⋯') return 'gap';
  if (ROYAL.test(role)) return 'royal';
  if (HEIR.test(role)) return 'heir';
  if (CONSORT.test(role)) return 'consort';
  if (MILITARY.test(role)) return 'military';
  if (CIVIC.test(role)) return 'civic';
  return 'house';
}

function nodeHTML(node, path, lineageId) {
  const children = node.children || [];
  const isGap = node.name === '⋯' || tone(node) === 'gap';
  const meta = [node.role, node.years].filter(Boolean).join(' · ');
  const details = [node.role, node.years, node.note].filter(Boolean).join(' · ');
  const childHTML = children.length
    ? `<ul class="loreTreeChildren">${children.map((child, index) => nodeHTML(child, `${path}-${index}`, lineageId)).join('')}</ul>`
    : '';
  if (isGap) {
    return `<li class="loreTreeNode is-gap" data-node="${esc(path)}"><div class="loreTreeRow"><span class="loreGapCard">⋯ ${esc(node.note || node.role || 'gerações não registradas')}</span></div>${childHTML}</li>`;
  }
  return `<li class="loreTreeNode is-${tone(node)}" data-node="${esc(path)}" data-name="${esc(node.name)}" data-search="${esc(`${node.name} ${node.role} ${node.years}`.toLowerCase())}">
  <div class="loreTreeRow">
    <button type="button" class="loreNodeCard" data-select-node="${esc(path)}" data-detail="${esc(details)}">
      <span class="loreNodeSigil" aria-hidden="true">${sigil(node)}</span>
      <span class="loreNodeText"><b>${esc(node.name)}</b>${meta ? `<small>${esc(meta)}</small>` : ''}${node.spouse ? `<span class="loreNodeSpouse">⚭ ${esc(node.spouse)}</span>` : ''}</span>
    </button>
    ${children.length ? `<button type="button" class="loreNodeToggle" data-toggle-node="${esc(path)}" aria-label="Recolher ou expandir descendentes de ${esc(node.name)}" aria-expanded="true">▾</button>` : ''}
  </div>${childHTML}</li>`;
}

export function renderLineageTree(lineage, {compact = false, present = '1277'} = {}) {
  if (!lineage) return '';
  const stats = treeStats(lineage);
  const roots = (lineage.roots || []).map((node, index) => nodeHTML(node, String(index), lineage.id)).join('');
  const id = String(lineage.id || 'tree').replace(/[^a-zA-Z0-9]/g, '');
  return `<div class="loreTree ${compact ? 'is-compact' : ''}" data-lineage="${esc(lineage.id || '')}" id="tree-${esc(id)}">
  <div class="loreTreeBar">
    <div class="loreTreeHeading"><small>LINHAGEM · ${esc(present)}</small><strong>${esc(lineage.house || 'Casa')}</strong><span>${esc([lineage.seat, lineage.type].filter(Boolean).join(' · '))}</span></div>
    <div class="loreTreeTools" role="group" aria-label="Controles da árvore">
      <button type="button" data-tree-action="zoom-out" title="Afastar">−</button>
      <button type="button" data-tree-action="zoom-in" title="Aproximar">+</button>
      <button type="button" data-tree-action="fit" title="Tamanho original">Repor</button>
      <button type="button" data-tree-action="collapse" title="Recolher todos os ramos">Recolher</button>
      <button type="button" data-tree-action="expand" title="Abrir todos os ramos">Abrir</button>
    </div>
  </div>
  ${lineage.note ? `<p class="loreTreeNote">${esc(lineage.note)}</p>` : ''}
  <div class="loreTreeViewport" tabindex="0" aria-label="Árvore genealógica de ${esc(lineage.house || '')}">
    <div class="loreTreeCanvas"><ul class="loreTreeRoots">${roots}</ul></div>
  </div>
  <div class="loreTreeFoot">
    <span>${stats.nodes} ${stats.nodes === 1 ? 'nome' : 'nomes'} · ${stats.generations} ${stats.generations === 1 ? 'geração' : 'gerações'}</span>
    <label class="loreTreeFind">Localizar na árvore<input type="search" data-tree-search placeholder="Nome…" aria-label="Localizar nome na árvore"></label>
  </div>
  <div class="loreTreeDetail" aria-live="polite"><p class="loreTreeHint">Toque em um nome para ver os detalhes e destacar o ramo.</p></div>
</div>`;
}

function yearLabel(value) {
  return Number.isFinite(value) ? String(Math.round(value)) : '—';
}

export function renderSuccessionRuler(succession, {present = 1277, limit = 0} = {}) {
  if (!succession?.entries?.length) return '';
  const entries = succession.entries;
  const houseOf = entry => entry.house || succession.house || 'Casa governante';
  const houses = [...new Set(entries.map(houseOf))];
  const start = Math.min(...entries.map(entry => entry.start));
  const end = Math.max(present, ...entries.map(entry => entry.end));
  const span = Math.max(1, end - start);
  const step = span > 800 ? 100 : span > 320 ? 50 : span > 120 ? 25 : 10;
  const ticks = [];
  for (let year = Math.ceil(start / step) * step; year <= end; year += step) {
    ticks.push(`<span style="left:${((year - start) / span) * 100}%">${year}</span>`);
  }
  const bars = entries.map((entry, index) => {
    const left = ((entry.start - start) / span) * 100;
    const width = Math.max(((Math.max(entry.end, entry.start + 1) - entry.start) / span) * 100, 0.55);
    const color = houseColor(houseOf(entry), houses.indexOf(houseOf(entry)));
    const label = width > 7 ? esc(entry.name.replace(/^Grande\s+/, '')) : '';
    return `<button type="button" class="loreReign ${entry.ongoing ? 'is-ongoing' : ''}" data-reign="${index}" data-house="${esc(houseOf(entry))}" data-name="${esc(entry.name)}" data-years="${esc(entry.label)}" data-note="${esc(entry.note || '')}" data-start="${entry.start}" data-end="${entry.end}" style="left:${left}%;width:${width}%;--reign-color:${color}" title="${esc(`${entry.name} · ${entry.label}`)}"><span>${label}</span></button>`;
  }).join('');
  return `<div class="loreRuler" data-ruler="${esc(succession.id || '')}">
  <div class="loreRulerHead"><div><small>RÉGUA DE SUCESSÃO · ${esc(String(start))}–${esc(String(end))}</small><strong>${esc(succession.title || 'Reinados')}</strong><span>${entries.length} ${entries.length === 1 ? 'governante' : 'governantes'} ${limit ? `· ${limit} exibidos` : ''}</span></div>
  <div class="loreRulerHouses" role="group" aria-label="Filtrar por casa">${houses.map((house, index) => `<button type="button" data-house-filter="${esc(house)}" class="is-on" aria-pressed="true" style="--house-color:${houseColor(house, index)}">${esc(house)} <b>${entries.filter(entry => houseOf(entry) === house).length}</b></button>`).join('')}</div></div>
  <div class="loreRulerScroll"><div class="loreRulerTrack" style="min-width:${Math.max(560, Math.min(1500, entries.length * 42))}px">
    <div class="loreRulerAxis">${ticks.join('')}</div>
    <div class="loreRulerBars">${bars}</div>
  </div></div>
  <div class="loreRulerDetail" aria-live="polite"></div>
</div>`;
}

function showReign(ruler, index) {
  const detail = ruler.querySelector('.loreRulerDetail');
  const button = ruler.querySelector(`[data-reign="${index}"]`);
  if (!detail || !button) return;
  const entries = [...ruler.querySelectorAll('[data-reign]')];
  entries.forEach(item => item.classList.toggle('is-active', item === button));
  const house = button.dataset.house || 'Casa';
  const years = Math.max(1, Number(button.dataset.end) - Number(button.dataset.start));
  detail.innerHTML = `<span class="loreReignDot" style="--house-color:${houseColor(house)}"></span><div><small>${esc(house)} · ${esc(button.dataset.years || '')} · ${years} ${years === 1 ? 'ano' : 'anos'}</small><h4>${esc(button.dataset.name || '')}</h4>${button.dataset.note ? `<p>${esc(button.dataset.note)}</p>` : ''}${button.classList.contains('is-ongoing') ? '<span class="loreReignOngoing">governa em 1277</span>' : ''}</div>`;
}

export function bindLineages(root) {
  if (!root) return;
  for (const tree of root.querySelectorAll('.loreTree')) {
    if (tree.dataset.bound) continue;
    tree.dataset.bound = '1';
    let scale = 1;
    const canvas = tree.querySelector('.loreTreeCanvas');
    const apply = () => { if (canvas) canvas.style.transform = `scale(${scale})`; };
    const descendants = node => {
      const list = [];
      const walk = item => {
        for (const child of item.querySelectorAll(':scope > ul.loreTreeChildren > li.loreTreeNode')) { list.push(child); walk(child); }
      };
      walk(node);
      return list;
    };
    const select = button => {
      const li = button.closest('.loreTreeNode');
      if (!li) return;
      tree.querySelectorAll('.loreTreeNode').forEach(item => item.classList.remove('is-active', 'is-ancestor', 'is-descendant'));
      li.classList.add('is-active');
      for (let parent = li.parentElement?.closest('.loreTreeNode'); parent; parent = parent.parentElement?.closest('.loreTreeNode')) parent.classList.add('is-ancestor');
      descendants(li).forEach(item => item.classList.add('is-descendant'));
      const detail = tree.querySelector('.loreTreeDetail');
      if (detail) {
        const card = li.querySelector('.loreNodeCard');
        const name = li.dataset.name || '';
        const parts = (card?.dataset.detail || '').split(' · ').filter(Boolean);
        const spouse = (card?.querySelector('.loreNodeSpouse')?.textContent || '').replace(/^⚭\s*/, '');
        detail.innerHTML = `<small>RAMO EM DESTAQUE</small><h4>${esc(name)}</h4>${parts.length ? `<p>${esc(parts.join(' · '))}</p>` : ''}${spouse ? `<p class="loreTreeSpouse">⚭ Consorte: ${esc(spouse)}</p>` : ''}`;
      }
    };
    tree.addEventListener('click', event => {
      const target = event.target.closest('button');
      if (!target) return;
      const action = target.dataset.treeAction;
      if (action) {
        if (action === 'zoom-in') { scale = Math.min(1.6, scale + 0.1); apply(); }
        else if (action === 'zoom-out') { scale = Math.max(0.55, scale - 0.1); apply(); }
        else if (action === 'fit') { scale = 1; apply(); }
        else if (action === 'collapse') { tree.querySelectorAll('.loreTreeNode').forEach(item => { item.classList.add('is-collapsed'); const toggle = item.querySelector(':scope > .loreTreeRow .loreNodeToggle'); if (toggle) toggle.setAttribute('aria-expanded', 'false'); }); }
        else if (action === 'expand') { tree.querySelectorAll('.loreTreeNode').forEach(item => { item.classList.remove('is-collapsed'); const toggle = item.querySelector(':scope > .loreTreeRow .loreNodeToggle'); if (toggle) toggle.setAttribute('aria-expanded', 'true'); }); }
        return;
      }
      const toggle = target.dataset.toggleNode;
      if (toggle) {
        const li = target.closest('.loreTreeNode');
        li?.classList.toggle('is-collapsed');
        target.setAttribute('aria-expanded', String(!li?.classList.contains('is-collapsed')));
        return;
      }
      if (target.dataset.selectNode) { select(target); return; }
    });
    tree.querySelector('[data-tree-search]')?.addEventListener('input', event => {
      const query = event.target.value.trim().toLowerCase();
      tree.querySelectorAll('.loreTreeNode').forEach(item => {
        const match = query && (item.dataset.search || '').includes(query);
        item.classList.toggle('is-found', Boolean(match));
      });
      const first = tree.querySelector('.loreTreeNode.is-found');
      first?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    });
    const viewport = tree.querySelector('.loreTreeViewport');
    if (viewport) {
      let drag = null;
      viewport.addEventListener('pointerdown', event => {
        if (event.target.closest('button, input, label')) return;
        drag = {x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop};
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add('is-dragging');
      });
      viewport.addEventListener('pointermove', event => {
        if (!drag) return;
        viewport.scrollLeft = drag.left - (event.clientX - drag.x);
        viewport.scrollTop = drag.top - (event.clientY - drag.y);
      });
      const stop = () => { drag = null; viewport.classList.remove('is-dragging'); };
      viewport.addEventListener('pointerup', stop);
      viewport.addEventListener('pointercancel', stop);
    }
    const first = tree.querySelector('.loreNodeCard');
    if (first) select(first);
  }

  for (const ruler of root.querySelectorAll('.loreRuler')) {
    if (ruler.dataset.bound) continue;
    ruler.dataset.bound = '1';
    ruler.addEventListener('click', event => {
      const filter = event.target.closest('[data-house-filter]');
      if (filter) {
        const active = filter.classList.toggle('is-on');
        filter.setAttribute('aria-pressed', String(active));
        const houses = [...ruler.querySelectorAll('[data-house-filter]')].filter(button => button.classList.contains('is-on')).map(button => button.dataset.houseFilter);
        ruler.querySelectorAll('[data-reign]').forEach(bar => bar.classList.toggle('is-muted', houses.length > 0 && !houses.includes(bar.dataset.house)));
        return;
      }
      const reign = event.target.closest('[data-reign]');
      if (reign) showReign(ruler, reign.dataset.reign);
    });
    showReign(ruler, 0);
  }
}
