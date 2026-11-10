"""Reference-first reconstruction: coordinates are placed on traced geography, never snapped to another coast."""
import json,math,pathlib,collections,heapq
import numpy as np
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter, distance_transform_edt, label
from matplotlib.path import Path as Polygon

def rebuild(d,pack,base):
 source=pack['cells'];tree=cKDTree([c['p'] for c in source]);nx=480;ny=234;sx=1920/nx;sy=937/ny
 xs=(np.arange(nx)+.5)*sx;ys=(np.arange(ny)+.5)*sy;xx,yy=np.meshgrid(xs,ys);P=np.column_stack([xx.ravel(),yy.ravel()]);_,nearest=tree.query(P);N=len(P)
 h=np.array([source[i]['h'] for i in nearest],float);sid=np.array([source[i]['state'] for i in nearest]);bio=np.array([source[i]['biome'] for i in nearest]);orig_h=h.copy();orig_bio=bio.copy();orig_sid=sid.copy();regions={};water=np.zeros(N,bool)
 # Interpolate original relief instead of copying coarse cells into square plateaus.
 dd,ii=tree.query(P,k=5);weights=1/np.maximum(dd,.1)**2;hh=np.array([c['h'] for c in source]);blend=(hh[ii]*weights).sum(axis=1)/weights.sum(axis=1);h=np.where(orig_h>=20,np.maximum(21,blend),h)
 A=np.linalg.solve(np.array([[670,300,1],[1170,330,1],[605,760,1.]]),np.array([[1090.33,283.77],[1286,244],[1129,355.]]))
 def dragon(u,v):
  xy=[1090.33+(u-670)*.42,283.77+(v-300)*.30]
  if u>1010 and v<600:xy=[xy[0]-14.33,xy[1]-48.77]
  return xy
 def elucitor(u,v):return [1071.32+(u-740)*.60,530.9+(v-310)*(.40 if v<310 else .50)]
 def vitra(u,v):return [120+(u-400)*.34,250+(v-100)*.27]
 transforms={12:dragon,13:elucitor,47:vitra};UV={}
 # Inverse chart coordinates allow lakes, hills, trees and towns to use the same registration.
 for state,tr in transforms.items():
  if state==12:UV[state]=np.column_stack([(P[:,0]-1090.33)/.42+670,(P[:,1]-283.77)/.30+300])
  elif state==13:
   u=(P[:,0]-1071.32)/.60+740;dy=P[:,1]-530.9;UV[state]=np.column_stack([u,310+dy/np.where(dy<0,.40,.50)])
  else:UV[state]=np.column_stack([(P[:,0]-120)/.34+400,(P[:,1]-250)/.27+100])
 main={
 12:[(0,80),(60,-140),(280,-190),(520,-175),(750,-135),(900,-30),(960,110),(960,300),(980,385),(940,440),(885,470),(860,555),(875,635),(930,690),(1075,750),(1200,790),(1250,875),(120,900),(0,835)],
 13:[(140,280),(210,210),(300,145),(410,130),(480,40),(780,65),(1065,125),(1070,460),(1040,650),(1030,765),(990,790),(940,800),(865,790),(800,785),(700,785),(620,780),(580,765),(565,735),(570,700),(560,660),(535,630),(475,610),(425,590),(370,590),(325,610),(270,605),(240,590),(220,580),(190,610),(180,650),(190,690),(230,715),(280,725),(320,730),(360,740),(370,755),(325,770),(240,760),(200,750),(150,730),(130,710),(115,620),(125,490),(150,400)],
 47:[(500,240),(540,130),(610,40),(710,-20),(840,-45),(1000,-30),(1130,20),(1200,110),(1230,220),(1230,330),(1210,440),(1170,530),(1100,610),(1000,660),(880,700),(740,715),(600,710),(485,685),(420,640),(440,560),(450,480),(470,360)]}
 masks={s:Polygon(poly).contains_points(UV[s]) for s,poly in main.items()}
 # A continuous offshore channel makes Vitravion an island even beside unrelated original land.
 vitra_moat=(distance_transform_edt((~masks[47]).reshape(ny,nx),sampling=[sy,sx]).ravel()<11)&~masks[47]
 clear=np.isin(orig_sid,[12,13,47]);h[clear]=16;sid[clear]=0;bio[clear]=0
 def ellipse(state,cx,cy,rx,ry):
  uv=UV[state]
  if state==12 and cx>1010 and cy<600:uv=np.column_stack([(P[:,0]+14.33-1090.33)/.42+670,(P[:,1]+48.77-283.77)/.30+300])
  return ((uv[:,0]-cx)/rx)**2+((uv[:,1]-cy)/ry)**2<1
 # Plot mainland first; priority near the shared border is explicit and not based on nearest land.
 for state in [47,13,12]:
  mask=masks[state];sid[mask]=state;h[mask]=np.maximum(23,np.minimum(h[mask],40));bio[mask]=np.where(orig_h[mask]>=20,orig_bio[mask],6)
 # Keep the original western coast adjoining Goblinburgo; it was incorrectly erased into an extra gulf.
 west=(orig_sid==13)&(orig_h>=20)&(UV[13][:,0]<150)&(UV[13][:,1]<730);sid[west]=13;h[west]=np.maximum(23,orig_h[west]);bio[west]=6
 h[vitra_moat]=16;sid[vitra_moat]=0;bio[vitra_moat]=0;water[vitra_moat]=True
 # Preserve Husaj's desert and the capital around the shared northern Elucitor boundary.
 husaj=(orig_sid==24)&~ellipse(13,555,205,65,45);sid[husaj]=24;h[husaj]=np.maximum(23,orig_h[husaj]);bio[husaj]=1
 # Khajataad regains its original territory; Dungabas and the wetland corridor form Dragonfall's western frontier.
 dungabas_envelope=ellipse(12,180,440,90,110)&(h>=20)
 dragon_west=Polygon([(295,520),(470,500),(600,640),(560,815),(390,825),(350,700),(350,620)]).contains_points(UV[12])&(h>=20)
 khaj=(orig_sid==26)&(orig_h>=20)&~dungabas_envelope&~dragon_west;sid[khaj]=26;h[khaj]=np.maximum(23,orig_h[khaj]);bio[khaj]=6
 sid[dungabas_envelope|dragon_west]=12;bio[dungabas_envelope|dragon_west]=6
 # The four imperial forts and Ereth woodland occupy a continuous Elucitor belt south of Dragonfall.
 elucitor_belt=masks[13]&(UV[13][:,1]>=185)&((orig_sid!=24)|((UV[13][:,0]>500)&(UV[13][:,1]>180)));sid[elucitor_belt]=13;h[elucitor_belt]=np.maximum(23,h[elucitor_belt]);bio[elucitor_belt]=6
 # Ereth woodland and town belong to a broad, continuous Dragonfall band; Jalha remains on the Navi side.
 navi_edge=np.interp(P[:,1],[380,410,435,462,481],[1275,1288,1298,1290,1270])
 northeast_land=(h>=20)&(P[:,1]>380)&(P[:,1]<481)&(P[:,0]>995)
 dragon_north=northeast_land&(P[:,0]<navi_edge)&(orig_sid!=24);sid[dragon_north]=12;bio[dragon_north]=6
 navi_east=northeast_land&(P[:,0]>=navi_edge)&(P[:,0]<1400)&np.isin(sid,[0,12,13,14]);sid[navi_east]=14
 # Drakis is on the temperate border south of the desert, not in Husaj.
 drakis=ellipse(13,555,205,65,45);sid[drakis]=13;h[drakis]=np.maximum(24,h[drakis]);bio[drakis]=6
 def land_patch(state,mask,alt=26,biome=6):sid[mask]=state;h[mask]=alt;bio[mask]=biome
 def lake(state,name,cx,cy,rx,ry):
  mask=ellipse(state,cx,cy,rx,ry);bank=ellipse(state,cx,cy,rx+24,ry+20)&(sid==state);h[bank]=np.minimum(h[bank],26);h[mask]=16;sid[mask]=state;bio[mask]=0;water[mask]=True;regions[name]=mask
 # Detached islands are drawn where the paper puts them.
 land_patch(12,ellipse(12,1170,330,78,105),30,6)
 land_patch(12,ellipse(12,1040,335,12,27),28,6)
 land_patch(12,ellipse(12,1030,465,18,22),26,6)
 land_patch(47,ellipse(47,271,553,42,57),29,4)
 land_patch(47,ellipse(47,343,205,46,67),29,4)
 land_patch(47,ellipse(47,314,405,26,36),26,6)
 lake(12,'Lago Degelado',465,405,36,27)
 lake(12,'Lago das Lágrimas',510,740,68,64)
 lake(12,'Lago de Rinus',610,390,29,49)
 land_patch(12,ellipse(12,610,390,9,16),26,4);water[ellipse(12,610,390,9,16)]=False
 lake(13,'Lago Cetolo',235,365,53,30)
 # The shoreline is traced from the author's definitive Elucitor paper reference.
 diabo_outer=ellipse(13,235,365,53,30);diabo=Polygon([(200,355),(230,348),(265,350),(277,361),(272,375),(248,382),(215,378),(187,388),(176,379),(181,363)]).contains_points(UV[13]);restore=diabo_outer&~diabo;h[restore]=24;bio[restore]=6;water[restore]=False;h[diabo]=16;bio[diabo]=0;water[diabo]=True;regions['Lago Cetolo']=diabo
 lake(13,'Lago Etalas',740,310,68,55)
 etalas_old=ellipse(13,740,310,68,55);etalas=Polygon([(655,290),(670,268),(695,254),(714,231),(742,225),(767,240),(787,270),(807,285),(814,316),(800,343),(782,353),(755,355),(731,376),(703,370),(695,347),(670,338),(650,317)]).contains_points(UV[13]);restore=etalas_old&~etalas;h[restore]=24;bio[restore]=6;water[restore]=False;h[etalas]=16;sid[etalas]=13;bio[etalas]=0;water[etalas]=True;regions['Lago Etalas']=etalas
 land_patch(13,ellipse(13,740,310,18,18),27,4);water[ellipse(13,740,310,18,18)]=False
 # Larger Ros Leones: an oval island, sheltered by an open basin and two river mouths.
 ros_bay=Polygon([(851,640),(875,657),(918,661),(953,650),(984,651),(988,687),(976,721),(985,759),(1010,797),(1038,856),(1060,950),(800,950),(816,867),(829,804),(846,758),(838,725),(839,686)]).contains_points(UV[13]);channel=Polygon([(865,737),(948,740),(990,800),(1040,900),(1065,1010),(800,1010),(825,870),(850,790)]).contains_points(UV[13]);bay=ros_bay|channel
 h[bay]=16;sid[bay]=0;bio[bay]=0;water[bay]=True
 ros_island=Polygon([(x,y+20) for x,y in [(889,664),(914,667),(934,682),(939,702),(929,724),(904,736),(879,729),(869,711),(874,690)]]).contains_points(UV[13]);land_patch(13,ros_island,28,4);water[ros_island]=False;regions['Ilha de Ros Leones']=ros_island
 # Ridge distances are measured in chart space; lake basins are excluded from mountain uplifts.
 def ridge(state,points,radius,peak,name):
  uv=UV[state];dist=np.full(N,1e9)
  for a,b in zip(points,points[1:]):
   a=np.array(a);v=np.array(b)-a;t=np.clip(((uv-a)*v).sum(axis=1)/(v@v),0,1);dist=np.minimum(dist,np.linalg.norm(uv-a-t[:,None]*v,axis=1))
  m=(dist<radius)&(np.isin(sid,[13,14]) if name=='Monte Ganir' else sid==state)&~water;h[m]=np.maximum(h[m],24+peak*(1-dist[m]/radius)**1.3);regions[name]=m
 ridge(12,[(150,240),(280,175),(400,190),(520,225)],65,35,'Montanhas de Dagorah')
 ridge(12,[(530,230),(650,145),(765,215),(865,315),(920,365)],100,23,'Ask-Lozard')
 # Spaced summits and saddles replace the previous continuous wall of peaks.
 ask_center=dragon(650,145)
 for u,v,peak,spread in [(550,230,66,11),(650,145,85,16),(770,220,72,12),(865,315,65,12)]:
  center=dragon(u,v);rad=np.linalg.norm(P-np.array(center),axis=1);m=(sid==12)&~water&(rad<spread*3);h[m]=np.maximum(h[m],24+(peak-24)*np.exp(-rad[m]**2/(2*spread**2)))
 ridge(12,[(290,385),(360,330),(430,365)],35,28,'Montes do Degelo')
 ridge(13,[(130,270),(220,250),(310,200),(365,245)],42,34,'Cordilheira de Liotorn')
 ridge(13,[(290,190),(330,145),(370,205)],32,42,'Monte Vathnis')
 ridge(13,[(530,410),(580,360),(650,425)],32,30,'Montanhas centrais')
 ridge(13,[(595,565),(645,540),(700,585)],38,35,'Montanhas de Tharok')
 ridge(13,[(1060,310),(1120,270),(1160,330)],40,38,'Monte Ganir')
 ridge(47,[(540,235),(650,125),(676,185),(790,145),(920,100),(1100,135)],60,45,'Montanhas do Norte de Vitravion')
 ridge(47,[(715,230),(786,254),(870,225)],52,36,'Montanhas de Kyon')
 ridge(47,[(530,340),(580,280),(645,305)],48,32,'Montanhas de Oregon')
 # Re-establish the mountain-foot lake depression after generating the neighbouring ridges.
 lake(12,'Lago Degelado',465,405,36,27)
 # Restore Veniun's high western mountain barrier, avoiding the flattened Elucitor overlap.
 veniun=(orig_sid==28)&(orig_h>=20);sid[veniun]=28;h[veniun]=np.maximum(h[veniun],orig_h[veniun]);bio[veniun]=orig_bio[veniun]
 # Restore woodland coverage. Named forests use dense original biomes rather than clearing the whole state.
 for state in [12,13,47]:
  m=(sid==state)&~water;bio[m & (bio==0)]=6
 forests=[(12,'Floresta morta de Dungabás',180,440,50,65,13),(12,'Bosques de Lirion',600,695,100,63,6),(12,'Pântano de Tagalar',330,480,100,58,12),(13,'Bosque de Ari',580,235,115,70,6),(13,'Floresta Azul',275,460,95,80,6),(13,'Bosque Meridiano',550,460,150,65,6),(13,'Bosque de Ereth',850,135,210,40,9),(13,'Bosque de Bomaria',890,390,85,65,6)]
 for state,name,x,y,rx,ry,b in forests:
  m=ellipse(state,x,y,rx,ry)&(sid==(12 if name=='Bosque de Ereth' else state))&~water;bio[m]=b;regions[name]=m
 u,v=UV[13].T
 # Sparse southern foothills and rural Alia; the dead forest is confined between its two rivers.
 south=(sid==13)&(v>510)&~water;bio[south]=4
 rural=ellipse(13,750,535,70,45)&(sid==13)&~water;bio[rural]=6;h[rural]=24.5;regions['Campinas férteis do Condado de Alia']=rural
 dead=Polygon([(835,490),(900,535),(978,576),(995,615),(974,650),(940,674),(890,674),(850,650),(820,620),(808,585),(820,540)]).contains_points(UV[13])&(sid==13)&~water;bio[dead]=13;regions['Floresta morta de Adhuc Vivere']=dead
 # Use temperate forest as the regional default; retain local cold, wetland and desert exceptions.
 temperate=~np.isin(sid,[20,24,26,49])&np.isin(bio,[3,5,7,8,9]);bio[temperate]=6
 # Castamor has open temperate woodland and green foothills, rather than an empty plain.
 castamor_woods=ellipse(13,715,690,130,95)&(sid==13)&~water;bio[castamor_woods]=6
 alia_open=rural.copy()
 neutral=(sid==47)&~water;bio[neutral]=6;vitra_meadow=ellipse(47,800,665,230,60)&neutral;bio[vitra_meadow]=4
 vir_grass=ellipse(47,810,595,220,100)&neutral;bio[vir_grass]=4
 desert=ellipse(47,790,465,155,155)&(sid==47)&~water;bio[desert]=1;h[desert]=np.minimum(h[desert],29);regions['Deserto de Guernica']=desert
 cold=ellipse(47,676,185,60,70)&(sid==47)&~water;bio[cold]=10
 valar=(orig_sid==17)&(orig_h>=20)&(sid!=13)&~water;sid[valar]=17;h[valar]=orig_h[valar];bio[valar]=orig_bio[valar];regions['Valar']=valar
 # Wetland approaches follow the preserved Goblinburgo frontier, not a new political border.
 goblin_distance=distance_transform_edt((sid!=32).reshape(ny,nx),sampling=[sy,sx]).ravel()
 marsh=(goblin_distance<92)&np.isin(sid,[13,32])&(P[:,1]>625)&(P[:,1]<758)&~water;bio[marsh]=12;h[marsh]=np.minimum(h[marsh],24.7);regions['Pântanos de Nùnar']=marsh
 # Drácon returns to a dark, inhospitable mountain island farther south.
 old_dracon=max((c for c in source if c['state']==20),key=lambda c:c['h'])['p']
 old_foot=np.linalg.norm(P-np.array(old_dracon),axis=1)<30;h[old_foot]=16;sid[old_foot]=0;bio[old_foot]=0
 dracon_center=[old_dracon[0]+5,old_dracon[1]+53];rad=np.linalg.norm(P-np.array(dracon_center),axis=1);angle=np.arctan2(P[:,1]-dracon_center[1],P[:,0]-dracon_center[0]);foot=rad<28*(1+.06*np.sin(angle*3)+.04*np.cos(angle*5));sid[foot]=20;h[foot]=22+23*np.maximum(0,1-rad[foot]/28)**1.1;bio[foot]=15;regions['Monte Drácon']=foot
 # Gugacon has the volcano, rocky ridges and ruined structures.
 volcano_center=dragon(1170,305);rad=np.linalg.norm(P-np.array(volcano_center),axis=1);foot=(rad<15)&(sid==12)&~water;h[foot]=np.maximum(h[foot],24+20*np.maximum(0,1-rad[foot]/15));bio[foot]=15
 rim=(rad<11)&(rad>4)&foot;h[rim]=41;crater=(rad<=4)&foot;h[crater]=30
 regions['Vulcão de Gugacon']=foot
 ridge(12,[(1140,320),(1170,300),(1198,345)],24,15,'Montanhas de Gugacon')
 h[crater]=30
 # Tharok: green slopes, a modest higher summit and a narrow gorge facing Baranor.
 tharok_peak=elucitor(645,540);tharok_rad=np.linalg.norm(P-np.array(tharok_peak),axis=1);tharok=(sid==13)&~water&(tharok_rad<38);h[tharok]=np.maximum(h[tharok],24+44*np.exp(-tharok_rad[tharok]**2/(2*10**2)));bio[tharok]=6
 gorge_points=[elucitor(*p) for p in [(575,540),(565,565),(575,595),(565,625),(562,650)]];gorge_dist=np.full(N,1e6)
 for a,z in zip(gorge_points,gorge_points[1:]):
  a=np.array(a);v=np.array(z)-a;t=np.clip(((P-a)*v).sum(axis=1)/(v@v),0,1);gorge_dist=np.minimum(gorge_dist,np.linalg.norm(P-a-t[:,None]*v,axis=1))
 gorge=(gorge_dist<4)&(sid==13)&~water;h[gorge]=np.minimum(h[gorge],23+gorge_dist[gorge]*.45);bio[gorge]=6;regions['Garganta de Tharok']=gorge
 baranor_green=Polygon([(230,480),(480,490),(740,560),(800,610),(810,670),(750,755),(575,760),(565,640),(375,585),(200,610)]).contains_points(UV[13])&(sid==13)&~water&~dead;bio[baranor_green]=6
 argendau_plain=ellipse(13,780,610,38,29)&(sid==13)&~water;h[argendau_plain]=24.5;bio[argendau_plain]=6
 western_green=(sid==13)&(h>=20)&~water&~marsh&(P[:,0]>620)&(P[:,0]<927)&(P[:,1]>520)&(P[:,1]<735);bio[western_green]=6
 # Dragonfall owns both the wetland approach at Malacatt and the dry lowland at Savhalla.
 malacatt_approach=ellipse(12,350,520,90,90)&(h>=20)&~water;sid[malacatt_approach]=12;bio[malacatt_approach]=6
 tagalar=ellipse(12,330,480,100,58)&(sid==12)&~water;bio[tagalar]=12;regions['Pântano de Tagalar']=tagalar
 savhalla_dry=(ellipse(12,390,835,90,65)|ellipse(12,350,710,65,100))&(h>=20)&~water;sid[savhalla_dry]=12;bio[savhalla_dry]=1
 # The southern desert salient belongs to Husaj; Savhalla stays north of this line in Dragonfall.
 desert_salient=(orig_sid==24)&(sid==12)&(P[:,1]>445)&~water;sid[desert_salient]=24;bio[desert_salient]=1
 # Mountain habitat survives above the desert; a narrow grass/soil ecotone joins both sides of the frontier.
 desert_core=(((sid==12)&ellipse(12,300,660,95,150)&~tagalar&(h<32))|((sid==24)&(h<32))|(savhalla_dry&(h<38)))&(h>=20)&~water&(bio!=13)
 desert_distance=distance_transform_edt((~desert_core).reshape(ny,nx),sampling=[sy,sx]).ravel()
 aridity=np.zeros(N);warm=np.isin(sid,[12,24])&(h>=20)&~water;aridity[warm]=np.exp(-(desert_distance[warm]/14)**2)*np.clip((42-h[warm])/12,0,1);aridity[desert_core]=1
 dry_mountains=(sid==24)&(h>=38);bio[dry_mountains]=6
 foothills=warm&(h<38)&(aridity>.02)&(aridity<.98)&~tagalar&(bio!=13);bio[foothills]=4;bio[desert_core]=1
 # Original Sobral and a snowy summit complement the area north of Candelapria.
 candel_peak=[500,685];candel_rad=np.linalg.norm(P-np.array(candel_peak),axis=1);candel=(sid==48)&(h>=20)&(candel_rad<24);h[candel]=np.maximum(h[candel],24+40*np.exp(-candel_rad[candel]**2/(2*8**2)));bio[candel]=6
 # Keep city identities and notes, but restore Kyon rather than relabelling it as Vyoh.
 cities=d['cities'];byid={b['i']:b for b in cities};nextid=4100
 for b in cities:
  if b['state']==20 and b['capital']:b.update(x=dracon_center[0]+7,y=dracon_center[1]+7,source='Revisão do autor · povoação na encosta sul da ilha de Drácon')
 def city(name,state,uv,old=None,kind='Cidade',aliases=None,mountain=False):
  nonlocal nextid
  b=byid.get(old) if old is not None else next((b for b in cities if b['name']==name and b['state']==state),None)
  if b is None:b=dict(i={'Liotorn':4000,'Vyoh':4001}.get(name,nextid),capital=0,population=None,port=0,citadel=0,walls=0,temple=0);nextid+=1;cities.append(b);byid[b['i']]=b
  xy=transforms[state](*uv);b.update(name=name,state=state,x=xy[0],y=xy[1],visible=True,reference=kind!='Vila',settlementClass=kind,source='Papel · posição registrada sobre geografia reconstruída',referencePoint=list(uv),mountainSettlement=mountain)
  if aliases:b['aliases']=aliases
  b['cell']=min(ny-1,max(0,int(xy[1]/sy)))*nx+min(nx-1,max(0,int(xy[0]/sx)))
  disk=np.linalg.norm(P-np.array(xy),axis=1)<5.5
  # Only shore settlements receive a small landing. No nearest-coast relocation is allowed.
  if not water[b['cell']]:
   sid[disk]=state;h[disk]=np.maximum(h[disk],23);bio[disk & (bio==0)]=4
   if not mountain:h[disk]=np.minimum(h[disk],29)
  return b
 for b in cities:
  if b['state'] in [12,13,47]:b['visible']=False
 E=[('Elucitor',740,310,7),('Forte Drakis',555,205,24),('Vostris',785,205,28),('Ignis',915,235,15),('Nostris',940,340,17),('Althor',515,345,197),('Vennoduro',695,380,191),('Lorvus',565,415,20),('Tramor',545,495,27),('Cetolo',295,380,1243),('Arenor',300,455,1239),('Danumbria',220,570,2000),('Condado de Alia',750,535,1244),('Meriadoc',870,455,1242),('Bomaria',960,395,161),('Adhuc Vivere',900,590,2001),('Ros Leones',905,720,2002),('Argendau',780,610,35),('Castamor',720,700,1240),('Nediora',590,740,1241),('Pantos',300,740,160),('Liotorn',270,325,None)]
 for n,u,v,i in E:
  fort=n in ['Forte Drakis','Althor','Ignis','Nostris','Vostris','Adhuc Vivere','Castamor','Arenor']
  b=city(n,13,(u,v),i,'Forte' if fort else 'Cidade',aliases=['Dracofortis'] if n=='Forte Drakis' else ['Liotoran'] if n=='Liotorn' else None)
  if fort:b.update(citadel=1,walls=1)
  if n=='Adhuc Vivere':b['source']='Papel · somente o forte, na floresta morta entre os rios'
 D=[('Asgorath',605,760,3),('Winterhelm',670,300,23),('Dagorah',275,240,10),('Malacatt',350,545,11),('Savhalla',390,835,12),('Porto das Cinzas',810,570,18),('Torre Solitária',900,380,5),('Ereth',1100,775,2),('Rivertown',755,770,4),('Gugacon',1170,330,33),('Vila Rinus',610,390,34),('Nilhelm',860,815,2003),('Vila Sardinhas',875,700,2004)]
 for n,u,v,i in D:city(n,12,(u,v),i,aliases=['Windhelm'] if n=='Winterhelm' else ['Porto Sardinhas'] if n=='Vila Sardinhas' else None,mountain=n in ['Dagorah','Gugacon'])
 V=[('Guernica',780,450,21),('Kyon',786,254,25),('Mauron',676,185,29),('Sulpa',970,170,2006),('Triovorn',1100,240,19),('Lirion',1135,420,31),('Oregon',650,485,32),('Guil',950,420,2007),('Vyoh',505,458,None),('Vir',821,653,16),('Porto do Álamo',468,578,30),('Porto de Vern',1080,600,26),('Bernut',271,553,2008)]
 for n,u,v,i in V:
  b=city(n,47,(u,v),i,kind='Forte élfico' if n in ['Triovorn','Lirion','Porto de Vern'] else 'Cidade',aliases=['Auron'] if n=='Mauron' else None,mountain=n in ['Kyon','Mauron']);
  if n in ['Triovorn','Lirion','Porto de Vern']:b.update(citadel=1,walls=1,alliance='Tríplice Élfica')
  if n in ['Kyon','Mauron']:h[b['cell']]=max(h[b['cell']],53);bio[b['cell']]=10 if n=='Mauron' else 2
 city('Fermaletim',13,(480,570),62,'Povoado').update(source='Arquivo .map · povoado reincluído na região de Baranor por orientação do autor')
 for b in cities:
  if b['i']==207:b.update(visible=True,source='Arquivo .map · Sobral reincluída próximo de Vila Candelápria')
 # Omit auxiliary villages and suppress every inherited settlement inside the author's exclusive enclaves.
 for b in cities:
  u=(b['x']-1071.32)/.60+740;dy=b['y']-530.9;v=310+dy/(.40 if dy<0 else .50)
  adhuc=800<u<1045 and 500<v<680
  ros=835<u<995 and 665<v<785
  auxiliary=b['state'] in [12,13] and b.get('settlementClass')=='Vila'
  if (adhuc and b['name']!='Adhuc Vivere') or (ros and b['name']!='Ros Leones') or auxiliary or b['i'] in [241,63,91,2005]:
   b.update(visible=False,excluded=True,exclusionReason='Removida da edição conforme revisão do autor')
  if b['i']==214:
   options=np.flatnonzero(khaj);target=np.array([780,337]);chosen=int(options[np.argmin(np.linalg.norm(P[options]-target,axis=1))]);b.update(x=float(P[chosen,0]),y=float(P[chosen,1]),aliases=['Qezola'],source='Arquivo .map · capital reposicionada no interior de Khajataad')
  if b['i']==9:b.update(x=900,y=390,source='Revisão do autor · Alqa no interior do deserto de Husaj')
 # Exact registration for previously-correct anchors, not a displaced nearest-land cell.
 assert np.linalg.norm(np.array([byid[23]['x'],byid[23]['y']])-[1090.33,283.77])<1e-6
 assert np.linalg.norm(np.array([byid[33]['x'],byid[33]['y']])-[1286,244])<1e-6
 # Paper river networks share the same registration as their lakes and towns.
 river_specs=[(12,'Rio Colozard',[(600,180),(590,260),(620,345),(565,450),(550,550),(535,640),(515,695)],2.2),(12,'Rio das Cinzas',[(670,300),(760,310),(810,420),(810,570),(860,620),(865,735),(820,770),(755,790)],2.4),(12,'Rio de Ereth',[(560,775),(700,790),(755,790),(850,820),(950,830),(1100,830),(1220,855)],2.6),(13,'Rio Celsano',[(390,225),(410,280),(370,325),(290,350),(271,370),(275,390),(320,415),(410,445),(490,470),(545,530),(560,605),(555,640),(550,675)],2.6),(13,'Rio Celsano · fronteira',[(275,390),(185,445),(125,490),(80,530),(30,570),(5,605),(25,650),(40,705),(90,755)],2.3),(13,'Rio Albo',[(160,450),(225,435),(275,390)],2.1),(13,'Rio Talion',[(735,355),(700,400),(750,450),(805,470),(835,485),(820,540),(805,585),(820,620),(850,650),(855,690),(860,720)],3.2),(13,'Rio Amares',[(980,350),(1000,425),(930,465),(835,485),(900,530),(950,568),(975,615),(977,657),(973,700),(970,740)],2.8),(12,'Rio Amestris',[(365,340),(340,390),(305,445),(300,520),(330,620),(365,665),(430,700),(465,725),(470,740)],2.0),(47,'Rio de Sulpa',[(1025,200),(990,270),(995,300),(1050,390),(1100,470),(1190,580)],1.8)]
 rivers=[]
 original_geo=json.loads(next((base.parent/'Mapas/Silvengard cells').glob('*Rivers*')).read_text(encoding='utf-8'));coords=json.loads(next((base.parent/'Mapas/Silvengard cells').glob('*Full*')).read_text(encoding='utf-8'))['mapCoordinates'];meta={r['name']:r for r in pack['rivers']}
 for f in original_geo['features']:
  pts=[[(lon-coords['lonW'])/coords['lonT']*1920,(coords['latN']-lat)/coords['latT']*937] for lon,lat in f['geometry']['coordinates']];rname=f['properties'].get('name','Rio');parts=[];part=[]
  if rname in ['Amestrino','Amestris','Rio Amestris']:continue
  for p in pts:
   ix=min(nx-1,max(0,int(p[0]/sx)));iy=min(ny-1,max(0,int(p[1]/sy)));j=iy*nx+ix
   if h[j]<20 or water[j] or sid[j] in [12,13,47] or orig_sid[j] in [12,13,47]:
    if len(part)>1:parts.append(part)
    part=[]
   else:part.append(p)
  if len(part)>1:parts.append(part)
  for part in parts:rivers.append(dict(name=rname,points=part,width=min(2.2,.55+math.sqrt(meta.get(rname,{}).get('discharge',30))/28),major=meta.get(rname,{}).get('length',0)>170,source='GeoJSON original'))
 for state,name,pts,width in river_specs:rivers.append(dict(state=state,name=name,points=[transforms[state](*p) for p in pts],width=width,major=True,source='Rede hídrica traçada do papel'))
 # Only the channel floor is gently lowered; surrounding biome coverage is retained.
 for r in rivers:
  if r['source']!='Rede hídrica traçada do papel':continue
  dist=np.full(N,1e6)
  for a,b in zip(r['points'],r['points'][1:]):
   a=np.array(a);v=np.array(b)-a;t=np.clip(((P-a)*v).sum(axis=1)/(v@v or 1),0,1);dist=np.minimum(dist,np.linalg.norm(P-a-t[:,None]*v,axis=1))
  ch=(dist<4)&(h>=20);h[ch]=np.maximum(23,h[ch]-np.maximum(0,4-dist[ch])*.5)
 # Preserve original coastal settlements in untouched states on their actual shoreline coordinates.
 for b in cities:
  if b['state'] not in [12,13,47] and b['visible']:
   disk=(np.linalg.norm(P-np.array([b['x'],b['y']]),axis=1)<8)&((sid==b['state'])|((sid==0)&~water))
   sid[disk]=b['state'];h[disk]=np.maximum(24,h[disk]);bio[disk & (bio==0)]=4
 # Keep original island towns in the reduced selection without creating new settlements or moving references.
 island_labels,island_count=label((h>=20).reshape(ny,nx));island_labels=island_labels.ravel();sizes=np.bincount(island_labels)*sx*sy
 original_burgs={b['i']:b for b in pack['burgs'] if isinstance(b,dict) and not b.get('removed') and b.get('i')}
 ros_id=int(island_labels[np.flatnonzero(ros_island)[0]])
 for b in cities:
  old=original_burgs.get(b['i'])
  if not old or b['visible'] or b.get('excluded'):continue
  ox,oy=old['x'],old['y'];j=min(ny-1,max(0,int(oy/sy)))*nx+min(nx-1,max(0,int(ox/sx)));island=int(island_labels[j])
  if island and island!=ros_id and sizes[island]<15000 and sid[j]==b['state']:
   b.update(x=ox,y=oy,visible=True,source='Arquivo .map · cidade original desta ilha',islandRestored=True)
 # Immutable ordinary settlement metadata is kept, but cell IDs now refer to a refined regular mesh.
 valid=h>=20;landtree=cKDTree(P[valid]);landids=np.flatnonzero(valid)
 for b in cities:
  j=min(ny-1,max(0,int(b['y']/sy)))*nx+min(nx-1,max(0,int(b['x']/sx)))
  if not valid[j]:
   if b['visible'] and b['state'] in [12,13,47]:raise ValueError(f"Reference town lies in water: {b['name']}")
   if b['visible']:
    options=np.flatnonzero(valid&(sid==b['state']))
    if len(options):
     _,local=cKDTree(P[options]).query([b['x'],b['y']]);j=int(options[local]);b['x'],b['y']=P[j].tolist();b['source']=b.get('source','Arquivo .map')+' · ajuste à costa revista';b['cell']=j;continue
   _,k=landtree.query([b['x'],b['y']]);j=int(landids[k]);b['x'],b['y']=P[j].tolist()
  b['cell']=j;b['culture']=12 if b.get('alliance')=='Tríplice Élfica' else source[int(nearest[j])]['culture']
  if not b['culture'] and b['state'] in transforms:b['culture']=next((s['culture'] for s in d['states'] if s['i']==b['state']),0)
 # Sea connectivity is protected after settlement preservation and original Valar restoration.
 sea=bay&~ros_island;h[sea]=16;sid[sea]=0;bio[sea]=0;water[sea]=True
 valid=h>=20
 distance=distance_transform_edt(valid.reshape(ny,nx),sampling=[sy,sx]).ravel()
 taper=np.clip(distance/20,0,1);taper=taper*taper*(3-2*taper)
 coastal=valid&np.isin(sid,[12,47]);h[coastal]=22+np.maximum(0,h[coastal]-22)*taper[coastal]
 # The lower eastern bank of Amares belongs to Valar; keep the bay open.
 eu0,ev0=UV[13].T
 amares_east=np.interp(ev0,[485,530,568,615,657,700,780],[835,900,950,975,977,973,970])
 valar_extension=(eu0>amares_east+5)&(ev0>530)&(ev0<910)&valid&~water&~ros_island&~dead&np.isin(sid,[0,13,17])
 sid[valar_extension]=17;bio[valar_extension]=14;regions['Valar · margem oriental']=valar_extension
 # Return the northern shoulder of Khajataad to Dragonfall, keeping Quegosola in its connected western territory.
 northern_shoulder=(sid==26)&valid&(P[:,1]<322)&(P[:,0]>780);sid[northern_shoulder]=12;bio[northern_shoulder]=6
 # Navi woodland extends west of Ganir. The northern Valar spur is split between the two adjoining empires.
 navi_front=np.interp(P[:,1],[480,530,590,640,685],[1270,1250,1255,1235,1220])
 northern_valar=(sid==17)&valid&(P[:,1]<685)
 sid[northern_valar&(P[:,0]<navi_front)]=13;sid[northern_valar&(P[:,0]>=navi_front)]=14;bio[northern_valar]=6
 navi_woodland=valid&(P[:,1]>=480)&(P[:,1]<685)&(P[:,0]>=navi_front)&(sid==13)
 sid[navi_woodland]=14;bio[navi_woodland]=6
 for b in cities:
  if b['i']==92 and sid[b['cell']]==12:b['state']=12
 # Move the desert capital away from the eastern frontier into the desert's interior.
 core=distance_transform_edt(((sid==24)&valid).reshape(ny,nx),sampling=[sy,sx]).ravel()
 capital=byid[9];j=int(np.argmax(core));capital.update(x=float(P[j,0]),y=float(P[j,1]),cell=j,source='Arquivo .map · capital no interior do deserto de Husaj')
 # State disks from old settlement placement must not create inland enclaves.
 physical,physical_n=label(valid.reshape(ny,nx));physical=physical.ravel()
 for country in [26,12,24]:
  parts,nparts=label(((sid==country)&valid).reshape(ny,nx));parts=parts.ravel()
  for landmass in np.unique(physical[(sid==country)&valid]):
   if not landmass:continue
   ids,counts=np.unique(parts[(physical==landmass)&(sid==country)],return_counts=True)
   if not len(ids):continue
   primary=int(ids[np.argmax(counts)])
   for component in ids:
    if component==primary:continue
    fragment=parts==component
    # Reference towns are joined to their state by a short land-only corridor.
    anchors=[b for b in cities if b['state']==country and b['visible'] and fragment[b['cell']]]
    if anchors:
     starts=np.flatnonzero(fragment);goal=parts==primary;queue=[(0,int(j)) for j in starts];heapq.heapify(queue);cost={int(j):0 for j in starts};prev={};end=None
     while queue:
      value,j=heapq.heappop(queue)
      if value!=cost[j]:continue
      if goal[j]:end=j;break
      y,x=divmod(j,nx)
      for k in [j-1 if x else -1,j+1 if x<nx-1 else -1,j-nx if y else -1,j+nx if y<ny-1 else -1]:
       if k<0 or not valid[k] or physical[k]!=landmass:continue
       if any(b['cell']==k and b['state']!=country and b['visible'] for b in cities):continue
       new=value+(1 if sid[k]==country else 4)
       if new<cost.get(k,1e30):cost[k]=new;prev[k]=j;heapq.heappush(queue,(new,k))
     if end is not None:
      trail=[]
      while end in prev:trail.append(end);end=prev[end]
      for j in trail:
       y,x=divmod(j,nx)
       for cy in range(max(0,y-1),min(ny,y+2)):
        for cx in range(max(0,x-1),min(nx,x+2)):
         k=cy*nx+cx
         if valid[k] and not any(b['cell']==k and b['state']!=country and b['visible'] for b in cities):sid[k]=country
    else:
     border=distance_transform_edt((~fragment).reshape(ny,nx)).ravel()<=1.01
     neighbours=sid[border&~fragment&valid&(sid!=country)]
     if len(neighbours):sid[fragment]=int(collections.Counter(neighbours.tolist()).most_common(1)[0][0])
 # Cold mountain forests at Liotorn/Floresta Azul and around Winterhelm.
 # Regional snow fades across broad woodland bands instead of ending at an ellipse boundary.
 eu,ev=UV[13].T;du,dv=UV[12].T;vu,vv=UV[47].T
 snow13_cover=np.clip((1.22-np.sqrt(((eu-260)/160)**2+((ev-315)/170)**2))/.45,0,1)*.55*(sid==13)*valid*np.clip((420-eu)/30,0,1)
 snow12_cover=np.clip((1.35-np.sqrt(((du-660)/210)**2+((dv-310)/215)**2))/.55,0,1)*.65*(sid==12)*valid
 snow47_cover=np.clip((1.35-np.sqrt(((vu-850)/340)**2+((vv-100)/200)**2))/.55,0,1)*.65*(sid==47)*valid
 regional_snow=np.maximum.reduce([snow13_cover,snow12_cover,snow47_cover]);snow=regional_snow>.03;bio[(regional_snow>.18)&np.isin(bio,[4,6])]=9
 # Smooth desert-to-prairie colour and remove trees along the Vir approach.
 vr=np.sqrt(((vu-790)/155)**2+((vv-465)/155)**2);vitra_dry=(sid==47)&(h>=20)&~water
 aridity[vitra_dry]=np.clip((1.35-vr[vitra_dry])/.35,0,1);bio[vitra_dry&(aridity>0)&(aridity<1)]=4
 bio[vir_grass&~desert&(h>=20)]=4
 northern_snow=np.clip((250-P[:,1])/165,0,.9)*(h>=20);northern_snow[(sid==29)]*=.7
 seasonal=northern_snow>.15;bio[seasonal&np.isin(bio,[4,6])]=9
 bio[(sid==13)&(bio==16)]=6 # Evergreen pines, including the transition below the snowline.
 # Country-specific settlement policy replaces the earlier blanket island reduction.
 complete_states={23,28,48,31,49}
 for b in cities:
  if b['state'] in complete_states and not b.get('excluded'):b.update(visible=True,islandSuppressed=False)
 byid[90]['visible']=False
 for state_id in [46,35]:
  towns=[b for b in cities if b['state']==state_id and not b.get('excluded')];target=math.ceil(len(towns)*.75)
  for b in sorted(towns,key=lambda b:-(b.get('population') or 0))[:target]:b['visible']=True
 for b in cities:
  if b['i'] in [103,149]:b['visible']=True
  if b['i']==180:
   options=np.flatnonzero((sid==33)&valid);chosen=int(options[np.argmin(np.linalg.norm(P[options]-np.array([700,400]),axis=1))]);b.update(x=float(P[chosen,0]),y=float(P[chosen,1]),cell=chosen,visible=True,source='Arquivo .map · cidade reincluída no norte de Piglia')
 main_island=int(np.argmax(sizes[1:])+1)
 dracon_towns=[b for b in cities if b['state']==20 and not b.get('excluded')]
 mainland=[b for b in dracon_towns if int(island_labels[b['cell']])==main_island]
 # Prefer a few well-separated mainland settlements over a dense cluster.
 selected_main=[]
 for b in sorted(mainland,key=lambda b:-(b.get('population') or 0)):
  if not selected_main or min(math.hypot(b['x']-a['x'],b['y']-a['y']) for a in selected_main)>=24:selected_main.append(b)
  if len(selected_main)>=6:break
 chosen={b['i'] for b in selected_main}|{b['i'] for b in dracon_towns if b['capital']}
 offshore=[b for b in dracon_towns if b not in mainland and not b['capital']]
 for b in sorted(offshore,key=lambda b:(-sizes[int(island_labels[b['cell']])],-(b.get('population') or 0)))[:3]:chosen.add(b['i'])
 chosen.discard(203);chosen.add(85) # Author: omit Sablarumrith and show Glouyaloss.
 for b in dracon_towns:b.update(visible=b['i'] in chosen,islandSuppressed=b['i'] not in chosen)
 island_towns=dracon_towns+[b for b in cities if b['state']==49];keep=[b for b in island_towns if b['visible']];island_target=len(keep)
 for b in cities:
  if b.get('islandRestored') and not b['visible']:b['islandRestored']=False
 # Smooth only land heights. Water cells and deliberate crater floors retain their physical roles.
 sm=gaussian_filter(np.maximum(h,20).reshape(ny,nx),.85).ravel();h[valid]=.5*h[valid]+.5*sm[valid]
 vertices=[]
 for gy in range(ny+1):
  for gx in range(nx+1):
   ids=[cy*nx+cx for cy in [gy-1,gy] for cx in [gx-1,gx] if 0<=cx<nx and 0<=cy<ny]
   vertices.append(dict(p=[round(gx*sx,4),round(gy*sy,4)],c=ids))
 labels=np.full(N,'',dtype=object)
 for name,mask in regions.items():
  if name.startswith('Valar'):mask=mask&(sid==17)
  labels[mask]=name
 cells=[]
 for j in range(N):
  y,x=divmod(j,nx);a=y*(nx+1)+x;src=source[int(nearest[j])];neighbours=[cy*nx+cx for cx,cy in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)] if 0<=cx<nx and 0<=cy<ny]
  c=dict(i=j,p=[round(float(P[j,0]),4),round(float(P[j,1]),4)],v=[a,a+1,a+nx+2,a+nx+1],c=neighbours,h=round(float(h[j]),3),state=int(sid[j]),biome=int(bio[j]),culture=src['culture'],pop=round(src['pop']*sx*sy/max(src.get('area',180),1),3),r=src['r'],area=sx*sy,originalHeight=int(orig_h[j]),originalBiome=int(orig_bio[j]))
  if labels[j]:c['region']=labels[j]
  if sid[j]==13 and UV[13][j,1]>510:c['woodland']=.45
  if alia_open[j]:c['woodland']=.18
  if castamor_woods[j]:c['woodland']=.25
  snow_amount=min(.9,float(regional_snow[j])+max(0,h[j]-35)/100) if snow[j] else 0
  snow_amount=max(snow_amount,float(northern_snow[j]))
  if tharok_rad[j]<12 and h[j]>52:snow_amount=max(snow_amount,.65)
  if candel_rad[j]<15 and h[j]>42:snow_amount=max(snow_amount,.75)
  if snow_amount:c['snow']=round(snow_amount,3)
  if aridity[j]>0:c['aridity']=round(float(aridity[j]),3)
  if warm[j] and bio[j]==6:c['woodland']=max(.15,1-aridity[j])
  if baranor_green[j]:c['woodland']=.65
  if western_green[j]:c['woodland']=.85
  if marsh[j]:c['woodland']=.45
  if bio[j]==13:c['woodland']=1
  if sid[j]==17:c['woodland']=.25
  cells.append(c)
 # Round the shore mesh along its true boundary, avoiding square stair-step coastlines.
 coast={}
 for c in cells:
  if c['h']<20:continue
  y,x=divmod(c['i'],nx)
  for k,(cx,cy) in enumerate([(x,y-1),(x+1,y),(x,y+1),(x-1,y)]):
   if 0<=cx<nx and 0<=cy<ny and cells[cy*nx+cx]['h']>=20:continue
   a,b=c['v'][k],c['v'][(k+1)%4];coast.setdefault(a,set()).add(b);coast.setdefault(b,set()).add(a)
 for _ in range(4):
  positions={}
  for i,ns in coast.items():
   if len(ns)!=2:continue
   old=np.array(vertices[i]['p']);mean=np.mean([vertices[j]['p'] for j in ns],axis=0);positions[i]=(.45*old+.55*mean).tolist()
  for i,pos in positions.items():vertices[i]['p']=[round(v,4) for v in pos]
 d.update(cells=cells,vertices=vertices,rivers=rivers,grid=dict(columns=nx,rows=ny,stepX=sx,stepY=sy),revision=9)
 # Place features at actual matching terrain: water for lakes, summit for mountains, mainland for ports.
 landmarks=[]
 def feature(name,state,uv,kind,aliases=None):landmarks.append(dict(name=name,point=transforms[state](*uv),kind=kind,aliases=aliases or [],source='Papel · geografia reconstruída junto com o ponto de interesse'))
 for name,state,uv,kind in [('Lago Degelado',12,(465,405),'lago'),('Lago das Lágrimas',12,(510,740),'lago'),('Lago de Rinus',12,(610,360),'lago'),('Ask-Lozard',12,(650,145),'montanha'),('Pântano de Tagalar',12,(330,480),'pântano'),('Bosques de Lirion',12,(600,695),'floresta'),('Dungabás',12,(145,440),'floresta morta'),('Ruínas de Amestris',12,(350,710),'ruínas'),('Angra dos Goblins',12,(680,525),'povoado'),('Ilha Limiar',12,(1040,335),'ilha'),('Mansão Longrock',12,(1030,465),'mansão'),('Lago Cetolo',13,(235,365),'lago'),('Lago Etalas',13,(740,270),'lago'),('Cordilheira de Liotorn',13,(220,250),'montanha'),('Monte Vathnis',13,(330,145),'montanha'),('Montanhas centrais',13,(580,360),'montanha'),('Montanhas de Tharok',13,(645,540),'montanha'),('Monte Ganir',13,(1120,270),'montanha'),('Bosque de Ari',13,(580,235),'floresta'),('Floresta Azul',13,(250,455),'floresta'),('Bosque Meridiano',13,(550,460),'floresta'),('Bosque de Ereth',13,(850,135),'floresta'),('Bosque de Bomaria',13,(890,390),'floresta'),('Floresta morta',13,(900,600),'bioma'),('Enseada de Ros Leones',13,(945,720),'baía'),('Baía de Baranor',13,(400,650),'baía'),('Deserto de Guernica',47,(790,440),'deserto'),('Montanhas de Kyon',47,(786,245),'montanha'),('Montanhas do Norte',47,(850,125),'montanha'),('Ilha Pirata',47,(343,205),'ilha')]:feature(name,state,uv,kind)
 landmarks.append(dict(name='Monte Drácon',point=dracon_center,kind='montanha',source='Revisão do autor · ilha montanhosa de solo negro, ao sul'))
 landmarks.append(dict(name='Vulcão de Gugacon',point=volcano_center,kind='vulcão',source='Revisão do autor · cratera e encostas vulcânicas'))
 feature('Ruínas de Gugacon',12,(1205,355),'ruínas')
 feature('Garganta de Tharok',13,(570,600),'desfiladeiro')
 landmarks.append(dict(name='Pico nevado de Tharok',point=tharok_peak,kind='montanha',source='Revisão do autor · cume central e encostas verdes'))
 landmarks.append(dict(name='Pico de Candelápria',point=candel_peak,kind='montanha',source='Revisão do autor · pico nevado próximo da vila'))
 feature('Campinas de Alia',13,(750,535),'campinas')
 feature('Pântanos de Nùnar',13,(-10,620),'pântano')
 next(l for l in landmarks if l['name']=='Lago Cetolo')['aliases']=[]
 marsh_anchor=int(np.argmin(np.where(marsh,np.linalg.norm(P-np.array([650,695]),axis=1),np.inf)));next(l for l in landmarks if l['name']=='Pântanos de Nùnar')['point']=P[marsh_anchor].tolist()
 landmarks.append(dict(name='Deserto de Husaj',point=[900,405],kind='deserto',source='Correção do autor'))
 # Paper names whose positions remain partially legible are explicitly identified in the town source.
 for b in cities:
  if b['name'] in ['Guil','Sulpa'] and b['state']==47:b['source']='Papel prioritário; posição aproximada · nome auxiliado pelo digital'
 feature('Florestas de Navï Velaffëll',13,(1180,415),'floresta')
 feature('Ruínas de Alnien',13,(430,380),'ruínas')
 feature('Mar de Nur',13,(180,780),'mar')
 feature('Mar Nórdico',12,(620,-330),'mar')
 d['landmarks']=landmarks;d['volcano']={'point':volcano_center,'floorHeight':30,'radius':2,'rimRadius':7}
 d['fortifications']=[{'name':'Muralha de Rimae','points':[elucitor(915,235),elucitor(940,340)]},{'name':'Muralha de Policia','points':[elucitor(785,205),elucitor(915,235)]}]
 d['farmland']=[]
 d['marshes']=[c['p'] for c in cells if c['biome']==12 and c.get('region')=='Pântanos de Nùnar' and c['i']%5==0]
 d['referenceAuthority']={'elucitor':'elucitor.jpeg','note':'Desenho de papel confirmado pelo autor nesta revisão; prioridade sobre outras versões.'}
 d['fortifications'].append({'name':'Muralhas da Tríplice Élfica','points':[vitra(1100,240),vitra(1135,420),vitra(1080,600)]})
 # Reuse genuine emblem associations from the supplied files.
 crest={'elucitor':'elucitor-county','castamor':'castamor-county','cetolo':'cetolo-shire','condado de alhia':'alhia','condado de alia':'alhia','ros leones':'ros-leones'}
 import unicodedata,re
 for b in cities:
  key=''.join(c for c in unicodedata.normalize('NFKD',b['name'].lower()) if not unicodedata.combining(c));slug=crest.get(key,re.sub('[^a-z0-9]+','-',key).strip('-'));asset='emblems/'+slug+'.png';b['emblem']=asset if (base/'app/dist'/asset).exists() else None
 # Rebuild overland roads through the reconstructed terrain. Water crossings are never guessed.
 routes=[]
 for r in pack['routes']:
  if r['group']=='searoutes':continue
  part=[]
  for p in r['points']:
   j=min(ny-1,max(0,int(p[1]/sy)))*nx+min(nx-1,max(0,int(p[0]/sx)))
   if cells[j]['h']<20 or cells[j]['state'] in [12,13,47]:
    if len(part)>1:routes.append(dict(i=len(routes),group=r['group'],points=part))
    part=[]
   else:part.append([p[0],p[1],j])
  if len(part)>1:routes.append(dict(i=len(routes),group=r['group'],points=part))
 def path(start,end,state):
  q=[(0,start)];cost={start:0};prev={}
  while q:
   _,i=heapq.heappop(q)
   if i==end:
    chain=[i]
    while chain[-1]!=start:chain.append(prev[chain[-1]])
    return [cells[j]['p']+[j] for j in reversed(chain)]
   for j in cells[i]['c']:
    if cells[j]['h']<20 or cells[j]['state']!=state:continue
    nxt=cost[i]+6*(1+abs(cells[j]['h']-cells[i]['h'])/8+(5 if cells[j]['biome']==12 else 0))
    if nxt<cost.get(j,1e20):cost[j]=nxt;prev[j]=i;dest=cells[end]['p'];heur=math.dist(cells[j]['p'],dest);heapq.heappush(q,(nxt+heur,j))
  return None
 for state in [12,13,47]:
  towns=[b for b in cities if b['state']==state and b['visible']];parents=list(range(len(towns)))
  def root(i):
   while parents[i]!=i:i=parents[i]
   return i
  pairs=sorted((math.hypot(a['x']-b['x'],a['y']-b['y']),i,j) for i,a in enumerate(towns) for j,b in enumerate(towns) if i<j)
  for _,i,j in pairs:
   if root(i)==root(j):continue
   a,b=towns[i],towns[j];pts=path(a['cell'],b['cell'],state)
   if pts:parents[root(i)]=root(j);routes.append(dict(i=len(routes),group='roads',points=[[a['x'],a['y'],a['cell']]]+pts+[[b['x'],b['y'],b['cell']]],source='Estrada sobre terra reconstruída'))
 d['routes']=routes
 for s in d['states']:
  ids=[c for c in cells if c['state']==s['i'] and c['h']>=20];s['area']=sum(c['area'] for c in ids)
  if s['i'] in [12,13,47]:
   b=next(b for b in cities if b['i']==s['capital']);s['pole']=[b['x'],b['y']]
 d['geography']={'rosLeonesIslandCells':np.flatnonzero(ros_island).tolist(),'bayCells':np.flatnonzero(bay&~ros_island).tolist(),'source':'Costa e acidentes traçados das referências de papel'}
 d['islandSelection']={'before':len(island_towns),'after':len(keep),'target':island_target,'draconMainland':len(mainland),'draconSelected':len(chosen)}
 d['curation']={'selected':sum(b['visible'] for b in cities),'original':239,'note':'Papel como referência principal; digital auxiliar para nomes. Coordenadas explícitas, sem ajuste à costa mais próxima.'}
 (base/'registro-papel.json').write_text(json.dumps({'dragonfallAnchors':{'Winterhelm':[1090.33,283.77],'Gugacon':[1286,244]},'cities':[{'name':b['name'],'state':b['state'],'paper':b.get('referencePoint'),'world':[b['x'],b['y']]}for b in cities if b['visible'] and b['state'] in [12,13,47]],'note':'Vitravion: geometria e posições do papel; nomes pouco legíveis auxiliados pelo digital.'},ensure_ascii=False,indent=2),encoding='utf-8')
 return d
