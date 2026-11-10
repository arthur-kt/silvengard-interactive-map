"""Compile economic reference data and explicit scenario defaults; no world edits."""
from pathlib import Path
import json,sys,random
base=Path(__file__).resolve().parents[2];sys.path.insert(0,str(base/'app'))
from source_profiles import load_sources
from market_defaults import apply_market_defaults
s=load_sources(base);w=json.loads((base/'app/dist/world.json').read_text(encoding='utf-8'));audit=json.loads((base/'economia-analise-e-correspondencias.json').read_text(encoding='utf-8'))
names=['Madeira','Pedra','Mármore','Ferro','Cobre','Estanho','Prata','Ouro','Grãos','Gado bovino','Peixes','Caça','Vinho','Azeitonas','Mel','Sal','Tâmaras','Cavalos','Elefantes','Camelos','Cânhamo','Pérolas','Gemas','Corantes','Incenso','Seda','Especiarias','Âmbar','Peles','Ovelhas','Escravos','Alcatrão','Salitre','Carvão','Óleo','Mogno','Baleias','Cana-de-açúcar','Chá','Tabaco','Argila','Areia branca','Couro','Tecido','Vestuário','Cerâmica','Vidro','Cordas','Papel','Tinta','Livros','Velas náuticas','Navios','Botas','Arreios','Barris','Bronze','Ferramentas','Armas','Pólvora','Artilharia','Moedas cunhadas','Joias','Alimentos conservados','Vinagre','Queijo','Cerveja','Destilados','Velas','Sabão','Perfume']
units={'pile':'pilha','pallet':'palete','wagon':'carga','bullion':'lingote','wain':'carga','head':'cabeça','barrel':'barril','bag':'saca','pearl':'pérola','gem':'gema','chest':'caixa','bolt':'peça','stone':'pedra','pelt':'pele','slave':'pessoa','roll':'rolo','set':'conjunto','coil':'rolo','ream':'resma','bottle':'frasco','volume':'volume','ship':'navio','pair':'par','cannon':'peça','piece':'peça','vessel':'recipiente','block':'bloco'}
goods=[{'i':g['i'],'name':names[g['i']-1],'unit':units.get(g.get('unit'),'unidade'),'price':g['value'],'tags':g.get('tags',[]),'demandCoverage':g.get('demandCoverage',{}),'recipes':g.get('recipes',[]),'kind':'manufacture' if g.get('recipes') else 'extraction'} for g in audit['sourceGoods']]
goods += [
 {'i':72,'name':'Ossos de dragão','unit':'lote','price':75,'tags':['military','rare'],'recipes':[],'kind':'extraction'},
 {'i':73,'name':'Armas de osso de dragão','unit':'conjunto','price':150,'tags':['military','rare'],'recipes':[{'72':.5,'34':1,'43':.5}],'kind':'manufacture'},
 {'i':74,'name':'Lavanthir','unit':'lote','price':300,'tags':['military','rare'],'recipes':[],'kind':'volcanic-alloy','process':'Liga metálica produzida no vulcão. A composição e os custos dos componentes ainda não foram definidos.'},
 {'i':75,'name':'Armas de Lavanthir','unit':'conjunto','price':700,'tags':['military','rare'],'recipes':[{'74':.5,'34':1,'43':.5}],'kind':'manufacture'},
 {'i':76,'name':'Armas de forja anã','unit':'conjunto','price':75,'tags':['military'],'recipes':[{'4':.5,'34':1,'43':.5}],'kind':'manufacture'}]
goods += [{'i':77,'name':'Pesquisa arcana','unit':'tratado','price':80,'tags':['magic','educational','research'],'demandCoverage':{'research':1},'recipes':[{'49':.5,'50':.25}],'kind':'manufacture','process':'Tratados, fórmulas e métodos arcanos produzidos por escolas de magia. Consome papel, tinta e trabalho especializado.'}]
profiles={str(b['i']):{'population':round(b.get('population',0)*2000),'production':[p for p in b.get('production',[]) if 'goodId' in p]} for b in s['cities'].values()}
cityRefs={str(c['cityId']):c['referenceCityId'] for c in audit['cities']}
def eligible(c,g):
 if c['h']<20 or c['state']==17 or c['biome'] in [13,14,15]:return False
 b=c['biome'];height=c['h'];coast=any(w['cells'][i]['h']<20 for i in c['c'])
 if g in [1,12,15,21,24,25,28,29,36]:return b in [5,6,7,8,9]
 if g in [2,3,4,5,6,7,8,23,34]:return height>=45 or g==4 and b==12 or g==8 and c.get('r',0)>0
 if g in [9,10,13,14,18,19,30,38,39,40]:return b in [3,4,5,6,7,8] and height<50 and c.get('snow',0)<.5
 if g in [17,20]:return b in [1,2]
 if g==16:return coast or b in [1,2]
 if g in [11,22,32,35,37]:return coast
 if g in [41,42]:return height<45 and b not in [10,11]
 return False
p=json.loads((base/'app/dist/province-proposal.json').read_text(encoding='utf-8'));assignment=p['cellProvinces'];ed=w.get('defaultProvinceEdits',{})
for c in ed.get('cells',[]):assignment[c['i']]=c['province']
by_prov={}
for c in w['cells']:
 if c['h']>=20:by_prov.setdefault(assignment[c['i']],[]).append(c)
sites=[];rng=random.Random(28)
for p in audit['provinces']:
 if p['resourceReferenceStatus']=='scenario-blocked':continue
 for r in p['referenceResourceOccurrences']:
  g=r['goodId'];candidates=[c for c in by_prov.get(p['provinceId'],[]) if eligible(c,g)]
  if not candidates:continue
  for i in range(r['referenceOccurrences']):
   c=rng.choice(candidates);yield_units=.2 if g in [7,8,22,23] else 3 if g in [1,9,21,30] else 1
   sites.append({'cell':c['i'],'goodId':g,'units':yield_units})
# The silver working in Fovium was transferred to Liotorn; its gold now goes to Fovium.
sites=[site for site in sites if not (site['goodId']==7 and w['cells'][site['cell']]['state']==28)]
data={'version':32,'markets':[{'i':m['i'],'centerCity':m['centerBurgId'],'color':m['color'],'prices':{g:v['price'] for g,v in m['goods'].items()}} for m in audit['sourceMarkets']],'baseCycleDays':30,'defaultRuralScale':4,'goods':goods,'profiles':profiles,'cityReferences':cityRefs,'ruralSites':sites,'cityMarkets':{str(b['i']):s['cities'].get(cityRefs.get(str(b['i'])),{}).get('market') for b in w['cities']},
 'cityDefaults':{'4000':{'7':.8,'58':8,'76':4,'63':2},'184':{'8':4},'23':{'72':6,'73':4},'33':{'74':3,'75':2},'2001':{'58':3,'59':2}},
 'cityNotes':{'4000':'Extração de prata, metalurgia e forja anã.','184':'Extração de ouro nas terras de Fovium, em Veniun.','23':'Extração de ossos de dragão e manufatura de armas com esse material.','33':'Extração e forja vulcânica de Lavanthir na ilha de Gugacon, em Dragonfall.','2001':'Oficinas militares abastecidas externamente; nenhuma produção de alimentos.'}}
# The approved economic checkpoint replaces the obsolete imported calibration.
checkpoint=base/'economy-review-source.json'
if checkpoint.exists():data=json.loads(checkpoint.read_text(encoding='utf-8'))
data,_=apply_market_defaults(base,data,w)
(base/'app/dist/economy-source.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Economy:',len(goods),'goods;',len(sites),'rural production sites; explicit special resources configured.')
