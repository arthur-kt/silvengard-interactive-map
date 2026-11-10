"""Project original map facts only where the current political owner matches."""
from pathlib import Path
import json,sys
import numpy as np
from scipy.spatial import cKDTree
base=Path(__file__).resolve().parents[2];sys.path.insert(0,str(base/'app'))
from source_profiles import load_sources
s=load_sources(base);w=json.loads((base/'app/dist/world.json').read_text(encoding='utf-8'))
original=[c for c in s['full']['pack']['cells'] if c['h']>=20]
tree=cKDTree([c['p'] for c in original]);distance,indices=tree.query([c['p'] for c in w['cells']])
culture=[];religion=[]
for c,d,i in zip(w['cells'],distance,indices):
 old=original[int(i)];valid=c['h']>=20 and old['state']==c['state'] and d<=40
 culture.append(old.get('culture',0) if valid else -1)
 religion.append(s['religionCells'][old['i']] if valid else -1)
out={'revision':w['revision'],'culture':culture,'religion':religion}
(base/'app/dist/theme-source.json').write_text(json.dumps(out,separators=(',',':')),encoding='utf-8')
print('Original map facts projected:',sum(c>=0 for c in culture),'land cells')
