"""The current author-selected cities are the world; prune dead-end roads too."""
import collections
import math


def finalize_world(d):
    d['settings']['shipSpeed'] = 11
    keep = [b for b in d['cities'] if b.get('visible') and not b.get('excluded')]
    removed = [b['i'] for b in d['cities'] if b not in keep]
    d['cities'] = keep
    towns = {b['i']: b for b in keep}
    key = lambda p: (round(p[0],4),round(p[1],4))
    edge = lambda a,b: tuple(sorted((a,b)))
    local = [r for r in d['routes'] if r['kind']=='road' and r.get('majorRoute') is False]
    graph = collections.defaultdict(set)
    for r in local:
        for a,b in zip(r['points'],r['points'][1:]):
            a,b=key(a),key(b)
            if a!=b:graph[a].add(b);graph[b].add(a)
    # Reconnect relocated settlements before pruning the old dead-end branches.
    for town_id in [4003,70,104,140,149]:
        town=towns.get(town_id)
        if not town or not graph:continue
        p=[town['x'],town['y']];q=min(graph,key=lambda q:math.dist(p,q))
        if math.dist(p,q)<.01:continue
        g=d['grid'];steps=max(1,math.ceil(math.dist(p,q)))
        if all(d['cells'][int((p[1]+(q[1]-p[1])*k/steps)/g['stepY'])*g['columns']+int((p[0]+(q[0]-p[0])*k/steps)/g['stepX'])]['h']>=20 for k in range(steps+1)):
            local.append(dict(id='land-aleravum' if town_id==4003 else f'land-author-{town_id}',i=9900+town_id,kind='road',group='roads',majorRoute=False,routeClass='local',authorConnection=True,name=f"Caminho local de {town['name']}",points=[p,list(q)],stateIds=[town['state']]))
            a=key(p);graph[a].add(q);graph[q].add(a)
    protected=set()
    for b in keep:
        if graph:
            q=min(graph,key=lambda q:math.dist(q,[b['x'],b['y']]))
            if math.dist(q,[b['x'],b['y']])<=8:protected.add(q)
    # Named through routes are preserved; only unnecessary side branches disappear.
    for r in d['routes']:
        if r['kind']=='road' and r.get('majorRoute') is not False:
            protected.update(key(p) for p in r['points'])
    pending=collections.deque(p for p,ns in graph.items() if len(ns)<=1 and p not in protected)
    while pending:
        p=pending.popleft()
        if p in protected or len(graph[p])>1:continue
        for q in list(graph[p]):
            graph[q].discard(p)
            if len(graph[q])<=1 and q not in protected:pending.append(q)
        graph[p].clear()
    seen=set()
    for root in list(graph):
        if root in seen or not graph[root]:continue
        component={root};stack=[root]
        while stack:
            for q in graph[stack.pop()]:
                if q not in component:component.add(q);stack.append(q)
        seen.update(component)
        if not component.intersection(protected):
            for p in component:graph[p].clear()
    active={edge(p,q) for p,ns in graph.items() for q in ns}
    roads=[]
    for r in local:
        runs=[];run=[]
        for a,b in zip(r['points'],r['points'][1:]):
            if edge(key(a),key(b)) in active:
                if not run:run=[a]
                run.append(b)
            elif run:runs.append(run);run=[]
        if run:runs.append(run)
        for index,points in enumerate(runs):
            first=min(keep,key=lambda b:math.dist(points[0][:2],[b['x'],b['y']]))
            last=min(keep,key=lambda b:math.dist(points[-1][:2],[b['x'],b['y']]))
            roads.append({**r,'id':r['id']+(f'-part-{index+1}' if index else ''),'points':points,
                          'fromCity':first['i'],'toCity':last['i'],
                          'name':f"Caminho local · {first['name']} — {last['name']}"})
    original_ids={r['id'] for r in local}
    removed_roads=sorted(original_ids-{r['id'] for r in roads})
    d['routes']=roads+[r for r in d['routes'] if r['kind']=='sea' or r.get('majorRoute') is not False]
    d['networkDefaults']['localPaths']=len(roads)
    d['citySelection']={'revision':17,'removedCityIds':removed,'removedRouteIds':removed_roads,'cities':len(keep)}
    return d
