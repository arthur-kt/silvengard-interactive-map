"""Read-only index of the author's Markdown archives. No changes to map defaults."""
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from history_presentation import add_presentation

FILES = {
    'society': 'Silvengard_Culturas_Religioes_e_Instituicoes_Consolidadas.md',
    'places': 'Silvengard_Estados_Historias_Provincias_e_Cidades.md',
    'world': 'Silvengard_Historia_Geral_e_Cronologia_Consolidada.md',
}


def normalized(value):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', str(value)).encode('ascii', 'ignore').decode().lower())


def plain(value):
    return re.sub(r'[*`_]', '', value).strip()


def parse_document(key, text):
    """A heading owns its paragraphs; descendants retain their own identities."""
    sections, stack = [], []
    for line_number, line in enumerate(text.splitlines(), 1):
        heading = re.match(r'^(#{1,6})\s+(.+?)\s*#*$', line)
        if heading:
            level, title = len(heading[1]), heading[2]
            while stack and stack[-1]['level'] >= level:
                stack.pop()
            section = dict(id=f'{key}-{line_number}', title=title, level=level,
                           parent=stack[-1]['id'] if stack else None, children=[],
                           markdown='', document=key, line=line_number)
            if stack:
                stack[-1]['children'].append(section['id'])
            sections.append(section)
            stack.append(section)
        elif stack:
            stack[-1]['markdown'] += line + '\n'
    return sections


def build_archive(base):
    base = Path(base)
    folder = base / 'historic_archives'
    if not folder.is_dir():
        folder = base.parent / 'silvengard-atlas' / 'historic_archives'
    texts = {key: (folder / name).read_text(encoding='utf-8-sig') for key, name in FILES.items()}
    world = json.loads((base / 'dist/world.json').read_text(encoding='utf-8'))
    proposal = json.loads((base / 'dist/province-proposal.json').read_text(encoding='utf-8'))
    edits = world.get('defaultProvinceEdits', {})
    provinces = [{**p, 'name': edits.get('names', {}).get(str(p['i']), p['name'])}
                 for p in proposal['provinces'] if p['i'] not in edits.get('deleted', [])]
    sections = [s for key, text in texts.items() for s in parse_document(key, text)]
    by_id = {s['id']: s for s in sections}
    records, warnings = [], []

    def record(key, kind, name, roots, **extra):
        item = dict(id=key, kind=kind, name=name, sections=roots, **extra)
        records.append(item)
        return item

    def descendants(s):
        return [s] + [child for key in s['children'] for child in descendants(by_id[key])]

    def body(s):
        return '\n'.join(t['title'] + '\n' + t['markdown'] for t in descendants(s))

    # Explicit state IDs in the supplied archive are preferable to fuzzy names.
    state_chapters = {}
    for s in sections:
        if s['level'] == 2 and s['title'].startswith('Estado:'):
            match = re.search(r'atlas_id=(\d+)', s['markdown'])
            if not match:
                warnings.append('Estado sem identificador: ' + s['title'])
                continue
            sid = int(match[1])
            s['stateId'] = sid
            state_chapters[s['document'], sid] = s
            if s['document'] == 'places':
                record(f'state:{sid}', 'state', s['title'].split(':', 1)[1].strip(), [s['id']], stateId=sid, target={'kind': 'state', 'id': sid})

    current_state, current_province = None, None
    used_provinces = set()
    for s in [s for s in sections if s['document'] == 'places']:
        if s.get('stateId') is not None:
            current_state = s['stateId']
        if s['title'].startswith('Província:'):
            name = s['title'].split(':', 1)[1].strip()
            clean_name = re.sub(r'\s*\[registro.*', '', name)
            matches = [p for p in provinces if p['state'] == current_state and normalized(p['name']) == normalized(clean_name) and p['i'] not in used_provinces]
            if matches:
                p = matches[0]
                used_provinces.add(p['i'])
                current_province = p['i']
                record(f'province:{p["i"]}', 'province', name, [s['id']], stateId=current_state, target={'kind': 'province', 'id': p['i']})
            else:
                current_province = None
                warnings.append('Província sem vínculo: ' + name)
                record('unmatched:' + s['id'], 'province', name, [s['id']], stateId=current_state)
        if s['title'].startswith('Cidade:'):
            name = s['title'].split(':', 1)[1].strip()
            matches = [b for b in world['cities'] if b['state'] == current_state and normalized(b['name']) == normalized(name) and not b.get('excluded')]
            if not matches:
                matches = [b for b in world['cities'] if b['state'] == current_state and normalized(name) in [normalized(a) for a in b.get('aliases', [])] and not b.get('excluded')]
            if len(matches) == 1:
                b = matches[0]
                record(f'city:{b["i"]}', 'city', b['name'], [s['id']], stateId=current_state, provinceId=current_province, target={'kind': 'city', 'id': b['i']})
            else:
                warnings.append('Cidade sem vínculo único: ' + name)
                record('unmatched:' + s['id'], 'city', name, [s['id']], stateId=current_state)

    # Technical preservation appendices remain available, separate from narrative.
    world_sections = [s for s in sections if s['document'] == 'world']
    appendix = next((s for s in world_sections if s['title'].startswith('Apêndices de preservação')), None)
    cutoff = appendix['line'] if appendix else 10**9
    narrative = [s for s in world_sections if s['line'] < cutoff]
    roots = [s['id'] for s in narrative if s['level'] == 2]
    roots.sort(key=lambda key: 0 if by_id[key]['title'].startswith('História geral') else 1)
    record('world', 'world', 'História de Silvengard', roots)
    record('appendices', 'appendix', 'Apêndices cartográficos', [s['id'] for s in world_sections if s['line'] >= cutoff and s['level'] <= 2])
    institutions = next((s for s in narrative if s['title'].startswith('Instituições e vida cotidiana')), None)
    if institutions:
        for s in descendants(institutions):
            if s['level'] == 5:
                record('institution:' + s['id'], 'institution', s['title'], [s['id']])
    # State-specific institutional lists are also indexed, without inventing entries.
    for (document, sid), chapter in state_chapters.items():
        if document != 'society':
            continue
        for child in descendants(chapter):
            if child['title'].startswith('Instituições, práticas'):
                record(f'institution:state:{sid}', 'institution', 'Instituições de ' + chapter['title'].split(':', 1)[1].strip(), [child['id']], stateId=sid)

    # Regional dossiers are context, not claims that every paragraph applies to a group.
    for kind, field, marker in [('culture', 'cultures', 'Culturas presentes'), ('religion', 'religions', 'Religiões presentes')]:
        for entity in world.get(field, []):
            if not entity['i'] and kind != 'religion':
                continue
            related = []
            for (document, sid), chapter in state_chapters.items():
                if document != 'society':
                    continue
                summary = next((s for s in descendants(chapter) if s['title'].startswith('Identidade cultural')), None)
                if not summary:
                    continue
                text = summary['markdown']
                start = text.find('**' + marker)
                portion = text[start:] if start >= 0 else ''
                if kind == 'culture':
                    portion = portion.split('**Religiões presentes')[0]
                names = re.findall(r'^- \*\*(.+?)\*\*', portion, re.M)
                if normalized(entity['name']) in [normalized(name) for name in names]:
                    related.append(dict(stateId=sid, section=chapter['id'], name=chapter['title'].split(':', 1)[1].strip()))
            specific = []
            culture_titles = {
                9: ['II. HUMANOS DE DRAGONFALL'], 11: ['Altos elfos'], 12: ['Elfos da floresta'],
                13: ['I. DRACONATOS'], 14: ['Povo husajita'],
                15: ['III. ANÕES DE DRAGONFALL', 'Anões de Grenolk', 'Mauron e tradição anã'],
                16: ['Os khajitt'], 17: ['III. A CULTURA DO SUL LITORÂNEO'],
                19: ['V. ORCS E OUTROS POVOS'], 22: ['Assentamentos, assembleias e guerra — cânone'],
            }
            titles = culture_titles.get(entity['i'], []) + [entity['name']] if kind == 'culture' else [entity['name']]
            for s in sections:
                if s['document'] != 'society' or s['level'] < 5:
                    continue
                heading = normalized(s['title'].removeprefix('Religião: ').removeprefix('Cultura: '))
                if any(normalized(t) == heading for t in titles):
                    specific.append(s['id'])
                elif kind == 'religion' and entity['i'] == 30 and s['title'].startswith('O Grande Norte:'):
                    specific.append(s['id'])
                elif kind == 'religion' and entity['i'] == 39 and s['title'] in ['Fé no Grande Espírito', 'O Grande Espírito — religião dos elfos da floresta']:
                    specific.append(s['id'])
                elif kind == 'religion' and entity['i'] == 40 and s['title'].startswith('Al’Ashabab e Ashabab'):
                    specific.append(s['id'])
                elif kind == 'religion' and entity['i'] == 37 and s['title'].startswith('Valores de Remus'):
                    specific.append(s['id'])
            # Do not promote dormant generator cultures to authored continental lore.
            if kind == 'culture' and not related and not specific and not any(b.get('culture') == entity['i'] for b in world['cities']):
                continue
            specific.sort(key=lambda i: not next(s for s in sections if s['id'] == i)['title'].startswith(('Cultura: ', 'Religião: ')))
            record(f'{kind}:{entity["i"]}', kind, entity['name'], specific, contexts=related, deity=entity.get('deity'))

    events = []
    chronology = next(s for s in narrative if s['title'].startswith('Cronologia das Quatro Eras'))
    for s in descendants(chronology):
        era_match = re.match(r'(Primeira|Segunda|Terceira|Quarta) Era', s['title'])
        if not era_match:
            continue
        era = {'Primeira': 1, 'Segunda': 2, 'Terceira': 3, 'Quarta': 4}[era_match[1]]
        for line in s['markdown'].splitlines():
            cells = [cell.strip() for cell in line.strip().strip('|').split('|')]
            if line.startswith('|') and len(cells) == 3 and not re.match(r'^[- :]+$', cells[0]) and not plain(cells[0]).startswith('Data'):
                date, title, detail = cells
                events.append(dict(id=f'event-{len(events)}', era=era, date=plain(date), title=plain(title), markdown=detail, chapter=s['id']))
            elif era == 1:
                match = re.match(r'^\d+\. (.+)', line)
                if match:
                    events.append(dict(id=f'event-{len(events)}', era=era, date='Tempo mítico', title=plain(match[1]), markdown=match[1], chapter=s['id']))
    # Only explicit, unambiguous textual mentions get map links. Duplicate Gugacon
    # is disambiguated by explicit state context; no guesses from vague names.
    targets = [r for r in records if r.get('target')]
    for event in events:
        text = unicodedata.normalize('NFKD', plain(event['title'] + ' ' + event['markdown'])).encode('ascii', 'ignore').decode().lower()
        def mentioned(name):
            name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower().strip()
            return bool(re.search(r'(?<![a-z])' + re.escape(name) + r'(?![a-z])', text))
        linked_states = [r for r in targets if r['kind'] == 'state' and mentioned(r['name'])]
        links = list(linked_states)
        for r in targets:
            if r['kind'] not in ('city', 'province') or len(normalized(r['name'])) < 5 or not mentioned(r['name']):
                continue
            same = [x for x in targets if x['kind'] == r['kind'] and normalized(x['name']) == normalized(r['name'])]
            if len(same) == 1 or (len(linked_states) == 1 and r.get('stateId') == linked_states[0]['stateId']):
                links.append(r)
        event['links'] = [r['id'] for r in links]
    digest = hashlib.sha256(''.join(texts.values()).encode()).hexdigest()
    return add_presentation(dict(version=1, revision=digest, present='1277 AQD', sections=sections, records=records, events=events, warnings=warnings,
                documents=[dict(key=key, file=name, characters=len(texts[key])) for key, name in FILES.items()]))


if __name__ == '__main__':
    base = Path(__file__).resolve().parent
    result = build_archive(base)
    (base / 'dist/history-archive.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'records': len(result['records']), 'sections': len(result['sections']), 'events': len(result['events']), 'warnings': result['warnings']}, ensure_ascii=False))
