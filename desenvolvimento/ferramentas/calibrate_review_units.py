"""Replace abstract food bundles with physical commercial lots, preserving food capacity.

This is a unit conversion, not a sixty-fold increase in the number of people fed.
One former coverage bundle represented 60,000 person-days. The new demand point
represents 1,000 person-days, with an assumed ration of 0.5 kg/person/day.
"""
from apply_approved_economy import ROOT,read,write
for base in [ROOT,ROOT.parent/'silvengard-atlas v2']:
 w=read(base/'app/dist/world.json');d=read(base/'app/dist/economy-source.json')
 if d['calibration'].get('physicalFoodUnits'):continue
 cover={9:1,10:.4,11:.8,12:.3,14:.5,17:.6,30:.08,37:10,64:1,66:.5}
 old={g['i']:g.get('demandCoverage',{}).get('food',0) for g in d['goods']}
 factors={g:60*old[g]/c for g,c in cover.items()}
 # Brewing and distillation are sold as small barrels, not old abstract industrial bundles.
 factors.update({67:120,68:120})
 for g in d['goods']:
  i=g['i'];g['demandCoverage'].pop('food',None) if g.get('demandCoverage') else None
  if i in cover:
   g.setdefault('demandCoverage',{})['food']=cover[i];g['foodPeopleDays']=round(cover[i]*1000);g['massTonnes']=cover[i]*.5
  else:g.pop('foodPeopleDays',None)
  if i in [9,11,14,17,64,66]:g['unit']='lote alimentar'
  if i in [10,12,30]:g['massTonnes']={10:.5,12:.15,30:.06}[i]
  for recipe in g.get('recipes',[]):
   for key in recipe:recipe[key]*=factors.get(int(key),1)/factors.get(i,1)
 for profile in d['profiles'].values():
  for row in profile['production']:
   row['units']*=factors.get(row['goodId'],1)
   for r in row.get('recipe',[]):r['units']*=factors.get(r['goodId'],1)
 for table in [d['cityDefaults'],w['economyEdits']['cityProduction']]:
  for rows in table.values():
   for key in rows:rows[key]*=factors.get(int(key),1)
 for site in d['ruralSites']:site['units']*=factors.get(site['goodId'],1)
 w['economyEdits']['foodPer1000']*=60
 d['calibration'].update(physicalFoodUnits=True,foodLoadTonnes=.5,foodPeopleDaysPerCoverage=1000,foodKgPerPersonDay=.5,foodDemandPer1000Per30Days=30,conversion='Old food coverage preserved; physical units converted by edible yield.')
 write(base/'app/dist/world.json',w);write(base/'app/dist/economy-source.json',d)
 print(base.name,'food units converted')
