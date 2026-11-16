// Silvengard · dados e regras de combate 5e (puro, sem DOM): rolagens, vantagem, crítico e dano.
export const rollDie = (sides, rng = Math.random) => 1 + Math.floor(rng() * Math.max(1, sides));

/** "2d6+3-1d4" -> termos. Aceita 'd20', '4d6', '+5'. */
export function parseExpr(src) {
  const s = String(src ?? '').toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-');
  const re = /([+-]?)(?:(\d*)d(\d+)|(\d+))/g;
  const terms = [];
  let m, pos = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index !== pos) throw new Error(`Expressão inválida: ${src}`);
    pos = re.lastIndex;
    const sign = m[1] === '-' ? -1 : 1;
    if (m[3]) terms.push({sign, count: Math.max(1, Math.min(100, Number(m[2] || 1))), sides: Math.max(2, Math.min(1000, Number(m[3])))});
    else terms.push({sign, flat: Number(m[4])});
  }
  if (!terms.length || pos !== s.length) throw new Error(`Expressão inválida: ${src}`);
  return terms;
}

/** Rola uma expressão. `crit` dobra a QUANTIDADE de dados (não os modificadores). */
export function rollExpr(src, {rng = Math.random, crit = false, min = 0} = {}) {
  const terms = parseExpr(src);
  let total = 0;
  const parts = [];
  for (const t of terms) {
    if (t.flat != null) { total += t.sign * t.flat; parts.push({flat: t.sign * t.flat}); continue; }
    const count = t.count * (crit ? 2 : 1);
    const rolls = Array.from({length: count}, () => rollDie(t.sides, rng));
    const sum = rolls.reduce((a, b) => a + b, 0);
    total += t.sign * sum;
    parts.push({sides: t.sides, sign: t.sign, rolls, sum});
  }
  return {total: Math.max(min, total), expr: String(src), parts, crit, text: describeParts(parts)};
}
export function describeParts(parts) {
  return parts.map((p) => p.flat != null ? `${p.flat < 0 ? '−' : '+'}${Math.abs(p.flat)}` : `${p.sign < 0 ? '−' : ''}d${p.sides}[${p.rolls.join(',')}]`).join(' ').replace(/^\+/, '');
}
export const averageOf = (src) => parseExpr(src).reduce((s, t) => s + (t.flat != null ? t.sign * t.flat : t.sign * t.count * (t.sides + 1) / 2), 0);

/** d20 com vantagem/desvantagem. */
export function rollD20({mode = 'normal', rng = Math.random} = {}) {
  const a = rollDie(20, rng), b = mode === 'normal' ? null : rollDie(20, rng);
  const used = b == null ? a : mode === 'adv' ? Math.max(a, b) : Math.min(a, b);
  return {rolls: b == null ? [a] : [a, b], used, mode, nat20: used === 20, nat1: used === 1};
}

/** Soma de vantagem/desvantagem (5e: qualquer fonte de cada lado se cancela). */
export function netMode(adv = [], dis = []) {
  if (adv.length && dis.length) return 'normal';
  return adv.length ? 'adv' : dis.length ? 'dis' : 'normal';
}

/** Teste de ataque completo contra uma CA. */
export function rollAttack({toHit = 0, mode = 'normal', bonusDice = [], ac = 10, rng = Math.random, autoCrit = false, critRange = 20}) {
  const d20 = rollD20({mode, rng});
  let total = d20.used + toHit;
  const extras = [];
  for (const dice of bonusDice) { const r = rollExpr(dice, {rng}); total += r.total; extras.push({expr: dice, total: r.total}); }
  const crit = d20.used >= critRange;
  const hit = !d20.nat1 && (d20.used === 20 || crit || total >= ac);
  return {d20, total, toHit, extras, ac, hit, crit: hit && (crit || autoCrit), nat1: d20.nat1, nat20: d20.nat20, mode};
}

/** Dano em várias partes [{expr,type}] com crítico. */
export function rollDamage(parts, {crit = false, rng = Math.random} = {}) {
  const rolled = parts.map((p) => {
    const r = rollExpr(p.expr, {crit, rng, min: 0});
    return {...p, total: r.total, text: r.text, rolls: r.parts};
  });
  return {parts: rolled, total: rolled.reduce((s, p) => s + p.total, 0), crit};
}

/** Resistência / vulnerabilidade / imunidade. Retorna dano final por tipo. */
export function adjustDamage(parts, {resist = [], vuln = [], immune = [], magical = true} = {}) {
  const hit = (list, type) => list.some((entry) => {
    const t = typeof entry === 'string' ? {type: entry} : entry;
    return String(t.type).toLowerCase() === String(type).toLowerCase() && (!t.nonmagical || !magical);
  });
  let total = 0;
  const details = parts.map((p) => {
    let value = p.total;
    let note = '';
    if (hit(immune, p.type)) { value = 0; note = 'imune'; }
    else {
      if (hit(resist, p.type)) { value = Math.floor(value / 2); note = 'resistente'; }
      if (hit(vuln, p.type)) { value *= 2; note = note ? 'normal' : 'vulnerável'; }
    }
    total += value;
    return {...p, final: value, note};
  });
  return {total, details};
}

/** Lê "resistências" de monstros em texto livre. */
const DMG_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
export function parseDamageTypes(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return [];
  const nonmagical = /nonmagical|non-magical|not silvered|not adamantine/.test(t);
  const found = DMG_TYPES.filter((d) => t.includes(d));
  const allPhys = /bludgeoning, piercing,? and slashing/.test(t);
  return found.map((type) => ({type, nonmagical: nonmagical && ['bludgeoning', 'piercing', 'slashing'].includes(type) && (allPhys || true)}));
}

/** Aplica dano a um token-like {hp,maxHp,tempHp}. Retorna o que mudou. */
export function applyDamage(token, amount) {
  let left = Math.max(0, Math.floor(amount));
  const before = {hp: token.hp, temp: token.tempHp || 0};
  const absorbed = Math.min(before.temp, left);
  token.tempHp = before.temp - absorbed;
  left -= absorbed;
  const hpLoss = Math.min(token.hp, left);
  token.hp = token.hp - hpLoss;
  const overflow = left - hpLoss;
  return {absorbed, hpLoss, overflow, hpBefore: before.hp, instantDeath: token.kind === 'character' && before.hp > 0 && overflow >= token.maxHp, dropped: before.hp > 0 && token.hp === 0};
}
export function applyHealing(token, amount) {
  const before = token.hp;
  token.hp = Math.min(token.maxHp, token.hp + Math.max(0, Math.floor(amount)));
  return {healed: token.hp - before, hpBefore: before};
}
export const concentrationDC = (damage) => Math.max(10, Math.floor(damage / 2));

/** Salvaguarda contra a morte. */
export function deathSave(state, rng = Math.random) {
  const s = state || {success: 0, fail: 0};
  const d = rollDie(20, rng);
  if (d === 20) return {d, state: {success: 0, fail: 0}, revived: true};
  if (d === 1) s.fail += 2; else if (d >= 10) s.success += 1; else s.fail += 1;
  return {d, state: s, stable: s.success >= 3, dead: s.fail >= 3};
}

/* ---------- condições e efeitos ---------- */
export const CONDITIONS = {
  prone: 'Caído', blinded: 'Cego', charmed: 'Enfeitiçado', deafened: 'Surdo', frightened: 'Amedrontado', grappled: 'Agarrado',
  incapacitated: 'Incapacitado', invisible: 'Invisível', paralyzed: 'Paralisado', petrified: 'Petrificado', poisoned: 'Envenenado',
  restrained: 'Contido', stunned: 'Atordoado', unconscious: 'Inconsciente', dodging: 'Esquivando',
};
export const CONDITION_ICON = {prone: '⤓', blinded: '◐', charmed: '♥', deafened: '∅', frightened: '!', grappled: '✊', incapacitated: '✖', invisible: '◌', paralyzed: '⚡', petrified: '▲', poisoned: '☠', restrained: '⛓', stunned: '✦', unconscious: 'Zz', dodging: '⛨'};

/** Efeitos ativáveis (toggle no token). */
export const EFFECTS = {
  bless: {label: 'Bênção', attackDice: '1d4', saveDice: '1d4', concentration: true},
  bane: {label: 'Maldição', attackDice: '-1d4', saveDice: '-1d4', concentration: true},
  rage: {label: 'Fúria', rage: true, resist: ['bludgeoning', 'piercing', 'slashing']},
  hunters_mark: {label: 'Marca do Caçador', damageDice: '1d6', concentration: true},
  hex: {label: 'Mau-olhado', damageDice: '1d6', damageType: 'necrotic', concentration: true},
  shield: {label: 'Escudo', acBonus: 5},
  shield_of_faith: {label: 'Escudo da Fé', acBonus: 2, concentration: true},
  haste: {label: 'Aceleração', acBonus: 2, concentration: true},
  reckless: {label: 'Ataque imprudente', recklessAdv: true},
  faerie_fire: {label: 'Fogo das Fadas', grantsAdv: true, concentration: true},
  help: {label: 'Ajudado', attackAdv: true},
  hidden: {label: 'Escondido', attackAdv: true},
  bardic: {label: 'Inspiração (d6)', attackDice: '1d6'},
};
export const rageBonus = (barbarianLevel) => barbarianLevel >= 16 ? 4 : barbarianLevel >= 9 ? 3 : 2;

/** Vantagem/desvantagem automática de um ataque. */
export function attackModeFor({attacker, target, dist = 5, ranged = false, melee = !ranged, override = 'normal', abilityKey = 'str'}) {
  const adv = [], dis = [];
  const ac = new Set(attacker.conditions || []), tc = new Set(target.conditions || []);
  const ae = new Set(attacker.effects || []), te = new Set(target.effects || []);
  for (const c of ['blinded', 'frightened', 'poisoned', 'prone', 'restrained']) if (ac.has(c)) dis.push(CONDITIONS[c]);
  if (ac.has('invisible')) adv.push('Invisível');
  if (ae.has('help')) adv.push('Ajudado'); if (ae.has('hidden')) adv.push('Escondido');
  if (ae.has('reckless') && melee && abilityKey === 'str') adv.push('Imprudente');
  for (const c of ['blinded', 'paralyzed', 'restrained', 'stunned', 'unconscious', 'petrified']) if (tc.has(c)) adv.push(`Alvo ${CONDITIONS[c].toLowerCase()}`);
  if (tc.has('prone')) { if (dist <= 5 && melee) adv.push('Alvo caído (corpo a corpo)'); else if (ranged || dist > 5) dis.push('Alvo caído (distância)'); }
  if (tc.has('invisible')) dis.push('Alvo invisível');
  if (tc.has('dodging') && !tc.has('incapacitated')) dis.push('Alvo esquivando');
  if (te.has('faerie_fire')) adv.push('Fogo das Fadas');
  if (te.has('reckless')) adv.push('Alvo imprudente');
  if (ranged && dist <= 5 && attacker.kind !== target.kind) dis.push('Inimigo adjacente');
  if (override === 'adv') adv.push('Manual'); if (override === 'dis') dis.push('Manual');
  const autoCrit = melee && dist <= 5 && (tc.has('paralyzed') || tc.has('unconscious'));
  return {adv, dis, mode: netMode(adv, dis), autoCrit};
}

/** CA efetiva do token (efeitos somam). */
export function effectiveAc(token) {
  let ac = Number(token.ac) || 10;
  for (const key of token.effects || []) ac += EFFECTS[key]?.acBonus || 0;
  return ac;
}

/* ---------- geometria de áreas (grade de 5 pés) ---------- */
export function tokensInArea(area, origin, target, tokens, ftPerCell = 5) {
  const rad = (area.sizeFt / ftPerCell);
  const o = {x: origin.x + .5, y: origin.y + .5}, t = {x: (target?.x ?? origin.x) + .5, y: (target?.y ?? origin.y) + .5};
  const ang = Math.atan2(t.y - o.y, t.x - o.x);
  return tokens.filter((tok) => {
    const cx = tok.x + tok.size / 2, cy = tok.y + tok.size / 2, dx = cx - o.x, dy = cy - o.y;
    if (area.shape === 'circle') return Math.hypot(dx, dy) <= rad + tok.size / 2 - .01;
    if (area.shape === 'square') return Math.abs(dx) <= rad / 2 + tok.size / 2 - .01 && Math.abs(dy) <= rad / 2 + tok.size / 2 - .01;
    if (area.shape === 'cone') { const d = Math.hypot(dx, dy); if (d > rad + tok.size / 2 || d < .01) return false; let da = Math.abs(Math.atan2(dy, dx) - ang); if (da > Math.PI) da = 2 * Math.PI - da; return da <= Math.PI / 7 + .05; }
    if (area.shape === 'line') { const ux = Math.cos(ang), uy = Math.sin(ang), along = dx * ux + dy * uy, across = Math.abs(-dx * uy + dy * ux); return along >= -.01 && along <= rad && across <= .5 + tok.size / 2 - .01; }
    return false;
  });
}
