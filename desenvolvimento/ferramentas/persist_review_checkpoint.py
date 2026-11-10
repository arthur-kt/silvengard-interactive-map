from apply_approved_economy import ROOT,read,write
for base in [ROOT,ROOT.parent/'silvengard-atlas v2']:
 w=read(base/'app/dist/world.json');d=read(base/'app/dist/economy-source.json');config=read(base/'dados/economic-review-defaults.json')
 manifest=read(base/'app/saved-author-defaults.json')
 config['priorRevisionIds']=[r['id'] for r in manifest['revisions']]
 old=read(base/'acervo/backups/v40-before-approved-economy/dist/world.json')
 for b in w['cities']:
  previous=next(c for c in old['cities'] if c['i']==b['i'])
  if b['demographics']!=previous['demographics'] or b.get('seasonalVisitors') or b.get('economicStatus') or b.get('socialProfile'):
   config['demographics'][str(b['i'])]={key:b[key] for key in ['population','demographics','seasonalVisitors','economicStatus','socialProfile','forcedLaborShare'] if key in b}
 for key in ['economyEdits','economicReview','activeWars','localTradeAgreements','routes','networkDefaults','networkReview','savedDefaults','authorAtlasDefaults']:config[key]=w[key]
 write(base/'dados/economic-review-defaults.json',config);write(base/'economy-review-source.json',d)
print('Approved checkpoints persisted independently')
