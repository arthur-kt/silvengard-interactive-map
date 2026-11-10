"""Apply the latest approved city export and explicit geographic corrections."""
import copy
import hashlib
import heapq
import json
import math
from pathlib import Path
import numpy as np
from scipy.ndimage import label, distance_transform_edt
from scipy.spatial import cKDTree


class OceanRouter:
    def __init__(self, world):
        self.world=world;self.cells=world['cells'];self.g=world['grid'];self.nx=self.g['columns'];self.ny=self.g['rows']
        land=np.array([c['h']>=20 for c in self.cells]).reshape(self.ny,self.nx)
        components,_=label(~land);sizes=np.bincount(components.ravel());sizes[0]=0
        self.ocean=components.ravel()==int(np.argmax(sizes));self.ids=np.flatnonzero(self.ocean)
        self.tree=cKDTree([self.cells[int(i)]['p'] for i in self.ids])
        self.shore=distance_transform_edt(~land,sampling=[self.g['stepY'],self.g['stepX']]).ravel()

    def harbor(self, city):
        distance,k=self.tree.query([city['x'],city['y']]);i=int(self.ids[int(k)])
        if distance>65:raise ValueError('Port too far from ocean: '+city['name'])
        return {'cell':i,'waterPoint':self.cells[i]['p'][:],'approachDistance':round(float(distance),3)}

    def path(self, start, end):
        costs={start:0};previous={};q=[(0,start)];sx=self.g['stepX'];sy=self.g['stepY']
        while q:
            _,i=heapq.heappop(q)
            if i==end:
                chain=[i]
                while chain[-1]!=start:chain.append(previous[chain[-1]])
                return [self.cells[j]['p'][:] for j in reversed(chain)]
            y,x=divmod(i,self.nx)
            for dx in [-1,0,1]:
                for dy in [-1,0,1]:
                    if not(dx or dy) or not(0<=x+dx<self.nx and 0<=y+dy<self.ny):continue
                    j=(y+dy)*self.nx+x+dx
                    if not self.ocean[j] or dx and dy and (not self.ocean[i+dx] or not self.ocean[i+dy*self.nx]):continue
                    cost=costs[i]+math.hypot(dx*sx,dy*sy)*(1+.8/max(self.shore[j],1))
                    if cost<costs.get(j,math.inf):
                        costs[j]=cost;previous[j]=i;heapq.heappush(q,(cost+math.dist(self.cells[j]['p'],self.cells[end]['p']),j))
        raise ValueError('No ocean route between ports')


def apply_latest_author_defaults(world, base):
    path=Path(base)/'latest-author-defaults.json'
    if not path.exists():return world
    raw=json.loads(path.read_text(encoding='utf-8'));edits=raw['edits'];grid=world['grid']
    towns={b['i']:b for b in world['cities']};states={s['i']:s for s in world['states']}
    cultures={c['i'] for c in world['cultures']};faiths={r['i']:r for r in world['religions']}
    flags={'port','majorPort','citadel','walls','temple','plaza','shanty','magicSchool','dwarvenFortress'}

    def locate(p):
        if not isinstance(p,list) or len(p)!=2 or any(type(v) not in [int,float] or not math.isfinite(v) for v in p) or not(0<=p[0]<1920 and 0<=p[1]<937):raise ValueError('Invalid city position')
        c=world['cells'][int(p[1]/grid['stepY'])*grid['columns']+int(p[0]/grid['stepX'])]
        if c['h']<20:raise ValueError('City must be on land')
        return c

    for key,e in edits['cities'].items():
        id=int(key)
        if not isinstance(e.get('name'),str) or not e['name'].strip() or len(e['name'])>100:raise ValueError('Invalid city name')
        if e.get('visible') is False and not e.get('created'):continue
        if id not in towns:
            if not e.get('created'):raise ValueError('Unknown city '+key)
            c=locate(e['position']);s=states[c['state']]
            b={'i':id,'name':e['name'],'notes':'','visible':True,'excluded':False,'capital':False,'x':e['position'][0],'y':e['position'][1],'cell':c['i'],'state':c['state'],
               'culture':s.get('culture',0),'population':0,'demographics':{'population':0,'estimated':False},'faith':copy.deepcopy(faiths[0]),'settlementClass':'Cidade',
               'language':None,'sourceProfile':{'kind':'author'},'sourceProvince':{'i':0,'name':''},'originalFeatures':{},
               'emblem':s.get('emblem'),'emblemProvenance':{'kind':'territorial','label':'Brasão do estado'}}
            world['cities'].append(b);towns[id]=b
        b=towns[id]
        for field in ['name','notes','visible']:
            if field in e:b[field]=copy.deepcopy(e[field])
        if 'position' in e:
            c=locate(e['position']);b['x'],b['y']=e['position'];b['cell']=c['i']
        b['state']=world['cells'][b['cell']]['state']
        if 'inhabitants' in e:
            if type(e['inhabitants']) is not int or not 0<=e['inhabitants']<=10**10:raise ValueError('Invalid population')
            b['demographics']['population']=e['inhabitants'];b['population']=e['inhabitants']/(world['settings']['populationRate']*world['settings']['urbanization'])
        if 'culture' in e:
            if e['culture'] not in cultures:raise ValueError('Invalid culture')
            b['culture']=e['culture']
        if 'religion' in e:
            if e['religion'] not in faiths:raise ValueError('Invalid religion')
            b['faith']=copy.deepcopy(faiths[e['religion']])
        if 'settlementClass' in e:b['settlementClass']=e['settlementClass']
        for field,value in e.get('features',{}).items():
            if field not in flags or type(value) is not bool:raise ValueError('Invalid settlement feature')
            b[field]=value
            if field in ['port','citadel','walls','plaza','shanty','temple']:b['originalFeatures'][field]=value
        if e.get('deleted'):raise ValueError('A deleted-city edition requires explicit route curation')
        b['dwarven']=b['culture']==15 or bool(b.get('dwarvenFortress'))

    for b in world['cities']:b['state']=world['cells'][b['cell']]['state']
    ocean=OceanRouter(world)
    for key,on in raw['portOverrides'].items():
        b=towns[int(key)];b['port']=bool(on);b['majorPort']=bool(on);b['originalFeatures']['port']=bool(on)
        if on:b['harbor']=ocean.harbor(b)
        else:b.pop('harbor',None)

    # Preserve the two roads the author drew when creating the new settlements.
    for r in raw['networkEdits']['routes']:
        if r.get('kind') not in ['road','sea'] or len(r.get('points',[]))<2:raise ValueError('Invalid route')
        for p in r['points']:
            if not isinstance(p,list) or len(p)<2 or not all(type(v) in [int,float] and math.isfinite(v) for v in p[:2]) or not(0<=p[0]<1920 and 0<=p[1]<937):raise ValueError('Invalid route point')
        existing=next((n for n in world['routes'] if n['id']==r['id']),None)
        data=copy.deepcopy(r);data['authorConnection']=True
        if existing:existing.update(data)
        else:world['routes'].append(data)
    if raw['networkEdits']['deleted']:raise ValueError('Unexpected route removal')

    for route in world['routes']:
        stops=raw['seaTrunks'].get(route['id'])
        if not stops:continue
        points=[]
        for a,b in zip(stops,stops[1:]):
            leg=ocean.path(towns[a]['harbor']['cell'],towns[b]['harbor']['cell']);points.extend(leg if not points else leg[1:])
        route.update(points=points,stops=stops[:],fromCity=stops[0],toCity=stops[-1],stateIds=sorted({towns[i]['state'] for i in stops}))
        route.pop('controls',None)
    renames=raw['riverNames'];removed=set(raw['removedRivers'])
    world['rivers']=[r for r in world['rivers'] if r['name'] not in removed]
    for r in world['rivers']:r['name']=renames.get(r['name'],r['name'])
    for l in world['landmarks']:l['name']=renames.get(l['name'],l['name'])
    world['networkDefaults'].update(majorPorts=sorted(b['i'] for b in world['cities'] if b.get('majorPort')),
                                    localPaths=sum(r['kind']=='road' and r.get('majorRoute') is False for r in world['routes']))
    world['sourceProfiles']['authorCities']=sum(b.get('sourceProfile',{}).get('kind')=='author' for b in world['cities'])
    world['citySelection']['cities']=len(world['cities'])
    world['authorAtlasDefaults']={'version':23,'id':hashlib.sha256(path.read_bytes()).hexdigest(),'acceptedEdits':copy.deepcopy(edits)}
    return world
