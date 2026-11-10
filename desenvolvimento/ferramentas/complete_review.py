from apply_approved_economy import ROOT,read,write
from finish_v40_runtime import B
for base in [ROOT,ROOT.parent/'silvengard-atlas v2']:
 w=read(base/'app/dist/world.json');d=read(base/'app/dist/economy-source.json');w['economyEdits']['initialGoldPerResident']=1;d['calibration']['initialWorkingCapitalPOPerResident']=1
 write(base/'app/dist/world.json',w);write(base/'app/dist/economy-source.json',d)
p=B/'persistent_defaults.py';s=p.read_text(encoding='utf-8');s=s.replace("['economyEdits','economicReview','activeWars','localTradeAgreements','routes']", "['economyEdits','economicReview','activeWars','localTradeAgreements','routes','networkDefaults','networkReview','savedDefaults','authorAtlasDefaults']");p.write_text(s,encoding='utf-8')
