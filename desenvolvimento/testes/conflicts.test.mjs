import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve(import.meta.dirname, '../..');
const source = JSON.parse(fs.readFileSync(path.join(base, 'app/dist/conflicts-source.json'), 'utf8'));
const archive = JSON.parse(fs.readFileSync(path.join(base, 'app/dist/history-archive.json'), 'utf8'));
const records = archive.records.filter(record => record.kind === 'conflict');
const amount = value => Number((String(value).match(/\d[\d.]*/) || [0])[0].replace(/\./g, ''));

test('the conflicts tab has a complete set of wars', () => {
  assert.equal(source.length, 24);
  assert.equal(records.length, 24);
  const ids = new Set();
  for (const war of source) {
    assert.match(war.id, /^[a-z0-9-]+$/);
    assert.ok(!ids.has(war.id), war.id);
    ids.add(war.id);
    assert.ok(war.name && war.years && war.kind, war.id);
    assert.ok(Number.isInteger(war.start) && Number.isInteger(war.end) && war.end >= war.start, war.id);
    assert.ok(war.sides.length >= 2, war.id);
    for (const side of war.sides) {
      assert.ok(side.name && side.commanders && side.strength && side.casualties && side.objective, `${war.id}/${side.name}`);
    }
    assert.ok(war.victor && war.result && war.outcome && war.objectives && war.summary, war.id);
    assert.ok(war.summary.length > 80, war.id);
  }
});

test('the archive totals match the sides and are marked as estimates', () => {
  for (const record of records) {
    const war = record.conflict;
    const strength = war.sides.reduce((sum, side) => sum + amount(side.strength), 0);
    const casualties = war.sides.reduce((sum, side) => sum + amount(side.casualties), 0);
    assert.equal(amount(war.totalStrength), strength, war.name);
    assert.equal(amount(war.totalCasualties), casualties, war.name);
    assert.match(war.totalStrength, /^~/);
    assert.match(war.totalCasualties, /^~/);
  }
});

test('key wars keep their canon results', () => {
  const byId = Object.fromEntries(records.map(record => [record.conflict.id, record.conflict]));
  assert.equal(byId['guerra-das-reliquias'].years, '1215–1250 AQD');
  assert.equal(byId['guerra-das-reliquias'].victor, 'Sem vencedor militar — Acordo de Bomaria');
  assert.equal(byId['guerra-civil-de-dragonfall'].sides.length, 3);
  assert.equal(byId['guerra-civil-de-dragonfall'].victor, 'Coroa de Dragonfall');
  assert.equal(byId['guerra-dos-degraus-de-vathnis'].victor, 'Veniun');
  assert.equal(byId['guerra-dos-degraus-de-vathnis'].result, 'victory');
});

test('conflict links point to map states', () => {
  const world = JSON.parse(fs.readFileSync(path.join(base, 'app/dist/world.json'), 'utf8'));
  const states = new Set(world.states.map(state => state.i));
  for (const war of source) {
    for (const link of war.links || []) {
      const [kind, id] = link.split(':');
      assert.equal(kind, 'state');
      assert.ok(states.has(Number(id)), `${war.id}: ${link}`);
    }
  }
});
