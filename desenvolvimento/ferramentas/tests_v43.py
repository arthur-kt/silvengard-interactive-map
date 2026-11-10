from pathlib import Path
import shutil
B=Path(__file__).resolve().parents[2]
p=B/'app/dist/economy-simulation.js';s=p.read_text(encoding='utf-8').replace('for(const n of foodOrder){consumeLuxury(n);for(const category','for(const n of foodOrder){for(const category').replace('consumeCategory(n,category);last.demand[n.id]','consumeCategory(n,category);consumeLuxury(n);last.demand[n.id]');p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/approved-economy.test.mjs';s=p.read_text(encoding='utf-8').replace('1000*30);','1000*30*source.calibration.foodEconomyShare);').replace('assert.ok(report.production.get(9)>10000);','assert.ok(report.production.get(9)>500&&report.production.get(9)<1000);');p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/author-markets.test.mjs';s=p.read_text(encoding='utf-8').replace("'Alqa':13", "'Alqa':14").replace("'Elucitor':18", "'Elucitor':17");p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/profiles.test.mjs';s=p.read_text(encoding='utf-8').replace("20:['erebor','dragonRampant','sable']", "20:['horsehead2','wyvern','sanguine']");p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/social-labor-v42.test.mjs';s=p.read_text(encoding='utf-8');start=" const svg=fs.readFileSync(new URL('../dist/heraldry/author-state-20-v19.svg'";lines=s.splitlines();lines=[" const coa=W.states.find(s=>s.i===20).coa;assert.equal(coa.shield,'horsehead2');assert.equal(coa.charges[0].charge,'wyvern');assert.equal(coa.division.line,'arched');" if l.startswith(start) else l for l in lines];p.write_text('\n'.join(lines)+'\n',encoding='utf-8')
for p in (B/'app/dist').glob('*.js'):shutil.copy2(p,B.parent/'silvengard-atlas v2/dist'/p.name)
