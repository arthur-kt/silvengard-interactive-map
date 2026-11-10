"""Bake the two approved November 6 exports, without copying browser journeys."""
import json
import shutil
from pathlib import Path
from author_defaults import validate_patch, apply_author_defaults
from city_defaults import apply_city_defaults
from network_defaults import apply_network_defaults

base = Path(__file__).resolve().parent.parent
backup = base/'acervo/backups/v15-before-author-edition'
backup.mkdir(parents=True, exist_ok=True)
for relative in ['app/dist/world.json','app/dist/app.js','app/dist/features.js','app/dist/terrain-shape.js','app/dist/index.html',
                 'author-map-defaults.json','network_defaults.py','convert.py','verify_author_defaults.py']:
    target = backup/relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists(): shutil.copy2(base/relative, target)
world = json.loads((backup/'app/dist/world.json').read_text(encoding='utf-8'))
edition = json.loads((base/'silvengard-edicao (9).json').read_text(encoding='utf-8-sig'))
paint = json.loads((base/'silvengard-alteracoes-mapa (8).json').read_text(encoding='utf-8-sig'))
assert edition['mapEdits']['cells'] == paint['cells'], 'The two paint exports differ; review before baking'
validate_patch(paint, world)
raw = json.loads((backup/'author-map-defaults.json').read_text(encoding='utf-8'))
merged = {c['i']: dict(c) for c in raw['cells']}
for c in paint['cells']: merged.setdefault(c['i'], {'i': c['i']}).update(c)
raw.update(cells=[merged[i] for i in sorted(merged)],
           sourceFile=raw['sourceFile']+' + silvengard-alteracoes-mapa (8).json / silvengard-edicao (9).json',
           exportedAt=edition['exportedAt'])
(base/'author-map-defaults.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2),encoding='utf-8')
city_raw = dict(sourceFile='silvengard-edicao (9).json', exportedAt=edition['exportedAt'], edits=edition['edits'],
                positions={'70':[1320.4,624.5], '104':[397.26,470.4]}, ports=[61],
                magicSchools=[5,130,168,189,226,2000,4002],
                additions=[dict(i=4002,name='Sahtalys',x=1434.0,y=686.0,cell=0,state=14,culture=11,
                    capital=0,port=0,citadel=0,walls=0,temple=0,population=None,type='Escola de magia',
                    settlementClass='Cidade',visible=True,source='Cidade e nome aprovados pelo autor · ilha em frente a Allanan',
                    reference=False,notes='Escola de magia na ilha em frente a Allanan.')])
(base/'author-city-defaults.json').write_text(json.dumps(city_raw,ensure_ascii=False,indent=2),encoding='utf-8')
world = apply_network_defaults(apply_city_defaults(apply_author_defaults(world,base),base))
(base/'app/dist/world.json').write_text(json.dumps(world,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f"Baked {len(paint['cells'])} paint deltas, {len(merged)} cumulative cells and 49 city edits; added Sahtalys")
