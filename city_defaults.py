"""Author-approved city names, selection and settlement roles, applied before roads."""
import copy
import hashlib
import json
import math
from pathlib import Path


def apply_city_defaults(world, base):
    path = Path(base) / 'author-city-defaults.json'
    if not path.exists():
        return world
    raw = json.loads(path.read_text(encoding='utf-8'))
    towns = {b['i']: b for b in world['cities']}
    grid = world['grid']

    def locate(x, y):
        if not (math.isfinite(x) and math.isfinite(y) and 0 <= x < grid['columns']*grid['stepX'] and 0 <= y < grid['rows']*grid['stepY']):
            raise ValueError('City position outside map')
        c = world['cells'][int(y/grid['stepY'])*grid['columns']+int(x/grid['stepX'])]
        if c['h'] < 20:
            raise ValueError('City position must be on land')
        return c

    # Validate all referenced cities and sites before mutating the world.
    for id, edit in raw['edits']['cities'].items():
        if int(id) not in towns or not isinstance(edit.get('name'), str) or len(edit['name']) > 100:
            raise ValueError('Invalid author city edit')
        if not isinstance(edit.get('visible'), bool) or not isinstance(edit.get('notes', ''), str):
            raise ValueError('Invalid author city selection or notes')
    for id, xy in raw['positions'].items():
        if int(id) not in towns:
            raise ValueError('Unknown city position')
        locate(*xy)
    for b in raw['additions']:
        locate(b['x'], b['y'])

    for id, edit in raw['edits']['cities'].items():
        b = towns[int(id)]
        if b['name'] != edit['name'] and not (int(id)==130 and edit['name']=='Gannas'):
            b['aliases'] = list(dict.fromkeys(b.get('aliases', [])+[b['name']]))
        if int(id)==130 and edit['name']=='Gannas':
            b['aliases'] = [name for name in b.get('aliases', []) if name!='Aleravum']
        b.update(copy.deepcopy(edit))
        # Previously hidden towns can fall inside a redrawn political territory.
        b['state'] = world['cells'][b['cell']]['state']
    for id, edit in raw['edits'].get('states', {}).items():
        state = next(s for s in world['states'] if s['i'] == int(id))
        state.update(copy.deepcopy(edit))
    for id, xy in raw['positions'].items():
        b = towns[int(id)]
        b.setdefault('beforeAuthorMove', [b['x'], b['y']])
        b['x'], b['y'] = xy
        c = locate(*xy)
        b['cell'], b['state'] = c['i'], c['state']
    for extra in raw['additions']:
        b = towns.get(extra['i'])
        if b is None:
            b = copy.deepcopy(extra)
            world['cities'].append(b)
            towns[b['i']] = b
        else:
            b.update(copy.deepcopy(extra))
        c = locate(b['x'], b['y'])
        b['cell'], b['state'] = c['i'], c['state']
    for state_id, capital_id in raw.get('capitals', {}).items():
        state_id = int(state_id)
        for b in world['cities']:
            if b['state'] == state_id:
                b['capital'] = int(b['i'] == capital_id)
        next(s for s in world['states'] if s['i'] == state_id)['capital'] = capital_id
    for id in raw.get('removedCities', []):
        towns[id]['visible'] = False
        towns[id]['excluded'] = True
    for b in world['cities']:
        if b['i'] not in raw['magicSchools']:
            b.pop('magicSchool', None)
            b.pop('settlementPlatform', None)
    for id in raw['magicSchools']:
        b = towns[id]
        b['magicSchool'] = True
        b['settlementPlatform'] = True
    for id in raw['ports']:
        towns[id]['port'] = towns[id].get('port') or 1
        towns[id]['majorPort'] = True
    world['authorCityDefaults'] = {
        'id': hashlib.sha256(path.read_bytes()).hexdigest(),
        'sourceFile': raw['sourceFile'], 'exportedAt': raw['exportedAt'],
        'editedCities': len(raw['edits']['cities']), 'magicSchools': raw['magicSchools'],
        'addedCities': [b['i'] for b in raw['additions']], 'movedCities': list(raw['positions'])}
    return world
