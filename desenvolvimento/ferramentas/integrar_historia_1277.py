"""Integra o Guia de Integração (1277 AQD) aos três arquivos de história do Atlas.

O script é idempotente: cada inserção leva um comentário marcador e é ignorada
se já existir. Ele não toca em world.json, mercados, populações ou geografia.

Uso:
    python desenvolvimento/ferramentas/integrar_historia_1277.py
"""
from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
GUIDE = BASE / 'documentos' / 'Silvengard_Guia_Integracao_Atlas_Linhagens_Guerras_Sucessoes_1277_AQD.md'
PLACES = BASE / 'app' / 'historic_archives' / 'Silvengard_Estados_Historias_Provincias_e_Cidades.md'
WORLD = BASE / 'app' / 'historic_archives' / 'Silvengard_Historia_Geral_e_Cronologia_Consolidada.md'
SOCIETY = BASE / 'app' / 'historic_archives' / 'Silvengard_Culturas_Religioes_e_Instituicoes_Consolidadas.md'

sys.path.insert(0, str(Path(__file__).resolve().parent))
from linhagens_1277 import DYNASTY_NOTES, LINEAGES  # noqa: E402


def key(value: str) -> str:
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', str(value)).encode('ascii', 'ignore').decode().lower())


def slug(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', str(value)).encode('ascii', 'ignore').decode().lower()).strip('-')


# ---------------------------------------------------------------- guia ----
def split_parts(text: str) -> dict[str, list[str]]:
    parts: dict[str, list[str]] = {}
    current = None
    for line in text.splitlines():
        if line.startswith('# '):
            current = line[2:].strip()
            parts[current] = []
        elif current is not None:
            parts[current].append(line)
    return parts


def part(parts, prefix):
    for title, lines in parts.items():
        if title.startswith(prefix):
            return title, lines
    raise KeyError(prefix)


def chapters(lines: list[str]) -> list[tuple[str, list[str]]]:
    result, current = [], None
    for line in lines:
        match = re.match(r'^## (.+)', line)
        if match:
            current = [match.group(1).strip(), []]
            result.append(current)
        elif current is not None:
            current[1].append(line)
    return [(title, body) for title, body in result]


def subchapters(lines: list[str], level: int = 3) -> list[tuple[str, list[str]]]:
    marker = '#' * level + ' '
    result, current = [], None
    for line in lines:
        if line.startswith(marker) and not line.startswith('#' * (level + 1)):
            current = [line[len(marker):].strip(), []]
            result.append(current)
        elif current is not None:
            current[1].append(line)
    return [(title, body) for title, body in result]


def strip_chapter(body: list[str]) -> list[str]:
    cleaned = []
    for line in body:
        if line.startswith('**Destino principal:**') or line.startswith('**Verbetes relacionados:**'):
            continue
        cleaned.append(line)
    while cleaned and not cleaned[0].strip():
        cleaned.pop(0)
    while cleaned and (not cleaned[-1].strip() or cleaned[-1].strip() == '---'):
        cleaned.pop()
    return cleaned


def forma_by_state(parts) -> dict[str, str]:
    _, lines = part(parts, 'III — CASAS')
    result = {}
    for title, body in chapters(lines):
        state = title.split('—')[0].strip()
        for line in body:
            if line.startswith('**Forma de sucessão:**'):
                result[state] = line.strip()
                break
    return result


# ------------------------------------------------------------- arquivos ----
def state_ranges(lines):
    starts = [i for i, line in enumerate(lines) if line.startswith('## Estado: ')]
    result = []
    for index, start in enumerate(starts):
        end = len(lines)
        for nxt in range(start + 1, len(lines)):
            if lines[nxt].startswith('## '):
                end = nxt
                break
        result.append((lines[start][len('## Estado: '):].strip(), start, end))
    return result


def section_end(lines, start, end, level):
    """Fim de uma seção de nível `level`: o próximo título de nível igual ou superior."""
    for i in range(start + 1, end):
        match = re.match(r'^(#{1,6}) ', lines[i])
        if match and len(match.group(1)) <= level:
            return i
    return end


def heading_index(lines, start, end, text):
    for i in range(start, end):
        if lines[i].startswith(text):
            return i
    return None


def find_state(lines, name):
    for state, start, end in state_ranges(lines):
        if state == name:
            return start, end
    raise KeyError('Estado não encontrado: ' + name)


# --------------------------------------------------------------- blocos ----
def lineage_block(entry: dict) -> list[str]:
    lines = ['```linhagem']
    lines.append('casa: ' + entry['house'])
    if entry.get('seat'):
        lines.append('sede: ' + entry['seat'])
    if entry.get('type'):
        lines.append('tipo: ' + entry['type'])
    if entry.get('note'):
        lines.append('nota: ' + entry['note'])
    for raw in entry['nodes'].strip('\n').splitlines():
        lines.append(raw.rstrip())
    lines.append('```')
    return lines


def dynasty_section(state: str, forma: str) -> list[str]:
    out = ['### Casas, sucessões e linhagens', '<!-- INTEGRACAO_1277_DINASTIAS -->', '']
    if forma:
        out += [forma, '']
    if state in DYNASTY_NOTES:
        out += [DYNASTY_NOTES[state], '']
    for entry in LINEAGES.get(state, []):
        out += [f"#### {entry['house']}"]
        out += ['']
        out += lineage_block(entry)
        out += ['']
    return out


# ----------------------------------------------------------- cronologia ----
def year_of(date_text: str) -> int:
    text = re.sub(r'[*`]', '', date_text).strip()
    if 'Era dos Dragões' in text:
        return -3000
    text = re.sub(r'^c\.\s*', '', text)
    text = re.sub(r'^(II|III|IV|I)-', '', text)
    match = re.search(r'\d+', text)
    return int(match.group()) if match else 9999


def table_rows(table):
    rows = []
    for line in table:
        cells = [cell.strip() for cell in line.strip().strip('|').split('|')]
        if not cells or re.match(r'^[- :]+$', cells[0]):
            continue
        rows.append(cells)
    return rows


def parse_tables(lines):
    tables, index = [], 0
    while index < len(lines):
        line = lines[index]
        if line.startswith('|') and index + 1 < len(lines) and re.match(r'^\|?[\s:|-]+\|', lines[index + 1].strip()):
            block = [line, lines[index + 1]]
            index += 2
            while index < len(lines) and lines[index].startswith('|'):
                block.append(lines[index])
                index += 1
            tables.append(block)
        else:
            index += 1
    return tables


def era_tables(world_lines):
    """Localiza a tabela de cada era e devolve {era: (índice, linhas)}."""
    result = {}
    for era, title in [(2, '##### Segunda Era'), (3, '##### Terceira Era'), (4, '##### Quarta Era')]:
        start = heading_index(world_lines, 0, len(world_lines), title)
        if start is None:
            continue
        end = len(world_lines)
        for i in range(start + 1, len(world_lines)):
            if re.match(r'^#{1,5} ', world_lines[i]):
                end = i
                break
        for table in parse_tables(world_lines[start:end]):
            first = world_lines[start:end].index(table[0])
            result[era] = (start + first, table)
            break
    return result


def chronology_rows(parts):
    _, lines = part(parts, 'I — HISTÓRIA')
    rows = []
    for table in parse_tables(lines):
        header = [cell.strip() for cell in table[0].strip().strip('|').split('|')]
        if len(header) != 3 or key(header[0]) != 'data':
            continue
        for cells in table_rows(table[2:]):
            if len(cells) != 3 or key(cells[0]) == 'data':
                continue
            date = cells[0]
            era = 2 if 'Era dos Dragões' in date else (3 if year_of(date) <= 1250 else 4)
            rows.append((era, cells, year_of(date)))
    return rows


def date_key(value: str) -> str:
    text = re.sub(r'[*`]', '', value).replace('AQD', '').strip()
    text = re.sub(r'^c\.\s*', '', text)
    text = re.sub(r'^(II|III|IV|I)-', '', text)
    return key(text)


def insert_rows_into_table(table_lines, rows):
    header = table_lines[0]
    divider = table_lines[1]
    existing = table_rows(table_lines[2:])
    by_date = {date_key(cells[0]): cells for cells in existing}
    existing_stamps = {(date_key(cells[0]), key(cells[1])) for cells in existing}
    titles = {}
    for cells in rows:
        titles.setdefault(date_key(cells[0]), set()).add(key(cells[1]))
    merged = list(existing)
    added = set()
    for cells in rows:
        stamp = (date_key(cells[0]), key(cells[1]))
        if stamp in added or stamp in existing_stamps:
            continue
        added.add(stamp)
        shared_date = date_key(cells[0]) in by_date
        if shared_date and len(titles[date_key(cells[0])]) == 1:
            continue
        merged.append(cells)
    merged.sort(key=lambda cells: year_of(cells[0]))
    rendered = [header, divider] + ['| ' + ' | '.join(cells) + ' |' for cells in merged]
    return rendered


# ------------------------------------------------------------ edições ------
class Editor:
    def __init__(self):
        self.edits: list[tuple[int, int, list[str]]] = []

    def add(self, index: int, block: list[str], order: int = 0):
        self.edits.append((index, order, block))

    def apply(self, lines: list[str]) -> list[str]:
        for index, _order, block in sorted(self.edits, key=lambda e: (e[0], e[1]), reverse=True):
            lines[index:index] = block
        return lines


def insert_at(lines, index, block):
    return lines[:index] + block + lines[index:]


# ---------------------------------------------------------------- mundo ----
def integrate_world(text: str, parts) -> str:
    lines = text.splitlines()
    if '<!-- INTEGRACAO_1277_HISTORIA_GERAL -->' not in text:
        _, part1 = part(parts, 'I — HISTÓRIA')
        narrative = []
        # parágrafo de abertura da sucessão das casas
        start = next(i for i, line in enumerate(part1) if line.startswith('### A sucessão das casas e das guerras'))
        end = next(i for i in range(start + 1, len(part1)) if part1[i].startswith('#### '))
        intro = [line for line in part1[start + 1:end] if line.strip()]
        narrative += ['#### A sucessão das casas e das guerras', '']
        narrative += intro + ['']
        # seções analíticas
        for heading in ['### As fronteiras mudam, os Estados de 1277 permanecem',
                        '### As guerras de incorporação, por época',
                        '### Confrontos entre as grandes potências antes de 1215 AQD',
                        '### Como esses conflitos se relacionam']:
            begin = next(i for i, line in enumerate(part1) if line.startswith(heading))
            finish = len(part1)
            for i in range(begin + 1, len(part1)):
                if re.match(r'^#{1,3} ', part1[i]):
                    finish = i
                    break
            block = part1[begin:finish]
            while block and (not block[-1].strip() or block[-1].strip() == '---'):
                block.pop()
            narrative += ['#### ' + block[0][4:].strip(), ''] + block[1:] + ['']
        narrative += ['<!-- INTEGRACAO_1277_HISTORIA_GERAL -->', '']
        anchor = heading_index(lines, 0, len(lines), '### Cronologia das Quatro Eras')
        lines = insert_at(lines, anchor, narrative)

    # Linhas novas na cronologia, por era. As eras são editadas de baixo para
    # cima para que os índices das tabelas seguintes não fiquem desatualizados.
    tables = era_tables(lines)
    rows = chronology_rows(parts)
    for era, (start, table) in sorted(tables.items(), key=lambda item: item[1][0], reverse=True):
        new = [cells for e, cells, _y in rows if e == era]
        if not new:
            continue
        rendered = insert_rows_into_table(table, new)
        lines[start:start + len(table)] = rendered
    return '\n'.join(lines) + '\n'


# ------------------------------------------------------------------ main ---
def main():
    guide = GUIDE.read_text(encoding='utf-8')
    parts = split_parts(guide)

    _, p2 = part(parts, 'II — CAPÍTULOS')
    _, p2b = part(parts, 'PARTE III — REPÚBLICAS')
    _, p4 = part(parts, 'IV — ACRÉSCIMOS')
    _, p5 = part(parts, 'V — INSTITUIÇÕES')
    historia = {title: body for title, body in chapters(p2 + p2b)}
    formas = forma_by_state(parts)

    places_text = PLACES.read_text(encoding='utf-8')
    lines = places_text.splitlines()
    editor = Editor()

    # 1. Narrativas dos 19 Estados no capítulo "História integral".
    for state in historia:
        start, end = find_state(lines, state)
        history = heading_index(lines, start, end, '### História integral do Estado')
        if history is None:
            raise RuntimeError('Sem História integral: ' + state)
        if f'<!-- INTEGRACAO_1277_HISTORIA:{slug(state)} -->' in places_text:
            continue
        insert = section_end(lines, history, end, 3)
        block = ['', f'<!-- INTEGRACAO_1277_HISTORIA:{slug(state)} -->', '']
        block += strip_chapter(historia[state])
        block += ['']
        editor.add(insert, block)

    # 2. Casas, sucessões e linhagens antes das províncias.
    for state in historia:
        start, end = find_state(lines, state)
        anchor = heading_index(lines, start, end, '### Províncias e cidades')
        block = dynasty_section(state, formas.get(state, ''))
        if not any(line.strip() for line in block[4:]):
            continue
        if '<!-- INTEGRACAO_1277_DINASTIAS -->' in '\n'.join(lines[start:anchor]):
            continue
        editor.add(anchor, [''] + block + [''], order=-1)

    # 3. Acréscimos às cidades e pontos de interesse (Parte IV).
    for state, body in chapters(p4):
        begin, end = find_state(lines, state)
        for name, block_lines in subchapters(body):
            text = ' '.join(line.strip() for line in block_lines if line.strip() and not line.startswith('**Destino:**')).strip()
            if not text:
                continue
            marker = f'<!-- 1277:lugar:{slug(name)} -->'
            if marker in places_text:
                continue
            clean_name = re.sub(r'\s*\(.*', '', name).strip()
            city_index = None
            for i in range(begin, end):
                if lines[i].startswith('##### Cidade: '):
                    title = lines[i][len('##### Cidade: '):]
                    if key(clean_name) in key(title):
                        city_index = i
                        break
            if city_index is not None:
                insert = section_end(lines, city_index, end, 5)
                editor.add(insert, ['', f'**Acréscimo histórico (1277 AQD):** {text} {marker}', ''], order=1)
            else:
                poi = heading_index(lines, begin, end, '### Pontos de interesse')
                if poi is None:
                    continue
                insert = section_end(lines, poi, end, 3)
                editor.add(insert, [f'- **{clean_name}** — {text} {marker}', ''], order=1)

    # 4. Instituições, ordens e ofícios (Parte V).
    destinations = {
        'Cavaleiros Santos (Elucitor)': ['Elucitor'],
        'Ordem do Lírio da Aurora': ['Elucitor'],
        'Senado e aristocracia de Elucitor': ['Elucitor'],
        'Conselho eleitor e cortes regionais de Dragonfall': ['Dragonfall'],
        'Conselho das Forjas (Duräk)': ['Duräk'],
        'Conclave dos Seis Santos (Piglia)': ['Piglia'],
        'Pacto dos Portos Livres': ['Batovia', 'Mountport', 'Vitravion'],
    }
    for title, body in chapters(p5):
        target = next((states for prefix, states in destinations.items() if title.startswith(prefix)), None)
        if not target:
            continue
        text = ' '.join(line.strip() for line in body if line.strip() and not line.startswith('**Destino:**')).strip()
        heading = re.sub(r'\s*\(.*', '', title).strip()
        for state in target:
            marker = f'<!-- 1277:instituicao:{slug(title)} -->'
            begin, end = find_state(lines, state)
            text_before = '\n'.join(lines[begin:end])
            if marker in text_before:
                continue
            section = heading_index(lines, begin, end, '### Instituições, tradições e costumes do Estado')
            if section is None:
                continue
            insert = section_end(lines, section, end, 3)
            editor.add(insert, ['', f'#### {heading}', '', text, marker, ''], order=2)

    lines = editor.apply(lines)
    PLACES.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    WORLD.write_text(integrate_world(WORLD.read_text(encoding='utf-8'), parts), encoding='utf-8')
    print('Integração concluída.')


if __name__ == '__main__':
    main()
