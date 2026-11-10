"""Compile the author's market membership table; no map or production changes."""
from pathlib import Path
import hashlib
import json
import re
import unicodedata

DOCUMENT = 'Silvengard_Mercados_Atualizado.md'


def normalized(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text).lower() if c.isalnum())


def apply_market_defaults(base, data, world):
    base = Path(base)
    path = base / DOCUMENT
    if not path.exists():
        path = base.parent / 'silvengard-atlas' / DOCUMENT
    if not path.exists():
        return data, None
    text = path.read_text(encoding='utf-8-sig')
    renames = dict(re.findall(r'^- (.+?) → \*\*(.+?)\*\*\s*$', text, re.M))
    cities = {b['i']: b for b in world['cities'] if not b.get('excluded')}
    states = {s['i']: s['name'].strip() for s in world['states']}
    active = [b for b in cities.values() if b['state'] != 17 and b.get('demographics', {}).get('population', 0) > 0]
    # IDs remain stable across renaming, preserving prices and recorded references.
    original_names = data.get('authorMarketDefaults', {}).get('originalNames', {})
    if not original_names:
        for market in data['markets']:
            center = next((b for b in active if b['i'] == market['centerCity']), None)
            center = center or next((b for b in active if data['cityReferences'].get(str(b['i'])) == market['centerCity']), None)
            center = center or next(iter(sorted((b for b in active if data['cityMarkets'].get(str(b['i'])) == market['i']), key=lambda b: -b['demographics']['population'])), None)
            if not center:
                raise ValueError(f'Mercado {market["i"]} sem sede de referência.')
            original_names[str(market['i'])] = center['name']
    target_names = {market['i']: renames.get(original_names[str(market['i'])], original_names[str(market['i'])]) for market in data['markets']}
    if set(target_names.values()) != set(renames.values()):
        raise ValueError('Os nomes de mercado do documento não correspondem aos mercados cadastrados.')
    target_ids = {normalized(name): i for i, name in target_names.items()}
    current, assignments, rows = None, {}, []
    for line in text.splitlines():
        heading = re.match(r'^### Mercado de (.+?) \((\d+) localidades\)', line)
        if heading:
            name = heading[1]
            if normalized(name) not in target_ids:
                raise ValueError('Mercado não reconhecido: ' + name)
            current = target_ids[normalized(name)]
        elif line.startswith('### Sem mercado'):
            current = None
        elif line.startswith('|'):
            fields = [c.strip() for c in line.strip().strip('|').split('|')]
            if len(fields) != 4 or fields[0] in ('Estado', '---'):
                continue
            state, province, name, _ = fields
            matches = [b for b in cities.values() if normalized(b['name']) == normalized(name) and normalized(states[b['state']]) == normalized(state)]
            if not matches:
                matches = [b for b in cities.values() if normalized(name) in [normalized(a) for a in b.get('aliases', [])] and normalized(states[b['state']]) == normalized(state)]
            if len(matches) != 1:
                raise ValueError(f'Localidade sem correspondência única: {state} / {name}.')
            city = matches[0]
            if str(city['i']) in assignments:
                raise ValueError('Localidade repetida: ' + name)
            assignments[str(city['i'])] = current
            rows.append(dict(city=city['i'], state=city['state'], province=province, market=current))
    if set(assignments) != {str(i) for i in cities}:
        raise ValueError('O documento deve atribuir cada localidade uma única vez, incluindo as sem mercado.')
    seats = {}
    for market in data['markets']:
        name = target_names[market['i']]
        matches = [b for b in active if normalized(b['name']) == normalized(name)]
        if len(matches) != 1 or assignments[str(matches[0]['i'])] != market['i']:
            raise ValueError('Sede inválida ou fora do próprio mercado: ' + name)
        seats[market['i']] = matches[0]['i']
    for market in data['markets']:
        market['centerCity'] = seats[market['i']]
    data['cityMarkets'] = assignments
    territory_path = path.parent / 'market-territories.json'
    territories = json.loads(territory_path.read_text(encoding='utf-8')) if territory_path.exists() else {'version': 1, 'corridors': []}
    for sid, mid in territories.get('stateMarkets', {}).items():
        if int(sid) not in states or mid not in target_names:
            raise ValueError('Associação territorial de mercado inválida.')
    for corridor in territories.get('corridors', []):
        if corridor['market'] not in target_names or any(corridor[k] not in cities for k in ['fromCity', 'toCity']) or not 0 < corridor['radius'] <= 100:
            raise ValueError('Corredor comercial inválido.')
    data['authorMarketDefaults'] = dict(version=2, document=DOCUMENT, digest=hashlib.sha256(text.encode()).hexdigest(), originalNames=original_names, territories=territories)
    return data, dict(markets=[dict(i=m['i'], name=target_names[m['i']], centerCity=m['centerCity'], cities=[r['city'] for r in rows if r['market'] == m['i']]) for m in data['markets']], rows=rows)


if __name__ == '__main__':
    base = Path(__file__).resolve().parent
    data = json.loads((base / 'dist/economy-source.json').read_text(encoding='utf-8'))
    world = json.loads((base / 'dist/world.json').read_text(encoding='utf-8'))
    data, audit = apply_market_defaults(base, data, world)
    (base / 'dist/economy-source.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (base / 'market-author-defaults.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps([dict(name=m['name'], cities=len(m['cities']), seat=m['centerCity']) for m in audit['markets']], ensure_ascii=False))
