from pathlib import Path
import shutil
B=Path(__file__).resolve().parents[2]
p=B/'app/dist/economy-simulation.js';s=p.read_text(encoding='utf-8').replace("const accountId=id=>", "const accountId=id=>")
s=s.replace('state|carrier|service)', 'state|carrier|service|captivity)').replace("account('captivity:piracy')", "account('captivity:0')")
s=s.replace('for(const seller of nodes.values()){if(g===31&&!slaveTradeAllowed(seller.city))continue;const path=pathFor(j.node,seller,r.good);', 'for(const seller of nodes.values()){const path=pathFor(j.node,seller,r.good);')
s=s.replace('amount*((model.goods.get(j.good)?.labourHours||0)*.25+(model.goods.get(j.good)?.unskilledHours||0)*.025||model.price(j.good)*.15)', 'amount*(((model.goods.get(j.good)?.labourHours||0)*.25+(model.goods.get(j.good)?.unskilledHours||0)*.025)*laborCostFactor(j.node.city,j.node.account)||model.price(j.good)*.15)')
p.write_text(s,encoding='utf-8')
p=B/'app/dist/economy-policy.js';s=p.read_text(encoding='utf-8');s="import {laborCostFactor} from './economy-labor.js?v=42';\n"+s;s=s.replace('labour=(good?.labourHours||0)*.25+(good?.unskilledHours||0)*.025','labour=((good?.labourHours||0)*.25+(good?.unskilledHours||0)*.025)*laborCostFactor(city)');p.write_text(s,encoding='utf-8')
# Retain the total-output regression separately from the new commercial-surplus view.
p=B/'desenvolvimento/testes/economy-map.test.mjs';s=p.read_text(encoding='utf-8').replace('map=buildEconomicMap(D,snapshot,provinces,pm.provinceAt);',"map=buildEconomicMap(D,snapshot,provinces,pm.provinceAt,{goodsBasis:'total'});");p.write_text(s,encoding='utf-8')
# New estimated strata change family counts: compare against population/householdSize, not old rounding.
p=B/'desenvolvimento/testes/recalibration-v41.test.mjs';s=p.read_text(encoding='utf-8').replace("assert.equal(before.rows.reduce((n,r)=>n+r.units,0),350000);", "assert.ok(Math.abs(before.rows.reduce((n,r)=>n+r.units,0)-350000)<1e-6);");p.write_text(s,encoding='utf-8')
for p in (B/'app/dist').glob('*.js'):shutil.copy2(p,B.parent/'silvengard-atlas v2/dist'/p.name)
shutil.copy2(B/'app/dist/index.html',B.parent/'silvengard-atlas v2/dist/index.html')
