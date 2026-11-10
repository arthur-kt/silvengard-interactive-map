from pathlib import Path
import shutil
B=Path(__file__).resolve().parents[2];V=B.parent/'silvengard-atlas v2'
p=B/'app/dist/economy-simulation.js';s=p.read_text(encoding='utf-8')
start='(model.goods.get(j.good)?.laborHours?((model.goods.get(j.good).laborHours.skilled||0)*.25+(model.goods.get(j.good).laborHours.unskilled||0)*.025):model.price(j.good)*.15)'
s=s.replace(start,'((model.goods.get(j.good)?.labourHours||0)*.25+(model.goods.get(j.good)?.unskilledHours||0)*.025||model.price(j.good)*.15)')
p.write_text(s,encoding='utf-8')
# Only common application code is synchronized. Each atlas keeps its own world and economic inputs.
for p in (B/'app/dist').glob('*.js'):shutil.copy2(p,V/'app/dist'/p.name)
for name in ['index.html','history-archive.json']:shutil.copy2(B/'app/dist'/name,V/'app/dist'/name)
for name in ['history_archive.py','history_presentation.py','market_defaults.py']:shutil.copy2(B/name,V/name)
