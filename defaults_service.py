"""Local-only, validated default writes, with automatic backups and stale-tab checks."""
import datetime
import json
import os
from pathlib import Path
import shutil
import tempfile
import threading
from persistent_defaults import bake_editions

LOCK=threading.Lock()
def atomic_json(path,data):
    path=Path(path);fd,name=tempfile.mkstemp(prefix=path.name+'.',suffix='.tmp',dir=path.parent)
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as file:json.dump(data,file,ensure_ascii=False,separators=(',',':'));file.flush();os.fsync(file.fileno())
        os.replace(name,path)
    finally:
        if os.path.exists(name):os.remove(name)

def save_defaults(base,edition,expected_id):
    base=Path(base).resolve();world_path=base/'dist/world.json';manifest_path=base/'saved-author-defaults.json'
    with LOCK:
        world=json.loads(world_path.read_text(encoding='utf-8'));current=world.get('savedDefaults',{}).get('id','base-v23')
        if current!=expected_id:raise ValueError('O padrão nos arquivos mudou desde que esta aba foi aberta. Exporte sua edição e recarregue antes de salvar; isso não significa necessariamente que há outra sessão aberta.')
        result=bake_editions(world,[edition],base)
        manifest=json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {'format':'silvengard-saved-defaults-v1','revisions':[]}
        stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
        backup=base/'backups'/('defaults-'+stamp);backup.mkdir(parents=True)
        shutil.copy2(world_path,backup/'world.json')
        if manifest_path.exists():shutil.copy2(manifest_path,backup/'saved-author-defaults.json')
        atomic_json(backup/'edition.json',edition)
        manifest['revisions'].append({'id':result['savedDefaults']['id'],'savedAt':result['savedDefaults']['savedAt'],'edition':edition,'afterEconomicReview':world.get('economicReview',{}).get('version')})
        try:atomic_json(manifest_path,manifest);atomic_json(world_path,result)
        except Exception:
            shutil.copy2(backup/'world.json',world_path)
            if (backup/'saved-author-defaults.json').exists():shutil.copy2(backup/'saved-author-defaults.json',manifest_path)
            elif manifest_path.exists():manifest_path.unlink()
            raise
        return {'ok':True,'id':result['savedDefaults']['id'],'backup':str(backup.relative_to(base)),'cities':len(result['cities'])}
