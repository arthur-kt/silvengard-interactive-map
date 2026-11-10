"""Read-only economic audit and adaptation proposal. Does not change atlas defaults."""
from pathlib import Path
from collections import Counter,defaultdict
import hashlib,json,math,sys

base=Path(__file__).resolve().parents[2];sys.path.insert(0,str(base/'app'))
from source_profiles import load_sources

world_path=base/'app/dist/world.json';map_path=base.parent/'Mapas/Silvangad 5.0.map'
hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [world_path,map_path]}
w=json.loads(world_path.read_text(encoding='utf-8'));source=load_sources(base);lines=map_path.read_text(encoding='utf-8').splitlines()
goods={g['i']:g for g in json.loads(lines[196])};markets=json.loads(lines[197]);deals=json.loads(lines[198]);by_deal={d['i']:d for d in deals}
resources=[int(x) for x in lines[195].split(',')];old_cells=source['full']['pack']['cells'];old=source['cities'];states={s['i']:s for s in w['states']}
proposal=json.loads((base/'app/dist/province-proposal.json').read_text(encoding='utf-8'));edits=w.get('defaultProvinceEdits',{});deleted=set(edits.get('deleted',[]));provinces={p['i']:{**p,'name':edits.get('names',{}).get(str(p['i']),p['name'])} for p in proposal['provinces'] if p['i'] not in deleted}
for p in edits.get('created',[]):provinces[p['i']]=dict(p)
assignments=list(proposal['cellProvinces'])
for c in edits.get('cells',[]):assignments[c['i']]=c['province']
def province_at(index):
 c=w['cells'][index];p=provinces.get(assignments[index]);return p if p and c['h']>=20 and p['state']==c['state'] else None
def normalized(text):return ''.join(c for c in text.lower() if c.isalnum())
def output(b):
 made=Counter();inputs=Counter()
 for item in b.get('production',[]):
  if 'goodId' not in item:continue
  made[item['goodId']]+=item['units']
  for r in item.get('recipe',[]):inputs[r['goodId']]+=r['units']
 return made,inputs
def rows(values):return [{'goodId':g,'name':goods[g]['name'],'sourceUnits':round(n,5),'unit':goods[g].get('unit')} for g,n in sorted(values.items()) if n>0]

anchors=[(b,old[b['i']]) for b in w['cities'] if b['i'] in old]
def reference_target(original):
 # Reconstructed political ownership follows current city anchors, including
 # deliberate border changes. An omitted city is never reinstated.
 candidates=[(b,o) for b,o in anchors if o['state']==original['state']]
 if not candidates:return None,'unmatched'
 own_province=source['provinceCells'][original.get('cell',-1)] if 0<=original.get('cell',-1)<len(source['provinceCells']) else None
 same=[(b,o) for b,o in candidates if source['provinceCells'][o['cell']]==own_province]
 pool=same or candidates
 b,_=min(pool,key=lambda pair:math.hypot(pair[1]['x']-original['x'],pair[1]['y']-original['y']))
 return b,'original-province-anchor' if same else 'nearest-original-city-in-state'

native_refs={};province_refs=defaultdict(list);city_output={}
for i,b in old.items():
 made,inputs=output(b);city_output[i]=(made,inputs)
 live=next((c for c in w['cities'] if c['i']==i),None)
 target,method=(live,'retained-identity') if live else reference_target(b)
 p=province_at(target['cell']) if target else None
 native_refs[i]={'originalCityId':i,'originalName':b['name'],'retained':bool(live),'anchorCityId':target['i'] if target else None,'targetProvinceId':p['i'] if p else None,'method':method}
 if p:province_refs[p['i']].append(i)

sites=defaultdict(Counter);unmapped=Counter()
for i,g in enumerate(resources):
 if not g or g not in goods:continue
 c=old_cells[i]
 if c['h']<20:unmapped['water-resource-sites']+=1;continue
 proxy={'x':c['p'][0],'y':c['p'][1],'cell':i,'state':c['state']};b,method=reference_target(proxy);p=province_at(b['cell']) if b else None
 if p:sites[p['i']][g]+=1
 else:unmapped['land-resource-sites-without-anchor']+=1

terrain=defaultdict(Counter)
for c in w['cells']:
 p=province_at(c['i'])
 if not p:continue
 t=terrain[p['i']];t['cells']+=1
 if c['biome'] in [3,4,5,6,7,8] and c.get('snow',0)<.65:t['fertileOrTemperateCells']+=1
 if c['biome'] in [5,6,7,8,9]:t['forestCells']+=1
 if c['h']>=50:t['mountainCells']+=1
 if c['biome'] in [13,14,15]:t['deadOrVolcanicCells']+=1
 if any(w['cells'][j]['h']<20 for j in c['c']):t['coastalCells']+=1

city_profiles=[];reference_reuse=defaultdict(list)
for b in w['cities']:
 p=province_at(b['cell']);native=old.get(b['i']);donor=native;method='retained-identity'
 if not donor:
  donor=old.get(b.get('sourceProfile',{}).get('sourceCityId'));method='existing-local-analogue'
  if donor and donor['state']!=b['state']:donor=None
  if not donor:
   local=[(a,o) for a,o in anchors if a['state']==b['state'] and (not p or province_at(a['cell']) and province_at(a['cell'])['i']==p['i'])]
   if not local:local=[(a,o) for a,o in anchors if a['state']==b['state']]
   if local:donor=min(local,key=lambda pair:math.hypot(pair[0]['x']-b['x'],pair[0]['y']-b['y']))[1]
   method='nearest-current-regional-anchor'
 made,inputs=city_output[donor['i']] if donor else (Counter(),Counter())
 status='reference-portfolio';suggested=set(made);notes=[];blocked=[]
 if b['state']==17:
  status='no-economic-activity';suggested.clear();notes.append('Valar: nenhuma produção, extração ou mercado ativo. Estoques antigos não geram atividade.')
 elif b['demographics']['population']==0:
  status='uninhabited';suggested.clear();notes.append('Localidade sem habitantes: produção urbana e demanda comercial desativadas.')
 elif b['i']==2001 or normalized(b['name']) in ['adhucvivere','aducvivere']:
  status='military-workshop-proposal';suggested={58,59};notes.extend(['Produção de alimentos e extração rural bloqueadas na terra morta.','Proposta: oficinas de armas, ferramentas e manutenção militar; capacidade depende de insumos importados.','Alimentos podem ser importados para abastecer a guarnição, sem produção local.'])
 else:
  if w['cells'][b['cell']]['biome'] in [13,14,15]:
   food={g for g in suggested if 'food' in goods[g].get('tags',[])};suggested-=food;blocked+=sorted(food);notes.append('Alimentos removidos do perfil urbano por incompatibilidade com o terreno morto/vulcânico; rever capacidade agrícola no entorno.')
  if not (b.get('port') or b.get('majorPort')) and 53 in suggested:
   suggested.remove(53);blocked.append(53);notes.append('Construção de navios não transferida para uma cidade sem porto atual.')
  if b.get('dwarven'):
   notes.append('Especialização proposta: metalurgia, ferramentas e armamentos; mineração depende de jazidas locais confirmadas, sem presumir ouro ou ferro pela cultura.')
   if not native:
    suggested.update([58,59]);status='dwarven-workshop-proposal';notes.append('O portfólio da referência demográfica não define sozinho a economia da fortaleza anã. Capacidade e oferta de metal ainda precisam de calibração.')
  if b.get('magicSchool'):
   suggested.update([49,50,51]);notes.append('Escola de magia: proposta de produção/circulação de papel, tinta e livros, condicionada aos insumos; não acrescentar mercadorias mágicas inexistentes no catálogo.')
  if b.get('port') or b.get('majorPort'):
   notes.append('Serviços propostos: entreposto, armazenagem e reparos. Um porto não implica automaticamente um estaleiro produtor de navios.')
  if b['i']==1244:notes.append('Alia: centro rural fértil; lavouras e criação pertencem à produção rural provincial, sem duplicá-las como produção urbana.')
 if donor:reference_reuse[donor['i']].append(b['i'])
 city_profiles.append({'cityId':b['i'],'name':b['name'],'stateId':b['state'],'provinceId':p['i'] if p else None,'population':b['demographics']['population'],'role':('academy' if b.get('magicSchool') else 'dwarven-fortress' if b.get('dwarven') else 'fortress' if b.get('settlementClass','').startswith('Forte') else 'major-port' if b.get('majorPort') else 'city'), 'referenceCityId':donor['i'] if donor else None,'referenceCityName':donor['name'] if donor else None,'matching':method,'sourceOutput':rows(made),'sourceInputs':rows(inputs),'suggestedGoods':[{'goodId':g,'name':goods[g]['name']} for g in sorted(suggested)],'suggestedQuantity':None,'blockedGoodIds':blocked,'status':status,'notes':notes})

prov_profiles=[]
for id,p in provinces.items():
 cities=[c for c in city_profiles if c['provinceId']==id];reference_ids=province_refs[id];names=[old[i]['name'] for i in reference_ids]
 local_goods=set(g['goodId'] for b in cities for g in b['suggestedGoods']);t=terrain[id];role=[];suppressed=[]
 if p['state']==17:local_goods=set();resource_rows=[];role=['Terra morta: atividade econômica integralmente bloqueada.']
 else:
  resource_rows=[{'goodId':g,'name':goods[g]['name'],'referenceOccurrences':n} for g,n in sites[id].most_common()]
  if any(b['cityId']==2001 for b in cities):
   resource_rows=[];local_goods={58,59};role=['Zona militar abastecida externamente; sem lavouras, pecuária, caça, pesca ou fabricação de alimentos.']
  else:
   if t['fertileOrTemperateCells']:role.append('Área agrícola/florestal possível, a confirmar com as referências locais; ocorrências originais são indícios, não volume produzido.')
   if t['mountainCells']:role.append('Mineração/cantaria possíveis onde existirem ocorrências compatíveis; não criar jazidas só pela cultura anã.')
   if t['coastalCells']:role.append('Acesso costeiro: separar pesca, entreposto comercial e construção naval.')
 prov_profiles.append({'provinceId':id,'name':p['name'],'stateId':p['state'],'currentCities':[b['cityId'] for b in cities],'urbanPopulation':sum(b['population'] for b in cities),'originalReferenceCities':[{'i':i,'name':old[i]['name'],'retained':native_refs[i]['retained']} for i in reference_ids],'referenceResourceOccurrences':resource_rows,'resourceReferenceStatus':'scenario-blocked' if p['state']==17 or any(b['cityId']==2001 for b in cities) else 'regional-reference' if resource_rows else 'unmapped-not-zero','terrain':dict(t),'suggestedGoods':[{'goodId':g,'name':goods[g]['name']} for g in sorted(local_goods)],'suggestedQuantity':None,'notes':role})

production_shapes=Counter(tuple(x.keys()) for b in old.values() for x in b.get('production',[]))
integrity={'duplicateDealIds':len(deals)-len(by_deal),'missingProductionDealReferences':sum(x['dealId'] not in by_deal for b in old.values() for x in b.get('production',[]) if 'dealId' in x),'sourceCellResources':len(resources),'sourceCells':len(old_cells)}
assert integrity['duplicateDealIds']==integrity['missingProductionDealReferences']==0
assert len(resources)==len(old_cells)
assert all(not b['suggestedGoods'] for b in city_profiles if b['stateId']==17 or b['population']==0)
assert all('food' not in goods[g['goodId']].get('tags',[]) for b in city_profiles if b['cityId']==2001 for g in b['suggestedGoods'])
assert len({r['originalCityId'] for r in native_refs.values()})==len(old)
audit={'format':'silvengard-economy-audit-v1','status':'analysis-and-adaptation-proposal-not-applied','sourceSha256':source['sha256'],'worldDefaultsId':w.get('savedDefaults',{}).get('id'),'summary':{'goods':len(goods),'originalCities':len(old),'currentCities':len(w['cities']),'retainedOriginalIdentities':len(anchors),'omittedOriginalCities':len(old)-len(anchors),'currentProvinces':len(provinces),'markets':len(markets),'transactions':len(deals),'cityProductionRecords':sum('goodId' in x for b in old.values() for x in b.get('production',[])),'cityTransactionReferences':sum('dealId' in x for b in old.values() for x in b.get('production',[]))},'integrity':integrity,
 'implementationRules':['Identidade da cidade tem prioridade para oficinas e indústria; recursos rurais seguem a geografia reconstruída e as províncias atuais.','Cidades omitidas não reaparecem nem acrescentam fábricas ou população. Seus dados servem de referência regional.','Um recurso por célula é uma ocorrência/potencial; não representa toneladas, renda ou produção efetiva.','O estoque de um mercado é compartilhado e deve ser contado uma única vez, não copiado para cada cidade ou província.','Entradas dealId da produção apontam para transações; não somar novamente como produtos fabricados.','Separar produção bruta, consumo intermediário, consumo da população, saldo disponível, importações e exportações.','Não somar unidades incompatíveis, nem atribuir período diário/anual ou moeda de RPG sem calibração.','Produção provincial = produção urbana única + produção rural única; comércio interno se anula no saldo externo.','Referências repetidas para cidades sintéticas precisam de divisão/calibração de capacidade; não copiar a produção integral várias vezes.','Usar as rotas atuais para logística; transações antigas não criam novas estradas nem novas rotas marítimas.'],
 'scenarioPolicies':{'Valar':{'production':'zero','extraction':'zero','activeMarkets':False,'commercialDemand':'zero'},'Adhuc Vivere':{'foodProduction':'zero','ruralExtraction':'zero','militaryWorkshops':'proposed-dependent-on-imports','foodImports':'allowed','inputs':['iron','coal','leather','tools']},'uninhabitedCities':{'urbanProduction':'zero','commercialDemand':'zero'}},
 'sourceGoods':list(goods.values()),'sourceMarkets':markets,'sourceTransactions':deals,'originalCityMapping':list(native_refs.values()),'cities':city_profiles,'provinces':prov_profiles,'reusedReferenceCities':[{'sourceCityId':i,'sourceName':old[i]['name'],'currentCityIds':ids} for i,ids in reference_reuse.items() if len(ids)>1],'unmappedResourceSites':dict(unmapped),
 'unresolvedCalibration':['Período econômico e equivalência das unidades comerciais em peso/volume.','Moeda, significado exato de product/treasury e reaproveitamento dos preços antigos.','Nível de tecnologia: o catálogo original inclui pólvora e artilharia.','Capacidade inicial das oficinas novas, sem pressupor fábricas ou minas não estabelecidas na história.']}
out=base/'economia-analise-e-correspondencias.json';out.write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
for path,digest in hashes.items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==digest,'Source/defaults unexpectedly changed'
print(json.dumps(audit['summary'],ensure_ascii=True));print('PASS: source references valid; scenario restrictions checked; .map and atlas defaults unchanged.');print(out.name)

# Standalone, readable review artifact. All source values remain references;
# proposed profiles never receive invented output quantities or prices.
from html import escape as h
translated=['Madeira','Pedra','Mármore','Ferro','Cobre','Estanho','Prata','Ouro','Grãos','Gado bovino','Peixes','Caça','Vinho','Azeitonas','Mel','Sal','Tâmaras','Cavalos','Elefantes','Camelos','Cânhamo','Pérolas','Gemas','Corantes','Incenso','Seda','Especiarias','Âmbar','Peles','Ovelhas','Escravos','Alcatrão','Salitre','Carvão','Óleo','Mogno','Baleias','Cana-de-açúcar','Chá','Tabaco','Argila','Areia branca','Couro','Tecido','Vestuário','Cerâmica','Vidro','Cordas','Papel','Tinta','Livros','Velas náuticas','Navios','Botas','Arreios','Barris','Bronze','Ferramentas','Armas','Pólvora','Artilharia','Moedas','Joias','Alimentos conservados','Vinagre','Queijo','Cerveja','Destilados','Velas','Sabão','Perfume']
gn=lambda id:translated[id-1] if 1<=id<=len(translated) else goods[id]['name']
fmt=lambda n:f'{n:,}'.replace(',','.')
tags=lambda entries:', '.join(h(gn(g['goodId'])) for g in entries) or 'Nenhum'
city_by={c['cityId']:c for c in city_profiles}
parts=['<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Economia de Silvengard — análise</title><style>body{font:15px system-ui;background:#10252d;color:#e4e8df;margin:0}main{max-width:1200px;margin:auto;padding:32px}h1,h2{font-family:Georgia;color:#e6ca8f}p,li{line-height:1.7}small,.muted{color:#adbfbd}section{background:#19343d;border:1px solid #41595b;padding:20px;margin:20px 0;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{text-align:left;vertical-align:top;border-bottom:1px solid #40545a;padding:12px 8px}th{color:#e6ca8f}details{margin-top:8px}summary{cursor:pointer;color:#ddc592}input{padding:12px;width:min(550px,90%);background:#10252d;color:#fff;border:1px solid #738882;border-radius:5px}.scroll{overflow:auto}.notice{border-left:3px solid #dfc489;padding-left:16px}.stats{display:flex;gap:12px;flex-wrap:wrap}.stats span{padding:14px;background:#24434c;border-radius:6px}a{color:#e6ca8f}</style><main><h1>Economia de Silvengard</h1><p class="muted">Análise do arquivo original e proposta de adaptação às cidades, províncias e geografia atuais.</p><p class="notice">Este relatório não altera o Atlas. Mercadorias sugeridas são perfis para revisão; as quantidades atuais ainda não foram simuladas.</p><div class="stats">']
for n,label in [(71,'mercadorias'),(239,'cidades originais'),(152,'cidades atuais'),(len(provinces),'províncias atuais'),(10,'mercados'),(5414,'transações')]:parts.append('<span><b>'+fmt(n)+'</b> '+label+'</span>')
parts.append('</div><section><h2>Como adaptar</h2><ol>')
for text in audit['implementationRules']:parts.append('<li>'+h(text)+'</li>')
parts.append('</ol></section><section><h2>Restrições do cenário</h2><p><b>Valar:</b> nenhuma produção, extração, demanda comercial ou mercado ativo.</p><p><b>Adhuc Vivere:</b> sem produção alimentar ou extração rural. Oficinas de armas e ferramentas podem operar com matérias-primas importadas. A guarnição pode receber alimentos.</p><p><b>Nilhelm e outras localidades desabitadas:</b> nenhuma produção urbana ativa.</p></section><h2>Cidades — perfis e referências</h2><input id="search" type="search" placeholder="Filtrar cidade, estado, província ou mercadoria…"><div class="scroll"><table id="cities"><thead><tr><th>Cidade / estado</th><th>Província atual</th><th>Perfil produtivo para revisão</th></tr></thead><tbody>')
for c in sorted(city_profiles,key=lambda c:(states[c['stateId']]['name'],c['name'])):
 p=provinces.get(c['provinceId']);notes=''.join('<li>'+h(n)+'</li>' for n in c['notes'])
 source_rows='; '.join(h(gn(g['goodId']))+': '+str(g['sourceUnits'])+' '+h(g['unit'] or 'unidades') for g in c['sourceOutput']) or 'Sem produção registrada'
 parts.append('<tr><td><b>'+h(c['name'])+'</b><br>'+h(states[c['stateId']]['name'].strip())+'<br><small>'+fmt(c['population'])+' habitantes</small></td><td>'+h(p['name'] if p else 'Não atribuída')+'</td><td>'+tags(c['suggestedGoods'])+'<details><summary>Critérios e dados de referência</summary><ul>'+notes+'</ul><p>Referência: '+h(c['referenceCityName'] or 'Não definida')+'. Produção no original: '+source_rows+'.</p><p class="muted">Estas quantidades pertencem à referência original; não são a produção implantada da cidade atual.</p></details></td></tr>')
parts.append('</tbody></table></div><h2>Províncias — composição territorial</h2><div class="scroll"><table><thead><tr><th>Província / estado</th><th>Cidades atuais</th><th>Referências rurais e critérios</th></tr></thead><tbody>')
for p in sorted(prov_profiles,key=lambda p:(states[p['stateId']]['name'],p['name'])):
 rural=', '.join(h(gn(g['goodId']))+' ('+str(g['referenceOccurrences'])+' ocorrências originais)' for g in p['referenceResourceOccurrences'])
 if not rural:rural='Atividade bloqueada pelo cenário.' if p['resourceReferenceStatus']=='scenario-blocked' else 'Sem correspondência rural suficiente; não significa produção zero.'
 parts.append('<tr><td><b>'+h(p['name'])+'</b><br>'+h(states[p['stateId']]['name'].strip())+'</td><td>'+', '.join(h(city_by[i]['name']) for i in p['currentCities'])+'</td><td>'+rural+'<details><summary>Critérios e localidades originais próximas</summary><ul>'+''.join('<li>'+h(n)+'</li>' for n in p['notes'])+'</ul><p>'+', '.join(h(r['name']) for r in p['originalReferenceCities'])+'</p><p class="muted">Localidades omitidas servem de referência; não são reintroduzidas como cidades ou fábricas.</p></details></td></tr>')
parts.append('</tbody></table></div><section><h2>Calibrações pendentes</h2><ul>'+''.join('<li>'+h(n)+'</li>' for n in audit['unresolvedCalibration'])+'</ul><p>As unidades do original são heterogêneas (cabeças de gado, cargas, conjuntos, barris). Os dados de caixa, preço e transações são um retrato da simulação antiga, não um orçamento atual do cenário.</p></section><script>document.querySelector("#search").addEventListener("input",e=>{const norm=s=>s.normalize("NFD").replace(/\\p{Diacritic}/gu,"").toLowerCase(),q=norm(e.target.value);for(const r of document.querySelectorAll("#cities tbody tr"))r.hidden=!norm(r.textContent).includes(q)});</script></main></html>')
report=base/'Analise-economia-Silvengard.html';report.write_text(''.join(parts),encoding='utf-8');print(report.name)
