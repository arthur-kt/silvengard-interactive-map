// Silvengard · Fichas, compêndio 5e e criador provisório.
// Módulo de interface: IndexedDB + fetch dos pacotes em ./5e/.
import {
  ABILITIES,
  SKILLS,
  averageHpGain,
  isAsiLevel,
  levelForXp,
  levelUpCah,
  levelUpNative,
  makeNativeCharacter,
  normalizeCah,
  normalizeNative,
  num,
  signed,
  sourceName,
  spellSlotsFor,
  XP_THRESHOLDS,
  xpForLevel,
} from './sheet-core.js?v=5';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const fmt = (value) => Number(value || 0).toLocaleString('pt-BR', {maximumFractionDigits: 1});
const signedFmt = (value) => signed(value);

const COMPENDIUM = [
  {id: 'spells', label: 'Magias', singular: 'magia', icon: '✦'},
  {id: 'monsters', label: 'Monstros', singular: 'monstro', icon: '☠'},
  {id: 'items', label: 'Itens', singular: 'item', icon: '⚗'},
  {id: 'weapons', label: 'Armas', singular: 'arma', icon: '⚔'},
  {id: 'armors', label: 'Armaduras', singular: 'armadura', icon: '🛡'},
  {id: 'feats', label: 'Talentos', singular: 'talento', icon: '★'},
  {id: 'races', label: 'Raças', singular: 'raça', icon: '🧬'},
  {id: 'backgrounds', label: 'Antecedentes', singular: 'antecedente', icon: '📜'},
  {id: 'classes', label: 'Classes', singular: 'classe', icon: '🏛'},
  {id: 'encounters', label: 'Encontros', singular: 'encontro', icon: '🎲'},
  {id: 'sources', label: 'Fontes', singular: 'fonte', icon: '📚'},
];

const CANTRIPS_KNOWN = {
  bard: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  cleric: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  druid: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  sorcerer: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  artificer: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4],
};

const SPELLS_KNOWN = {
  bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  ranger: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
};

const ENCOUNTER_THRESHOLDS = {
  easy: [25, 50, 75, 125, 250, 300, 350, 450, 550, 600, 800, 1000, 1100, 1250, 1400, 1600, 2000, 2100, 2400, 2800],
  medium: [50, 100, 150, 250, 500, 600, 750, 900, 1100, 1200, 1600, 2000, 2200, 2500, 2800, 3200, 3900, 4200, 4900, 5700],
  hard: [75, 150, 225, 375, 750, 900, 1100, 1400, 1600, 1900, 2400, 3000, 3400, 3800, 4300, 4800, 5900, 6300, 7300, 8500],
  deadly: [100, 200, 400, 500, 1100, 1400, 1700, 2100, 2400, 2800, 3600, 4500, 5100, 5700, 6400, 7200, 8800, 9500, 10900, 12700],
};

const CONDITION_OPTIONS = [
  ['blinded', 'Cego'], ['charmed', 'Enfeitiçado'], ['deafened', 'Surdo'],
  ['frightened', 'Amedrontado'], ['grappled', 'Agarrado'], ['incapacitated', 'Incapacitado'],
  ['invisible', 'Invisível'], ['paralyzed', 'Paralisado'], ['petrified', 'Petrificado'],
  ['poisoned', 'Envenenado'], ['prone', 'Caído'], ['restrained', 'Contido'],
  ['stunned', 'Atordoado'], ['unconscious', 'Inconsciente'],
];

const ALIGNMENT_OPTIONS = [
  ['LAWFUL_GOOD', 'Leal e Bom'], ['NEUTRAL_GOOD', 'Neutro e Bom'], ['CHAOTIC_GOOD', 'Caótico e Bom'],
  ['LAWFUL_NEUTRAL', 'Leal e Neutro'], ['TRUE_NEUTRAL', 'Neutro'], ['CHAOTIC_NEUTRAL', 'Caótico e Neutro'],
  ['LAWFUL_EVIL', 'Leal e Mau'], ['NEUTRAL_EVIL', 'Neutro e Mau'], ['CHAOTIC_EVIL', 'Caótico e Mau'],
];

const DB_NAME = 'silvengard-characters';
const DB_VERSION = 1;
const STORE = 'characters';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_VERSIONS = 3;

let dbPromise = null;
let memoryRecords = [];

function withDbTimeout(promise, ms = 1600) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB indisponível ou lento demais.')), ms)),
  ]);
}

function openDb() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB indisponível neste navegador.'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, {keyPath: 'id'});
          store.createIndex('updatedAt', 'updatedAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Não foi possível abrir o banco de fichas.'));
    });
  }
  return dbPromise;
}

async function allRecords() {
  try {
    const db = await withDbTimeout(openDb());
    return await withDbTimeout(new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    }));
  } catch {
    return [...memoryRecords];
  }
}

async function putRecord(record) {
  memoryRecords = [...memoryRecords.filter((item) => item.id !== record.id), record];
  try {
    const db = await withDbTimeout(openDb());
    await withDbTimeout(new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  } catch {
    // Mantém a cópia em memória; a ficha ainda funciona nesta sessão.
  }
}

async function removeRecord(id) {
  memoryRecords = memoryRecords.filter((item) => item.id !== id);
  try {
    const db = await withDbTimeout(openDb());
    await withDbTimeout(new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  } catch {
    // idem
  }
}

function downloadFile(name, content, type = 'application/json') {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function safeFileName(name) {
  return String(name || 'personagem').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 80);
}

function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function levelLabel(level) {
  const n = num(level, 0);
  if (n === 0) return 'Truque';
  return `${n}º nível`;
}

function proficiencyLabel(value) {
  const prof = String(value || 'NONE').toUpperCase();
  return prof === 'EXPERT' ? 'E' : prof === 'FULL' || prof === 'PROFICIENT' ? 'P' : prof === 'HALF' ? '½' : '—';
}

function proficiencyLabelLong(value) {
  const map = {
    light: 'Armaduras leves', medium: 'Armaduras médias', heavy: 'Armaduras pesadas',
    shield: 'Escudos', all_simple: 'Armas simples', all_martial: 'Armas marciais',
  };
  return map[String(value || '').toLowerCase()] || String(value || '');
}

const ABILITY_ALIASES = {
  strength: 'str', dexterity: 'dex', constitution: 'con',
  intelligence: 'int', wisdom: 'wis', charisma: 'cha',
  str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha',
};

function abilityKey(value) {
  return ABILITY_ALIASES[String(value || '').toLowerCase()] || String(value || '').toLowerCase();
}

function abilityName(key) {
  const normalized = abilityKey(key);
  return ABILITIES.find((ability) => ability.key === normalized)?.name || key;
}

function sourceLabel(source) {
  return sourceName(source);
}

function crLabel(cr) {
  const value = Number(cr);
  if (!Number.isFinite(value)) return '—';
  if (value === 0.125) return '1/8';
  if (value === 0.25) return '1/4';
  if (value === 0.5) return '1/2';
  if (value === 0.75) return '3/4';
  return String(value);
}

function skillName(value) {
  const key = String(value || '').toLowerCase();
  const meta = SKILLS.find((skill) => skill.key === key || skill.cah === String(value).toUpperCase());
  return meta?.name || value;
}

function renderText(text) {
  const value = String(text || '').trim();
  if (!value) return '';
  return value.split(/\n{2,}/).map((paragraph) => `<p>${esc(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
}

function metadataLine(...items) {
  return items.filter(Boolean).map((item) => esc(item)).join(' · ');
}

export function createCharacters({toast = () => {}} = {}) {
  const panel = document.createElement('aside');
  panel.id = 'characters';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Fichas, compêndio e criação de personagens');
  document.body.append(panel);

  const state = {
    tab: 'sheet',
    records: [],
    activeId: null,
    modelCache: new Map(),
    loading: false,
    compendium: {
      category: 'spells',
      query: '',
      list: [],
      selected: null,
      loading: false,
      cache: new Map(),
      manifest: null,
    },
    bestiary: null,
    classDefs: null,
    dice: {expression: '1d20', history: []},
    creator: {
      loaded: false,
      loading: false,
      races: [],
      classes: [],
      backgrounds: [],
      data: {
        name: '',
        player: '',
        alignment: 'TRUE_NEUTRAL',
        raceId: 'human',
        classId: 'fighter',
        backgroundId: 'noble',
        subclassId: '',
        abilities: {str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8},
        skills: [],
      },
    },
  };

  function flash(message, error = false) {
    toast(message);
    if (error) console.warn(message);
  }

  function appendClassResources(model) {
    const cls = model.classes?.[0];
    if (!cls) return model;
    const id = String(cls.id || '').toLowerCase();
    const level = num(model.level, 1);
    const findFeature = (name) => (model.features || []).find((feature) => feature.name.toLowerCase().startsWith(name.toLowerCase()))?.description || '';
    const add = (slug, name, max, recharge = 'long', kind = 'uses') => {
      if (!max || (model.specialAbilities || []).some((resource) => resource.name.toLowerCase() === name.toLowerCase())) return;
      model.specialAbilities.push({
        id: `class:${slug}`,
        name,
        usesLeft: max,
        maxUses: max,
        kind,
        recharge,
        description: findFeature(name),
        available: true,
      });
    };
    if (id === 'cleric' && level >= 2) add('channel-divinity', 'Channel Divinity', level >= 18 ? 3 : level >= 6 ? 2 : 1, 'short');
    if (id === 'paladin' && level >= 3) add('channel-divinity', 'Channel Divinity', level >= 6 ? 2 : 1, 'short');
    if (id === 'monk' && level >= 2) add('ki', 'Ki', level, 'short', 'pool');
    if (id === 'fighter') {
      add('second-wind', 'Second Wind', 1, 'short');
      if (level >= 2) add('action-surge', 'Action Surge', level >= 17 ? 2 : 1, 'short');
    }
    if (id === 'druid' && level >= 2) add('wild-shape', 'Wild Shape', 2, 'short');
    if (id === 'sorcerer' && level >= 2) add('sorcery-points', 'Sorcery Points', level, 'long', 'pool');
    if (id === 'barbarian') add('rage', 'Rage', level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2, 'long');
    if (id === 'bard') {
      const max = Math.max(1, num(model.spellcasting?.abilityMod));
      add('bardic-inspiration', 'Bardic Inspiration', max, level >= 5 ? 'short' : 'long');
    }
    return model;
  }

  function createPlay(model) {
    const resources = {};
    for (const resource of model.specialAbilities || []) {
      resources[resource.id] = {current: resource.usesLeft, max: resource.maxUses, kind: resource.kind, recharge: resource.recharge};
    }
    return {
      version: 2,
      hp: {current: model.hp.max, temp: 0, failures: 0, successes: 0},
      slotsUsed: Array(9).fill(0),
      pactUsed: 0,
      resources,
      xp: num(model.exp),
      hitDice: (model.hitDice || []).map((die) => ({...die, current: die.current ?? die.max})),
      conditions: [],
      exhaustion: 0,
      weight: 0,
      encumbranceVariant: false,
      acBonus: 0,
      effects: {shield: false, mageArmor: false},
      stable: false,
    };
  }

  function ensurePlay(record, model) {
    if (!record.play) {
      record.play = createPlay(model);
    } else if (record.play.version !== 2) {
      const old = record.play;
      const fresh = createPlay(model);
      fresh.hp = old.hp || fresh.hp;
      fresh.slotsUsed = old.slotsUsed || fresh.slotsUsed;
      fresh.pactUsed = old.pactUsed || 0;
      fresh.resources = old.resources || fresh.resources;
      fresh.xp = old.xp ?? fresh.xp;
      record.play = fresh;
    }
    const play = record.play;
    play.hp ||= {current: model.hp.max, temp: 0, failures: 0, successes: 0};
    play.slotsUsed ||= Array(9).fill(0);
    play.resources ||= {};
    play.hitDice ||= (model.hitDice || []).map((die) => ({...die, current: die.current ?? die.max}));
    play.conditions ||= [];
    play.effects ||= {shield: false, mageArmor: false};
    play.weightExtra ??= 0;
    for (const resource of model.specialAbilities || []) {
      if (!play.resources[resource.id]) {
        play.resources[resource.id] = {current: resource.usesLeft, max: resource.maxUses, kind: resource.kind, recharge: resource.recharge};
      }
    }
    play.xp ??= num(model.exp);
    return play;
  }

  function carriedWeight(model) {
    let total = 0;
    for (const armor of model.armors || []) total += num(armor.weight);
    for (const attack of model.attacks || []) total += num(attack.weight) * Math.max(1, num(attack.amount, 1));
    for (const item of model.equipment || []) total += num(item.weight) * Math.max(1, num(item.amount, 1));
    const coins = Object.values(model.coins || {}).reduce((sum, value) => sum + num(value), 0);
    total += coins / 50;
    return Math.round(total * 10) / 10;
  }

  function itemAcBonus(model) {
    const equippedArmor = (model.armors || []).some((armor) => armor.equipped && !/shield/i.test(String(armor.category || armor.name || '')));
    const equippedShield = (model.armors || []).some((armor) => armor.equipped && /shield/i.test(String(armor.category || armor.name || '')));
    let bonus = 0;
    for (const item of model.equipment || []) {
      if (!item.attuned) continue;
      const name = String(item.name || '').toLowerCase();
      if (/ring of protection|cloak of protection|ioun stone.*protection/.test(name)) bonus += 1;
      if (/bracers of defense/.test(name) && !equippedArmor && !equippedShield) bonus += 2;
    }
    return bonus;
  }

  function applyPlay(model, play) {
    model.baseSpeed = model.speed;
    model.baseHpMax = model.hp.max;
    const hp = model.hp;
    const conditions = play.conditions || [];
    const exhaustion = Math.max(0, Math.min(6, num(play.exhaustion)));
    let speed = model.speed;
    if (num(play.hp?.current, hp.max) === 0) speed = 0;
    if (['grappled', 'restrained', 'stunned', 'paralyzed', 'petrified', 'unconscious', 'incapacitated'].some((condition) => conditions.includes(condition))) speed = 0;
    if (exhaustion >= 5) speed = 0;
    else if (exhaustion >= 2) speed = Math.floor(speed / 2);
    if (play.encumbranceVariant) {
      const str = num(model.abilities?.str?.score, 10);
      if (num(play.weight) > str * 10) speed -= 20;
      else if (num(play.weight) > str * 5) speed -= 10;
    }
    model.speed = Math.max(0, speed);
    if (exhaustion >= 4) model.hp.max = Math.max(1, Math.floor(model.hp.max / 2));
    hp.current = Math.max(0, Math.min(hp.max, num(play.hp?.current, hp.max)));
    hp.temp = Math.max(0, num(play.hp?.temp));
    hp.failures = Math.max(0, Math.min(3, num(play.hp?.failures)));
    hp.successes = Math.max(0, Math.min(3, num(play.hp?.successes)));
    model.slotsUsed = Array.from({length: 9}, (_, index) => Math.max(0, Math.min(num(model.spellSlots?.[index]), num(play.slotsUsed?.[index]))));
    for (const resource of model.specialAbilities || []) {
      const state = play.resources?.[resource.id];
      if (state) resource.usesLeft = Math.max(0, Math.min(resource.maxUses, num(state.current, resource.usesLeft)));
    }
    model.hitDice = (model.hitDice || []).map((die, index) => {
      const state = play.hitDice?.[index];
      return {...die, current: state ? Math.max(0, Math.min(die.max, num(state.current, die.current))) : die.current};
    });
    let ac = model.ac + (play.acBonus || 0) + itemAcBonus(model);
    if (play.effects?.shield) ac += 5;
    if (play.effects?.mageArmor && !(model.armors || []).some((armor) => armor.equipped && !/shield/i.test(String(armor.category || armor.name || '')))) {
      ac = Math.max(ac, 13 + num(model.abilities?.dex?.mod));
    }
    model.ac = ac;
    model.conditions = conditions;
    model.exhaustion = exhaustion;
    model.carriedWeight = carriedWeight(model);
    model.weight = Math.round((model.carriedWeight + num(play.weightExtra)) * 10) / 10;
    model.capacity = num(model.abilities?.str?.score, 10) * 15;
    model.encumbranceVariant = !!play.encumbranceVariant;
    model.effects = play.effects || {};
    model.dead = hp.failures >= 3 || exhaustion >= 6;
    model.stable = hp.successes >= 3 || !!play.stable;
    model.unconscious = hp.current === 0 && !model.dead;
    model.exp = num(play.xp, model.exp);
    model.play = play;
    return model;
  }

  function modelFor(record) {
    if (!record) return null;
    const key = `${record.id}:${record.updatedAt}`;
    if (state.modelCache.has(key)) return state.modelCache.get(key);
    try {
      const model = record.kind === 'cah' ? normalizeCah(record.raw) : normalizeNative(record.native);
      appendClassResources(model);
      ensurePlay(record, model);
      applyPlay(model, record.play);
      state.modelCache.set(key, model);
      return model;
    } catch (error) {
      throw new Error(`Não foi possível ler a ficha: ${error.message}`);
    }
  }

  async function refreshRecords(selectId = null) {
    state.loading = true;
    const records = await allRecords();
    records.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    state.records = records;
    if (selectId) state.activeId = selectId;
    if (!state.activeId || !records.some((record) => record.id === state.activeId)) {
      state.activeId = records[0]?.id || null;
    }
    state.loading = false;
  }

  function applyRecord(record, select = false) {
    const index = state.records.findIndex((item) => item.id === record.id);
    if (index >= 0) state.records[index] = record;
    else state.records.unshift(record);
    state.records.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    if (select) state.activeId = record.id;
    if (select) setTab('sheet');
    else if (!panel.hidden) renderSheetTab();
  }

  function activeRecord() {
    return state.records.find((record) => record.id === state.activeId) || null;
  }

  function activeModel() {
    const record = activeRecord();
    if (!record) return null;
    try {
      return modelFor(record);
    } catch (error) {
      flash(error.message, true);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Estrutura
  // -------------------------------------------------------------------------

  panel.innerHTML = `
    <div class="charHead">
      <div>
        <div class="eyebrow">FICHAS · COMPÊNDIO · CRIAÇÃO</div>
        <h2>Personagens</h2>
      </div>
      <button id="charClose" class="charIconButton" title="Fechar fichas" aria-label="Fechar fichas">×</button>
    </div>
    <div class="charTabs" role="tablist">
      <button data-char-tab="sheet" class="active" role="tab">Ficha</button>
      <button data-char-tab="compendium" role="tab">Compêndio 5e</button>
      <button data-char-tab="creator" role="tab">Criador</button>
      <button data-char-tab="dice" role="tab">Dados</button>
    </div>
    <div class="charBody">
      <section id="charSheetTab" class="charTab"></section>
      <section id="charCompendiumTab" class="charTab" hidden></section>
      <section id="charCreatorTab" class="charTab" hidden></section>
      <section id="charDiceTab" class="charTab" hidden></section>
    </div>
    <input type="file" id="charFile" accept=".cah,.json,application/json" hidden>
  `;

  const sheetTab = panel.querySelector('#charSheetTab');
  const compendiumTab = panel.querySelector('#charCompendiumTab');
  const creatorTab = panel.querySelector('#charCreatorTab');
  const diceTab = panel.querySelector('#charDiceTab');
  const fileInput = panel.querySelector('#charFile');

  function setTab(tab) {
    state.tab = tab;
    for (const button of panel.querySelectorAll('[data-char-tab]')) {
      button.classList.toggle('active', button.dataset.charTab === tab);
    }
    sheetTab.hidden = tab !== 'sheet';
    compendiumTab.hidden = tab !== 'compendium';
    creatorTab.hidden = tab !== 'creator';
    diceTab.hidden = tab !== 'dice';
    if (tab === 'sheet') renderSheetTab();
    if (tab === 'compendium') renderCompendiumTab();
    if (tab === 'creator') renderCreatorTab();
    if (tab === 'dice') renderDiceTab();
  }

  // -------------------------------------------------------------------------
  // Ficha
  // -------------------------------------------------------------------------

  function renderRecordList() {
    if (!state.records.length) {
      return `<p class="charEmptySmall">Nenhuma ficha ainda. Importe um <b>.cah</b> ou crie uma ficha provisória.</p>`;
    }
    return state.records.map((record) => {
      let model = null;
      try {
        model = modelFor(record);
      } catch {
        // mostra o item mesmo com erro; o painel explica.
      }
      return `
        <button class="charListItem ${record.id === state.activeId ? 'active' : ''}" data-char-id="${esc(record.id)}">
          <span class="charAvatar">${model?.image ? `<img src="${model.image}" alt="">` : esc(initials(record.name))}</span>
          <span class="charListText">
            <strong>${esc(record.name || model?.name || 'Ficha')}</strong>
            <small>${esc(model ? `${model.classLine} · Nv ${model.level}` : 'Ficha com erro de leitura')}</small>
          </span>
        </button>`;
    }).join('');
  }

  function renderSheetTab() {
    const record = activeRecord();
    let model = null;
    let error = '';
    if (record) {
      try {
        model = modelFor(record);
      } catch (err) {
        error = err.message;
      }
    }
    sheetTab.innerHTML = `
      <div class="charSheetLayout">
        <aside class="charListPane">
          <div class="charListActions">
            <button id="charImportBtn" class="charPrimary">Importar .cah</button>
            <button id="charCreateBtn">+ Criar personagem</button>
          </div>
          <div class="charList">${renderRecordList()}</div>
          <p class="charHint">Arraste um <b>.cah</b> do D&D 5e Companion antigo para cá. O arquivo fica só neste navegador. Magias e itens do compêndio também podem ser arrastados para a ficha.</p>
        </aside>
        <div class="charSheetPane" data-sheet-drop>
          ${error ? `<div class="charError">${esc(error)}</div>` : model ? renderSheet(model, record) : renderEmptySheet()}
        </div>
      </div>`;
  }

  function renderEmptySheet() {
    return `
      <div class="charEmpty">
        <div class="charEmptySeal">S</div>
        <h3>Uma ficha para chamar de sua</h3>
        <p>Importe o <b>.cah</b> exportado pelo D&D 5e Companion antigo — o mesmo formato do Tytos — para ver atributos, perícias, magias, equipamento e habilidades.</p>
        <p>Se preferir, o <b>Criador</b> monta uma ficha 5e provisória com raça, classe, antecedente, atributos e perícias.</p>
        <div class="charEmptyActions">
          <button id="charEmptyImport">Importar .cah</button>
          <button id="charEmptyCreate">Criar personagem</button>
        </div>
      </div>`;
  }

  function statCard(label, value, small = '') {
    return `<div class="charStat"><span>${esc(label)}</span><strong>${esc(value)}</strong>${small ? `<small>${esc(small)}</small>` : ''}</div>`;
  }

  function renderHpStat(model) {
    return `<div class="charStat hpStat">
      <span>PV</span>
      <strong>${model.hp.current}/${model.hp.max}</strong>
      <div class="hpControls">
        <button data-hp-delta="-1" title="Um ponto de dano">−</button>
        <input id="hpCurrent" type="number" min="0" max="${model.hp.max}" value="${model.hp.current}" aria-label="PV atual">
        <button data-hp-delta="1" title="Um ponto de cura">+</button>
      </div>
      <div class="hpTemp"><span>temp.</span><input id="hpTemp" type="number" min="0" value="${model.hp.temp}" aria-label="PV temporários"></div>
      <small>${model.hp.temp ? `+${model.hp.temp} PV temporários` : 'PV atual · dano/cura'}</small>
    </div>`;
  }

  function renderSheet(model, record) {
    const subclass = model.classes?.map((cls) => cls.subclass).filter(Boolean).join(' · ');
    const subtype = model.classes?.map((cls) => cls.subtype).filter(Boolean).join(' · ');
    const titleBits = [
      model.race?.name,
      model.classLine,
      subclass,
      subtype,
      model.background?.name,
      model.alignment,
    ].filter(Boolean);
    const caster = model.spellcasting?.ability;
    const attacks = model.attacks || [];
    const features = model.features || [];
    const spells = model.spells || [];
    const versions = record?.versions || [];
    return `
      <div class="sheetHead">
        <div class="sheetPortrait">${model.image ? `<img src="${model.image}" alt="Retrato de ${esc(model.name)}">` : `<span>${esc(initials(model.name))}</span>`}</div>
        <div class="sheetTitle">
          <div class="eyebrow">${model.kind === 'cah' ? 'FICHA .CAH · D&D 5E' : 'FICHA NATIVA · D&D 5E'}</div>
          <h2>${esc(model.name)}</h2>
          <p>${titleBits.map(esc).join(' · ')}</p>
          <div class="sheetTags">
            <span>Nível ${model.level}</span>
            <span>PB ${signedFmt(model.pb)}</span>
            ${model.player ? `<span>Jogador: ${esc(model.player)}</span>` : ''}
            <span>${fmt(model.exp)} XP</span>
            ${model.level < 20 ? `<span>Próximo nível: ${fmt(xpForLevel(model.level + 1))} XP</span>` : '<span>Nível máximo</span>'}
          </div>
        </div>
        <div class="sheetActions">
          <button data-char-download="${esc(model.id)}">Baixar ficha</button>
          <button data-char-levelup="${esc(model.id)}" class="charPrimary">Subir nível</button>
          ${model.kind === 'atlas' ? `<button data-add-class="${esc(model.id)}">+ Multiclasse</button>` : ''}
          <button data-short-rest="${esc(model.id)}">Descanso curto</button>
          <button data-long-rest="${esc(model.id)}">Descanso longo</button>
          <button data-add-xp="${esc(model.id)}">XP</button>
          <button data-char-delete="${esc(model.id)}" class="charDanger">Excluir</button>
        </div>
      </div>

      <div class="charStatGrid">
        ${statCard('CA', model.ac, model.armor || model.shield || '')}
        ${renderHpStat(model)}
        ${statCard('Deslocamento', `${model.speed} pés`, '')}
        ${statCard('Iniciativa', signedFmt(model.initiative), '')}
        ${statCard('Percepção passiva', model.passivePerception, '')}
        ${statCard('Bônus de proficiência', signedFmt(model.pb), '')}
        ${caster ? statCard('CD de magia', model.spellcasting.dc, model.spellcasting.abilityName) : ''}
        ${caster ? statCard('Ataque mágico', signedFmt(model.spellcasting.attack), model.spellcasting.abilityName) : ''}
      </div>

      <section class="charSection classSection">
        <h3>Classes <small>${model.multiclass ? 'multiclasse' : `${model.level} nível${model.level === 1 ? '' : 's'}`}</small></h3>
        <ul class="classList">
          ${(model.classes || []).map((cls) => `<li><b>${esc(cls.name)}</b><span>Nível ${cls.level}</span><small>${esc(cls.hitDie)}${cls.subclass ? ` · ${esc(cls.subclass)}` : ''}</small></li>`).join('')}
        </ul>
        ${model.kind === 'atlas' ? `<button class="classAdd" data-add-class="${esc(model.id)}">+ Adicionar outra classe</button>` : '<p class="charMuted">Classes vindas do arquivo .cah. O nível pode ser escolhido ao subir.</p>'}
      </section>

      <div class="charSheetGrid">
        <section class="charSection">
          <h3>Atributos e resistências</h3>
          <div class="abilityGrid">
            ${ABILITIES.map((ability) => {
              const data = model.abilities[ability.key];
              return `<div class="abilityCard ${data.save ? 'saving' : ''}">
                <span>${esc(ability.short)}</span>
                <strong>${data.score}</strong>
                <em>${signedFmt(data.mod)}</em>
                <small>${data.save ? `Save ${signedFmt(data.saveMod)}` : 'Sem proficiência'}</small>
              </div>`;
            }).join('')}
          </div>
        </section>

        <section class="charSection">
          <h3>Perícias</h3>
          <div class="charTableWrap">
            <table class="charTable charSkills">
              <thead><tr><th>Perícia</th><th>Atributo</th><th>Prof.</th><th>Total</th></tr></thead>
              <tbody>${(model.skills || []).map((skill) => `
                <tr class="${skill.proficiency === 'NONE' ? 'mutedRow' : ''}">
                  <td>${esc(skill.name)}</td>
                  <td>${esc((ABILITIES.find((a) => a.key === skill.ability)?.short) || '')}</td>
                  <td class="profCell">${esc(proficiencyLabel(skill.proficiency))}</td>
                  <td class="numCell">${signedFmt(skill.total)}</td>
                </tr>`).join('')}</tbody>
            </table>
          </div>
        </section>

        <section class="charSection">
          <h3>Ataques</h3>
          ${attacks.length ? `<div class="charTableWrap"><table class="charTable">
            <thead><tr><th>Ataque</th><th>Acerto</th><th>Dano</th><th>Tipo</th></tr></thead>
            <tbody>${attacks.map((attack) => `<tr>
              <td><b>${esc(attack.name)}</b>${attack.properties ? `<small>${esc(attack.properties)}</small>` : ''}</td>
              <td class="numCell">${signedFmt(attack.attack)}</td>
              <td>${esc(attack.damage)}${attack.versatile ? `<small>versátil ${esc(attack.versatile)}</small>` : ''}</td>
              <td>${esc(attack.damageType || attack.range || '')}</td>
            </tr>`).join('')}</tbody>
          </table></div>` : '<p class="charMuted">Nenhuma arma cadastrada na ficha.</p>'}
        </section>

        <section class="charSection">
          <h3>Recursos</h3>
          ${renderResources(model)}
        </section>

        <section class="charSection charWide">
          <h3>Habilidades e traços <small>${features.length}</small></h3>
          <div class="featureList">
            ${features.length ? features.map((feature) => `
              <details class="featureCard">
                <summary><span class="featureLevel">Nv ${feature.level}</span> <b>${esc(feature.name)}</b></summary>
                ${feature.description ? renderText(feature.description) : '<p class="charMuted">Sem descrição no arquivo.</p>'}
              </details>`).join('') : '<p class="charMuted">Nenhuma habilidade listada.</p>'}
          </div>
        </section>

        <section class="charSection charWide">
          <h3>Magias <small>${esc(spellSummary(model))}</small></h3>
          ${renderSlots(model)}
          ${spellWarnings(model).map((warning) => `<p class="charWarning">${esc(warning)}</p>`).join('')}
          <div class="spellList">
            ${spells.length ? groupBy(spells, (spell) => spell.level).map(([level, list]) => `
              <div class="spellLevelGroup">
                <h4>${esc(levelLabel(level))}</h4>
                ${list.map((spell) => `
                  <details class="spellCard">
                    <summary>
                      <b>${esc(spell.name)}</b>
                      <span>${esc(spell.school || '')}${spell.ritual ? ' · ritual' : ''}${spell.concentration ? ' · concentração' : ''}${spell.prepared ? ' · preparada' : ''}</span>
                    </summary>
                    <div class="spellMeta">${metadataLine(spell.castingTime, spell.range, spell.duration, spell.components)}</div>
                    ${renderText(spell.description)}
                    ${spell.higherLevels ? `<div class="spellHigher"><b>Em níveis superiores.</b> ${renderText(spell.higherLevels)}</div>` : ''}
                    <div class="spellActions">
                      <button data-cast-spell="${esc(spell.id)}">${spell.level === 0 ? 'Conjurar truque' : 'Conjurar'}</button>
                      ${preparedCaster(model) ? `<button data-prepare-spell="${esc(spell.id)}">${spell.prepared ? 'Despreparar' : 'Preparar'}</button>` : ''}
                    </div>
                  </details>`).join('')}
              </div>`).join('') : '<p class="charMuted">Nenhuma magia na ficha.</p>'}
          </div>
        </section>

        <section class="charSection">
          <h3>Equipamento <small>sintonia ${(model.equipment || []).filter((item) => item.attuned).length}/3</small></h3>
          ${(model.equipment || []).length ? `<ul class="charListSimple itemList">${model.equipment.map((item) => `<li class="${item.attuned ? 'equipped' : ''}"><span>${esc(item.name)}${item.attuned ? ' <em>sintonizado</em>' : ''}</span><b>${item.amount > 1 ? `×${item.amount}` : ''}</b><button data-attune-item="${esc(item.id)}">${item.attuned ? 'Liberar' : 'Sintonizar'}</button></li>`).join('')}</ul>` : '<p class="charMuted">Nenhum item avulso.</p>'}
          <div class="coinRow">
            ${['pp', 'gp', 'ep', 'sp', 'cp'].map((coin) => `<span><b>${model.coins[coin] || 0}</b> ${coin.toUpperCase()}</span>`).join('')}
          </div>
        </section>

        <section class="charSection">
          <h3>Armaduras e escudos</h3>
          ${(model.armors || []).length ? `<ul class="charListSimple armorList">${model.armors.map((armor) => `<li class="${armor.equipped ? 'equipped' : ''}"><span>${esc(armor.name)}${armor.equipped ? ' <em>equipada</em>' : ''}</span><b>CA ${armor.ac}${armor.requiredStrength ? ` · For ${armor.requiredStrength}` : ''}</b><button data-equip-armor="${esc(armor.id)}">${armor.equipped ? 'Desequipar' : 'Equipar'}</button></li>`).join('')}</ul>` : '<p class="charMuted">Nenhuma armadura cadastrada.</p>'}
        </section>

        <section class="charSection">
          <h3>Proficiências</h3>
          ${Object.keys(model.proficiencies || {}).length ? Object.entries(model.proficiencies).map(([type, items]) => `<p class="proficiencyLine"><b>${esc(type)}</b> ${items.map(esc).join(', ')}</p>`).join('') : '<p class="charMuted">Nenhuma proficiência listada.</p>'}
        </section>

        <section class="charSection charWide">
          <h3>Anotações</h3>
          ${(model.notes || []).length ? model.notes.map((note) => `<div class="charNote">${renderText(note)}</div>`).join('') : '<p class="charMuted">Sem anotações.</p>'}
        </section>

        ${renderNarrative(model)}
        ${renderState(model)}

        ${versions.length ? `<section class="charSection charWide">
          <h3>Versões anteriores</h3>
          <div class="versionList">${versions.map((version, index) => `<div class="versionRow">
            <span>${esc(new Date(version.at).toLocaleString('pt-BR'))}</span>
            <button data-char-version="${index}" data-char-id="${esc(model.id)}">Baixar .cah</button>
          </div>`).join('')}</div>
        </section>` : ''}
      </div>`;
  }

  function conditionName(key) {
    const map = {
      blinded: 'Cego', charmed: 'Enfeitiçado', deafened: 'Surdo', exhaustion: 'Exaustão',
      frightened: 'Amedrontado', grappled: 'Agarrado', incapacitated: 'Incapacitado',
      invisible: 'Invisível', paralyzed: 'Paralisado', petrified: 'Petrificado',
      poisoned: 'Envenenado', prone: 'Caído', restrained: 'Contido', stunned: 'Atordoado',
      unconscious: 'Inconsciente',
    };
    return map[String(key || '').toLowerCase()] || String(key || '');
  }

  function renderNarrative(model) {
    const rows = [
      ['Sobre', model.about],
      ['Traços de personalidade', model.personality],
      ['Ideais', model.ideals],
      ['Vínculos', model.bonds],
      ['Defeitos', model.flaws],
    ].filter(([, value]) => String(value || '').trim());
    if (!rows.length) return '';
    return `<section class="charSection charWide">
      <h3>História e personalidade</h3>
      ${rows.map(([label, value]) => `<div class="narrativeRow"><b>${esc(label)}</b>${renderText(value)}</div>`).join('')}
    </section>`;
  }

  function renderResources(model) {
    const resources = model.specialAbilities || [];
    if (!resources.length) return '<p class="charMuted">Nenhum recurso com usos ou pool nesta ficha.</p>';
    return resources.map((resource) => {
      const isPool = resource.kind === 'pool';
      return `<div class="specialAbility">
        <div>
          <b>${esc(resource.name)}</b>
          <span class="resourceKind">${isPool ? 'POOL' : 'USOS'}${resource.recharge === 'short' ? ' · curto' : ' · longo'}</span>
          <span>${resource.usesLeft} / ${resource.maxUses}</span>
        </div>
        <div class="resourceControls">
          ${isPool
            ? `<button data-resource-id="${esc(resource.id)}" data-resource-spend="1">−1</button>
               <button data-resource-id="${esc(resource.id)}" data-resource-spend="5">−5</button>
               <button data-resource-id="${esc(resource.id)}" data-resource-restore="1">+1</button>`
            : `<button data-resource-id="${esc(resource.id)}" data-resource-spend="1">Usar</button>`}
          <button data-resource-id="${esc(resource.id)}" data-resource-restore="all">Restaurar</button>
        </div>
        ${resource.description ? `<details><summary>Descrição</summary>${renderText(resource.description)}</details>` : ''}
      </div>`;
    }).join('');
  }

  function renderState(model) {
    const conditions = model.conditions || [];
    const advantages = model.advantages || [];
    const disadvantages = model.disadvantages || [];
    const hp = model.hp;
    const deathVisible = hp.current === 0 || hp.failures || hp.successes || model.dead;
    const exhaustion = num(model.exhaustion);
    const hitDice = model.hitDice || [];
    const hitDiceText = hitDice.length ? hitDice.map((die) => `${die.current}/${die.max}${die.die}`).join(' · ') : '—';
    return `<section class="charSection charWide stateSection">
      <h3>Estado, condições e morte</h3>
      <div class="stateTop">
        <label>Adicionar condição<select id="conditionSelect">${CONDITION_OPTIONS.map(([id, label]) => `<option value="${id}">${esc(label)}</option>`).join('')}</select></label>
        <button data-add-condition>Adicionar</button>
      </div>
      <div class="stateRow">
        ${model.inspiration ? '<span class="stateTag">Inspiração</span>' : ''}
        ${conditions.map((condition) => `<span class="stateTag condition">${esc(conditionName(condition))}<button data-remove-condition="${esc(condition)}" title="Remover">×</button></span>`).join('')}
        ${advantages.map((item) => `<span class="stateTag">Vantagem: ${esc(item)}</span>`).join('')}
        ${disadvantages.map((item) => `<span class="stateTag">Desvantagem: ${esc(item)}</span>`).join('')}
        ${model.dead ? '<span class="stateTag condition">Morto</span>' : model.stable ? '<span class="stateTag">Estável</span>' : model.unconscious ? '<span class="stateTag condition">Inconsciente</span>' : ''}
      </div>
      <div class="stateGrid">
        <div class="stateBox">
          <span>Exaustão</span>
          <div class="stepper"><button data-exhaustion="-1">−</button><b>${exhaustion}</b><button data-exhaustion="1">+</button></div>
          <small>${exhaustion >= 6 ? 'Morte' : exhaustion >= 5 ? 'Deslocamento 0' : exhaustion >= 4 ? 'PV máximo pela metade' : exhaustion >= 2 ? 'Deslocamento pela metade' : exhaustion === 1 ? 'Desvantagem em testes de atributo' : 'Sem efeito'}</small>
        </div>
        <div class="stateBox">
          <span>Dados de vida</span>
          <b class="stateBoxValue">${esc(hitDiceText)}</b>
          <button data-short-rest>Descanso curto</button>
        </div>
        <div class="stateBox">
          <span>CA e efeitos</span>
          <b class="stateBoxValue">CA ${model.ac}</b>
          <label class="stateCheck"><input type="checkbox" data-effect="shield" ${model.effects?.shield ? 'checked' : ''}> Shield (+5)</label>
          <label class="stateCheck"><input type="checkbox" data-effect="mageArmor" ${model.effects?.mageArmor ? 'checked' : ''}> Mage Armor (13+Des)</label>
          <label class="stateCheck"><input id="acBonus" type="number" value="${num(model.play?.acBonus)}" min="0" max="20"> Bônus de CA manual</label>
        </div>
        <div class="stateBox">
          <span>Carga</span>
          <b class="stateBoxValue">${fmt(model.carriedWeight)} lb em itens</b>
          <label class="stateCheck"><input id="weightExtra" type="number" min="0" value="${num(model.play?.weightExtra)}"> ajuste manual / ${num(model.capacity)} lb</label>
          <label class="stateCheck"><input type="checkbox" id="encumbranceVariant" ${model.encumbranceVariant ? 'checked' : ''}> Variante de carga</label>
          <small>${num(model.weight) > num(model.capacity) ? 'Acima da capacidade de carga' : num(model.weight) > num(model.abilities?.str?.score, 10) * 5 ? 'Sobrecarregado' : `Total ${fmt(model.weight)} lb`}</small>
        </div>
        ${deathVisible ? `<div class="stateBox deathBox">
          <span>Testes de morte</span>
          <div class="deathPips"><b>${'●'.repeat(Math.min(3, hp.successes))}${'○'.repeat(Math.max(0, 3 - hp.successes))}</b> sucessos<br><b>${'●'.repeat(Math.min(3, hp.failures))}${'○'.repeat(Math.max(0, 3 - hp.failures))}</b> falhas</div>
          ${model.dead ? '<small>Morto</small>' : model.stable ? '<small>Estável</small>' : `<div class="stateActions"><button data-death-roll>Rolar morte</button><button data-stabilize>Estabilizar</button></div>`}
        </div>` : ''}
      </div>
    </section>`;
  }

  function classEntries(model) {
    return (model.classes || []).map((cls) => ({
      id: String(cls.id || '').toLowerCase().split('__')[0],
      level: Math.max(1, num(cls.level, 1)),
      def: cls.def || {},
    }));
  }

  function spellLimits(model) {
    const spells = model.spells || [];
    const cantrips = spells.filter((spell) => num(spell.level) === 0).length;
    const leveled = spells.filter((spell) => num(spell.level) > 0);
    const classes = classEntries(model);
    const cantripLimit = classes.reduce((sum, cls) => sum + (CANTRIPS_KNOWN[cls.id]?.[cls.level - 1] ?? 0), 0);
    const knownLimit = classes.reduce((sum, cls) => sum + (SPELLS_KNOWN[cls.id]?.[cls.level - 1] ?? 0), 0);
    const spellbookLimit = classes.reduce((sum, cls) => sum + (cls.id === 'wizard' ? 6 + 2 * (cls.level - 1) : 0), 0);
    return {
      cantrips: {current: cantrips, limit: cantripLimit || null},
      known: knownLimit ? {current: leveled.length, limit: knownLimit} : null,
      prepared: preparedCaster(model) ? {current: preparedCount(model), limit: preparedLimit(model)} : null,
      spellbook: spellbookLimit ? {current: leveled.length, limit: spellbookLimit} : null,
    };
  }

  function preparedCaster(model) {
    return classEntries(model).some((cls) => ['cleric', 'druid', 'wizard', 'paladin', 'artificer'].includes(cls.id));
  }

  function preparedLimit(model) {
    const spells = model.spells || [];
    if (!spells.length) return 0;
    if (!preparedCaster(model) || !model.spellcasting?.ability) return spells.length;
    const classes = classEntries(model);
    const abilityMod = (cls) => {
      const ability = String(cls.def?.spellcastingAbility || '').toLowerCase();
      const key = ability.startsWith('char') ? 'cha' : ability.startsWith('wis') ? 'wis' : ability.startsWith('int') ? 'int' : model.spellcasting?.ability;
      return num(model.abilities?.[key]?.mod, model.spellcasting.abilityMod);
    };
    return classes.reduce((sum, cls) => {
      if (!['cleric', 'druid', 'wizard', 'paladin', 'artificer'].includes(cls.id)) return sum;
      const half = cls.id === 'paladin' || cls.id === 'artificer';
      return sum + Math.max(1, abilityMod(cls) + (half ? Math.floor(cls.level / 2) : cls.level));
    }, 0) || model.spells.length;
  }

  function preparedCount(model) {
    return (model.spells || []).filter((spell) => spell.prepared).length;
  }

  function spellSummary(model) {
    const limits = spellLimits(model);
    const parts = [`${(model.spells || []).length}`];
    if (limits.cantrips.limit != null) parts.push(`truques ${limits.cantrips.current}/${limits.cantrips.limit}`);
    if (limits.known) parts.push(`conhecidas ${limits.known.current}/${limits.known.limit}`);
    if (limits.prepared) parts.push(`preparadas ${limits.prepared.current}/${limits.prepared.limit}`);
    if (limits.spellbook) parts.push(`grimório ${limits.spellbook.current}/${limits.spellbook.limit}`);
    return parts.join(' · ');
  }

  function spellWarnings(model) {
    const limits = spellLimits(model);
    const warnings = [];
    if (limits.cantrips.limit != null && limits.cantrips.current > limits.cantrips.limit) warnings.push(`Truques acima do limite (${limits.cantrips.current}/${limits.cantrips.limit}).`);
    if (limits.known && limits.known.current > limits.known.limit) warnings.push(`Magias conhecidas acima do limite (${limits.known.current}/${limits.known.limit}).`);
    if (limits.prepared && limits.prepared.current > limits.prepared.limit) warnings.push(`Magias preparadas acima do limite (${limits.prepared.current}/${limits.prepared.limit}).`);
    return warnings;
  }

  function renderSlots(model) {
    const slots = model.spellSlots || [];
    const used = model.slotsUsed || [];
    const bonus = model.bonusSpellSlots || [];
    const parts = slots.map((count, index) => {
      if (!count) return '';
      const remaining = Math.max(0, count - num(used[index]));
      return `<span class="slotPip ${remaining ? '' : 'empty'}"><b>${remaining}/${count}${bonus[index] ? `+${bonus[index]}` : ''}</b> ${levelLabel(index + 1)}</span>`;
    }).filter(Boolean);
    if (model.pactMagic?.count) {
      const pactRemaining = Math.max(0, model.pactMagic.count - num(model.play?.pactUsed));
      parts.push(`<span class="slotPip ${pactRemaining ? '' : 'empty'}"><b>${pactRemaining}/${model.pactMagic.count}</b> pacto · ${levelLabel(model.pactMagic.slotLevel)}</span>`);
    }
    return parts.length ? `<div class="slotRow">${parts.join('')}</div>` : '<p class="charMuted">Sem espaços de magia nesta ficha.</p>';
  }

  function groupBy(items, selector) {
    const map = new Map();
    for (const item of items || []) {
      const key = selector(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].sort((a, b) => num(a[0]) - num(b[0]));
  }

  // -------------------------------------------------------------------------
  // Compêndio
  // -------------------------------------------------------------------------

  function renderCompendiumTab() {
    const category = COMPENDIUM.find((item) => item.id === state.compendium.category) || COMPENDIUM[0];
    compendiumTab.innerHTML = `
      <div class="compendiumTop">
        <div class="compendiumCategories">
          ${COMPENDIUM.map((item) => `<button data-comp-category="${item.id}" class="${item.id === category.id ? 'active' : ''}">${item.icon} ${esc(item.label)}${state.compendium.manifest?.counts?.[item.id] != null ? `<small>${state.compendium.manifest.counts[item.id]}</small>` : ''}</button>`).join('')}
        </div>
        <input id="compendiumSearch" type="search" placeholder="Buscar ${esc(category.label.toLowerCase())}…" value="${esc(state.compendium.query)}">
      </div>
      <div class="compendiumLayout">
        <div class="compendiumListPane">
          <div class="compendiumCount" id="compendiumCount"></div>
          <div class="compendiumList" id="compendiumList"></div>
        </div>
        <div class="compendiumDetail" id="compendiumDetail"></div>
      </div>`;
    const search = compendiumTab.querySelector('#compendiumSearch');
    if (search) {
      search.oninput = () => {
        state.compendium.query = search.value;
        renderCompendiumList();
      };
    }
    loadCompendium(category.id);
  }

  async function loadCompendium(category) {
    if (state.compendium.cache.has(category)) {
      state.compendium.list = state.compendium.cache.get(category);
      renderCompendiumList();
      return;
    }
    if (state.compendium.loading) return;
    state.compendium.loading = true;
    const listBox = compendiumTab.querySelector('#compendiumList');
    if (listBox) listBox.innerHTML = `<p class="charMuted">Carregando ${esc(category)}…</p>`;
    try {
      if (!state.compendium.manifest) {
        const response = await fetch('./5e/manifest.json', {cache: 'no-store'});
        if (response.ok) state.compendium.manifest = await response.json();
      }
      const response = await fetch(`./5e/${category}.json`, {cache: 'no-store'});
      if (!response.ok) throw new Error(`Pacote ${category}.json não encontrado. Rode o gerador de dados 5e.`);
      const list = await response.json();
      state.compendium.cache.set(category, list);
      if (state.compendium.category === category) {
        state.compendium.list = list;
        renderCompendiumList();
      }
      if (state.compendium.manifest) {
        const counts = state.compendium.manifest.counts || {};
        for (const button of compendiumTab.querySelectorAll('[data-comp-category]')) {
          const key = button.dataset.compCategory;
          if (counts[key] != null) {
            const small = button.querySelector('small');
            if (small) small.textContent = counts[key];
          }
        }
      }
    } catch (error) {
      if (listBox) listBox.innerHTML = `<div class="charError">${esc(error.message)}</div>`;
    } finally {
      state.compendium.loading = false;
    }
  }

  function filteredCompendium() {
    const query = state.compendium.query.trim().toLowerCase();
    const list = state.compendium.list || [];
    if (!query) return list;
    const matches = list.filter((entry) => {
      const haystack = [
        entry.name, entry.type, entry.school, entry.source, entry.description,
        entry.cr, entry.level, entry.rarity, entry.classes, entry.hitDie,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
    const relevance = (entry) => {
      const name = String(entry.name || '').toLowerCase();
      if (name === query) return 0;
      if (name.startsWith(query)) return 1;
      if (name.includes(query)) return 2;
      return 3;
    };
    return matches.sort((a, b) => relevance(a) - relevance(b) || String(a.name).localeCompare(String(b.name), 'pt-BR'));
  }

  function renderCompendiumList() {
    const listBox = compendiumTab.querySelector('#compendiumList');
    const countBox = compendiumTab.querySelector('#compendiumCount');
    if (!listBox) return;
    const list = filteredCompendium();
    if (countBox) countBox.textContent = `${list.length} ${list.length === 1 ? 'resultado' : 'resultados'}`;
    const selected = state.compendium.selected;
    if (selected && !list.some((entry) => entry.id === selected.id)) state.compendium.selected = null;
    listBox.innerHTML = list.slice(0, 300).map((entry, index) => `
      <button data-comp-index="${index}" draggable="true" class="${selected?.id === entry.id ? 'active' : ''}" title="Arraste para a ficha">
        <span><strong>${esc(entry.name)}</strong><small>${esc(compendiumSubtitle(entry))}</small></span>
        <em>${esc(sourceLabel(entry.source))}</em>
      </button>`).join('') || `<p class="charMuted">Nada encontrado. Tente outro termo.</p>`;
    if (list.length > 300) {
      listBox.insertAdjacentHTML('beforeend', `<p class="charMuted">Mostrando 300 de ${list.length}. Refine a busca.</p>`);
    }
    const detail = compendiumTab.querySelector('#compendiumDetail');
    if (detail) {
      if (!state.compendium.selected && list.length) state.compendium.selected = list[0];
      detail.innerHTML = state.compendium.selected ? renderCompendiumDetail(state.compendium.selected, state.compendium.category) : '<p class="charMuted">Escolha uma entrada.</p>';
    }
  }

  function compendiumSubtitle(entry) {
    const category = state.compendium.category;
    if (category === 'spells') return `${levelLabel(entry.level)} · ${entry.school || ''}`;
    if (category === 'monsters') return `CR ${crLabel(entry.cr)} · ${entry.type || ''}`;
    if (category === 'classes') return `${entry.hitDie} · ${entry.subclassLevel} para subclasse`;
    if (category === 'races') return `${entry.speed} pés · ${(entry.abilityIncreases || []).length} aumentos`;
    if (category === 'feats') return 'Talento';
    if (category === 'encounters') return `${(entry.combatants || []).length} combatentes`;
    if (category === 'sources') return `Código ${entry.abbreviation || entry.id}`;
    if (entry.type) return `${entry.type}${entry.rarity ? ` · ${entry.rarity}` : ''}`;
    if (entry.speed != null) return `${entry.speed} pés`;
    return entry.source ? `Fonte ${sourceLabel(entry.source)}` : '';
  }

  function detailHeader(entry, kicker = '') {
    return `<div class="compendiumDetailHead">
      <div class="eyebrow">${esc(kicker || sourceLabel(entry.source))}</div>
      <h3>${esc(entry.name)}</h3>
      ${entry.source ? `<p class="charMuted">Fonte: ${esc(sourceLabel(entry.source))}</p>` : ''}
    </div>`;
  }

  function renderCompendiumDetail(entry, category) {
    switch (category) {
      case 'spells': return renderSpellDetail(entry);
      case 'monsters': return renderMonsterDetail(entry);
      case 'items': return renderItemDetail(entry);
      case 'weapons': return renderWeaponDetail(entry);
      case 'armors': return renderArmorDetail(entry);
      case 'feats': return renderFeatDetail(entry);
      case 'races': return renderRaceDetail(entry);
      case 'backgrounds': return renderBackgroundDetail(entry);
      case 'classes': return renderClassDetail(entry);
      case 'encounters': return renderEncounterDetail(entry);
      case 'sources': return `${detailHeader(entry, 'Fonte de D&D 5e')}<p class="proficiencyLine"><b>Código</b> ${esc(entry.id)}</p>`;
      default: return `${detailHeader(entry)}<pre>${esc(JSON.stringify(entry, null, 2))}</pre>`;
    }
  }

  function renderSpellDetail(spell) {
    return `${detailHeader(spell, `${levelLabel(spell.level)} · ${spell.school || 'Magia'}`)}
      <div class="detailFacts">
        <span><b>Conjuração</b>${esc(spell.castingTime || '—')}</span>
        <span><b>Alcance</b>${esc(spell.range || '—')}</span>
        <span><b>Duração</b>${esc(spell.duration || '—')}</span>
        <span><b>Componentes</b>${esc(spell.components || '—')}</span>
      </div>
      <div class="detailTags">${spell.ritual ? '<span>Ritual</span>' : ''}${spell.concentration ? '<span>Concentração</span>' : ''}${spell.save ? `<span>Save: ${esc(spell.save)}</span>` : ''}${(spell.damage || []).map((damage) => `<span>${esc(damage)}</span>`).join('')}</div>
      ${renderText(spell.description)}
      ${spell.higherLevels ? `<div class="spellHigher"><b>Em níveis superiores.</b> ${renderText(spell.higherLevels)}</div>` : ''}
      ${(spell.classes || []).length ? `<p class="proficiencyLine"><b>Classes</b> ${spell.classes.map(esc).join(', ')}</p>` : ''}`;
  }

  function renderMonsterDetail(monster) {
    const abilities = monster.abilities || {};
    return `${detailHeader(monster, `CR ${crLabel(monster.cr)} · ${monster.size || ''} ${monster.type || ''}`)}
      <div class="detailFacts">
        <span><b>CA</b>${esc(monster.ac ?? '—')}</span>
        <span><b>PV</b>${esc(monster.hp ?? '—')}${monster.hpFormula ? ` (${esc(monster.hpFormula)})` : ''}</span>
        <span><b>Deslocamento</b>${esc(monster.speed ?? '—')} pés</span>
        <span><b>XP</b>${esc(monster.xp ?? '—')}</span>
      </div>
      <div class="monsterAbilities">${ABILITIES.map((ability) => {
        const score = abilities[ability.key];
        return `<span><b>${esc(ability.short)}</b>${esc(score ?? '—')} <em>${score != null ? signedFmt(Math.floor((score - 10) / 2)) : ''}</em></span>`;
      }).join('')}</div>
      ${monster.skills ? `<p class="proficiencyLine"><b>Perícias</b> ${esc(monster.skills)}</p>` : ''}
      ${Object.keys(monster.savingThrows || {}).length ? `<p class="proficiencyLine"><b>Salvaguardas</b> ${Object.entries(monster.savingThrows).map(([key, value]) => `${esc(abilityName(key))} ${signedFmt(value)}`).join(', ')}</p>` : ''}
      ${monster.vulnerabilities ? `<p class="proficiencyLine"><b>Vulnerabilidades</b> ${esc(monster.vulnerabilities)}</p>` : ''}
      ${monster.resistances ? `<p class="proficiencyLine"><b>Resistências</b> ${esc(monster.resistances)}</p>` : ''}
      ${monster.immunities ? `<p class="proficiencyLine"><b>Imunidades</b> ${esc(monster.immunities)}</p>` : ''}
      ${monster.senses ? `<p class="proficiencyLine"><b>Sentidos</b> ${esc(monster.senses)}</p>` : ''}
      ${monster.languages ? `<p class="proficiencyLine"><b>Idiomas</b> ${esc(monster.languages)}</p>` : ''}
      ${(monster.traits || []).length ? `<h4 class="detailSubhead">Traços</h4>${monster.traits.map((trait) => `<div class="monsterAction"><b>${esc(trait.name)}</b>${renderText(trait.description)}</div>`).join('')}` : ''}
      ${renderActionGroup('Ações', monster.actions)}
      ${renderActionGroup('Ações bônus', monster.bonusActions)}
      ${renderActionGroup('Reações', monster.reactions)}
      ${renderActionGroup('Ações lendárias', monster.legendaryActions)}
      ${(monster.spells || []).length ? `<h4 class="detailSubhead">Magias</h4><p>${monster.spells.map(esc).join(', ')}</p>` : ''}`;
  }

  function renderActionGroup(title, actions) {
    if (!actions?.length) return '';
    return `<h4 class="detailSubhead">${esc(title)}</h4>${actions.map((action) => `<div class="monsterAction"><b>${esc(action.name || title)}</b>${renderText(action.description)}</div>`).join('')}`;
  }

  function renderItemDetail(item) {
    return `${detailHeader(item, item.type || 'Item')}
      <div class="detailFacts">
        <span><b>Raridade</b>${esc(item.rarity || '—')}</span>
        <span><b>Custo</b>${esc(item.cost || '—')}</span>
        <span><b>Peso</b>${esc(item.weight || '—')}</span>
        <span><b>Sintonização</b>${item.attunement ? 'Sim' : 'Não'}</span>
      </div>
      ${renderText(item.description)}`;
  }

  function renderWeaponDetail(weapon) {
    return `${detailHeader(weapon, weapon.type || 'Arma')}
      <div class="detailFacts">
        <span><b>Dano</b>${esc(weapon.damage || '—')}</span>
        <span><b>Versátil</b>${esc(weapon.versatileDamage || '—')}</span>
        <span><b>Custo</b>${esc(weapon.cost || '—')}</span>
        <span><b>Peso</b>${esc(weapon.weight || '—')}</span>
      </div>
      <p class="charMuted">${weapon.simple ? 'Arma simples' : 'Arma marcial'}${weapon.rarity ? ` · ${esc(weapon.rarity)}` : ''}</p>`;
  }

  function renderArmorDetail(armor) {
    return `${detailHeader(armor, armor.type || 'Armadura')}
      <div class="detailFacts">
        <span><b>CA base</b>${esc(armor.baseAc ?? '—')}</span>
        <span><b>Força exigida</b>${esc(armor.requiredStrength || '—')}</span>
        <span><b>Furtividade</b>${armor.stealthDisadvantage ? 'Desvantagem' : 'Normal'}</span>
        <span><b>Custo</b>${esc(armor.cost || '—')}</span>
      </div>`;
  }

  function renderFeatDetail(feat) {
    return `${detailHeader(feat, feat.level ? `Talento · nível ${feat.level}` : 'Talento')}${renderText(feat.description)}`;
  }

  function renderRaceDetail(race) {
    return `${detailHeader(race, `Raça · ${race.speed} pés`)}
      <h4 class="detailSubhead">Aumentos de atributo</h4>
      <div class="detailTags">${(race.abilityIncreases || []).map((increase) => increase.choose ? `<span>Escolha: ${increase.choose.map(esc).join(' / ')} (+${increase.amount})</span>` : `<span>${esc(abilityName(increase.ability))} +${increase.amount}</span>`).join('') || '<span>—</span>'}</div>
      ${(race.traits || []).length ? `<h4 class="detailSubhead">Traços</h4>${race.traits.map((trait) => `<details class="featureCard"><summary><b>${esc(trait.name)}</b></summary>${renderText(trait.description)}</details>`).join('')}` : ''}
      ${(race.subraces || []).length ? `<h4 class="detailSubhead">Subraças</h4><p>${race.subraces.map((sub) => esc(sub.name)).join(', ')}</p>` : ''}`;
  }

  function renderBackgroundDetail(background) {
    return `${detailHeader(background, 'Antecedente')}
      <div class="detailFacts">
        <span><b>Perícias</b>${esc((background.skills || []).map(skillName).join(', ') || '—')}</span>
        <span><b>Ferramentas</b>${esc((background.tools || []).join(', ') || '—')}</span>
        <span><b>Idiomas</b>${esc((background.languages || []).join(', ') || '—')}</span>
        <span><b>Ouro</b>${esc(background.gold || 0)} po</span>
      </div>
      ${(background.features || []).map((feature) => `<details class="featureCard" open><summary><b>${esc(feature.name)}</b></summary>${renderText(feature.description)}</details>`).join('')}
      ${(background.equipment || []).length ? `<p class="proficiencyLine"><b>Equipamento</b> ${background.equipment.map(esc).join(', ')}</p>` : ''}`;
  }

  function renderClassDetail(cls) {
    const features = groupBy(cls.features || [], (feature) => feature.level);
    return `${detailHeader(cls, `Classe · ${cls.hitDie}`)}
      <div class="detailFacts">
        <span><b>Dado de vida</b>${esc(cls.hitDie)}</span>
        <span><b>Salvaguardas</b>${esc((cls.savingThrows || []).map(abilityName).join(', '))}</span>
        <span><b>Conjuração</b>${esc(cls.spellcastingAbility ? abilityName(cls.spellcastingAbility.slice(0, 3)) : '—')}</span>
        <span><b>Subclasse</b>nível ${esc(cls.subclassLevel)}</span>
      </div>
      <p class="proficiencyLine"><b>Perícias</b> ${esc((cls.skillOptions || []).map(skillName).join(', '))}</p>
      <div class="classFeatureList">${features.map(([level, list]) => `<div class="classFeatureLevel"><h4>Nível ${level}</h4>${list.map((feature) => `<details class="featureCard"><summary><b>${esc(feature.name)}</b></summary>${renderText(feature.description)}</details>`).join('')}</div>`).join('')}</div>
      ${(cls.subclasses || []).length ? `<details class="classSubclasses"><summary>Subclasses (${cls.subclasses.length})</summary>${cls.subclasses.map((sub) => `<div class="subclassBlock"><b>${esc(sub.name)}</b> <small>${esc(sourceLabel(sub.source))}</small>${(sub.features || []).map((feature) => `<p class="proficiencyLine"><b>Nv ${feature.level}</b> ${esc(feature.name)}</p>`).join('')}</div>`).join('')}</details>` : ''}`;
  }

  function renderEncounterDetail(encounter) {
    return `${detailHeader(encounter, 'Encontro')}
      ${renderText(encounter.description)}
      ${(encounter.combatants || []).length ? `<div class="charTableWrap"><table class="charTable"><thead><tr><th>Monstro</th><th>CR</th><th>XP</th></tr></thead><tbody>${encounter.combatants.map((monster) => `<tr><td>${esc(monster.name)}</td><td>${esc(monster.cr ?? '—')}</td><td>${esc(monster.xp ?? '—')}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  }

  // -------------------------------------------------------------------------
  // Criador provisório
  // -------------------------------------------------------------------------

  async function loadCreatorData() {
    if (state.creator.loaded || state.creator.loading) return;
    state.creator.loading = true;
    try {
      const [races, classes, backgrounds] = await Promise.all([
        fetch('./5e/races.json').then((response) => response.ok ? response.json() : []),
        fetch('./5e/classes.json').then((response) => response.ok ? response.json() : []),
        fetch('./5e/backgrounds.json').then((response) => response.ok ? response.json() : []),
      ]);
      state.creator.races = races;
      state.creator.classes = classes;
      state.creator.backgrounds = backgrounds;
      state.creator.loaded = true;
      if (!races.some((race) => race.id === state.creator.data.raceId)) state.creator.data.raceId = races[0]?.id || '';
      if (!classes.some((cls) => cls.id === state.creator.data.classId)) state.creator.data.classId = classes[0]?.id || '';
      if (!backgrounds.some((background) => background.id === state.creator.data.backgroundId)) state.creator.data.backgroundId = backgrounds[0]?.id || '';
    } catch (error) {
      flash(`Não foi possível carregar os dados do criador: ${error.message}`, true);
    } finally {
      state.creator.loading = false;
    }
  }

  function creatorSelections() {
    const data = state.creator.data;
    return {
      race: state.creator.races.find((race) => race.id === data.raceId) || state.creator.races[0] || null,
      cls: state.creator.classes.find((cls) => cls.id === data.classId) || state.creator.classes[0] || null,
      background: state.creator.backgrounds.find((background) => background.id === data.backgroundId) || state.creator.backgrounds[0] || null,
    };
  }

  function racialBonuses(race) {
    const bonuses = {};
    for (const increase of race?.abilityIncreases || []) {
      if (increase.choose) {
        const choice = abilityKey(increase.choose[0]);
        if (choice) bonuses[choice] = (bonuses[choice] || 0) + num(increase.amount);
      } else if (increase.ability) {
        const key = abilityKey(increase.ability);
        bonuses[key] = (bonuses[key] || 0) + num(increase.amount);
      }
    }
    return bonuses;
  }

  function creatorTotals() {
    const {race} = creatorSelections();
    const bonuses = racialBonuses(race);
    const totals = {};
    for (const ability of ABILITIES) {
      totals[ability.key] = num(state.creator.data.abilities[ability.key], 10) + num(bonuses[ability.key]);
    }
    return {totals, bonuses};
  }

  function renderCreatorTab() {
    if (!state.creator.loaded) {
      creatorTab.innerHTML = `<div class="charEmpty"><h3>Carregando o criador…</h3><p>Lendo raças, classes e antecedentes do pacote 5e.</p></div>`;
      loadCreatorData().then(() => {
        if (state.tab === 'creator') renderCreatorTab();
      });
      return;
    }
    const {race, cls, background} = creatorSelections();
    const {totals, bonuses} = creatorTotals();
    const classSkills = cls?.skillOptions || [];
    const classSkillCount = cls?.skillCount ?? 2;
    const backgroundSkills = background?.skills || [];
    const selectedSkills = new Set([...state.creator.data.skills, ...backgroundSkills]);
    const subclasses = cls?.subclasses || [];
    const canChooseSubclass = cls && cls.subclassLevel <= 1;
    const conMod = Math.floor((totals.con - 10) / 2);
    const dexMod = Math.floor((totals.dex - 10) / 2);
    const hp = Math.max(1, Number(String(cls?.hitDie || 'd8').replace(/[^0-9]/g, '')) + conMod);
    const aligned = ALIGNMENT_OPTIONS.find(([id]) => id === state.creator.data.alignment);
    creatorTab.innerHTML = `
      <div class="creatorIntro">
        <div>
          <div class="eyebrow">CRIADOR PROVISÓRIO · D&D 5E</div>
          <h3>Comece no nível 1</h3>
          <p>Escolha raça, classe e antecedente; distribua os atributos e marque as perícias. A ficha é salva neste navegador e pode subir de nível depois.</p>
        </div>
      </div>
      <div class="creatorGrid">
        <label>Nome do personagem<input id="creatorName" maxlength="100" value="${esc(state.creator.data.name)}" placeholder="Tytos Karnenhall"></label>
        <label>Jogador<input id="creatorPlayer" maxlength="100" value="${esc(state.creator.data.player)}" placeholder="Opcional"></label>
        <label>Raça<select id="creatorRace">${state.creator.races.map((item) => `<option value="${esc(item.id)}" ${item.id === race?.id ? 'selected' : ''}>${esc(item.name)} · ${esc(sourceLabel(item.source))}</option>`).join('')}</select></label>
        <label>Classe<select id="creatorClass">${state.creator.classes.map((item) => `<option value="${esc(item.id)}" ${item.id === cls?.id ? 'selected' : ''}>${esc(item.name)} · ${esc(item.hitDie)}</option>`).join('')}</select></label>
        <label>Antecedente<select id="creatorBackground">${state.creator.backgrounds.map((item) => `<option value="${esc(item.id)}" ${item.id === background?.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label>
        <label>Alinhamento<select id="creatorAlignment">${ALIGNMENT_OPTIONS.map(([id, label]) => `<option value="${id}" ${id === state.creator.data.alignment ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>
        ${canChooseSubclass && subclasses.length ? `<label>Subclasse<select id="creatorSubclass"><option value="">Escolher depois</option>${subclasses.map((sub) => `<option value="${esc(sub.id)}" ${sub.id === state.creator.data.subclassId ? 'selected' : ''}>${esc(sub.name)}</option>`).join('')}</select></label>` : `<p class="creatorNote">${cls ? `A subclasse de ${esc(cls.name)} é escolhida no nível ${cls.subclassLevel}.` : ''}</p>`}
      </div>

      <h4 class="creatorSectionTitle">Atributos <button id="creatorArray" class="charSmallButton">Usar array padrão</button></h4>
      <div class="creatorAbilities">
        ${ABILITIES.map((ability) => `<label class="creatorAbility"><span>${esc(ability.name)} <small>${esc(ability.short)}</small></span><input data-creator-ability="${ability.key}" type="number" min="3" max="18" value="${esc(state.creator.data.abilities[ability.key])}"><em>+${num(bonuses[ability.key])}</em><b>${totals[ability.key]}</b></label>`).join('')}
      </div>
      <p class="creatorNote">Os bônus raciais são aplicados automaticamente (escolhas raciais usam a primeira opção). Ajuste os valores base antes de criar.</p>

      <h4 class="creatorSectionTitle">Perícias de classe <small>escolha ${classSkillCount}</small></h4>
      <div class="creatorSkills">
        ${classSkills.map((skill) => {
          const meta = SKILLS.find((item) => item.key === skill || item.cah === String(skill).toUpperCase());
          const label = meta?.name || skill;
          const checked = state.creator.data.skills.includes(skill) || backgroundSkills.includes(skill);
          return `<label class="creatorSkill ${backgroundSkills.includes(skill) ? 'fromBackground' : ''}"><input type="checkbox" data-creator-skill="${esc(skill)}" ${checked ? 'checked' : ''} ${backgroundSkills.includes(skill) ? 'disabled' : ''}> ${esc(label)}${backgroundSkills.includes(skill) ? ' <small>antecedente</small>' : ''}</label>`;
        }).join('') || '<p class="charMuted">Esta classe não lista escolhas de perícia.</p>'}
      </div>

      <div class="creatorSummary" id="creatorSummary">
        <div><span>PV</span><b>${hp}</b></div>
        <div><span>CA</span><b>${10 + dexMod}</b></div>
        <div><span>Deslocamento</span><b>${race?.speed || 30} pés</b></div>
        <div><span>PB</span><b>+2</b></div>
        <div><span>Salvaguardas</span><b>${(cls?.savingThrows || []).map((save) => abilityName({strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha'}[save] || save)).join(', ') || '—'}</b></div>
        <div><span>Alinhamento</span><b>${esc(aligned?.[1] || '—')}</b></div>
      </div>
      <div class="creatorActions">
        <button id="creatorCreate" class="charPrimary">Criar ficha no nível 1</button>
        <span class="charMuted">${esc(cls?.name || '')} · ${esc(race?.name || '')} · ${esc(background?.name || '')}</span>
      </div>`;
    updateCreatorSummary();
  }

  function updateCreatorSummary() {
    if (!state.creator.loaded) return;
    const {race, cls} = creatorSelections();
    const {totals} = creatorTotals();
    const conMod = Math.floor((totals.con - 10) / 2);
    const dexMod = Math.floor((totals.dex - 10) / 2);
    const hp = Math.max(1, Number(String(cls?.hitDie || 'd8').replace(/[^0-9]/g, '')) + conMod);
    const summary = creatorTab.querySelector('#creatorSummary');
    if (!summary) return;
    const values = {PV: hp, CA: 10 + dexMod, Deslocamento: `${race?.speed || 30} pés`, PB: '+2'};
    for (const [label, value] of Object.entries(values)) {
      const box = [...summary.querySelectorAll('div')].find((item) => item.querySelector('span')?.textContent === label);
      if (box) box.querySelector('b').textContent = value;
    }
    for (const ability of ABILITIES) {
      const input = creatorTab.querySelector(`[data-creator-ability="${ability.key}"]`);
      const card = input?.closest('.creatorAbility');
      if (card) {
        card.querySelector('b').textContent = totals[ability.key];
        card.querySelector('em').textContent = `+${num(racialBonuses(race)[ability.key])}`;
      }
    }
  }

  async function createFromCreator() {
    const {race, cls, background} = creatorSelections();
    if (!race || !cls || !background) return flash('Escolha raça, classe e antecedente.', true);
    const name = state.creator.data.name.trim() || 'Aventureiro';
    const classSkillCount = cls.skillCount ?? 2;
    const chosen = state.creator.data.skills.filter((skill) => cls.skillOptions.includes(skill));
    if (chosen.length > classSkillCount) return flash(`Escolha no máximo ${classSkillCount} perícias de classe.`, true);
    if (chosen.length < classSkillCount) return flash(`Escolha ${classSkillCount} perícias de classe (faltam ${classSkillCount - chosen.length}).`, true);
    const {totals} = creatorTotals();
    const subclass = (cls.subclasses || []).find((sub) => sub.id === state.creator.data.subclassId) || null;
    const skills = {};
    for (const skill of SKILLS) skills[skill.key] = 'NONE';
    for (const skill of [...chosen, ...(background.skills || [])]) {
      const meta = SKILLS.find((item) => item.key === skill || item.cah === String(skill).toUpperCase());
      if (meta) skills[meta.key] = 'FULL';
    }
    const classSnapshot = {
      id: cls.id, name: cls.name, hitDie: cls.hitDie, savingThrows: cls.savingThrows,
      spellcastingAbility: cls.spellcastingAbility, features: cls.features,
      skillOptions: cls.skillOptions, subclassLevel: cls.subclassLevel, source: cls.source,
      subclasses: cls.subclasses || [],
      armorProficiencies: cls.armorProficiencies || [],
      weaponProficiencies: cls.weaponProficiencies || [],
    };
    const raceSnapshot = {
      id: race.id, name: race.name, speed: race.speed, size: race.size || 'Médio',
      traits: race.traits, abilityIncreases: race.abilityIncreases,
    };
    const backgroundSnapshot = {
      id: background.id, name: background.name, skills: background.skills,
      features: background.features, equipment: background.equipment,
    };
    const native = makeNativeCharacter({
      name,
      player: state.creator.data.player,
      alignment: state.creator.data.alignment,
      level: 1,
      abilities: totals,
      race: raceSnapshot,
      class: classSnapshot,
      subclass: subclass ? {id: subclass.id, name: subclass.name, features: subclass.features} : null,
      background: backgroundSnapshot,
      skills,
      equipment: (background.equipment || []).map((name) => ({name, amount: 1, equipped: false})),
      proficiencies: {
        ARMOR: (cls.armorProficiencies || []).map(proficiencyLabelLong),
        WEAPON: (cls.weaponProficiencies || []).map(proficiencyLabelLong),
      },
      attacks: [{
        name: 'Ataque desarmado', ability: 'str', proficient: true,
        attack: Math.floor((totals.str - 10) / 2) + 2,
        damage: `1 ${Math.floor((totals.str - 10) / 2) >= 0 ? '+' : '-'} ${Math.abs(Math.floor((totals.str - 10) / 2))}`,
        damageType: 'Concussão', versatile: '', properties: '', range: 'corpo a corpo', description: '',
      }],
      notes: ['Ficha criada no Criador provisório do Atlas.'],
    });
    await saveNativeRecord(native, true);
  }

  // -------------------------------------------------------------------------
  // Dados
  // -------------------------------------------------------------------------

  function rollExpression(expression) {
    const source = String(expression || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!source) throw new Error('Digite uma expressão como 10d20+2.');
    const pattern = /([+-]?)(?:(\d*)d(\d+)|(\d+))/g;
    let match;
    let total = 0;
    const details = [];
    let found = false;
    while ((match = pattern.exec(source)) !== null) {
      found = true;
      const sign = match[1] === '-' ? -1 : 1;
      if (match[3]) {
        const count = Math.max(1, Math.min(100, num(match[2], 1)));
        const sides = Math.max(2, Math.min(1000, num(match[3], 20)));
        const rolls = Array.from({length: count}, () => rollDie(sides));
        const sum = rolls.reduce((value, roll) => value + roll, 0);
        total += sign * sum;
        details.push({type: 'dice', sign, count, sides, rolls, sum, text: `${count}d${sides} [${rolls.join(', ')}] = ${sum}`});
      } else if (match[4]) {
        const value = num(match[4]);
        total += sign * value;
        details.push({type: 'mod', sign, value, text: `${sign < 0 ? '−' : '+'} ${value}`});
      }
    }
    if (!found) throw new Error('Não encontrei dados ou números na expressão.');
    return {total, details, expression: source};
  }

  function rollDice(expression = state.dice.expression) {
    try {
      const result = rollExpression(expression);
      state.dice.expression = expression;
      state.dice.history.unshift({
        expression,
        total: result.total,
        detail: result.details.map((item) => item.text).join(' · '),
        at: new Date().toISOString(),
      });
      state.dice.history = state.dice.history.slice(0, 12);
      renderDiceTab();
      flash(`${expression} = ${result.total}`);
    } catch (error) {
      flash(error.message, true);
    }
  }

  function renderDiceTab() {
    const last = state.dice.history[0];
    diceTab.innerHTML = `
      <div class="diceLayout">
        <div class="diceBox">
          <div class="eyebrow">ROLAGEM DE DADOS</div>
          <h3>Role a sorte</h3>
          <label>Expressão<input id="diceExpression" value="${esc(state.dice.expression)}" placeholder="10d20+2"></label>
          <div class="diceQuick">
            ${[4, 6, 8, 10, 12, 20, 100].map((sides) => `<button data-die="${sides}">d${sides}</button>`).join('')}
          </div>
          <button id="diceRoll" class="charPrimary">Rolar</button>
          <div class="diceResult ${last ? '' : 'empty'}">
            ${last ? `<span>${esc(last.expression)}</span><strong>${fmt(last.total)}</strong><small>${esc(last.detail)}</small>` : '<p class="charMuted">Digite 10d20+2, 2d6+3 ou clique em um dado.</p>'}
          </div>
          <p class="charMuted">Aceita vários termos: 2d6+1d8+3, 4d6-1, 1d20. Limite de 100 dados por termo.</p>
        </div>
        <div class="diceHistory">
          <h4>Histórico</h4>
          ${state.dice.history.length ? state.dice.history.map((item) => `<div class="diceHistoryRow"><span>${esc(item.expression)}</span><b>${fmt(item.total)}</b><small>${esc(item.detail)}</small></div>`).join('') : '<p class="charMuted">Nenhuma rolagem ainda.</p>'}
        </div>
      </div>`;
    const input = diceTab.querySelector('#diceExpression');
    input.onkeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        rollDice(input.value);
      }
    };
    input.oninput = () => { state.dice.expression = input.value; };
    diceTab.querySelector('#diceRoll').onclick = () => rollDice(input.value);
    diceTab.querySelectorAll('[data-die]').forEach((button) => {
      button.onclick = () => rollDice(`1d${button.dataset.die}`);
    });
  }

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------

  async function importRaw(raw, fileName = 'ficha.cah') {
    const model = normalizeCah(raw);
    const now = new Date().toISOString();
    const existing = state.records.find((record) => record.id === model.id);
    const record = {
      id: model.id,
      kind: 'cah',
      name: model.name,
      fileName,
      importedAt: existing?.importedAt || now,
      updatedAt: now,
      raw,
      versions: existing
        ? [...(existing.versions || []), {at: existing.updatedAt, fileName: existing.fileName, raw: existing.raw}].slice(-MAX_VERSIONS)
        : [],
    };
    applyRecord(record, true);
    void putRecord(record);
    flash(`Ficha de ${model.name} importada.`);
    return model;
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) return flash('Arquivo muito grande (limite de 20 MB).', true);
    try {
      const text = await file.text();
      await importRaw(JSON.parse(text), file.name);
    } catch (error) {
      flash(`Não foi possível ler o .cah: ${error.message}`, true);
    }
  }

  function savePlay(record) {
    record.updatedAt = new Date().toISOString();
    void putRecord(record);
    renderSheetTab();
  }

  function activePlay(record, model) {
    const play = ensurePlay(record, model);
    if (!play.pactUsed) play.pactUsed = 0;
    return play;
  }

  function changeHp(delta) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    play.hp.current = Math.max(0, Math.min(model.hp.max, num(play.hp.current, model.hp.max) + num(delta)));
    savePlay(record);
  }

  function setHp(value) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    play.hp.current = Math.max(0, Math.min(model.hp.max, num(value, play.hp.current)));
    savePlay(record);
  }

  function spendResource(id, amount) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const resource = model.specialAbilities.find((item) => String(item.id) === String(id));
    if (!resource) return;
    const play = activePlay(record, model);
    const stateResource = play.resources[resource.id];
    if (!stateResource) return;
    const spend = Math.min(num(amount, 1), num(stateResource.current));
    if (spend <= 0) return flash(`${resource.name} já está vazio.`, true);
    stateResource.current = Math.max(0, num(stateResource.current) - spend);
    savePlay(record);
    flash(`${resource.name}: −${spend}. Restam ${stateResource.current}.`);
  }

  function restoreResource(id, amount) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const resource = model.specialAbilities.find((item) => String(item.id) === String(id));
    if (!resource) return;
    const play = activePlay(record, model);
    const stateResource = play.resources[resource.id];
    if (!stateResource) return;
    stateResource.current = String(amount) === 'all'
      ? resource.maxUses
      : Math.min(resource.maxUses, num(stateResource.current) + num(amount, 1));
    savePlay(record);
  }

  function rollDie(sides) {
    return 1 + Math.floor(Math.random() * Math.max(1, sides));
  }

  function shortRest() {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    const totalDice = (model.hitDice || []).reduce((total, die) => total + num(die.current), 0);
    const conMod = model.abilities.con.mod;
    const shortResources = (model.specialAbilities || []).filter((resource) => resource.recharge === 'short');
    const dialog = document.createElement('dialog');
    dialog.className = 'charDialog';
    dialog.innerHTML = `
      <form method="dialog">
        <div class="eyebrow">DESCANSO CURTO</div>
        <h2>${esc(model.name)}</h2>
        <p class="charMuted">Gaste dados de vida para recuperar PV. Cada dado cura o resultado + ${signedFmt(conMod)} (Constituição).</p>
        <label>Dados de vida a gastar<input id="shortDice" type="number" min="0" max="${totalDice}" value="0"></label>
        <p class="charMuted">Disponíveis: ${totalDice} · ${(model.hitDice || []).map((die) => `${die.current}${die.die}`).join(' + ') || 'nenhum'}</p>
        ${shortResources.length ? `<p class="charMuted"><b>Recursos restaurados:</b> ${shortResources.map((resource) => esc(resource.name)).join(', ')}</p>` : ''}
        ${model.pactMagic?.count ? '<p class="charMuted">Espaços de pacto também são restaurados.</p>' : ''}
        <div class="charDialogActions">
          <button value="cancel">Cancelar</button>
          <button value="confirm" class="charPrimary">Descansar</button>
        </div>
      </form>`;
    document.body.append(dialog);
    dialog.querySelector('button[value="confirm"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      const count = Math.max(0, Math.min(totalDice, num(dialog.querySelector('#shortDice')?.value)));
      const rolls = [];
      let index = 0;
      for (const die of model.hitDice || []) {
        const state = play.hitDice[index];
        const available = num(state?.current, die.current);
        const sides = Number(String(die.die || 'd8').replace(/[^0-9]/g, '')) || 8;
        for (let spent = 0; spent < Math.min(count - rolls.length, available); spent += 1) {
          const roll = rollDie(sides);
          rolls.push({die: die.die, roll, total: roll + conMod});
          if (state) state.current = Math.max(0, num(state.current) - 1);
        }
        index += 1;
      }
      const heal = rolls.reduce((total, item) => total + item.total, 0);
      play.hp.current = Math.max(0, Math.min(model.hp.max, num(play.hp.current) + heal));
      play.hp.failures = 0;
      play.hp.successes = 0;
      play.stable = false;
      if (model.pactMagic?.count) play.pactUsed = 0;
      for (const resource of shortResources) {
        if (play.resources[resource.id]) play.resources[resource.id].current = resource.maxUses;
      }
      savePlay(record);
      dialog.close();
      const detail = rolls.length ? ` (${rolls.map((item) => `${item.roll}${item.die}`).join(' + ')}${conMod ? ` ${signedFmt(conMod * rolls.length)}` : ''})` : '';
      flash(`${model.name} descansou${heal ? ` e recuperou ${heal} PV` : ''}${detail}.`);
    });
    dialog.addEventListener('close', () => dialog.remove(), {once: true});
    dialog.showModal();
  }

  function addCondition() {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    const value = panel.querySelector('#conditionSelect')?.value;
    if (!value) return;
    if (!play.conditions.includes(value)) play.conditions.push(value);
    savePlay(record);
  }

  function removeCondition(condition) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    play.conditions = play.conditions.filter((item) => item !== condition);
    savePlay(record);
  }

  function changeExhaustion(delta) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    play.exhaustion = Math.max(0, Math.min(6, num(play.exhaustion) + num(delta)));
    savePlay(record);
  }

  function rollDeathSave() {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    const roll = rollDie(20);
    if (roll === 20) {
      play.hp.current = 1;
      play.hp.failures = 0;
      play.hp.successes = 0;
      play.stable = false;
      flash('Teste de morte: 20 natural! Recupera 1 PV.');
    } else if (roll === 1) {
      play.hp.failures = Math.min(3, num(play.hp.failures) + 2);
      flash('Teste de morte: 1 natural — duas falhas.');
    } else if (roll >= 10) {
      play.hp.successes = Math.min(3, num(play.hp.successes) + 1);
      flash(`Teste de morte: ${roll} — sucesso.`);
    } else {
      play.hp.failures = Math.min(3, num(play.hp.failures) + 1);
      flash(`Teste de morte: ${roll} — falha.`);
    }
    savePlay(record);
  }

  function stabilize() {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    play.hp.successes = 3;
    play.stable = true;
    savePlay(record);
    flash(`${model.name} estabilizado.`);
  }

  function longRest(record = activeRecord()) {
    if (!record) return;
    const model = modelFor(record);
    const play = activePlay(record, model);
    play.hp.current = model.hp.max;
    play.hp.temp = 0;
    play.hp.failures = 0;
    play.hp.successes = 0;
    play.slotsUsed = Array(9).fill(0);
    play.pactUsed = 0;
    play.exhaustion = Math.max(0, num(play.exhaustion) - 1);
    play.stable = false;
    play.hitDice = (model.hitDice || []).map((die) => ({...die, current: die.max}));
    for (const resource of model.specialAbilities || []) {
      if (play.resources[resource.id]) play.resources[resource.id].current = resource.maxUses;
    }
    savePlay(record);
    flash(`${model.name} completou um descanso longo.`);
  }

  function castSpellAt(id, slotLevel = null) {
    const record = activeRecord();
    if (!record) return false;
    const model = modelFor(record);
    const spell = model.spells.find((item) => String(item.id) === String(id));
    if (!spell) return false;
    if (preparedCaster(model) && !spell.prepared && spell.level > 0) {
      return flash(`${spell.name} não está preparada. Prepare a magia antes de conjurar.`, true);
    }
    const play = activePlay(record, model);
    if (spell.level === 0) {
      savePlay(record);
      flash(`${spell.name} conjurada como truque (sem gastar espaço).`);
      return true;
    }
    const chosen = slotLevel === 'pact' ? 'pact' : Math.max(spell.level, num(slotLevel, spell.level));
    if (chosen === 'pact') {
      if (!model.pactMagic?.count || spell.level > model.pactMagic.slotLevel || num(play.pactUsed) >= num(model.pactMagic.count)) {
        return flash('Sem espaço de pacto disponível.', true);
      }
      play.pactUsed = num(play.pactUsed) + 1;
      savePlay(record);
      flash(`${spell.name} conjurada com um espaço de pacto de ${levelLabel(model.pactMagic.slotLevel)}.`);
      return true;
    }
    const index = chosen - 1;
    if (index < 0 || index > 8 || num(play.slotsUsed[index]) >= num(model.spellSlots[index])) {
      return flash(`Sem espaço de ${levelLabel(chosen)} disponível.`, true);
    }
    play.slotsUsed[index] = num(play.slotsUsed[index]) + 1;
    savePlay(record);
    flash(`${spell.name} conjurada usando um espaço de ${levelLabel(chosen)}.`);
    return true;
  }

  function openCastDialog(id) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const spell = model.spells.find((item) => String(item.id) === String(id));
    if (!spell) return;
    if (preparedCaster(model) && !spell.prepared && spell.level > 0) {
      return flash(`${spell.name} não está preparada. Prepare a magia antes de conjurar.`, true);
    }
    if (spell.level === 0) return castSpellAt(id);
    const play = activePlay(record, model);
    const options = [];
    for (let level = spell.level; level <= 9; level += 1) {
      const remaining = num(model.spellSlots[level - 1]) - num(play.slotsUsed[level - 1]);
      if (remaining > 0) options.push({value: level, label: `${levelLabel(level)} (${remaining} restante${remaining === 1 ? '' : 's'})`});
    }
    if (model.pactMagic?.count && spell.level <= model.pactMagic.slotLevel) {
      const remaining = num(model.pactMagic.count) - num(play.pactUsed);
      if (remaining > 0) options.push({value: 'pact', label: `Pacto de ${levelLabel(model.pactMagic.slotLevel)} (${remaining} restante${remaining === 1 ? '' : 's'})`});
    }
    if (!options.length) return flash(`Sem espaço de magia disponível para ${spell.name}.`, true);
    const dialog = document.createElement('dialog');
    dialog.className = 'charDialog castDialog';
    dialog.innerHTML = `
      <form method="dialog">
        <div class="eyebrow">CONJURAR MAGIA</div>
        <h2>${esc(spell.name)}</h2>
        <p class="charMuted">${esc(levelLabel(spell.level))} · ${esc(spell.school || '')} · ${esc(spell.castingTime || '')} · alcance ${esc(spell.range || '—')}</p>
        <div class="castMeta">${metadataLine(spell.duration, spell.components)}</div>
        <label>Espaço usado<select id="castSlot">${options.map((option) => `<option value="${option.value}">${esc(option.label)}</option>`).join('')}</select></label>
        <div class="castHigher">
          <b>Em nível superior.</b>
          ${spell.higherLevels ? renderText(spell.higherLevels) : '<p class="charMuted">O arquivo não traz um texto específico de upcast. Use o nível do espaço escolhido para a escala da mesa.</p>'}
          ${(spell.damage || []).length ? `<p class="proficiencyLine"><b>Dano/efeito no arquivo:</b> ${spell.damage.map(esc).join(' · ')}</p>` : ''}
        </div>
        <div class="charDialogActions">
          <button value="cancel">Cancelar</button>
          <button value="confirm" class="charPrimary">Conjurar</button>
        </div>
      </form>`;
    document.body.append(dialog);
    dialog.querySelector('button[value="confirm"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      const slot = dialog.querySelector('#castSlot')?.value;
      const ok = castSpellAt(id, slot);
      dialog.close();
      if (ok) dialog.remove();
    });
    dialog.addEventListener('close', () => dialog.remove(), {once: true});
    dialog.showModal();
  }

  function togglePrepared(id) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const spell = model.spells.find((item) => String(item.id) === String(id));
    if (!spell) return;
    if (!spell.prepared && preparedCount(model) >= preparedLimit(model)) {
      return flash(`Limite de magias preparadas: ${preparedLimit(model)}.`, true);
    }
    if (record.kind === 'cah') {
      const raw = structuredClone(record.raw);
      const target = (raw.spells || []).find((item) => String(item.id || item.name) === String(id));
      if (!target) return;
      target.prepared = !target.prepared;
      record.raw = raw;
    } else {
      const native = structuredClone(record.native);
      const target = (native.spells || []).find((item) => String(item.id || item.name) === String(id));
      if (!target) return;
      target.prepared = !target.prepared;
      record.native = native;
    }
    savePlay(record);
  }

  function toggleAttunement(id) {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const item = (model.equipment || []).find((entry) => String(entry.id) === String(id));
    if (!item) return;
    if (!item.attuned && (model.equipment || []).filter((entry) => entry.attuned).length >= 3) {
      return flash('Máximo de 3 itens sintonizados.', true);
    }
    if (record.kind === 'cah') {
      const raw = structuredClone(record.raw);
      const target = (raw.equipment || []).find((entry) => String(entry.id || entry.name) === String(id));
      if (!target) return;
      target.isAttuned = !target.isAttuned;
      record.raw = raw;
    } else {
      const native = structuredClone(record.native);
      const target = (native.equipment || []).find((entry) => String(entry.id || entry.name) === String(id));
      if (!target) return;
      target.attuned = !target.attuned;
      record.native = native;
    }
    savePlay(record);
    flash(`${item.name} ${item.attuned ? 'liberado' : 'sintonizado'}.`);
  }

  function addCompendiumEntry(category, entry) {
    const record = activeRecord();
    if (!record || !entry) return;
    const model = modelFor(record);
    if (!['spells', 'items', 'weapons', 'armors'].includes(category)) {
      return flash('Arraste magias, itens, armas ou armaduras para a ficha.', true);
    }
    const now = new Date().toISOString();
    const spell = {
      id: entry.id || entry.name,
      name: entry.name,
      level: entry.level ?? 0,
      school: entry.school || '',
      type: `${levelLabel(entry.level)} ${entry.school || ''}`.trim(),
      castingTime: entry.castingTime || '',
      range: entry.range || '',
      duration: entry.duration || '',
      components: entry.components || '',
      description: entry.description || '',
      higherLevels: entry.higherLevels || '',
      prepared: false,
      isRitual: !!entry.ritual,
      classes: (entry.classes || []).join(', '),
    };
    const damageMatch = String(entry.damage || '').match(/(\d+)d(\d+)/i);
    const versatileMatch = String(entry.versatileDamage || '').match(/(\d+)d(\d+)/i);
    const weapon = {
      name: entry.name,
      attackAbilityName: 'Strength',
      damageDiceAmount: damageMatch ? Number(damageMatch[1]) : 1,
      damageDiceName: damageMatch ? `d${damageMatch[2]}` : 'd4',
      damageTypeName: String(entry.damage || '').split(/\s+/).slice(-1)[0] || 'Contundente',
      isVersatile: !!versatileMatch,
      versatileDamageDiceAmount: versatileMatch ? Number(versatileMatch[1]) : 1,
      versatileDamageDie: versatileMatch ? `D${versatileMatch[2]}` : 'D4',
      properties: entry.type || '',
      proficient: true,
      isRanged: false,
      isCustom: true,
      weight: entry.weight || '',
      cost: entry.cost || '',
      id: crypto.randomUUID(),
    };
    const armor = {
      id: crypto.randomUUID(),
      name: entry.name,
      category: /shield/i.test(entry.type || '') ? 'Shields' : `${entry.type || 'Leve'} Armor`,
      armor: num(entry.baseAc, 10),
      equipped: false,
      isProficient: true,
      requiredStrength: entry.requiredStrength || 0,
      stealthDisadvantage: !!entry.stealthDisadvantage,
      weight: entry.weight || '',
      cost: entry.cost || '',
      isAttuned: false,
    };
    if (record.kind === 'cah') {
      const raw = structuredClone(record.raw);
      if (category === 'spells') {
        raw.spells ||= [];
        raw.spells.push(spell);
      } else if (category === 'weapons') {
        raw.weapons ||= [];
        raw.weapons.push(weapon);
      } else if (category === 'armors') {
        raw.armors ||= [];
        raw.armors.push(armor);
      } else {
        raw.equipment ||= [];
        raw.equipment.push({
          id: crypto.randomUUID(),
          name: entry.name,
          amount: 1,
          description: entry.description || '',
          weight: entry.weight || '',
          isAttuned: false,
          isEquipped: false,
          pinned: false,
        });
      }
      record.raw = raw;
    } else {
      const native = structuredClone(record.native);
      if (category === 'spells') {
        native.spells ||= [];
        native.spells.push(spell);
      } else if (category === 'weapons') {
        native.weapons ||= [];
        native.weapons.push(weapon);
      } else if (category === 'armors') {
        native.armors ||= [];
        native.armors.push(armor);
      } else {
        native.equipment ||= [];
        native.equipment.push({
          id: crypto.randomUUID(),
          name: entry.name,
          amount: 1,
          description: entry.description || '',
          weight: entry.weight || '',
          equipped: false,
          attuned: false,
        });
      }
      record.native = native;
    }
    record.updatedAt = now;
    void putRecord(record);
    renderSheetTab();
    flash(`${entry.name} adicionado à ficha de ${model.name}.`);
  }

  function toggleArmor(id) {
    const record = activeRecord();
    if (!record) return;
    const source = structuredClone(record.kind === 'cah' ? record.raw : record.native);
    const armors = source.armors || [];
    const target = armors.find((armor) => String(armor.id) === String(id));
    if (!target) return;
    const shield = /shield/i.test(String(target.category || target.name || ''));
    if (!target.equipped) {
      for (const armor of armors) {
        if (armor === target || !armor.equipped) continue;
        if (shield ? /shield/i.test(String(armor.category || armor.name || '')) : !/shield/i.test(String(armor.category || armor.name || ''))) {
          armor.equipped = false;
        }
      }
    }
    target.equipped = !target.equipped;
    if (record.kind === 'cah') record.raw = source;
    else record.native = source;
    savePlay(record);
    flash(`${target.name} ${target.equipped ? 'equipada' : 'desequipada'}.`);
  }

  function encounterMultiplier(monsters) {
    if (monsters <= 1) return 1;
    if (monsters === 2) return 1.5;
    if (monsters <= 6) return 2;
    if (monsters <= 10) return 2.5;
    if (monsters <= 14) return 3;
    return 4;
  }

  function encounterInfo(monsters, level, partySize) {
    const total = monsters.reduce((sum, item) => sum + num(item.entry.xp) * num(item.count), 0);
    const count = monsters.reduce((sum, item) => sum + num(item.count), 0);
    const adjusted = Math.floor(total * encounterMultiplier(count));
    const thresholds = Object.fromEntries(Object.entries(ENCOUNTER_THRESHOLDS).map(([key, values]) => [key, values[Math.max(0, Math.min(19, level - 1))] * Math.max(1, partySize)]));
    let tier = 'trivial';
    if (adjusted >= thresholds.deadly) tier = 'deadly';
    else if (adjusted >= thresholds.hard) tier = 'hard';
    else if (adjusted >= thresholds.medium) tier = 'medium';
    else if (adjusted >= thresholds.easy) tier = 'easy';
    return {total, count, adjusted, thresholds, tier};
  }

  function setXpValue(record, model, value) {
    const xp = Math.max(0, num(value));
    if (record.kind === 'cah') {
      const raw = structuredClone(record.raw);
      raw.exp = xp;
      record.raw = raw;
    } else {
      const native = structuredClone(record.native);
      native.exp = xp;
      record.native = native;
    }
    const play = activePlay(record, model);
    play.xp = xp;
    savePlay(record);
  }

  async function loadBestiary() {
    if (state.bestiary) return state.bestiary;
    const response = await fetch('./5e/monsters.json');
    if (!response.ok) throw new Error('Pacote de monstros não encontrado.');
    state.bestiary = await response.json();
    return state.bestiary;
  }

  async function openXpDialog() {
    const record = activeRecord();
    if (!record) return;
    const model = modelFor(record);
    const dialog = document.createElement('dialog');
    dialog.className = 'charDialog xpDialog';
    dialog.innerHTML = `
      <form method="dialog">
        <div class="eyebrow">EXPERIÊNCIA</div>
        <h2>${esc(model.name)}</h2>
        <p class="charMuted">XP atual ${fmt(model.exp)} · próximo nível ${model.level < 20 ? `${fmt(xpForLevel(model.level + 1))} XP` : '—'}</p>
        <div class="xpTargets">
          <span>Aplicar a</span>
          ${state.records.map((entry) => `<label><input type="checkbox" data-xp-target="${esc(entry.id)}" checked> ${esc(entry.name)}</label>`).join('')}
        </div>
        <div class="xpDirect">
          <label>XP total por ficha<input id="xpValue" type="number" min="0" value="${num(model.exp)}"></label>
          <button id="xpApply">Aplicar XP</button>
        </div>
        <h3 class="xpSubhead">XP por encontro</h3>
        <div class="encounterControls">
          <label>Nível do grupo<input id="encLevel" type="number" min="1" max="20" value="${model.level}"></label>
          <label>Tamanho do grupo<input id="encParty" type="number" min="1" max="12" value="4"></label>
        </div>
        <label>Buscar monstro<input id="encSearch" type="search" placeholder="Goblin, dragão, owlbear…"></label>
        <div id="encResults" class="encounterResults"><p class="charMuted">Carregando monstros…</p></div>
        <div id="encSelected" class="encounterSelected"></div>
        <div id="encSummary" class="encounterSummary"></div>
        <div class="charDialogActions">
          <button value="cancel">Fechar</button>
          <button id="encApply" class="charPrimary" type="button">Adicionar XP do encontro à ficha</button>
        </div>
      </form>`;
    document.body.append(dialog);
    const stateEnc = {chosen: [], query: ''};
    let bestiary = [];
    const renderResults = () => {
      const box = dialog.querySelector('#encResults');
      if (!box) return;
      const query = stateEnc.query.trim().toLowerCase();
      const matches = bestiary.filter((monster) => monster.name.toLowerCase().includes(query)).slice(0, 14);
      box.innerHTML = matches.map((monster, index) => `<button type="button" data-enc-add="${index}"><b>${esc(monster.name)}</b><small>CR ${crLabel(monster.cr)} · ${fmt(monster.xp)} XP</small></button>`).join('') || '<p class="charMuted">Nenhum monstro encontrado.</p>';
      box.querySelectorAll('[data-enc-add]').forEach((button) => {
        button.onclick = () => {
          const monster = matches[Number(button.dataset.encAdd)];
          const existing = stateEnc.chosen.find((item) => item.entry.name === monster.name);
          if (existing) existing.count += 1;
          else stateEnc.chosen.push({entry: monster, count: 1});
          renderSelected();
        };
      });
    };
    const renderSelected = () => {
      const box = dialog.querySelector('#encSelected');
      const summary = dialog.querySelector('#encSummary');
      if (!box || !summary) return;
      box.innerHTML = stateEnc.chosen.map((item, index) => `<div class="encounterRow"><span><b>${esc(item.entry.name)}</b><small>${fmt(item.entry.xp)} XP cada</small></span><div class="encounterStepper"><button type="button" data-enc-count="${index}" data-delta="-1">−</button><b>${item.count}</b><button type="button" data-enc-count="${index}" data-delta="1">+</button><button type="button" data-enc-remove="${index}">×</button></div></div>`).join('') || '<p class="charMuted">Adicione monstros para calcular o encontro.</p>';
      const level = Math.max(1, num(dialog.querySelector('#encLevel')?.value, model.level));
      const party = Math.max(1, num(dialog.querySelector('#encParty')?.value, 4));
      const info = encounterInfo(stateEnc.chosen, level, party);
      const labels = {trivial: 'Trivial', easy: 'Fácil', medium: 'Médio', hard: 'Difícil', deadly: 'Mortal'};
      summary.innerHTML = `<div><span>XP total</span><b>${fmt(info.total)}</b></div><div><span>XP ajustado</span><b>${fmt(info.adjusted)}</b></div><div><span>Dificuldade</span><b class="tier-${info.tier}">${labels[info.tier]}</b></div><p class="charMuted">Fácil ${fmt(info.thresholds.easy)} · Médio ${fmt(info.thresholds.medium)} · Difícil ${fmt(info.thresholds.hard)} · Mortal ${fmt(info.thresholds.deadly)}. O XP concedido é o total dividido pelo grupo; o XP ajustado serve só para a dificuldade.</p>`;
      box.querySelectorAll('[data-enc-count]').forEach((button) => {
        button.onclick = () => {
          const item = stateEnc.chosen[Number(button.dataset.encCount)];
          if (!item) return;
          item.count = Math.max(0, item.count + num(button.dataset.delta));
          if (!item.count) stateEnc.chosen.splice(Number(button.dataset.encCount), 1);
          renderSelected();
        };
      });
      box.querySelectorAll('[data-enc-remove]').forEach((button) => {
        button.onclick = () => {
          stateEnc.chosen.splice(Number(button.dataset.encRemove), 1);
          renderSelected();
        };
      });
    };
    dialog.querySelector('#encSearch').oninput = (event) => {
      stateEnc.query = event.target.value;
      renderResults();
    };
    dialog.querySelector('#encLevel').oninput = renderSelected;
    dialog.querySelector('#encParty').oninput = renderSelected;
    const selectedRecords = () => [...dialog.querySelectorAll('[data-xp-target]:checked')]
      .map((input) => state.records.find((entry) => entry.id === input.dataset.xpTarget))
      .filter(Boolean);
    dialog.querySelector('#xpApply').onclick = () => {
      const targets = selectedRecords();
      if (!targets.length) return flash('Selecione pelo menos uma ficha.', true);
      const value = dialog.querySelector('#xpValue').value;
      for (const target of targets) setXpValue(target, modelFor(target), value);
      flash(`XP ${fmt(value)} aplicado a ${targets.length} ficha${targets.length === 1 ? '' : 's'}.`);
    };
    dialog.querySelector('#encApply').onclick = () => {
      const targets = selectedRecords();
      if (!targets.length) return flash('Selecione pelo menos uma ficha.', true);
      const level = Math.max(1, num(dialog.querySelector('#encLevel')?.value, model.level));
      const party = Math.max(1, num(dialog.querySelector('#encParty')?.value, 4));
      const info = encounterInfo(stateEnc.chosen, level, party);
      if (!info.total) return flash('Adicione pelo menos um monstro.', true);
      const share = Math.floor(info.total / party);
      for (const target of targets) setXpValue(target, modelFor(target), num(modelFor(target).exp) + share);
      flash(`+${fmt(share)} XP para ${targets.length} ficha${targets.length === 1 ? '' : 's'} (parte de ${fmt(info.total)} / ${party}).`);
    };
    dialog.addEventListener('close', () => dialog.remove(), {once: true});
    dialog.showModal();
    try {
      bestiary = await loadBestiary();
      renderResults();
    } catch (error) {
      dialog.querySelector('#encResults').innerHTML = `<div class="charError">${esc(error.message)}</div>`;
    }
  }

  async function saveNativeRecord(native, select = false) {
    const now = new Date().toISOString();
    const existing = state.records.find((record) => record.id === native.id);
    const record = {
      id: native.id,
      kind: 'atlas',
      name: native.name,
      updatedAt: now,
      importedAt: existing?.importedAt || now,
      native,
      versions: existing
        ? [...(existing.versions || []), {at: existing.updatedAt, native: existing.native}].slice(-MAX_VERSIONS)
        : [],
    };
    applyRecord(record, select);
    void putRecord(record);
    flash(`Ficha de ${native.name} salva.`);
  }

  function downloadRecord(record, version = null) {
    if (!record) return;
    if (record.kind === 'cah') {
      const raw = version?.raw || record.raw;
      downloadFile(`character_${safeFileName(record.name)}.cah`, JSON.stringify(raw), 'application/json');
    } else {
      const native = version?.native || record.native;
      downloadFile(`character_${safeFileName(record.name)}.json`, JSON.stringify(native, null, 2));
    }
  }

  async function loadClassDefs() {
    if (state.classDefs) return state.classDefs;
    const response = await fetch('./5e/classes.json');
    if (!response.ok) throw new Error('Pacote de classes não encontrado.');
    const list = await response.json();
    const seen = new Map();
    for (const def of list) {
      const base = String(def.id || '').split('__')[0];
      if (!base || seen.has(base)) continue;
      seen.set(base, def);
    }
    state.classDefs = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return state.classDefs;
  }

  async function openMulticlassDialog(record) {
    if (!record || record.kind !== 'atlas') return flash('Multiclasse automática está disponível nas fichas nativas.', true);
    const model = modelFor(record);
    try {
      const defs = await loadClassDefs();
      const used = new Set((model.classes || []).map((cls) => String(cls.id).split('__')[0]));
      const choices = defs.filter((def) => !used.has(String(def.id).split('__')[0]));
      if (!choices.length) return flash('Todas as classes disponíveis já estão na ficha.', true);
      const dialog = document.createElement('dialog');
      dialog.className = 'charDialog';
      dialog.innerHTML = `
        <form method="dialog">
          <div class="eyebrow">MULTICLASSE</div>
          <h2>${esc(model.name)}</h2>
          <p class="charMuted">Adicionar uma classe no nível 1. O nível total continua ${model.level}; o próximo nível pode ir para qualquer classe.</p>
          <label>Nova classe<select id="multiClass">${choices.map((def) => `<option value="${esc(def.id)}">${esc(def.name)} (${esc(def.hitDie || 'd8')})</option>`).join('')}</select></label>
          <label>PV ganhos no nível 1<input id="multiHp" type="number" min="1" max="30" value="8"></label>
          <div class="charDialogActions">
            <button value="cancel">Cancelar</button>
            <button value="confirm" class="charPrimary">Adicionar classe</button>
          </div>
        </form>`;
      document.body.append(dialog);
      const select = dialog.querySelector('#multiClass');
      const hp = dialog.querySelector('#multiHp');
      const updateHp = () => {
        const def = choices.find((entry) => entry.id === select.value);
        const sides = Number(String(def?.hitDie || 'd8').replace(/[^0-9]/g, '')) || 8;
        hp.value = Math.max(1, sides + Math.floor((num(model.abilities?.con?.mod, 0))));
      };
      select.onchange = updateHp;
      updateHp();
      dialog.querySelector('button[value="confirm"]')?.addEventListener('click', (event) => {
        event.preventDefault();
        try {
          const def = choices.find((entry) => entry.id === select.value);
          if (!def) return;
          const current = modelFor(record);
          if (current.level >= 20) throw new Error('Nível máximo (20) atingido.');
          const oldMax = current.hp.max;
          const play = activePlay(record, current);
          const oldCurrent = num(play.hp.current, oldMax);
          const updated = levelUpNative(record.native, {
            classDef: def,
            classId: def.id,
            hpGain: Math.max(1, num(hp.value)),
          });
          const leveled = normalizeNative(updated);
          record.native = updated;
          play.hp.current = oldCurrent >= oldMax ? leveled.hp.max : Math.min(leveled.hp.max, oldCurrent + Math.max(0, leveled.hp.max - oldMax));
          play.hitDice = leveled.hitDice.map((die, index) => ({
            ...die,
            current: num(play.hitDice[index]?.current, die.current),
          }));
          record.updatedAt = new Date().toISOString();
          void putRecord(record);
          renderSheetTab();
          dialog.close();
          flash(`${def.name} adicionada como multiclasse.`);
        } catch (error) {
          flash(error.message, true);
        }
      });
      dialog.addEventListener('close', () => dialog.remove(), {once: true});
      dialog.showModal();
    } catch (error) {
      flash(error.message, true);
    }
  }

  function openLevelUp(record) {
    const model = modelFor(record);
    const native = record.kind === 'atlas' ? record.native : null;
    const nextLevel = num(model.level, 1) + 1;
    if (nextLevel > 20) return flash('Nível máximo (20) atingido.', true);
    const classes = model.classes || [];
    const firstClass = classes[0] || {};
    let targetClassId = String(firstClass.id || '');
    let hitDie = firstClass.hitDie || native?.class?.hitDie || 'd8';
    const conMod = model.abilities.con.mod;
    const asi = isAsiLevel(nextLevel);
    const nativeEntry = (id) => (native?.classes || []).find((entry) => String(entry.class?.id) === String(id));
    const targetEntry = nativeEntry(targetClassId);
    const needsSubclass = !!native && !targetEntry?.subclass && !native.subclass && nextLevel >= num(targetEntry?.class?.subclassLevel ?? native.class?.subclassLevel, 99) && (targetEntry?.class?.subclasses || native.class?.subclasses || []).length;
    const dialog = document.createElement('dialog');
    dialog.className = 'charDialog';
    dialog.innerHTML = `
      <form method="dialog">
        <div class="eyebrow">PASSAGEM DE NÍVEL</div>
        <h2>${esc(model.name)} → nível ${nextLevel}</h2>
        <p class="charMuted">${esc(model.classLine)} · dado de vida ${esc(hitDie)} · XP ${fmt(model.exp)} / ${fmt(xpForLevel(nextLevel))}</p>
        ${classes.length > 1 ? `<label>Classe que sobe<select id="levelClass">${classes.map((cls) => `<option value="${esc(cls.id)}">${esc(cls.name)} ${cls.level} → ${num(cls.level) + 1}</option>`).join('')}</select></label>` : ''}
        <label>Ganho de PV<input id="levelHp" type="number" min="1" max="30" value="${averageHpGain(hitDie, conMod)}"></label>
        ${asi ? `<fieldset class="levelAsi"><legend>Incremento de atributo (nível ${nextLevel})</legend>
          <label>Modo<select id="levelAsiMode"><option value="2">+2 em um atributo</option><option value="11">+1 em dois atributos</option></select></label>
          <div class="levelAsiRow"><label>Atributo 1<select id="levelAsiOne">${ABILITIES.map((ability) => `<option value="${ability.key}">${esc(ability.name)}</option>`).join('')}</select></label>
          <label id="levelAsiTwoWrap" hidden>Atributo 2<select id="levelAsiTwo">${ABILITIES.map((ability) => `<option value="${ability.key}">${esc(ability.name)}</option>`).join('')}</select></label></div>
        </fieldset>` : ''}
        <div id="levelSubclassWrap">${needsSubclass ? `<label>Subclasse<select id="levelSubclass">${(targetEntry?.class?.subclasses || native.class?.subclasses || []).map((sub) => `<option value="${esc(sub.id)}">${esc(sub.name)}</option>`).join('')}</select></label>` : ''}</div>
        <div class="charDialogActions">
          <button value="cancel">Cancelar</button>
          <button value="confirm" class="charPrimary">Subir nível</button>
        </div>
      </form>`;
    document.body.append(dialog);
    function refreshClassFields() {
      const select = dialog.querySelector('#levelClass');
      const classId = select?.value || targetClassId;
      const current = classes.find((cls) => String(cls.id) === String(classId)) || firstClass;
      const entry = nativeEntry(classId);
      const die = current?.hitDie || 'd8';
      const hp = dialog.querySelector('#levelHp');
      if (hp) hp.value = averageHpGain(die, conMod);
      const wrap = dialog.querySelector('#levelSubclassWrap');
      if (wrap) {
        const subclassLevel = num(entry?.class?.subclassLevel ?? native?.class?.subclassLevel, 99);
        const subclassOptions = entry?.class?.subclasses || native?.class?.subclasses || [];
        const level = num(current?.level, 1) + 1;
        wrap.innerHTML = native && !entry?.subclass && !native.subclass && level >= subclassLevel && subclassOptions.length
          ? `<label>Subclasse<select id="levelSubclass">${subclassOptions.map((sub) => `<option value="${esc(sub.id)}">${esc(sub.name)}</option>`).join('')}</select></label>`
          : '';
      }
    }

    async function commitLevel() {
      try {
        const classId = dialog.querySelector('#levelClass')?.value || targetClassId;
        const targetClass = classes.find((cls) => String(cls.id) === String(classId)) || firstClass;
        const targetDie = targetClass?.hitDie || hitDie;
        const hpGain = Math.max(1, num(dialog.querySelector('#levelHp')?.value, averageHpGain(targetDie, conMod)));
        const abilityChoices = {};
        if (asi) {
          const one = dialog.querySelector('#levelAsiOne')?.value;
          const two = dialog.querySelector('#levelAsiTwo')?.value;
          if (dialog.querySelector('#levelAsiMode')?.value === '11' && one && two) {
            if (one === two) throw new Error('Escolha dois atributos diferentes para +1/+1.');
            abilityChoices[one] = 1;
            abilityChoices[two] = 1;
          } else if (one) {
            abilityChoices[one] = 2;
          }
        }
        const oldMax = model.hp.max;
        const play = activePlay(record, model);
        const oldCurrent = num(play.hp.current, oldMax);
        let leveledModel = null;
        if (native) {
          const entry = nativeEntry(classId);
          const subclassId = dialog.querySelector('#levelSubclass')?.value;
          const subclass = (entry?.class?.subclasses || native.class?.subclasses || []).find((sub) => sub.id === subclassId) || null;
          const updated = levelUpNative(native, {hpGain, abilityChoices, subclass, classId});
          leveledModel = normalizeNative(updated);
          record.native = updated;
          play.hp.current = oldCurrent >= oldMax ? leveledModel.hp.max : Math.min(leveledModel.hp.max, oldCurrent + Math.max(0, leveledModel.hp.max - oldMax));
        } else {
          const updated = levelUpCah(record.raw, {hpGain, abilityChoices, classId});
          leveledModel = normalizeCah(updated);
          record.raw = updated;
          play.hp.current = oldCurrent >= oldMax ? leveledModel.hp.max : Math.min(leveledModel.hp.max, oldCurrent + Math.max(0, leveledModel.hp.max - oldMax));
        }
        if (leveledModel?.hitDice && play.hitDice) {
          const targetIndex = (leveledModel.classes || []).findIndex((cls) => String(cls.id) === String(classId));
          play.hitDice = leveledModel.hitDice.map((die, index) => ({
            ...die,
            current: index === targetIndex
              ? Math.min(die.max, num(play.hitDice[index]?.current, die.current - 1) + 1)
              : num(play.hitDice[index]?.current, die.current),
          }));
        }
        record.updatedAt = new Date().toISOString();
        void putRecord(record);
        renderSheetTab();
        flash(`${model.name} subiu para o nível ${nextLevel}.`);
      } catch (error) {
        flash(error.message, true);
      } finally {
        dialog.close();
      }
    }
    dialog.querySelector('button[value="confirm"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      void commitLevel();
    });
    const mode = dialog.querySelector('#levelAsiMode');
    if (mode) {
      mode.onchange = () => {
        dialog.querySelector('#levelAsiTwoWrap').hidden = mode.value !== '11';
      };
    }
    dialog.addEventListener('close', () => dialog.remove(), {once: true});
    dialog.showModal();
  }

  async function deleteActive() {
    const record = activeRecord();
    if (!record) return;
    if (!confirm(`Excluir a ficha de ${record.name}? Esta ação não pode ser desfeita.`)) return;
    state.records = state.records.filter((item) => item.id !== record.id);
    state.activeId = state.records[0]?.id || null;
    renderSheetTab();
    void removeRecord(record.id);
    flash('Ficha excluída.');
  }

  // -------------------------------------------------------------------------
  // Eventos
  // -------------------------------------------------------------------------

  panel.addEventListener('click', (event) => {
    const tabButton = event.target.closest('[data-char-tab]');
    if (tabButton) return setTab(tabButton.dataset.charTab);
    if (event.target.closest('#charClose')) return close();
    if (event.target.closest('#charImportBtn') || event.target.closest('#charEmptyImport')) return fileInput.click();
    if (event.target.closest('#charCreateBtn') || event.target.closest('#charEmptyCreate')) return setTab('creator');
    const listItem = event.target.closest('[data-char-id]');
    if (listItem && !event.target.closest('[data-char-download]') && !event.target.closest('[data-char-delete]') && !event.target.closest('[data-char-levelup]') && !event.target.closest('[data-char-version]')) {
      state.activeId = listItem.dataset.charId;
      renderSheetTab();
      return;
    }
    const download = event.target.closest('[data-char-download]');
    if (download) return downloadRecord(state.records.find((record) => record.id === download.dataset.charDownload));
    const remove = event.target.closest('[data-char-delete]');
    if (remove) return deleteActive();
    const levelUp = event.target.closest('[data-char-levelup]');
    if (levelUp) {
      const record = state.records.find((item) => item.id === levelUp.dataset.charLevelup);
      if (record) return openLevelUp(record);
    }
    const addClass = event.target.closest('[data-add-class]');
    if (addClass) {
      const record = state.records.find((item) => item.id === addClass.dataset.addClass);
      if (record) return void openMulticlassDialog(record);
    }
    const addConditionButton = event.target.closest('[data-add-condition]');
    if (addConditionButton) return addCondition();
    const removeConditionButton = event.target.closest('[data-remove-condition]');
    if (removeConditionButton) return removeCondition(removeConditionButton.dataset.removeCondition);
    const exhaustionButton = event.target.closest('[data-exhaustion]');
    if (exhaustionButton) return changeExhaustion(num(exhaustionButton.dataset.exhaustion));
    const deathButton = event.target.closest('[data-death-roll]');
    if (deathButton) return rollDeathSave();
    const stabilizeButton = event.target.closest('[data-stabilize]');
    if (stabilizeButton) return stabilize();
    const hpDelta = event.target.closest('[data-hp-delta]');
    if (hpDelta) return changeHp(num(hpDelta.dataset.hpDelta));
    const resourceSpend = event.target.closest('[data-resource-spend]');
    if (resourceSpend) return spendResource(resourceSpend.dataset.resourceId, num(resourceSpend.dataset.resourceSpend, 1));
    const resourceRestore = event.target.closest('[data-resource-restore]');
    if (resourceRestore) return restoreResource(resourceRestore.dataset.resourceId, resourceRestore.dataset.resourceRestore);
    const cast = event.target.closest('[data-cast-spell]');
    if (cast) return openCastDialog(cast.dataset.castSpell);
    const prepare = event.target.closest('[data-prepare-spell]');
    if (prepare) return togglePrepared(prepare.dataset.prepareSpell);
    const equip = event.target.closest('[data-equip-armor]');
    if (equip) return toggleArmor(equip.dataset.equipArmor);
    const attune = event.target.closest('[data-attune-item]');
    if (attune) return toggleAttunement(attune.dataset.attuneItem);
    const shortRestButton = event.target.closest('[data-short-rest]');
    if (shortRestButton) return shortRest();
    const rest = event.target.closest('[data-long-rest]');
    if (rest) return longRest();
    const addXpButton = event.target.closest('[data-add-xp]');
    if (addXpButton) return openXpDialog();
    const version = event.target.closest('[data-char-version]');
    if (version) {
      const record = state.records.find((item) => item.id === version.dataset.charId);
      const item = record?.versions?.[Number(version.dataset.charVersion)];
      if (record && item) downloadRecord(record, item);
      return;
    }
    const category = event.target.closest('[data-comp-category]');
    if (category) {
      state.compendium.category = category.dataset.compCategory;
      state.compendium.query = '';
      state.compendium.selected = null;
      renderCompendiumTab();
      return;
    }
    const compEntry = event.target.closest('[data-comp-index]');
    if (compEntry) {
      const list = filteredCompendium();
      state.compendium.selected = list[Number(compEntry.dataset.compIndex)] || null;
      renderCompendiumList();
      return;
    }
    if (event.target.closest('#creatorArray')) {
      const array = [15, 14, 13, 12, 10, 8];
      ABILITIES.forEach((ability, index) => {
        state.creator.data.abilities[ability.key] = array[index];
        const input = creatorTab.querySelector(`[data-creator-ability="${ability.key}"]`);
        if (input) input.value = array[index];
      });
      updateCreatorSummary();
      return;
    }
    if (event.target.closest('#creatorCreate')) return createFromCreator();
  });

  panel.addEventListener('change', (event) => {
    if (event.target.id === 'hpCurrent') return setHp(event.target.value);
    if (event.target.id === 'hpTemp') {
      const record = activeRecord();
      if (!record) return;
      const model = modelFor(record);
      const play = activePlay(record, model);
      play.hp.temp = Math.max(0, num(event.target.value));
      return savePlay(record);
    }
    if (event.target.id === 'weightExtra' || event.target.id === 'encumbranceVariant' || event.target.id === 'acBonus' || event.target.dataset.effect) {
      const record = activeRecord();
      if (!record) return;
      const model = modelFor(record);
      const play = activePlay(record, model);
      if (event.target.id === 'weightExtra') play.weightExtra = Math.max(0, num(event.target.value));
      if (event.target.id === 'encumbranceVariant') play.encumbranceVariant = !!event.target.checked;
      if (event.target.id === 'acBonus') play.acBonus = Math.max(0, num(event.target.value));
      if (event.target.dataset.effect) play.effects[event.target.dataset.effect] = !!event.target.checked;
      return savePlay(record);
    }
    const data = state.creator.data;
    if (event.target.id === 'creatorRace') {
      data.raceId = event.target.value;
      data.skills = [];
      return renderCreatorTab();
    }
    if (event.target.id === 'creatorClass') {
      data.classId = event.target.value;
      data.skills = [];
      data.subclassId = '';
      return renderCreatorTab();
    }
    if (event.target.id === 'creatorBackground') {
      data.backgroundId = event.target.value;
      return renderCreatorTab();
    }
    if (event.target.id === 'creatorAlignment') {
      data.alignment = event.target.value;
      return updateCreatorSummary();
    }
    if (event.target.id === 'creatorSubclass') {
      data.subclassId = event.target.value;
      return;
    }
    const skill = event.target.closest('[data-creator-skill]');
    if (skill) {
      const {cls, background} = creatorSelections();
      const key = skill.dataset.creatorSkill;
      const backgroundSkills = background?.skills || [];
      if (backgroundSkills.includes(key)) return;
      const selected = new Set(data.skills);
      if (skill.checked) selected.add(key); else selected.delete(key);
      const max = cls?.skillCount || 2;
      if (selected.size > max) {
        skill.checked = false;
        return flash(`Escolha no máximo ${max} perícias de classe.`, true);
      }
      data.skills = [...selected];
    }
  });

  panel.addEventListener('input', (event) => {
    const ability = event.target.closest('[data-creator-ability]');
    if (ability) {
      const value = Math.max(3, Math.min(18, num(ability.value, 10)));
      state.creator.data.abilities[ability.dataset.creatorAbility] = value;
      updateCreatorSummary();
      return;
    }
    if (event.target.id === 'creatorName') state.creator.data.name = event.target.value;
    if (event.target.id === 'creatorPlayer') state.creator.data.player = event.target.value;
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) handleFile(file);
  });

  panel.addEventListener('dragstart', (event) => {
    const button = event.target.closest('[data-comp-index]');
    if (!button) return;
    const entry = filteredCompendium()[Number(button.dataset.compIndex)];
    if (!entry) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-silvengard', JSON.stringify({category: state.compendium.category, entry}));
    event.dataTransfer.setData('text/plain', entry.name);
  });

  panel.addEventListener('dragover', (event) => {
    event.preventDefault();
    panel.classList.add('charDragging');
  });
  panel.addEventListener('dragleave', (event) => {
    if (!panel.contains(event.relatedTarget)) panel.classList.remove('charDragging');
  });
  panel.addEventListener('drop', (event) => {
    event.preventDefault();
    panel.classList.remove('charDragging');
    const payload = event.dataTransfer?.getData('application/x-silvengard');
    if (payload && event.target.closest('[data-sheet-drop]')) {
      try {
        const data = JSON.parse(payload);
        addCompendiumEntry(data.category, data.entry);
      } catch {
        flash('Não foi possível soltar este item na ficha.', true);
      }
      return;
    }
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  async function open() {
    panel.hidden = false;
    await refreshRecords();
    setTab(state.tab);
  }

  function close() {
    panel.hidden = true;
  }

  async function refresh() {
    await refreshRecords(state.activeId);
    if (!panel.hidden) setTab(state.tab);
  }

  function getSheets() {
    return state.records.map((record) => {
      try {
        return modelFor(record);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  function setSheetHp(sheetId, value) {
    const record = state.records.find((entry) => String(entry.id) === String(sheetId));
    if (!record) return null;
    const model = modelFor(record);
    const play = ensurePlay(record, model);
    play.hp.current = Math.max(0, Math.min(model.hp.max, num(value)));
    record.updatedAt = new Date().toISOString();
    void putRecord(record);
    if (!panel.hidden && state.activeId === record.id) renderSheetTab();
    return play.hp.current;
  }

  return {open, close, refresh, importRaw, createFromCreator, getSheets, setSheetHp, panel};
}
