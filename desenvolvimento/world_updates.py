"""Curadoria v2, aplicada sobre a conversão original. Não altera os mapas-fonte."""
import math,json,pathlib,shutil,unicodedata,re

def norm(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.casefold()) if not unicodedata.combining(c))
def apply_updates(d,pack,base):
 cells=d['cells'];cities=d['cities'];out=base/'app/dist';assets=base.parent/'Emblemas e mapas';audit=[]
 def near(x,y,sid=None,coast=False):
  opts=[c for c in cells if c['h']>=20 and (sid is None or c['state']==sid)]
  if coast:
   co=[c for c in opts if any(cells[n]['h']<20 for n in c['c'] if n<len(cells))]
   if co:opts=co
  return min(opts,key=lambda c:(c['p'][0]-x)**2+(c['p'][1]-y)**2)
 def el(u,v):return [1071.32+(u-740)*.60,530.9+(v-310)*.64]
 def dr(u,v):return [1129+(u-605)*.44,381.5+(v-760)*.36]
 def vi(u,v):return [40+(u-90)*.50,242+(v-90)*.34]
 for c in cells:c['originalHeight']=c['h'];c['originalBiome']=c['biome']
 def add(name,sid,xy,old=None,port=False,spelling='referência',coast=False):
  b=next((b for b in cities if b['state']==sid and (norm(b['name'])==norm(name) or (old is not None and b['i']==old))),None)
  c=near(*xy,sid,coast)
  if b is None:
   b=dict(i=2000+len([b for b in cities if b['i']>=2000]),population=None,capital=0,citadel=0,walls=0,temple=0);cities.append(b)
  else:b.setdefault('originalName',b['name']);b.setdefault('originalPosition',[b['x'],b['y']])
  b.update(name=name,state=sid,x=c['p'][0],y=c['p'][1],cell=c['i'],culture=c['culture'],visible=True,reference=True,port=1 if port else b.get('port',0),type='Localidade',source=f'{spelling} · posição adaptada ao mapa 3D',settlementClass='Cidade')
  audit.append({'estado':sid,'nome':name,'id':b['i'],'origem':b['source']});return b
 # Existing identities retain their IDs, so browser notes stay attached.
 el_refs=[('Elucitor',740,310,7),('Dracofortis',555,95,24),('Vostris',785,105,28),('Ignis',915,195,15),('Nostris',940,310,17),('Althor',515,345,197),('Vennoduro',695,380,191),('Lorvus',565,415,20),('Tramor',545,495,27),('Cetolo',295,380,1243),('Arenor',300,525,1239),('Danumbria',220,570,None),('Condado de Alhia',705,535,1244),('Meriadoc',870,455,1242),('Bomaria',960,395,161),('Adhuc Vivere',900,590,None),('Ros Leones',905,700,None),('Argendau',800,650,35),('Castamor',720,700,1240),('Nediora',590,740,1241),('Pantos',300,740,160)]
 for name,u,v,old in el_refs:add(name,13,el(u,v),old,port=name in ['Ros Leones','Pantos','Nediora'],spelling='Desenho de Elucitor'+(' e emblema original' if name in ['Cetolo','Danumbria','Meriadoc','Ros Leones','Condado de Alhia'] else ''),coast=name in ['Pantos','Nediora'])
 dr_refs=[('Asgorath',605,760,3),('Winterhelm',670,300,23),('Dagorah',275,240,10),('Malacatt',310,550,11),('Savhalla',150,880,12),('Porto das Cinzas',810,570,18),('Torre Solitária',900,380,5),('Ereth',1100,830,2),('Rivertown',755,770,4),('Gugacon',1170,330,33),('Vila Rinus',580,365,34),('Nilhelm',860,815,None),('Vila Sardinhas',875,700,None),('Ermo Limiar',455,565,None)]
 for name,u,v,old in dr_refs:add(name,12,dr(u,v),old,port=name in ['Porto das Cinzas','Vila Sardinhas'],spelling='Dragonfall digital e papel revisado'+(' e correção do autor' if name in ['Nilhelm','Porto Sardinhas'] else ''),coast=name=='Vila Sardinhas')
 vi_refs=[('Guernica',400,170,21),('Mauron',820,170,29),('Sulpa',680,250,None),('Triovorn',760,360,19),('Lirion',510,350,31),('Oregon',320,370,32),('Guil',780,440,None),('Vyoh',670,520,25),('Vir',530,560,16),('Porto do Álamo',300,580,30),('Porto de Vern',860,540,26),('Bernut',90,490,None)]
 # Vitravion's reference is the minimum city set; hide only extra generated places.
 for b in cities:
  if b['state']==47:b['visible']=False
 for name,u,v,old in vi_refs:add(name,47,vi(u,v),old,port=name in ['Porto do Álamo','Porto de Vern','Bernut'],spelling='Mapa digital de Vitravion',coast=name in ['Porto do Álamo','Porto de Vern','Bernut'])
 for b in cities:
  if b['state']==12:
   b['aliases']={'Asgorath':['Asghorat','Asgorata'],'Malacatt':['Mallacatt'],'Savhalla':['Savhala'],'Vila Sardinhas':['Porto Sardinhas'],'Vila Rinus':['Timber']}.get(b['name'],[])
 # Farthest suitable original villages, close to a road/river, rather than arbitrary new towns.
 for sid,count in [(13,4),(12,4)]:
  for _ in range(count):
   chosen=[b for b in cities if b['state']==sid and b['visible']]
   candidates=[b for b in cities if b['state']==sid and not b['visible'] and b['i']<1000 and (b.get('population') or 0)<10 and cells[b['cell']]['h']<55]
   def score(b):
    sep=min(math.hypot(b['x']-a['x'],b['y']-a['y']) for a in chosen)
    route=min((math.hypot(b['x']-pt[0],b['y']-pt[1]) for r in d['routes'] if r['group']!='searoutes' for pt in r['points']),default=100)
    return sep/(1+route/45)+(12 if cells[b['cell']]['r'] else 0)
   if not candidates:break
   b=max(candidates,key=score);b.update(visible=True,settlementClass='Vila',source='Vila reincluída do .map · próxima a caminhos ou água',reference=False);audit.append({'estado':sid,'nome':b['name'],'id':b['i'],'origem':b['source']})
 # More visible river ribbons; Elucitor's principal watercourses follow its paper map.
 metadata={r['name']:r for r in pack['rivers']};rivers=[]
 for r in d['rivers']:
  m=metadata.get(r['name'],{});length=m.get('length',0);r.update(width=min(3.4,.65+math.sqrt(m.get('discharge',30))/22),major=length>170,source='GeoJSON original')
  if r['name']=='Amestrino':rivers.append(r);continue
  segments=[];current=[]
  for xy in r['points']:
   c=min(cells,key=lambda c:(c['p'][0]-xy[0])**2+(c['p'][1]-xy[1])**2)
   if (c['state']==13 and xy[0]>760) or (1050<xy[0]<1255 and 550<xy[1]<815):
    if len(current)>1:segments.append(current)
    current=[]
   else:current.append(xy)
  if len(current)>1:segments.append(current)
  for segment in segments:rivers.append(dict(r,points=segment))
 custom=[('Rio Celsano',[(390,225),(410,280),(370,325),(300,350),(270,380),(320,415),(410,445),(490,470),(545,530),(575,600)],4.6),('Rio Albo',[(180,450),(225,435),(270,400),(320,415)],3.8),('Rio Talion',[(735,355),(700,400),(755,465),(788,525),(805,590),(850,650),(815,680),(795,735),(765,765)],5.2),('Rio Amares',[(980,350),(1000,425),(1030,500),(1015,590),(1000,660),(930,680),(850,650)],4.8),('Rio de Liotoran',[(260,220),(290,270),(340,300),(370,325)],2.8)]
 for name,pts,width in custom:
  points=[el(*a) for a in pts]
  rivers.append(dict(name=name,points=points,width=width,major=True,source='Traçado adaptado do desenho de Elucitor'))
 d['rivers']=rivers
 def segdist(p,a,b):
  dx=b[0]-a[0];dy=b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy or 1)))
  return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
 # Mountain chains reconstructed from the paper reference, at moderate rather than needle-like heights.
 ridges=[('Cordilheira de Liotoran',[(130,245),(225,265),(300,205),(365,210)],32),('Monte Vathnis',[(290,180),(330,150),(365,200)],43),('Montanhas centrais',[(530,400),(580,360),(650,425)],30),('Montanhas de Tharok',[(595,565),(645,540),(700,585)],39),('Monte Ganir',[(1040,295),(1070,270),(1100,320)],41)]
 for c in cells:
  if c['h']<20:continue
  x,y=c['p']
  if c['state']==20 and c['h']>45:c['h']=45+(c['h']-45)*.76
  if c['state']==13:
   c['biome']=4;c['region']='Campinas de Elucitor'
   for name,pts,peak in ridges:
    pts=[el(*p) for p in pts];dist=min(segdist(c['p'],a,b) for a,b in zip(pts,pts[1:]))
    if dist<24:c['h']=max(c['h'],23+peak*(1-dist/24)**1.1);c['region']=name
   u=(x-1071.32)/.6+740;v=(y-530.9)/.64+310
   for name,cx,cy,rx,ry,bio in [('Bosque de Ari',580,235,115,70,6),('Floresta Azul',275,460,95,80,8),('Bosque Meridiano',550,460,150,65,6),('Bosque de Ereth',850,125,200,50,9),('Bosque de Bomaria',890,390,85,65,5)]:
    if ((u-cx)/rx)**2+((v-cy)/ry)**2<1:c['biome']=bio;c['region']=name
   if 805<u<1025 and 500<v<675:c['biome']=13;c['region']='Floresta morta de Adhuc Vivere'
  elif c['state']==12:
   c['biome']=9 if y<235 else (6 if x<1130 else 4)
   if x>1280 and y>290:c['biome']=3
   u=(x-1129)/.44+605;v=(y-381.5)/.36+760
   if u<235 and 280<v<620:c['biome']=13;c['region']='Dunga-Bal · bosque morto'
   if ((u-330)/115)**2+((v-480)/65)**2<1:c['biome']=12;c['region']='Pântano de Tagalar'
  elif c['state']==47:
   # Dry north and west; wooded eastern lowlands, and snow around Mauron.
   c['biome']=2 if y<300 else (4 if x<285 else 6)
   if x>390 and y<300:c['biome']=10 if c['h']<70 else 11
  elif c['state']==24:
   rs=[r for r in rivers if r['name'] in ['Ghol-Cha','Amestrino','Cascanarges']]
   dist=min((segdist(c['p'],a,b) for r in rs for a,b in zip(r['points'],r['points'][1:])),default=1000)
   if dist<36 or math.hypot(x-943.86,y-418.51)<55:c['biome']=1;c['region']='Deserto de Husaj · corredor de Alqa'
  elif c['state']==17:c['biome']=14;c['region']='Valar · terras cobertas pela névoa'
  # Low channels through Elucitor's added rivers, avoiding erased coastal/island cells.
  if c['state']==13:
   dist=min(segdist(c['p'],a,b) for r in rivers if r.get('source','').startswith('Traçado') for a,b in zip(r['points'],r['points'][1:]))
   if dist<12:c['h']=max(20,min(c['h'],23+dist*.65))
  c['h']=round(c['h'],2)

 # Ros Leones: a sea-connected sheltered basin with a fully detached island.
 bay_center=(1144,752);bay_cells=[]
 for c in cells:
  x,y=c['p']
  if ((x-bay_center[0])/38)**2+((y-bay_center[1])/36)**2<1:
   c.setdefault('originalState',c['state']);c.update(h=16,state=0,biome=0,region='Enseada de Ros Leones');bay_cells.append(c['i'])
 island=min(cells,key=lambda c:(c['p'][0]-1148)**2+(c['p'][1]-762)**2)
 ring=set(n for v in island['v'] for n in d['vertices'][v]['c'] if n<len(cells) and n!=island['i'])
 for cid in ring:
  c=cells[cid];c.setdefault('originalState',c['state']);c.update(h=16,state=0,biome=0,region='Canal de Ros Leones');bay_cells.append(cid)
 island.update(h=27,state=13,biome=4,culture=10,region='Ilha de Ros Leones')
 ros=next(b for b in cities if b['name']=='Ros Leones');ros.update(x=island['p'][0],y=island['p'][1],cell=island['i'],state=13,port=1,source='Desenho de Elucitor e correção do autor · ilha, enseada e foz reconstruídas')
 for b in cities:
  if b is ros or cells[b['cell']]['h']>=20:continue
  c=near(b['x'],b['y'],b['state']);b.update(x=c['p'][0],y=c['p'][1],cell=c['i'])
 # Both major rivers end inside the basin, leaving the island between open channels.
 for r in rivers:
  if r['name']=='Rio Talion':r['points']=[[1070,560],[1085,595],[1100,630],[1106,665],[1114,699],[1126,719],[1131,738],[1130,748]]
  elif r['name']=='Rio Amares':r['points']=[[1190,580],[1192,625],[1180,660],[1182,695],[1177,720],[1165,738],[1158,746]]
  elif r['name']=='Rio Celsano':
   water=min((c for c in cells if c['h']<20),key=lambda c:(c['p'][0]-r['points'][-1][0])**2+(c['p'][1]-r['points'][-1][1])**2);r['points'].append(water['p'][:])
 # Re-carve only the revised main channels so water follows shallow valleys.
 for c in cells:
  if c['h']<20:continue
  if c['state'] in [13,17]:
   dist=min(segdist(c['p'],a,b) for r in rivers if r['name'] in ['Rio Talion','Rio Amares'] for a,b in zip(r['points'],r['points'][1:]))
   if dist<10:c['h']=round(min(c['h'],22+dist*.7),2)
 d['geography']={'rosLeonesIslandCell':island['i'],'bayCells':sorted(set(bay_cells)),'source':'Desenho de Elucitor · reconstrução cartográfica aproximada'}
 for st in d['states']:
  if st['i'] in [13,17]:st['originalArea']=st['area'];st['area']=sum(pack['cells'][c['i']]['area'] for c in cells if c['state']==st['i'] and c['h']>=20)
 # Small dry woodland clearings around selected settlements and no trees in river channels.
 for b in cities:
  if b['state']==17:b['visible']=False;b['source']='Arquivo .map · ocultada para preservar a região desolada de Valar'
 d['landmarks']=[dict(name=n,point=el(*pts[len(pts)//2]),kind='montanha') for n,pts,_ in ridges]+[dict(name='Floresta morta',point=el(905,605),kind='bioma'),dict(name='Lago Etalas',point=el(730,260),kind='lago'),dict(name='Lago das Lágrimas',point=dr(515,730),kind='lago')]

 d['landmarks'] += [dict(name=n,point=dr(u,v),kind=k,source='Dragonfall digital e papel revisado') for n,u,v,k in [('Ask-Lozard',680,160,'montanha'),('Ruínas de Amestris',240,610,'ruínas'),('Angra dos Goblins',680,525,'povoado'),('Pântano de Tagalar',330,480,'pântano'),('Lago Degelo',465,405,'lago'),('Ilha Ymir',1080,335,'ilha'),('Mansão Longrock',1050,465,'mansão'),('Dunga-Bal',135,450,'bioma')]]
 for b in cities:
  if b['state']==12 and b['name']=='Ermo Limiar':b['source']='Dragonfall paper.jpg · posição adaptada ao mapa 3D'
  if b['state']==12 and b['name']=='Vila Rinus':b['source']='Dragonfall paper.jpg · grafia parcialmente legível, a conferir; posição adaptada'


 d['landmarks'] += [dict(name=n,point=el(u,v),kind=k,source='Mapa de Elucitor em papel') for n,u,v,k in [('Bosque de Ari',580,235,'floresta'),('Floresta Azul',250,455,'floresta'),('Bosque Meridiano',550,460,'floresta'),('Bosque de Ereth',1000,140,'floresta'),('Bosque de Bomaria',890,390,'floresta'),('Baía de Baranor',400,650,'baía'),('Mar de Nur',180,750,'mar'),('Ruínas de Alnien',430,380,'ruínas')]]
 d['landmarks'] += [dict(name=n,point=dr(u,v),kind=k,source='Dragonfall paper.jpg') for n,u,v,k in [('Bosques de Lirion',600,700,'floresta'),('Mar Nórdico',620,75,'mar'),('Mar das Chamas',1080,560,'mar')]]
 d['landmarks'] += [dict(name='Deserto de Husaj',point=[900,405],kind='deserto',source='Bioma solicitado pelo autor'),dict(name='Enseada de Ros Leones',point=[1134,755],kind='baía',source='Desenho de Elucitor e correção do autor')]
 # Copy exact original heraldic assets; never manufacture a replacement coat of arms.
 dest=out/'emblems';dest.mkdir(exist_ok=True);files={}
 for p in sorted(assets.glob('Silvangad Emblem *.png')):
  label=re.sub(r'\s*\]?20\d\d-.*$','',p.stem.removeprefix('Silvangad Emblem ')).strip();key=norm(label);slug=re.sub('[^a-z0-9]+','-',key).strip('-');shutil.copyfile(p,dest/(slug+'.png'));files[key]='emblems/'+slug+'.png'
 def lookup(*keys):return next((files[norm(k)] for k in keys if norm(k) in files),None)
 statekeys={12:['Província Imperial de Dragonfall'],13:['Império de Elucitor'],14:['Império Navï Velaffëll'],17:['Terra morta de Valar'],24:['Califado Husajita'],28:['Reino de Veniun'],32:['Goblinburgo'],46:['Reinos Médios'],47:['Vitravion'],48:['Reino de Osmorn']}
 for s in d['states']:s['emblem']=lookup(s['name'].strip(),s.get('fullName') or '',*statekeys.get(s['i'],[]))
 aliases={'elucitor':['Elucitor County'],'castamor':['Castamor County'],'cetolo':['Cetolo Shire'],'condado de alhia':['alhia'],'danumbria':['Danumbria'],'ros leones':['Ros leones'],'meriadoc':['Meriadoc']}
 for b in cities:b['emblem']=lookup(b['name'],*aliases.get(norm(b['name']),[]))

 # Reconnect the selected settlements after relocating them and carving the bay.
 # Existing roads outside revised territories are preserved; no land road crosses the island's channel.
 import heapq
 revised={12,13,17,47};routes=[]
 for r in d['routes']:
  if r['group']=='searoutes':routes.append(r);continue
  segment=[]
  for pt in r['points']:
   c=min(cells,key=lambda c:(c['p'][0]-pt[0])**2+(c['p'][1]-pt[1])**2)
   if c['state'] in revised or c.get('originalState') in revised:
    if len(segment)>1:routes.append(dict(r,points=segment))
    segment=[]
   else:segment.append(pt)
  if len(segment)>1:routes.append(dict(r,points=segment))
 def roadpath(start,end,sid):
  costs={start:0};prev={};queue=[(0,start)]
  while queue:
   cost,i=heapq.heappop(queue)
   if cost!=costs[i]:continue
   if i==end:
    path=[i]
    while path[-1]!=start:path.append(prev[path[-1]])
    return [cells[j]['p']+[j] for j in reversed(path)]
   c=cells[i]
   for n in c['c']:
    if n>=len(cells):continue
    nxt=cells[n]
    if nxt['h']<20 or nxt['state']!=sid:continue
    new=cost+math.dist(c['p'],nxt['p'])*(1+abs(c['h']-nxt['h'])/8+(0.3 if nxt['biome'] in [12,13] else 0))
    if new<costs.get(n,float('inf')):costs[n]=new;prev[n]=i;heapq.heappush(queue,(new,n))
  return None
 for sid in [12,13,47]:
  bs=[b for b in cities if b['state']==sid and b['visible']];parent=list(range(len(bs)))
  def root(i):
   while parent[i]!=i:i=parent[i]
   return i
  pairs=sorted((math.hypot(a['x']-b['x'],a['y']-b['y']),i,j) for i,a in enumerate(bs) for j,b in enumerate(bs) if i<j)
  for _,i,j in pairs:
   if root(i)==root(j):continue
   a,b=bs[i],bs[j];path=roadpath(a['cell'],b['cell'],sid)
   if path:
    parent[root(i)]=root(j);routes.append(dict(i=10000+len(routes),group='roads',points=[[a['x'],a['y'],a['cell']]]+path+[[b['x'],b['y'],b['cell']]],source='Caminho adaptado às localidades e ao terreno revisados'))
 d['routes']=routes
 d['revision']=2;d['curation']={'selected':sum(b['visible'] for b in cities),'original':239,'note':'Referências de papel e mapa digital orientam a curadoria; posições e relevo adaptados são aproximações cartográficas.'}
 (base/'revisao-cidades.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
 return d
