// Silvengard · mesa tática 2D (VTT-lite).
// Grade de 5 pés, tokens de fichas e monstros, distância, deslocamento e áreas de magia.

const STORAGE = 'silvengard-battleboard-v1';
const COLS = 30;
const ROWS = 20;
const FT_PER_CELL = 5;
const SIZE_CELLS = {tiny: 1, small: 1, medium: 1, large: 2, huge: 3, gargantuan: 4};

const BUILTIN_TEMPLATES = [
  {name: 'Emboscada de goblins', combatants: [{name: 'Goblin', count: 4}]},
  {name: 'Patrulha orc', combatants: [{name: 'Orc', count: 3}]},
  {name: 'Ninho de kobolds', combatants: [{name: 'Kobold', count: 6}]},
  {name: 'Ogro e goblins', combatants: [{name: 'Ogre', count: 1}, {name: 'Goblin', count: 3}]},
  {name: 'Cripta de esqueletos', combatants: [{name: 'Skeleton', count: 4}]},
  {name: 'Matilha de lobos', combatants: [{name: 'Wolf', count: 4}]},
  {name: 'Culto fanático', combatants: [{name: 'Cultist', count: 4}]},
  {name: 'Horda de zumbis', combatants: [{name: 'Zombie', count: 5}]},
];

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const fmt = (value) => Number(value || 0).toLocaleString('pt-BR', {maximumFractionDigits: 1});
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const rollDie = (sides) => 1 + Math.floor(Math.random() * Math.max(1, sides));

function loadBoard() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    if (parsed && Array.isArray(parsed.tokens)) {
      return {
        version: 1,
        tokens: parsed.tokens,
        round: Number(parsed.round) || 1,
        difficult: Array.isArray(parsed.difficult) ? parsed.difficult : [],
        saved: Array.isArray(parsed.saved) ? parsed.saved : [],
        combat: parsed.combat || {active: false, round: 1, turn: 0, order: []},
      };
    }
  } catch {
    // começa vazio
  }
  return {version: 1, tokens: [], round: 1, difficult: [], saved: [], combat: {active: false, round: 1, turn: 0, order: []}};
}

function sizeCells(size) {
  return SIZE_CELLS[String(size || '').toLowerCase()] || 1;
}

function tokenName(token) {
  return token.name || 'Token';
}

function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function distanceFt(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * FT_PER_CELL;
}

function movementCostFt(a, b, difficult) {
  let x = a.x;
  let y = a.y;
  let dx = Math.abs(b.x - x);
  let sx = x < b.x ? 1 : -1;
  let dy = -Math.abs(b.y - y);
  let sy = y < b.y ? 1 : -1;
  let error = dx + dy;
  let total = 0;
  while (x !== b.x || y !== b.y) {
    const e2 = 2 * error;
    if (e2 >= dy) { error += dy; x += sx; }
    if (e2 <= dx) { error += dx; y += sy; }
    total += difficult.has(`${x},${y}`) ? 10 : 5;
  }
  return total;
}

function spellArea(spell) {
  const text = `${spell.description || ''} ${spell.higherLevels || ''}`.toLowerCase();
  let match;
  if ((match = /(\d+)[- ]foot[- ]radius/.exec(text)) || (match = /(\d+)[- ]foot[- ]sphere/.exec(text))) {
    return {shape: 'circle', sizeFt: Number(match[1])};
  }
  if ((match = /(\d+)[- ]foot cone/.exec(text))) return {shape: 'cone', sizeFt: Number(match[1])};
  if ((match = /(\d+)[- ]foot line/.exec(text))) return {shape: 'line', sizeFt: Number(match[1])};
  if ((match = /(\d+)[- ]foot (?:cube|square)/.exec(text))) return {shape: 'square', sizeFt: Number(match[1])};
  return null;
}

function spellRange(spell) {
  const match = String(spell.range || '').match(/(\d+)\s*(?:feet|foot|pés|pes)/i);
  return match ? Number(match[1]) : null;
}

export function createBattleboard({characters, toast = () => {}} = {}) {
  const panel = document.createElement('aside');
  panel.id = 'battleboard';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Mesa tática 2D');
  document.body.append(panel);

  const data = loadBoard();
  let selectedId = null;
  let mode = 'move';
  let measure = null;
  let template = null;
  let spell = null;
  let dragging = null;
  let panning = null;
  let monsters = [];
  let templates = [];
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let cell = 40;
  let ox = 0;
  let oy = 0;
  let canvas;
  let ctx;
  let wrap;

  panel.innerHTML = `
    <div class="bbHead">
      <div>
        <div class="eyebrow">MESA TÁTICA · 1 QUADRADO = 5 PÉS</div>
        <h2>Tabuleiro</h2>
      </div>
      <div class="bbHeadActions">
        <button data-bb-mode="move" class="active">Mover</button>
        <button data-bb-mode="measure">Medir</button>
        <button data-bb-mode="template">Área</button>
        <button data-bb-mode="difficult">Difícil</button>
        <span class="bbPanGroup">
          <button data-bb-pan="left" title="Mover visão para a esquerda">←</button>
          <button data-bb-pan="up" title="Mover visão para cima">↑</button>
          <button data-bb-pan="down" title="Mover visão para baixo">↓</button>
          <button data-bb-pan="right" title="Mover visão para a direita">→</button>
          <button data-bb-zoom="out" title="Diminuir zoom">−</button>
          <button data-bb-zoom="in" title="Aumentar zoom">+</button>
          <button data-bb-zoom="reset" title="Reenquadrar">1:1</button>
        </span>
        <button data-bb-round>Nova rodada</button>
        <button id="bbClose" title="Fechar tabuleiro">×</button>
      </div>
    </div>
    <div class="bbBody">
      <aside class="bbLeft">
        <h3>Personagens</h3>
        <div id="bbCharacters" class="bbList"></div>
        <h3>Monstros</h3>
        <input id="bbMonsterSearch" type="search" placeholder="Buscar monstro…">
        <div id="bbMonsters" class="bbList bbMonsterList"></div>
      </aside>
      <div class="bbCanvasWrap" id="bbCanvasWrap">
        <canvas id="bbCanvas"></canvas>
        <div class="bbLegend">Arraste os tokens ou use as setas · 1 quadrado = 5 pés · 30 × 20 · sem scroll: use ← ↑ ↓ → e +/−</div>
      </div>
      <aside class="bbRight">
        <h3>Selecionado</h3>
        <div id="bbSelected" class="bbSelected"></div>
        <h3>Magia</h3>
        <label class="bbSpellLabel">Magia do personagem<select id="bbSpell"><option value="">Escolha uma magia…</option></select></label>
        <div id="bbAreaInfo" class="bbAreaInfo"></div>
        <h3>Iniciativa</h3>
        <div class="bbCombat" id="bbCombat"></div>
        <h3>Combates</h3>
        <div class="bbCombatActions">
          <button data-bb-save-combat>Salvar combate</button>
          <button data-bb-roll-initiative>Rolar iniciativa</button>
          <button data-bb-sync-fichas>Sincronizar PV</button>
        </div>
        <div id="bbSaved" class="bbSaved"></div>
        <h3>Modelos</h3>
        <div id="bbTemplates" class="bbSaved"></div>
        <button class="bbClearTerrain" data-bb-clear-difficult>Limpar terreno difícil</button>
        <div class="bbToolHint" id="bbToolHint">Use Mover/Medir/Área. Para deslocar sem arrastar, use as setas do token selecionado.</div>
      </aside>
    </div>`;

  const $ = (selector) => panel.querySelector(selector);

  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({
        version: 1,
        tokens: data.tokens,
        round: data.round,
        difficult: data.difficult,
        saved: data.saved,
        combat: data.combat,
      }));
    } catch {
      // sem persistência
    }
  }

  function selectedToken() {
    return data.tokens.find((token) => token.id === selectedId) || null;
  }

  function difficultSet() {
    return new Set(data.difficult || []);
  }

  function isDifficult(x, y) {
    return (data.difficult || []).includes(`${x},${y}`);
  }

  function moveSelectedBy(dx, dy) {
    const token = selectedToken();
    if (!token) return toast('Selecione um token primeiro.', true);
    const next = {
      x: Math.max(0, Math.min(COLS - token.size, token.x + dx)),
      y: Math.max(0, Math.min(ROWS - token.size, token.y + dy)),
    };
    if (next.x === token.x && next.y === token.y) return;
    const cost = movementCostFt({x: token.x, y: token.y}, next, difficultSet());
    token.x = next.x;
    token.y = next.y;
    token.moved = num(token.moved) + cost;
    if (token.moved > token.speed) toast(`${token.name} moveu ${token.moved} pés (deslocamento ${token.speed} pés).`, true);
    save();
    renderSelected();
    draw();
  }

  function sheetForToken(token) {
    if (token.kind !== 'character') return null;
    return characters.getSheets().find((sheet) => String(sheet.id) === String(token.sheetId)) || null;
  }

  function syncSheets() {
    const sheets = characters.getSheets();
    for (const token of data.tokens) {
      if (token.kind !== 'character') continue;
      const sheet = sheets.find((entry) => String(entry.id) === String(token.sheetId));
      if (!sheet) continue;
      token.name = sheet.name;
      token.speed = sheet.speed;
      token.maxHp = sheet.hp.max;
      token.hp = Math.min(sheet.hp.current, sheet.hp.max);
      token.initiativeBonus = Number(sheet.initiative) || 0;
    }
    save();
    renderSelected();
    renderCombat();
    draw();
  }

  function findFreeCell(size = 1) {
    const centerX = Math.floor((COLS - size) / 2);
    const centerY = Math.floor((ROWS - size) / 2);
    for (let radius = 0; radius < Math.max(COLS, ROWS); radius += 1) {
      for (let y = Math.max(0, centerY - radius); y <= Math.min(ROWS - size, centerY + radius); y += 1) {
        for (let x = Math.max(0, centerX - radius); x <= Math.min(COLS - size, centerX + radius); x += 1) {
          if (!data.tokens.some((token) => x < token.x + token.size && x + size > token.x && y < token.y + token.size && y + size > token.y)) return {x, y};
        }
      }
    }
    return {x: 0, y: 0};
  }

  function addCharacter(sheet) {
    if (!sheet) return;
    const existing = data.tokens.find((token) => token.kind === 'character' && String(token.sheetId) === String(sheet.id));
    if (existing) {
      selectedId = existing.id;
      renderSelected();
      draw();
      return toast(`${sheet.name} já está no tabuleiro.`);
    }
    const position = findFreeCell(1);
    data.tokens.push({
      id: `char:${sheet.id}`,
      kind: 'character',
      sheetId: sheet.id,
      name: sheet.name,
      x: position.x,
      y: position.y,
      size: 1,
      speed: Number(sheet.speed) || 30,
      hp: Number(sheet.hp?.current) || 0,
      maxHp: Number(sheet.hp?.max) || 0,
      color: '#d4b984',
      moved: 0,
      initiativeBonus: Number(sheet.initiative) || 0,
    });
    selectedId = `char:${sheet.id}`;
    save();
    renderCharacters();
    renderSelected();
    renderCombat();
    draw();
    toast(`${sheet.name} entrou no tabuleiro.`);
  }

  function addMonster(monster) {
    if (!monster) return;
    const size = sizeCells(monster.size);
    const position = findFreeCell(size);
    const token = {
      id: `monster:${monster.id}:${Date.now()}`,
      kind: 'monster',
      monsterId: monster.id,
      name: monster.name,
      x: position.x,
      y: position.y,
      size,
      speed: Number(monster.speed) || 30,
      hp: Number(monster.hp) || 1,
      maxHp: Number(monster.hp) || 1,
      color: '#b8675e',
      moved: 0,
      initiativeBonus: Number(monster.initiative) || 0,
    };
    data.tokens.push(token);
    selectedId = token.id;
    save();
    renderSelected();
    renderCombat();
    draw();
    toast(`${monster.name} entrou no tabuleiro.`);
  }

  function renderCharacters() {
    const box = $('#bbCharacters');
    if (!box) return;
    const sheets = characters.getSheets();
    box.innerHTML = sheets.map((sheet) => {
      const active = data.tokens.some((token) => token.kind === 'character' && String(token.sheetId) === String(sheet.id));
      return `<button data-bb-add-sheet="${esc(sheet.id)}"><span><b>${esc(sheet.name)}</b><small>${esc(sheet.classLine)} · ${sheet.hp.current}/${sheet.hp.max} PV · ${sheet.speed} pés</small></span><em>${active ? 'na mesa' : '+'}</em></button>`;
    }).join('') || '<p class="charMuted">Nenhuma ficha salva. Importe uma na aba Fichas.</p>';
    box.querySelectorAll('[data-bb-add-sheet]').forEach((button) => {
      button.onclick = () => addCharacter(sheets.find((sheet) => String(sheet.id) === String(button.dataset.bbAddSheet)));
    });
  }

  function renderMonsterResults() {
    const box = $('#bbMonsters');
    if (!box) return;
    const query = String($('#bbMonsterSearch')?.value || '').trim().toLowerCase();
    const matches = monsters.filter((monster) => monster.name.toLowerCase().includes(query)).slice(0, 30);
    box.innerHTML = matches.map((monster) => `<button data-bb-add-monster="${esc(monster.id)}"><span><b>${esc(monster.name)}</b><small>CR ${esc(monster.cr ?? '—')} · ${fmt(monster.hp)} PV · ${monster.speed || 30} pés</small></span><em>+</em></button>`).join('') || '<p class="charMuted">Nenhum monstro encontrado.</p>';
    box.querySelectorAll('[data-bb-add-monster]').forEach((button) => {
      button.onclick = () => addMonster(monsters.find((monster) => String(monster.id) === String(button.dataset.bbAddMonster)));
    });
  }

  async function loadTemplates() {
    if (!templates.length) templates = structuredClone(BUILTIN_TEMPLATES);
    renderTemplates();
  }

  async function loadMonsters() {
    if (monsters.length) return;
    try {
      const response = await fetch('./5e/monsters.json');
      if (!response.ok) throw new Error('Pacote de monstros não encontrado.');
      monsters = await response.json();
      renderMonsterResults();
    } catch (error) {
      const box = $('#bbMonsters');
      if (box) box.innerHTML = `<div class="charError">${esc(error.message)}</div>`;
    }
  }

  function renderSelected() {
    const box = $('#bbSelected');
    if (!box) return;
    const token = selectedToken();
    if (!token) {
      box.innerHTML = '<p class="charMuted">Clique em um token para ver detalhes.</p>';
      renderSpellOptions();
      return;
    }
    box.innerHTML = `
      <div class="bbSelectedHead"><b>${esc(tokenName(token))}</b><span>${token.kind === 'monster' ? 'Monstro' : 'Personagem'}</span></div>
      <div class="bbSelectedStats">
        <span><small>PV</small><b>${token.hp}/${token.maxHp}</b></span>
        <span><small>Deslocamento</small><b>${token.speed} pés</b></span>
        <span><small>Movido</small><b>${token.moved || 0} pés</b></span>
        <span><small>Posição</small><b>${token.x}, ${token.y}</b></span>
        <span><small>Iniciativa</small><b>${token.initiative ?? '—'}</b></span>
        <span><small>Bônus</small><b>${token.initiativeBonus >= 0 ? '+' : ''}${token.initiativeBonus || 0}</b></span>
      </div>
      <div class="bbMovePad">
        <button data-bb-step="-1,0">←</button>
        <button data-bb-step="0,-1">↑</button>
        <button data-bb-step="0,1">↓</button>
        <button data-bb-step="1,0">→</button>
      </div>
      <div class="bbSelectedActions">
        <button data-bb-hp="-1">−1 PV</button><button data-bb-hp="1">+1 PV</button>
        <button data-bb-remove>Remover</button>
      </div>`;
    box.querySelectorAll('[data-bb-hp]').forEach((button) => {
      button.onclick = () => {
        token.hp = Math.max(0, Math.min(token.maxHp, Number(token.hp) + Number(button.dataset.bbHp)));
        if (token.kind === 'character' && token.sheetId != null) characters.setSheetHp(token.sheetId, token.hp);
        save();
        renderSelected();
        draw();
      };
    });
    box.querySelector('[data-bb-remove]')?.addEventListener('click', () => {
      data.tokens = data.tokens.filter((entry) => entry.id !== token.id);
      data.combat.order = (data.combat.order || []).filter((id) => id !== token.id);
      data.combat.turn = Math.max(0, Math.min(data.combat.turn, data.combat.order.length - 1));
      selectedId = null;
      save();
      renderSelected();
      renderCharacters();
      renderCombat();
      draw();
    });
    renderSpellOptions();
  }

  function renderCombat() {
    const box = $('#bbCombat');
    if (!box) return;
    const combat = data.combat;
    if (!combat?.active || !combat.order?.length) {
      box.innerHTML = '<p class="charMuted">Role a iniciativa para começar o combate.</p>';
      return;
    }
    const currentId = combat.order[combat.turn];
    const current = data.tokens.find((token) => token.id === currentId);
    box.innerHTML = `<div class="bbCombatHead"><span>Rodada ${combat.round}</span><b>${current ? esc(current.name) : '—'}</b></div>
      <div class="bbCombatOrder">${combat.order.map((id, index) => {
        const token = data.tokens.find((entry) => entry.id === id);
        if (!token) return '';
        return `<button data-bb-select="${esc(token.id)}" class="${index === combat.turn ? 'current' : ''}"><span>${index + 1}. ${esc(token.name)}</span><b>${token.initiative ?? '—'}</b></button>`;
      }).join('')}</div>
      <div class="bbCombatActions"><button data-bb-prev>◀ Anterior</button><button data-bb-next>Próximo ▶</button></div>`;
    box.querySelectorAll('[data-bb-select]').forEach((button) => {
      button.onclick = () => {
        selectedId = button.dataset.bbSelect;
        renderSelected();
        draw();
      };
    });
    box.querySelector('[data-bb-next]')?.addEventListener('click', nextTurn);
    box.querySelector('[data-bb-prev]')?.addEventListener('click', previousTurn);
  }

  function renderSavedCombats() {
    const box = $('#bbSaved');
    if (!box) return;
    box.innerHTML = data.saved.length
      ? data.saved.map((entry) => `<div class="bbSavedRow"><span>${esc(entry.name)}<small>${entry.tokens.length} tokens</small></span><button data-bb-load="${esc(entry.id)}">Carregar</button><button data-bb-delete-saved="${esc(entry.id)}">×</button></div>`).join('')
      : '<p class="charMuted">Nenhum combate salvo.</p>';
    box.querySelectorAll('[data-bb-load]').forEach((button) => {
      button.onclick = () => loadCombat(button.dataset.bbLoad);
    });
    box.querySelectorAll('[data-bb-delete-saved]').forEach((button) => {
      button.onclick = () => {
        data.saved = data.saved.filter((entry) => String(entry.id) !== String(button.dataset.bbDeleteSaved));
        save();
        renderSavedCombats();
      };
    });
  }

  function renderTemplates() {
    const box = $('#bbTemplates');
    if (!box) return;
    box.innerHTML = templates.length
      ? templates.map((entry, index) => `<button class="bbTemplateRow" data-bb-template="${index}"><span>${esc(entry.name)}</span><small>${(entry.combatants || []).length} combatentes</small></button>`).join('')
      : '<p class="charMuted">Carregando modelos…</p>';
    box.querySelectorAll('[data-bb-template]').forEach((button) => {
      button.onclick = () => prepareTemplate(templates[Number(button.dataset.bbTemplate)]);
    });
  }

  function rollInitiative() {
    for (const token of data.tokens) {
      token.initiative = rollDie(20) + num(token.initiativeBonus);
      token.moved = 0;
    }
    data.combat = {
      active: true,
      round: 1,
      turn: 0,
      order: [...data.tokens].sort((a, b) => num(b.initiative) - num(a.initiative)).map((token) => token.id),
    };
    save();
    renderCombat();
    renderSelected();
    draw();
    toast('Iniciativa rolada.');
  }

  function nextTurn() {
    if (!data.combat?.order?.length) return rollInitiative();
    const token = data.tokens.find((entry) => entry.id === data.combat.order[data.combat.turn]);
    if (token) token.moved = 0;
    data.combat.turn += 1;
    if (data.combat.turn >= data.combat.order.length) {
      data.combat.turn = 0;
      data.combat.round += 1;
    }
    const next = data.tokens.find((entry) => entry.id === data.combat.order[data.combat.turn]);
    if (next) next.moved = 0;
    selectedId = next?.id || selectedId;
    save();
    renderCombat();
    renderSelected();
    draw();
  }

  function previousTurn() {
    if (!data.combat?.order?.length) return;
    data.combat.turn -= 1;
    if (data.combat.turn < 0) {
      data.combat.turn = data.combat.order.length - 1;
      data.combat.round = Math.max(1, data.combat.round - 1);
    }
    const token = data.tokens.find((entry) => entry.id === data.combat.order[data.combat.turn]);
    if (token) token.moved = 0;
    selectedId = token?.id || selectedId;
    save();
    renderCombat();
    renderSelected();
    draw();
  }

  function saveCombat() {
    const name = prompt('Nome do combate:', `Combate ${data.saved.length + 1}`);
    if (!name) return;
    data.saved.unshift({
      id: `combat-${Date.now()}`,
      name: name.slice(0, 80),
      createdAt: new Date().toISOString(),
      tokens: structuredClone(data.tokens),
      difficult: [...data.difficult],
      combat: structuredClone(data.combat),
    });
    data.saved = data.saved.slice(0, 20);
    save();
    renderSavedCombats();
    toast('Combate salvo.');
  }

  function loadCombat(id) {
    const entry = data.saved.find((combat) => String(combat.id) === String(id));
    if (!entry) return;
    data.tokens = structuredClone(entry.tokens || []);
    data.difficult = [...(entry.difficult || [])];
    data.combat = structuredClone(entry.combat || {active: false, round: 1, turn: 0, order: []});
    selectedId = null;
    save();
    renderSelected();
    renderCombat();
    renderCharacters();
    draw();
    toast(`Combate “${entry.name}” carregado.`);
  }

  function prepareTemplate(template) {
    if (!template) return;
    let added = 0;
    for (const combatant of template.combatants || []) {
      const monster = monsters.find((entry) => entry.name.toLowerCase() === String(combatant.name).toLowerCase());
      if (!monster) continue;
      for (let index = 0; index < Math.max(1, Number(combatant.count) || 1); index += 1) {
        addMonster(monster);
        added += 1;
      }
    }
    if (added) {
      rollInitiative();
      toast(`Modelo “${template.name}” preparado com ${added} monstros.`);
    } else {
      toast('Não encontrei os monstros deste modelo no bestiário.', true);
    }
  }

  function renderSpellOptions() {
    const select = $('#bbSpell');
    const info = $('#bbAreaInfo');
    if (!select) return;
    const token = selectedToken();
    const sheet = token ? sheetForToken(token) : null;
    const spells = (sheet?.spells || []).filter((entry) => spellArea(entry) || spellRange(entry));
    select.innerHTML = `<option value="">${spells.length ? 'Escolha uma magia…' : 'Sem magias de área/alcance'}</option>${spells.map((entry, index) => `<option value="${index}">${esc(entry.name)}${spellArea(entry) ? ` · ${spellArea(entry).sizeFt} pés` : ''}</option>`).join('')}`;
    select.onchange = () => {
      const chosen = spells[Number(select.value)];
      spell = chosen || null;
      template = null;
      if (spell) {
        mode = 'template';
        setModeButton();
      }
      renderAreaInfo(spells, select);
      draw();
    };
    renderAreaInfo(spells, select);
    if (info && !token) info.innerHTML = '<p class="charMuted">Selecione um personagem para escolher magias.</p>';
  }

  function renderAreaInfo(spells, select) {
    const info = $('#bbAreaInfo');
    if (!info) return;
    const chosen = spells?.[Number(select?.value)];
    if (!chosen) {
      info.innerHTML = '<p class="charMuted">Escolha uma magia e clique no mapa para posicionar a área.</p>';
      return;
    }
    const area = spellArea(chosen);
    const range = spellRange(chosen);
    info.innerHTML = `<b>${esc(chosen.name)}</b><p>${area ? `Área: ${esc(area.shape)} de ${area.sizeFt} pés` : 'Sem área descrita'}${range ? ` · alcance ${range} pés` : ''}.</p><p class="charMuted">Clique no mapa para posicionar.</p>`;
  }

  function setModeButton() {
    panel.querySelectorAll('[data-bb-mode]').forEach((button) => button.classList.toggle('active', button.dataset.bbMode === mode));
    const hint = $('#bbToolHint');
    if (hint) hint.textContent = mode === 'move' ? 'Arraste os tokens ou use as setas do token. Arraste o fundo para mover a visão.' : mode === 'measure' ? 'Clique em dois quadrados para medir.' : mode === 'difficult' ? 'Clique nos quadrados para marcar/desmarcar terreno difícil.' : 'Escolha uma magia e clique no mapa para posicionar a área.';
  }

  function cellAt(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(COLS - 1, Math.floor((event.clientX - rect.left - ox) / cell))),
      y: Math.max(0, Math.min(ROWS - 1, Math.floor((event.clientY - rect.top - oy) / cell))),
    };
  }

  function tokenAt(x, y) {
    return [...data.tokens].reverse().find((token) => x >= token.x && x < token.x + token.size && y >= token.y && y < token.y + token.size) || null;
  }

  function tokenCenter(token) {
    return {x: token.x + token.size / 2, y: token.y + token.size / 2};
  }

  function draw() {
    if (!ctx || !canvas || panel.hidden) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const backingWidth = Math.round(width * dpr);
    const backingHeight = Math.round(height * dpr);
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#14252b';
    ctx.fillRect(0, 0, width, height);
    const baseCell = Math.max(18, Math.min((width - 24) / COLS, (height - 24) / ROWS));
    cell = baseCell * zoom;
    ox = (width - COLS * cell) / 2 + panX;
    oy = (height - ROWS * cell) / 2 + panY;

    ctx.save();
    ctx.translate(ox, oy);
    for (let x = 0; x <= COLS; x += 1) {
      ctx.strokeStyle = x % 5 === 0 ? '#c9ad6b30' : '#c9d5c90d';
      ctx.lineWidth = x % 5 === 0 ? 1.2 : 0.7;
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, ROWS * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y += 1) {
      ctx.strokeStyle = y % 5 === 0 ? '#c9ad6b30' : '#c9d5c90d';
      ctx.lineWidth = y % 5 === 0 ? 1.2 : 0.7;
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(COLS * cell, y * cell);
      ctx.stroke();
    }
    ctx.strokeStyle = '#c9ad6b66';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, COLS * cell, ROWS * cell);

    ctx.fillStyle = '#a85b5526';
    for (const key of data.difficult || []) {
      const [x, y] = String(key).split(',').map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) ctx.fillRect(x * cell, y * cell, cell, cell);
    }

    if (template) drawTemplate(ctx);
    if (measure?.start) drawMeasure(ctx);
    for (const token of data.tokens) drawToken(ctx, token);
    ctx.restore();
  }

  function drawToken(context, token) {
    const px = token.x * cell;
    const py = token.y * cell;
    const width = token.size * cell;
    const radius = Math.min(width, cell * 1.2) * 0.42;
    const cx = px + width / 2;
    const cy = py + width / 2;
    context.save();
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fillStyle = token.color || '#d4b984';
    context.globalAlpha = 0.88;
    context.fill();
    context.globalAlpha = 1;
    const currentTurn = data.combat?.active && data.combat.order?.[data.combat.turn] === token.id;
    context.lineWidth = currentTurn ? 4 : token.id === selectedId ? 3 : 1.5;
    context.strokeStyle = currentTurn ? '#ffffff' : token.id === selectedId ? '#fff4cf' : '#0b171b';
    context.stroke();
    context.fillStyle = '#102127';
    context.font = `600 ${Math.max(7, Math.min(14, radius * 0.75))}px 'DM Sans', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(initials(token.name), cx, cy);
    context.font = `8px 'DM Sans', sans-serif`;
    context.fillStyle = '#e8ddc5';
    context.textBaseline = 'top';
    context.fillText(tokenName(token).slice(0, 22), cx, py + width + 3);
    if (token.maxHp) {
      const barWidth = Math.max(16, width * 0.7);
      const barX = cx - barWidth / 2;
      const barY = py + width - 4;
      context.fillStyle = '#1b2a2f';
      context.fillRect(barX, barY, barWidth, 4);
      context.fillStyle = token.hp > 0 ? '#91b99a' : '#a85b55';
      context.fillRect(barX, barY, barWidth * Math.max(0, Math.min(1, token.hp / token.maxHp)), 4);
    }
    if (token.moved > token.speed) {
      context.fillStyle = '#ff9b8d';
      context.font = '8px "DM Sans", sans-serif';
      context.fillText('acima do deslocamento', cx, py - 11);
    }
    context.restore();
  }

  function drawMeasure(context) {
    const start = measure.start;
    const end = measure.end || measure.hover;
    if (!end) return;
    const ax = (start.x + 0.5) * cell;
    const ay = (start.y + 0.5) * cell;
    const bx = (end.x + 0.5) * cell;
    const by = (end.y + 0.5) * cell;
    context.save();
    context.strokeStyle = '#f0d58e';
    context.lineWidth = 2;
    context.setLineDash([8, 6]);
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = '#f0d58e';
    context.font = '600 11px "DM Sans", sans-serif';
    context.textAlign = 'center';
    context.fillText(`${distanceFt(start, end)} pés`, (ax + bx) / 2, (ay + by) / 2 - 7);
    context.restore();
  }

  function drawTemplate(context) {
    const area = template.area;
    const origin = template.origin;
    const target = template.target || origin;
    const length = (area.sizeFt / FT_PER_CELL) * cell;
    const color = template.outOfRange ? '#ff8f86' : '#e8c97d';
    context.save();
    context.fillStyle = `${color}33`;
    context.strokeStyle = color;
    context.lineWidth = 2;
    if (area.shape === 'circle') {
      const cx = (origin.x + 0.5) * cell;
      const cy = (origin.y + 0.5) * cell;
      context.beginPath();
      context.arc(cx, cy, length, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    } else if (area.shape === 'square') {
      const side = length;
      const cx = (origin.x + 0.5) * cell;
      const cy = (origin.y + 0.5) * cell;
      context.fillRect(cx - side / 2, cy - side / 2, side, side);
      context.strokeRect(cx - side / 2, cy - side / 2, side, side);
    } else if (area.shape === 'cone' || area.shape === 'line') {
      const ax = (origin.x + 0.5) * cell;
      const ay = (origin.y + 0.5) * cell;
      const angle = Math.atan2((target.y + 0.5) * cell - ay, (target.x + 0.5) * cell - ax);
      if (area.shape === 'cone') {
        context.beginPath();
        context.moveTo(ax, ay);
        context.arc(ax, ay, length, angle - Math.PI / 7, angle + Math.PI / 7);
        context.closePath();
        context.fill();
        context.stroke();
      } else {
        context.translate(ax, ay);
        context.rotate(angle);
        context.fillRect(0, -cell / 2, length, cell);
        context.strokeRect(0, -cell / 2, length, cell);
      }
    }
    context.fillStyle = color;
    context.font = '600 10px "DM Sans", sans-serif';
    context.textAlign = 'left';
    context.fillText(`${template.spell.name} · ${area.sizeFt} pés`, (origin.x + 0.5) * cell + 5, (origin.y + 0.5) * cell - 6);
    context.restore();
  }

  function placeTemplate(point) {
    if (!spell) return toast('Escolha uma magia primeiro.', true);
    const area = spellArea(spell);
    if (!area) return toast('Essa magia não tem área descrita.', true);
    const token = selectedToken();
    let origin = point;
    if (area.shape === 'cone' || area.shape === 'line') {
      if (token) origin = {x: Math.floor(tokenCenter(token).x), y: Math.floor(tokenCenter(token).y)};
    }
    const range = spellRange(spell);
    const outOfRange = !!(token && range != null && distanceFt({x: Math.floor(tokenCenter(token).x), y: Math.floor(tokenCenter(token).y)}, point) > range);
    template = {spell, area, origin, target: point, outOfRange};
    draw();
    if (outOfRange) toast(`${spell.name}: alvo fora do alcance de ${range} pés.`, true);
  }

  canvas = $('#bbCanvas');
  wrap = $('#bbCanvasWrap');
  ctx = canvas.getContext('2d');

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoom = Math.max(0.4, Math.min(3, zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
    draw();
  }, {passive: false});

  canvas.addEventListener('pointerdown', (event) => {
    const point = cellAt(event);
    if (mode === 'measure') {
      if (!measure?.start || measure.end) measure = {start: point, end: null, hover: null};
      else {
        measure.end = point;
        toast(`${distanceFt(measure.start, measure.end)} pés.`);
      }
      draw();
      return;
    }
    if (mode === 'template') {
      placeTemplate(point);
      return;
    }
    if (mode === 'difficult') {
      const key = `${point.x},${point.y}`;
      if (isDifficult(point.x, point.y)) data.difficult = data.difficult.filter((entry) => entry !== key);
      else data.difficult.push(key);
      save();
      draw();
      return;
    }
    const token = tokenAt(point.x, point.y);
    selectedId = token?.id || null;
    if (token) {
      dragging = {token, startX: token.x, startY: token.y, movedBefore: num(token.moved), offsetX: point.x - token.x, offsetY: point.y - token.y};
      try { canvas.setPointerCapture(event.pointerId); } catch { /* ponteiro sintético */ }
    } else if (mode === 'move') {
      panning = {startX: event.clientX, startY: event.clientY, panX, panY};
      try { canvas.setPointerCapture(event.pointerId); } catch { /* ponteiro sintético */ }
    }
    renderSelected();
    draw();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (panning) {
      panX = panning.panX + (event.clientX - panning.startX);
      panY = panning.panY + (event.clientY - panning.startY);
      draw();
      return;
    }
    if (mode === 'measure' && measure?.start && !measure.end) {
      measure.hover = cellAt(event);
      draw();
      return;
    }
    if (dragging) {
      const point = cellAt(event);
      const token = dragging.token;
      token.x = Math.max(0, Math.min(COLS - token.size, Math.round(point.x - dragging.offsetX)));
      token.y = Math.max(0, Math.min(ROWS - token.size, Math.round(point.y - dragging.offsetY)));
      token.moved = num(dragging.movedBefore) + movementCostFt({x: dragging.startX, y: dragging.startY}, {x: token.x, y: token.y}, difficultSet());
      draw();
    }
  });

  canvas.addEventListener('pointerup', (event) => {
    if (panning) {
      panning = null;
      try { canvas.releasePointerCapture(event.pointerId); } catch { /* ok */ }
      return;
    }
    if (!dragging) return;
    const token = dragging.token;
    dragging = null;
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* ok */ }
    if (token.moved > token.speed) toast(`${tokenName(token)} moveu ${token.moved} pés (deslocamento ${token.speed} pés).`, true);
    save();
    renderSelected();
    draw();
  });

  panel.addEventListener('click', (event) => {
    const step = event.target.closest('[data-bb-step]');
    if (step) {
      const [dx, dy] = step.dataset.bbStep.split(',').map(Number);
      return moveSelectedBy(dx, dy);
    }
    const pan = event.target.closest('[data-bb-pan]');
    if (pan) {
      const amount = 80;
      if (pan.dataset.bbPan === 'left') panX -= amount;
      if (pan.dataset.bbPan === 'right') panX += amount;
      if (pan.dataset.bbPan === 'up') panY -= amount;
      if (pan.dataset.bbPan === 'down') panY += amount;
      draw();
      return;
    }
    const zoomButton = event.target.closest('[data-bb-zoom]');
    if (zoomButton) {
      if (zoomButton.dataset.bbZoom === 'in') zoom = Math.min(3, zoom * 1.2);
      if (zoomButton.dataset.bbZoom === 'out') zoom = Math.max(0.4, zoom / 1.2);
      if (zoomButton.dataset.bbZoom === 'reset') { zoom = 1; panX = 0; panY = 0; }
      draw();
      return;
    }
    if (event.target.closest('[data-bb-save-combat]')) return saveCombat();
    if (event.target.closest('[data-bb-roll-initiative]')) return rollInitiative();
    if (event.target.closest('[data-bb-sync-fichas]')) {
      syncSheets();
      return toast('PV e deslocamento sincronizados com as fichas.');
    }
    if (event.target.closest('[data-bb-clear-difficult]')) {
      data.difficult = [];
      save();
      draw();
      return;
    }
    const modeButton = event.target.closest('[data-bb-mode]');
    if (modeButton) {
      mode = modeButton.dataset.bbMode;
      setModeButton();
      if (mode !== 'template') template = null;
      draw();
      return;
    }
    if (event.target.closest('[data-bb-round]')) {
      data.round += 1;
      if (data.combat?.active) {
        data.combat.round += 1;
        data.combat.turn = 0;
      }
      for (const token of data.tokens) token.moved = 0;
      save();
      renderCombat();
      renderSelected();
      draw();
      return toast(`Rodada ${data.combat?.active ? data.combat.round : data.round}.`);
    }
    if (event.target.closest('#bbClose')) return close();
  });

  $('#bbMonsterSearch').oninput = renderMonsterResults;

  const observer = new ResizeObserver(() => draw());
  observer.observe(wrap);
  window.addEventListener('resize', draw);

  async function open() {
    panel.hidden = false;
    try {
      await characters.refresh();
    } catch {
      // fichas continuam disponíveis em memória
    }
    setModeButton();
    renderCharacters();
    renderSelected();
    renderCombat();
    renderSavedCombats();
    renderTemplates();
    syncSheets();
    await Promise.all([loadMonsters(), loadTemplates()]);
    draw();
  }

  function close() {
    panel.hidden = true;
    save();
  }

  return {open, close, panel};
}
