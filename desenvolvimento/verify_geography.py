import json,pathlib,collections,math,argparse,numpy as np
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
parser=argparse.ArgumentParser();base=pathlib.Path(__file__).resolve().parent.parent;parser.add_argument('--world',default=str(base/'app/dist/world.json'));args=parser.parse_args()
d=json.loads(pathlib.Path(args.world).read_text(encoding='utf-8'));cs=d['cells'];g=d['grid'];bs={x['name']:x for x in d['cities']};byid={x['i']:x for x in d['cities']}
def sample(p):return cs[min(g['rows']-1,max(0,int(p[1]/g['stepY'])))*g['columns']+min(g['columns']-1,max(0,int(p[0]/g['stepX'])))]
def component(start):
 seen={start};q=[start]
 while q:
  for n in cs[q.pop()]['c']:
   if n not in seen and cs[n]['h']>=20:seen.add(n);q.append(n)
 return seen
cast=component(bs['Castamor']['cell']);vit=component(bs['Guernica']['cell']);ros=component(bs['Ros Leones']['cell'])
assert bs['Althor']['cell'] in cast
assert all(bs[n]['cell'] in vit for n in ['Porto do Álamo','Porto de Vern','Lirion','Triovorn'])
assert all(cs[i]['state']==47 for i in vit),'Vitravion must remain an island'
assert len(ros)>20 and bs['Adhuc Vivere']['cell'] not in ros
assert [x['name'] for x in d['cities'] if x['cell'] in ros and not x.get('excluded')]==['Ros Leones'],'Only Ros Leones is allowed on this island, including omitted cities'
# This test deliberately follows the water to the world edge, rather than merely checking an isolated island.
bay=next(l for l in d['landmarks'] if l['name']=='Enseada de Ros Leones');start=sample(bay['point'])['i'];sea={start};q=[start]
while q:
 for j in cs[q.pop()]['c']:
  if j not in sea and cs[j]['h']<20:sea.add(j);q.append(j)
assert any(i<g['columns'] or i>=len(cs)-g['columns'] for i in sea),'Ros Leones basin must open into the ocean'
assert byid[23]['x']==1090.33 and abs(byid[33]['x']-1286)<1e-7
assert sample([bs['Guernica']['x'],bs['Guernica']['y']])['biome']==1
assert cs[bs['Oregon']['cell']]['biome']==1
assert all(cs[bs[n]['cell']]['h']>45 for n in ['Kyon','Mauron'])
assert all(sample(l['point'])['h']<20 for l in d['landmarks'] if l['kind'] in ['lago','mar','baía'])
assert all(sample(l['point'])['h']>35 for l in d['landmarks'] if l['kind']=='montanha')
assert all(cs[x['cell']]['h']>=20 for x in d['cities'] if x['visible'])
for b in d['cities']:
 u=(b['x']-1071.32)/.6+740;dy=b['y']-530.9;v=310+dy/(.4 if dy<0 else .5)
 if 800<u<1045 and 500<v<680 and b['name']!='Adhuc Vivere':assert b.get('excluded'),'An inherited town can reappear in Adhuc'
for r in d['rivers']:
 if r['name'] in ['Rio Talion','Rio Amares']:assert sample(r['points'][-1])['i'] in sea
assert not any('Braço' in r['name'] and 'Adhuc' in r['name'] for r in d['rivers'])
talion=next(r for r in d['rivers'] if r['name']=='Rio Talion');amares=next(r for r in d['rivers'] if r['name']=='Rio Amares')
assert [1071.32+(835-740)*.6,530.9+(485-310)*.5] in talion['points']
assert any(p in amares['points'] for p in talion['points']),'The two rivers meet upstream without a horizontal arm'
vc=d['volcano']['point'];floor=sample(vc)['h'];ring=[sample([vc[0]+7*math.cos(a),vc[1]+7*math.sin(a)])['h'] for a in np.linspace(0,2*math.pi,24,endpoint=False)]
assert min(ring)>floor+1,'Gugacon needs a lowered crater surrounded by a rim'
assert max(ring)<45,'Gugacon volcano is intentionally small'
dracon=next(l for l in d['landmarks'] if l['name']=='Monte Drácon');assert 35<sample(dracon['point'])['h']<46
assert bs['Drácon']['cell'] in component(sample(dracon['point'])['i']),'Dracon town must be on the mountain island'
assert all(bs[n]['settlementClass']=='Forte élfico' and bs[n]['referencePoint'][0]>=1080 for n in ['Lirion','Triovorn','Porto de Vern'])
limiar=next(l for l in d['landmarks'] if l['name']=='Ilha Limiar');assert len(component(sample(limiar['point'])['i']))<100
assert all(l['name'] not in ['Castelo Draco','Ilha Ymir','Campos de trigo de Alia'] for l in d['landmarks'])
assert not d['farmland']
assert cs[bs['Forte Drakis']['cell']]['biome']!=1
assert math.dist([bs['Savhalla']['x'],bs['Savhalla']['y']],[bs['Asgorath']['x'],bs['Asgorath']['y']])<math.dist([bs['Savhalla']['x'],bs['Savhalla']['y']],[bs['Alqa']['x'],bs['Alqa']['y']])
assert cs[bs['Savhalla']['cell']]['state']==12 and cs[bs['Alqa']['cell']]['state']==24
assert max(c['h'] for c in cs if c['state']==28)>65
assert all(c['state'] in [12,13] for c in cs if c['biome']==13)
coastal=[c for c in cs if c['h']>=20 and c['state'] in [12,47] and any(cs[j]['h']<20 for j in c['c'])]
assert max(c['h'] for c in coastal)<35,'High mountain walls may not touch the ocean directly'
assert 'Liotorn' in bs and 'Liotoran' not in bs
assert bs['Arenor']['settlementClass']=='Forte' and bs['Arenor']['walls']
trio=['Triovorn','Lirion','Porto de Vern']
assert all(math.dist([bs[a]['x'],bs[a]['y']],[bs[b]['x'],bs[b]['y']])>=45 for a in trio for b in trio if a!=b),'Elven forts must have room between them'
assert any(c['biome']==12 and c.get('region')=='Pântanos de Nùnar' for c in cs)
assert next(l for l in d['landmarks'] if l['name']=='Lago Cetolo')['kind']=='lago'
assert any(sample(p).get('region')=='Lago Cetolo' and sample(p)['h']<20 for r in d['rivers'] if r['name']=='Rio Celsano' for p in r['points']),'Lake Cetolo must connect to its river'
assert cs[bs['Condado de Alia']['cell']]['h']<26
assert all(not b.get('excluded') and b['visible'] for b in d['cities'] if b.get('islandRestored'))
assert any(c.get('snow',0)>.25 and c['state']==47 for c in cs)
fort_names=['Vostris','Nostris','Ignis','Forte Drakis']
for name in fort_names:
 fort=bs[name];assert fort['state']==13 and cs[fort['cell']]['state']==13
 assert fort['referencePoint'][1]>175 and cs[fort['cell']].get('region')!='Bosque de Ereth'
 assert all(cs[j]['state']==13 for j in cs[fort['cell']]['c']),'Imperial fort must not be an enclave in Dragonfall'
assert cs[bs['Malacatt']['cell']]['state']==12 and cs[bs['Savhalla']['cell']]['state']==12
assert cs[bs['Savhalla']['cell']]['biome']==1
assert all(c['biome']!=1 for c in cs if c['state']==24 and c['h']>=42),'Husaj mountains must not be sand desert'
assert any(l['name']=='Pântanos de Nùnar' for l in d['landmarks'])
ereth=next(l for l in d['landmarks'] if l['name']=='Bosque de Ereth');assert sample(ereth['point'])['state']==12
assert cs[bs['Ereth']['cell']]['state']==12 and bs['Ereth']['y']<435
assert cs[bs['Jalha']['cell']]['state']==14
dragon_seen={bs['Asgorath']['cell']};dragon_q=list(dragon_seen)
while dragon_q:
 for j in cs[dragon_q.pop()]['c']:
  if j not in dragon_seen and cs[j]['h']>=20 and cs[j]['state']==12:dragon_seen.add(j);dragon_q.append(j)
assert bs['Ereth']['cell'] in dragon_seen and sample(ereth['point'])['i'] in dragon_seen,'Ereth must connect broadly to Dragonfall'
assert any(c['biome']==12 and c['state']==32 for c in cs),'Swamps extend inside Goblinburgo'
assert d['islandSelection']['draconMainland']==10 and d['islandSelection']['draconSelected']==10
assert bs['Fermaletim']['visible'] and bs['Sobral']['visible']
assert bs['Ros Leones']['referencePoint']==[905,720]
assert any(c['biome']==13 and any(cs[n]['h']<20 for n in c['c']) for c in cs),'Dead forest must touch the coast'
assert all(c.get('snow',0)>=.5 for c in cs if c['h']>=20 and c['p'][1]<120)
assert any(l['name']=='Garganta de Tharok' for l in d['landmarks'])
vir=bs['Vir'];strip=[c for c in cs if c['state']==47 and abs(c['p'][0]-vir['x'])<16 and vir['y']-28<c['p'][1]<vir['y']-4]
assert strip and all(c['biome'] in [1,4] for c in strip),'No forest barrier between Vir and the desert'
dunga=next(l for l in d['landmarks'] if l['name']=='Dungabás');assert sample(dunga['point'])['biome']==13 and sample(dunga['point'])['state']==12
assert sample(dunga['point'])['i'] in dragon_seen,'Dungabas must connect to Dragonfall rather than form an enclave'
assert cs[bs['Quegosola']['cell']]['state']==26
assert not any(l['name']=='Dunga-Bal' for l in d['landmarks'])
ruins=next(l for l in d['landmarks'] if l['name']=='Ruínas de Amestris');assert sample(ruins['point'])['state']==12 and sample(ruins['point'])['biome']==1
amestris=next(r for r in d['rivers'] if r['name']=='Rio Amestris');assert sample(amestris['points'][0])['h']>35 and sample(amestris['points'][-1])['h']<20
assert any(r['name']=='Rio Colozard' for r in d['rivers'])
ask=next(l for l in d['landmarks'] if l['name']=='Ask-Lozard');highest=max(cs,key=lambda c:c['h']);assert math.dist(highest['p'],ask['point'])<10 and highest['h']<90
for n in ['Althor','Tramor','Lorvus','Fermaletim']:assert cs[bs[n]['cell']].get('snow',0)==0
assert cs[bs['Danumbria']['cell']]['biome']==6
alnien=next(l for l in d['landmarks'] if l['name']=='Ruínas de Alnien');assert sample(alnien['point']).get('snow',0)==0
assert cs[bs['Arenor']['cell']].get('snow',0)>.3
assert not any(c['biome']==16 for c in cs),'No autumn groves: evergreen pine transitions'
assert not byid[203]['visible'] and byid[85]['visible'],'Sablarumrith omitted; Glouyaloss included'
counts=collections.Counter(b['state'] for b in d['cities'] if b['visible'])
assert all(counts[s]==n for s,n in {23:7,28:3,48:6,31:6,49:7,20:10,46:9,35:3,34:9,33:3}.items())
assert all(b['state']==cs[b['cell']]['state'] for b in d['cities'] if b['visible']),'Visible cities must match their physical state'
for country in [12,13,14,17,24,26]:
 owned={i for i in cast if cs[i]['state']==country}
 if not owned:continue
 reached={next(iter(owned))};queue=list(reached)
 while queue:
  for j in cs[queue.pop()]['c']:
   if j in owned and j not in reached:reached.add(j);queue.append(j)
 assert reached==owned,f'Inland political fragment in state {country}'
ganir=next(l for l in d['landmarks'] if l['name']=='Monte Ganir');assert sample(ganir['point'])['state']==14
assert all(c['p'][1]>=685 for c in cs if c['state']==17 and c['h']>=20),'Northern Valar spur must be divided between Elucitor and Navi'
assert ruins['point'][1]<bs['Savhalla']['y'] and ruins['point'][0]<980
assert math.dist(ruins['point'],next(l['point'] for l in d['landmarks'] if l['name']=='Lago das Lágrimas'))>60
print('PASS: Ros Leones opens into ocean; exclusive cities; connected river arms; correct Limiar; elf forts; Savhalla and Alqa; mountain coastal aprons.')
print('Gugacon crater / rim:',round(floor,2),round(min(ring),2),round(max(ring),2),'Dracon peak:',sample(dracon['point'])['h'])
# Actual rendered-mesh plan view for visual geography QA, rather than a city-count-only check.
colors=['#315362','#c9b77e','#a8a782','#b3b37d','#b5c58e','#80a46c','#6b9c75','#478361','#5d8d72','#6b8c7f','#b7c0ad','#e5e8df','#7e9c82','#858374','#929995','#6a5749','#a39b67']
fig,axes=plt.subplots(1,3,figsize=(24,10),facecolor='#142c35')
for ax,sid,title in zip(axes,[12,13,47],['Dragonfall · registro do papel','Elucitor · costa e lagos do papel','Vitravion · papel prioritário']):
 ax.set_facecolor('#315362');cc=[c for c in cs if c['state']==sid];verts=[];face=[]
 for c in cc:
  x,y=c['p'];sx=g['stepX']/2;sy=g['stepY']/2;verts.append([(x-sx,y-sy),(x+sx,y-sy),(x+sx,y+sy),(x-sx,y+sy)]);face.append(colors[0] if c['h']<20 else colors[c['biome']])
 ax.add_collection(PolyCollection(verts,facecolors=face,edgecolors='none'));ax.autoscale();ax.set_aspect('equal');ax.invert_yaxis();ax.tick_params(colors='#a9bbbb');ax.set_title(title,color='#e9d6a7',fontsize=15)
 for r in d['rivers']:
  if r.get('source')=='Rede hídrica traçada do papel' and r.get('state')==sid:ax.plot([p[0] for p in r['points']],[p[1] for p in r['points']],color='#357582',lw=1)
 for x in d['cities']:
  if x['visible'] and x['state']==sid:ax.scatter(x['x'],x['y'],s=20,c='#f8e2b2',edgecolors='#193336',linewidths=.5);ax.annotate(x['name'],(x['x'],x['y']),xytext=(4,4),textcoords='offset points',color='#fff3d2',fontsize=7)
 for l in d['landmarks']:
  c=sample(l['point'])
  if l['kind']=='lago' and c['state']==sid:ax.annotate(l['name'],l['point'],color='#b7e8f4',fontsize=8,fontstyle='italic',ha='center')
 ax.margins(.05)
fig.tight_layout();fig.savefig(base/'acervo/previas/diagnostico-v9.png',dpi=110,facecolor=fig.get_facecolor());print('PASS semantic geography checks. Mesh',len(cs),'cells. Selected',sum(x['visible'] for x in d['cities']))
