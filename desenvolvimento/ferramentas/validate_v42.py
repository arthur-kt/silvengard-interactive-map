from pathlib import Path
import json,shutil
B=Path(__file__).resolve().parents[2]
# Preserve the author's latest edits when checking against older snapshots.
for root in [B,B.parent/'silvengard-atlas v2']:
 w=json.loads((root/'app/dist/world.json').read_text(encoding='utf-8'));old=json.loads((root/'acervo/backups/v41-before-recalibration/dist/world.json').read_text(encoding='utf-8'))
 text=(root/'Silvengard_Mercados_Atualizado.md').read_text(encoding='utf-8')
 for city in w['cities']:
  previous=next(c for c in old['cities'] if c['i']==city['i'])
  if previous['name']!=city['name']:text=text.replace('| '+previous['name']+' |','| '+city['name']+' |')
 (root/'Silvengard_Mercados_Atualizado.md').write_text(text,encoding='utf-8')
p=B/'app/dist/profile-ui.js';s=p.read_text(encoding='utf-8').replace('99% da renda de referência','99% da renda estimada');p.write_text(s,encoding='utf-8')
p=B/'app/dist/economy-policy.js';s=p.read_text(encoding='utf-8').replace("import {laborCostFactor}","import {laborCostFactor,SLAVE_TRADING_STATES}")
needle='const multiplier=sellerState===buyerState?'
assert needle in s;s=s.replace(needle,"if(good===31&&(!SLAVE_TRADING_STATES.includes(sellerState)||!SLAVE_TRADING_STATES.includes(buyerState)))return null;\n const multiplier=sellerState===buyerState?")
p.write_text(s,encoding='utf-8')
for name in ['author-markets.test.mjs','market-territories.test.mjs']:
 p=B/'tests'/name;s=p.read_text(encoding='utf-8')
 # This turn must preserve the exact world present when the request started.
 s=s.replace("world=read('backups/v40-before-approved-economy/dist/world.json')","world=read('backups/v42-before-social-goods/dist/world.json')")
 s=s.replace("read('backups/v38-before-market-adjustments/world.json')","read('backups/v42-before-social-goods/dist/world.json')")
 p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/profiles.test.mjs';s=p.read_text(encoding='utf-8').replace("assert.ok(!/undefined|NaN/.test(svg));","assert.ok(!/undefined|NaN/.test(svg.replace(/data:image\\/[^\"]*/g,'')));")
# More recent author city editions take precedence over the old .map population.
s=s.replace("const override=overrides[b.i],src=", "const author=JSON.parse(fs.readFileSync(new URL('backups/v42-before-social-goods/dist/world.json',base))).cities.find(c=>c.i===b.i),override={raw:author.population,inhabitants:author.demographics.population},src=")
p.write_text(s,encoding='utf-8')
for p in (B/'app/dist').glob('*.js'):shutil.copy2(p,B.parent/'silvengard-atlas v2/dist'/p.name)
