"""Aplica as descrições das localidades do mapa aos verbetes de pontos de interesse.

Fonte única: app/dist/locality-descriptions.json (lida também pelo app.js no
carregamento do mapa). O script é idempotente e não altera nomes, tipos ou
posições. Uso:

    python desenvolvimento/ferramentas/descrever_localidades.py
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
DESCRIPTIONS = BASE / 'app' / 'dist' / 'locality-descriptions.json'
PLACES = BASE / 'app' / 'historic_archives' / 'Silvengard_Estados_Historias_Provincias_e_Cidades.md'

# Locais que ainda não tinham verbete no índice de pontos de interesse.
EXTRAS = {
    'Vitravion': [('Deserto de Lirion', 'Deserto')],
}


def key(value: str) -> str:
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', str(value)).encode('ascii', 'ignore').decode().lower())


def apply_descriptions(landmarks, descriptions=None):
    """Preenche descrições vazias em uma lista de marcos (usado no rebuild)."""
    if descriptions is None:
        descriptions = json.loads(DESCRIPTIONS.read_text(encoding='utf-8'))
    for landmark in landmarks or []:
        if not landmark.get('description') and descriptions.get(landmark.get('name')):
            landmark['description'] = descriptions[landmark['name']]
    return landmarks


def main():
    descriptions = json.loads(DESCRIPTIONS.read_text(encoding='utf-8'))
    normalized = {key(name): (name, text) for name, text in descriptions.items()}
    text = PLACES.read_text(encoding='utf-8')
    lines = text.splitlines()
    replaced, added = 0, 0
    state = None
    poi_start = poi_end = None
    index = 0
    while index < len(lines):
        line = lines[index]
        state_match = re.match(r'^## Estado: (.+)$', line)
        if state_match:
            state = state_match.group(1).strip()
            poi_start = poi_end = None
        if line.startswith('### Pontos de interesse'):
            poi_start = index
            poi_end = len(lines)
            for nxt in range(index + 1, len(lines)):
                if re.match(r'^#{1,3} ', lines[nxt]):
                    poi_end = nxt
                    break
        bullet = re.match(r'^- \*\*(.+?)\*\* \((.+?)\): (.*)$', line)
        if bullet and poi_start is not None and poi_start < index < poi_end:
            name = bullet.group(1)
            found = normalized.get(key(name))
            if not found:
                # "Floresta morta de Dungabás" no arquivo, "Dungabás" no mapa.
                candidates = [(n, d) for n, d in normalized.values() if key(n) in key(name) or key(name) in key(n)]
                endings = [(n, d) for n, d in candidates if key(name).endswith(key(n))]
                found = endings[0] if len(endings) == 1 else (candidates[0] if len(candidates) == 1 else None)
            if found:
                new_line = f'- **{name}** ({bullet.group(2)}): {found[1]}'
                if new_line != line:
                    lines[index] = new_line
                    replaced += 1
        index += 1

    # Acrescenta verbetes que faltavam no estado indicado.
    for state_name, entries in EXTRAS.items():
        start = next((i for i, line in enumerate(lines) if line.startswith('## Estado: ' + state_name)), None)
        if start is None:
            continue
        section = next((i for i in range(start, len(lines)) if lines[i].startswith('### Pontos de interesse')), None)
        if section is None:
            continue
        end = len(lines)
        for nxt in range(section + 1, len(lines)):
            if re.match(r'^#{1,3} ', lines[nxt]):
                end = nxt
                break
        existing = '\n'.join(lines[section:end])
        additions = []
        for name, kind in entries:
            if f'**{name}**' in existing:
                continue
            additions.append(f'- **{name}** ({kind}): {descriptions.get(name, "")}')
        if additions:
            insert = end
            while insert > section and not lines[insert - 1].strip():
                insert -= 1
            lines[insert:insert] = [''] + additions
            added += len(additions)

    PLACES.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'substituidos': replaced, 'acrescentados': added, 'locais': len(descriptions)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
