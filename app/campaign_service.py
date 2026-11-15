"""Persistent, local-only campaign journal API for the Silvengard Atlas.

Each campaign is a human-editable UTF-8 JSON document in app/campaigns/.
The service reads files on every request so editing externally is supported.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import threading
from uuid import uuid4

CAMPAIGN_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,79}$")
MAX_CAMPAIGNS = 100
MAX_FILE_BYTES = 2_000_000
MUTEX = threading.RLock()


class CampaignInputError(ValueError):
    pass


class CampaignConflict(Exception):
    pass


def folder(app_root: Path) -> Path:
    result = Path(app_root) / 'campaigns'
    result.mkdir(parents=True, exist_ok=True)
    return result


def valid_id(campaign_id: str) -> str:
    if not isinstance(campaign_id, str) or not CAMPAIGN_ID.fullmatch(campaign_id):
        raise CampaignInputError('Identificador de campanha inválido.')
    return campaign_id


def string(value, field, limit=1000):
    if not isinstance(value, str) or len(value) > limit:
        raise CampaignInputError(f'Campo {field} precisa ser texto de até {limit} caracteres.')
    return value


def items(value, field, max_count):
    if not isinstance(value, list) or len(value) > max_count:
        raise CampaignInputError(f'Campo {field} precisa ser uma lista com até {max_count} itens.')
    if not all(isinstance(item, dict) for item in value):
        raise CampaignInputError(f'Itens inválidos em {field}.')
    return value


def clean(raw, campaign_id=None):
    """Validate and retain known keys only, with stable character and event IDs."""
    if not isinstance(raw, dict):
        raise CampaignInputError('O conteúdo da campanha deve ser um objeto JSON.')
    cid = valid_id(campaign_id or raw.get('id', ''))
    if 'id' in raw and raw['id'] != cid:
        raise CampaignInputError('O id interno precisa corresponder ao nome do arquivo.')
    title = string(raw.get('title', ''), 'title', 140).strip()
    if not title:
        raise CampaignInputError('A campanha precisa ter um título.')
    party = raw.get('party') or {}
    if not isinstance(party, dict):
        raise CampaignInputError('party deve ser um objeto.')
    members = []
    for idx, member in enumerate(items(party.get('members', []), 'party.members', 40)):
        mid = string(member.get('id', ''), 'party.members.id', 90).strip() or str(uuid4())
        if any(m['id'] == mid for m in members):
            raise CampaignInputError('Existem integrantes com identificadores repetidos.')
        members.append({
            'id': mid,
            'sheetId': string(member.get('sheetId', ''), 'sheetId', 180),
            'name': string(member.get('name', ''), 'name', 140),
            'role': string(member.get('role', ''), 'role', 140),
            'notes': string(member.get('notes', ''), 'notes', 4000),
        })
    npcs = []
    for item in items(raw.get('npcs', []), 'npcs', 200):
        npc_id = string(item.get('id', ''), 'npcs.id', 90).strip() or str(uuid4())
        if any(p['id'] == npc_id for p in npcs):
            raise CampaignInputError('Existem NPCs com identificadores repetidos.')
        npcs.append({
            'id': npc_id,
            'name': string(item.get('name', ''), 'npcs.name', 140),
            'role': string(item.get('role', ''), 'npcs.role', 160),
            'affiliation': string(item.get('affiliation', ''), 'npcs.affiliation', 160),
            'location': string(item.get('location', ''), 'npcs.location', 160),
            'description': string(item.get('description', ''), 'npcs.description', 6000),
        })
    events = []
    for event in items(raw.get('events', []), 'events', 2000):
        eid = string(event.get('id', ''), 'events.id', 90).strip() or str(uuid4())
        if any(e['id'] == eid for e in events):
            raise CampaignInputError('Existem acontecimentos com identificadores repetidos.')
        events.append({
            'id': eid,
            'title': string(event.get('title', ''), 'events.title', 180),
            'when': string(event.get('when', ''), 'events.when', 100),
            'session': string(event.get('session', ''), 'events.session', 100),
            'place': string(event.get('place', ''), 'events.place', 180),
            'chapter': string(event.get('chapter', ''), 'events.chapter', 140),
            'type': string(event.get('type', 'event'), 'events.type', 60),
            'body': string(event.get('body', ''), 'events.body', 15000),
        })
    return {
        'version': 1,
        'id': cid,
        'title': title,
        'subtitle': string(raw.get('subtitle', ''), 'subtitle', 240),
        'status': string(raw.get('status', 'Em andamento'), 'status', 70),
        'year': string(raw.get('year', '1277 AQD'), 'year', 80),
        'region': string(raw.get('region', ''), 'region', 180),
        'premise': string(raw.get('premise', ''), 'premise', 16000),
        'summary': string(raw.get('summary', ''), 'summary', 16000),
        'party': {
            'name': string(party.get('name', ''), 'party.name', 140),
            'journeyPartyId': string(party.get('journeyPartyId', ''), 'journeyPartyId', 180),
            'members': members,
        },
        'npcs': npcs,
        'events': events,
        'createdAt': string(raw.get('createdAt', ''), 'createdAt', 60),
        'updatedAt': string(raw.get('updatedAt', ''), 'updatedAt', 60),
    }


def path_for(app_root: Path, campaign_id: str) -> Path:
    return folder(app_root) / f'{valid_id(campaign_id)}.json'


def _read(path: Path):
    if not path.is_file() or path.is_symlink():
        raise FileNotFoundError('Campanha não encontrada.')
    raw = path.read_bytes()
    if len(raw) > MAX_FILE_BYTES:
        raise CampaignInputError('Arquivo de campanha excede 2 MB.')
    try:
        parsed = json.loads(raw.decode('utf-8-sig'))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise CampaignInputError(f'JSON inválido em {path.name}: {exc}') from exc
    result = clean(parsed, path.stem)
    result['_revision'] = hashlib.sha256(raw).hexdigest()
    return result


def read_campaign(app_root: Path, campaign_id: str):
    with MUTEX:
        return _read(path_for(app_root, campaign_id))


def list_campaigns(app_root: Path):
    with MUTEX:
        campaigns = []
        errors = []
        for p in sorted(folder(app_root).glob('*.json')):
            if p.is_symlink() or not CAMPAIGN_ID.fullmatch(p.stem):
                continue
            try:
                c = _read(p)
                campaigns.append({k: c[k] for k in ('id', 'title', 'subtitle', 'status', 'year', 'region', 'createdAt', 'updatedAt', '_revision')})
            except (CampaignInputError, OSError) as exc:
                errors.append({'file': p.name, 'error': str(exc)})
        campaigns.sort(key=lambda c: c['updatedAt'], reverse=True)
        return {'campaigns': campaigns, 'errors': errors}


def _write(path: Path, item: dict):
    raw = (json.dumps(item, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    if len(raw) > MAX_FILE_BYTES:
        raise CampaignInputError('Campanha excede o limite de 2 MB.')
    fd, temp = tempfile.mkstemp(prefix='.campaign-', suffix='.tmp', dir=str(path.parent))
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(raw)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)
    item['_revision'] = hashlib.sha256(raw).hexdigest()
    return item


def create_campaign(app_root: Path, raw):
    with MUTEX:
        if len(list_campaigns(app_root)['campaigns']) >= MAX_CAMPAIGNS:
            raise CampaignInputError('Limite de 100 campanhas atingido.')
        cid = 'campanha-' + uuid4().hex[:12]
        now = datetime.now(timezone.utc).isoformat(timespec='seconds')
        item = clean({**raw, 'id': cid, 'createdAt': now, 'updatedAt': now}, cid)
        return _write(path_for(app_root, cid), item)


def update_campaign(app_root: Path, campaign_id: str, raw, revision):
    with MUTEX:
        path = path_for(app_root, campaign_id)
        existing = _read(path)
        if not isinstance(revision, str) or revision != existing['_revision']:
            raise CampaignConflict('Arquivo alterado fora do Atlas ou em outra janela. Recarregue a campanha antes de salvar.')
        item = clean({**raw, 'id': campaign_id, 'createdAt': existing['createdAt'],
                      'updatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds')}, campaign_id)
        if item == {k: v for k, v in existing.items() if k != '_revision'}:
            return existing
        backups = folder(app_root) / '.backups' / campaign_id
        backups.mkdir(parents=True, exist_ok=True)
        suffix = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f')
        (backups / f'{suffix}.json').write_bytes(path.read_bytes())
        return _write(path, item)


def delete_campaign(app_root: Path, campaign_id: str, revision):
    with MUTEX:
        path = path_for(app_root, campaign_id)
        existing = _read(path)
        if revision != existing['_revision']:
            raise CampaignConflict('Campanha alterada desde a última leitura. Recarregue antes de excluir.')
        backups = folder(app_root) / '.backups' / campaign_id
        backups.mkdir(parents=True, exist_ok=True)
        dest = backups / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f') + '-excluida.json')
        os.replace(path, dest)
        return {'deleted': campaign_id, 'backup': str(dest.relative_to(folder(app_root)))}
