// Silvengard · ações do token no tabuleiro: ataques, multiataque, magias, itens, efeitos, testes e dados.
import * as D from './dice-core.js?v=6';
import * as C from './combat-core.js?v=6';

const LOG_KEY = 'silvengard-battlelog-v1';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const sg = (n) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);
const num = (v, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f);
const TYPE_PT = {acid: 'ácido', bludgeoning: 'contundente', cold: 'frio', fire: 'fogo', force: 'energia', lightning: 'elétrico', necrotic: 'necrótico', piercing: 'perfurante', poison: 'veneno', psychic: 'psíquico', radiant: 'radiante', slashing: 'cortante', thunder: 'trovão'};
const SKILL_OPT = [['str', 'Força'], ['dex', 'Destreza'], ['con', 'Constituição'], ['int', 'Inteligência'], ['wis', 'Sabedoria'], ['cha', 'Carisma']];

export function createActions(api) {
  const {wrap, logBox, characters, toast, getTokens, getSelected, selectToken, save, redraw, rerenderSelected, getTemplate, clearTemplate, getMonsters, distanceFt, armArea} = api;
  let log = [];
  try { log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { log = []; }
  const st = {targets: [], pending: null, session: null, menu: null, mode: 'normal', opts: {sneak: false, twoHands: false, power: false}, floaters: [], smites: {}, nextId: 1};

  const tokens = () => getTokens();
  const byId = (id) => tokens().find((t) => t.id === id);
  const sheetOf = (t) => (t?.kind === 'character' ? characters.getSheets().find((s) => String(s.id) === String(t.sheetId)) : null);
  const monsterOf = (t) => (t?.kind === 'monster' ? getMonsters().find((m) => String(m.id) === String(t.monsterId)) : null);
  const targets = () => st.targets.map(byId).filter((t) => t && !t.dead);
  const nameOf = (t) => t?.name || 'Token';
  const modOf = (t, k) => { const s = sheetOf(t); if (s) return num(s.abilities?.[k]?.mod); const m = monsterOf(t); return C.modOf(num(m?.abilities?.[k], 10)); };
  const saveModOf = (t, k) => { const s = sheetOf(t); if (s) return num(s.abilities?.[k]?.saveMod ?? s.abilities?.[k]?.mod); const m = monsterOf(t); const v = m?.savingThrows?.[k]; return v != null ? num(String(v).replace('+', '')) : C.modOf(num(m?.abilities?.[k], 10)); };
  const levelOf = (t) => num(sheetOf(t)?.level, 1);

  /* ---------- registo ---------- */
  function addLog(entry) {
    log.unshift({id: st.nextId++, at: Date.now(), ...entry});
    log = log.slice(0, 80);
    try { localStorage.setItem(LOG_KEY, JSON.stringify(log.map(({...e}) => e))); } catch { /* sem persistência */ }
    renderLog();
  }
  function renderLog() {
    if (!logBox) return;
    logBox.innerHTML = log.length ? log.map((e) => `<div class="bbLogRow ${esc(e.tone || '')}" data-log="${e.id}"><div class="bbLogHead"><b>${esc(e.title || '')}</b><small>${esc(e.actor || '')}</small></div>${(e.lines || []).map((l) => `<div>${l}</div>`).join('')}${(e.smite || []).length ? `<div class="bbLogActions">${e.smite.map((lv) => `<button data-smite="${e.id}:${lv}">Punição Divina ${lv}º</button>`).join('')}</div>` : ''}</div>`).join('') : '<p class="charMuted">As rolagens aparecem aqui.</p>';
  }
  const dieChip = (roll, nat) => `<span class="bbDie ${nat === 20 ? 'crit' : nat === 1 ? 'fumble' : ''}">${roll}</span>`;
  function banner(text, tone = '') {
    let el = wrap.querySelector('#bbRollBanner');
    if (!el) { el = document.createElement('div'); el.id = 'bbRollBanner'; wrap.append(el); }
    el.className = `show ${tone}`; el.textContent = text;
    clearTimeout(banner.t); banner.t = setTimeout(() => el.classList.remove('show'), 2300);
  }
  function floatText(token, text, color = '#f1dda9') {
    if (!token) return;
    st.floaters.push({id: token.id, text, color, t: performance.now()});
    redraw();
  }

  /* ---------- estado do token ---------- */
  function initToken(token) {
    token.conditions ||= []; token.effects ||= []; token.tempHp ??= 0; token.used ||= {action: false, bonus: false, reaction: false};
    if (token.kind === 'character') {
      const s = sheetOf(token); if (s) { token.ac = s.ac; token.tempHp = num(s.hp?.temp); token.conditions = token.conditions.length ? token.conditions : [...new Set((s.conditions || []).map((c) => String(c).toLowerCase()).filter((c) => c in C.CONDITIONS))]; }
    } else {
      const m = monsterOf(token);
      if (m) {
        token.ac = typeof m.ac === 'number' ? m.ac : num(String(m.ac).match(/\d+/)?.[0], 10);
        token.resist = D.parseDamageTypes(m.resistances); token.vuln = D.parseDamageTypes(m.vulnerabilities); token.immune = D.parseDamageTypes(m.immunities);
        token.legendary = (m.legendaryActions || []).length ? 3 : 0;
        token.recharge ||= {}; for (const a of m.actions || []) { const r = /Recharge (\d)/i.exec(a.name); if (r) token.recharge[a.name] = true; }
      }
    }
  }
  function onTurnStart(token) {
    if (!token) return;
    initToken(token); token.used = {action: false, bonus: false, reaction: false};
    token.effects = token.effects.filter((e) => e !== 'help'); token.conditions = token.conditions.filter((c) => c !== 'dodging');
    st.session = null; st.pending = null;
    if (token.kind === 'monster') {
      if (token.legendary != null && (monsterOf(token)?.legendaryActions || []).length) token.legendary = 3;
      for (const name of Object.keys(token.recharge || {})) if (!token.recharge[name]) {
        const need = Number(/Recharge (\d)/i.exec(name)?.[1] || 6), r = D.rollDie(6);
        if (r >= need) { token.recharge[name] = true; addLog({title: `${name} recarregou`, actor: nameOf(token), lines: [`d6 ${dieChip(r)} ≥ ${need}`], tone: 'good'}); }
      }
    }
    if (token.kind === 'character' && token.hp === 0 && !token.dead) toast(`${nameOf(token)} está a 0 PV: faça uma salvaguarda contra a morte.`);
    save();
  }
  function pushSheet(token) {
    if (token.kind !== 'character' || token.sheetId == null) return;
    characters.setSheetState?.(token.sheetId, {hp: token.hp, temp: token.tempHp, conditions: token.conditions, death: token.deathSaves || null}) ?? characters.setSheetHp(token.sheetId, token.hp);
  }
  function effectiveResist(token) {
    const list = [...(token.resist || [])];
    for (const key of token.effects || []) for (const t of C.EFFECTS?.[key]?.resist || D.EFFECTS[key]?.resist || []) list.push({type: t});
    return list;
  }

  /* ---------- dano, cura, concentração ---------- */
  function dealDamage(target, parts, {magical = true, crit = false, source = null} = {}) {
    const adj = D.adjustDamage(parts, {resist: effectiveResist(target), vuln: target.vuln || [], immune: target.immune || [], magical});
    const r = D.applyDamage(target, adj.total);
    const lines = [];
    let status = '';
    if (r.dropped) {
      if (target.kind === 'monster') { target.defeated = true; status = ' · <b class="bad">derrotado</b>'; }
      else { target.deathSaves = {success: 0, fail: 0}; target.conditions = [...new Set([...target.conditions, 'unconscious', 'prone'])]; status = ' · <b class="bad">cai inconsciente</b>'; }
    }
    if (r.instantDeath) { target.dead = true; status = ' · <b class="bad">morte instantânea</b>'; }
    if (target.hp === 0 && target.kind === 'character' && r.hpLoss === 0 && r.absorbed < adj.total && !r.dropped && !target.dead) { target.deathSaves = target.deathSaves || {success: 0, fail: 0}; target.deathSaves.fail += crit ? 2 : 1; if (target.deathSaves.fail >= 3) { target.dead = true; status = ' · <b class="bad">morre</b>'; } }
    pushSheet(target); save();
    floatText(target, `−${adj.total}`, '#ff8f86');
    lines.push(`${esc(nameOf(target))}: ${r.hpBefore} → <b>${target.hp}</b>/${target.maxHp} PV${r.absorbed ? ` (${r.absorbed} absorvido por PV temp.)` : ''}${status}`);
    if (adj.total > 0 && target.concentration && !target.dead && target.hp > 0) lines.push(concentrationCheck(target, adj.total));
    else if (target.concentration && target.hp === 0) { lines.push(`${esc(target.concentration.name)}: concentração perdida`); breakConcentration(target); }
    return {adj, lines};
  }
  function healToken(target, amount) {
    const r = D.applyHealing(target, amount);
    if (target.hp > 0) { target.defeated = false; if (target.conditions.includes('unconscious') && r.hpBefore === 0) target.conditions = target.conditions.filter((c) => c !== 'unconscious'); target.deathSaves = null; }
    pushSheet(target); save(); floatText(target, `+${r.healed}`, '#8fd49b');
    return `${esc(nameOf(target))}: ${r.hpBefore} → <b>${target.hp}</b>/${target.maxHp} PV`;
  }
  function breakConcentration(token) {
    for (const ap of token.concentration?.applied || []) { const t = byId(ap.id); if (t) { t.effects = (t.effects || []).filter((e) => e !== ap.effect); t.conditions = (t.conditions || []).filter((c) => !(ap.cond || []).includes(c)); } }
    token.concentration = null; save();
  }
  function concentrationCheck(token, dmg) {
    const dc = D.concentrationDC(dmg), mod = saveModOf(token, 'con'), r = D.rollD20({}), total = r.used + mod, ok = total >= dc;
    const msg = `Concentração (${esc(token.concentration.name)}): CON ${dieChip(r.used, r.used)} ${sg(mod)} = ${total} vs CD ${dc} → ${ok ? '<b class="good">mantém</b>' : '<b class="bad">perde</b>'}`;
    if (!ok) breakConcentration(token);
    return msg;
  }

  /* ---------- ataques ---------- */
  function attackContext(attacker, target, atk) {
    const dist = distanceFt(attacker, target), ranged = !!atk.ranged;
    const auto = D.attackModeFor({attacker, target, dist, ranged, melee: !ranged, override: st.mode, abilityKey: atk.ability || 'str'});
    const dice = [];
    for (const e of attacker.effects || []) if (D.EFFECTS[e]?.attackDice) dice.push(D.EFFECTS[e].attackDice);
    return {dist, auto, dice};
  }
  function performAttack(attacker, target, atk, label = '') {
    initToken(attacker); initToken(target);
    const ctx = attackContext(attacker, target, atk), warn = [];
    const reach = ranged => ranged ? (atk.range || 0) : (atk.reach || 5);
    if (!atk.ranged && ctx.dist > reach(false)) warn.push(`fora de alcance (${ctx.dist} pés, alcance ${reach(false)})`);
    let mode = ctx.auto.mode;
    if (atk.ranged && atk.range && ctx.dist > atk.range) { if (atk.longRange && ctx.dist > atk.longRange) warn.push(`além do alcance máximo (${atk.longRange} pés)`); else if (mode === 'adv') mode = 'normal'; else mode = 'dis'; ctx.auto.dis.push('Alcance longo'); }
    let toHit = atk.toHit + (st.opts.power && attacker.kind === 'character' ? -5 : 0);
    const ac = D.effectiveAc(target);
    const roll = D.rollAttack({toHit, mode, bonusDice: ctx.dice, ac, autoCrit: ctx.auto.autoCrit});
    const lines = [];
    const modeTxt = [...ctx.auto.adv.map((x) => `+ ${esc(x)}`), ...ctx.auto.dis.map((x) => `− ${esc(x)}`)].join(' · ');
    lines.push(`d20 ${roll.d20.rolls.map((r) => dieChip(r, r)).join(' ')}${mode !== 'normal' ? ` (${mode === 'adv' ? 'vantagem' : 'desvantagem'})` : ''} ${sg(toHit)}${roll.extras.map((e) => ` ${e.total >= 0 ? '+' : '−'}${Math.abs(e.total)} (${esc(e.expr)})`).join('')} = <b>${roll.total}</b> vs CA ${ac} → ${roll.hit ? `<b class="good">${roll.crit ? 'CRÍTICO' : 'ACERTO'}</b>` : `<b class="bad">${roll.nat1 ? 'ERRO CRÍTICO' : 'ERROU'}</b>`}`);
    if (modeTxt) lines.push(`<small>${modeTxt}</small>`);
    if (warn.length) lines.push(`<small class="warnTxt">⚠ ${warn.join('; ')}</small>`);
    let smite = [];
    if (roll.hit) {
      let parts = atk.damage.map((p) => ({...p}));
      if (st.opts.twoHands && atk.versatile) parts[0] = {...parts[0], expr: atk.versatile};
      const sheet = sheetOf(attacker);
      if (attacker.kind === 'character') {
        if (st.opts.sneak && C.sneakAttackDice(sheet)) parts.push({expr: `${C.sneakAttackDice(sheet)}d6`, type: parts[0].type});
        if (st.opts.power) parts.push({expr: '10', type: parts[0].type});
        if (attacker.effects.includes('rage') && !atk.ranged && (atk.ability || 'str') === 'str') parts.push({expr: String(D.rageBonus(C.classLevel(sheet, 'barbarian'))), type: parts[0].type});
      }
      for (const e of attacker.effects || []) { const fx = D.EFFECTS[e]; if (fx?.damageDice) parts.push({expr: fx.damageDice, type: fx.damageType || parts[0].type}); }
      const dmg = D.rollDamage(parts, {crit: roll.crit});
      lines.push(`Dano: ${dmg.parts.map((p) => `${esc(p.text)} = ${p.total} ${esc(TYPE_PT[p.type] || p.type)}`).join(' + ')}${roll.crit ? ' <small>(dados dobrados)</small>' : ''}`);
      const res = dealDamage(target, dmg.parts, {magical: !!atk.magical || attacker.kind === 'monster' && false, crit: roll.crit});
      for (const d of res.adj.details) if (d.note) lines.push(`<small>${esc(TYPE_PT[d.type] || d.type)}: ${d.note}</small>`);
      lines.push(...res.lines);
      if (attacker.kind === 'character' && C.classLevel(sheet, 'paladin') >= 2 && !atk.ranged) {
        const pl = characters.getPlay?.(attacker.sheetId); const sl = C.availableSlots(sheet, pl, 1).filter((s) => s.kind === 'slot').map((s) => s.level).slice(0, 5);
        if (sl.length) smite = sl;
      }
      if (atk.rider && roll.hit) lines.push(`<small>Efeito adicional: salvaguarda de ${C.ABILITY_PT[atk.rider.ability]} CD ${atk.rider.dc} (role em <b>Testes</b> do alvo).</small>`);
    } else floatText(target, roll.nat1 ? 'ERRO!' : 'ERROU', '#c9d5c9');
    if (roll.crit) floatText(target, 'CRÍTICO!', '#f1dda9');
    banner(`${atk.name}: ${roll.d20.used} ${sg(toHit)} = ${roll.total} ${roll.hit ? (roll.crit ? '· CRÍTICO' : '· acerto') : '· errou'}`, roll.hit ? 'good' : 'bad');
    const entry = {title: `${atk.name}${label ? ` (${label})` : ''} → ${nameOf(target)}`, actor: nameOf(attacker), lines, tone: roll.hit ? '' : 'miss', smite: [], smiteData: smite};
    addLog({...entry, smite});
    if (smite.length) st.smites[log[0].id] = {attacker: attacker.id, target: target.id, crit: roll.crit};
    rerenderSelected();
    return roll;
  }
  function smiteNow(entryId, level) {
    const data = st.smites[entryId]; if (!data) return;
    const a = byId(data.attacker), t = byId(data.target); if (!a || !t) return;
    if (!characters.spendSlot?.(a.sheetId, level, 'slot')) return toast('Sem espaço de magia desse nível.', true);
    const m = monsterOf(t); const extra = /undead|fiend/i.test(m?.type || '') ? 1 : 0;
    const dice = Math.min(5, 1 + level) + extra;
    const dmg = D.rollDamage([{expr: `${dice}d8`, type: 'radiant'}], {crit: data.crit});
    const res = dealDamage(t, dmg.parts, {magical: true, crit: data.crit});
    addLog({title: `Punição Divina ${level}º → ${nameOf(t)}`, actor: nameOf(a), lines: [`Dano: ${esc(dmg.parts[0].text)} = ${dmg.total} radiante${data.crit ? ' (dados dobrados)' : ''}`, ...res.lines]});
    delete st.smites[entryId]; const e = log.find((x) => x.id === entryId); if (e) { e.smite = []; renderLog(); }
    rerenderSelected();
  }

  /* ---------- salvaguardas e áreas ---------- */
  function saveRoll(target, ability, dc, {spell = false, bonusKey = 'saveDice'} = {}) {
    initToken(target);
    const adv = [], dis = [], tc = new Set(target.conditions || []);
    const autoFail = ['str', 'dex'].includes(ability) && ['paralyzed', 'stunned', 'unconscious', 'petrified'].some((c) => tc.has(c));
    if (ability === 'dex' && tc.has('restrained')) dis.push('contido');
    if (spell && monsterOf(target)?.traits?.some((t) => /magic resistance/i.test(t.name))) adv.push('Resistência à magia');
    if (target.effects?.includes('rage') && ability === 'str') adv.push('fúria');
    const mode = D.netMode(adv, dis), mod = saveModOf(target, ability), r = D.rollD20({mode});
    let total = r.used + mod; const extra = [];
    for (const e of target.effects || []) { const d = D.EFFECTS[e]?.[bonusKey]; if (d) { const x = D.rollExpr(d); total += x.total; extra.push(`${x.total >= 0 ? '+' : '−'}${Math.abs(x.total)} (${esc(D.EFFECTS[e].label)})`); } }
    const ok = !autoFail && total >= dc;
    return {ok, total, d20: r, mod, extra, autoFail, mode, text: `${esc(nameOf(target))}: ${C.ABILITY_PT[ability]} ${r.rolls.map((x) => dieChip(x, x)).join(' ')} ${sg(mod)}${extra.length ? ' ' + extra.join(' ') : ''} = ${total} vs CD ${dc} → ${autoFail ? '<b class="bad">falha automática</b>' : ok ? '<b class="good">passa</b>' : '<b class="bad">falha</b>'}`};
  }
  function resolveSaveEffect(source, list, {dc, ability, half, damage = [], cond = [], effect = null, label, spell = false, magical = true, concentrate = null}) {
    const lines = [];
    let rolled = null;
    if (damage.length) rolled = D.rollDamage(damage, {});
    if (rolled) lines.push(`Dano base: ${rolled.parts.map((p) => `${esc(p.text)} = ${p.total} ${esc(TYPE_PT[p.type] || p.type)}`).join(' + ')} · CD ${dc} ${C.ABILITY_PT[ability]}${half ? ' (metade se passar)' : ''}`);
    for (const t of list) {
      const s = saveRoll(t, ability, dc, {spell});
      lines.push(s.text);
      if (rolled) {
        const parts = rolled.parts.map((p) => ({...p, total: s.ok ? (half ? Math.floor(p.total / 2) : 0) : p.total}));
        if (parts.some((p) => p.total > 0)) lines.push(...dealDamage(t, parts, {magical}).lines);
      }
      if (!s.ok) {
        if (cond.length) { t.conditions = [...new Set([...(t.conditions || []), ...cond])]; lines.push(`<small>${esc(nameOf(t))}: ${cond.map((c) => C.CONDITIONS[c] || c).join(', ')}</small>`); concentrate?.applied.push({id: t.id, cond}); pushSheet(t); }
        if (effect) { t.effects = [...new Set([...(t.effects || []), effect])]; concentrate?.applied.push({id: t.id, effect}); }
      }
    }
    addLog({title: label, actor: nameOf(source), lines});
    save(); rerenderSelected();
  }

  /* ---------- magias ---------- */
  function slotPrompt(token, sheet, spell) {
    const options = spell.level === 0 ? [] : C.availableSlots(sheet, characters.getPlay?.(token.sheetId), spell.level);
    return options;
  }
  function castSpell(token, spell, slot) {
    const sheet = sheetOf(token); if (!sheet) return;
    const castLevel = spell.level === 0 ? 0 : slot.level;
    const caster = C.casterFor(sheet, spell), p = C.parseSpell(spell, {castLevel, charLevel: levelOf(token)});
    if (spell.level > 0 && !characters.spendSlot?.(token.sheetId, slot.level, slot.kind)) return toast('Sem espaço de magia desse nível.', true);
    if (p.concentration) { if (token.concentration) { addLog({title: `Concentração encerrada: ${token.concentration.name}`, actor: nameOf(token), lines: ['Nova magia de concentração.']}); breakConcentration(token); } token.concentration = {name: spell.name, applied: []}; }
    const tpl = getTemplate();
    let list = p.area && tpl && tpl.spell?.name === spell.name ? D.tokensInArea(p.area, tpl.origin, tpl.target, tokens().filter((t) => t.id !== token.id && !t.dead)) : targets();
    if (!list.length && ['heal', 'utility'].includes(p.kind)) list = [token];
    const title = `${spell.name}${castLevel > 0 && castLevel !== spell.level ? ` (espaço ${castLevel}º)` : ''}`, lines = [];
    if (p.kind === 'attack' || p.kind === 'beams' || p.kind === 'rays') {
      const n = p.beams || p.rays || 1, t0 = list[0]; if (!t0) { toast('Escolha um alvo (clique direito no token).', true); if (spell.level > 0) characters.refundSlot?.(token.sheetId, slot.level, slot.kind); token.concentration = null; return; }
      for (let i = 0; i < n; i += 1) { const t = list[i % list.length]; const dm = p.damage?.length ? p.damage : [{expr: p.dmg, type: p.type}]; performAttack(token, t, {name: spell.name, toHit: caster.attack, damage: dm, ranged: p.ranged !== false, range: C.parseSpell(spell).range, magical: true, ability: 'cha'}, n > 1 ? `${i + 1}/${n}` : ''); }
    } else if (p.kind === 'missiles') {
      const t0 = list[0]; if (!t0) return toast('Escolha um alvo.', true);
      const per = new Map(); for (let i = 0; i < p.darts; i += 1) { const t = list[i % list.length]; per.set(t, (per.get(t) || 0) + 1); }
      for (const [t, n] of per) { const dmg = D.rollDamage(Array.from({length: n}, () => ({expr: p.dartDamage, type: 'force'})), {}); const res = dealDamage(t, [{type: 'force', total: dmg.total, text: `${n} dardos`}], {}); lines.push(`${n} dardo(s): ${dmg.parts.map((x) => x.total).join(' + ')} = ${dmg.total} energia`, ...res.lines); }
      addLog({title, actor: nameOf(token), lines});
    } else if (p.kind === 'save' && p.save) {
      if (!list.length) { toast('Escolha alvos (clique direito, Shift para vários) ou posicione a área.', true); if (spell.level > 0) characters.refundSlot?.(token.sheetId, slot.level, slot.kind); token.concentration = null; return; }
      const cond = p.fx?.cond || [], effect = p.fx?.effect || null;
      resolveSaveEffect(token, list, {dc: caster.dc, ability: p.save.ability, half: p.save.half, damage: p.damage, cond, effect, label: `${title} · CD ${caster.dc}`, spell: true, concentrate: token.concentration});
      if (tpl) clearTemplate();
    } else if (p.kind === 'heal') {
      for (const t of list) lines.push(healToken(t, D.rollExpr(p.heal.expr + (p.heal.addMod ? sg(caster.mod) : '')).total));
      const r = D.rollExpr(p.heal.expr); lines.unshift(`Cura: ${esc(p.heal.expr)}${p.heal.addMod ? ' ' + sg(caster.mod) : ''}`);
      addLog({title, actor: nameOf(token), lines});
    } else if (p.kind === 'auto') {
      const dmg = D.rollDamage(p.damage, {}); lines.push(`Dano: ${dmg.parts.map((x) => `${esc(x.text)} = ${x.total} ${esc(TYPE_PT[x.type] || x.type)}`).join(' + ')}`);
      for (const t of list) lines.push(...dealDamage(t, dmg.parts, {}).lines); addLog({title, actor: nameOf(token), lines});
    } else {
      const fx = p.fx, who = fx?.self ? [token] : list.length ? list : [token];
      if (fx?.effect) for (const t of who) { t.effects = [...new Set([...(t.effects || []), fx.effect])]; token.concentration?.applied.push({id: t.id, effect: fx.effect}); lines.push(`${esc(nameOf(t))}: ${esc(D.EFFECTS[fx.effect].label)}`); }
      if (fx?.cond) for (const t of who) { t.conditions = [...new Set([...(t.conditions || []), ...fx.cond])]; token.concentration?.applied.push({id: t.id, cond: fx.cond}); lines.push(`${esc(nameOf(t))}: ${fx.cond.map((c) => C.CONDITIONS[c]).join(', ')}`); }
      if (fx?.note) lines.push(esc(fx.note));
      if (!lines.length) lines.push(`<small>${esc(String(spell.description || '').slice(0, 220))}…</small>`);
      addLog({title, actor: nameOf(token), lines});
    }
    if (tpl && p.area) clearTemplate();
    save(); rerenderSelected(); closeMenu();
  }

  /* ---------- itens, habilidades, testes ---------- */
  function useItem(token, item) {
    const sheet = sheetOf(token); const act = C.itemAction(item);
    const left = num(item.amount, 1);
    if (left <= 0) return toast(`${item.name}: acabou.`, true);
    if (act.kind === 'heal') {
      const t = targets()[0] || token, r = D.rollExpr(act.expr); if (act.consume) characters.useItem?.(token.sheetId, item.id);
      addLog({title: `${item.name} → ${nameOf(t)}`, actor: nameOf(token), lines: [`Cura: ${esc(r.text)} = ${r.total}`, healToken(t, r.total)]});
    } else if (act.kind === 'throw') {
      const t = targets()[0]; if (!t) return toast('Escolha um alvo (clique direito no token).', true);
      const k = act.ability || 'dex', pb = num(sheet?.pb, 2);
      if (act.consume) characters.useItem?.(token.sheetId, item.id);
      performAttack(token, t, {name: item.name, toHit: modOf(token, k) + pb, damage: act.damage.map((d) => ({expr: d.expr + (act.weapon && modOf(token, k) ? sg(modOf(token, k)).replace('−', '-') : ''), type: d.type})), ranged: true, range: act.range, longRange: act.longRange, ability: k, magical: false});
    } else {
      if (act.consume) characters.useItem?.(token.sheetId, item.id);
      addLog({title: `${item.name}`, actor: nameOf(token), lines: [esc(act.note || String(item.description || 'Item usado.').slice(0, 240))]});
    }
    rerenderSelected(); closeMenu();
  }
  function useFeature(token, f) {
    const sheet = sheetOf(token), name = String(f.name || '');
    if (/second wind/i.test(name)) { const r = D.rollExpr(`1d10+${C.classLevel(sheet, 'fighter')}`); return addLog({title: 'Retomar o Fôlego', actor: nameOf(token), lines: [`Cura: ${esc(r.text)} = ${r.total}`, healToken(token, r.total)]}), closeMenu(); }
    if (/lay on hands/i.test(name)) {
      const t = targets()[0] || token, left = num(characters.getPlay?.(token.sheetId)?.resources?.[f.id]?.current, 0);
      const v = Math.min(left, Math.max(0, Math.floor(num(prompt(`Impor as Mãos em ${nameOf(t)}: quantos pontos? (restam ${left})`, String(Math.min(left, 5))), 0))));
      if (!v) return; characters.useResource?.(token.sheetId, f.id, v); return addLog({title: 'Impor as Mãos', actor: nameOf(token), lines: [`Gasta ${v} ponto(s).`, healToken(t, v)]}), closeMenu();
    }
    if (/^rage$|fúria/i.test(name)) { token.effects = token.effects.includes('rage') ? token.effects.filter((e) => e !== 'rage') : [...token.effects, 'rage']; save(); addLog({title: 'Fúria', actor: nameOf(token), lines: [token.effects.includes('rage') ? `Ativa: +${D.rageBonus(C.classLevel(sheet, 'barbarian'))} no dano corpo a corpo, resistência a contundente/perfurante/cortante.` : 'Encerrada.']}); return closeMenu(); }
    if (f.id && characters.getPlay?.(token.sheetId)?.resources?.[f.id]) { const ok = characters.useResource?.(token.sheetId, f.id, 1); if (!ok) return toast(`${name}: sem usos restantes.`, true); }
    addLog({title: name, actor: nameOf(token), lines: [esc(String(f.description || 'Habilidade usada.').slice(0, 320))]});
    rerenderSelected(); closeMenu();
  }
  function rollCheck(token, label, mod, key = null, isSave = false) {
    const adv = [], dis = [], tc = new Set(token.conditions || []);
    if (st.mode === 'adv') adv.push('manual'); if (st.mode === 'dis') dis.push('manual');
    if (tc.has('poisoned') && !isSave) dis.push('envenenado');
    const r = D.rollD20({mode: D.netMode(adv, dis)}); const extra = [];
    let total = r.used + mod;
    if (isSave) for (const e of token.effects || []) { const d = D.EFFECTS[e]?.saveDice; if (d) { const x = D.rollExpr(d); total += x.total; extra.push(`${x.total >= 0 ? '+' : '−'}${Math.abs(x.total)} (${esc(D.EFFECTS[e].label)})`); } }
    banner(`${label}: ${r.used} ${sg(mod)} = ${total}`, r.nat20 ? 'good' : r.nat1 ? 'bad' : '');
    addLog({title: label, actor: nameOf(token), lines: [`d20 ${r.rolls.map((x) => dieChip(x, x)).join(' ')} ${sg(mod)}${extra.length ? ' ' + extra.join(' ') : ''} = <b>${total}</b>`], tone: r.nat20 ? 'good' : r.nat1 ? 'miss' : ''});
  }
  function doDeathSave(token) {
    const r = D.deathSave(token.deathSaves ||= {success: 0, fail: 0});
    let msg = `d20 ${dieChip(r.d, r.d)} → `;
    if (r.revived) { token.hp = 1; token.deathSaves = null; token.conditions = token.conditions.filter((c) => c !== 'unconscious'); msg += '<b class="good">volta com 1 PV</b>'; }
    else if (r.dead) { token.dead = true; msg += '<b class="bad">morreu</b>'; } else if (r.stable) msg += '<b class="good">estável</b>'; else msg += `sucessos ${token.deathSaves.success}/3 · falhas ${token.deathSaves.fail}/3`;
    pushSheet(token); save(); addLog({title: 'Salvaguarda contra a morte', actor: nameOf(token), lines: [msg], tone: r.dead ? 'miss' : ''}); rerenderSelected();
  }

  /* ---------- fluxo de ataque em sequência (multiataque / Ataque Extra) ---------- */
  function startSequence(token, queue) { st.session = {tokenId: token.id, queue, done: 0, total: queue.length}; runNext(); }
  function runNext() {
    const s = st.session; if (!s) return; const token = byId(s.tokenId); const t = targets()[0];
    if (!t) { st.pending = {kind: 'sequence'}; hint('Clique direito no alvo (ou clique nele) para o ataque.'); renderBar(getSelected()); return; }
    const atk = s.queue[s.done]; performAttack(token, t, atk, s.total > 1 ? `${s.done + 1}/${s.total}` : ''); s.done += 1;
    if (s.done >= s.total) { st.session = null; token.used.action = true; if (token.kind === 'character') st.opts = {...st.opts, sneak: false}; save(); } renderBar(getSelected());
  }
  function runAll() { const s = st.session; if (!s) return; if (!targets()[0]) return toast('Escolha um alvo primeiro (clique direito no token).', true); while (st.session) runNext(); }
  function hint(text) { const h = wrap.querySelector('#bbHint'); if (h) { h.textContent = text; h.hidden = !text; } }

  /* ---------- alvo ---------- */
  function setTarget(token, add = false) {
    if (!token) { st.targets = []; renderBar(getSelected()); redraw(); return; }
    if (add) st.targets = st.targets.includes(token.id) ? st.targets.filter((i) => i !== token.id) : [...st.targets, token.id]; else st.targets = [token.id];
    const pend = st.pending; st.pending = null; hint('');
    renderBar(getSelected()); redraw();
    if (pend?.kind === 'sequence' && st.session) runNext();
    if (pend?.kind === 'spell') { const s = byId(pend.tokenId); if (s) castSpell(s, pend.spell, pend.slot); }
  }
  const isTargeting = () => !!st.pending;
  function pickTarget(token) { if (token && st.pending) setTarget(token); }
  function cancel() { st.pending = null; st.session = null; hint(''); closeMenu(); renderBar(getSelected()); }

  /* ---------- barra e menus ---------- */
  function closeMenu() { st.menu = null; const m = wrap.querySelector('#bbMenu'); if (m) m.hidden = true; }
  function mountBar() {
    if (wrap.querySelector('#bbActionBar')) return;
    wrap.insertAdjacentHTML('beforeend', '<div id="bbHint" hidden></div><div id="bbMenu" hidden></div><div id="bbActionBar" hidden></div>');
    wrap.querySelector('#bbActionBar').addEventListener('click', (e) => { const b = e.target.closest('[data-bar]'); if (b) barClick(b.dataset.bar, b); });
    wrap.querySelector('#bbMenu').addEventListener('click', (e) => menuClick(e));
  }
  function barClick(kind, el) {
    const token = getSelected(); if (!token) return;
    if (kind === 'clear') { st.targets = []; cancel(); redraw(); return; }
    if (kind === 'mode') { st.mode = st.mode === 'normal' ? 'adv' : st.mode === 'adv' ? 'dis' : 'normal'; renderBar(token); return; }
    if (kind === 'next') return runNext(); if (kind === 'all') return runAll(); if (kind === 'cancel') return cancel();
    st.menu = st.menu === kind ? null : kind; renderMenu(token);
  }
  function renderBar(token) {
    mountBar(); const bar = wrap.querySelector('#bbActionBar'); if (!bar) return;
    if (!token || token.dead && token.kind === 'monster') { bar.hidden = true; closeMenu(); return; }
    initToken(token); bar.hidden = false;
    const t = targets(), isChar = token.kind === 'character', tkn = t[0];
    const items = [['atk', '⚔ Atacar'], isChar ? ['spell', '✦ Magias'] : null, isChar ? ['item', '🎒 Itens'] : null, ['feat', '★ Habilidades'], ['std', '⚑ Ações'], ['test', '🎲 Testes'], ['fx', '☄ Efeitos']].filter(Boolean);
    const s = st.session;
    bar.innerHTML = `<div class="bbBarRow">
      <span class="bbTargetChip ${tkn ? '' : 'none'}">${tkn ? `🎯 ${esc(nameOf(tkn))}${t.length > 1 ? ` +${t.length - 1}` : ''} · ${distanceFt(token, tkn)} pés · CA ${D.effectiveAc(tkn)}` : '🎯 sem alvo · clique direito num token'}${tkn ? '<button data-bar="clear" title="Limpar alvo">×</button>' : ''}</span>
      <button class="bbMode ${st.mode}" data-bar="mode" title="Vantagem/desvantagem manual">${st.mode === 'adv' ? 'Vantagem' : st.mode === 'dis' ? 'Desvantagem' : 'Normal'}</button>
      ${s ? `<span class="bbSeq">Ataque ${s.done + 1}/${s.total}: ${esc(s.queue[s.done]?.name || '')} <button data-bar="next">Rolar</button><button data-bar="all">Todos</button><button data-bar="cancel">×</button></span>` : ''}
    </div><div class="bbBarRow">${items.map(([k, l]) => `<button data-bar="${k}" class="${st.menu === k ? 'on' : ''}">${l}</button>`).join('')}
      ${isChar && token.hp === 0 && !token.dead ? '<button data-bar="death" class="danger">☠ Contra a morte</button>' : ''}</div>`;
    bar.querySelector('[data-bar="death"]')?.addEventListener('click', () => doDeathSave(token));
    if (st.menu) renderMenu(token);
  }
  const row = (id, title, sub, extra = '') => `<button class="bbMenuRow" data-act="${esc(id)}"><span><b>${esc(title)}</b>${sub ? `<small>${sub}</small>` : ''}</span>${extra}</button>`;
  function renderMenu(token) {
    const menu = wrap.querySelector('#bbMenu'); if (!menu) return; const kind = st.menu; if (!kind) { menu.hidden = true; return; }
    const sheet = sheetOf(token), mon = monsterOf(token); let html = '';
    if (kind === 'atk') {
      if (sheet) {
        const per = C.attacksPerAction(sheet), atks = C.characterAttacks(sheet), sneak = C.sneakAttackDice(sheet);
        html += `<div class="bbMenuOpts">${atks.some((a) => a.versatile) ? `<label><input type="checkbox" data-opt="twoHands" ${st.opts.twoHands ? 'checked' : ''}> Duas mãos</label>` : ''}${sneak ? `<label><input type="checkbox" data-opt="sneak" ${st.opts.sneak ? 'checked' : ''}> Furtivo ${sneak}d6</label>` : ''}<label><input type="checkbox" data-opt="power" ${st.opts.power ? 'checked' : ''}> −5/+10</label></div>`;
        html += `<div class="bbMenuNote">Ação de Atacar: <b>${per} ataque${per > 1 ? 's' : ''}</b> ${per > 1 ? '(Ataque Extra não acumula entre classes)' : ''}</div>`;
        html += atks.map((a) => row(a.id, a.name, `${sg(a.toHit)} · ${esc(a.damage[0].expr)} ${esc(TYPE_PT[a.damage[0].type] || a.damage[0].type)}${a.versatile ? ` · versátil ${esc(a.versatile)}` : ''}${a.ranged ? ` · dist. ${a.range ?? '—'}/${a.longRange ?? '—'}` : ''}`, per > 1 && a.id !== 'atk:unarmed' ? `<i>×${per}</i>` : '')).join('');
      } else if (mon) {
        const g = C.monsterActions(mon);
        for (const a of g.action) {
          if (a.kind === 'multiattack') html += row(`mon:${g.action.indexOf(a)}`, 'Multiataque', esc(a.sequence.map((s) => `${s.count}× ${s.name}`).join(' + ') || a.description.slice(0, 90)), `<i>${a.sequence.reduce((n, s) => n + s.count, 0) || ''}</i>`);
          else if (a.kind === 'attack') html += row(`mon:${g.action.indexOf(a)}`, a.name, `${sg(a.toHit)} · ${a.damage.map((d) => `${esc(d.expr)} ${esc(TYPE_PT[d.type] || d.type)}`).join(' + ') || '—'} · ${a.ranged ? `dist. ${a.range}/${a.longRange}` : `alcance ${a.reach}`}`);
          else if (a.kind === 'save') { const ready = a.recharge ? token.recharge?.[a.name] !== false : true; html += row(`mon:${g.action.indexOf(a)}`, a.name, `CD ${a.save.dc} ${C.ABILITY_PT[a.save.ability]} · ${a.damage.map((d) => `${esc(d.expr)} ${esc(TYPE_PT[d.type] || d.type)}`).join(' + ') || 'efeito'}${a.area ? ` · ${a.area.sizeFt} pés` : ''}${a.recharge ? ready ? ' · pronta' : ' · <b class="bad">recarregando</b>' : ''}`); }
          else html += row(`mon:${g.action.indexOf(a)}`, a.name, esc(a.description.slice(0, 90)));
        }
      }
    } else if (kind === 'spell' && sheet) {
      const byLevel = {}; for (const sp of sheet.spells || []) (byLevel[sp.level] ||= []).push(sp);
      const play = characters.getPlay?.(token.sheetId);
      html += `<div class="bbMenuNote">${(sheet.spellSlots || []).map((n, i) => n ? `${i + 1}º: ${n - num(play?.slotsUsed?.[i])}/${n}` : '').filter(Boolean).join(' · ')}${sheet.pactMagic ? ` · Pacto ${sheet.pactMagic.slotLevel}º: ${num(sheet.pactMagic.count) - num(play?.pactUsed)}/${sheet.pactMagic.count}` : ''}${token.concentration ? ` · <b>Concentrando: ${esc(token.concentration.name)}</b> <button data-act="dropconc">encerrar</button>` : ''}</div>`;
      for (const lv of Object.keys(byLevel).sort((a, b) => a - b)) { html += `<div class="bbMenuHead">${lv === '0' ? 'Truques' : `${lv}º nível`}</div>`; html += byLevel[lv].map((sp) => { const p = C.parseSpell(sp, {charLevel: sheet.level}); return row(`sp:${sp.id}`, sp.name, `${esc(p.kind === 'save' ? `CD ${C.casterFor(sheet, sp).dc} ${C.ABILITY_PT[p.save.ability]}` : p.kind === 'attack' ? `ataque ${sg(C.casterFor(sheet, sp).attack)}` : p.kind === 'heal' ? 'cura' : p.kind === 'missiles' ? `${p.darts} dardos` : p.kind === 'utility' ? 'utilidade' : p.kind)} ${p.damage[0] ? '· ' + esc(p.damage[0].expr) + ' ' + esc(TYPE_PT[p.damage[0].type] || '') : ''}${sp.concentration ? ' · conc.' : ''}`); }).join(''); }
    } else if (kind === 'item' && sheet) {
      const play = characters.getPlay?.(token.sheetId);
      html += (sheet.equipment || []).map((it) => { const left = num(it.amount, 1); const a = C.itemAction(it); return row(`it:${it.id}`, it.name, `${left}× · ${a.kind === 'heal' ? 'cura ' + esc(a.expr) : a.kind === 'throw' ? 'arremesso ' + esc(a.damage[0].expr) : 'uso livre'}`, `<i>${esc(a.label)}</i>`); }).join('') || '<p class="charMuted">Sem itens.</p>';
    } else if (kind === 'feat') {
      if (sheet) { const play = characters.getPlay?.(token.sheetId); const rs = sheet.specialAbilities || []; html += rs.map((f) => row(`ft:${f.id}`, f.name, `${num(play?.resources?.[f.id]?.current, f.usesLeft)}/${f.maxUses} ${f.kind === 'pool' ? 'pontos' : 'usos'}`)).join(''); const names = new Set(rs.map((f) => f.name)); html += `<div class="bbMenuHead">Características</div>` + (sheet.features || []).filter((f) => !names.has(f.name)).slice(0, 40).map((f, i) => row(`fe:${i}`, f.name, esc(String(f.description || '').slice(0, 80)))).join(''); }
      else if (mon) { const g = C.monsterActions(mon); const all = [...g.bonus.map((a) => ['bonus', a]), ...g.reaction.map((a) => ['reaction', a]), ...g.legendary.map((a) => ['legendary', a])]; html += (token.legendary != null && g.legendary.length ? `<div class="bbMenuNote">Ações lendárias restantes: <b>${token.legendary}</b>/3</div>` : '') + all.map(([s, a], i) => row(`mf:${s}:${i}`, a.name, `${({bonus: 'bônus', reaction: 'reação', legendary: 'lendária'})[s]}${a.cost > 1 ? ` · custa ${a.cost}` : ''} · ${esc(a.description.slice(0, 70))}`)).join('') + ((mon.traits || []).map((t, i) => row(`mt:${i}`, t.name, `traço · ${esc(t.description.slice(0, 70))}`)).join('')); }
    } else if (kind === 'std') {
      html += [['dodge', 'Esquivar', 'Ataques contra você têm desvantagem até o próximo turno.'], ['dash', 'Disparada', 'Dobra o deslocamento neste turno.'], ['disengage', 'Desengajar', 'Seu movimento não provoca ataques oportunos.'], ['help', 'Ajudar', 'Dá vantagem ao próximo teste/ataque do aliado.'], ['hide', 'Esconder', 'Teste de Furtividade.'], ['ready', 'Preparar', 'Define um gatilho e usa a reação.'], ['reaction', 'Usar reação', 'Gasta a reação do turno.']].map(([id, t, s]) => row(`sd:${id}`, t, s)).join('');
    } else if (kind === 'test') {
      html += `<div class="bbMenuHead">Atributos e salvaguardas</div>` + SKILL_OPT.map(([k, n]) => `<div class="bbMenuPair"><button data-act="ck:${k}">${n} ${sg(modOf(token, k))}</button><button data-act="sv:${k}">Salv. ${sg(saveModOf(token, k))}</button></div>`).join('');
      if (sheet) html += `<div class="bbMenuHead">Perícias</div><div class="bbMenuSkills">${(sheet.skills || []).map((s, i) => `<button data-act="sk:${i}">${esc(s.name || s.key)} ${sg(s.total)}</button>`).join('')}</div>`;
      html += `<div class="bbMenuHead">Outros</div><div class="bbMenuPair"><button data-act="ini">Iniciativa</button><button data-act="rt:wis">Percepção</button></div>`;
    } else if (kind === 'fx') {
      html += `<div class="bbMenuHead">Condições</div><div class="bbChips">${Object.entries(C.CONDITIONS).map(([k, n]) => `<button data-act="cd:${k}" class="${token.conditions.includes(k) ? 'on' : ''}">${C.CONDITION_ICON[k]} ${n}</button>`).join('')}</div><div class="bbMenuHead">Efeitos</div><div class="bbChips">${Object.entries(D.EFFECTS).map(([k, e]) => `<button data-act="ef:${k}" class="${token.effects.includes(k) ? 'on' : ''}">${esc(e.label)}</button>`).join('')}</div>${token.concentration ? `<div class="bbMenuNote">Concentrando: <b>${esc(token.concentration.name)}</b> <button data-act="dropconc">encerrar</button></div>` : ''}`;
    }
    menu.innerHTML = html || '<p class="charMuted">Nada disponível.</p>'; menu.hidden = false;
  }
  function menuClick(e) {
    const token = getSelected(); if (!token) return;
    const opt = e.target.closest('[data-opt]'); if (opt) { st.opts[opt.dataset.opt] = opt.checked; return; }
    const b = e.target.closest('[data-act]'); if (!b) return; const id = b.dataset.act; const sheet = sheetOf(token), mon = monsterOf(token);
    if (id === 'dropconc') { addLog({title: `Concentração encerrada: ${token.concentration?.name}`, actor: nameOf(token), lines: []}); breakConcentration(token); return renderMenu(token); }
    if (id.startsWith('atk:') && sheet) { const per = C.attacksPerAction(sheet), a = C.characterAttacks(sheet).find((x) => x.id === id); return startSequence(token, Array.from({length: id === 'atk:unarmed' ? 1 : per}, () => a)), closeMenu(); }
    if (id.startsWith('mon:') && mon) {
      const g = C.monsterActions(mon), a = g.action[Number(id.slice(4))]; if (!a) return;
      const attacks = g.action.filter((x) => x.kind === 'attack');
      if (a.kind === 'multiattack') { const q = []; for (const s of a.sequence) { const atk = attacks.find((x) => x.name === s.name); if (atk) for (let i = 0; i < s.count; i += 1) q.push(atk); } if (!q.length) return toast('Não consegui interpretar o Multiataque: use os ataques individuais.', true); return startSequence(token, q), closeMenu(); }
      if (a.kind === 'attack') return startSequence(token, [a]), closeMenu();
      if (a.kind === 'save') {
        if (a.recharge && token.recharge?.[a.name] === false) return toast(`${a.name} ainda está recarregando.`, true);
        let tpl = getTemplate(); if (a.area && !tpl && !targets().length) { armArea?.({name: a.name, description: a.description, range: ''}); toast(`${a.name}: posicione a área no mapa e use a ação de novo.`); return closeMenu(); }
        const list = a.area && tpl ? D.tokensInArea(a.area, tpl.origin, tpl.target, tokens().filter((t) => t.id !== token.id && !t.dead)) : targets();
        if (!list.length) return toast(a.area ? 'Posicione a área (modo Área) ou escolha alvos com o botão direito.' : 'Escolha um alvo (clique direito).', true);
        resolveSaveEffect(token, list, {dc: a.save.dc, ability: a.save.ability, half: a.save.half, damage: a.damage, label: `${a.name} · CD ${a.save.dc}`, magical: false}); if (a.recharge) token.recharge[a.name] = false; token.used.action = true; if (tpl) clearTemplate(); return closeMenu();
      }
      addLog({title: a.name, actor: nameOf(token), lines: [esc(a.description)]}); return closeMenu();
    }
    if (id.startsWith('mf:') && mon) { const [, s, i] = id.split(':'); const g = C.monsterActions(mon), a = ({bonus: g.bonus, reaction: g.reaction, legendary: g.legendary})[s][Number(i)]; if (s === 'legendary') { if (token.legendary < a.cost) return toast('Sem ações lendárias suficientes.', true); token.legendary -= a.cost; } if (s === 'reaction') token.used.reaction = true; if (s === 'bonus') token.used.bonus = true;
      if (a.kind === 'attack') { startSequence(token, [a]); return closeMenu(); } addLog({title: `${a.name}`, actor: nameOf(token), lines: [esc(a.description)]}); save(); return closeMenu(); }
    if (id.startsWith('mt:') && mon) { const t = mon.traits[Number(id.slice(3))]; return addLog({title: t.name, actor: nameOf(token), lines: [esc(t.description)]}), closeMenu(); }
    if (id.startsWith('sp:') && sheet) {
      const spell = sheet.spells.find((x) => String(x.id) === id.slice(3)); if (!spell) return;
      const slots = slotPrompt(token, sheet, spell), p = C.parseSpell(spell, {charLevel: sheet.level});
      if (spell.level > 0 && !slots.length) return toast(`Sem espaços de magia de ${spell.level}º nível ou maior.`, true);
      let slot = {level: 0, kind: 'cantrip'};
      if (spell.level > 0) { const label = slots.map((s) => `${s.level}º${s.kind === 'pact' ? ' (pacto)' : ''} ×${s.left}`).join(', '); const pick = slots.length === 1 ? slots[0].level : num(prompt(`${spell.name}: qual espaço usar? ${label}`, String(slots[0].level)), slots[0].level); slot = slots.find((s) => s.level === pick) || slots[0]; }
      if (p.area && getTemplate()?.spell?.name !== spell.name && ['save', 'auto'].includes(p.kind)) { armArea?.(spell); toast(`${spell.name}: posicione a área no mapa e use a magia de novo.`); closeMenu(); return; }
      const needsTarget = ['attack', 'beams', 'rays', 'missiles', 'save'].includes(p.kind) && !(p.area && getTemplate()?.spell?.name === spell.name);
      if (needsTarget && !targets().length) { st.pending = {kind: 'spell', tokenId: token.id, spell, slot}; hint(`Clique no alvo de ${spell.name}.`); closeMenu(); return renderBar(token); }
      return castSpell(token, spell, slot);
    }
    if (id.startsWith('it:') && sheet) return useItem(token, sheet.equipment.find((x) => String(x.id) === id.slice(3)));
    if (id.startsWith('ft:') && sheet) return useFeature(token, sheet.specialAbilities.find((x) => String(x.id) === id.slice(3)));
    if (id.startsWith('fe:') && sheet) { const names = new Set((sheet.specialAbilities || []).map((f) => f.name)); const f = (sheet.features || []).filter((x) => !names.has(x.name))[Number(id.slice(3))]; return useFeature(token, f); }
    if (id.startsWith('sd:')) { const k = id.slice(3); if (k === 'dodge') token.conditions = [...new Set([...token.conditions, 'dodging'])]; if (k === 'help') token.effects = [...new Set([...token.effects, 'help'])]; if (k === 'reaction') token.used.reaction = true; else token.used.action = true; addLog({title: b.querySelector('b').textContent, actor: nameOf(token), lines: [esc(b.querySelector('small').textContent)]}); save(); rerenderSelected(); return closeMenu(); }
    if (id.startsWith('ck:')) return rollCheck(token, `Teste de ${SKILL_OPT.find((x) => x[0] === id.slice(3))[1]}`, modOf(token, id.slice(3)));
    if (id.startsWith('sv:')) return rollCheck(token, `Salvaguarda de ${SKILL_OPT.find((x) => x[0] === id.slice(3))[1]}`, saveModOf(token, id.slice(3)), null, true);
    if (id.startsWith('sk:') && sheet) { const s = sheet.skills[Number(id.slice(3))]; return rollCheck(token, s.name || s.key, s.total); }
    if (id === 'rt:wis') return rollCheck(token, 'Percepção', sheet ? num(sheet.skills?.find((s) => s.key === 'perception')?.total) : modOf(token, 'wis'));
    if (id === 'ini') return rollCheck(token, 'Iniciativa', num(token.initiativeBonus));
    if (id.startsWith('cd:')) { const k = id.slice(3); token.conditions = token.conditions.includes(k) ? token.conditions.filter((c) => c !== k) : [...token.conditions, k]; pushSheet(token); save(); redraw(); return renderMenu(token); }
    if (id.startsWith('ef:')) { const k = id.slice(3); token.effects = token.effects.includes(k) ? token.effects.filter((c) => c !== k) : [...token.effects, k]; save(); redraw(); rerenderSelected(); return renderMenu(token); }
  }
  logBox?.addEventListener('click', (e) => { const b = e.target.closest('[data-smite]'); if (b) { const [id, lv] = b.dataset.smite.split(':').map(Number); smiteNow(id, lv); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && (st.pending || st.menu)) cancel(); });

  /* ---------- bandeja de dados ---------- */
  function mountDice(container) {
    container.innerHTML = `<div class="bbDiceTray"><button class="bbDiceToggle" data-dice="toggle" title="Rolar dados">🎲 Dados</button><div class="bbDiceBody" hidden>
      <div class="bbDiceRow">${[4, 6, 8, 10, 12, 20, 100].map((n) => `<button data-die="${n}">d${n}</button>`).join('')}</div>
      <div class="bbDiceRow"><input data-dice="expr" value="1d20" aria-label="Expressão de dados" placeholder="2d6+3"><button data-dice="roll">Rolar</button></div>
      <div class="bbDiceRow"><button data-dm="adv">Vantagem</button><button data-dm="normal" class="on">Normal</button><button data-dm="dis">Desvantagem</button></div></div></div>`;
    const body = container.querySelector('.bbDiceBody'), input = container.querySelector('[data-dice="expr"]'); let mode = 'normal';
    const roll = (expr) => {
      try {
        const e = String(expr).replace(/\s+/g, '').toLowerCase();
        if (/^(1)?d20([+-]\d+)?$/.test(e) && mode !== 'normal') { const mod = Number((e.match(/[+-]\d+$/) || ['0'])[0]); const r = D.rollD20({mode}); const total = r.used + mod; banner(`d20 ${mode === 'adv' ? 'vantagem' : 'desvantagem'}: ${r.rolls.join(' / ')} → ${r.used}${mod ? ` ${sg(mod)} = ${total}` : ''}`, r.nat20 ? 'good' : r.nat1 ? 'bad' : ''); return addLog({title: `d20 ${mode === 'adv' ? 'com vantagem' : 'com desvantagem'}`, actor: 'Mesa', lines: [`${r.rolls.map((x) => dieChip(x, x)).join(' ')} → ${dieChip(r.used, r.used)}${mod ? ` ${sg(mod)} = <b>${total}</b>` : ''}`]}); }
        const r = D.rollExpr(e); const d20 = r.parts.length === 1 && r.parts[0].sides === 20 && r.parts[0].rolls.length === 1 ? r.parts[0].rolls[0] : 0;
        banner(`${e}: ${r.total}`, d20 === 20 ? 'good' : d20 === 1 ? 'bad' : ''); addLog({title: e, actor: 'Mesa', lines: [`${esc(r.text)} = <b>${r.total}</b>`]});
      } catch (err) { toast(err.message, true); }
    };
    container.addEventListener('click', (ev) => {
      const t = ev.target.closest('button'); if (!t) return;
      if (t.dataset.dice === 'toggle') { body.hidden = !body.hidden; return; }
      if (t.dataset.die) return roll(`1d${t.dataset.die}`);
      if (t.dataset.dice === 'roll') return roll(input.value);
      if (t.dataset.dm) { mode = t.dataset.dm; container.querySelectorAll('[data-dm]').forEach((b) => b.classList.toggle('on', b === t)); }
    });
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') roll(input.value); });
  }

  /* ---------- desenho sobre o tabuleiro ---------- */
  function drawOverlay(ctx, {cell}) {
    const sel = getSelected(), now = performance.now();
    for (const t of tokens()) {
      const x = t.x * cell, y = t.y * cell, w = t.size * cell;
      if (t.defeated || t.dead) { ctx.save(); ctx.strokeStyle = '#ff8f86'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + w - 6, y + w - 6); ctx.moveTo(x + w - 6, y + 6); ctx.lineTo(x + 6, y + w - 6); ctx.stroke(); ctx.restore(); }
      if (t.concentration) { ctx.save(); ctx.strokeStyle = '#79b8ff'; ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w / 2, y + w / 2, w * 0.52, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      const badges = [...(t.conditions || []).map((c) => C.CONDITION_ICON[c]), ...(t.effects || []).map((e) => '◆')].filter(Boolean).slice(0, 4);
      badges.forEach((b, i) => { const bx = x + w - 8 - i * 13, by = y + 8; ctx.save(); ctx.fillStyle = '#0b1a1fdd'; ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#f1dda9'; ctx.font = '600 9px "DM Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b, bx, by + .5); ctx.restore(); });
      if (t.deathSaves && t.hp === 0 && !t.dead) { ctx.save(); ctx.fillStyle = '#f1dda9'; ctx.font = '600 9px "DM Sans",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`✓${t.deathSaves.success} ✗${t.deathSaves.fail}`, x + w / 2, y + w + 11); ctx.restore(); }
    }
    for (const id of st.targets) { const t = byId(id); if (!t) continue; ctx.save(); ctx.strokeStyle = '#ff8f86'; ctx.lineWidth = 2.5; ctx.setLineDash([]); const x = t.x * cell, y = t.y * cell, w = t.size * cell; ctx.beginPath(); ctx.arc(x + w / 2, y + w / 2, w * 0.55, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w / 2 - 6, y - 4); ctx.lineTo(x + w / 2 + 6, y - 4); ctx.lineTo(x + w / 2, y + 5); ctx.closePath(); ctx.fillStyle = '#ff8f86'; ctx.fill(); ctx.restore();
      if (sel && sel.id !== id) { ctx.save(); ctx.strokeStyle = '#ff8f8688'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo((sel.x + sel.size / 2) * cell, (sel.y + sel.size / 2) * cell); ctx.lineTo((t.x + t.size / 2) * cell, (t.y + t.size / 2) * cell); ctx.stroke(); ctx.fillStyle = '#f1dda9'; ctx.font = '600 10px "DM Sans",sans-serif'; ctx.fillText(`${distanceFt(sel, t)} pés`, ((sel.x + t.x) / 2 + 0.8) * cell, ((sel.y + t.y) / 2 + 0.4) * cell); ctx.restore(); } }
    st.floaters = st.floaters.filter((f) => now - f.t < 1700);
    for (const f of st.floaters) { const t = byId(f.id); if (!t) continue; const k = (now - f.t) / 1700; ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.fillStyle = f.color; ctx.strokeStyle = '#0b1a1f'; ctx.lineWidth = 3; ctx.font = '700 15px "DM Sans",sans-serif'; ctx.textAlign = 'center'; const px = (t.x + t.size / 2) * cell, py = t.y * cell - 6 - k * 26; ctx.strokeText(f.text, px, py); ctx.fillText(f.text, px, py); ctx.restore(); }
    if (st.floaters.length) requestAnimationFrame(() => redraw());
  }

  renderLog();
  return {initToken, onTurnStart, render: renderBar, isTargeting, pickTarget, setTarget, drawOverlay, mountDice, cancel, cleanup: () => { cancel(); st.targets = []; }, getTargets: targets};
}
