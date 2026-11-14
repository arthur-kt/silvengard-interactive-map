#!/usr/bin/env python3
"""Deriva perfis de urbanismo do .map de Azgaar sem alterar world.json.

As plantas Watabou nao sao armazenadas no arquivo .map: os links, quando
presentes, guardam sementes e parametros reprodutiveis no gerador externo.
As cenas 3D locais usam estes perfis para reconstruir malhas semelhantes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import unicodedata
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ALIASES = {
    'asgorath': {'asghorat'},
    'porto das cinzas': {'porto do alamo'},
    'selne': {'garnalos'},
}

LABELS = {
    'imperial-grid': 'Malha imperial, avenidas e quarteiroes regulares',
    'elfic-organic': 'Avenidas curvas, bosques e nucleos elficos',
    'capital-fan': 'Capital historica, praca central e avenidas',
    'dwarven-terraces': 'Terracos e caminhos de montanha',
    'harbor-front': 'Porto, docas e vias seguindo a costa',
    'fortress': 'Castelo, recinto militar e acessos defensivos',
    'desert-medina': 'Mercado central e vielas de cidade arida',
    'steppe-camp': 'Acampamento e vias das estepes',
    'marsh-causeways': 'Passagens elevadas e bairros de pantano',
    'volcanic': 'Forjas, patios fortificados e terrenos vulcanicos',
    'forest-settlement': 'Bairros abertos integrados a vegetacao',
    'trading-town': 'Mercado, arterias mercantis e vias secundarias',
    'ruins': 'Vestigios de ruas e nucleos da antiga cidade',
    'organic-town': 'Ruas medievais organicas e pracas',
}


def norm(text):
    text = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', text).strip()


def same_city(name, reference):
    a, b = norm(name), norm(reference)
    return a == b or b in ALIASES.get(a, ())


def stable_seed(text):
    return int.from_bytes(hashlib.sha256(text.encode('utf-8')).digest()[:4], 'big') & 0x7fffffff


def load_burgs(path):
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    if not lines[0].startswith('1.'):
        raise ValueError('O arquivo nao parece ser um .map textual do Azgaar')
    candidates = []
    for i, line in enumerate(lines):
        if not line.startswith('[0,{') or '"name"' not in line or '"population"' not in line:
            continue
        try:
            a = json.loads(line)
        except json.JSONDecodeError:
            continue
        if len(a) >= 50 and isinstance(a[1], dict) and {'cell', 'x', 'y', 'i'}.issubset(a[1]):
            candidates.append((i,a))
    if not candidates:
        raise ValueError('Nao encontrei a lista de cidades (burgs) no .map')
    i, a = max(candidates, key=lambda x: len(x[1]))
    return i, [b for b in a if isinstance(b, dict) and not b.get('removed') and b.get('name')]


def wt_parameters(url):
    if not url or 'watabou.github.io/city-generator/' not in url:
        return None
    raw = {k:v[-1] for k,v in parse_qs(urlsplit(url).query).items()}
    out = {}
    for key in ['seed','size','population','coast','river','farms','citadel','urban_castle','plaza',
                'greens','temple','walls','shantytown','hub']:
        if key in raw:
            try: out[key] = int(float(raw[key]))
            except ValueError: pass
    if 'sea' in raw:
        try: out['sea'] = float(raw['sea'])
        except ValueError: pass
    if 'style' in raw: out['style'] = raw['style']
    return out


def archetype(city):
    n, s, c = norm(city['name']), city.get('state'), city.get('culture')
    cl = norm(city.get('settlementClass') or '')
    if city['i'] in (8,14): return 'ruins'
    if city['i'] == 7: return 'imperial-grid'
    if city['i'] == 3: return 'capital-fan'
    if city['i'] == 23: return 'fortress'
    if city['i'] == 33: return 'volcanic'
    if city['i'] == 223: return 'marsh-causeways'
    if city['i'] == 140: return 'steppe-camp'
    if n in {'torre solitaria','selne','garnalos','allanan'} and s==14: return 'elfic-organic'
    if n in {'dagorah','grenolk','mauron','ginar','shunzargil','adush'} or c==15: return 'dwarven-terraces'
    if s == 34 or c==22: return 'steppe-camp'
    if s == 24 or c==14: return 'desert-medina'
    if n.startswith('forte ') or cl.startswith('forte') or n in {'castamor','arenor','althor','adhuc vivere','winterhelm'}:
        return 'fortress' if n in {'winterhelm','adhuc vivere'} or cl.startswith('forte') else 'imperial-grid'
    if n in {'lakenford','rinnton'}:return 'fortress'
    if c==13 or s==20: return 'volcanic' if n in {'dracon','amrithruk','hethlothloth'} else ('harbor-front' if city.get('port') else 'organic-town')
    if s==14 or c==11: return 'elfic-organic'
    if c==12: return 'forest-settlement'
    if c==20 or s==32: return 'marsh-causeways'
    if s == 13 or (c==10 and city.get('capital')):return 'imperial-grid'
    if city.get('port') or city.get('majorPort'):return 'harbor-front'
    if s in (31,49) or c==21 or c==18: return 'trading-town'
    return 'organic-town'


def distance(b, o):
    return math.hypot(float(b['x'])-float(o['x']), float(b['y'])-float(o['y']))


def best_neighbor(b, burgs, own):
    # A base proxima e somente REFERENCIA urbanistica; nunca muda a identidade da cidade.
    near = []
    for o in burgs:
        d = distance(b,o)
        if d>112: continue
        capital_mismatch=bool(o.get('capital'))!=bool(b.get('capital'))
        water_mismatch=bool(o.get('port'))!=bool(b.get('port'))
        score=d+(50 if capital_mismatch else 0)+(18 if water_mismatch else 0)+(14 if bool(o.get('walls'))!=bool(b.get('walls')) else 0)
        if b.get('state') == o.get('state'): score -= 12
        if b.get('culture') == o.get('culture'): score -= 8
        if own and o.get('i')==own.get('i'):score-=4
        near.append((score,d,o))
    if not near:return None,None
    score,d,o=min(near,key=lambda x:(x[0],x[1],x[2]['i']))
    return o, d


def generate(world_path, map_path, out_path, report_path):
    i,burgs=load_burgs(map_path)
    by_id={b['i']:b for b in burgs}
    by_name={}
    for b in burgs: by_name.setdefault(norm(b['name']),[]).append(b)
    world=json.loads(world_path.read_text())
    cities=world['cities']
    records={}
    tally=Counter()
    moved=[]
    for city in cities:
        if not isinstance(city,dict) or city.get('excluded'): continue
        profile=city.get('sourceProfile') or {}
        own=by_id.get(city['i'])
        if not own or not same_city(city['name'],own['name']):
            sourceid=profile.get('sourceCityId')
            cand=by_id.get(sourceid)
            if cand and same_city(city['name'],cand['name']):own=cand
        if not own:
            options=by_name.get(norm(city['name'])) or []
            if options:own=min(options,key=lambda o:distance(city,o))
        origdist=round(distance(city,own),1) if own else None
        url=own.get('link') if own else None
        wt=wt_parameters(url)
        basis=own
        method='identidade'
        if own and wt:
            method='watabou-semente'
        elif own and origdist is not None and origdist>26:
            cand,dist=best_neighbor(city,burgs,own)
            if cand is not None and cand['i']!=own['i'] and dist<origdist*.90:
                basis=cand;method='proximidade'
            else:method='identidade-relocada'
        elif own is None:
            cand,dist=best_neighbor(city,burgs,None)
            if cand and dist<65: basis=cand;method='proximidade'
            else: method='historico-cultural'
        patt=archetype(city)
        if method=='proximidade' and basis is not None and bool(basis.get('capital'))!=bool(city.get('capital')):
            # Grande capital sem equivalente geograficamente proximo: usa traco historico.
            method='historico-cultural';basis=None
        is_island=city['i']==7
        features={
            'capital':bool(city.get('capital')),
            'citadel':bool(city.get('citadel') or city.get('dwarvenFortress')),
            'walls':bool(city.get('walls')),
            'port':bool(city.get('port') or city.get('majorPort')),
            'temple':bool(city.get('temple')),
            'magicSchool':bool(city.get('magicSchool')),
        }
        if city['i'] in (3,7,23,33,10):features['walls']=True
        if city['i']==8:features['market']=False;features['empty']=True
        if city['i']==14:features['market']=False;features['empty']=True
        seed=wt['seed'] if wt else stable_seed(f"silvengard-1277/{city['i']}/{city['name']}/{basis['i'] if basis else 'lore'}")
        item={
            'cityId':city['i'],'name':city['name'],
            'pattern':patt,'patternLabel':LABELS[patt],
            'seed':seed,
            'features':features,
            'source':{
                'mode':method,
                'cityId':own.get('i') if own else None,
                'cityName':own.get('name') if own else None,
                'referenceId':basis.get('i') if basis else None,
                'referenceName':basis.get('name') if basis else None,
                'mapPosition':[round(own['x'],2),round(own['y'],2)] if own else None,
                'positionDifference':origdist,
                'referenceDistance':round(distance(city,basis),1) if basis else None,
                'watabouUrl':url,
                'watabouParams':wt,
            },
        }
        if is_island:
            item['terrain']={
                'island':{
                    'shape':'irregular-ellipse','radiusEastWestM':1750,'radiusNorthSouthM':1620,
                    'harbourFacingCoastM':940,'waterOnAllSides':True,
                },
                'water':'sea',
            }
        if patt=='ruins':item['features']['market']=False
        if patt=='steppe-camp':item['features']['walls']=False
        records[str(city['i'])]=item
        tally[method]+=1
        if origdist is not None and origdist>26: moved.append(item)
    # Os ajustes historicos/urbanos autorais nao fazem parte do Azgaar .map.
    # Ao regenerar dados a partir de um novo mapa, PRESERVAR esses overrides.
    if out_path.is_file():
        try:
            old_records=json.loads(out_path.read_text(encoding='utf-8')).get('cities',{})
        except (ValueError,OSError,TypeError):
            old_records={}
        for key,item in records.items():
            previous=old_records.get(key,{})
            for manual in ('terrain','urbanDesign','classification'):
                if manual in previous:item[manual]=previous[manual]
    data={
        'schema':'silvengard.city-blueprints/1',
        'mapFile':map_path.name,
        'mapVersion':'1.153.0',
        'reference':'Azgaar FMG; parametros Watabou presentes para somente algumas cidades, nao plantas SVG.',
        'generatedYearAQD':1277,
        'cityCount':len(records),
        'watabouLinkedCities':sum(bool(v['source']['watabouUrl']) for v in records.values()),
        'cities':records,
    }
    out_path.parent.mkdir(parents=True,exist_ok=True)
    out_path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    text=['# Atlas de Silvengard — upgrade das plantas urbanas (1277 AQD)','',
      '## O que o arquivo de Azgaar fornece','',
      f'- `{map_path.name}`: {len(burgs)} localidades ativas; dados de posicao e caracteristicas.',
      f'- {sum(bool(b.get("link")) for b in burgs)} links Watabou no `.map`, que guardam sementes e parametros, **nao** a geometria das plantas.',
      f'- {len(records)} localidades do Atlas recebem perfil procedural no arquivo `city-blueprints.json`.',
      f'- {len(moved)} localidades tiveram diferenca de mais de 26 unidades de mapa relativamente ao registro original.',
      '- As novas malhas de rua, edificios e muralhas sao **interpretacoes 3D**, nao importacoes exatas das plantas Watabou.',
      '- A identidade e a posicao atual do Atlas sao preservadas. As cidades deslocadas podem adotar uma base geografica proxima.',
      '- **Elucitor**: ilha irregular fechada; agua em todo o contorno do terreno local, inclusive atras da cidade.',
      '', '## Correspondencias utilizadas', '',
      '| ID | Cidade no Atlas | Tracado | Base de referencia | Metodo | Deslocamento | Link original |',
      '|---:|---|---|---|---|---:|---|']
    for v in records.values():
        src=v['source']; diff='—' if src['positionDifference'] is None else f"{src['positionDifference']:.1f}"
        ref=f"{src['referenceName']} (#{src['referenceId']})" if src['referenceId'] else 'Contexto historico/cultural'
        link='sim' if src['watabouUrl'] else 'nao'
        text.append(f"| {v['cityId']} | {v['name'].replace('|','/')} | {v['pattern']} | {ref} | {src['mode']} | {diff} | {link} |")
    text += ['', '## Limites de fidelidade', '',
      'O arquivo `.map` nao inclui os poligonos de casas, lotes e vias do gerador Watabou. As doze sementes preservadas podem recriar o desenho no site do gerador, mas a cena 3D deste upgrade usa sua propria geracao deterministica de ruas, com perfil, clima e escala do Atlas.',
      'Uma importacao geometrica exata exigiria os SVG/JSON exportados do Watabou para cada cidade.',
      '', '## Compatibilidade', '',
      'O upgrade modifica apenas os arquivos da visao local e adiciona dados de planta; nao altera `world.json`, economia, territorios, fichas ou edicoes anteriores.','']
    report_path.parent.mkdir(parents=True,exist_ok=True)
    # Nao sobrescrever o relatorio revisado manualmente com lore e especificacao v4.
    report_is_manual=report_path.is_file() and '## Revisão v4 — interiores anões navegáveis' in report_path.read_text(encoding='utf-8')
    if not report_is_manual:
        report_path.write_text('\n'.join(text),encoding='utf-8')
    else:
        print('Relatorio v4 preservado: revisoes manuais devem ser reconciliadas pelo autor.')
    print('BURG DATA ROW',i,'map',len(burgs),'atlas',len(records),'links',data['watabouLinkedCities'],'moved',len(moved),'methods',dict(tally))
    print('RELOCATIONS with links:',[(v['name'],v['source']['positionDifference'],v['source']['mode']) for v in moved if v['source']['watabouUrl']])
    return data


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--map',required=True,type=Path)
    parser.add_argument('--world',required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    parser.add_argument('--report',required=True,type=Path)
    args=parser.parse_args()
    generate(args.world,args.map,args.out,args.report)
