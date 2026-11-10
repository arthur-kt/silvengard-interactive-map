"""Apply the author's approved paint export after the reference reconstruction."""
import collections
import hashlib
import json
import math
import pathlib

FIELDS = {'state', 'biome', 'woodland', 'vegetation', 'snow', 'aridity', 'region'}
SPECIES = {'auto', 'conifer', 'broadleaf', 'dead', 'tropical', 'acacia', 'none'}


def validate_patch(raw, world):
    if raw.get('format') != 'silvengard-map-edits-v1' or not isinstance(raw.get('cells'), list):
        raise ValueError('Invalid author map edition')
    grid = raw.get('grid', {})
    if raw.get('baseRevision') != world['revision'] or any(
        not isinstance(grid.get(k), (int, float)) or not math.isfinite(grid[k])
        or abs(grid[k] - world['grid'][k]) > 1e-6
        for k in ['columns', 'rows', 'stepX', 'stepY']
    ):
        raise ValueError('Author edition does not match the reference mesh')
    states = {s['i'] for s in world['states']}
    seen = set()
    for patch in raw['cells']:
        i = patch.get('i')
        if type(i) is not int or not 0 <= i < len(world['cells']) or i in seen or world['cells'][i]['h'] < 20:
            raise ValueError('Invalid, duplicate or water cell in author edition')
        seen.add(i)
        for key, value in patch.items():
            if key == 'i':
                continue
            if key not in FIELDS:
                raise ValueError('Unknown author field: ' + key)
            if key == 'state' and (type(value) is not int or value not in states):
                raise ValueError('Unknown state')
            if key == 'biome' and (type(value) is not int or not 1 <= value <= 16):
                raise ValueError('Invalid biome')
            if key in {'woodland', 'snow', 'aridity'} and (
                type(value) not in (int, float) or not math.isfinite(value)
                or not 0 <= value <= (2 if key == 'woodland' else 1)
            ):
                raise ValueError('Invalid density or climate')
            if key == 'vegetation' and value not in SPECIES:
                raise ValueError('Invalid vegetation')
            if key == 'region' and (not isinstance(value, str) or len(value) > 150):
                raise ValueError('Invalid region name')
    return raw['cells']


def apply_author_defaults(world, base):
    path = pathlib.Path(base) / 'author-map-defaults.json'
    if not path.exists():
        return world
    raw = json.loads(path.read_text(encoding='utf-8'))
    patches = validate_patch(raw, world)  # Validate everything before mutation.
    owners = set()
    political = {}
    for patch in patches:
        cell = world['cells'][patch['i']]
        if 'state' in patch:
            owners.update([cell['state'], patch['state']])
            political[patch['i']] = patch['state']
        cell.update({k: v for k, v in patch.items() if k != 'i'})
    for city in world['cities']:
        if city['cell'] in political:
            city['state'] = political[city['cell']]
    grid = world['grid']
    for state in world['states']:
        if state['i'] not in owners:
            continue
        cells = [c for c in world['cells'] if c['state'] == state['i'] and c['h'] >= 20]
        state['area'] = round(sum(c['area'] for c in cells), 3)
        state['neighbors'] = sorted({world['cells'][i]['state'] for c in cells for i in c['c']
                                     if world['cells'][i]['h'] >= 20 and world['cells'][i]['state'] != state['i']})
        pole = state.get('pole')
        if pole:
            j = min(grid['rows']-1, max(0, int(pole[1]/grid['stepY']))) * grid['columns'] + min(grid['columns']-1, max(0, int(pole[0]/grid['stepX'])))
            valid_pole = world['cells'][j]['state'] == state['i'] and world['cells'][j]['h'] >= 20
        else:
            valid_pole = False
        if not cells:
            state['pole'] = None
        elif not valid_pole:
            x = sum(c['p'][0] for c in cells) / len(cells)
            y = sum(c['p'][1] for c in cells) / len(cells)
            state['pole'] = min(cells, key=lambda c: (c['p'][0]-x)**2 + (c['p'][1]-y)**2)['p']
    digest = hashlib.sha256(json.dumps(patches, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
    world['authorMapDefaults'] = {'id': digest, 'sourceFile': raw.get('sourceFile', path.name),
                                  'exportedAt': raw.get('exportedAt'), 'cells': len(patches),
                                  'fields': dict(collections.Counter(k for p in patches for k in p if k != 'i'))}
    return world
