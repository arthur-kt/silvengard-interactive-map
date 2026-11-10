import json,pathlib,shutil,math
base=pathlib.Path(__file__).resolve().parent; src=base.parent/'Mapas'; out=base/'dist'; out.mkdir(exist_ok=True)
d=json.loads(next((src/'Silvengard cells').glob('*Full*')).read_text(encoding='utf-8')); p=d['pack']; ls=(src/'Silvangad 5.0.map').read_text(encoding='utf-8').splitlines()
p['states']=json.loads(ls[169]); p['burgs']=json.loads(ls[170]); p['routes']=json.loads(ls[192]); p['rivers']=json.loads(ls[187])
keep={12:[2,3,4,5,10,11,12,18,23,33,34],13:[7,15,17,20,24,27,28,35,160,161,191,197]}
active=[b for b in p['burgs'] if isinstance(b,dict) and not b.get('removed')]
for s in p['states']:
 if not s.get('name') or s.get('removed'): continue
 bs=[b for b in active if b.get('state')==s['i']]
 if s['i'] not in keep:
  cap=[b for b in bs if b.get('capital')]; others=sorted([b for b in bs if not b.get('capital')],key=lambda b:-b.get('population',0)); keep[s['i']]=[b['i'] for b in cap+others[:max(0,math.ceil(len(bs)*.38)-len(cap))]]
burgs=[]
for b in active:
 z={k:b.get(k) for k in ['i','name','x','y','state','cell','culture','capital','port','citadel','walls','temple','population','type']}; z['visible']=b['i'] in keep.get(b.get('state'),[]); z['source']='Arquivo .map'; z['reference']=b.get('state') in [12,13] and z['visible']; burgs.append(z)
# New reference settlements: image positions mapped approximately onto the original state's land cells.
new=[('Arenor',.23,.63),('Castamor',.62,.91),('Nediora',.50,.95),('Merador',.76,.56),('Getelo',.24,.38),('Pantos',.22,.95),('Condado de Alia',.58,.67)]
el=[c for c in p['cells'] if c['state']==13 and c['h']>=20]; xmin=min(c['p'][0] for c in el); xmax=max(c['p'][0] for c in el); ymin=min(c['p'][1] for c in el); ymax=max(c['p'][1] for c in el)
existing={b['name'].casefold() for b in burgs}
for name,u,v in new:
 if name.casefold() in existing:
  for b in burgs:
   if b['name'].casefold()==name.casefold(): b['visible']=True;b['reference']=True
  continue
 target=[xmin+(xmax-xmin)*u,ymin+(ymax-ymin)*v]; c=min(el,key=lambda c:sum((a-b)**2 for a,b in zip(c['p'],target)))
 burgs.append(dict(i=1000+len(burgs),name=name,x=c['p'][0],y=c['p'][1],state=13,cell=c['i'],culture=c['culture'],capital=0,population=None,type='Localidade',visible=True,reference=True,source='Desenho de Elucitor · posição aproximada; grafia a conferir'))
states=[{k:s.get(k) for k in ['i','name','fullName','color','capital','culture','formName','area','urban','rural','pole','neighbors']} for s in p['states'] if s.get('name') and not s.get('removed')]
coords=d['mapCoordinates']; rivers=[]
geo=json.loads(next((src/'Silvengard cells').glob('*Rivers*')).read_text(encoding='utf-8'))
for f in geo['features']:
 pts=[[(lon-coords['lonW'])/coords['lonT']*1920,(coords['latN']-lat)/coords['latT']*937] for lon,lat in f['geometry']['coordinates']]; rivers.append(dict(name=f['properties'].get('name','Rio'),points=pts))
data=dict(info=d['info'],settings={k:d['settings'][k] for k in ['distanceUnit','distanceScale','populationRate','urbanization','heightExponent']},cells=[{k:c[k] for k in ['i','p','v','c','h','state','biome','culture','pop','r']} for c in p['cells']],vertices=[{k:v[k] for k in ['p','c']} for v in p['vertices']],states=states,cities=burgs,biomes=p['biomes'],cultures=[{k:c.get(k) for k in ['i','name']} for c in p['cultures']],rivers=rivers,routes=[{k:r[k] for k in ['i','group','points']} for r in p['routes']])
from world_updates import apply_updates
data=apply_updates(data,p,base)
from reference_rebuild import rebuild
data=rebuild(data,p,base)
from author_defaults import apply_author_defaults
data=apply_author_defaults(data,base)
from city_defaults import apply_city_defaults
data=apply_city_defaults(data,base)
from network_defaults import apply_network_defaults
data=apply_network_defaults(data)
from canonical_world import finalize_world
data=finalize_world(data)
from source_profiles import apply_source_profiles
data=apply_source_profiles(data,base)
from scenario_defaults import apply_scenario_defaults
data=apply_scenario_defaults(data,base)
from latest_author_defaults import apply_latest_author_defaults
data=apply_latest_author_defaults(data,base)
from persistent_defaults import apply_persistent_defaults
data=apply_persistent_defaults(data,base)
(out/'world.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
for a,b in [('Mapa-elucitor.jpeg','elucitor.jpeg'),('Mapa-dragonfall.jpeg','dragonfall.jpeg')]:shutil.copyfile((base/'references/elucitor-papel-autor.jpeg') if b=='elucitor.jpeg' and (base/'references/elucitor-papel-autor.jpeg').exists() else src/a,out/b)
report={'original_active':len(active),'selected':sum(b['visible'] for b in data['cities']),'added_reference_approximate':len([b for b in burgs if b['i']>=1000]),'states':[{'name':s['name'],'original':sum(b['state']==s['i'] for b in active),'selected':sum(b['state']==s['i'] and b['visible'] for b in data['cities'])} for s in states if s['i']]}
(base/'curadoria.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps(report,ensure_ascii=True))
