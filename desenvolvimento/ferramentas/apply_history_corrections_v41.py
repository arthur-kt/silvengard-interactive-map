"""Apply the author's correction document, preserving superseded passages in comments.
Only canonical prose is inserted in the reading chapters; editorial instructions,
invented city histories and obsolete commercial assignments are not published.
"""
from pathlib import Path
import re,json,hashlib
B=Path(__file__).resolve().parents[2];folder=B/'app/historic_archives'
doc=(B/'Silvengard_Correcoes_e_Acrescentimos_Sem_Culturas_Inativas.md').read_text(encoding='utf-8-sig')
files={'HG':'Silvengard_Historia_Geral_e_Cronologia_Consolidada.md','EST':'Silvengard_Estados_Historias_Provincias_e_Cidades.md','CUL':'Silvengard_Culturas_Religioes_e_Instituicoes_Consolidadas.md'}
texts={k:(folder/v).read_text(encoding='utf-8') for k,v in files.items()};log=[]
def section(start,end):return doc[doc.index(start):doc.index(end,doc.index(start))]
corrections={}
for m in re.finditer(r'^### (C\d+) —[^\n]*\n([\s\S]*?)(?=^### C\d+|^## 3\.)',doc,re.M):
 quotes=[line[2:] if line.startswith('> ') else '' for line in m[2].splitlines() if line.startswith('>')]
 corrections[m[1]]='\n'.join(quotes).strip()
def current_commerce(text):
 text=text.replace('**Selne** é a sede do **mercado comercial interior** na proposta de dez mercados','**Allanan** é a sede do **mercado comercial regional**')
 text=text.replace('**Asgorath, Alqa, Elucitor, Porto do Álamo, Almirarem, Selne, Velaffeld, Loueixo, Khegosla e Ros Leones**','**Asgorath, Alqa, Elucitor, Porto do Álamo, Grenolk, Allanan, Velaffeld, Loueixo, Khegosla e Ros Leones**')
 text=text.replace('A decisão comercial mais recente vincula **as quatro cidades de Veniun — Anteventium, Aleravum, Fovium e Odusonsium — ao Mercado de Elucitor**, mas isso **não constitui incorporação política**.','**Anteventium integra o Mercado de Elucitor; Aleravum, Fovium e Odusonsium integram o Mercado de Alqa.** Esses vínculos comerciais não constituem incorporação política.')
 text=text.replace('em Lirion e na Tríplice Élfica','nos núcleos da Tríplice Élfica')
 return text
corrections={k:current_commerce(v) for k,v in corrections.items()}

def preserve(old,new):return '<!-- REGISTRO SUPERADO — não usar como cânone atual\n'+old.replace('-->','—>')+'\n-->\n'+new
def retify(key,code,predicate):
 lines=texts[key].splitlines();count=0
 for i,line in enumerate(lines):
  # Do not alter headers, tables or quoted file identifiers through fuzzy matching.
  if line.startswith(('#','|','<!--')):continue
  if predicate(line):lines[i]=preserve(line,corrections[code]);count+=1
 texts[key]='\n'.join(lines)+'\n';log.append({'correction':code,'file':key,'retifiedPassages':count})

if '<!-- CORRECOES_V41_APLICADAS -->' not in texts['EST']:
 retify('HG','C01',lambda s:'Elusidor' in s and ('não foi narrada' in s or 'serão documentados' in s))
 for k in ['EST','CUL']:retify(k,'C02',lambda s:'A forma constitucional e o governante ainda não foram definidos' in s)
 retify('HG','C03',lambda s:'Alto Síndico' in s and ('apenas' in s and ('suger' in s or 'sugest' in s)))
 retify('HG','C04',lambda s:'Dirigíveis' in s and ('permanecem uma proposta' in s or 'apenas propostas' in s))
 for k in ['HG','EST']:retify(k,'C05',lambda s:'Liotorn' in s and ('ouro' in s or 'prata' in s) and ('hipótese' in s or 'alteração futura' in s or 'possível transferência' in s))
 retify('HG','C06',lambda s:'pico' in s.lower() and ('comparação' in s or 'nome' in s and 'confirmar' in s))
 for k in ['EST','CUL']:retify(k,'C07',lambda s:('Ros Leones' in s or 'Rosleones' in s) and 'grafia' in s and ('confer' in s or 'pendente' in s or 'confirmar' in s))
 retify('HG','C08',lambda s:'Liga de Batum' in s and ('identificação final' in s or 'antagonista' in s and 'pendente' in s))
 # Unambiguous legacy spelling in prose only; filenames/source titles stay intact.
 for k in texts:
  lines=texts[k].splitlines();inside=False;count=0
  for i,line in enumerate(lines):
   if '<!--' in line:inside=True
   if not inside and not line.startswith('#') and 'Garnalus' in line and not line.startswith('**Fonte:'):
    lines[i]=preserve(line,line.replace('Garnalus','Garnalos'));count+=1
   if '-->' in line:inside=False
  texts[k]='\n'.join(lines)+'\n';log.append({'correction':'C09','file':k,'retifiedPassages':count})

 # Explicit corrections become chapters within the existing state history, not new states.
 mapping={12:['C08','C13','C15','C16'],13:['C01','C07','C21','C22','C23'],14:['C09','C24'],17:['C12','C20'],20:['C18','C33'],24:['C17'],26:['C28'],28:['C05','C21'],31:['C03','C33'],33:['C19'],35:['C02'],46:['C11'],47:['C11','C13','C31'],48:['C06','C12','C27'],49:['C04','C33'],23:['C28'],29:['C11']}
 names={'C01':'A formação de Elucitor e Veniun','C02':'A Coroa e o Conselho das Forjas','C03':'As cidades e o Alto Síndico','C04':'Navegação e invenção','C05':'Ouro de Veniun e prata de Liotorn','C06':'Pico de Candelápria e a tradição de Bahamut','C07':'Ros Leones','C08':'Arvanthir e a Liga de Batum','C09':'Garnalos e suas instituições','C11':'Autonomia dos governos regionais','C12':'A memória de Valar e Porto Corujos','C13':'Gugacon e os portos homônimos','C15':'Rodrick Windbear e o desfecho da guerra civil','C16':'A monarquia eletiva','C17':'O Califado e suas comunidades','C18':'Brutus e os acontecimentos do Oeste','C19':'O Pontífice, o Conclave e o Conselho','C20':'A civilização desaparecida de Valar','C21':'A rede de escolas de magia','C22':'A Casa Lucien e o imperador','C23':'A Voz dos Lucien','C24':'As tradições de Gavanon','C27':'Porto Corujos','C28':'Khegosla e as Sete Cidades','C31':'O Norte de Vitravion','C33':'Relações e navegação no Oeste'}
 state_ids={'Batovia':49,'Drácon':20,'Dragonfall':12,'Duräk':35,'Elucitor':13,'Husaj':24,'Khajataad':26,'Marshell':34,'Mountport':31,'Navï Velaffëll':14,'Osmorn':48,'Piglia':33,'Reinos Médios':46,'Sete Cidades':23,'Território Orc':29,'Valar':17,'Veniun':28,'Vitravion':47,'Goblinburgo':32}
 def modify_state(text,name,fn):
  match=re.search(r'^## Estado: '+re.escape(name)+r'\s*\n[\s\S]*?(?=^## Estado: |\Z)',text,re.M)
  if not match:raise ValueError('State chapter missing: '+name)
  return text[:match.start()]+fn(match[0])+text[match.end():]
 for name,sid in state_ids.items():
  codes=mapping.get(sid,[])
  block='\n'.join('#### '+names[c]+'\n\n'+corrections[c]+'\n' for c in codes if corrections.get(c))
  if block:
   def insert(ch):
    h=re.search(r'^### História integral[^\n]*\n',ch,re.M)
    return ch[:h.end()]+'\n'+block+'\n'+ch[h.end():] if h else ch+'\n### História e instituições\n\n'+block
   texts['EST']=modify_state(texts['EST'],name,insert)
  if sid in [12,13,24,31,33,35]:
   identity={12:corrections['C16']+' Dragonfall é independente desde 1262 AQD.',13:'Elucitor é um império humano unificado pela Casa Lucien. Em 1277 AQD, governa o imperador Lucius Lucien IX.',24:corrections['C17'],31:corrections['C03'],33:corrections['C19'],35:corrections['C02']}[sid]
   texts['EST']=modify_state(texts['EST'],name,lambda ch:re.sub(r'(### Identidade e situação política\s*\n)[\s\S]*?(?=\n### )',lambda m:m[1]+'\n'+identity+'\n',ch,count=1))
 # Archaeological entries preserve uncertainty; no new civilisation, ancestry or date is invented.
 entries={}
 for number,end in [('3.1','### 3.2'),('3.2','### 3.3'),('3.3','### 3.4')]:
  block=section('### '+number,end);entries[number]='\n'.join(line[2:] if line.startswith('> ') else '' for line in block.splitlines() if line.startswith('>')).strip()
 for state,keys in [('Dragonfall',['3.1','3.3']),('Elucitor',['3.2']),('Husaj',['3.1'])]:
  content='\n\n'.join(entries[k] for k in keys)
  if state=='Husaj':content='#### As ruínas do deserto vizinho\n\nAs Ruínas de Amestris ficam nas terras de Dragonfall, próximas ao ambiente desértico chamado Husaj no califado. Sua identidade e seu desaparecimento continuam um mistério.'
  texts['EST']=modify_state(texts['EST'],state,lambda ch:ch+'\n### Memórias, lugares e mistérios\n\n'+content+'\n')
 # Four complete dossiers, stripped only of drafting instructions/questions.
 dossier_names=[('4.1','Piglia','### 4.2'),('4.2','Sete Cidades','### 4.3'),('4.3','Valar','### 4.4'),('4.4','Veniun','## 5.')]
 for number,state,end in dossier_names:
  raw=section('### '+number,end);content='\n'.join(line[2:] if line.startswith('> ') else '' for line in raw.splitlines() if line.startswith('>'))
  content=re.sub(r'^\*\*Questões abertas:\*\*.*$','',content,flags=re.M);content=current_commerce(content)
  texts['CUL']=modify_state(texts['CUL'],state,lambda ch:ch+'\n### Cultura e instituições\n\n'+content+'\n')
  texts['EST']=modify_state(texts['EST'],state,lambda ch:ch+'\n### Cultura e instituições\n\n'+content+'\n')
  log.append({'dossier':state,'characters':len(content)})
 # Canonical global glossary. Counts are deliberately not copied from the older snapshot.
 glossary=['## Povos, culturas e tradições religiosas','', '### Culturas com localidades vinculadas','']
 for line in section('### 5.1','### 5.2').splitlines():
  if not line.startswith('| **'):continue
  fields=[s.strip() for s in line.strip('|').split('|')];name=fields[0].replace('**','');desc=current_commerce(fields[3]);glossary+=['##### Cultura: '+name,'',desc,'']
 glossary+=['### Tradições e categorias religiosas','']
 for line in section('### 5.2','### 5.3').splitlines():
  if not line.startswith('| **'):continue
  fields=[s.strip() for s in line.strip('|').split('|')];name=fields[0].replace('**','');desc=fields[4].replace('**Proposta de descrição:** ','').replace('**Proposta em desenvolvimento:** ','')
  glossary+=['##### Religião: '+name,'',desc,'']
 texts['CUL']=texts['CUL'].replace('## Estado: Batovia','\n'.join(glossary)+'\n## Estado: Batovia',1)
 # New world reading chapters are included by the reader before the inherited prose.
 worldblock='## Memórias e tradições de Silvengard\n\n'
 for key in ['3.1','3.2','3.3']:worldblock+=entries[key].replace('#### ','### ')+'\n\n'
 for code,title in [('C10','O calendário das quatro eras'),('C15','A guerra civil e Rodrick Windbear'),('C18','Brutus e o Oeste'),('C23','A Voz da Casa Lucien'),('C24','Gavanon e suas tradições'),('C31','O Norte de Vitravion'),('C32','Divindades e escolas de magia'),('C33','Relações do Oeste')]:worldblock+='### '+title+'\n\n'+corrections[code]+'\n\n'
 marker='## História geral — registro integral';texts['HG']=texts['HG'].replace(marker,worldblock+marker,1)
 # Late references have priority over the stale market names in the correction document.
 texts['HG']+='\n## Referência comercial atual\n\nOs mercados comerciais são independentes da soberania política. As sedes atuais são Asgorath, Alqa, Elucitor, Porto do Álamo de Vitravion, Grenolk, Allanan, Velaffeld, Loueixo, Khegosla e Ros Leones. As atribuições são mantidas no documento comercial; Valar e o Norte Desconhecido não integram mercados ativos.\n'
 for key in texts:texts[key]='<!-- CORRECOES_V41_APLICADAS -->\n'+texts[key]
 for key,file in files.items():(folder/file).write_text(texts[key],encoding='utf-8')
 (B/'historias-correcoes-v41.json').write_text(json.dumps({'document':'Silvengard_Correcoes_e_Acrescentimos_Sem_Culturas_Inativas.md','correctionsCovered':['C'+str(i).zfill(2) for i in range(1,35)],'changes':log,'latestMarketDecisionsOverrideDocument':True,'unknownCityHistoriesInvented':False},ensure_ascii=False,indent=2),encoding='utf-8')
 print('History corrections applied:',len(log),'tracked operations; 4 dossiers, 15 cultures, 17 religious categories')
else:print('History corrections already applied')
