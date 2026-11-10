"""Named overland roads and ocean-only shipping lanes for the atlas."""
import heapq
import math
import numpy as np
from scipy.ndimage import label, distance_transform_edt
from scipy.spatial import cKDTree

MAJOR_PORTS = {1,18,26,30,45,56,61,96,142,160,223,224,242,1241,2002}


def apply_network_defaults(d):
    d['settings']['distanceScale'] = 1.5
    d['settings']['journeyScaleVersion'] = 12
    cells=d['cells'];g=d['grid'];nx=g['columns'];ny=g['rows'];sx=g['stepX'];sy=g['stepY']
    towns={b['i']:b for b in d['cities']};land=np.array([c['h']>=20 for c in cells]).reshape(ny,nx)
    water_ids,n=label(~land);sizes=np.bincount(water_ids.ravel());sizes[0]=0;ocean=water_ids.ravel()==int(np.argmax(sizes))
    sea_ids=np.flatnonzero(ocean);sea_tree=cKDTree([cells[i]['p'] for i in sea_ids])
    visible=[b for b in d['cities'] if b['visible'] and not b.get('excluded')]
    for b in d['cities']:
        if b['i'] in {10,29,4000} or b['state']==23 or b['state']==35:
            b['dwarven']=True
            b['dwarvenFortress']=b['i'] in {10,29,4000} or b['state']==23 or bool(b['capital'])
            if b['dwarvenFortress']:b['walls']=1;b['citadel']=1
        b['majorPort']=b['i'] in MAJOR_PORTS
        if b['i']==101:b['port']=0
        aliases={96:['Seline','Celine'],223:['Crioude'],45:['Almiraren']}
        if b['i'] in aliases:b['aliases']=list(dict.fromkeys(b.get('aliases',[])+aliases[b['i']]))
        b.pop('harbor',None)
    candidates=[]
    for b in visible:
        distance,k=sea_tree.query([b['x'],b['y']]);water=int(sea_ids[int(k)])
        if b['majorPort'] or (b.get('port') and distance<=18 and b['i'] not in {7,2003}):
            if distance>65:raise ValueError(f"Principal port too far from ocean: {b['name']}")
            b['harbor']={'waterPoint':cells[water]['p'],'cell':water,'approachDistance':round(float(distance),3)}
            if b['majorPort']:b['port']=b.get('port') or 1
            candidates.append(b)
    roads=[]
    for r in d['routes']:
        if r['group']=='searoutes' or str(r.get('id','')).startswith('corridor-'):continue
        a=min(visible,key=lambda b:math.dist([b['x'],b['y']],r['points'][0][:2]));z=min(visible,key=lambda b:math.dist([b['x'],b['y']],r['points'][-1][:2]))
        name=f"Caminho local · {a['name']} — {z['name']}" if a['i']!=z['i'] else f"Caminho local de {a['name']} · trecho {r['i']+1}"
        reference='Ligação local, sem nome de rota principal'
        states=sorted({cells[min(ny-1,max(0,int(p[1]/sy)))*nx+min(nx-1,max(0,int(p[0]/sx)))]['state'] for p in r['points']})
        roads.append({**r,'id':f"land-{r['i']}",'kind':'road','majorRoute':False,'routeClass':'local','name':name,'stateIds':states,'fromCity':a['i'],'toCity':z['i'],'nameSource':reference})
    # Large named corridors follow the existing road graph. Local paths stay intact.
    adjacency={};positions={}
    def node(p):return (round(p[0],4),round(p[1],4))
    for r in roads:
        for a,b in zip(r['points'],r['points'][1:]):
            a=node(a);b=node(b)
            if a==b:continue
            positions[a]=list(a);positions[b]=list(b);distance=math.dist(a,b)
            adjacency.setdefault(a,[]).append((b,distance,r['id']));adjacency.setdefault(b,[]).append((a,distance,r['id']))
    graph_nodes=list(positions);graph_tree=cKDTree(graph_nodes)
    def road_corridor(first,last):
        endpoints=[]
        for id in [first,last]:
            town=towns[id];distance,k=graph_tree.query([town['x'],town['y']])
            if distance>5:raise ValueError(f"No existing road at {town['name']}")
            endpoints.append(graph_nodes[int(k)])
        start,end=endpoints;q=[(0,start)];cost={start:0};prev={};found=False
        while q:
            distance,i=heapq.heappop(q)
            if distance!=cost[i]:continue
            if i==end:found=True;break
            for j,step,route_id in adjacency.get(i,[]):
                value=distance+step
                if value<cost.get(j,math.inf):cost[j]=value;prev[j]=(i,route_id);heapq.heappush(q,(value,j))
        if not found:raise ValueError(f"Disconnected existing roads: {towns[first]['name']} / {towns[last]['name']}")
        chain=[end];members=[]
        while chain[-1]!=start:
            prior,route_id=prev[chain[-1]];chain.append(prior);members.append(route_id)
        return [positions[i] for i in reversed(chain)],sorted(set(members))
    local_count=len(roads)
    corridors=[('snow','Rota da Neve',23,18),('imperial','Estrada Imperial',24,1241),('flowers','Rota das Flores',160,20),('rimae','Estrada Rimae',28,35),('ports','Rota dos Portos',30,26)]
    for slug,name,a,b in corridors:
        points,members=road_corridor(a,b)
        states=sorted({cells[min(ny-1,max(0,int(p[1]/sy)))*nx+min(nx-1,max(0,int(p[0]/sx)))]['state'] for p in points})
        roads.append({'i':len(roads),'id':'corridor-'+slug,'kind':'road','group':'roads','majorRoute':True,'routeClass':'principal','name':name,'points':points,'memberIds':members,'stateIds':states,'fromCity':a,'toCity':b,'nameSource':'Corredor contínuo sobre caminhos existentes; nome editável'})
    shore=distance_transform_edt((~land),sampling=[sy,sx]).ravel()
    def sea_path(start,end):
        q=[(0,start)];cost={start:0};prev={}
        while q:
            _,i=heapq.heappop(q)
            if i==end:
                out=[i]
                while out[-1]!=start:out.append(prev[out[-1]])
                return [cells[j]['p'] for j in reversed(out)]
            y,x=divmod(i,nx)
            for dx in [-1,0,1]:
                for dy in [-1,0,1]:
                    if not (dx or dy) or not(0<=x+dx<nx and 0<=y+dy<ny):continue
                    j=(y+dy)*nx+x+dx
                    if not ocean[j] or (dx and dy and (not ocean[i+dx] or not ocean[i+dy*nx])):continue
                    new=cost[i]+math.hypot(dx*sx,dy*sy)*(1+.8/max(shore[j],1))
                    if new<cost.get(j,math.inf):
                        cost[j]=new;prev[j]=i;heapq.heappush(q,(new+math.dist(cells[j]['p'],cells[end]['p']),j))
        raise ValueError('No ocean connection')
    # Four long maritime trunks replace the former mesh of short city-to-city links.
    trunks=[('west','Rota dos Portos do Poente',[30,26,45,142,224,56]),
            ('nur','Rota do Mar de Nur',[56,242,223,160,1241,2002]),
            ('north','Rota Marítima do Norte',[26,18,96]),
            ('east','Rota do Levante',[96,1,61,2002])]
    for slug,name,stops in trunks:
        points=[]
        for a,b in zip(stops,stops[1:]):
            part=sea_path(towns[a]['harbor']['cell'],towns[b]['harbor']['cell'])
            points.extend(part if not points else part[1:])
        roads.append({'i':len(roads),'id':'sea-trunk-'+slug,'kind':'sea','group':'searoutes','majorRoute':True,'routeClass':'principal','name':name,'points':points,'stops':stops,'fromCity':stops[0],'toCity':stops[-1],'stateIds':sorted({towns[i]['state'] for i in stops}),'source':'Corredor marítimo contínuo; escalas nos portos principais'})
    d['routes']=roads
    d['networkDefaults']={'version':13,'majorPorts':sorted(MAJOR_PORTS),'seaRoutes':len(trunks),'roadRoutes':len(corridors),'localPaths':local_count}
    return d
