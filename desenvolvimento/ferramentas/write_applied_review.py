from apply_approved_economy import ROOT,read
from pathlib import Path
import json
w=read(ROOT/'app/dist/world.json');old=read(ROOT/'acervo/backups/v40-before-approved-economy/dist/world.json');d=read(ROOT/'app/dist/economy-source.json');check=read(ROOT/'revisao-economia-aplicada-verificacao.json')
num=lambda n:f'{n:,.0f}'.replace(',','.')
lines=['# Revisão econômica aplicada — Silvengard','', '**9 de novembro de 2026 — versão 40, aprovada e aplicada.**','',
'A revisão foi aplicada nas duas instalações, preservando o mapa salvo de cada uma. Cultura, religião, emblemas, posições das cidades, províncias e relevo foram mantidos. Os valores abaixo descrevem a pasta principal; as edições próprias da outra instalação foram preservadas.','',
'## Populações','', '| Localidade | Antes | Agora |','| --- | ---: | ---: |']
for b in sorted(w['cities'],key=lambda b:b['name']):
 prior=next(n for n in old['cities'] if n['i']==b['i'])
 if b['demographics']['population']!=prior['demographics']['population']:
  now='Desconhecida' if b['demographics'].get('populationKnown') is False else num(b['demographics']['population'])
  lines.append(f"| {b['name']} | {num(prior['demographics']['population'])} | {now} |")
lines+=['','Elucitor permanece a maior capital do mundo, com **1.050.000 habitantes**. Velaffeld tem **250.000** e Asgorath **100.000**.','',
'Marshell mantém **124.832 pessoas**: 25.500 residentes e 99.332 itinerantes vinculados. Os itinerantes continuam consumindo e produzindo; não foram eliminados da economia. Peregrinações de Khegosla e feiras de Marshell acrescentam visitantes sazonais. A Patrulha de Kyon tem demanda variável de equipamento para expedições.','',
'Gugacon de Vitravion conserva seu marcador e sua história de cidade perdida, mas não tem censo conhecido, manufatura ou comércio regular confirmado. Não se confunde com a Gugacon vulcânica de Dragonfall, que mantém 4.200 moradores e Lavanthir. Nilhelm permanece desabitada.','',
'## Produção e unidades','',
'- As sete escolas produzem pesquisa, papel, tinta e livros. Retirada a artilharia genérica dos centros incompatíveis com a história.',
'- Sete Cidades: as sete têm forja anã; ferro, cobre, estanho, prata e ouro foram preservados. Grenolk e Duräk trabalham como forjas abastecidas por minérios externos, sem minas montanhosas inventadas.',
'- Winterhelm mantém ossos de dragão; Gugacon de Dragonfall mantém a origem exclusiva do Lavanthir; Fovium mantém ouro e Liotorn mantém prata.',
'- Porto Sarandir recebe pesca, conservas, cordas e componentes/reparos. Urlyzaak tem estaleiro; Velaffeld, Loueixo, Porto das Cinzas, Porto do Álamo e Viras têm capacidades navais ajustadas.',
'- Alqa recebe camelos, tâmaras, sal, couro e provisões de caravanas. Khegosla recebe caça, couro, abastecimento e intermediação. A prata antes atribuída a Khegosla foi redistribuída entre centros minerais das Sete Cidades.',
'- Marshell prioriza cavalos, rebanhos, arreios, couro e conservas. Osmorn recebe cavalaria, equipamento e abastecimento. Piglia prioriza livros, papel, assistência e acolhimento, sem criar uma escola em Gannas.',
'- Drácon concentra pólvora e artilharia, além de estaleiros. Recursos incompatíveis das encostas vulcânicas foram substituídos por ferro/carvão, sem duplicar Lavanthir.',
'- Alia e Sobrirosen recebem agricultura compatível com o terreno. A subsistência rural em áreas cultiváveis aparece na contabilidade; os sítios especializados não são contados novamente.',
'- Adhuc Vivere conserva somente oficinas e depende de abastecimento externo. Valar e o Norte Desconhecido ficam fora da economia regular. Nenhuma produção periódica de pessoas cativas ou dinheiro cunhado do nada.', '',
'A referência alimentar agora é física: **um lote de grãos equivale a 500 kg e a 1.000 pessoas-dia**, com ração de referência de 0,5 kg por pessoa/dia. Uma população de 1.000 pessoas necessita de 30 desses lotes por mês. Rebanhos e outros alimentos têm rendimento comestível próprio. A antiga capacidade de 120 unidades abstratas de Rivertown corresponde a **7.200 lotes físicos**; a conversão preserva sua capacidade de alimentar pessoas, sem multiplicar a safra real por 60. Receitas e volumes foram convertidos conjuntamente.','',
'O caixa de abertura foi calibrado em **1 PO por habitante**, atribuído uma única vez ao iniciar uma nova simulação. Não é renda mensal: compras, fretes, impostos e serviços transferem moedas entre contas existentes. Continua ajustável.','',
'## Frotas, oficinas e transporte','',
'Navios marítimos e embarcações fluviais/lacustres são bens distintos. Cascos completos só podem usar conexões aquáticas; componentes navais podem seguir por estradas. Navios, artilharia, equipamento e animais de transporte entram como bens duráveis instalados, com desgaste e manutenção, em vez de consumo integral mensal.','',
'Nos ciclos salvos, uma estrada usa jornada de 8 horas; uma tripulação marítima pode operar em turnos, por 24 horas. Cargas que não chegam no período permanecem em trânsito, com dinheiro pago e mercadoria reservada. Não podem ser consumidas antes da chegada nem compradas repetidamente como se não existissem. Guerra, embargo ou bloqueio podem reter essas cargas. O panorama inicial continua uma estimativa mensal, sem salvar ciclos.','',
'Fretes são recebidos por transportadores; docas, reparos, intermediação, guildas e acolhimento têm contas próprias, pagadores e salários. Serviços e salários não são somados ao valor de produção de mercadorias. Parte das receitas retorna às localidades como pagamento pelo trabalho, sem criar moeda.','',
'## Mercados e diplomacia','',
'Cada setor rural segue o mercado da própria posição. Contas separadas representam as partes de uma província em mercados diferentes e as ilhas, com acessos reais por terra ao núcleo local; não há uma ponte invisível através do mar. O censo rural é uma **estimativa de densidade por terreno**, explicitamente identificada, e não uma soma dos antigos censos provinciais.','',
'A escassez considera fornecedores acessíveis ao comprador, incluindo rotas e restrições diplomáticas. Inimizade acrescenta custo e não equivale automaticamente a guerra; guerra declarada bloqueia negócios. As relações atuais foram preservadas: não se declarou uma guerra nova apenas porque a história cita campanhas antigas. Licenças de fronteira e acordos locais combinam-se com os modificadores de amizade ou hostilidade.','',
'Na tela de diplomacia existe uma opção de **comboios de escolta**: decisão operacional voluntária, com redução de 35% do risco médio marítimo e acréscimo de 10% no frete. Não cria uma aliança militar automática.','',
'## Rotas','',
'As estradas e os traçados antigos permanecem, com ancoragens reparadas. Trilhas internas de uma única localidade foram identificadas como caminhos locais; continuam no mapa e nas jornadas, sem funcionar como ligações comerciais fictícias. Nas linhas marítimas, passar perto de um porto não obriga o navio a atracar nele.','',
'Foram consolidados os corredores de Amestris, das Guildas de Veniun, das Forjas, de abastecimento do norte de Dragonfall e das feiras/cavalos, além da travessia Allanan–Sahtalys. Academias do Mar e Portos Livres usam as conexões existentes, sem impor um governo comum aos participantes.','',
'## Verificação','',
f"- {len(w['cities'])} localidades, 67 províncias, {len(d['goods'])} bens, {len(w['routes'])} traçados e 10 mercados.",
'- Todas as localidades economicamente ativas têm conexão comercial; nenhuma rota comercial ficou com menos de duas escalas reais.',
'- Dois ciclos de diagnóstico fecham a contabilidade de moedas; nenhum navio foi transportado por terra.',
'- Os totais dos mercados reconciliam com a produção das localidades, sem duplicação rural.',
'- O mapa usado na verificação não foi modificado pelo diagnóstico. Backups anteriores à revisão permanecem em `backups/v40-before-approved-economy`.','',
'Os testes não garantem que todos os lugares sejam autossuficientes. O modelo ainda mostra necessidades não atendidas conforme estoque, dinheiro, distância, insumos e estação. Isso permanece visível; a agricultura de todos os lugares não foi aumentada apenas para esconder carências. São ciclos agregados, não uma simulação de famílias ou de cada hora de uma oficina.','',
'## Relações atualizadas','',
'- `Silvengard-Estados-Provincias-Cidades.md`: hierarquia completa.',
'- `Silvengard-Economia-e-Mercados.md`: valores e produtos por estado, província, cidade e mercado.',
'- `Catalogo-de-Silvengard.md`: nomes, culturas, religiões e elementos geográficos.',
'- `revisao-economia-aplicada-verificacao.json`: diagnóstico reproduzível.','']
text='\n'.join(lines)
for base in [ROOT,ROOT.parent/'silvengard-atlas v2']:(base/'Revisao-Economica-Aplicada.md').write_text(text,encoding='utf-8')
print('Applied review written:',len(lines),'lines')
