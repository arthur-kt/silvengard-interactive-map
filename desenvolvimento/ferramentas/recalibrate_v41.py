"""V41: stable physical units, city+hinterland census, income estimates and markets.
Does not edit population totals, political geography, city identities or routes.
"""
from pathlib import Path
import json,math,hashlib,re
ROOT=Path(__file__).resolve().parents[2]
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
CLASSES=['peasant','modest','comfortable','wealthy','aristocratic']
def social(b):
 v=[78,14,6,1.8,.2]
 if b.get('capital'):v=[64,20,12,3.5,.5]
 elif b.get('majorPort'):v=[66,19,11,3.6,.4]
 elif b.get('magicSchool'):v=[52,23,20,4.6,.4]
 elif b.get('dwarvenFortress') or b['state'] in [23,35]:v=[51,28,17,3.6,.4]
 if b['state'] in [29,34]:v=[86,9,4,.8,.2]
 if b['i']==214:v=[76,15,7,1.8,.2]
 if b['i'] in [4,89,1244]:v=[86,9,4,.8,.2]
 if b['i'] in [1239,1240,197]:v=[71,18,8,2.4,.6]
 if b['i']==21:v=[65,19,11,4.2,.8]
 if b['i']==2001:v=[70,20,8,1.8,.2]
 return {'shares':dict(zip(CLASSES,v)),'householdSize':3,'estimated':True}

for base in [ROOT,ROOT.parent/'silvengard-atlas v2']:
 w=read(base/'app/dist/world.json');d=read(base/'app/dist/economy-source.json');states={s['i']:s for s in w['states']}
 if d.get('version')==41:print(base.name,'already migrated');continue
 oldgoods={g['i']:g for g in d['goods']};oldprices={i:g['price'] for i,g in oldgoods.items()}
 # Undo the v40 numerical inflation. These factors never represented new harvests.
 factors={9:60,10:150,11:75,12:200,14:120,17:100,30:750,37:6,64:60,66:120,67:120,68:120}
 caps={};towns={b['i']:b for b in w['cities']}
 for b in w['cities']:
  p=d['profiles'].get(str(b['i'])) or d['profiles'].get(str(d['cityReferences'].get(str(b['i']))),{})
  rows={r['goodId']:r['units']*(b['demographics']['population']+b['demographics'].get('itinerantPopulation',0))/max(1,p.get('population',1)) for r in p.get('production',[])}
  rows.update({int(k):n for k,n in d.get('cityDefaults',{}).get(str(b['i']),{}).items()});rows.update({int(k):n for k,n in w['economyEdits'].get('cityProduction',{}).get(str(b['i']),{}).items()})
  caps[b['i']]={i:n/factors.get(i,1) for i,n in rows.items() if n>0}
  b.setdefault('socialProfile',social(b))
 goods=oldgoods
 def good(i,unit,price,mass,recipe=None,hours=0,unskilled=0,days=0):
  g=goods[i];g.update(unit=unit,price=price,massTonnes=mass,recipes=[{str(k):n for k,n in recipe.items()}] if recipe else [],labourHours=hours,unskilledHours=unskilled)
  g.pop('foodPeopleDays',None);g.setdefault('demandCoverage',{}).pop('food',None)
  if days:g['foodPeopleDays']=days;g['demandCoverage']['food']=days/1000
 # Official D&D references for wheat, salt, iron, copper, precious metals and livestock.
 # Remaining products are declared scenario estimates, not PHB prices.
 good(1,'tonelada',20,1,unskilled=100);good(2,'tonelada',10,1,unskilled=160);good(3,'tonelada',80,1,hours=100,unskilled=200)
 good(4,'lote de 100 kg',22.05,.1,unskilled=240);good(5,'lote de 100 kg',110.23,.1,unskilled=300);good(6,'lote de 100 kg',75,.1,unskilled=300)
 good(7,'lingote de 1 kg',11.02,.001,unskilled=160);good(8,'lingote de 1 kg',110.23,.001,unskilled=400)
 good(9,'saco de 100 kg',2.20,.1,unskilled=40,days=200);good(10,'cabeça',10,.5,unskilled=40)
 good(11,'lote de 100 kg',10,.1,unskilled=160,days=150);good(12,'lote de 100 kg',15,.1,unskilled=240,days=150)
 good(13,'barril de 100 L',20,.1,{9:.2,56:.02},hours=20);good(14,'saco de 100 kg',10,.1,unskilled=80,days=150)
 good(15,'lote de 10 kg',5,.01,unskilled=30);good(16,'saco de 100 kg',11.02,.1,unskilled=120)
 good(17,'saco de 100 kg',8,.1,unskilled=100,days=200);good(18,'cabeça',75,.5,unskilled=240);good(19,'cabeça',200,3,unskilled=600);good(20,'cabeça',50,.5,unskilled=240)
 good(21,'lote de 100 kg',10,.1,unskilled=100);good(22,'pérola',13,.000001,unskilled=100);good(23,'gema',15,.000001,unskilled=140)
 good(24,'lote de 10 kg',30,.01,hours=20,unskilled=40);good(25,'lote de 1 kg',10,.001,hours=8);good(26,'lote de 10 m²',100,.005,hours=120)
 good(27,'lote de 10 kg',44,.01,unskilled=100);good(28,'lote de 1 kg',7,.001,unskilled=80);good(29,'pele',4,.002,unskilled=20);good(30,'cabeça',2,.06,unskilled=30)
 good(32,'barril de 20 L',5,.02,{1:.02},unskilled=20);good(33,'lote de 100 kg',30,.1,unskilled=300)
 good(34,'lote de 100 kg',5,.1,{1:.2},unskilled=50);good(35,'lote de 10 L',4,.01,{14:.05},unskilled=20)
 good(36,'tonelada',70,1,unskilled=200);good(37,'lote de 100 kg',12,.1,unskilled=200)
 goods[37]['name']='Produtos baleeiros'
 good(38,'saco de 100 kg',5,.1,unskilled=100);good(39,'lote de 10 kg',20,.01,unskilled=120);good(40,'lote de 10 kg',20,.01,unskilled=120)
 good(41,'tonelada',5,1,unskilled=80);good(42,'tonelada',8,1,unskilled=80)
 good(43,'lote de 10 kg',10,.01,{10:.02,16:.01},hours=16);good(44,'lote de 10 m²',5,.01,{82:5},hours=8)
 goods[44]['recipes'].append({'21':.1})
 good(45,'conjunto',2,.002,{44:.2,24:.005},hours=2);good(46,'lote de 100 peças',12,.1,{41:.1,34:.2},hours=20)
 good(47,'lote de 100 kg',30,.1,{42:.15,34:.5},hours=50)
 good(48,'lote de 100 m',20,.05,{21:.5},hours=30);good(49,'resma de 500 folhas',10,.0025,{21:.03},hours=15)
 good(50,'frasco de 250 mL',10,.00025,{35:.01,24:.01},hours=8);good(51,'volume',25,.001,{49:.2,50:.1,43:.01},hours=40)
 good(52,'vela de 100 m²',60,.05,{44:10,48:.05},hours=20)
 good(53,'casco marítimo',10000,80,{1:50,32:10,48:10,52:4,80:100},hours=9000)
 good(54,'par',2,.001,{43:.05},hours=3);good(55,'conjunto',4,.002,{43:.1,80:1},hours=6)
 good(56,'barril',2,.02,{1:.025},hours=4);good(57,'lote de 100 kg',125,.1,{5:.88,6:.12,34:.5},hours=40)
 good(58,'conjunto de ferramentas',5,.005,{80:3,1:.001},hours=8)
 good(59,'arma convencional',25,.003,{80:2,34:.02,43:.03,1:.001},hours=40)
 good(60,'lote de 10 kg',25,.01,{33:.075,34:.015,84:1},hours=24)
 good(61,'peça de artilharia de pólvora',1000,.7,{4:4,80:100,1:.5,34:1},hours=1500)
 good(63,'joia',50,.00005,{7:.02,23:1},hours=80)
 good(64,'lote de 100 kg',25,.1,{85:.8,16:.1,56:.05},hours=20,days=180)
 good(65,'barril de 100 L',10,.1,{13:.8},hours=10);good(66,'lote de 10 kg',5,.01,{83:10,16:.002},hours=6,days=25)
 good(67,'barril de 100 L',5,.1,{9:.2,56:.02},hours=8);good(68,'lote de 10 L',10,.01,{9:.1,56:.002},hours=12)
 good(69,'lote de 100 velas',5,.01,{15:.5},hours=8);good(70,'lote de 10 kg',5,.01,{35:.3},hours=10)
 good(71,'frasco',5,.0001,{35:.01,25:.01,47:.0005},hours=8)
 good(72,'lote de 1 kg',75,.001,hours=40);good(73,'arma de osso de dragão',150,.003,{72:.5,80:1,43:.03},hours=120)
 good(74,'lote de 1 kg',300,.001,hours=120);good(75,'arma de Lavanthir',700,.003,{74:.5,80:1,43:.03},hours=200)
 good(76,'arma de forja anã',75,.003,{80:2,34:.03,43:.03},hours=160)
 good(77,'tratado arcano',100,.001,{49:.5,50:.1},hours=240)
 good(78,'casco fluvial ou lacustre',1000,4,{1:5,48:.5,32:2,80:10},hours=1200)
 good(79,'lote de componentes navais',50,.1,{1:.1,80:10,48:.1},hours=80)
 additions=[(80,'Aço','kg',.75,.001,{4:.01,34:.01},1,0),(81,'Armaduras','armadura de campanha',75,.015,{80:10,43:.1,34:.04},160,0),(82,'Lã','kg',1,.001,{},0,2),(83,'Leite','lote de 10 L',.1,.01,{},0,1),(84,'Enxofre','lote de 1 kg',1,.001,{},0,8),(85,'Carne','lote de 100 kg',15,.1,{10:.5,34:.02},4,8)]
 for i,name,unit,price,mass,recipe,hours,unsk in additions:
  goods[i]={'i':i,'name':name,'unit':unit,'price':price,'massTonnes':mass,'tags':['food'] if i in [83,85] else ['military'] if i==81 else [],'kind':'husbandry' if i in [82,83] else 'manufacture' if recipe else 'extraction','recipes':[{str(k):n for k,n in recipe.items()}] if recipe else [],'demandCoverage':{},'labourHours':hours,'unskilledHours':unsk}
 goods[82]['catalysts']={'30':4};goods[83]['catalysts']={'10':.05}
 goods[83].update(foodPeopleDays=3,demandCoverage={'food':.003});goods[85].update(foodPeopleDays=150,demandCoverage={'food':.15})
 goods[81].update(durable=True,annualWear=.04,demandCoverage={'armor':1})
 # Live livestock are never consumed directly as meals. Milk/wool do not kill them.
 for i in [10,30]:goods[i]['demandCoverage']={}
 goods[53]['demandCoverage']={'fleet':1};goods[78]['demandCoverage']={'inlandFleet':1}
 for i in [59,73,75,76]:goods[i]['demandCoverage']={'military':1}
 for g in goods.values():g.setdefault('demandCoverage',{})
 # Cash wages are cost references, not a monthly currency grant.
 d['calibration'].update(version=41,populationScope='city-and-hinterland',ruralPopulation='included-in-locality',ruralDemand=False,ruralSubsistence=False,useSocialLiquidity=True,liquidityMonths=.25,foodDemandPer1000Per30Days=30,physicalFoodUnits=True,workingDays=22,unskilledDailyPO=.2,skilledDailyPO=2,incomeModel='household-reference-estimate',incomeCreatesCoins=False)
 d['calibration']['ruleReference']='https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment'
 d['calibration']['sourceVsAssumptions']='Lifestyle expenses and hireling prices follow Basic Rules 2014. Household size, strata, income multipliers, labour hours and cash shares are scenario estimates.'
 d['goods']=[goods[i] for i in sorted(goods)];d['baseCycleDays']=30
 # Per-locality capacity includes its agricultural hinterland; census is unchanged.
 for b in w['cities']:
  i=b['i'];pop=b['demographics']['population']+b['demographics'].get('itinerantPopulation',0);rows=caps[i];cell=w['cells'][b['cell']]
  if pop<=0 or b['state'] in [0,17]:caps[i]={};continue
  for g in [9,11,10,30,64,66,31,62]:rows.pop(g,None)
  factor={1:.12,2:.2,4:1.05,5:1.1,6:1,7:.9,8:.9,9:.5,10:.25,11:.1,12:.55,13:0,14:0,15:0}.get(cell['biome'],.8)
  if b['state']==23 or b.get('dwarvenFortress'):factor*=.6
  if b['state'] in [31,48]:factor*=1.3
  if i in [4,1244,89]:factor={4:3,1244:3,89:2.5}[i]
  if i==7:factor=1
  if i==2001:factor=0
  rows[9]=round(pop*.15*factor,2)
  if b.get('majorPort'):rows[11]=round(pop*.03,2) # units of 100 kg: about 3 kg/resident/month
  if b['state']==24:rows[17]=round(pop*.04,2)
  if b['state'] in [34,48] or i in [4,89,1244]:
   rows[10]=round(pop*.0004,2);rows[30]=round(pop*.002,2);rows[82]=round(pop*.0005,2);rows[83]=round(pop*.06,2);rows[85]=round(pop*.003,2)
  # General workshops grow within a finite local labour pool, not by a unit multiplier.
  scalable=[g for g in rows if g not in [7,8,9,10,11,12,17,18,20,30,31,53,61,62,72,73,74,75,76,77,78,82,83,85]]
  base_value=sum(rows[g]*goods[g]['price'] for g in scalable)
  target=pop*.15
  growth=min(20,max(1,target/base_value)) if base_value else 1
  for g in scalable:rows[g]=round(rows[g]*growth,3)
  if b['state'] in [13,14,20] and not b.get('magicSchool'):
   rows[59]=round(pop*(.0005 if b['state']==20 else .0004 if b.get('capital') or b.get('citadel') else .00015),2)
   rows[81]=round(rows[59]*.35,2)
  if b['state']==23 or b.get('dwarvenFortress'):
   rows[76]=round(max(rows.get(76,0),pop*.001),2);rows[81]=round(pop*.0004,2)
  if b.get('magicSchool'):rows[59]=0;rows[61]=0
  if b['state']!=20:rows[61]=0
  if i in [7,197,1239,24]:rows[61]={7:2,197:.5,1239:.25,24:.5}[i]
  if i in [1,224,142,18,30,56]:rows[53]={1:1.5,224:1,142:.75,18:.25,30:.25,56:.25}[i]
  if i==2001:rows={58:3,59:2}
  if i==33:rows={74:3,75:2}
  if i==23:rows[72]=6;rows[73]=4
  if i==184:rows[8]=4
  if i==4000:rows[7]=.8;rows.pop(8,None)
  rows.pop(31,None);rows.pop(62,None)
  caps[i]={g:n for g,n in rows.items() if n>0}
 # Supply the chain missing from the imported goods: steel, sulphur, cloth and meat.
 for i in [10,29,36,110,150,238,127,92,4000,7,22,136]:caps[i][80]=max(100,caps[i].get(59,0)*3+caps[i].get(76,0)*3)
 for i in [22,136,9]:caps[i][84]=max(2,caps[i].get(60,0)*1.2)
 for b in w['cities']:
  if b.get('magicSchool') or b['state'] in [33]:caps[b['i']][49]=max(caps[b['i']].get(49,0),4);caps[b['i']][50]=max(caps[b['i']].get(50,0),2)
 # Rural sites retain spatial commodity origins, with no extra residents or duplicate food.
 d['ruralSites']=[{**s,'units':s['units']/factors.get(s['goodId'],1)} for s in d['ruralSites'] if s['goodId'] not in [9,10,11,12,14,17,19,30,31,37]]
 d['cityDefaults']={str(i):{str(g):n for g,n in rows.items()} for i,rows in caps.items()}
 d['profiles']={str(b['i']):{'population':b['demographics']['population']+b['demographics'].get('itinerantPopulation',0),'production':[]} for b in w['cities']}
 w['economyEdits'].update(cityProduction=d['cityDefaults'],foodPer1000=30,initialGoldPerResident=1)
 # Preserve regional relative prices while changing the physical unit once.
 for m in d['markets']:
  m['prices']={str(g):round((m.get('prices',{}).get(str(g),oldprices.get(g,goods[g]['price']))/max(.000001,oldprices.get(g,goods[g]['price'])))*goods[g]['price'],2) for g in goods}
 transfers={b['i']:3 for b in w['cities'] if b['state']==31};transfers.update({13:3,242:3,207:8,233:4,52:4,142:4,199:8})
 for i,market in transfers.items():d['cityMarkets'][str(i)]=market
 d['version']=41;w['economicReview'].update(version=41,date='2026-11-09',populationScope='cidade e entorno rural',ruralCensusAdded=False)
 w['economyStateArchiveV40']=w.get('economyState');w['economyState']={'format':'silvengard-economy-state-v1','cycle':0,'accounts':{},'history':[],'last':None}
 w['savedDefaults']['id']=hashlib.sha256((w['savedDefaults']['id']+'recalibration-v41').encode()).hexdigest();w['authorAtlasDefaults']['id']=w['savedDefaults']['id']
 write(base/'app/dist/world.json',w);write(base/'app/dist/economy-source.json',d)
 # Update the human-editable market source, preserving province/state labels.
 source=ROOT/'Silvengard_Mercados_Atualizado.md';text=source.read_text(encoding='utf-8');rows={}
 for line in text.splitlines():
  if line.startswith('|'):
   fields=[v.strip() for v in line.strip('|').split('|')]
   if len(fields)==4 and fields[0] not in ['Estado','---']:
    b=next((b for b in w['cities'] if b['name']==fields[2] and states[b['state']]['name'].strip()==fields[0]),None)
    if b:rows[b['i']]=fields
 header=text[:text.index('## Localidades por mercado')]
 out=[header+'## Localidades por mercado','']
 for m in d['markets']:
  name=towns[m['centerCity']]['name'];ids=[i for i in rows if d['cityMarkets'].get(str(i))==m['i']]
  out += [f'### Mercado de {name} ({len(ids)} localidades)','', '| Estado | Província | Cidade | Mercado atual |','| --- | --- | --- | --- |']
  for i in ids:out.append('| '+' | '.join(rows[i][:3]+[name])+' |')
  out.append('')
 out += ['### Sem mercado','', '| Estado | Província | Cidade | Mercado atual |','| --- | --- | --- | --- |']
 for i in rows:
  if d['cityMarkets'].get(str(i)) is None:out.append('| '+' | '.join(rows[i][:3]+['—'])+' |')
 (base/'Silvengard_Mercados_Atualizado.md').write_text('\n'.join(out)+'\n',encoding='utf-8')
 print(base.name, 'v41 data prepared',len(goods),'goods; demographics preserved')
