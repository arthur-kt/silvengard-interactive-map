"""Generate a readable Markdown gazetteer from the current canonical atlas."""
from pathlib import Path
import collections
import json
import math
import unicodedata

base=Path(__file__).resolve().parents[2]
w=json.loads((base/'app/dist/world.json').read_text(encoding='utf-8'))
states={s['i']:s for s in w['states']};towns={b['i']:b for b in w['cities']}
cultures={c['i']:c['name'] for c in w['cultures']};religions={r['i']:r for r in w['religions']}
cells=w['cells'];g=w['grid']
sortkey=lambda s:unicodedata.normalize('NFKD',str(s)).casefold()
def esc(value):return str(value if value is not None else '—').replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('|','\\|').replace('\n',' ')
def state_name(i):return states[i]['name'].strip() if i else 'Terras neutras'
def nearest(p):return cells[min(g['rows']-1,max(0,int(p[1]/g['stepY'])))*g['columns']+min(g['columns']-1,max(0,int(p[0]/g['stepX'])))]
def owner(p,margin=12):
    c=nearest(p)
    if c['h']>=20:return c['state']
    candidates=[]
    for y in range(max(0,int((p[1]-margin)/g['stepY'])),min(g['rows']-1,int((p[1]+margin)/g['stepY']))+1):
        for x in range(max(0,int((p[0]-margin)/g['stepX'])),min(g['columns']-1,int((p[0]+margin)/g['stepX']))+1):
            cell=cells[y*g['columns']+x]
            if cell['h']>=20:candidates.append((math.dist(p[:2],cell['p']),cell['i']))
    if not candidates:return None
    d,i=min(candidates)
    return cells[i]['state'] if d<=margin else None
def path_states(points):
    result=set()
    for a,b in zip(points,points[1:]):
        n=max(1,math.ceil(math.dist(a[:2],b[:2])/3))
        for j in range(n+1):
            t=j/n;p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];i=owner(p,5)
            if i is not None:result.add(i)
    return result
def nation_list(ids):return ', '.join(state_name(i) for i in sorted(ids,key=lambda i:sortkey(state_name(i)))) or 'Área marítima / sem vínculo definido'
geo=[]
for l in w['landmarks']:
    i=None if l['kind']=='mar' else owner(l['point'],30)
    geo.append({'name':l['name'],'kind':l['kind'].capitalize(),'states':set() if i is None else {i},'detail':'Referência costeira' if l['kind']=='baía' else ''})
groups=collections.defaultdict(list)
for r in w['rivers']:groups[r['name']].append(r)
for name,parts in groups.items():
    ids=set().union(*(path_states(r['points']) for r in parts))
    geo.append({'name':name,'kind':'Rio','states':ids,'detail':f'{len(parts)} trechos registrados' if len(parts)>1 else ''})
for f in w.get('fortifications',[]):
    geo.append({'name':f['name'],'kind':'Muralha','states':path_states(f['points']),'detail':'Linha de fortificações'})
known={sortkey(x['name']) for x in geo}
regions=collections.defaultdict(set)
for c in cells:
    if c['h']>=20 and c.get('region','').strip():regions[c['region'].strip()].add(c['state'])
for name,ids in regions.items():
    if sortkey(name) not in known:geo.append({'name':name,'kind':'Região do terreno','states':ids,'detail':''})
geo.sort(key=lambda x:(sortkey(x['kind']),sortkey(x['name'])))

lines=[]
def add(text=''):lines.append(text)
def table(headers,rows):
    add('| '+' | '.join(headers)+' |');add('| '+' | '.join('---' for _ in headers)+' |')
    for row in rows:add('| '+' | '.join(esc(v) for v in row)+' |')
    add()
def role(b):
    labels=[]
    for flag,label in [('capital','Capital'),('majorPort','Porto principal'),('magicSchool','Escola de magia'),('dwarvenFortress','Fortaleza anã'),('citadel','Cidadela'),('walls','Muralhas'),('temple','Templo')]:
        if b.get(flag):labels.append(label)
    if b.get('port') and not b.get('majorPort'):labels.append('Porto')
    if b.get('settlementClass') not in [None,'','Cidade']:labels.append(b['settlementClass'])
    return ' · '.join(dict.fromkeys(labels)) or 'Cidade'
def number(n):return f'{int(n):,}'.replace(',','.')

add('# Silvengard — Estados, cidades, culturas, religiões e geografia')
add();add('Edição atualizada em **7 de novembro de 2026**.');add()
add(f'**{sum(bool(s["i"]) for s in states.values())} estados · {len(towns)} cidades e localidades urbanas · {len(religions)} religiões/opções religiosas · {len(cultures)} culturas.**');add()
add('Os elementos que atravessam fronteiras aparecem nos estados correspondentes. As referências costeiras são associadas pela posição no mapa atual. Mares e elementos sem vínculo territorial definido aparecem em uma seção própria.');add()
add('## Culturas');add()
table(['Cultura','Cidades vinculadas'],[(c['name'],sum(b['culture']==c['i'] for b in towns.values())) for c in sorted(w['cultures'],key=lambda c:sortkey(c['name']))])
add('## Religiões e divindades');add()
table(['Religião','Divindade / conjunto de divindades','Cidades vinculadas'],[(r['name'],r.get('deity') or '—',sum(b.get('faith',{}).get('i')==r['i'] for b in towns.values())) for r in sorted(religions.values(),key=lambda r:sortkey(r['name']))])
add('### Índice de divindades');add()
deities=collections.defaultdict(list)
for r in religions.values():
    if r.get('deity'):deities[r['deity']].append(r['name'])
for name,faiths in sorted(deities.items(),key=lambda x:sortkey(x[0])):add(f'- **{esc(name)}** — '+esc('; '.join(faiths))+'.')
add();add('## Estados');add()
for s in sorted((s for s in states.values() if s['i']),key=lambda s:sortkey(s['name'])):add(f'- [{esc(s["name"].strip())}](#estado-{s["i"]})')
add()
ids=sorted((i for i in states if i),key=lambda i:sortkey(state_name(i)))
if any(b['state']==0 for b in towns.values()) or any(0 in x['states'] for x in geo):ids.append(0)
for id in ids:
    s=states[id];bs=sorted((b for b in towns.values() if b['state']==id),key=lambda b:sortkey(b['name']));places=[x for x in geo if id in x['states']]
    add(f'<a id="estado-{id}"></a>');add();add('### '+esc(state_name(id)));add()
    capital=towns.get(s.get('capital'));info=[]
    if s.get('government',{}).get('designation'):info.append('Governo: **'+esc(s['government']['designation'])+'**')
    if capital:info.append('Capital: **'+esc(capital['name'])+'**')
    info.append(f'**{len(bs)} localidades urbanas**');add(' · '.join(info)+'.');add()
    add('#### Cidades e localidades');add()
    if bs:table(['Localidade','Tipo / características','Habitantes','Cultura','Religião','Divindade'],[(b['name'],role(b),number(b['demographics']['population']),cultures.get(b['culture'],'Não informada'),b.get('faith',{}).get('name','Não informada'),b.get('faith',{}).get('deity') or '—') for b in bs])
    else:add('Sem localidades urbanas cadastradas nesta edição.');add()
    add('#### Rios, florestas e outros lugares');add()
    if places:
        rows=[]
        for x in places:
            note=x['detail'];others=x['states']-{id}
            if others:note=(note+' · ' if note else '')+'Também em '+nation_list(others)
            rows.append((x['name'],x['kind'],note or '—'))
        table(['Nome','Tipo','Observação'],rows)
    else:add('Sem outros elementos nomeados associados a este território.');add()
    routes=[r for r in w['routes'] if r.get('majorRoute') is not False and id in r.get('stateIds',[])]
    if routes:
        add('#### Rotas principais');add()
        for r in sorted(routes,key=lambda r:sortkey(r['name'])):add('- '+esc(r['name'])+' — '+('marítima' if r['kind']=='sea' else 'terrestre')+'.')
        add()
add('## Mares e referências sem vínculo territorial definido');add()
table(['Nome','Tipo'],[(x['name'],x['kind']) for x in geo if not x['states']])
add('## Índice geral de elementos geográficos');add()
table(['Nome','Tipo','Estados / referência territorial'],[(x['name'],x['kind'],nation_list(x['states'])) for x in sorted(geo,key=lambda x:sortkey(x['name']))])
add('## Estradas e rotas marítimas');add()
for major,title in [(True,'Rotas principais'),(False,'Caminhos locais')]:
    add('### '+title);add();rows=[]
    for r in sorted((r for r in w['routes'] if (r.get('majorRoute') is not False)==major),key=lambda r:sortkey(r['name'])):
        stops=r.get('stops') or list(dict.fromkeys(i for i in [r.get('fromCity'),r.get('toCity')] if i in towns))
        rows.append((r['name'],'Marítima' if r['kind']=='sea' else 'Terrestre',' → '.join(towns[i]['name'] for i in stops if i in towns) or 'Traçado por pontos do mapa',nation_list(set(r.get('stateIds',[])))))
    table(['Nome','Tipo','Localidades / escalas','Estados'],rows)
output=base/'Catalogo-de-Silvengard.md';output.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(f'Catalog written: {len(lines)} lines; {len(towns)} cities; {len(geo)} geographic entries; {len(w["routes"])} routes.')
