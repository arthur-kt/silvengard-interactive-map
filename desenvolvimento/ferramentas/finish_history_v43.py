from pathlib import Path
import re
B=Path(__file__).resolve().parents[2];F=B/'app/historic_archives'
p=F/'Silvengard_Historia_Geral_e_Cronologia_Consolidada.md';s=p.read_text(encoding='utf-8')
s=s.replace("Para detalhes de cronologia, personagens, famílias, cidades e eventos, consultar o arquivo 'Silvengard_Estado_Dragonfall.md'.",'O conflito de Dragonfall culminou na morte de Rodrick Windbear, no fracasso do ritual de Arvanthir, na reabertura de Gugacon e na independência de Dragonfall em 1262 AQD, sob Arthur Dragonbane.')
s=re.sub(r'As tradições, hierarquias e cultos draconatos são descritos no documento separado "[^"]+\.md"\.', '',s)
s=re.sub(r'\*\*Cronologia estabelecida:\*\*[^\n]*Silvengard_Estado_Valar\.md`\.', 'Valar floresceu e foi destruída na Segunda Era. Após uma profecia sobre a Marca das Sombras, um cataclismo devastou o território; a causa e o destino final de seus habitantes permanecem desconhecidos.',s)
s=s.replace('Para os detalhes e as lacunas ainda abertas, consultar `Silvengard_Estado_Elucitor.md` e `Silvengard_Culturas_Elucitor.md`.','A Casa Lucien conserva o dom hereditário da Voz, enquanto outras grandes casas possuem dons não especificados.')
lines=[]
for line in s.splitlines():
 if line.startswith(('O **Atlas de Silvengard** registra','O relatório `Silvengard-Economia','**Documentos centrais,','**Arquivos relacionados:')):line='<!-- '+line.replace('-->','')+' -->'
 lines.append(line)
p.write_text('\n'.join(lines)+'\n',encoding='utf-8')
for p in F.glob('*.md'):
 s=p.read_text(encoding='utf-8').replace('Veniun conserva vínculos comerciais com seus vizinhos sem perder sua soberania.','')
 p.write_text(s,encoding='utf-8')
