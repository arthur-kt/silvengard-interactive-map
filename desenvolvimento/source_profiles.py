"""Import factual settlement/state data; keep inferred references explicit."""
import copy
import hashlib
import json
import math
import re
import unicodedata
from pathlib import Path

RELATIONS={'Ally':'Aliança','Friendly':'Amistosa','Neutral':'Neutra','Suspicion':'Desconfiança',
           'Rival':'Rivalidade','Enemy':'Inimizade','Vassal':'Vassalo','Suzerain':'Suserano','Unknown':'Desconhecida','x':'Não registrada'}
GOVERNMENTS={'Viceroyalty':'Vice-reino','Empire':'Império','Kingdom':'Reino','Despotate':'Despotado',
 'Principality':'Principado','Free Territory':'Território livre','Council':'Conselho','Caliphate':'Califado',
 'Federation':'Federação','Tribes':'Tribos','Oligarchy':'Oligarquia','Commune':'Comuna','Holy State':'Estado teocrático',
 'United Hordes':'União de hordas','United Kingdom':'União de reinos','United Provinces':'União de províncias'}

def norm(text):
    return re.sub(r'[^a-z0-9]+','',unicodedata.normalize('NFKD',text.lower()).encode('ascii','ignore').decode())

def load_sources(base):
    folder=Path(base).parent/'Mapas'
    path=folder/'Silvangad 5.0.map'
    lines=path.read_text(encoding='utf-8').splitlines()
    full_path=next((folder/'Silvengard cells').glob('*Full*'))
    full=json.loads(full_path.read_text(encoding='utf-8'))
    return {'cities':{b['i']:b for b in json.loads(lines[170]) if isinstance(b,dict) and b.get('name') and not b.get('removed')},
            'states':{s['i']:s for s in json.loads(lines[169]) if isinstance(s,dict)},
            'cultures':{c['i']:c for c in json.loads(lines[168]) if isinstance(c,dict)},
            'religions':{r['i']:r for r in json.loads(lines[184]) if isinstance(r,dict)},
            'religionCells':[int(x) for x in lines[181].split(',')],
            'provinceCells':[int(x) for x in lines[182].split(',')],
            'provinces':{p['i']:p for p in json.loads(lines[185]) if isinstance(p,dict)},
            'options':json.loads(lines[1]),'full':full,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

def settlement_role(b):
    if b.get('capital'):return 'capital'
    if b.get('settlementClass')=='Vila' or b['name'].lower().startswith('vila '):return 'vila'
    if b.get('magicSchool'):return 'academia'
    if b.get('dwarvenFortress'):return 'fortaleza anã'
    if b.get('settlementClass','').startswith('Forte'):return 'fortaleza'
    if b.get('majorPort'):return 'porto principal'
    return 'cidade'

def reference_city(b,sources,multiplier):
    role=settlement_role(b)
    bands={'vila':(250,2500),'academia':(8000,50000),'fortaleza':(1500,15000),
           'fortaleza anã':(8000,50000),'porto principal':(8000,70000),'capital':(40000,600000),'cidade':(4000,40000)}
    low,high=bands[role];target=math.sqrt(low*high)
    culture=15 if b.get('dwarven') else b.get('culture')
    candidates=[c for c in sources['cities'].values() if c.get('population',0)>0 and (role=='capital' or not c.get('capital'))]
    if b.get('dwarven'):
        dwarves=[c for c in candidates if c.get('culture')==15]
        if dwarves:candidates=dwarves
    same=[c for c in candidates if c['state']==b['state']]
    if same:candidates=same
    def score(c):
        population=c['population']*multiplier
        return math.hypot(c['x']-b['x'],c['y']-b['y'])+55*abs(math.log(population/target))+(0 if low<=population<=high else 100)+(0 if c.get('culture')==culture else 70)
    donor=min(candidates,key=lambda c:(score(c),c['i']))
    population=round(min(high,max(low,donor['population']*multiplier))/100)*100
    return donor,population,role

def apply_source_profiles(world,base):
    base=Path(base);source=load_sources(base)
    world['religions']=[{'i':r['i'],'name':'Sem religião' if r['i']==0 else r.get('name') or 'Sem religião',
                         'deity':r.get('deity'),'type':r.get('type')}
                        for r in source['religions'].values() if not r.get('removed')]
    units=source['options']['units']['population'];scale=units['scale'];urbanization=units['urbanization']['rate'];multiplier=scale*urbanization
    manifest_path=base/'app/dist/heraldry/index.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    for c in world['cultures']:
        if c['i'] in source['cultures']:
            original=source['cultures'][c['i']]
            c.update({k:copy.deepcopy(original[k]) for k in ['name','code','type','shield'] if k in original})
    original_count=estimated_count=0
    for b in world['cities']:
        donor=source['cities'].get(b['i'])
        if donor is None:
            names={norm(b['name']),norm(b.get('originalName',''))}
            donor=next((c for c in source['cities'].values() if c['state']==b['state'] and norm(c['name']) in names),None)
        if donor is not None and donor.get('population') is not None:
            estimated=False;population=round(donor['population']*multiplier);b['population']=donor['population'];original_count+=1
        else:
            donor,population,role=reference_city(b,source,multiplier)
            estimated=True;b['population']=population/multiplier;estimated_count+=1
        profile={'kind':'estimated' if estimated else 'original','sourceCityId':donor['i'],'sourceCityName':donor['name'],
                 'sourceStateId':donor['state'],'sourcePosition':[donor['x'],donor['y']],
                 'method':'Proximidade, cultura e porte compatível com '+settlement_role(b) if estimated else 'Identidade da cidade no arquivo .map',
                 'originalCulture':donor.get('culture'),'populationScale':scale,'urbanization':urbanization}
        b['sourceProfile']=profile
        b['demographics']={'population':population,'estimated':estimated,'source':'Silvangad 5.0.map','referenceCity':donor['name'] if estimated else None}
        b['culture']=15 if b.get('dwarven') else donor.get('culture',b.get('culture'))
        b['language']=None  # Name-generator bases are not evidence of spoken languages.
        index=donor.get('cell',-1)
        religion_id=source['religionCells'][index] if 0<=index<len(source['religionCells']) else 0
        religion=source['religions'].get(religion_id,{})
        b['faith']={'i':religion_id,'name':religion.get('name') if religion_id and not religion.get('removed') else None,
                    'deity':religion.get('deity'),'type':religion.get('type'),'estimated':estimated}
        province_id=source['provinceCells'][index] if 0<=index<len(source['provinceCells']) else 0
        province=source['provinces'].get(province_id,{})
        b['sourceProvince']={'i':province_id,'name':province.get('fullName') or province.get('name')}
        b['originalFeatures']={k:bool(donor.get(k)) for k in ['citadel','walls','plaza','temple','shanty','port']}
        b['coa']=copy.deepcopy(donor.get('coa'))
        if b.get('emblem') and not b['emblem'].startswith('heraldry/'):
            b['emblemProvenance']={'kind':'provided','label':'Brasão original fornecido'}
        elif manifest.get('city:'+str(donor['i'])):
            b['emblem']=manifest['city:'+str(donor['i'])]
            b['emblemProvenance']={'kind':'reference' if estimated else 'original',
                'label':('Brasão de referência · '+donor['name']) if estimated else 'Brasão da cidade no .map'}
    active=[s for s in world['states'] if s['i']]
    original_events=source['states'][0].get('diplomacy',[])
    for s in active:
        src=source['states'].get(s['i'],{})
        s['form']=src.get('form');s['formName']=src.get('formName',s.get('formName'))
        s['coa']=copy.deepcopy(src.get('coa'))
        s['diplomacy']=[{'state':other['i'],'relation':src.get('diplomacy',[])[other['i']] if other['i']<len(src.get('diplomacy',[])) else 'Unknown','source':'Silvangad 5.0.map'} for other in active if other['i']!=s['i']]
        if s['i']==12:
            s['form']='Monarchy';s['formName']='Kingdom';s['fullName']='Reino de Dragonfall'
            next(r for r in s['diplomacy'] if r['state']==13).update(relation='Neutral',source='Definição atual do autor')
        if s['i']==13:next(r for r in s['diplomacy'] if r['state']==12).update(relation='Neutral',source='Definição atual do autor')
        for r in s['diplomacy']:r['label']=RELATIONS.get(r['relation'],r['relation'])
        overlords=[r['state'] for r in s['diplomacy'] if r['relation']=='Vassal']
        s['government']={'form':s['form'],'designation':GOVERNMENTS.get(s['formName'],s['formName']),
                         'monarchy':s['form']=='Monarchy','ruler':None,'dynasty':None,
                         'independent':True if s['i']==12 else not bool(overlords),'overlords':overlords,
                         'source':'Definição atual do autor' if s['i']==12 else 'Silvangad 5.0.map'}
        s['language']=None;s['history']=None
        s['originalPopulation']={'urban':round(src.get('urban',0)*multiplier),'rural':round(src.get('rural',0)*scale),'source':'Silvangad 5.0.map'}
        s['originalPopulation']['total']=s['originalPopulation']['urban']+s['originalPopulation']['rural']
        s['diplomaticHistory']=[{'title':event[0],'entries':event[1:],'source':'Registro diplomático do .map'} for event in original_events if isinstance(event,list) and event and any(norm(src.get('name','')) in norm(str(text)) for text in event[1:])][-8:]
        if s['i'] in [12,13]:s['diplomaticHistory'].append({'title':'Situação atual definida pelo autor','entries':['Dragonfall é um reino independente. A relação atual entre Dragonfall e Elucitor é neutra.'],'source':'Autor'})
        asset=manifest.get('state:'+str(s['i']))
        if asset:s['emblem']=asset;s['emblemProvenance']={'kind':'original','label':'Brasão do estado no arquivo .map'}
    world['sourceProfiles']={'version':18,'sourceFile':'Silvangad 5.0.map','sha256':source['sha256'],
                             'originalCities':original_count,'estimatedCities':estimated_count,'diplomaticEvents':len(original_events),
                             'calendar':source['options']['lore'].get('calendar'),
                             'available':{'populations':True,'cultures':True,'religions':True,'heraldry':True,'diplomacy':True,'rulers':False,'dynasties':False,'languages':False}}
    return world
