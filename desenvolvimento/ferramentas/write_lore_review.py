"""Write a review proposal, never an edition/import file for the Atlas."""
from pathlib import Path
import json

BASE = Path(__file__).resolve().parents[2]
DATA = json.loads((BASE / 'revisao-historia-economia-dados.json').read_text(encoding='utf-8'))
CITY = {b['id']: b for b in DATA['cities']}

# Suggested numbers are design choices for approval, not numbers found in lore.
TARGETS = {
    5: (8000, 'Núcleo menor em torno da torre e da escola; preservar a importância arcana.'),
    10: (18000, 'Cidade de vários clãs e forjas; reforçar o núcleo civil e artesanal.'),
    12: (5000, 'Entreposto das caravanas de Amestris, sem o transformar numa metrópole.'),
    1239: (10000, 'Centro histórico de uma marca, com atividade marcial e torneios.'),
    1240: (10000, 'Reforçar a cidade da antiga marca, mantendo o isolamento montanhoso.'),
    191: (12000, 'Travessias lacustres, circulação da capital e tradição de torneios.'),
    61: (14000, 'Porto e sede mercantil regional, sem precisar superar Garnalos ou Himlumn.'),
    6: (18000, 'Central das Guildas e corte de Veniun; fortalecer o núcleo institucional.'),
    4003: (12000, 'Escola regional e povoação acadêmica, distinguindo-a do perfil minerador de Fovium.'),
    36: (18000, 'Fortaleza principesca, forjas e sede mercantil; Brelas pode continuar maior.'),
    45: (15000, 'Porto principal dos Reinos Médios, mesmo sem ser sede do mercado.'),
    30: (18000, 'Polo portuário de Vitravion e participante do Pacto dos Portos Livres.'),
    242: (3500, 'Porto importante de Osmorn, com docas, oficinas e moradores permanentes.'),
    129: (12000, 'Templos, assistência e acolhimento; não é uma regra de que toda capital deva ser a maior cidade.'),
    19: (6000, 'Um dos três núcleos fortificados élficos; autonomia preservada.'),
}
COMPACT = {7: 300000, 1: 250000, 3: 150000}
NOMAD = {140: 6000, 179: 5000, 143: 7000, 149: 4000, 75: 2000, 138: 1500}

STATE_PLANS = {
    12: ('Grãos e abastecimento no sul; metalurgia anã em Dagorah; ossos de dragão em Winterhelm; Lavanthir na Gugacon vulcânica; comércio e reparos nos portos.',
         'Manter Rivertown com 120 cargas de grãos/mês. Preservar os 6 lotes de ossos e 3 de Lavanthir como origens exclusivas atuais. Dar produção/serviços a Porto Sarandir. Separar os barcos do lago de Asgorath dos navios oceânicos.',
         'Fortalecer Rivertown–Asgorath–Winterhelm e o abastecimento Gugacon–Sarandir–Cinzas. Manter tarifas seletivas com Navï Velaffëll, sem presumir uma guerra permanente.'),
    13: ('Centro imperial diversificado; Alia agrícola; Arenor e Castamor militares; Danumbria acadêmica; Ros Leones portuária; Adhuc Vivere dependente de abastecimento externo.',
         'Concentrar alimentos nas terras férteis e oficinas militares nas fortalezas. Manter Adhuc sem alimentos/extração rural e com oficinas de armas/ferramentas. Não transformar o rio entre terras mortas em fonte de agricultura.',
         'Manter Estrada Imperial, Flores e Rimae, verificando as escalas reais. Integrar o mercado de Ros Leones por estrada e navegação; o corredor de mercado não cria uma estrada automaticamente.'),
    14: ('Tradição marítima, construção naval, artesanato florestal, templos e centros arcanos distintos.',
         'Conservar Velaffeld como grande estaleiro. Fortalecer reparos/comércio em Natheas e Allanan. Garnalos e Sahtalys devem vender pesquisa, livros e trabalho especializado, não ser cópias de forjas genéricas.',
         'Separar a rede do mercado de Allanan da rede setentrional de Velaffeld sem cortar as rotas entre ambas. Manter comunicação Allanan–Sahtalys e os contatos do Levante.'),
    17: ('Terra morta e civilização desaparecida.',
         'Manter população conhecida e produção regular em zero. Relíquias de expedições seriam eventos raros, não uma mina ou fábrica mensal.',
         'Nenhuma cidade ou conta comercial regular em Valar. Caminhos de exploração podem existir sem virar rotas de abastecimento comerciais.'),
    20: ('Império conquistador com frota, metalurgia, pólvora, artilharia, agricultura civil e economia de conquista.',
         'Criar um polo naval em Urlyzaak e reforçar a indústria militar do núcleo imperial/Sharntosz. As jazidas do vulcão justificam rever a extração, mas não autorizam duplicar Lavanthir fora de Gugacon. Conquista e escravização devem depender de eventos e de pessoas existentes, não gerar população cativa infinitamente.',
         'Distinguir as linhas imperiais das linhas civis do Pacto dos Portos Livres. Hostilidade não deve obrigar um navio de terceiro a atracar em porto inimigo para seguir viagem.'),
    23: ('Maior concentração anã conhecida: sete cidades autônomas de mineração e forja.',
         'Manter ferro, cobre, estanho, prata e ouro. Reequilibrar oficinas para que ferramentas e armas de forja anã tenham presença em vários salões; substituir parte das armas genéricas, sem duplicar a mesma produção. Importar parte dos alimentos.',
         'Fortalecer o eixo metalúrgico com Khegosla, Alqa e Grenolk. Travessias em conflito com clãs orcs devem ter risco/limites locais, não fechamento automático de todos os contatos por identidade racial.'),
    24: ('Califado das caravanas, camelos, tâmaras, sal, comércio e fiscalização.',
         'Alqa hoje tem artilharia como principal manufatura: eu deslocaria esse protagonismo para abastecimento e equipamento de caravanas. Manter cereais apenas em áreas irrigáveis. Os 12 elefantes/mês do campo não deveriam ser uma especialização estabelecida enquanto essa ideia for apenas proposta de lore.',
         'Consolidar Alqa–Savhalla–Mestrina–Fovium/Odusonsium, com acesso a Aleravum e às Sete Cidades. Representar licenças/taxas do Califado separadamente de frete.'),
    26: ('Centro espiritual khajitt, retorno dos viajantes, anciãos, caça e circulação livre.',
         'Khegosla produz 5 unidades de prata e 3 de moedas: esse perfil minerador/cunhador não decorre da história. Eu levaria essa extração a uma origem mineral apropriada e daria ao centro caça, couro, alimentos locais e renda de hospedagem/intermediação.',
         'Khegosla coordena redistribuição, não possui soberania sobre os salões anões do mesmo mercado. Demanda de peregrinos deve ser sazonal, sem confundi-los com moradores.'),
    28: ('Reino de cidades autônomas, montanhas, ouro, escola e guildas de aventureiros.',
         'Manter os 4 lingotes de ouro/mês em Fovium e a prata de Liotorn. Anteventium deve ganhar oficinas de equipamento, provisões e renda de contratos. Aleravum precisa de perfil acadêmico próprio em vez da cópia de cobre/armas do núcleo minerador.',
         'Reparar a ligação Aleravum–Anteventium. Veniun deve ter risco de monstros/escolta maior que o centro de Elucitor, sem alterar a regra de ritmo normal nas estradas mantidas.'),
    29: ('Clãs orcs diferentes, alguns mercantis, outros mais guerreiros; ausência de governo único.',
         'Diversificar entre armas simples, couro, caça, rebanhos, madeira e forjas locais. Ginar e Irkudh não deveriam fabricar artilharia em escala sem uma tradição tecnológica definida. Não reduzir a população só por serem orcs.',
         'Nudh e os contatos de fronteira precisam de ligações seletivas com Khegosla/Grenolk/Reinos Médios. Guerra ou acordo de um clã não equivale automaticamente à decisão de todos.'),
    31: ('Cidades oligárquicas, agricultura halfling/humana, navegação e hospitalidade de Remus.',
         'Fortalecer alimentos, bebidas, hospedagem e provisões náuticas. Sobrirosen tem 31 mil moradores e nenhuma produção rural no seu condado: eu verificaria solos e restituiria agricultura apropriada. Manter o vidro de Ridualhos onde houver areia/insumos.',
         'Viras deve funcionar como porto alimentador da rede de Loueixo; decisões mercantis locais podem variar, sem criar um monarca ou alfândega única inexistente na história.'),
    32: ('Porto conhecido e redes clandestinas ligadas a uma sociedade fragmentada e a uma cidade de localização incerta.',
         'Não tratar os 6.400 habitantes de Crild como censo de toda a população goblin. A renda deveria incluir pesca, reparos, redistribuição e contrabando, em vez de depender apenas de armas/carvão/couro.',
         'Separar a rota legal do Mar de Nur de ramais clandestinos. O risco deve seguir águas e grupos atuantes, não transformar todo comerciante goblin em pirata.'),
    33: ('Templos, concílio, assistência, acolhimento e convivência religiosa.',
         'Substituir o predomínio genérico de armas por livros, papel, serviços de cura/hospedagem e provisões. Gannas não deve ganhar uma escola de magia de volta: seu papel atual é distinto. Serviços não precisam ser mercadorias estocáveis.',
         'Manter ligações de peregrinação e abastecimento com Alqa, Veniun e os vizinhos. Neutralidade e abrigo não significam ausência de defesa, mas também não fundamentam uma grande indústria bélica.'),
    34: ('Hordas e assentamentos seminômades, cavalos, rebanhos e encontros sazonais.',
         'Tog Iret produz sobretudo velas; eu daria prioridade a cavalos, arreios, couro, alimentos conservados e serviços de feira. Separar residentes dos contingentes itinerantes antes de diminuir números nos marcadores.',
         'Representar percursos de reunião/feira e oferta sazonal. Preservar o total de pessoas das hordas ao redistribuí-las; não desaparecer com população por ela deixar de ser classificada como urbana.'),
    35: ('Fortaleza anã entre rios e florestas, forjas, mercenários e comércio.',
         'Grenolk deve ganhar ferramentas, armas/forja anã e processamento de carvão. Importar minérios das Sete Cidades/Liotorn; não inventar grandes minas montanhosas num reino cuja singularidade é estar fora delas. Prata fluvial continua uma hipótese.',
         'Consolidar Grenolk–Almirarem e os contatos com as forjas e os mercados do interior; o porto continua útil mesmo com a sede em Grenolk.'),
    46: ('Reinos e cidades independentes, sem capital ou governo de toda a região.',
         'Manter diversidade local: metalurgia onde houver infraestrutura, agricultura nos vales, artesanato e atividade portuária em Almirarem. Não distribuir artilharia apenas por herança de perfis antigos.',
         'Almirarem é a porta marítima para Grenolk. Tarifas, pactos e guerras podem precisar de exceções provinciais/locais, pois o grupo cartográfico não é um reino unificado.'),
    47: ('Cidades autônomas: Guernica humana, porto multicultural, Tríplice Élfica, Mauron, Kyon e Pyrenor.',
         'Retirar a Gugacon perdida do comércio regular e do censo conhecido, sem afirmar que não há habitantes reais. Manter Guernica como maior cidade humana. Kyon tem civis, não só patrulheiros. Mauron merece forja/mineração; Pyrenor, pesquisa em vez de artilharia.',
         'Porto do Álamo ganha peso sem se tornar capital política de Vitravion. Preservar Vir/Triovorn/Porto de Vern como Tríplice Élfica e Lirion/Oregon como núcleos humanos. O Norte desconhecido não oferece estoques ou mercados automáticos.'),
    48: ('Reino cavaleiresco de Bahamut, campos, cavalos, forjas e porto de apoio.',
         'Valorizar criação de cavalos, arreios, equipamento militar e suprimentos. Porto Corujos precisa de papel econômico portuário; a capacidade naval da Vila Candelápria deve ser distinguida entre fluvial e marítima, respeitando a posição real.',
         'Conectar o porto e as oficinas ao circuito de Grenolk/Ros Leones e ao Mar de Nur. Não presumir participação obrigatória no Pacto dos Portos Livres.'),
    49: ('Federação marítima, construção naval, invenções, instrumentos e pesquisa experimental.',
         'Loueixo deve ser um dos principais estaleiros humanos. Panhadaril mantém pesquisa e instrumentos/vidro, com importação de insumos. Ilhas sem sítios rurais não precisam receber cidades novas; pesca e abastecimento marítimo podem suprir as habitadas.',
         'Dar à navegação interinsular regularidade e à rota do Poente comboios voluntários. Não acrescentar dirigíveis ou monopólio político sobre todos os parceiros.'),
}

CITY_ACTIONS = {
    3: 'Separar construção lacustre de navios marítimos; manter abastecimento, artesanato e administração.',
    4: 'Manter 120 cargas de grãos/mês e fortalecer moagem/conservação e seus vínculos rurais.',
    5: 'Pesquisa, livros, tinta e instrumentos; retirar criação de gado do perfil principal da escola.',
    10: 'Reforçar forja anã e ferramentas; clãs não devem ser apenas descrição sem reflexo econômico.',
    12: 'Provisões, couro, arreios e comércio de caravanas; joias podem permanecer como atividade secundária.',
    18: 'Pesca/conservas, cordas e reparos navais; retomar a ligação com Gugacon/Sarandir.',
    23: 'Manter ossos de dragão e suas armas; indústria rara, não extração ilimitada.',
    33: 'Manter 3 lotes de Lavanthir e 2 conjuntos de armas como ponto de partida; não duplicar a origem.',
    10002: 'Perfil portuário hoje vazio: propor pesca/conservas, reparos e renda de docas/comércio.',
    10001: 'Abastecimento naval e ligação com Ereth; preservar o perfil alto-élfico.',
    120: 'Reduzir o protagonismo da artilharia; provisões, ferramentas e atividades lacustres adequadas ao lugar.',
    2003: 'Manter zero habitantes e nenhuma produção, conforme a catástrofe já definida.',
    7: 'Centro imperial diversificado; abastecimento, livros, administração e manufatura; rever escala antes de cortar capacidade.',
    1239: 'Armas/equipamento e oficinas de uma marca marcial; não apenas velas e couro.',
    1240: 'Forjas menores, equipamento, couro e suprimentos; importações por passagens montanhosas.',
    1244: 'Priorizar a agricultura da província e processamento/mercado local; não concentrar todos os lavradores na cidade.',
    191: 'Transporte do lago, hospedagem e torneios; gemas não precisam ser sua atividade principal.',
    2000: 'Pesquisa arcana, manuscritos e insumos acadêmicos; manter abastecimento regional.',
    2001: 'Manter ferramentas/armas e nenhum alimento local; abastecimento externo e natureza da população preservados.',
    2002: 'Armazéns, docas, reparos e redistribuição do Mar de Nur/Levante.',
    1: 'Grande estaleiro e centro mercantil/arcano; separar navios novos de manutenção da frota.',
    61: 'Reparos, provisões marítimas e redistribuição do mercado de Allanan.',
    189: 'Pesquisa e livros ligados ao centro religioso/arcano; armas como complemento, não identidade dominante.',
    4002: 'Pesquisa e saberes antigos; não inventar produção em massa de artefatos sombrios.',
    22: 'Reforçar armas, pólvora e artilharia do núcleo imperial, com insumos reais.',
    136: 'Oficinas militares e apoio logístico; suprir salitre, carvão e metais.',
    142: 'Polo naval do império: propor estaleiro, reparos, cordas e provisões.',
    132: 'Captivos vinculados a eventos de conquista, não extração mensal espontânea de pessoas.',
    238: 'Ampliar forja especializada sem retirar a autonomia das outras cidades anãs.',
    127: 'Manter extração mineral e ferramentas; substituir parte de armas genéricas por forja anã.',
    92: 'Oficinas de forja anã apoiadas em ferro/cobre e carvão.',
    9: 'Reorientar de artilharia para logística de caravanas, camelos, couro e provisões.',
    214: 'Rever prata e moedas; dar espaço a peregrinação, intermediação, caça/couro e alimentos locais.',
    6: 'Equipamento de aventura, provisões e contratos das guildas; não só mel, armas e carvão.',
    184: 'Manter o ouro definido pelo autor; extração e apoio logístico, sem deslocá-lo de volta a Liotorn.',
    4000: 'Manter prata, ferramentas e forja anã; preservar a decisão de não ser a principal origem do ouro.',
    4003: 'Separar pesquisa/livros do perfil de cobre/armas herdado de Fovium.',
    170: 'Retirar fabricação automática de artilharia; diferenciar comércio/forja e armamento adquirido.',
    169: 'Rever artilharia e cunhagem; produtos locais e comércio do clã.',
    56: 'Reforçar atividade naval, alimentos e hospitalidade; ligação mercantil com Loueixo.',
    89: 'Rever predomínio bélico e ausência de agricultura rural no condado.',
    223: 'Pesca, reparos, intermediação e rede clandestina; não fazer de Crild todo Goblinburgo.',
    129: 'Livros, assistência, provisões e hospedagem; defesa como atividade complementar.',
    130: 'Livros e atividade civil; sem recolocar a escola de Aleravum em Gannas.',
    140: 'Cavalos, arreios, couro e feira sazonal; retirar velas como especialização principal.',
    179: 'Equipamento de caravana/rebanhos e processamento de alimentos; distinguir assentamento e horda itinerante.',
    143: 'Rebanhos, couro, arreios e provisões; vidro só com infraestrutura/insumos justificados.',
    36: 'Forja, ferramentas, equipamento e comércio; minérios importados em vez de minas presumidas.',
    45: 'Porto de acesso a Grenolk: armazéns, reparos e provisões marítimas.',
    30: 'Polo mercantil/portuário; docas, pesca/conservas e reparos, não apenas armas e couro.',
    14: 'Cidade perdida: sem população conhecida nem comércio regular; situação real mantida como mistério.',
    25: 'Manter população civil e apoio à Patrulha; reduzir fabricação de artilharia.',
    168: 'Pesquisa dos mistérios do Norte; retirar artilharia como especialização da escola.',
    29: 'Fortalecer mineração e forja anã no território conhecido.',
    19: 'Oficinas, provisões e defesa da Tríplice Élfica; cunhagem não precisa ser o produto principal.',
    31: 'Manter núcleo humano; não o recolocar na Tríplice Élfica nem inventar uma vocação rural obrigatória.',
    13: 'Cavalaria, equipamento e atividade civil; confirmar se embarcações são fluviais/lacustres.',
    159: 'Artesanato e abastecimento; manter vidro se houver insumos, rever artilharia genérica.',
    242: 'Porto de apoio: reparos, provisões e renda de docas; cunhagem/argila não expressam seu papel.',
    224: 'Reforçar estaleiros e instrumentos de navegação; papel central na federação e no Pacto.',
    226: 'Pesquisa experimental e instrumentos; relação com Pyrenor sem subordinação institucional.',
}

def num(n):
    return f'{n:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.').removesuffix(',00')


def table(headers, rows):
    esc = lambda v: str(v).replace('|', '\\|').replace('\n', ' ')
    return ['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join('---' for _ in headers) + ' |'] + ['| ' + ' | '.join(esc(v) for v in row) + ' |' for row in rows] + ['']


lines = ['# Proposta de revisão de populações, produção e comércio de Silvengard', '',
         '**9 de novembro de 2026 — proposta para avaliação.** Somente as mudanças de mercados solicitadas foram aplicadas. As populações, capacidades de produção, estradas, rotas marítimas e regras de simulação abaixo continuam como estavam no aplicativo.', '',
         '## O que já foi aplicado', '',
         'Nythan → Allanan; Arenor → Ros Leones; Fovium, Odusonsium e Lakenford → Alqa. O Norte Desconhecido fica fora de todos os mercados. As outras transferências anteriores permanecem.', '',
         '## Minha recomendação principal', '',
         'Eu corrigiria primeiro os lugares cuja atividade contradiz a história e os mecanismos que tornam o comércio artificial. Depois ajustaria os centros urbanos pequenos que têm grande importância narrativa. Não reduziria toda a população por uma regra única, nem faria toda sede de mercado virar a maior cidade da região.', '',
         'A população atribuída aos 152 marcadores soma **5.000.417**. Isso não é um censo completo do continente: há população rural mal representada e, em Marshell, alguns números podem representar comunidades itinerantes. Elucitor, Velaffeld e Asgorath somam **2.307.000**, cerca de **46,1%** do total cadastrado. Essa concentração pode ser uma escolha de fantasia; exige uma logística de abastecimento correspondente.', '',
         'A revisão considera as histórias dos três arquivos, os 19 estados/regiões, as 67 províncias, as 152 localidades, os 77 bens e os 157 traçados. Os anexos registram todas as localidades e províncias; o levantamento completo das rotas também está em `revisao-historia-economia-dados.json`.', '',
         '## 1. Inconsistências que eu corrigiria primeiro', '']
lines += table(['Prioridade', 'Situação atual verificada', 'O que eu mudaria'], [
    ('Alta', 'Gugacon de Vitravion: 3.460 habitantes e cunhagem, apesar de ser a cidade perdida da história.', 'Retirar do censo e do comércio conhecidos. Exibir população desconhecida e nenhuma atividade regular confirmada; isso não afirma que a cidade real esteja vazia.'),
    ('Alta', 'Porto Sarandir: 22.043 habitantes e nenhuma produção cadastrada.', 'Representar pesca/provisões/reparos e renda portuária. Zero bens não significa que um porto não tenha economia; faltam serviços no modelo.'),
    ('Alta', 'Asgorath produz até 18 navios/mês; Vila Candelápria, 2. A referência atual tem um único bem chamado Navios.', 'Separar embarcações fluviais/lacustres dos navios marítimos e localizar cada estaleiro no corpo de água correto.'),
    ('Alta', 'Na simulação de diagnóstico, 17,85 navios de Asgorath chegam a Velaffeld por um percurso com 1.129 km de estrada; outros 1,93 partem da Vila Candelápria por um percurso com trecho terrestre.', 'Proibir transporte terrestre de navios completos. Entrega naval deve respeitar água navegável; peças desmontadas seriam outro produto.'),
    ('Alta', 'Navios também entram no consumo mensal genérico de bens militares.', 'Tratar navios como frota durável: aquisição, manutenção, reparos e perdas, em vez de consumo integral periódico.'),
    ('Alta', '17 dos 157 traçados têm menos de duas localidades reconhecidas pelo cálculo comercial.', 'Reparar ancoragens e escalas, atualizar nomes e distinguir ramais internos de ligações entre cidades. Não apagar caminhos de exploração apenas por não terem fluxo.'),
    ('Alta', 'Pyrenor fabrica 2 unidades de artilharia; Ginar, 4; Kyon, 4; Alqa, 4.', 'Priorizar pesquisa em Pyrenor, apoio à Patrulha em Kyon e produtos de caravanas/clãs nos demais. Concentrar a produção regular de pólvora/artilharia onde o lore e os insumos sustentam essa tecnologia, sobretudo Drácon.'),
    ('Alta', 'O recorte de diagnóstico deixa 254,24 pontos abstratos de demanda alimentar sem atendimento.', 'Priorizar abastecimento, acesso e orçamento antes de simplesmente multiplicar toda a produção. Pontos de demanda não equivalem diretamente a pessoas ou toneladas.'),
    ('Média', 'Khegosla produz 5 unidades de prata e 3 de moedas; Tog Iret tem velas como principal produto.', 'Reorientar a primeira para peregrinação e redes khajitt; a segunda para cavalos, rebanhos, arreios, couro e encontros sazonais.'),
    ('Média', 'Husaj tem 12 elefantes/mês em produção rural; o Baronato de Guernica, 8.', 'Não consolidar elefantes como especialização nativa sem a definição narrativa correspondente. Importação, comércio ou um futuro projeto militar são coisas diferentes.'),
])
lines += ['## 2. Populações: ajustes pontuais, sem trocar cultura, religião ou brasões', '',
          'Os números propostos são escolhas de desenho do cenário, não censos encontrados nas histórias. Quando eu proponho mudar habitantes, não estou propondo mover cidades nem trocar seus outros atributos. A população se refere ao conjunto da localidade civil, não apenas à guarnição ou aos estudantes.', '']
lines += table(['Localidade', 'Atual', 'Proposta', 'Motivo'], [(CITY[i]['name'], num(CITY[i]['population']), num(target), reason) for i, (target, reason) in TARGETS.items()])
lines += ['### Casos que eu preservaria ou trataria separadamente', '',
          '- **Nilhelm:** manter 0, pela catástrofe já definida. **Gugacon de Dragonfall:** manter 4.200 como ponto de partida, sem desfazer a troca de população que você pediu. **Winterhelm e Rinnton:** preservar a relação atual de 51.874 e 25.078.',
          '- **Gugacon de Vitravion:** população real desconhecida; retirar os 3.460 do total conhecido sem decidir quem vive lá. A ilha de Dragonfall e a cidade perdida não são o mesmo lugar.',
          '- **Gugacon/Porto Sarandir:** podem ser dois núcleos distintos da mesma ilha. É preciso evitar contar a população da ilha inteira no marcador Gugacon e depois somar o porto novamente. Não reduziria Sarandir automaticamente só por ser um porto recente.',
          '- **Kyon:** manter 27.786 é defensável, porque o lore confirma uma população civil além da Patrulha. Não o reduziria a um quartel de poucos soldados.',
          '- **Khegosla:** os 12.534 residentes podem permanecer; peregrinos e viajantes precisam de um contador sazonal separado, e não de um aumento permanente arbitrário.',
          '- **Elucitor/Velaffeld/Asgorath:** numa versão mais compacta, eu testaria 300.000 / 250.000 / 150.000. Isso sozinho retiraria 1.607.000 do total cadastrado. Não recomendo aplicar essa redução antes de decidir a escala populacional do mundo; também é válido manter as metrópoles e fortalecer sua infraestrutura alimentar, sanitária e logística.', '',
          '### Marshell: residentes e hordas não são a mesma contagem', '',
          'Eu criaria residentes, população itinerante vinculada e visitantes temporários. Só depois consideraria os valores permanentes abaixo. Sem esse segundo cadastro, manteria os números atuais para não fazer pessoas desaparecerem da economia.', '']
lines += table(['Assentamento', 'Número atual', 'Residentes de referência, condicionais'], [(CITY[i]['name'], num(CITY[i]['population']), num(n)) for i, n in NOMAD.items()])
lines += ['Esses valores somam 25.500 residentes. A diferença para os 124.832 atuais de Marshell precisa continuar representada em comunidades itinerantes, com consumo, rebanhos e circulação; não é uma proposta de extinção dessa população.', '',
          '## 3. Produção e comércio: revisão de todos os estados/regiões', '']
for state in DATA['states']:
    role, production, trade = STATE_PLANS[state['id']]
    lines += ['### ' + state['name'], '', '**População cadastrada:** ' + num(state['population']) + '.', '',
              '**Papel econômico:** ' + role, '', '**Produção que eu ajustaria:** ' + production, '', '**Comércio e rotas:** ' + trade, '']

lines += ['## 4. Quantidades iniciais que eu testaria', '',
          'São pontos de partida de capacidade mensal, sujeitos à unidade física e à disponibilidade de insumos. Em muitos casos a proposta é substituir capacidade genérica, não somar fábricas novas à mesma mão de obra.', '']
lines += table(['Núcleo', 'Referência atual', 'Teste sugerido'], [
    ('Rivertown', '120 cargas de grãos/mês na cidade', 'Preservar. Relacionar com o entorno agrícola sem contabilizar a mesma safra duas vezes.'),
    ('Campinas/Condado de Alia', '60 cargas de grãos/mês rurais', 'Testar 120–180, se a área cultivável e a unidade da carga sustentarem esse volume.'),
    ('Fovium / Liotorn', '4 lingotes de ouro / 0,8 de prata por mês', 'Preservar a distribuição decidida pelo autor.'),
    ('Winterhelm / Gugacon de Dragonfall', '6 lotes de ossos / 3 de Lavanthir por mês', 'Preservar inicialmente; raridade, reservas e oficinas limitam expansão.'),
    ('Porto Sarandir', 'Sem produção', 'Testar 4 cargas de peixe, 2 lotes de conservas e 1 de cordas; acrescentar renda de docas com pagadores identificados.'),
    ('Grenolk', '1 unidade de armas e 1 de carvão, entre outros', 'Testar 3–4 conjuntos de equipamento/forja e 3 de ferramentas, com minério importado e insumos de combustível.'),
    ('Sete Cidades', 'Forja anã especial concentrada em 0,5 conjunto/mês em Adush', 'Redistribuir 8–12 conjuntos/mês entre os sete salões, substituindo parte das armas genéricas e preservando o balanço de metal.'),
    ('Urlyzaak', 'Sem construção naval registrada', 'Testar estaleiro de 3–6 navios marítimos/mês, com madeira, cordas, tecido/velas e trabalho especializado.'),
    ('Porto das Cinzas / Porto do Álamo / Viras', 'Não têm estaleiros correspondentes ao seu papel no perfil atual', 'Testar 1–3 navios/mês onde houver docas e suprimentos; reparos podem ser mais importantes que cascos novos.'),
    ('Velaffeld / Loueixo', '36 / 6 navios por mês de capacidade', 'Depois de definir o que é um navio, testar 12–18 / 8–12 cascos marítimos equivalentes; não impor essa escala antes da revisão de unidades.'),
    ('Sete escolas arcanas', 'Pesquisa arcana já existe; capacidade varia com população e insumos', 'Manter as sete e diferenciar a especialização no texto. Primeiro assegurar papel/tinta, contratos e transporte, antes de ampliar números.'),
])

lines += ['## 5. O que eu mudaria nas rotas comerciais', '',
          'Manteria as estradas locais como ligações. Somente os grandes corredores precisam de nome de rota principal. Um trecho sem negócios neste mês não é necessariamente inútil: guerra, orçamento, bloqueio ou sazonalidade podem explicar isso.', '',
          '### Corredores principais existentes', '']
ROUTE_ACTIONS = {
    'corridor-snow': 'Preservar; abastecer norte, escola e porto. Diferenciar necessidades civis, Patrulha/fortificações e exportação rara.',
    'corridor-imperial': 'Preservar; verificar escalas, postos e abastecimento. Não confundir uma rota contínua com cada pequeno ramal.',
    'corridor-flowers': 'Preservar; revisar continuidade entre cidades após movimentos dos marcadores; incluir o acesso ao eixo Ros Leones sem alterar Arenor por inferência.',
    'corridor-rimae': 'Preservar; fluxo militar e civil, com acesso controlado à fronteira morta de Adhuc.',
    'corridor-ports': 'Preservar; a história distingue o centro humano, os portos e a Tríplice Élfica. O nome não torna todas as escalas cidades portuárias.',
    'sea-trunk-west': 'Separar tronco civil dos ramais que efetivamente atracam em Drácon; o Pacto é uma rede de cooperação voluntária.',
    'sea-trunk-nur': 'Preservar tronco; distinguir escalas legais, ramais de Crild e risco clandestino/pirata.',
    'sea-trunk-north': 'Rever escalas obrigatórias e operação sazonal. O percurso atual é longo: não tratar oito horas/dia de viagem a pé como escala obrigatória de uma tripulação em turnos.',
    'sea-trunk-east': 'Preservar; fortalecer a escala Allanan–Sahtalys, sem criar passagem terrestre para navios completos.',
    'economy-sea-224-225': 'Manter como ramal interinsular, sem o mesmo destaque de um grande corredor continental.',
    'economy-sea-142-233': 'Manter como ramal imperial local, não como rota principal independente obrigatória.',
}
lines += table(['Rota', 'Distância atual', 'Ação proposta'], [(r['name'], num(r['km']) + ' km', ROUTE_ACTIONS.get(r['id'], 'Revisar função e escalas.')) for r in DATA['routes'] if r['major']])
lines += ['### Ligações que eu consolidaria como eixos de abastecimento', '',
          '- **Caravanas de Amestris:** Alqa ↔ Savhalla ↔ Mestrina, com ramais para Fovium/Odusonsium, Aleravum/Anteventium e Sete Cidades. Aproveitar os traçados existentes antes de desenhar uma estrada nova.',
          '- **Metais e forjas:** salões das Sete Cidades ↔ Khegosla/Alqa ↔ Grenolk, com ligação portuária por Almirarem. Isso não cria livre comércio automático entre inimigos.',
          '- **Abastecimento do norte de Dragonfall:** Rivertown/entorno fértil ↔ Asgorath ↔ Winterhelm/Dagorah/Lakenford, além de embarque para Cinzas/Sarandir/Gugacon.',
          '- **Academias:** papel, tinta, livros e contratos entre os sete centros; Panhadaril–Pyrenor tem fundamento narrativo especialmente claro. Não inventar uma universidade central que governe todos.',
          '- **Cavalos e arreios:** encontros de Marshell ↔ Grenolk/Reinos Médios/Osmorn. Comercializar excedente de rebanhos sem tornar todos os grupos uma administração única.',
          '- **Portos Livres:** Loueixo, Viras e Porto do Álamo como referências da cooperação, com escalas e adesões específicas. Não incluir Osmorn automaticamente num pacto militar.', '',
          '### Os 17 traçados com menos de duas escalas reconhecidas', '',
          'Eles foram identificados pelo mesmo cálculo geométrico usado no comércio. Eu corrigiria ou reclassificaria cada um antes de acrescentar mais ligações; o nome da estrada não prova que seus pontos ainda alcançam as cidades.', '']
lines += table(['Traçado', 'Distância', 'Escalas reconhecidas', 'Proposta'], [(r['name'] + ' (`' + r['id'] + '`)', num(r['km']) + ' km', ', '.join(CITY[i]['name'] for i in r['stops']) or 'Nenhuma', 'Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial.') for r in DATA['routes'] if len(r['stops']) < 2])
lines += [f"No recorte mensal, **{sum(r['flow'] == 0 for r in DATA['routes'])} traçados não tiveram fluxo**. Esse número é diferente dos 17 casos acima: ausência de negócios não demonstra erro de geometria.", '',
          '## 6. Ajustes no funcionamento da economia que eu faria junto', '',
          '1. **Unidades antes de realismo numérico.** Hoje grãos são cargas, animais são cabeças e pesquisa é um tratado. Definir peso/cobertura alimentar e escala de oficinas antes de comparar essas unidades com milhões de habitantes. Não afirmo que 1.413 cargas de grãos alimentem ou não cinco milhões sem essa definição.',
          '2. **Residentes, população rural e visitantes.** A demanda rural atual depende de sítios produtivos, não de um censo rural provincial. Restaurar essa população na contabilidade, sem somar cegamente os totais rurais antigos do `.map` às fronteiras modificadas.',
          '3. **Bens duráveis.** Navios, artilharia, equipamento e capital instalado precisam de estoque e manutenção. Não são todos consumíveis mensais equivalentes a comida.',
          '4. **Produção rural em províncias divididas.** Hoje o conjunto rural de uma província acompanha o hub urbano mais populoso. Eu atribuiria cada sítio produtivo ao mercado de sua posição, agregando depois por província. Assim uma área pintada como Ros Leones não fica contabilizada em outro mercado só porque a capital provincial é maior.',
          '5. **Oferta realmente acessível.** A escassez não deveria usar produção de um participante inimigo como oferta disponível a quem não pode negociar com ele. Manter o mercado regional, mas calcular acesso por comprador, rota, embargo e guerra.',
          '6. **Hostilidade e guerra ativa.** O código trata `Enemy` como guerra, enquanto algumas fichas importadas o chamam de inimizade. Separar os dois conceitos. Dragonfall–Elucitor continua neutra; Navï Velaffëll pode impor restrições seletivas, em vez de um bloqueio absoluto presumido. Drácon e seus adversários precisam de decisões coerentes com as campanhas narradas.',
          '7. **Escalas explícitas.** Uma cidade perto do desenho da linha não deve virar automaticamente uma atracação obrigatória. Isso é especialmente relevante na rota do Poente e em portos inimigos.',
          '8. **Tempo de transporte.** Manter o panorama atual, mas nos ciclos avançados registrar cargas em trânsito e chegada. A distância hoje limita o caminho e altera o custo, mas a compra acessível já entra no estoque no mesmo ciclo. Separar as horas de marcha dos viajantes das jornadas de uma tripulação ou de uma caravana com revezamento.',
          '9. **Serviços e renda.** Portos, templos e guildas podem ser importantes sem extrair minério. Taxas de doca, frete, assistência e contratos precisam de pagadores e destinatários; não de dinheiro criado gratuitamente. O frete atual é contabilizado no preço pago ao vendedor; uma camada de transportadores/portos permitiria distribuir essa receita.',
          '10. **Cunhagem e população cativa.** Cunhar moeda não deve duplicar ouro/numerário; capturar pessoas não deve criar habitantes do nada. Tratar conversões e eventos com balanços próprios.',
          '11. **Alimentação e investimento.** O consumo mensal vem depois da fabricação; eu criaria uma política explícita de abastecimento mínimo e distribuição, para a ordem dos nós não decidir sozinha quem compra primeiro. Não esconder o desabastecimento apenas aumentando todas as safras.',
          '12. **Dinâmica local.** Condições de monstros em Veniun, expedições de Kyon, encontros de Marshell, peregrinações e comboios do Pacto podem alterar demanda, atraso e segurança. Não mudar o ritmo normal das estradas mantidas que já foi combinado para as jornadas.', '',
          '## 7. Ordem em que eu implementaria, se você aprovar', '',
          '1. Corrigir Gugacon perdida, Porto Sarandir, os 17 enlaces e o transporte/consumo de navios.',
          '2. Especializar produtores e remover as cópias mais destoantes: Pyrenor/Aleravum/Torre, Tog Iret, Khegosla, Alqa e as forjas/estaleiros conhecidos.',
          '3. Ajustar os centros menores da tabela de população; manter as grandes metrópoles até decidir a escala geral.',
          '4. Repartir produção rural por mercado e melhorar demanda/acesso, orçamento de serviços e tempo de entrega.',
          '5. Só depois introduzir sazonalidade, esgotamento de reservas raras, guerras locais e contratos de grande porte.', '',
          '## Anexo A — revisão individual das 152 localidades', '',
          '“Manter” significa ausência de uma mudança demográfica proposta nesta revisão; não significa que o lugar perdeu sua história. Os bens são os principais por valor na capacidade cadastrada, não toda a produção nem a renda comercial.', '']
proposal = []
for state in DATA['states']:
    lines += ['### ' + state['name'], '']
    rows = []
    for b in sorted((CITY[i] for i in state['cities']), key=lambda b: b['name']):
        if b['id'] == 14:
            target = 'Desconhecida; fora do censo regular'
            numeric = None
        elif b['id'] in TARGETS:
            numeric = TARGETS[b['id']][0]
            target = num(numeric)
        elif b['id'] in COMPACT:
            numeric = b['population']
            target = 'Manter; cenário compacto opcional: ' + num(COMPACT[b['id']])
        elif b['id'] in NOMAD:
            numeric = b['population']
            target = 'Manter até separar itinerantes; residentes condicionais: ' + num(NOMAD[b['id']])
        else:
            numeric = b['population']
            target = 'Manter'
        action = CITY_ACTIONS.get(b['id'], 'Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova.')
        goods = ', '.join(g['name'] + ' ' + num(g['units']) for g in b['capacity'][:3]) or 'Sem bens cadastrados'
        rows.append((b['name'], num(b['population']), target, b.get('market') or 'Sem mercado', goods, action))
        proposal.append(dict(city=b['id'], name=b['name'], currentPopulation=b['population'], proposedPopulation=numeric, populationApplied=False, productionProposal=action))
    lines += table(['Localidade', 'População atual', 'Proposta de população', 'Mercado atualizado', 'Capacidade atual: destaques / 30 dias', 'Produção/atividade proposta'], rows)

lines += ['## Anexo B — as 67 províncias e seus recursos rurais', '',
          'A linha mostra a produção rural separada das oficinas urbanas. Falta de bens não autoriza inventar população em ilhas sem história de ocupação.', '']
province_rows = []
for p in DATA['provinces']:
    if p['state'] == 17 or 'Adhuc Vivere' in p['name']:
        action = 'Manter sem produção rural; não criar alimentos nas terras mortas.'
    elif p['name'] == 'Condado de Alia':
        action = 'Reforçar a vocação agrícola e a oferta para os grandes núcleos; calibrar a unidade da carga.'
    elif p['name'] == 'Emirado de Alqa':
        action = 'Rever elefantes e cereal fora de áreas irrigáveis; priorizar deserto/caravanas.'
    elif p['name'] == 'Baronato de Guernica':
        action = 'Rever elefantes e adequar cultivo/pastoreio à zona árida; manter Guernica humana.'
    elif p['name'] == 'Salão de Grenolk':
        action = 'Florestas, combustível, agricultura local e oficinas; não presumir grandes jazidas montanhosas.'
    elif p['name'] == 'Condado de Sobrirosen':
        action = 'Investigar agricultura rural ausente no entorno de um núcleo populoso de um estado agrário/mercantil.'
    elif not p['rural']:
        action = 'Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção.'
    else:
        action = 'Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida.'
    province_rows.append((p['name'], next(s['name'] for s in DATA['states'] if s['id'] == p['state']), num(p['population']), '; '.join(g['name'] + ' ' + num(g['units']) for g in p['rural'][:5]) or 'Sem produção rural', action))
lines += table(['Província', 'Estado/região', 'População dos marcadores', 'Rural atual: destaques / 30 dias', 'Revisão proposta'], province_rows)
lines += ['## Conferência de números e limites da proposta', '',
          f"- Recorte: 30 dias de diagnóstico, sem salvar ou avançar o calendário. Produção realizada estimada: {num(DATA['summary']['productionValue'])} PO a preços-base; comércio: {num(DATA['tradeValue'])} PO.",
          '- Os valores de passagem pelas rotas não devem ser somados como se fossem comércio mundial novo: uma mesma compra pode passar por vários traçados.',
          '- Valores monetários não são lucro, PIB completo, população total ou toneladas sem uma definição adicional de unidades e serviços.',
          '- As cinco alterações de mercado e a exclusão do Norte foram aplicadas. Nenhuma sugestão de população, produto, quantidade, diplomacia, rota ou regra econômica deste documento foi aplicada.', '']
(BASE / 'Proposta-Revisao-Populacoes-Producao-Comercio.md').write_text('\n'.join(lines), encoding='utf-8')
(BASE / 'revisao-historia-economia-proposta.json').write_text(json.dumps(dict(status='proposal-only', date='2026-11-09', applied=False, cities=proposal), ensure_ascii=False, indent=2), encoding='utf-8')
print('Proposta escrita:', len(proposal), 'localidades;', len(DATA['provinces']), 'províncias;', len(DATA['routes']), 'rotas auditadas. Nenhuma edição do Atlas aplicada por este gerador.')
