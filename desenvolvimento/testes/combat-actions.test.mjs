import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = path.join(root, 'app', 'dist');
const load = (f) => import(pathToFileURL(path.join(dist, f)).href);
const D = await load('dice-core.js');
const C = await load('combat-core.js');
const S = await load('sheet-core.js');
const monsters = JSON.parse(fs.readFileSync(path.join(dist, '5e', 'monsters.json'), 'utf8'));
const seeded = () => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

test('rolagens: expressão, crítico dobra dados e taxa de acerto bate com a teoria', () => {
  const rng = seeded();
  const crit = D.rollExpr('2d6+3', {rng, crit: true});
  assert.equal(crit.parts[0].rolls.length, 4);
  assert.equal(crit.parts[1].flat, 3);
  const hits = Array.from({length: 6000}, () => D.rollAttack({toHit: 5, ac: 15, rng})).filter((h) => h.hit).length / 6000;
  assert.ok(Math.abs(hits - 0.55) < 0.03, `acerto ${hits}`);
  const adv = Array.from({length: 6000}, () => D.rollAttack({toHit: 5, ac: 15, rng, mode: 'adv'})).filter((h) => h.hit).length / 6000;
  assert.ok(Math.abs(adv - 0.7975) < 0.03, `vantagem ${adv}`);
  assert.throws(() => D.parseExpr('abc'));
});

test('condições dão vantagem/desvantagem e crítico automático', () => {
  const caido = D.attackModeFor({attacker: {kind: 'character', conditions: []}, target: {kind: 'monster', conditions: ['prone']}, dist: 5, melee: true});
  assert.equal(caido.mode, 'adv');
  const longe = D.attackModeFor({attacker: {kind: 'character', conditions: []}, target: {kind: 'monster', conditions: ['prone']}, dist: 30, ranged: true, melee: false});
  assert.equal(longe.mode, 'dis');
  const cancela = D.attackModeFor({attacker: {conditions: ['poisoned']}, target: {conditions: ['prone']}, dist: 5, melee: true});
  assert.equal(cancela.mode, 'normal');
  assert.equal(D.attackModeFor({attacker: {conditions: []}, target: {conditions: ['paralyzed']}, dist: 5, melee: true}).autoCrit, true);
});

test('dano: resistência a não mágico, vulnerabilidade e PV temporário', () => {
  const r = D.adjustDamage([{total: 10, type: 'slashing'}, {total: 7, type: 'fire'}], {resist: D.parseDamageTypes('bludgeoning, piercing, and slashing from nonmagical attacks'), immune: D.parseDamageTypes('fire'), magical: false});
  assert.equal(r.total, 5);
  const t = {hp: 10, maxHp: 10, tempHp: 4, kind: 'monster'};
  const res = D.applyDamage(t, 9);
  assert.deepEqual([t.tempHp, t.hp, res.absorbed], [0, 5, 4]);
});

test('monstros: ataques, salvaguarda com recarga e Multiataque do compêndio', () => {
  let attacks = 0, saves = 0, multis = 0, parsed = 0;
  for (const m of monsters) for (const a of Object.values(C.monsterActions(m)).flat()) {
    if (a.kind === 'attack') attacks += 1;
    if (a.kind === 'save') saves += 1;
    if (a.kind === 'multiattack') { multis += 1; if (a.sequence.length) parsed += 1; }
  }
  assert.ok(attacks > 1500 && saves > 300 && multis > 400);
  assert.ok(parsed / multis > 0.85, `multiataques interpretados ${parsed}/${multis}`);
  const dragon = C.monsterActions(monsters.find((m) => m.name === 'Adult Red Dragon'));
  const breath = dragon.action.find((a) => /breath/i.test(a.name));
  assert.equal(breath.kind, 'save'); assert.equal(breath.save.dc, 21); assert.equal(breath.recharge, 5); assert.equal(breath.damage[0].expr, '18d6');
  assert.deepEqual(dragon.action.find((a) => a.kind === 'multiattack').sequence.map((s) => `${s.count}×${s.name}`).sort(), ['1×Bite', '2×Claw']);
  const owl = C.monsterActions(monsters.find((m) => m.name === 'Owlbear')).action.find((a) => a.kind === 'multiattack');
  assert.equal(owl.sequence.reduce((n, s) => n + s.count, 0), 2);
});

test('personagens reais: Ataque Extra por nível e não acumula entre classes', () => {
  const dir = path.join(root, 'character');
  const sheets = fs.readdirSync(dir).filter((f) => f.endsWith('.cah')).map((f) => S.normalizeCah(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))));
  for (const s of sheets) {
    const n = C.attacksPerAction(s);
    if (/longinus/i.test(s.name)) assert.equal(n, 3);
    if (/tytos/i.test(s.name)) assert.equal(n, 2);
    assert.ok(C.characterAttacks(s).length >= 2);
  }
  assert.equal(C.attacksPerAction({classes: [{id: 'fighter', level: 5}, {id: 'paladin', level: 5}], features: []}), 2);
  assert.equal(C.attacksPerAction({classes: [{id: 'fighter', level: 11}, {id: 'ranger', level: 5}], features: []}), 3);
  assert.equal(C.attacksPerAction({classes: [{id: 'fighter', level: 4}, {id: 'rogue', level: 4}], features: []}), 1);
});

test('magias: truque escala por nível, espaço superior soma dados e alvo de CD por classe', () => {
  const bolt = {name: 'Fire Bolt', level: 0, description: "Make a ranged spell attack. On a hit, the target takes 1d10 fire damage. This spell's damage increases by 1d10 when you reach 5th level."};
  assert.equal(C.parseSpell(bolt, {charLevel: 11}).damage[0].expr, '3d10');
  const fb = {name: 'Fireball', level: 3, description: 'Each creature in a 20-foot-radius sphere must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one.', higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.'};
  const p = C.parseSpell(fb, {castLevel: 5});
  assert.equal(p.damage[0].expr, '8d6+2d6'); assert.equal(p.save.half, true); assert.deepEqual(p.area, {shape: 'circle', sizeFt: 20});
  const model = {casterClasses: [{id: 'wizard', name: 'Mago', dc: 15, attack: 7, mod: 4}, {id: 'cleric', name: 'Clérigo', dc: 13, attack: 5, mod: 2}]};
  assert.equal(C.casterFor(model, {classes: 'Cleric, Paladin'}).dc, 13);
  assert.equal(C.casterFor(model, {classes: 'Wizard'}).dc, 15);
});

test('multiclasse: pré-requisitos da classe atual e da nova', () => {
  const abil = {str: {score: 18}, dex: {score: 12}, con: {score: 12}, int: {score: 11}, wis: {score: 10}, cha: {score: 16}};
  assert.equal(C.multiclassCheck(abil, ['paladin'], 'wizard').ok, false);
  assert.equal(C.multiclassCheck(abil, ['paladin'], 'sorcerer').ok, true);
  assert.equal(C.multiclassCheck(abil, ['paladin'], 'fighter').ok, true);
  assert.equal(C.multiclassCheck({...abil, cha: {score: 12}}, ['paladin'], 'fighter').ok, false);
});
