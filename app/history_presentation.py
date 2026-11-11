"""Player-facing reading edition; the author's Markdown remains untouched."""
import re
import unicodedata


def key(text):
    return unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()


def hidden_title(title):
    text = key(title)
    patterns = [r'observa.*(editorial|cartograf)', r'identidade e geografia', r'geografia e vizinhanca',
                r'identidade e localizacao', r'^territorio(?: e ambiente)?$', r'finalidade e organizacao',
                r'escopo deste registro', r'gra[fv]ias oficiais', r'informacoes a confirmar',
                r'^(?:(?:[ivx]+|\d+)\.\s*)?(pontos|questoes|informacoes|aspectos|detalhes|instituicoes).*(defini|abert|futur|desenvolv|pendente)',
                r'a definir$', r'ideias nao oficializadas', r'nao canonic', r'nao oficial',
                r'possibilidades narrativas', r'possibilidades em discussao', r'proposta militar',
                r'elefantes.*(proposta|discussao|hipotese)', r'montarias.*hipotese',
                r'notas? de (continuidade|consistencia)', r'nomenclatura.*conferir',
                r'atlas provincial', r'divisao provincial e atividades', r'limites interpretativos',
                r'pontos de interesse e elementos do mapa', r'fontes legadas', r'registro cultural legado',
                r'fontes culturais e religiosas disponiveis', r'^referencias? (do catalogo|religiosas? cartografic|territorial e economic)',
                r'principios de continuidade', r'diretriz de criacao', r'coerencia de geracoes',
                r'ajuste geracional', r'geracoes imperiais e calendario', r'retificacao oficial',
                r'nota importante sobre sobreposicoes', r'^o que nao decorre', r'uso em aventuras',
                r'problemas recorrentes.*campanhas', r'^convencoes e marcos']
    patterns += [r'interpretacao politica.*canonizacao', r'ajuste historico oficial', r'^a geracao de ',
                 r'atualizacao.*(?:liotorn|distribuicao dos metais)', r'^consolidacao continental',
                 r'^nota geografica', r'registro.*informacoes futuras']
    return any(re.search(pattern, text) for pattern in patterns)


def clean_title(title):
    title = re.sub(r'^(Estado|Província|Cidade):\s*', '', title)
    title = re.sub(r'^(?:[IVX]+\.\s*|\d+\.\s*)', '', title)
    title = re.sub(r'^(?:ADENDO(?: CANÔNICO)?|COMPLEMENTO(?: À TERCEIRA ERA)?|NOTA (?:CULTURAL|CRONOLÓGICA|DE CÂNONE))\s*[—:]\s*', '', title, flags=re.I)
    title = re.sub(r'^(?:Atualização|Referência cruzada)\s*—\s*', '', title, flags=re.I)
    title = re.sub(r'\s+e questões (?:ainda )?abertas', '', title, flags=re.I)
    title = re.sub(r'\s*— base narrada e proposta institucional', '', title, flags=re.I)
    title = re.sub(r'\s*\([^)]*(?:2026|cânone|canonic|confirmada pelo criador|confirmacao canonica)[^)]*\)', '', title, flags=re.I)
    title = re.sub(r'\s*—\s*(?:fonte.*|original integral|registro integral|reprodução integral|cânone.*|canone.*|história (?:narrada|canônica).*|fato histórico.*|definição canônica.*|confirmação canônica.*|confirmacao canonica.*|referência complementar.*|referência comercial.*|cânone e propostas.*)$', '', title, flags=re.I)
    title = title.replace(' — FATOS DEFINIDOS', '').replace(' — VERSÕES OFICIAIS', '')
    title = re.sub(r'\s*\[registro.*', '', title)
    if title == 'Instituições, tradições e costumes do Estado':
        title = 'Instituições e ofícios'
    if title.isupper():
        title = title.title()
        title = re.sub(r'\b(Da|Das|Do|Dos|De|E|A|À|O|Os|As|Na|No|Em|Com|Contra|Sob|Para)\b', lambda m: m[0].lower(), title)
        title = title[:1].upper() + title[1:]
        title = title.replace('Aqd', 'AQD')
    title = title.strip()
    return title[:1].upper() + title[1:]


STATE_PANORAMA = (
    'monarquiaeletiva', 'umreinodemuitasfamilias', 'asgrandescasaseosolares', 'ascortesregionais',
    'ramosfamiliares', 'aformacaodeelucitoreveniun', 'escolasdemagia', 'acasalucieneoimperador',
    'avozdoslucien', 'organizacaoimperial', 'defesasfronteiras', 'vidapublica', 'culturaedireito',
    'religiaoimperial', 'conselhosenatorial', 'herancasmagicas', 'marcashereditarias',
    'acapitalelucitor', 'vennoduro', 'mestrina', 'nunar', 'marcade', 'lordelonginus',
    'ascasassenatoriais', 'comoestado', 'asformacoes',
)
STATE_RECENT = (
    'eracontemporanea', 'quartaera', 'independencia', 'guerracivil', 'reassentamento', 'povoselficos',
    'relacoescom', 'relacoesrecentes', 'portos', 'desertodeamestris', 'aaberturade', 'oplanodos',
    'aaliancacontra', 'aintervencao', 'dragonfallindependente', 'herancadrodrick', 'oreinodepoisde',
    'ultimoinverno', 'pedraurea', '1277', 'reinodepois',
)
STATE_ORIGINS = ('primeiraera', 'segundaera', 'valar', 'baranor', 'askhlozhad', 'dragoes', 'criacao', 'deuses')

WORLD_MEMORIES = (
    'ruinasdeamestris', 'oreinoperdidodebaranor', 'baranor', 'ocalendariodasquatroeras',
    'aguerracivilerodrickwindbear', 'brutuseooeste', 'avozdacasalucien', 'gavanon', 'onortedevitravion',
    'divindadeseescolasdemagia', 'relacoesdooeste',
)
WORLD_MYTH = (
    'asquatroeras', 'ocaos', 'osdeuseseseusdominios', 'aformacaodomundo', 'matila', 'adivisaodemelkeloth',
    'asguerrasentreosdeuses', 'auniaodosdeuses', 'aretiradadosdeuses', 'asescolasdamagia',
    'referenciarapida', 'osherdeirosdosdeuses', 'aresistenciadasracas', 'askhlozhad',
)
WORLD_PRESENT = ('casassoberanas', 'dinastiasedtradicoes', 'apazarmada', 'opactodosportoslivres',
                 'osatores', 'referenciatemporal')


def compact(value):
    return re.sub(r'[^a-z0-9]', '', key(value))


def first_year(text):
    years = [int(value) for value in re.findall(r'\b(1[0-9]{2}|2[0-9]{2}|[3-9][0-9]{2}|1[0-2][0-9]{2})\b', text)]
    return min(years) if years else None


def state_era(section):
    title = compact(section['displayTitle'])
    if any(marker in title for marker in STATE_PANORAMA):
        return 0
    if 'primeiraera' in title or 'segundaera' in title:
        return 2
    if 'terceiraera' in title:
        return 3
    if any(marker in title for marker in STATE_RECENT) and 'eracontemporanea' in title:
        return 4
    year = first_year(section['displayTitle'] + ' ' + section['displayMarkdown'][:900])
    if year is not None:
        return 2 if year <= 0 else (3 if year <= 1250 else 4)
    if any(marker in title for marker in STATE_RECENT):
        return 4
    if any(marker in title for marker in STATE_ORIGINS):
        return 2
    return 3


def state_groups(chapter_ids, sections):
    houses, institutions, story = [], [], {}
    for section_id in chapter_ids:
        section = sections[section_id]
        title = section['displayTitle']
        parent = sections.get(section.get('parent'))
        if section.get('lineageIds') or compact(title).startswith('casassucessoeselinhagens'):
            houses.append(section_id)
            continue
        if compact(title).startswith('instituicoes') or (parent and compact(parent['displayTitle']).startswith('instituicoes')):
            institutions.append(section_id)
            continue
        story.setdefault(state_era(section), []).append(section_id)
    labels = {
        0: ('O Estado e suas instituições', 'Como o poder se organiza, quem aconselha o governante e quais tradições sustentam a política.'),
        2: ('Origens e Era dos Dragões', 'As fundações mais antigas, as guerras contra os dragões e as primeiras casas.'),
        3: ('Era dos Impérios', 'A formação dos reinos, as guerras de fronteira e as dinastias que chegam ao século XIII.'),
        4: ('Era Contemporânea', 'A Guerra das Relíquias, a guerra civil de Dragonfall e o mundo de 1277.'),
    }
    groups = []
    for era in (0, 2, 3, 4):
        if story.get(era):
            title, intro = labels[era]
            groups.append(dict(key=f'era-{era}', title=title, intro=intro, chapters=story[era]))
    return groups, houses, institutions


def world_groups(chapter_ids, sections):
    buckets = {'myth': [], 'history': [], 'present': [], 'memories': []}
    for section_id in chapter_ids:
        title = compact(sections[section_id]['displayTitle'])
        if any(title.startswith(marker) for marker in WORLD_MEMORIES):
            buckets['memories'].append(section_id)
        elif any(title.startswith(marker) for marker in WORLD_MYTH):
            buckets['myth'].append(section_id)
        elif any(title.startswith(marker) for marker in WORLD_PRESENT):
            buckets['present'].append(section_id)
        else:
            buckets['history'].append(section_id)
    labels = {
        'myth': ('Mitologia e criação', 'As tradições sobre os deuses, a Primeira Era e a queda do último dragão.'),
        'history': ('As eras e os reinos', 'A formação dos Estados, as guerras de fronteira e os acontecimentos que chegam a 1277.'),
        'present': ('Casas soberanas e o presente', 'Quem governa agora, as regras de sucessão e as tensões da Paz Armada.'),
        'memories': ('Memórias, lugares e mistérios', 'Lugares e tradições que não se encaixam numa cronologia fechada.'),
    }
    return [dict(key=bucket, title=labels[bucket][0], intro=labels[bucket][1], chapters=buckets[bucket])
            for bucket in ('myth', 'history', 'present', 'memories') if buckets[bucket]]


def clean_prose(markdown, title=''):
    text = re.sub(r'```linhagem[ \t]*\r?\n.*?```', '', markdown, flags=re.S)
    text = re.sub(r'<!--[\s\S]*?-->', '', text)
    text = re.sub(r'\[[^\]]*(?:a confirmar|a definir|ouvido como)[^\]]*\]', '', text, flags=re.I)
    text = re.sub(r'\([^)]*(?:a confirmar|a definir|\b2026\b)[^)]*\)', '', text, flags=re.I)
    text = re.sub(r',?\s*(?:conforme definição posterior|segundo confirmação) do criador', '', text, flags=re.I)
    if title.startswith('Cidade:'):
        match = re.search(r'\*\*História local, instituições e acontecimentos:\*\*\s*(.*)', text, re.S)
        text = match[1] if match else ''
    if title.startswith('Identidade e situação política') or title.startswith('Identidade cultural e religiosa'):
        text = re.split(r'\n\s*(?:[-*] |\*\*Culturas presentes)', text.strip())[0]
    lines = []
    for line in text.splitlines():
        plain = key(re.sub(r'[*`>]', '', line)).strip()
        if re.match(r'^(fonte|referencias?:|arquivos relacionados|registro narrativo|registro historico|registro de lore|versao de trabalho|status:|nota (?:editorial|a confirmar)|observacao cartografica|nome no atlas|referencia administrativa|estado de referencia|edicao consolidada)', plain):
            continue
        if 'documento separado' in plain or plain.startswith(('toponimia confirmada:', 'no mapa continental', 'geografia baseada nos mapas')):
            continue
        if re.match(r'^-?\s*(nota:|ainda nao definido|cultura registrada no atlas|tradicao religiosa registrada no atlas|localizacao e perfil)', plain):
            continue
        if plain.startswith(('> dossie', 'dossie inicial', 'canone cronologico', 'canone cultural', 'canone continental')):
            continue
        if re.search(r'\b(?:ainda nao foi registrada uma historia|nao (?:se deve|se pode) inferir|para importacao|nomes? de arquivos?|arquivo[s]? (?:original|relacionad|\.map)|capitulos originais|notas? editoriais?)', plain):
            continue
        # Remove drafting commentary, retaining the sentences of the narrative.
        sentences = re.sub(r'([.!?](?:\*\*)?)\s+(?=[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ*])', lambda match: match[1] + '\n\x01', line).split('\n\x01')
        kept = []
        for sentence in sentences:
            t = key(re.sub(r'[*`]', '', sentence))
            if re.search(r'(?:\b(?:o criador|pelo criador|relato do criador|arquivo \.map|simulador|cadastro|catalogo cartografico)|nao (?:esta|foi|foram) definid|(?:ainda|permanece[m]?).*(?:a definir|a confirmar)|possibilidade a desenvolver|proposta.*nao.*(?:canon|oficial)|exemplo apenas para testar|podem ser escolhidos sem contradicao)', t):
                continue
            if re.search(r'(?:ainda nao (?:estabelece|registra)|valem a identidade geral|sem definir isso|pontos (?:a|para) (?:confirmar|desenvolver)|\bcanone (?:atualizado|consolidado)|nao uma comparacao comprovada)', t):
                continue
            if re.search(r'(?:a confirmar|a definir|ainda nao foram estabelecidos|continuam (?:abertos|por decidir)|hipoteses?.*nao.*canon|possibilidades de ambientacao|referencia cartografica|referencia.*no atlas|mapas do criador|transcricao oral|arquivos?.*(?:\.md|\.map|cultura|elucitor|historia)|consultar o arquivo|ver arquivos)', t):
                continue
            if re.search(r'(?:\.(?:md|map)\b|ainda nao (?:foi|foram|esta|tenham sido).*estabelecid|nao foi especificad|nao esta estabelecid|nao foram atribuidas definitivamente|hipotese em discussao|possibilidade (?:em discussao|militar nao oficial)|nao assumir|divisao (?:territorial|insular) cadastrada)', t):
                continue
            if re.match(r'\s*(?:distinguir|nao confundir|deve-se|nao se deve)\b', t):
                continue
            kept.append(sentence)
        line = ' '.join(kept)
        line = re.sub(r'\s*\((?:antes registrada|grafia atual|confirmad[oa] pelo criador)[^)]*\)', '', line, flags=re.I)
        if line.isupper() and 5 < len(line) < 100 and not line.endswith(('.', ':')):
            line = '### ' + clean_title(line)
        lines.append(line)
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(lines)).strip()


def add_presentation(data):
    sections = {s['id']: s for s in data['sections']}

    def descendants(section):
        return [section] + [s for child in section['children'] for s in descendants(sections[child])]

    def visible(section):
        current = section
        while current:
            if current['displayHidden']:
                return False
            current = sections.get(current['parent'])
        return True

    for s in sections.values():
        s['displayHidden'] = hidden_title(s['title'])
        s['displayTitle'] = clean_title(s['title'])
        s['displayMarkdown'] = clean_prose(s['markdown'], s['title'])
        wrapper = s['level'] <= 4 and ('original' in key(s['title']) or s['title'].startswith(('SILVENGARD', 'Silvengard —')) or re.search(r' — (?:Geografia e economia|História e geografia)', s['title']))
        s['displayTransparent'] = bool(wrapper)
        if wrapper:
            s['displayMarkdown'] = ''

    records = {r['id']: r for r in data['records']}
    for r in records.values():
        r['name'] = re.sub(r'\s*\[registro.*', '', r['name'])
        roots = [sections[i] for i in r['sections']]
        r['intro'], r['government'] = '', ''
        if r['kind'] == 'state':
            chapter = roots[0]
            children = [sections[i] for i in chapter['children']]
            identity = next((s for s in children if s['title'].startswith('Identidade e situação')), None)
            government = next((s for s in children if s['title'].startswith('Casa soberana')), None)
            r['intro'] = identity['displayMarkdown'] if identity else ''
            r['government'] = government['displayMarkdown'] if government else ''
            roots = [s for s in children if s['title'].startswith(('História integral', 'Memórias, lugares e mistérios',
                                                                   'Casas, sucessões e linhagens',
                                                                   'Instituições, tradições e costumes',
                                                                   'Cultura e instituições'))]
            order = {'História integral': 0, 'Memórias, lugares e mistérios': 1, 'Casas, sucessões e linhagens': 2,
                     'Instituições, tradições e costumes': 3, 'Cultura e instituições': 4}
            roots.sort(key=lambda s: next((value for start, value in order.items() if s['title'].startswith(start)), 9))
        elif r['kind'] == 'world':
            roots = [s for s in sections.values() if s['document'] == 'world' and s['title'] in ['Silvengard em 1277 AQD — o mundo da Quarta Era', 'Memórias e tradições de Silvengard', 'História geral original', 'Paz Armada do Oeste — registro integral']]
        elif r['kind'] in ('city', 'province'):
            # These pages never inherit the city directory of their parent section.
            roots = roots[:1]
            state_record = records.get('state:' + str(r.get('stateId')))
            if state_record:
                state_section = sections[state_record['sections'][0]]
                history = next((sections[i] for i in state_section['children'] if sections[i]['title'].startswith('História integral')), None)
                if history:
                    matches = [s for s in descendants(history) if re.search(r'\b' + re.escape(key(r['name'])) + r'\b', key(s['title'])) and visible(s) and not s['displayTransparent']]
                    roots += matches
        candidates = []
        for root in roots:
            selected = [root] if r['kind'] in ('city', 'province') else descendants(root)
            for s in selected:
                if not visible(s) or s['displayTransparent'] or (not s['displayMarkdown'] and not s.get('lineageIds')):
                    continue
                if r['kind'] == 'state' and re.search(r'(?:casa soberana|tradicao de nomes)', key(s['title'])):
                    continue
                if not re.search(r'cronolog|linha do tempo', key(s['title'])):
                    candidates.append(s)
        seen = set()
        r['chapters'] = []
        for s in candidates:
            signature = key(s['displayMarkdown']) or s['id']
            if signature in seen:
                continue
            seen.add(signature)
            r['chapters'].append(s['id'])

        # Preserve chronological sequences in the local text, without dating them.
        local = []
        timeline_sections = []
        for root in roots:
            for s in descendants(root):
                if not visible(s) or not re.search(r'cronolog|linha do tempo', key(s['title'])):
                    continue
                if s['id'] in timeline_sections:
                    continue
                timeline_sections.append(s['id'])
                era = 'Acontecimentos'
                for line in s['displayMarkdown'].splitlines():
                    raw = line.strip()
                    if re.match(r'^ERA [^:]+:', raw):
                        era = raw.split(':', 1)[0].capitalize()
                    item = re.match(r'^(?:\d+\.|[-*])\s+(.*)', raw)
                    if item:
                        text = item[1]
                        date = re.search(r'(?:c\.\s*)?\d{1,4}(?:[–—-]\d{1,4})?\s*AQD', text)
                        local.append(dict(id=f'local-{r["id"]}-{len(local)}', date=date[0] if date else era,
                                          title=re.sub(r'[*`]', '', text), markdown=text, links=[], local=True))
                    elif not raw.startswith(('|', 'ERA')):
                        for sentence in re.split(r'(?<=\.)\s+(?=[A-ZÁÉÍÓÚ*])', raw):
                            plain = re.sub(r'[*`]', '', sentence)
                            date = re.search(r'(?:c\.\s*)?(?:III?-)?\d{1,4}(?:[–—-]\d{1,4})?\s*(?:AQD)?', plain)
                            if date and ('AQD' in plain or 'III-' in plain or 'II-' in plain):
                                local.append(dict(id=f'local-{r["id"]}-{len(local)}', date=date[0].strip(), title=plain,
                                                  markdown=sentence, links=[], local=True))
        related = [e for e in data['events'] if r['id'] in e.get('links', [])]
        r['timeline'] = local + related
        if r['kind'] == 'state':
            groups, houses, institutions = state_groups(r['chapters'], sections)
            r['storyGroups'] = groups
            r['houseChapters'] = houses
            r['institutionChapters'] = institutions
            r['readingOrder'] = [sid for group in groups for sid in group['chapters']] + houses + institutions
        elif r['kind'] == 'world':
            opening = next((s for s in sections.values() if s['title'].startswith('Silvengard em 1277 AQD')), None)
            if opening:
                r['opening'] = opening['displayMarkdown']
                r['chapters'] = [sid for sid in r['chapters'] if sid != opening['id']]
            groups = world_groups(r['chapters'], sections)
            r['storyGroups'] = groups
            r['readingOrder'] = [sid for group in groups for sid in group['chapters']]
    data['presentationVersion'] = 2
    return data
