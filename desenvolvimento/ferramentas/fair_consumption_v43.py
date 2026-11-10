from pathlib import Path
import shutil
B=Path(__file__).resolve().parents[2];p=B/'app/dist/economy-simulation.js';s=p.read_text(encoding='utf-8')
s=s.replace('function consumeLuxury(n,classId){','function consumeLuxury(n,classId,portion=1){')
s=s.replace("for(const r of report.classes.filter(r=>r.id===classId)){const basket", "for(const r of report.classes.filter(r=>r.id===classId)){const allocation=Math.min(Math.max(0,r.luxuryBudget-r.luxurySpent),r.luxuryBudget*portion);let passSpent=0;const basket")
s=s.replace('const budget=r.luxuryBudget*w/weight;', 'const budget=allocation*w/weight;')
s=s.replace('r.luxurySpent+=result.spent;r.goods[id]=', 'r.luxurySpent+=result.spent;passSpent+=result.spent;r.goods[id]=')
s=s.replace('const budget=Math.max(0,r.luxuryBudget-r.luxurySpent);','const budget=Math.max(0,allocation-passSpent);')
s=s.replace("for(const id of ['aristocratic','wealthy','comfortable','modest','peasant'])for(const n of foodOrder)consumeLuxury(n,id);", "for(const id of ['aristocratic','wealthy','comfortable','modest','peasant'])for(let pass=0;pass<16;pass++)for(const n of foodOrder)consumeLuxury(n,id,1/16);")
p.write_text(s,encoding='utf-8');shutil.copy2(p,B.parent/'silvengard-atlas v2/dist/economy-simulation.js')
p=B/'tools/audit_v43.mjs';s=p.read_text(encoding='utf-8').replace("const out={Elucitor:{beforeCapacity:","const elucitorConsumption=consumption.filter(r=>r).length;const out={Elucitor:{consumption:W.cities.filter(b=>b.state===13).reduce((n,b)=>n+(state.last.householdConsumption['city:'+b.i]?.luxurySpent||0),0),beforeCapacity:");p.write_text(s,encoding='utf-8')
