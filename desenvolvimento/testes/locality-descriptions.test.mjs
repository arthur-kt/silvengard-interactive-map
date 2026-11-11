import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve(import.meta.dirname, '../..');
const world = JSON.parse(fs.readFileSync(path.join(base, 'app/dist/world.json'), 'utf8'));
const descriptions = JSON.parse(fs.readFileSync(path.join(base, 'app/dist/locality-descriptions.json'), 'utf8'));
const places = fs.readFileSync(path.join(base, 'app/historic_archives/Silvengard_Estados_Historias_Provincias_e_Cidades.md'), 'utf8');

function merged() {
  const copy = structuredClone(world.landmarks);
  for (const landmark of copy) if (!landmark.description && descriptions[landmark.name]) landmark.description = descriptions[landmark.name];
  return copy;
}

test('every map locality has a real, player-facing description', () => {
  for (const landmark of merged()) {
    assert.ok(landmark.description && landmark.description.length >= 60, `${landmark.name} sem descrição`);
    assert.doesNotMatch(landmark.description, /sem narrativa individual|sem lenda individual|não está estabelecida|sem interpretação histórica/i, landmark.name);
  }
});

test('the description file covers exactly the landmarks of the map', () => {
  const names = new Set(world.landmarks.map(landmark => landmark.name));
  assert.deepEqual(Object.keys(descriptions).sort(), [...names].sort());
});

test('Angra dos Goblins is described as a snowy forest region, not a generic point', () => {
  const landmark = merged().find(item => item.name === 'Angra dos Goblins');
  assert.match(landmark.description, /florestal nevada/i);
  assert.match(landmark.description, /goblins, kobolds/i);
  assert.match(places, /- \*\*Angra dos Goblins\*\* \(Povoado\): Região florestal nevada/);
});

test('the history archive shows the same authored text for the localities', () => {
  for (const [name, text] of Object.entries(descriptions)) {
    if (!places.includes(`**${name}** (`)) continue;
    assert.ok(places.includes(text.slice(0, 70)), `${name} não aparece no arquivo`);
  }
});
