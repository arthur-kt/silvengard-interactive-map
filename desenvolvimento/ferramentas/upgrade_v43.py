from pathlib import Path
import json,shutil,hashlib,re
B=Path(__file__).resolve().parents[2];roots=[B,B.parent/'silvengard-atlas v2']
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
coa={'t1':'sanguine','charges':[{'charge':'wyvern','t':'sable','p':'e','size':1.5}],'division':{'division':'perPile','line':'arched','t':'sable'},'shield':'horsehead2'}
for root in roots:
 backup=root/'acervo/backups/v43-before-consumption';backup.mkdir(exist_ok=True)
 for name in ['dist','app/historic_archives']:
  if (root/name).exists() and not (backup/name).exists():shutil.copytree(root/name,backup/name)
 for name in ['scenario-defaults.json','economic-review-defaults.json','economy-review-source.json','Silvengard_Mercados_Atualizado.md']:
  if not (backup/name).exists():shutil.copy2(root/name,backup/name)
 w=read(root/'app/dist/world.json');d=read(root/'app/dist/economy-source.json')
 if d.get('consumptionRevision')==43:continue
 share=.05
 # Marketed surplus only: the same abstraction applies to basic food supply and demand.
 staples={g['i'] for g in d['goods'] if g.get('demandCoverage',{}).get('food',0)>0 and not g.get('recipes')}
 for city,rows in d['cityDefaults'].items():
  for g in list(rows):
   if int(g) in staples:rows[g]=round(rows[g]*share,6)
 for rows in w['economyEdits'].get('cityProduction',{}).values():
  for g in list(rows):
   if int(g) in staples:rows[g]=round(rows[g]*share,6)
 for s in d['ruralSites']:
  if s['goodId'] in staples:s['units']*=share
 d['calibration'].update(foodEconomyShare=share,subsistenceOutsideLedger=True,socialConsumption=True,foodDemandPer1000Per30Days=30*share)
 w['economyEdits']['foodPer1000']*=share;d['consumptionRevision']=43
 alqa=next(m['i'] for m in d['markets'] if next(b for b in w['cities'] if b['i']==m['centerCity'])['name']=='Alqa')
 for b in w['cities']:
  if b['state']==28:d['cityMarkets'][str(b['i'])]=alqa
 # Preserve all four cities and their identities; only market membership changes.
 text=(root/'Silvengard_Mercados_Atualizado.md').read_text(encoding='utf-8');blocks=re.split(r'(?=^### )',text,flags=re.M);moving=[]
 for i,block in enumerate(blocks):
  lines=block.splitlines();moving.extend(l for l in lines if l.startswith('| Veniun |'));blocks[i]='\n'.join(l for l in lines if not l.startswith('| Veniun |'))+'\n'
 for i,block in enumerate(blocks):
  if block.startswith('### Mercado de Alqa '):blocks[i]=block.rstrip()+'\n'+'\n'.join(moving)+'\n\n'
 (root/'Silvengard_Mercados_Atualizado.md').write_text(''.join(blocks),encoding='utf-8')
 cfg=read(root/'scenario-defaults.json');cfg['heraldry']['20']=coa;write(root/'scenario-defaults.json',cfg)
 st=next(s for s in w['states'] if s['i']==20);st['coa']=coa;st['emblem']='heraldry/author-state-20-v19.svg';st['emblemProvenance']={'kind':'author','label':'Brasão definido pelo autor'}
 w['economicReview']['consumptionRevision']=43;w['economyStateArchiveV42']=w.get('economyState');w['economyState']={'format':'silvengard-economy-state-v1','cycle':0,'accounts':{},'history':[],'last':None}
 w['savedDefaults']['id']=hashlib.sha256((w['savedDefaults']['id']+'consumption43').encode()).hexdigest();w['authorAtlasDefaults']['id']=w['savedDefaults']['id']
 write(root/'app/dist/world.json',w);write(root/'app/dist/economy-source.json',d)
print('Both independent worlds upgraded: 5% marketed food, social consumption, Veniun -> Alqa, exact Dracon COA')
