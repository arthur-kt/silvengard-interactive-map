from pathlib import Path
import json,shutil
B=Path(__file__).resolve().parents[2]
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
for root in [B,B.parent/'silvengard-atlas v2']:
 w=read(root/'app/dist/world.json');d=read(root/'app/dist/economy-source.json');old=d['calibration']['foodEconomyShare'];target=.01;ratio=target/old
 staples={g['i'] for g in d['goods'] if g.get('demandCoverage',{}).get('food',0)>0 and not g.get('recipes')}
 for rows in [*d['cityDefaults'].values(),*w['economyEdits']['cityProduction'].values()]:
  for key in rows:
   if int(key) in staples:rows[key]=round(rows[key]*ratio,6)
 for site in d['ruralSites']:
  if site['goodId'] in staples:site['units']*=ratio
 d['calibration']['foodEconomyShare']=target;d['calibration']['foodDemandPer1000Per30Days']=30*target;w['economyEdits']['foodPer1000']=30*target
 write(root/'app/dist/world.json',w);write(root/'app/dist/economy-source.json',d)
p=B/'app/dist/economy-simulation.js';s=p.read_text(encoding='utf-8')
s=s.replace('function consumeLuxury(n){','function consumeLuxury(n,classId){').replace('for(const r of report.classes){const basket','for(const r of report.classes.filter(r=>r.id===classId)){const basket')
s=s.replace('report.luxurySpent+=result.spent;}}}', '''report.luxurySpent+=result.spent;}
  // Unspent luxury money may seek another available item in the same class basket.
  for(const [id]of basket){const budget=Math.max(0,r.luxuryBudget-r.luxurySpent);if(budget<=1e-8)break;const result=spendHousehold(n,id,budget/Math.max(.000001,price(n,id)),budget);r.luxurySpent+=result.spent;r.goods[id]=(r.goods[id]||0)+result.used;report.luxurySpent+=result.spent;}
 }}''')
s=s.replace('consumeCategory(n,category);consumeLuxury(n);last.demand[n.id]','consumeCategory(n,category);last.demand[n.id]')
needle=' // Logistics and service wages'
s=s.replace(needle," for(const id of ['aristocratic','wealthy','comfortable','modest','peasant'])for(const n of foodOrder)consumeLuxury(n,id);\n"+needle)
p.write_text(s,encoding='utf-8')
p=B/'app/dist/economy-ledger.js';s=p.read_text(encoding='utf-8').replace('Só 5% da oferta e da necessidade básica de alimentos entram neste balanço; 95%', 'Só 1% da oferta e da necessidade básica de alimentos entram neste balanço; 99%');p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/approved-economy.test.mjs';s=p.read_text(encoding='utf-8').replace('>500&&report.production.get(9)<1000','>100&&report.production.get(9)<200');p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/consumption-v43.test.mjs';s=p.read_text(encoding='utf-8').replace('foodEconomyShare,.05','foodEconomyShare,.01').replace('foodPer1000*.05','foodPer1000*.01').replace('production.get(9)*.05','production.get(9)*.01');p.write_text(s,encoding='utf-8')
for p in (B/'app/dist').glob('*.js'):shutil.copy2(p,B.parent/'silvengard-atlas v2/dist'/p.name)
