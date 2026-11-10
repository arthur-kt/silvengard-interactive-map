"""Verify the approved default against the author's exact export and the backup."""
import json
import copy
import pathlib
from author_defaults import validate_patch, apply_author_defaults
from network_defaults import apply_network_defaults
from city_defaults import apply_city_defaults
from canonical_world import finalize_world
from source_profiles import apply_source_profiles

base = pathlib.Path(__file__).resolve().parent
world = json.loads((base/'dist/world.json').read_text(encoding='utf-8'))
previous = json.loads((base/'backups/v10/world.json').read_text(encoding='utf-8'))
raw = json.loads((base/'author-map-defaults.json').read_text(encoding='utf-8'))
patches = validate_patch(raw, previous)
byid = {p['i']: p for p in patches}
manifest_path=base/'saved-author-defaults.json'
if manifest_path.exists():
    for revision in json.loads(manifest_path.read_text(encoding='utf-8'))['revisions']:
        raw_map=revision['edition'].get('mapEdits')
        if raw_map:
            for p in validate_patch(raw_map,previous):byid[p['i']]={**byid.get(p['i'],{}),**p}

assert world['revision'] == previous['revision']
assert world['grid'] == previous['grid']
for key in ['vertices']:
    assert world[key] == previous[key], f'Unexpected change to {key}'
assert len(world['cells']) == len(previous['cells'])
for before, actual in zip(previous['cells'], world['cells']):
    expected = dict(before)
    expected.update({k: v for k, v in byid.get(before['i'], {}).items() if k != 'i'})
    assert actual == expected, f'Author values differ at cell {before["i"]}'
expected_world=finalize_world(apply_network_defaults(apply_city_defaults(apply_author_defaults(copy.deepcopy(previous),base),base)))
expected_world=apply_source_profiles(expected_world,base)
from scenario_defaults import apply_scenario_defaults
expected_world=apply_scenario_defaults(expected_world,base)
from latest_author_defaults import apply_latest_author_defaults
expected_world=apply_latest_author_defaults(expected_world,base)
from persistent_defaults import apply_persistent_defaults
expected_world=apply_persistent_defaults(expected_world,base)
assert world == expected_world, 'Generated network, ports or author defaults differ from the approved pipeline'
for city in world['cities']:
    if city['visible']:assert city['state']==world['cells'][city['cell']]['state']
assert world['authorMapDefaults']['cells'] == len(patches)
assert len(world['authorMapDefaults']['id']) == 64
print(f'PASS: {len(patches)} author cells match exactly; all other cells unchanged.')
print('PASS: geometry and water preserved; scale, ports and road network match the requested defaults.')
print('PASS: city ownership matches the approved political cells.')
