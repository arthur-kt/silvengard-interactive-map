"""Validador offline do Atlas V21: stdlib, sem internet, sem necessidade de Three.js."""
from pathlib import Path
import json,struct,hashlib,sys
ROOT=Path(__file__).resolve().parents[2]
DIST=ROOT/'app'/'dist'
IDS={1:'Velaffeld',3:'Asgorath',7:'Elucitor',1240:'Castamor'}
errors=[]
def check(ok,message):
 print(('OK ' if ok else 'ERRO ')+message)
 if not ok:errors.append(message)
for name in ('urban-v21-core.js','urban-v21-fabric.js','city-glb-v21.js','urban-v21-forest.js','city-architecture-v21.js','town.js','street.js'):
 check((DIST/name).is_file(),f'Módulo {name}')
models=json.loads((DIST/'assets/optimized/vegetation/manifest-build.json').read_text())
for model in models:
 f=DIST/'assets/optimized/vegetation'/f"{model['id']}.glb"
 try:
  b=f.read_bytes();magic,version,length=struct.unpack_from('<III',b,0)
  hash_ok=hashlib.sha256(b).hexdigest()==model['sha256']
  valid=(magic==0x46546c67 and version==2 and length==len(b) and len(b)>100)
  check(hash_ok and valid,f"GLB {model['id']} ({len(b)} bytes, SHA-256)")
 except Exception as e:check(False,f"GLB {model['id']}: {e}")
for id,name in IDS.items():
 try:
  data=json.loads((DIST/'city-assets/v21'/f'{id}.json').read_text())
  check(data['cityId']==id and data['cityName']==name and data['loadWhen']=='enter-local-view' and not data['allowBackgroundPreload'] and not data['noPreview'] is False and len(data['vegetation'])>=3,f'Manifesto sob demanda {name} ({id})')
 except Exception as e:check(False,f'Manifesto {id}: {e}')
try:
 b=json.loads((DIST/'city-blueprints.json').read_text())['cities']
 check(all(str(k) in b and b[str(k)]['name']==v for k,v in IDS.items()),'IDs canônicos intactos')
except Exception as e:check(False,f'Blueprints: {e}')
print('\n'+('VALIDACAO CONCLUIDA' if not errors else f'{len(errors)} FALHAS'))
sys.exit(bool(errors))
