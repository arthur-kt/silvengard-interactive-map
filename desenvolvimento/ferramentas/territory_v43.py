from pathlib import Path
import json,shutil
B=Path(__file__).resolve().parents[2]
for root in [B,B.parent/'silvengard-atlas v2']:
 p=root/'market-territories.json';d=json.loads(p.read_text(encoding='utf-8'));d['stateMarkets']={'28':11};p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(B/'app/dist/market-territories.js',B.parent/'silvengard-atlas v2/dist/market-territories.js')
shutil.copy2(B/'app/dist/economy-consumption.js',B.parent/'silvengard-atlas v2/dist/economy-consumption.js')
shutil.copy2(B/'market_defaults.py',B.parent/'silvengard-atlas v2/market_defaults.py')
