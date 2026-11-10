"""Replay locally approved default revisions after the original author pipeline."""
import json
from pathlib import Path
import subprocess
import tempfile
import shutil

def find_node(base):
    """Prefer the atlas runtime; launching from Explorer must not require Codex's PATH."""
    base=Path(base).resolve()
    for candidate in [base/'runtime/node.exe',base.parent/'silvengard-atlas/runtime/node.exe']:
        if candidate.is_file():return str(candidate)
    available=shutil.which('node')
    if available:return available
    raise RuntimeError('O runtime de salvamento não foi encontrado. Restaure runtime/node.exe na pasta do Atlas e abra Abrir-Atlas.cmd novamente.')

def bake_editions(world, editions, base):
    base=Path(base).resolve();cache=base/'backups';cache.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='defaults-build-',dir=cache) as folder:
        directory=Path(folder).resolve();assert directory.is_relative_to(cache)
        source=directory/'input.json';target=directory/'world.json'
        source.write_text(json.dumps({'world':world,'editions':editions},ensure_ascii=False),encoding='utf-8')
        result=subprocess.run([find_node(base),str(base/'tools/bake-defaults.mjs'),str(source),str(target)],cwd=base,capture_output=True,text=True,encoding='utf-8',timeout=120)
        if result.returncode:raise ValueError(result.stderr[-1800:] or 'Não foi possível compilar os padrões.')
        return json.loads(target.read_text(encoding='utf-8'))

def apply_persistent_defaults(world,base):
    base=Path(base);path=base/'saved-author-defaults.json';checkpoint=base/'economic-review-defaults.json'
    data=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'revisions':[]}
    if not checkpoint.exists():return bake_editions(world,[r['edition'] for r in data['revisions']],base) if data['revisions'] else world
    config=json.loads(checkpoint.read_text(encoding='utf-8'));prior=set(config.get('priorRevisionIds',[]))
    before=[r['edition'] for r in data['revisions'] if r['id'] in prior]
    after=[r['edition'] for r in data['revisions'] if r['id'] not in prior]
    if before:world=bake_editions(world,before,base)
    for city in world['cities']:
        patch=config['demographics'].get(str(city['i']))
        if patch:city.update(patch)
    for key in ['economyEdits','economicReview','activeWars','localTradeAgreements','routes','networkDefaults','networkReview','savedDefaults','authorAtlasDefaults']:world[key]=config[key]
    return bake_editions(world,after,base) if after else world
