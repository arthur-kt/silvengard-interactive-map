"""Produce a review-only province proposal on the author's current geography."""
from pathlib import Path
import collections,heapq,json,math,colorsys
import numpy as np
from scipy.ndimage import label
from PIL import Image,ImageDraw,ImageFont,ImageColor

base=Path(__file__).resolve().parents[2]
existing=base/'app/dist/province-proposal.json'
if existing.exists() and json.loads(existing.read_text(encoding='utf-8')).get('approved'):
 raise SystemExit('As províncias foram aprovadas. Use o editor do Atlas para alterar a divisão existente.')
w=json.loads((base/'app/dist/world.json').read_text(encoding='utf-8'))
g=w['grid'];nx=g['columns'];ny=g['rows'];cells=w['cells'];towns={b['i']:b for b in w['cities']};states={s['i']:s for s in w['states']}
owners=np.array([c['state'] for c in cells]).reshape(ny,nx);land=np.array([c['h']>=20 for c in cells]).reshape(ny,nx)
assigned=np.zeros(len(cells),dtype=np.int32);cost=np.full(len(cells),np.inf);barrier=np.zeros(len(cells),dtype=np.bool_)
for r in w['rivers']:
 if not r.get('major'):continue
 for a,b in zip(r['points'],r['points'][1:]):
  for t in np.linspace(0,1,max(2,math.ceil(math.dist(a[:2],b[:2])/2))):
   x=int((a[0]+(b[0]-a[0])*t)/g['stepX']);y=int((a[1]+(b[1]-a[1])*t)/g['stepY'])
   if 0<=x<nx and 0<=y<ny:barrier[y*nx+x]=True

elucitor=[('Distrito Imperial de Elucitor',7,'Centro político e entorno da capital.'),('Marcha de Rimae',28,'Fortes de Vostris, Ignis e Nostris e acessos orientais.'),('Marca de Drakis',24,'Fronteira setentrional e caminho de Mestrina.'),('Terras de Etalas',197,'Althor, bosque de Ari e margens do lago Etalas.'),('Terras de Cetolo',1243,'Lago Cetolo e ligação com Liotorn.'),('Marca de Arenor',1239,'Arenor e transição para as fronteiras do oeste.'),('Marchas de Danumbria e Nùnar',2000,'Danumbria, comunidades ocidentais e fronteira dos pântanos de Nùnar.'),('Península de Pantos',160,'Pantos, Feixos e a costa da península sudoeste.'),('Bosque Meridiano',27,'Tramor e região florestal de Lorvus.'),('Condado de Alia',1244,'Campinas centrais e assentamentos rurais.'),('Marca de Castamor',1240,'Castamor, Nediora e costa meridional.'),('Terras entre Rios',2001,'Adhuc Vivere e seu entorno entre os rios.'),('Ilha de Ros Leones',2002,'Unidade insular própria em torno do porto.')]
provinces=[];queue=[]
def seed(state,name,seat,point=None,note='Divisão territorial sugerida a partir das localidades e do relevo.'):
 b=towns.get(seat);point=point or ([b['x'],b['y']] if b else None)
 i=(int(point[1]/g['stepY'])*nx+int(point[0]/g['stepX']))
 if not land.ravel()[i] or owners.ravel()[i]!=state:
  candidates=np.flatnonzero(((owners==state)&land).ravel());i=min(candidates,key=lambda j:math.dist(cells[int(j)]['p'],point))
 if assigned[i]:return
 id=len(provinces)+1;h=(id*.61803398875)%1;rgb=colorsys.hls_to_rgb(h,.68,.42);color='#'+''.join(f'{round(v*255):02x}' for v in rgb)
 number=sum(p['state']==state for p in provinces)+1
 provinces.append({'i':id,'state':state,'number':number,'name':name,'seat':seat,'seed':int(i),'note':note,'color':color})
 assigned[i]=id;cost[i]=0;heapq.heappush(queue,(0,int(i),id))

for s in w['states']:
 id=s['i']
 if not id:continue
 bs=[b for b in w['cities'] if b['state']==id]
 if id==13:
  for name,seat,note in elucitor:
   point=[sum(towns[i]['x'] for i in [15,17,28])/3,sum(towns[i]['y'] for i in [15,17,28])/3] if seat==28 else None
   seed(id,name,seat,point=point,note=note)
  p=next(p for p in provinces if p['seat']==28)
  for fid in [15,17,28]:
   i=towns[fid]['cell'];assigned[i]=p['i'];cost[i]=0;heapq.heappush(queue,(0,i,p['i']))
  # The imperial district includes the capital island and its mainland landing.
  p=next(p for p in provinces if p['seat']==7);candidates=np.flatnonzero(((owners==13)&land).ravel());i=int(min(candidates,key=lambda i:math.dist(cells[int(i)]['p'],[1070,570])));assigned[i]=p['i'];cost[i]=0;heapq.heappush(queue,(0,i,p['i']))
 else:
  target=min(6,max(1,math.ceil(len(bs)/3)));chosen=[]
  if bs:
   chosen=[next((b for b in bs if b['i']==s['capital']),max(bs,key=lambda b:b['demographics']['population']))]
   while len(chosen)<min(target,len(bs)):
    b=max((b for b in bs if b not in chosen),key=lambda b:min(math.hypot(b['x']-c['x'],b['y']-c['y']) for c in chosen)*(1+.08*math.log1p(b['demographics']['population'])))
    chosen.append(b)
  titles={12:['Ducado','Marca','Senhorio'],14:['Domínio','Principado','Cantão'],20:['Prefeitura Imperial','Marca','Domínio'],23:['Salão','Senhorio das Forjas','Domínio de Pedra'],24:['Emirado'],26:['Domínio'],28:['Ducado','Condado'],29:['Território do Clã','Marca'],31:['Distrito','Condado'],32:['Domínio'],33:['Principado','Condado'],34:['Campinas','Marca das Estepes'],35:['Salão','Senhorio'],46:['Ducado','Condado','Marca'],47:['Domínio','Marca','Principado'],48:['Condado','Ducado'],49:['Marca','Condado','Senhorio']}
  for k,b in enumerate(chosen):
   options=titles.get(id,['Domínio','Marca','Condado']);prefix='Costa' if b.get('majorPort') else options[k%len(options)]
   seed(id,prefix+' de '+b['name'],b['i'])
 # Islands and disconnected pieces receive their own seed, rather than borrowing across sea.
 components,n=label((owners==id)&land)
 for component in range(1,n+1):
  indices=np.flatnonzero((components==component).ravel())
  if any(assigned[int(i)] for i in indices):continue
  candidates=[b for b in bs if components.ravel()[b['cell']]==component]
  if candidates:
   b=max(candidates,key=lambda b:b['demographics']['population']);seed(id,('Distrito Insular de ' if len(indices)<400 else 'Senhorio de ')+b['name'],b['i'])
  else:
   i=int(indices[len(indices)//2]);seed(id,'Ilhas de '+s['name'].strip() if len(indices)<400 else 'Terras altas de '+s['name'].strip(),None,point=cells[i]['p'],note='Área separada sem sede urbana definida na proposta.')

# Additional administrative centers guide continuous boundaries, rather than
# changing only the city list. Keep the seat of every neighboring province.
for town,seat in [(68,1239),(35,1240),(1242,1244)]:
 p=next(p for p in provinces if p['state']==13 and p['seat']==seat)
 i=towns[town]['cell'];assigned[i]=p['i'];cost[i]=0;heapq.heappush(queue,(0,i,p['i']))
for p in provinces:
 if p['state']==13:
  p['name']={'Terras de Etalas':'Ducado de Etalas','Terras de Cetolo':'Condado de Cetolo','Terras entre Rios':'Senhorio de Adhuc Vivere'}.get(p['name'],p['name'])
  if p['seat']==1239:p['note']='Arenor e Parnum, com os acessos à fronteira ocidental.'
  if p['seat']==1240:p['note']='Castamor, Argendau, Nediora e costa meridional.'
  if p['seat']==1244:p['note']='Campinas de Alia e Meriadoc; Argendau integra Castamor.'

while queue:
 distance,i,pid=heapq.heappop(queue)
 if distance!=cost[i] or assigned[i]!=pid:continue
 p=provinces[pid-1];y,x=divmod(i,nx)
 for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
  xx=x+dx;yy=y+dy
  if not(0<=xx<nx and 0<=yy<ny):continue
  j=yy*nx+xx;c=cells[j]
  if c['h']<20 or c['state']!=p['state']:continue
  step=(g['stepX'] if dx else g['stepY'])*(1+abs(c['h']-cells[i]['h'])/13+max(0,c['h']-48)/90)
  if barrier[i]!=barrier[j]:step*=3.5
  if p['seat']==2001 and c['biome']!=13:step*=14
  value=distance+step
  if value<cost[j]:cost[j]=value;assigned[j]=pid;heapq.heappush(queue,(value,j,pid))

for p in provinces:
 indices=np.flatnonzero(assigned==p['i']);p['cells']=len(indices);p['area']=round(sum(cells[int(i)]['area'] for i in indices)*w['settings']['distanceScale']**2)
 p['cities']=[b['i'] for b in w['cities'] if assigned[b['cell']]==p['i']]
 centroid=np.mean([cells[int(i)]['p'] for i in indices],axis=0);p['labelPoint']=cells[int(min(indices,key=lambda i:math.dist(cells[int(i)]['p'],centroid)))]['p']
proposal={'format':'silvengard-province-proposal-v1','version':'proposal-v25','approved':False,'title':'Proposta de províncias · para revisão','baseId':w.get('savedDefaults',{}).get('id'),'grid':g,'cellProvinces':assigned.tolist(),'provinces':provinces}
(base/'app/dist/province-proposal.json').write_text(json.dumps(proposal,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

font_path='C:/Windows/Fonts/georgia.ttf'
def font(size):return ImageFont.truetype(font_path,size)
def image(state=None):
 ids=np.flatnonzero(((owners==state)&land).ravel()) if state else np.flatnonzero(land.ravel())
 xs=[cells[int(i)]['p'][0] for i in ids];ys=[cells[int(i)]['p'][1] for i in ids]
 x0=max(0,min(xs)-35);y0=max(0,min(ys)-35);x1=min(1920,max(xs)+35);y1=min(937,max(ys)+35)
 width=1760;mapheight=round((y1-y0)/(x1-x0)*width);padding=70;legend=310 if state else 90
 canvas=Image.new('RGB',(width,mapheight+padding+legend),'#122b35');draw=ImageDraw.Draw(canvas)
 sx=width/(x1-x0);sy=mapheight/(y1-y0)
 def point(p):return ((p[0]-x0)*sx,padding+(p[1]-y0)*sy)
 for c in cells:
  if c['h']<20:continue
  x,y=c['p'];
  if not(x0-g['stepX']<=x<=x1+g['stepX'] and y0-g['stepY']<=y<=y1+g['stepY']):continue
  pid=int(assigned[c['i']]);color=provinces[pid-1]['color'] if pid and (not state or c['state']==state) else '#566d70'
  a=point([x-g['stepX']/2,y-g['stepY']/2]);b=point([x+g['stepX']/2,y+g['stepY']/2]);draw.rectangle([*a,*b],fill=color)
 for c in cells:
  if c['h']<20 or state and c['state']!=state:continue
  pid=int(assigned[c['i']]);x=c['i']%nx;y=c['i']//nx
  for dx,dy in [(1,0),(0,1)]:
   if x+dx>=nx or y+dy>=ny:continue
   j=c['i']+dx+dy*nx;other=cells[j]
   if other['h']<20 or assigned[j]!=pid:
    cx,cy=c['p'];a=[cx+g['stepX']/2,cy-g['stepY']/2] if dx else [cx-g['stepX']/2,cy+g['stepY']/2];b=[cx+g['stepX']/2,cy+g['stepY']/2]
    draw.line([point(a),point(b)],fill='#253637',width=2 if other['state']==c['state'] else 4)
 for r in w['rivers']:
  if r.get('major') and len(r['points'])>1:draw.line([point(p) for p in r['points']],fill='#4b8494',width=3)
 selected=[p for p in provinces if not state or p['state']==state]
 for p in selected:
  x,y=point(p['labelPoint']);text=str(p['number']) if state else str(p['i']);r=15 if state else 10
  draw.ellipse((x-r,y-r,x+r,y+r),fill='#142f38',outline='#f4e5b9',width=2);draw.text((x,y),text,font=font(18 if state else 12),anchor='mm',fill='#ffffff')
 if state:
  for b in w['cities']:
   if b['state']!=state:continue
   x,y=point([b['x'],b['y']]);near=any(math.dist([x,y],point(p['labelPoint']))<22 for p in selected)
   if not near:draw.ellipse((x-4,y-4,x+4,y+4),fill='#13282d',outline='#fff5df')
   draw.text((x+(24 if near else 7),y+4),b['name'],font=font(15),fill='#182b2d',stroke_width=1,stroke_fill='#ffffffaa'[:7])
 draw.rectangle((0,0,width,padding),fill='#122b35');title='Elucitor — proposta de 13 províncias' if state else 'Silvengard — proposta de divisões provinciais'
 draw.text((30,16),title,font=font(29),fill='#ead5a4');draw.text((30,50),'PROPOSTA PARA REVISÃO · nenhuma divisão foi aprovada ou tornada definitiva',font=font(15),fill='#b7cece')
 start=padding+mapheight+20
 if state:
  for k,p in enumerate(selected):
   col=k%3;row=k//3;x=30+col*575;y=start+row*47;draw.rectangle((x,y+2,x+24,y+26),fill=p['color']);draw.text((x+34,y),f'{p["number"]}. {p["name"]}',font=font(19),fill='#ead5a4');draw.text((x+34,y+23),'Sede: '+(towns[p['seat']]['name'] if p['seat'] else 'a definir'),font=font(14),fill='#b7cece')
 else:draw.text((30,start),'A divisão detalhada e os nomes sugeridos podem ser explorados no modo “Províncias · proposta” do Atlas.',font=font(20),fill='#d3dfd7')
 return canvas
image(13).save(base/'proposta-provincias-elucitor.png');image().save(base/'proposta-provincias-silvengard.png')
lines=['# Proposta de províncias de Silvengard','','**Proposta para revisão; não aprovada.**','','As divisões usam as cidades atuais, a continuidade de terra e as fronteiras dos estados. O relevo e os rios dificultam a expansão das áreas; ilhas recebem unidades separadas. Cultura e religião não foram alteradas.','']
for s in w['states']:
 if not s['i']:continue
 lines.extend(['## '+s['name'].strip(),'','| Nº | Nome sugerido | Sede | Cidades e localidades |','| --- | --- | --- | --- |'])
 for p in provinces:
  if p['state']==s['i']:lines.append('| '+str(p['number'])+' | '+p['name']+' | '+(towns[p['seat']]['name'] if p['seat'] else 'A definir')+' | '+', '.join(towns[i]['name'] for i in p['cities'])+' |')
 lines.append('')
lines.extend(['## Editar no Atlas','','Abra **Províncias · proposta**. Escolha um estado e uma província para consultar as localidades e a soma de suas populações. O nome pode ser alterado em **Salvar nome**.','','Ative **Pincel de limites**, ajuste o raio e arraste no terreno para transferir células à província escolhida. O pincel preserva água e fronteiras dos estados. Há **Desfazer / Refazer**; **Esc** desliga o pincel.','','As alterações ficam salvas no navegador. **Exportar províncias** gera um JSON específico; **Exportar edição** inclui tudo. **Definir como padrão** salva as alterações nos arquivos locais com backup para as próximas aberturas.','','A população exibida soma os habitantes das localidades atuais, sem estimar população rural. As divisões continuam sendo uma proposta editável.','','## Critérios específicos de Elucitor',''])
for p in provinces:
 if p['state']==13:lines.append('- **'+p['name']+'**: '+p['note'])
(base/'Proposta-de-provincias.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('Proposal:',len(provinces),'provinces;',sum(p['state']==13 for p in provinces),'in Elucitor')
