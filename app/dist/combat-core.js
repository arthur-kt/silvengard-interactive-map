// Silvengard · regras de ações de combate 5e (puro): ações de monstros e personagens, multiataque, magias, itens, multiclasse.
import {averageOf} from './dice-core.js?v=6';

export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const ABILITY_PT = {str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR'};
const ABIL_WORD = {strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha'};
const NUM_WORDS = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, once: 1, twice: 2};
const TYPES = 'acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder';
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
export const baseClassId = (id) => String(id || '').split('__')[0];
export const abilityScore = (a, key) => Number(a?.[key]?.score ?? a?.[key] ?? 10);
export const modOf = (score) => Math.floor((Number(score) - 10) / 2);

/* ---------- monstros ---------- */
export function parseDamageParts(text) {
  const hit = String(text || '').split(/Hit:/i);
  let body = hit.length > 1 ? hit.slice(1).join(' ') : String(text || '');
  body = body.split(/,\s*or\s|\bor\s+\d+\s*\(|\bif used with\b/i)[0];
  const parts = [];
  const re = new RegExp(`(\\d+)\\s*\\((\\d+d\\d+(?:\\s*[+\\-−]\\s*\\d+)?)\\)\\s*(${TYPES})(?:\\s+or\\s+(?:${TYPES}))?\\s+damage`, 'gi');
  let m;
  while ((m = re.exec(body)) !== null) parts.push({expr: m[2].replace(/\s+/g, '').replace('−', '-'), type: m[3].toLowerCase()});
  if (!parts.length) { const flat = new RegExp(`(\\d+)\\s+(${TYPES})\\s+damage`, 'i').exec(body); if (flat) parts.push({expr: flat[1], type: flat[2].toLowerCase()}); }
  return parts;
}
const AREA_RE = /(\d+)[- ]f(?:oo|ee)t[- ](cone|line|radius|sphere|cube|square)/i;
export function areaOf(text) {
  const m = AREA_RE.exec(String(text || ''));
  if (!m) return null;
  const shape = {cone: 'cone', line: 'line', radius: 'circle', sphere: 'circle', cube: 'square', square: 'square'}[m[2].toLowerCase()];
  return {shape, sizeFt: Number(m[1])};
}
export function parseMonsterAction(a, section = 'action') {
  const desc = String(a.description || ''), name = String(a.name || 'Ação');
  const out = {name, section, description: desc, kind: 'utility', cost: 1, damage: []};
  const cost = /Costs (\d+) Actions/i.exec(name + ' ' + desc); if (cost) out.cost = Number(cost[1]);
  const rec = /Recharge (\d)/i.exec(name); if (rec) out.recharge = Number(rec[1]);
  const day = /\((\d+)\/Day\)/i.exec(name); if (day) out.perDay = Number(day[1]);
  const hit = /([+-]\d+) to hit/i.exec(desc);
  if (hit || (a.attackBonus && (a.type === 'melee' || a.type === 'ranged'))) {
    out.kind = 'attack';
    out.toHit = hit ? Number(hit[1]) : Number(a.attackBonus);
    const reach = /reach (\d+) ft/i.exec(desc), range = /range (\d+)(?:\/(\d+))? ft/i.exec(desc);
    out.ranged = a.type === 'ranged' || (!!range && !reach);
    out.reach = reach ? Number(reach[1]) : 5;
    if (range) { out.range = Number(range[1]); out.longRange = Number(range[2] || range[1]); }
    out.damage = parseDamageParts(desc);
    const rider = /DC (\d+) (strength|dexterity|constitution|intelligence|wisdom|charisma) saving throw/i.exec(desc);
    if (rider) out.rider = {dc: Number(rider[1]), ability: ABIL_WORD[rider[2].toLowerCase()]};
    return out;
  }
  const sv = /DC (\d+) (strength|dexterity|constitution|intelligence|wisdom|charisma) saving throw/i.exec(desc);
  if (sv) {
    out.kind = 'save';
    out.save = {dc: Number(sv[1]), ability: ABIL_WORD[sv[2].toLowerCase()], half: /half as much damage|half damage|half as much/i.test(desc)};
    out.damage = parseDamageParts(desc.replace(/^[^.]*\.\s*/, ''));
    if (!out.damage.length) out.damage = parseDamageParts(desc);
    out.area = areaOf(desc);
  }
  return out;
}
export function parseMultiattack(desc, attacks) {
  const text = norm(desc), seq = [];
  const nameOf = (a) => norm(a.name).replace(/\(.*?\)/g, '').trim();
  for (const a of attacks) {
    const n = nameOf(a), keys = [...new Set([n, n.replace(/s$/, ''), n.replace(/ies$/, 'y')].filter(Boolean))];
    for (const key of keys) {
      const re = new RegExp(`(one|two|three|four|five|six|once|twice|\\d+)\\s+(?:[a-z-]+\\s+){0,3}?(?:attacks?\\s+)?(?:with\\s+(?:its\\s+|his\\s+|her\\s+|their\\s+|a\\s+|an\\s+|the\\s+)?)?${esc(key)}s?\\b`, 'g');
      let m, found = false;
      while ((m = re.exec(text)) !== null) { const c = NUM_WORDS[m[1]] ?? Number(m[1]); if (c) { seq.push({name: a.name, count: c}); found = true; break; } }
      if (found) break;
    }
  }
  const merged = []; for (const s of seq) { const e = merged.find((x) => x.name === s.name); if (e) e.count = Math.max(e.count, s.count); else merged.push({...s}); }
  if (merged.length) return merged;
  const total = /makes? (one|two|three|four|five|six|\d+)\s+(?:[a-z-]+\s+){0,3}?attacks?/.exec(text) || /attacks (once|twice|one|two|three)\b/.exec(text);
  const n = total ? (NUM_WORDS[total[1]] ?? Number(total[1])) : 0;
  const first = attacks.find((a) => !a.ranged) || attacks[0];
  return n && first ? [{name: first.name, count: n}] : [];
}
export function monsterActions(monster) {
  const sections = [['actions', 'action'], ['bonusActions', 'bonus'], ['reactions', 'reaction'], ['legendaryActions', 'legendary']];
  const groups = {action: [], bonus: [], reaction: [], legendary: []};
  for (const [field, key] of sections) for (const a of monster?.[field] || []) groups[key].push(parseMonsterAction(a, key));
  const attacks = groups.action.filter((a) => a.kind === 'attack');
  const multi = groups.action.find((a) => /^multiattack/i.test(a.name));
  if (multi) { multi.kind = 'multiattack'; multi.sequence = parseMultiattack(multi.description, attacks); }
  return groups;
}

/* ---------- multiataque de personagens (não acumula entre classes) ---------- */
export function classLevel(model, id) { return (model.classes || []).filter((c) => baseClassId(c.id) === id).reduce((s, c) => s + Number(c.level || 0), 0); }
export function attacksPerAction(model) {
  let n = 1;
  const lv = (id) => classLevel(model, id);
  const fighter = lv('fighter');
  if (fighter >= 5) n = Math.max(n, fighter >= 20 ? 4 : fighter >= 11 ? 3 : 2);
  for (const id of ['barbarian', 'monk', 'paladin', 'ranger', 'revised_ranger', 'blood_hunter']) if (lv(id) >= 5) n = Math.max(n, 2);
  const bard = (model.classes || []).find((c) => baseClassId(c.id) === 'bard');
  if (bard && bard.level >= 6 && /valor|swords/i.test(bard.subclass || '')) n = Math.max(n, 2);
  const names = (model.features || []).map((f) => String(f.name));
  if (names.some((x) => /thirsting blade/i.test(x))) n = Math.max(n, 2);
  for (const name of names) { const m = /Extra Attack(?:\s*\((\d)\))?/i.exec(name); if (m) n = Math.max(n, m[1] ? Number(m[1]) : 2); }
  return n;
}
export const sneakAttackDice = (model) => { const r = classLevel(model, 'rogue'); return r ? Math.ceil(r / 2) : 0; };

/* ---------- ataques do personagem ---------- */
export function characterAttacks(model) {
  const pb = Number(model.pb || 2), str = Number(model.abilities?.str?.mod ?? 0);
  const list = (model.attacks || []).map((a, index) => {
    const props = String(a.properties || '') + ' ' + String(a.description || '');
    const range = /(?:range|alcance)\s*(\d+)\s*\/\s*(\d+)/i.exec(props);
    const ranged = /distância|ranged/i.test(String(a.range || ''));
    const dmg = String(a.damage || '1d4').replace(/\s+/g, '');
    return {
      id: `atk:${index}`, name: a.name, toHit: Number(a.attack || 0), damage: [{expr: dmg, type: String(a.damageType || 'bludgeoning').toLowerCase()}],
      versatile: a.versatile ? String(a.versatile).replace(/\s+/g, '') : '', ranged, melee: !ranged, reach: 5,
      range: range ? Number(range[1]) : null, longRange: range ? Number(range[2]) : null, ability: a.ability || (ranged ? 'dex' : 'str'),
      magical: /magic|attunement|\+\d|sagrad|holy/i.test(props + a.name), properties: String(a.properties || ''), finesse: /finesse|acuidade/i.test(props),
    };
  });
  list.push({id: 'atk:unarmed', name: 'Ataque desarmado', toHit: str + pb, damage: [{expr: String(Math.max(1, 1 + str)), type: 'bludgeoning'}], ranged: false, melee: true, reach: 5, ability: 'str', magical: false, properties: ''});
  return list;
}

/* ---------- magias ---------- */
const SPELL_FX = {
  'bless': {effect: 'bless'}, 'bane': {effect: 'bane', save: 'cha'}, 'shield': {effect: 'shield', self: true}, 'shield of faith': {effect: 'shield_of_faith'},
  'haste': {effect: 'haste'}, "hunter's mark": {effect: 'hunters_mark', self: true}, 'hex': {effect: 'hex', self: true}, 'faerie fire': {effect: 'faerie_fire', save: 'dex'},
  'hold person': {cond: ['paralyzed']}, 'hold monster': {cond: ['paralyzed']}, 'blindness/deafness': {cond: ['blinded']}, 'web': {cond: ['restrained']}, 'entangle': {cond: ['restrained']},
  'color spray': {cond: ['blinded']}, "tasha's hideous laughter": {cond: ['prone', 'incapacitated']}, 'hypnotic pattern': {cond: ['incapacitated']}, 'fear': {cond: ['frightened']},
  'sleep': {cond: ['unconscious'], noSave: true}, 'invisibility': {cond: ['invisible'], willing: true}, 'greater invisibility': {cond: ['invisible'], willing: true},
  'command': {note: 'O alvo obedece a palavra de comando.'}, 'compelled duel': {cond: ['charmed'], note: 'Duelo: o alvo tem desvantagem contra outros.'},
};
export function parseSpell(spell, {castLevel = null, charLevel = 1} = {}) {
  const d = String(spell.description || ''), name = norm(spell.name), base = Number(spell.level || 0), lvl = castLevel ?? base;
  const out = {name: spell.name, key: name, level: base, castLevel: lvl, kind: 'utility', damage: [], heal: null, concentration: !!spell.concentration, description: d, fx: SPELL_FX[name] || null, area: areaOf(d)};
  if (name === 'magic missile') return {...out, kind: 'missiles', darts: 3 + Math.max(0, lvl - 1), dartDamage: '1d4+1', type: 'force'};
  if (name === 'eldritch blast') return {...out, kind: 'beams', beams: charLevel >= 17 ? 4 : charLevel >= 11 ? 3 : charLevel >= 5 ? 2 : 1, dmg: '1d10', type: 'force', ranged: true};
  if (name === 'scorching ray') return {...out, kind: 'rays', rays: 3 + Math.max(0, lvl - 2), dmg: '2d6', type: 'fire', ranged: true};
  const atk = /(ranged|melee) spell attack/i.exec(d), save = /(strength|dexterity|constitution|intelligence|wisdom|charisma) saving throw/i.exec(d);
  const re = new RegExp(`(\\d+d\\d+(?:\\s*[+\\-]\\s*\\d+)?)\\s+(${TYPES})\\s+damage`, 'gi'); let m; const seen = new Set();
  while ((m = re.exec(d)) !== null) { const expr = m[1].replace(/\s+/g, ''); const k = expr + m[2]; if (!seen.has(k)) { seen.add(k); out.damage.push({expr, type: m[2].toLowerCase()}); } }
  const heal = /regains?\s+(?:a number of\s+)?hit points equal to\s+(\d+d\d+)/i.exec(d) || /heals?\s+(\d+d\d+)\s+hit points/i.exec(d);
  if (heal) out.heal = {expr: heal[1], addMod: /spellcasting ability modifier/i.test(d)};
  if (save) { out.kind = 'save'; out.save = {ability: ABIL_WORD[save[1].toLowerCase()], half: /half as much damage|half damage|half as much/i.test(d)}; }
  else if (atk) { out.kind = 'attack'; out.ranged = /ranged/i.test(atk[1]); }
  else if (out.heal) out.kind = 'heal';
  else if (out.damage.length) out.kind = 'auto';
  const scale = (expr, mult) => expr.replace(/^(\d+)d/, (_, c) => `${Number(c) * mult}d`);
  if (base === 0 && out.damage.length) { const mult = charLevel >= 17 ? 4 : charLevel >= 11 ? 3 : charLevel >= 5 ? 2 : 1; if (mult > 1 && out.kind !== 'heal') out.damage[0] = {...out.damage[0], expr: scale(out.damage[0].expr, mult)}; }
  const up = /(\d+d\d+)\s+(?:for each|per)\s+slot level above (\d+)/i.exec(String(spell.higherLevels || '') + ' ' + d);
  if (up && lvl > base && base > 0) {
    const extra = lvl - Number(up[2]); const dice = up[1].match(/^(\d+)d(\d+)$/);
    if (extra > 0 && dice) { const add = `${Number(dice[1]) * extra}d${dice[2]}`; if (out.heal) out.heal.expr = `${out.heal.expr}+${add}`; else if (out.damage.length) out.damage[0] = {...out.damage[0], expr: `${out.damage[0].expr}+${add}`}; }
  }
  return out;
}
/** Qual classe conjuradora serve a esta magia (multiclasse): usa `spell.classes` e cai na primeira. */
export function casterFor(model, spell) {
  const list = model.casterClasses || [];
  if (!list.length) return {dc: model.spellcasting?.dc ?? 10, attack: model.spellcasting?.attack ?? 0, mod: model.spellcasting?.abilityMod ?? 0, name: ''};
  const tag = norm(spell?.classes);
  return list.find((c) => tag && tag.includes(norm(c.id).replace(/_/g, ' '))) || list.find((c) => tag && tag.includes(norm(c.name))) || list[0];
}
export function availableSlots(model, play, minLevel) {
  const out = [];
  for (let level = Math.max(1, minLevel); level <= 9; level += 1) { const total = Number(model.spellSlots?.[level - 1] || 0), used = Number(play?.slotsUsed?.[level - 1] || 0); if (total - used > 0) out.push({level, left: total - used, kind: 'slot'}); }
  const p = model.pactMagic; if (p?.count && p.slotLevel >= minLevel) { const left = Number(p.count) - Number(play?.pactUsed || 0); if (left > 0) out.push({level: p.slotLevel, left, kind: 'pact'}); }
  return out;
}

/* ---------- itens ---------- */
const HEAL_POTIONS = [[/supreme healing/, '10d4+20'], [/superior healing/, '8d4+8'], [/greater healing/, '4d4+4'], [/potion of healing|poção de cura/, '2d4+2']];
const THROWN = {javelin: ['1d6', 'piercing', 30, 120, 'str'], dagger: ['1d4', 'piercing', 20, 60, 'dex'], handaxe: ['1d6', 'slashing', 20, 60, 'str'], spear: ['1d6', 'piercing', 20, 60, 'str'], dart: ['1d4', 'piercing', 20, 60, 'dex'], 'light hammer': ['1d4', 'bludgeoning', 20, 60, 'str'], trident: ['1d6', 'piercing', 20, 60, 'str']};
export function itemAction(item) {
  const name = norm(item.name), desc = String(item.description || '');
  for (const [re, expr] of HEAL_POTIONS) if (re.test(name)) return {kind: 'heal', expr, consume: true, label: 'Beber'};
  if (/alchemist'?s fire/.test(name)) return {kind: 'throw', damage: [{expr: '1d4', type: 'fire'}], range: 20, longRange: 20, ability: 'dex', consume: true, label: 'Arremessar'};
  if (/^acid|vial of acid|acid \(vial\)/.test(name)) return {kind: 'throw', damage: [{expr: '2d6', type: 'acid'}], range: 20, longRange: 20, ability: 'dex', consume: true, label: 'Arremessar'};
  if (/holy water|água benta/.test(name)) return {kind: 'throw', damage: [{expr: '2d6', type: 'radiant'}], range: 20, longRange: 20, ability: 'dex', consume: true, label: 'Arremessar', note: 'Apenas contra mortos-vivos e corruptores.'};
  for (const key of Object.keys(THROWN)) if (name === key || name.startsWith(key + ' ')) { const t = THROWN[key]; return {kind: 'throw', damage: [{expr: t[0], type: t[1]}], range: t[2], longRange: t[3], ability: t[4], consume: true, label: 'Arremessar', proficient: true, weapon: true}; }
  const heal = /regains?\s+(\d+d\d+(?:\s*\+\s*\d+)?)\s+hit points/i.exec(desc); if (heal) return {kind: 'heal', expr: heal[1].replace(/\s+/g, ''), consume: true, label: 'Usar'};
  if (/antitoxin|antídoto/.test(name)) return {kind: 'log', consume: true, label: 'Usar', note: 'Vantagem em salvaguardas contra veneno por 1 hora.'};
  if (/potion|poção|elixir|scroll|pergaminho|oil|óleo|ration|ração|torch|tocha/.test(name)) return {kind: 'log', consume: true, label: 'Usar'};
  return {kind: 'log', consume: false, label: 'Usar'};
}

/* ---------- multiclasse (5e PHB) ---------- */
export const MULTICLASS_REQ = {
  barbarian: [['str']], bard: [['cha']], cleric: [['wis']], druid: [['wis']], fighter: [['str', 'dex']], monk: [['dex'], ['wis']], paladin: [['str'], ['cha']],
  ranger: [['dex'], ['wis']], revised_ranger: [['dex'], ['wis']], rogue: [['dex']], sorcerer: [['cha']], warlock: [['cha']], wizard: [['int']], artificer: [['int']],
  blood_hunter: [['str', 'dex'], ['int']], mystic: [['int']],
};
export const MULTICLASS_PROFS = {
  barbarian: 'escudos, armas simples e marciais', bard: 'armadura leve, 1 perícia, 1 instrumento', cleric: 'armadura leve e média, escudos', druid: 'armadura leve e média, escudos (sem metal)',
  fighter: 'armadura leve e média, escudos, armas simples e marciais', monk: 'armas simples, espadas curtas', paladin: 'armadura leve e média, escudos, armas simples e marciais',
  ranger: 'armadura leve e média, escudos, armas simples e marciais, 1 perícia', rogue: 'armadura leve, 1 perícia, ferramentas de ladrão', sorcerer: 'nenhuma', warlock: 'armadura leve, armas simples', wizard: 'nenhuma',
};
/** Confere pré-requisitos (13+) da classe atual E da nova. `minimum` padrão 13. */
export function multiclassCheck(abilities, currentIds, newId, minimum = 13) {
  const items = [];
  for (const id of [...new Set([...(currentIds || []).map(baseClassId), baseClassId(newId)])]) {
    const groups = MULTICLASS_REQ[id]; if (!groups) continue;
    for (const group of groups) {
      const best = group.map((k) => ({k, v: abilityScore(abilities, k)})).sort((a, b) => b.v - a.v)[0];
      items.push({classId: id, need: group.map((k) => ABILITY_PT[k]).join(' ou ') + ' ' + minimum, have: `${ABILITY_PT[best.k]} ${best.v}`, ok: group.some((k) => abilityScore(abilities, k) >= minimum), isNew: id === baseClassId(newId)});
    }
  }
  return {ok: items.every((i) => i.ok), items};
}
export {averageOf};
export {parseDamageTypes, CONDITIONS, CONDITION_ICON, EFFECTS, rageBonus} from './dice-core.js?v=6';
