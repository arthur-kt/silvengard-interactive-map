"""Apply the author's approved v40 review to each installation's OWN saved map.

The original proposal is retained. This migration is idempotent and does not
rebuild geography, city identities, provinces, heraldry or historical texts.
"""
import json, pathlib, hashlib, math, sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
TARGETS={1:250000,3:100000,7:1050000,5:8000,10:18000,12:5000,1239:10000,1240:10000,191:12000,61:14000,6:18000,4003:12000,36:18000,45:15000,30:18000,242:3500,129:12000,19:6000}
NOMADS={140:6000,179:5000,143:7000,149:4000,75:2000,138:1500}
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p,data): p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
def apply(base):
 w=read(base/'app/dist/world.json');d=read(base/'app/dist/economy-source.json')
 if w.get('economicReview',{}).get('version')==40: return {'root':str(base),'alreadyApplied':True}
 towns={b['i']:b for b in w['cities']};goods={g['i']:g for g in d['goods']}
 # Freeze actual pre-review workshop capacities before changing urban census sizes.
 for b in w['cities']:
  ref=d['profiles'].get(str(b['i'])) or d['profiles'].get(str(d['cityReferences'].get(str(b['i']))))
  if ref:
   factor=b['demographics']['population']/max(1,ref['population']);profile=json.loads(json.dumps(ref));profile['population']=b['demographics']['population']
   for row in profile['production']:
    row['units']*=factor
    for r in row.get('recipe',[]):r['units']*=factor
   d['profiles'][str(b['i'])]=profile
 for i,n in TARGETS.items():
  b=towns[i];b['demographics'].update(population=n,populationKnown=True);b['population']=n/2000
 for i,n in NOMADS.items():
  b=towns[i];old=b['demographics']['population'];b['demographics'].update(population=n,itinerantPopulation=old-n,populationKnown=True);b['population']=n/2000;b['seasonalVisitors']=round(old*.12)
  # Production still includes linked pastoral communities rather than erasing them.
 b=towns[14];b['demographics'].update(population=0,populationKnown=False);b['population']=0;b['economicStatus']='unknown';b['demographics']['formerKnownEstimate']=3460
 towns[214]['seasonalVisitors']=4000
 # The calibrated capacities remain explicit; population changes do not erase shipyards.
 for b in w['cities']:
  ref=d['profiles'].get(str(b['i']))
  if ref:ref['population']=b['demographics']['population']+b['demographics'].get('itinerantPopulation',0)
 d['cityDefaults']={**d.get('cityDefaults',{})};ed=w['economyEdits'];caps=ed.setdefault('cityProduction',{})
 def setcap(i,rows):
  if i not in towns:return
  dst=caps.setdefault(str(i),{});dst.update({str(g):n for g,n in rows.items()});d['cityDefaults'].setdefault(str(i),{}).update({str(g):n for g,n in rows.items()})
 def replace(i,rows):
  old=d['profiles'].get(str(i),{}).get('production',[])
  setcap(i,{**{r['goodId']:0 for r in old},**{int(k):0 for k in d['cityDefaults'].get(str(i),{})},**rows})
 # Military ownership is different from local industrial gun production.
 for b in w['cities']:
  setcap(b['i'],{31:0})
  if b['state']!=20:setcap(b['i'],{61:0})
  if b['demographics'].get('populationKnown') is False:replace(b['i'],{})
 for i in [72,119,169,170]:
  replace(i,{12:5,43:3,59:3,54:2,1:6,30:4,58:2})
 replace(214,{12:6,43:3,64:3,54:2,29:3});setcap(10,{58:5,76:4,59:1,34:4})
 replace(4003,{77:1.2,49:3,50:2,51:3})
 replace(5,{77:1,49:2,50:1,51:2,47:1})
 for i in [189,2000,4002,168,226]:
  replace(i,{77:round(min(4,max(.5,math.sqrt(towns[i]['demographics']['population']/10000))),2),49:3,50:2,51:3,47:1})
 setcap(4,{9:120,64:8});setcap(12,{64:4,43:3,55:3,56:2});setcap(120,{58:2,64:4,78:1})
 replace(9,{20:6,17:8,16:6,43:4,55:4,54:3,64:6,56:3})
 replace(191,{78:2,64:4,55:2,56:2})
 for i in [15,17,24,28,1239,1240]:setcap(i,{59:3,58:2,43:2,55:2})
 replace(2001,{58:3,59:2})
 replace(6,{58:4,59:3,54:3,55:2,64:5,56:2})
 for i in [129,130,180,182]:replace(i,{49:4,50:2,51:4,64:4,69:1})
 for i in NOMADS:replace(i,{18:8 if i in [140,179] else 5,30:6,10:4,43:4,55:4,64:4,54:2})
 for i in [36,110,150]:setcap(i,{58:3,76:4 if i==36 else 2,59:0,34:4})
 # No invented mountain deposits in the river-and-forest kingdom of Duräk.
 for i in [36,110,150]:setcap(i,{4:0,5:0,6:0,7:0,8:0})
 for i in [92,127,176,177,237,238,239]:setcap(i,{59:0,76:2 if i in [127,238,177] else 1,58:3})
 setcap(29,{4:8,7:1,34:4,58:3,76:3});setcap(25,{58:3,59:2,43:3,64:5})
 for i in [13,154,158,159,207]:setcap(i,{18:5,55:3,59:2,64:3})
 setcap(159,{47:2});setcap(19,{62:0,59:2,55:2,64:3})
 setcap(22,{60:8,61:4,59:6,58:4});setcap(136,{60:5,61:3,59:4})
 # Each unit is a commissioned hull, not the entire industrial fleet or its cargo.
 goods[53].update(name='Navios marítimos',unit='casco',durable=True,annualWear=.04,transport='sea',demandCoverage={'fleet':1},massTonnes=80,process='Casco marítimo durável; exige uma ligação inteiramente aquática. Reparos e tripulação são serviços separados.')
 goods[53]['recipes']=[{'1':4,'32':2,'48':4,'52':4,'58':.5}]
 new=[{'i':78,'name':'Embarcações fluviais e lacustres','unit':'casco','price':18,'tags':['naval','durable'],'kind':'manufacture','durable':True,'annualWear':.06,'transport':'water','demandCoverage':{'inlandFleet':1},'massTonnes':4,'recipes':[{'1':2,'48':1,'32':.5}]},
      {'i':79,'name':'Componentes navais','unit':'lote','price':12,'tags':['naval'],'kind':'manufacture','massTonnes':.5,'demandCoverage':{},'recipes':[{'1':1,'4':.25,'48':.5}]}]
 for g in new:goods[g['i']]=g
 for i,n in {1:15,224:10,142:4,18:2,30:2,56:2}.items():setcap(i,{53:n})
 for i,n in {3:4,13:1,191:2,120:1}.items():setcap(i,{53:0,78:n})
 for b in w['cities']:
  if b.get('majorPort') or b['i'] in [10002,2002,242,45]:
   setcap(b['i'],{11:4,64:2,48:1,79:1,56:2})
 replace(10002,{11:4,64:2,48:1,79:1,56:2})
 for i in [30,242,223]:setcap(i,{62:0})
 setcap(223,{11:4,64:2,48:1,56:2})
 setcap(4000,{7:.8,8:0,58:8,76:4,63:2});setcap(184,{8:4});setcap(23,{72:6,73:4});setcap(33,{74:3,75:2})
 # Durable equipment is installed/maintained, not entirely eaten every month.
 for i in [18,19,20,55,58,59,61,73,75,76]:goods[i].update(durable=True,annualWear=.08)
 goods[31].update(demandCoverage={},eventOnly=True,process='Não há geração periódica de pessoas; a população cativa só muda por eventos históricos explícitos.')
 goods[62].update(demandCoverage={},kind='service',nonStock=True,process='Serviço de cunhagem por conta do proprietário do metal; não cria numerário adicional.')
 for i in [62]:
  for b in w['cities']:setcap(b['i'],{i:0})
 for g in goods.values():
  g.setdefault('massTonnes',.001 if g['i'] in [7,8,23,72,74,77] else .5 if g['i'] in [9,11,12,17,64] else .1)
  if 'food' in g.get('tags',[]):g['foodPeopleDays']=60000*g.get('demandCoverage',{}).get('food',0)
 d['goods']=list(goods.values());d['cityNotes'].update({str(b['i']):('População desconhecida; sem atividade comercial regular confirmada.' if b['i']==14 else 'Oficinas e abastecimento ajustados à história regional.') for b in w['cities']})
 d['cityNotes'].update({'4000':'Prata, ferramentas e forja anã.','184':'Ouro de Fovium.','23':'Ossos de dragão e suas armas.','33':'Lavanthir vulcânico e suas armas.','2001':'Terra morta: apenas oficinas, com abastecimento externo.','10002':'Pesca, conservas, cordas, reparos e serviços portuários.','14':'Cidade perdida; população e atividade atuais desconhecidas.'})
 d['cityServices']={}
 for b in w['cities']:
  if not b['demographics']['population']:continue
  service={}
  if b.get('port') or b.get('majorPort'):service={'dockRate':.01,'repairRate':.005}
  if b.get('magicSchool'):service['researchContracts']=True
  if b['state']==33:service['hospitalityRate']=.005
  if b['i']==214:service['brokerRate']=.005
  if b['i']==6:service['guildRate']=.005
  if service:d['cityServices'][str(b['i'])]=service
 # Each source site keeps its location, except incompatible lore-specific resources.
 oldsites=d['ruralSites'];d['ruralSites']=[]
 for site in oldsites:
  c=w['cells'][site['cell']];g=site['goodId']
  if c['state'] in [0,17] or g in [19,31]:continue
  if c['state']==35 and g in [4,5,6,7,8]:continue
  if c['state']==20 and c['h']>=45 and g in [9,21,28]:site={**site,'goodId':4 if g==28 else 34,'units':2}
  d['ruralSites'].append(site)
 # Conservative cultivation restoration on flat, suitable land, not a continent-wide yield boost.
 proposal=read(base/'app/dist/province-proposal.json');assignment=list(proposal['cellProvinces'])
 for c in w.get('defaultProvinceEdits',{}).get('cells',[]):assignment[c['i']]=c['province']
 for city_id,multiplier in [(1244,2.5),(89,1)]:
  province=assignment[towns[city_id]['cell']];existing=[s for s in d['ruralSites'] if assignment[s['cell']]==province and s['goodId']==9]
  if existing:
   for s in existing:s['units']*=multiplier
  else:
   candidates=[c for c in w['cells'] if assignment[c['i']]==province and c['h']>=20 and c['h']<45 and c['biome'] in [3,4,5,6,7] and c.get('snow',0)<.5]
   for c in candidates[::max(1,len(candidates)//8)][:8]:d['ruralSites'].append({'cell':c['i'],'goodId':9,'units':3})
 # Move Khegosla's former silver capacity to established mineral towns (no new gold origin).
 for i in [127,238,239]:setcap(i,{7:2})
 # Physical and operating assumptions are visible and can be edited later.
 d['calibration']={'version':40,'foodLoadTonnes':.5,'foodPeopleDaysPerCoverage':60000,'foodKgPerPersonDay':.5,'seaHoursPerDay':24,'landHoursPerDay':8,'ruralPopulation':'estimated-density-by-terrain','ruralDemand':True,'durableServiceDays':365,'mintingCreatesMoney':False,'seasonLengthDays':90}
 d['localConditions']={'28':{'label':'Escolta nas terras de monstros','landRisk':.025},'34':{'label':'Feiras sazonais das hordas','seasonal':True}}
 # Preserve neutral Dragonfall/Elucitor; imported Enemy is hostility, not declared war.
 # Campaigns with explicit naval conquest in the established canon remain active wars.
 ed['diplomacy']={k:('War' if v=='Enemy' else v) for k,v in ed.get('diplomacy',{}).items()}
 d['activeWars']=[[20,49],[20,47],[20,31]]
 d['localTradeAgreements']=[{'states':[23,29],'label':'Travessias negociadas entre clãs e salões','rate':1.2},{'states':[12,14],'label':'Licenças e fiscalização de fronteira','rate':1.15}]
 d['version']=40;w['economicReview']={'version':40,'date':'2026-11-09','capitalPopulations':{'Elucitor':1050000,'Velaffeld':250000,'Asgorath':100000},'approved':True,'ruralCensusEstimated':True}
 # Keep users' old saved cycles as an archive; their quantities belong to the old calibration.
 w['economyStateArchive']=w.get('economyState');w['economyState']={'format':'silvengard-economy-state-v1','cycle':0,'accounts':{},'history':[],'last':None}
 # A new baseline id keeps stale per-browser economic settings from shadowing this approved revision.
 w['savedDefaults']['id']=hashlib.sha256((w['savedDefaults']['id']+'approved-economy-v40').encode()).hexdigest();w['savedDefaults']['savedAt']='2026-11-09'
 config=read(base/'scenario-defaults.json')
 for i in TARGETS:config['populations'][str(i)]={'raw':towns[i]['population'],'inhabitants':TARGETS[i],'pairedCity':i}
 write(base/'scenario-defaults.json',config);write(base/'app/dist/world.json',w);write(base/'app/dist/economy-source.json',d)
 return {'root':str(base),'populationKnown':sum(b['demographics']['population'] for b in w['cities']),'itinerants':sum(b['demographics'].get('itinerantPopulation',0) for b in w['cities']),'goods':len(d['goods']),'sites':len(d['ruralSites'])}
if __name__=='__main__':
 for base in [ROOT,ROOT.parent/'silvengard-atlas v2']:print(json.dumps(apply(base),ensure_ascii=False))
