"""Read-only index of the author's Markdown archives. No changes to map defaults."""
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from history_presentation import add_presentation

CONFLICTS = 'dist/conflicts-source.json'

FILES = {
    'society': 'Silvengard_Culturas_Religioes_e_Instituicoes_Consolidadas.md',
    'places': 'Silvengard_Estados_Historias_Provincias_e_Cidades.md',
    'world': 'Silvengard_Historia_Geral_e_Cronologia_Consolidada.md',
}


def normalized(value):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', str(value)).encode('ascii', 'ignore').decode().lower())


def plain(value):
    return re.sub(r'[*`_]', '', value).strip()


LINEAGE_FENCE = re.compile(r'```linhagem[ \t]*\r?\n(.*?)```', re.S)
YEAR = re.compile(r'\d{1,4}')
PRESENT_YEAR = 1277


def parse_lineage(block):
    """Árvore genealógica em lista indentada, com campos separados por ``|``."""
    meta, roots, stack = {}, [], []
    for raw in block.splitlines():
        line = raw.rstrip()
        if not line.strip():
            continue
        if not line.startswith((' ', '-', '+', '#')) and ':' in line:
            label, value = line.split(':', 1)
            if label.strip() in ('casa', 'sede', 'tipo', 'nota'):
                meta[label.strip()] = value.strip()
                continue
        match = re.match(r'^(\s*)[-+]\s+(.*)$', line)
        if not match:
            continue
        indent = len(match.group(1).replace('\t', '  '))
        fields = [field.strip() for field in match.group(2).split('|')]
        spouse = next((field[4:].strip() for field in fields if field.startswith('par=')), '')
        node = dict(name=fields[0], role=fields[1] if len(fields) > 1 else '',
                    years=fields[2] if len(fields) > 2 else '', note=fields[3] if len(fields) > 3 else '',
                    spouse=spouse, children=[])
        while stack and stack[-1][0] >= indent:
            stack.pop()
        if stack:
            stack[-1][1]['children'].append(node)
        else:
            roots.append(node)
        stack.append((indent, node))
    return dict(house=meta.get('casa', ''), seat=meta.get('sede', ''), type=meta.get('tipo', ''),
                note=meta.get('nota', ''), roots=roots)


def parse_range(cell):
    text = plain(cell)
    ongoing = re.search(r'presente|atual|hoje|desde', text, re.I) is not None
    years = [int(value) for value in YEAR.findall(text)]
    if not years:
        return None
    start = years[0]
    end = PRESENT_YEAR if ongoing else (years[1] if len(years) > 1 else start)
    if end < start:
        start, end = end, start
    return dict(start=start, end=end, ongoing=ongoing, label=text)


def markdown_tables(markdown):
    lines = markdown.splitlines()
    index = 0
    while index < len(lines):
        line = lines[index].strip()
        if line.startswith('|') and index + 1 < len(lines) and re.match(r'^\|?[\s:|-]+\|', lines[index + 1].strip()):
            block = [line, lines[index + 1].strip()]
            index += 2
            while index < len(lines) and lines[index].strip().startswith('|'):
                block.append(lines[index].strip())
                index += 1
            yield block
        else:
            index += 1


def table_cells(line):
    return [cell.strip() for cell in line.strip().strip('|').split('|')]


def parse_successions(markdown):
    """Tabelas de reinado, governo ou ofício viram réguas de sucessão."""
    known = ('reinado', 'governo', 'periodo', 'período')
    results = []
    for table in markdown_tables(markdown):
        header = [plain(cell).lower() for cell in table_cells(table[0])]
        date_column = next((i for i, cell in enumerate(header) if any(word in cell for word in known)), None)
        if date_column is None or len(header) < 2:
            continue
        house_column = next((i for i, cell in enumerate(header) if cell.startswith('casa')), None)
        name_column = None
        for i, cell in enumerate(header):
            if i == date_column or i == house_column or cell in ('n.º', 'no', 'n'):
                continue
            if i == 0 and re.search(r'n[.º°]|número|numero', cell):
                continue
            name_column = i
            break
        if name_column is None:
            continue
        name_header = plain(table_cells(table[0])[name_column])
        house_match = re.search(r'Casa\s+([A-ZÀ-Ý][\wÀ-ÿ]+)', name_header)
        default_house = ('Casa ' + house_match.group(1)) if house_match else ('Pontificado' if 'Pontífice' in name_header else '')
        skip = {date_column, name_column, house_column}
        note_column = next((i for i, cell in enumerate(header)
                            if i not in skip and not re.search(r'n[.º°]|número|numero|^n$', cell, re.I)), None)
        entries = []
        for line in table[2:]:
            cells = table_cells(line)
            if len(cells) <= max(date_column, name_column):
                continue
            period = parse_range(cells[date_column])
            if not period:
                continue
            house = plain(cells[house_column]) if house_column is not None and house_column < len(cells) else ''
            entries.append(dict(name=plain(cells[name_column]), house=house or default_house,
                                note=plain(cells[note_column]) if note_column is not None and note_column < len(cells) else '', **period))
        if len(entries) >= 3:
            results.append(dict(title=name_header or 'Sucessão', house=default_house, entries=entries))
    results.sort(key=lambda item: len(item['entries']), reverse=True)
    return results


def attach_lineages(records, by_id):
    """Vincula árvores e réguas ao registro do Estado e cria um verbete por casa."""
    counter = 0
    for record in list(records):
        if record['kind'] != 'state':
            continue
        state_chapter = by_id[record['sections'][0]]
        stack = [state_chapter]
        seen = set()
        lineages, successions, text_parts = [], [], []
        while stack:
            section = stack.pop(0)
            if section['id'] in seen:
                continue
            seen.add(section['id'])
            text_parts.append(section['markdown'])
            for match in LINEAGE_FENCE.finditer(section['markdown']):
                data = parse_lineage(match.group(1))
                if not data['roots']:
                    continue
                counter += 1
                data.update(id=f'lineage:{record["stateId"]}:{counter}', stateId=record['stateId'], section=section['id'])
                section.setdefault('lineageIds', []).append(data['id'])
                lineages.append(data)
                item = dict(id=data['id'], kind='lineage', name=data['house'] or 'Linhagem', sections=[section['id']],
                            stateId=record['stateId'], lineage=data)
                records.append(item)
            stack.extend(by_id[child] for child in section['children'])
        for succession in parse_successions('\n'.join(text_parts)):
            succession['id'] = f'succession:{record["stateId"]}:{len(successions)}'
            successions.append(succession)
        if lineages:
            record['lineages'] = lineages
        if successions:
            record['successions'] = successions


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
    conflict_file = base / CONFLICTS
    conflicts = json.loads(conflict_file.read_text(encoding='utf-8')) if conflict_file.exists() else []
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

    # Conflitos e guerras: dados estruturados de campanha (efetivos e baixas estimados).
    def amount(value):
        match = re.search(r'(\d[\d.]*)', str(value))
        return int(match.group(1).replace('.', '')) if match else 0

    def br(number):
        return f'{number:,}'.replace(',', '.')

    for item in conflicts:
        sides = item.get('sides', [])
        strength = sum(amount(side.get('strength')) for side in sides)
        casualties = sum(amount(side.get('casualties')) for side in sides)
        item['totalStrength'] = ('~' if any('~' in str(side.get('strength', '')) for side in sides) else '') + br(strength)
        item['totalCasualties'] = ('~' if any('~' in str(side.get('casualties', '')) for side in sides) else '') + br(casualties)
        record('conflict:' + item['id'], 'conflict', item['name'], [], conflict=item)

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
    # Ordens e ofícios acrescentados ao Estado em 1277 AQD.
    for (document, sid), chapter in state_chapters.items():
        if document != 'places':
            continue
        for child in chapter['children']:
            section = by_id[child]
            if not section['title'].startswith('Instituições, tradições'):
                continue
            for sub in section['children']:
                item = by_id[sub]
                record(f'institution:place:{sub}', 'institution', item['title'], [sub], stateId=sid)

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
    attach_lineages(records, by_id)
    digest = hashlib.sha256((''.join(texts.values()) + json.dumps(conflicts, ensure_ascii=False)).encode()).hexdigest()
    return add_presentation(dict(version=1, revision=digest, present='1277 AQD', sections=sections, records=records, events=events, warnings=warnings,
                documents=[dict(key=key, file=name, characters=len(texts[key])) for key, name in FILES.items()]))


if __name__ == '__main__':
    base = Path(__file__).resolve().parent
    result = build_archive(base)
    (base / 'dist/history-archive.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'records': len(result['records']), 'sections': len(result['sections']), 'events': len(result['events']), 'warnings': result['warnings']}, ensure_ascii=False))
