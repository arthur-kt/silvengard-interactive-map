from pathlib import Path
import re,json
B=Path(__file__).resolve().parents[2];F=B/'app/historic_archives'
errata=(B/'Silvengard_Errata_Historica_e_Cultural_Sem_Mercados.md').read_text(encoding='utf-8-sig')
first=errata.split('### 1.2')[0];ritual=next(l[2:] for l in first.splitlines() if l.startswith('> '))
second=errata.split('### 1.2')[1].split('### 1.3')[0];arthur=next(l[2:] for l in second.splitlines() if l.startswith('> '))
log=[]
for p in F.glob('*.md'):
 text=p.read_text(encoding='utf-8');before=text
 # Correct the actual narrative, not just add a competing paragraph.
 lines=[]
 for line in text.splitlines():
  if 'Cratera do Cron' in line:
   if line.startswith('O ritual não trouxe'):line=ritual
   else:continue
  if 'Wyrmrealm' in line:
   if line.startswith('Arthur Dragonbane, filho'):line=arthur
   else:continue
  if 'Terremotos de Balásco' in line:continue
  if line.startswith('**Garnalos** é a localidade e o centro de tradição'):
   line='**Garnalos** é a cidade, o templo e a escola de magia associados ao **Monte Ganir** e à tradição de **Gavanon Arcanus**. O templo manteve inicialmente autonomia; após a incorporação ao império liderado por Velaffeld, tornou-se também um centro de ensino mágico.'
  # Program source identifiers stay in metadata. Reader-facing references are replaced in prose.
  if ('Ver `Silvengard_Culturas_Navi_Velaffell.md`' in line or 'ver `Silvengard_Culturas_Navi_Velaffell.md`' in line) and not line.startswith('<!--'):
   line=line.replace('Ver `Silvengard_Culturas_Navi_Velaffell.md`','Os altos elfos constituíam a elite dominante que governou Dragonfall após a Era dos Dragões, enquanto elfos da floresta permaneceram nos bosques de Lirion, com comunidades e tradições próprias. Navï Velaffëll consolidou-se mais tarde a partir de grupos de altos elfos expulsos, sem representar automaticamente todos os elfos da floresta').replace('ver `Silvengard_Culturas_Navi_Velaffell.md`','as comunidades de altos elfos e elfos da floresta preservam tradições distintas')
  if line.startswith('Referências:') and '.md' in line:continue
  line=re.sub(r'Os detalhes constam em `[^`]+\.md`\.?\s*','',line)
  line=re.sub(r'\b(?:Ver|Consultar) (?:o arquivo |os arquivos )?`[^`]+\.md`\.?','',line)
  lines.append(line.replace('Garnalus','Garnalos'))
 text='\n'.join(lines)+'\n'
 # Remove stale commercial assignments from the cultural dossier while preserving historical trade.
 text=text.replace('**Anteventium integra o Mercado de Elucitor; Aleravum, Fovium e Odusonsium integram o Mercado de Alqa.** Esses vínculos comerciais não constituem incorporação política.','Veniun conserva vínculos comerciais com seus vizinhos sem perder sua soberania.')
 if text!=before:p.write_text(text,encoding='utf-8');log.append({'file':p.name,'changed':True})
 assert not any(s in text for s in ['Cratera do Cron','Wyrmrealm','Garnalus','Terremotos de Balásco'])
(B/'errata-v43-aplicada.json').write_text(json.dumps({'source':'Silvengard_Errata_Historica_e_Cultural_Sem_Mercados.md','files':log,'existingCulturesAndReligionsPreserved':True,'newDormantCultures':False,'duplicatedVitravionDossiers':False,'marketDecision':'Toda Veniun em Alqa, por instrução separada do autor'},ensure_ascii=False,indent=2),encoding='utf-8')
print('Errata applied:',len(log),'archives; preserved mysteries, existing cultural dossiers and narrative details')
