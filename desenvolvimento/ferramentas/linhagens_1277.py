"""Linhagens, casas e sucessões de Silvengard em 1277 AQD.

Cada verbete traz uma pequena árvore no formato lido por history_archive.py:

    casa: Casa Dragonbane
    sede: Asgorath
    tipo: Casa real eletiva
    nota: Texto de abertura (opcional)
    - Nome | papel | período | observação | par=Consorte
      - Filho | herdeiro | n. 1264

Os campos depois do nome são opcionais. A linha ``par=`` indica o consorte
exibido ao lado do titular. Um nó com o nome ``⋯`` representa uma lacuna de
gerações que as crônicas não registram por inteiro.
"""

LINEAGES = {
    'Dragonfall': [
        dict(
            house='Casa Dragonbane', seat='Asgorath', type='Casa real · monarquia eletiva',
            note='A casa mais vezes eleita, sem direito hereditário ao trono. Os ramos abaixo são parentesco, não ordem de sucessão.',
            nodes='''
- Garrick II Dragonbane | rei | 968–997 | Conduziu acordos portuários durante incursões marítimas.
- ⋯ | gerações intermediárias | — | A crônica não registra todos os reinados entre os dois Garrick.
- Garrick III Dragonbane | rei | 1224–1249 | Morreu no trono durante a Guerra das Relíquias.
  - Berengar Dragonbane | herdeiro | m. 1244 | Morto em campanha.
  - Godric Dragonbane | herdeiro | m. 1247 | Morto em campanha.
  - Edmund Dragonbane | herdeiro | m. 1248 | Morto em campanha.
  - Arthur Dragonbane | rei | 1249–presente | Sucessão emergencial; independência em 1262. | par=Elenna Sunhill
    - Alaric Dragonbane | príncipe | n. 1264 | Candidato futuro, sem coroação automática.
    - Mara Dragonbane | princesa | n. 1267 | Candidata futura, sem coroação automática.
'''),
        dict(
            house='Casa Windbear', seat='Winterhelm', type='Casa nobre · corte do norte',
            note='Primeira casa a reinar. Conserva os juramentos e as fortalezas de resistência do norte.',
            nodes='''
- Edran Windbear | senhor de Winterhelm | — | Geração anterior à Guerra das Relíquias.
  - Oswin Windbear | senhor | m. 1260 | Morreu durante a Guerra das Relíquias.
    - Rodrick Windbear | herdeiro | n. c. 1229 · m. 1261 | Morreu no lugar de Arthur.
      - Edda da Neve | reivindicante | n. 1257 | Afirma ser filha de Rodrick; paternidade disputada.
    - Hawen Windbear | chefe da casa | 1277 | Guarda os documentos e juramentos de Winterhelm.
'''),
        dict(
            house='Casa Sunhill', seat='Campos do sul', type='Casa agrícola',
            note='Sustenta exércitos com alimentos e forragens; aliada dos Dragonbane por casamento.',
            nodes='''
- Garran Sunhill | senhor dos celeiros | séc. VII | Viveu no reinado de Garran Dragonbane.
- ⋯ | gerações intermediárias | — | A linhagem chegou ao presente por parentes que a crônica não lista.
- Elenna Sunhill | consorte do rei Arthur | desde 1262 | Aproximou o norte militar e o sul agrícola.
'''),
        dict(
            house='Casa Longrock', seat='Porto das Cinzas', type='Casa mercantil',
            note='Navios, armazéns e prata mercantil; influência maior antes da Queda Infernal de Gugacon.',
            nodes='''
- Godric Longrock | rei | 483–516 | Primeira grande ascensão dos mercadores do antigo Porto do Álamo.
- ⋯ | gerações intermediárias | — | Filhos naturais foram acolhidos em companhias mercantis.
- Marwen Longrock | representante mercantil | 1277 | Principal voz da casa nos cais.
'''),
        dict(
            house='Casa Rodstrock', seat='Dependências de Winterhelm', type='Casa menor',
            note='Estandarte do corvo negro. Não há herdeiro vivo que comprove descender diretamente de Tiberius.',
            nodes='''
- Tiberius Rodstrock | rei, o Corvo Colérico | 558–585 | Desapareceu na Marcha dos Corvos, rumo ao Norte Desconhecido.
- ⋯ | gerações intermediárias | — | Primos que não marcharam fixaram-se como pequenos senhores rurais.
- Rorik Rodstrock | pequeno lorde | 1277 | Descende de um ramo lateral; sem prova de descendência direta.
'''),
        dict(
            house='Casa Drakeshore', seat='Cais de Clifshore', type='Ramo cadete reconhecido',
            note='Nasceu de um filho reconhecido, mas não legitimado para suceder, de Garrick II Dragonbane. Prestígio sem voto automático.',
            nodes='''
- Garrick II Dragonbane | rei | 968–997 | Pai do ramo, segundo a tradição da casa.
  - filho reconhecido, não legitimado | 1012 | Passou a administrar pequenos cais próximos de Clifshore.
    - Casa Drakeshore | ramo cadete | 1277 | Sem voto automático nem direito hereditário à coroa.
'''),
    ],
    'Elucitor': [
        dict(
            house='Casa Lucien', seat='Elucitor', type='Casa imperial hereditária',
            note='Vinte e nove reinados da mesma casa. O sangue não garante capacidade nem sucessão automática: a Voz e o Senado pesam na escolha.',
            nodes='''
- Cassius III Lucien | imperador | 1207–1238 | Início da Guerra das Relíquias (1215). | par=Marcia Lucien
  - Gaius Lucien | herdeiro | n. c. 1190 · m. 1230 | Senhor de Adhuc Vivere; sem descendência legítima sobrevivente.
  - Flavius II Lucien | imperador | 1238–1260 | Concluiu a guerra e assinou o Acordo de Bomaria. | par=Livia Arvend
    - Lucius Lucien IX | imperador | 1260–presente | Recebeu o império durante a guerra civil de Dragonfall. | par=Julia Dalmora
      - Cassius Lucien | primeiro na sucessão | n. 1265 | Ainda aprende os limites da Voz.
      - Tiberia Lucien | estudiosa da Voz | n. 1268 | Facilidade incomum para o tom imperativo.
      - Aurelian Lucien | príncipe | n. 1274 | Criança em 1277.
    - Octavia Lucien | irmã do imperador | n. c. 1233 | Supervisiona parte do patrimônio ritual.
  - Severina Lucien | tia da geração de Lucius IX | — | Linha extinta sem herdeiros.
'''),
        dict(
            house='Casas senatoriais', seat='Elucitor e as marcas', type='Aristocracia imperial',
            note='A legitimidade repousa na Voz, mas a aristocracia conserva dons próprios. Nenhuma casa transmite automaticamente sua técnica a todos os membros.',
            nodes='''
- Casa Karnenhall | Chama de Althor | Althor | Lorde Tytos Karnenhall
- Casa Vardemont | Senhorio do Inverno | Arenor | Lorde Corvin Vardemont
- Casa Dravenholt | Sangue da Tempestade | Castamor | Lorde Severin Dravenholt
- Casa Ignivar | Coração da Forja | Ignis | Lorde Aulus Ignivar
- Casa Nostrean | Última Vigília | Nostris | Dama Verena Nostrean
- Casa Vostran | Olho Velado | Vostris | Lorde Decimus Vostran
- Casa Bombastus | Ímpeto de Bronze | Elucitor | Sextus Bombastus, senador
- Casa Arvend | Mão da Corrente | Althor e capital | Flavia Arvend, magistrada
- Casa Venoria | Véu de Espuma | Vennoduro | Titus Venoria
- Casa Dalmora | Memória dos Selos | Elucitor | Publius Dalmora, jurista
- Casa Seronius | Pulso de Vida | Elucitor | Livia Seronia
- Casa Talaris | Mãos de Vidro | Elucitor | Quintus Talaris
'''),
        dict(
            house='Casa Dravenholt', seat='Castamor', type='Nobreza das marcas · antigos Reis Bruxos',
            note='Descendentes dos Reis Bruxos de Castamor, hoje nobreza imperial e devota de Mátilla.',
            nodes='''
- Maelor Dravenholt | último Rei Bruxo | m. 248–253 | Recusou reconhecer Lucius I; perdeu a coroa nas Guerras das Sete Tormentas.
- ⋯ | gerações intermediárias | — | A família conservou terras como nobreza subordinada.
- Othmar Dravenholt | senhor de Castamor | m. 1273 | Morreu numa caçada nas montanhas.
- Severin Dravenholt | senhor de Castamor | 1273–presente | Ex-paladino da Ordem do Lírio da Aurora.
  - Sabina Dravenholt | tia e administradora | 1277 | Conhece a política dos vales.
    - Marius Dravenholt | primo | 1277 | Cuida de estradas e comunicações.
'''),
    ],
    'Navï Velaffëll': [
        dict(
            house='Casa Aelvaris', seat='Velaffeld', type='Casa imperial élfica',
            note='Cinco grandes reinados em quase nove séculos. Vaelith e Aelion não recebem principados cadetes.',
            nodes='''
- Aelion Aelvaris I | primeiro imperador da linhagem | c. 417–610 | Incorporou Garnalos e confrontou Elucitor nas Folhas e nos Marcos.
  - Saelanar Aelvaris I | imperador | 610–788 | Construiu a burocracia marítima do império.
    - Elyndra Aelvaris I | imperatriz | 788–963 | Enfrentou Dragonfall nas Pontes de Ereth.
      - Thalendir Aelvaris I | imperador | 963–1151 | Governou durante as Noites de Rimae.
        - Elyndra Aelvaris II | imperatriz | 1151–presente | Governa após a derrota da intervenção de 1262.
          - Vaelith Aelvaris | filha | 1277 | Vive na corte de Velaffeld.
          - Aelion Aelvaris | filho mais novo | 1277 | Atua junto aos estudiosos.
        - Itharion Aelvaris | irmão da imperatriz | 1277 | Não reivindica a coroa.
'''),
    ],
    'Veniun': [
        dict(
            house='Casa Valdren', seat='Anteventium', type='Dinastia real',
            note='A coroa é hereditária, mas os municípios conservam magistrados e forças próprias.',
            nodes='''
- Helena II Valdren | rainha | 1185–1221 | Acordos de defesa das minas e passagem de alunos de Aleravum.
  - Conrad III Valdren | rei | 1221–1252 | Neutralidade prudente na Guerra das Relíquias.
    - Aldric III Valdren | rei | 1252–presente | Reforço das guildas e dos jogos anuais.
      - Eleonora Valdren | filha reconhecida | n. 1246 |
      - Leopold Valdren | filho reconhecido | n. 1251 |
    - Raoul de Vathnis | parente reconhecido | 1277 | Filho fora do casamento; sem título sucessório.
'''),
        dict(
            house='Valdren de Fovium', seat='Fovium', type='Ramo lateral',
            note='Prestígio local e serviço à coroa, sem direito dinástico sobre a cidade.',
            nodes='''
- Ulrich II Valdren | rei | 1039–1076 | Consolidou patronos municipais em Fovium.
  - ⋯ | gerações intermediárias | — | Linha lateral de Fovium.
    - Casa Valdren de Fovium | ramo lateral | 1277 | Sem substituir a coroa de Anteventium.
      - Helena de Fovium | magistrada local | 1277 |
      - Theobald de Fovium | capitão de voluntários | 1277 |
'''),
        dict(
            house='Valdren de Odusonsium', seat='Odusonsium', type='Ramo lateral extinto',
            note='Último ramo extinto em 1183; as propriedades voltaram ao patrimônio da coroa, sem alterar os direitos da cidade.',
            nodes='''
- Casa Valdren de Odusonsium | ramo lateral | extinto em 1183 | Descendia de um irmão de Wilhelm II.
'''),
    ],
    'Valar': [
        dict(
            house='Linhagens desaparecidas', seat='Valari (ruínas)', type='Sem genealogia comprovada',
            note='Três nomes sobrevivem em inscrições incompletas. Não há prova de parentesco, sucessão ou casa real contínua.',
            nodes='''
- Caeladren | nome em inscrição | — | Pode ter sido governante, fundador ou autor arcano.
- Iraleth | nome em inscrição | — | Nenhum vínculo demonstrado com Caeladren.
- Saeryn | nome em inscrição | — | Nenhuma sucessão comprovada.
'''),
    ],
    'Drácon': [
        dict(
            house='Casa Varkhazar', seat='Drácon', type='Império hereditário',
            note='A coroa permaneceu na família; tios e irmãos foram herdeiros reconhecidos, não usurpadores.',
            nodes='''
- Varkhan III Varkhazar | imperador | 948–982 | Escândalo do príncipe Brutus.
  - Zarveth II Varkhazar | imperador | 982–1015 | Ocupação de Porto do Álamo (990–1008) e retirada.
    - ⋯ | sucessores imperiais | — | Linha que conduz aos imperadores posteriores.
      - Zarveth III | imperador | 1231–1254 | Organizou arsenais e possessões.
        - Kaerath Varkhazar III | imperador | 1254–presente | Novas jazidas, pólvora e campanhas da Quarta Era.
          - Zaerys Varkhazar | filha | n. 1248 | Comanda relatórios de intendência.
          - Vharion Varkhazar | filho | n. 1255 | Criado sob rigor militar.
  - Brutus Varkhazar | príncipe reformista | desaparecido c. 970 | Fugiu para Vitravion; destino desconhecido.
'''),
        dict(
            house='Varkhazar de Metiscina', seat='Metiscina', type='Ramo provincial',
            note='Prestígio por gerações de serviço, sem segunda coroa.',
            nodes='''
- Casa Varkhazar de Metiscina | descendência de um irmão de Kaerath II | 1277 | Rivaliza por contratos navais e cargos.
  - Rhazgar de Metiscina | comandante provincial | 1277 |
'''),
        dict(
            house='Zarveth de Hethlothloth', seat='Hethlothloth', type='Aristocracia militar',
            note='Terras e honras por serviços militares; não é dinastia soberana.',
            nodes='''
- Casa Zarveth de Hethlothloth | descendência por casamento de uma filha de Vharion I | 1277 | Confunde-se com a alta aristocracia da conquista.
'''),
    ],
    'Vitravion': [
        dict(
            house='Casa Arvem', seat='Guernica', type='Baronato urbano',
            note='O título governa o distrito de Guernica, não o Estado inteiro de Vitravion.',
            nodes='''
- Mauro Arvem | barão de Guernica | 1166–1204 |
  - Orestes Arvem | barão | 1204–1240 |
    - Serina Arvem | baronesa | desde 1240 | Governa entre dívidas e conselheiros.
      - Liora Arvem | filha e possível sucessora | 1277 | Parte das famílias exige juramento da administração local.
    - Renan Arvem | irmão mais novo | m. 1265 | Falecido sem herdeiros legítimos.
  - Darion Arvem | ramo de Oregon | 1277 | Cadete sem direitos sobre Guernica.
'''),
        dict(
            house='Casa Valmora', seat='Porto do Álamo', type='Família de docas',
            note='Prestígio conquistado na retomada de 1008; o porto não é senhorio hereditário da casa.',
            nodes='''
- Irena Valmora | dirigente das docas | 1008 | Coordenou a retomada de Porto do Álamo.
- ⋯ | gerações intermediárias | — | A família permaneceu ligada ao Conselho das Docas.
- Marcos Valmora | chefe do Conselho das Docas | 1230–1268 |
  - Elira Valmora | representante portuária | 1277 | Lidera uma das correntes do conselho.
  - Tomas Valmora | comerciante | 1277 | Atua em Vyoh.
'''),
        dict(
            house='Família Tarian', seat='Vyoh e Porto do Álamo', type='Linhagem naval',
            note='Originária de Vyoh; o ramo do Álamo continua ligado aos acordos defensivos locais.',
            nodes='''
- Tarian de Vyoh | capitão local | 1008 | Mobilizou navios e recursos na retomada.
  - Ramo naval de Porto do Álamo | 1277 | Sem direito de governo sobre o porto.
'''),
    ],
    'Batovia': [
        dict(
            house='Casa Taleris', seat='Loueixo', type='Família de navegadores',
            note='Navegadores e magistrados da ilha principal.',
            nodes='''
- Artan Taleris | líder de frota | c. 1180 |
  - Mera Taleris | magistrada | c. 1220 |
    - Ardessa Taleris | representante de Loueixo | 1277 |
    - Breno Taleris | comerciante | 1277 | Sem mandato.
'''),
        dict(
            house='Casa Osagren', seat='Osagos', type='Construtores de navios',
            note='Estaleiros e ramo comercial em Tarinquer.',
            nodes='''
- Valdo Osagren | mestre de estaleiro | c. 1200 |
  - Emina Osagren | herdeira dos estaleiros | 1277 |
  - Gil Osagren | ramo menor | 1277 | Estabelecido em Tarinquer.
'''),
        dict(
            house='Casa Panhard', seat='Panhadaril', type='Patronos de pesquisa',
            note='Protetores da escola arcana e da Regra dos Dois Selos.',
            nodes='''
- Idela Panhard | protetora da escola arcana | c. 1200 |
  - Theren Panhard | pesquisador e delegado da ilha | 1277 |
'''),
    ],
    'Mountport': [
        dict(
            house='Casa Talverde', seat='Viras', type='Casa mercantil',
            note='Armadores, crédito e seguros. Benedo Talverde é Alto Síndico desde 1273.',
            nodes='''
- Doral Talverde | intendente de armazéns | c. 1170 |
  - Nilo Talverde | magistrado mercantil | c. 1210 |
    - Benedo Talverde | Alto Síndico | 1273–1279 | Mandato negociado de seis anos.
    - Ivara Talverde | administradora de contratos | 1277 |
'''),
        dict(
            house='Casa Serrabroa', seat='Coliras', type='Casa de cereais',
            note='Mercadorias terrestres e ramo em Ridualhos.',
            nodes='''
- Milo Serrabroa | — | c. 1190 |
  - Ena Serrabroa | herdeira comercial de Coliras | 1277 |
  - Tavin Serrabroa | ramo de Ridualhos | 1277 |
'''),
        dict(
            house='Casa Falcois', seat='Vilaguezejo', type='Pilotos e cargas',
            note='A herança principal está reservada à filha legítima; Silvo das Docas foi reconhecido fora do casamento.',
            nodes='''
- Leira Falcois | — | c. 1200 |
  - Rumo Falcois | dirigente de embarcações | 1277 |
    - Pera Falcois | filha legítima | 1277 |
    - Silvo das Docas | filho reconhecido fora do casamento | 1277 | Participa dos negócios, sem a herança principal.
'''),
    ],
    'Osmorn': [
        dict(
            house='Casa Candelar', seat='Vila Candelápria', type='Coroa cavaleiresca',
            note='A Ordem de Bahamut antecede a dinastia e não pertence à casa real.',
            nodes='''
- Roland IV Candelar | rei | 1192–1235 | Fortaleceu as fortalezas antes da expansão draconata.
  - Roland V Candelar | rei | 1235–1251 | Defendeu as zonas rurais contra saques.
    - Maelis Candelar II | rainha | 1251–presente | Vigília das Escamas e resistência a Drácon.
      - Iria Candelar | filha legítima | n. 1249 | Candidata principal à continuidade dinástica.
    - Aveline Candelar | irmã da rainha | 1277 |
      - Percival Candelar | sobrinho, cavaleiro | 1277 | Considerado mais experiente por parte da cavalaria.
    - Tomas de Sobral | filho reconhecido | 1277 | Fora da linha sucessória ordinária.
- Ramo de Alveiras | descendência de uma irmã de Roland III | 1277 | Casa Candelar de Alveiras.
  - Galeran de Alveiras | senhor de propriedades locais | 1277 | Precedência apenas se a linha principal falhar.
'''),
    ],
    'Duräk': [
        dict(
            house='Casa Grunvar', seat='Grenolk', type='Principado hereditário',
            note='Os Grunvar conservam a coroa; o Conselho das Forjas aconselha e negocia, mas não elege o príncipe.',
            nodes='''
- Dorrik III Grunvar | príncipe | 1048–1180 | Consolidou o Conselho das Forjas como órgão consultivo.
  - Gundrik Grunvar I | príncipe | 1180–1253 | Fortaleceu armazéns, pontes e guarnições.
    - Dorrik Grunvar IV | príncipe | 1253–presente | Defende o principado entre comerciantes e invasores.
      - Dagna Grunvar | filha | 1277 | Administra questões de abastecimento.
      - Borin Grunvar | filho | 1277 | Ligado às guarnições.
  - Ormund Grunvar | irmão mais novo | séc. XIII | Fundador do ramo de Brelas.
    - Casa Grunvar de Brelas | ramo cadete | 1277 | Ferreiros e comerciantes.
- Ramo de Bilnulbun | descendência de uma irmã de Thorga I | extinto em 1226 | Sem sucessor reconhecido após uma epidemia de mina.
'''),
    ],
    'Reinos Médios': [
        dict(
            house='Casa Verdam', seat='Vinquertiro', type='Condado',
            note='Administra a fortaleza e tributos locais; não possui direitos sobre Almirarem.',
            nodes='''
- Lauro Verdam | conde | 1175–1207 |
  - Dario Verdam | conde | 1207–1249 |
    - Esteban Verdam | conde | desde 1249 | Envolvido em dívidas e disputas de passagens.
    - Mirela Verdam | — | 1277 | Casada em família mercantil de Almirarem.
    - Nuno de Sanha | filho natural reconhecido | 1277 | Sem o condado.
'''),
    ],
    'Marshell': [
        dict(
            house='Chefias das hordas', seat='Tog Iret e as estepes', type='Lideranças autônomas',
            note='Nenhuma chefia geral e permanente. O prestígio passa a filhos e sobrinhos, mas depende de seguidores, pasto e cavalos.',
            nodes='''
- Erena Bayantog | chefe da Horda Bayantog | antes de 1277 |
  - Saran Bayantog | chefe da Horda Bayantog | 1277 | Escolhido após conduzir rebanhos por uma estação seca.
- Temira Castiala | chefe da Horda Castiala | 1277 | Mediador de disputas matrimoniais e de compensação.
- Borek Teshir | chefe da Horda Teshir | 1277 | Sucessão disputada entre sobrinhos e filhos.
- Karan Tserost | capitão eleito da Horda de Tserost | 1277 | Escolhido depois de incursões orcs.
'''),
    ],
    'Sete Cidades': [
        dict(
            house='Casas das Sete Cidades', seat='Adush e os sete salões', type='Casas e conselhos anões',
            note='Cada cidade responde à própria comunidade. Adush acolhe reuniões, sem impor um rei a todas.',
            nodes='''
- Kharagz | Casa Pedrafundo | 1277 | Capitães das muralhas escolhidos entre linhagens de defensores.
- Khizdush | Casa Zunrek | 1277 | Magistrados das minas e das galerias de passagem.
- Shunzargil | Casa Tharmun | 1277 | Conselho de ancestrais e guardiões dos registros.
- Adush | Mesa dos Sete Salões | 1277 | Reunião de enviados, sem autoridade soberana permanente.
- Shaled | Casa Rukhar | 1277 | Guardas de fronteira e pactos de passagem.
- Allos | Casa Drombar | 1277 | Mestres de forja com assembleias locais.
- Shararukthu | Casa Molgund | 1277 | Magistrados do armazenamento e das obras de pedra.
'''),
    ],
    'Piglia': [],
    'Husaj': [
        dict(
            house='Casa Al Sahr', seat='Alqa', type='Califado',
            note='A legitimidade precisa ser aceita por chefes de caravanas, representantes religiosos e guardas de Alqa.',
            nodes='''
- Yusuf Al Sahr | califa | 1179–1205 | Pactos com caravanas de Savhalla e Mestrina.
  - Nasir Al Sahr | califa | 1205–1236 | Reorganizou guardas e cobranças de Alqa.
    - Abdul Al Sahr | califa | 1236–presente | Equilibra comércio, clero e clãs.
      - Idris Al Sahr | filho reconhecido | 1277 | Atua no governo das caravanas.
      - Samira Al Sahr | filha reconhecida | 1277 | Ligada a estudiosos do culto.
      - Jamil dos Poços | possível filho fora do casamento | 1277 | Sem reconhecimento.
    - Farid de Alqa | irmão de Abdul | 1277 | Nunca reconhecido como califa.
      - Ramo de Farid | nobres de Alqa | 1277 | Não é dinastia rival soberana.
'''),
    ],
    'Khajataad': [
        dict(
            house='Casas de memória', seat='Khegosla', type='Linhagens de transmissão oral',
            note='O Conselho dos Anciãos prefere representantes respeitados pelo conhecimento; não há dinastia real central.',
            nodes='''
- Casa Sairak | narrativas dos caminhos | 1277 | A anciã Nashira Sairak participa do Conselho.
- Casa Kheshin | recepção de peregrinos | 1277 | Tarem Kheshin não transmite o assento ao filho.
- Casa Miraz | guias e mediadores | 1277 | Soraya Miraz negocia travessias; o ramo de Malacatt nasceu em 621.
'''),
    ],
    'Goblinburgo': [
        dict(
            house='Chefes de Crild', seat='Crild, Pântanos de Nùnar', type='Autoridades de bairro',
            note='Os chamados reis goblins raramente conservam o poder por muito tempo; não há monarquia hereditária estável.',
            nodes='''
- Grikk Três-Dentes | autoproclamado rei | 1189–1193 | Reuniu quatro bairros; morreu numa emboscada.
  - Nikka | chefe de um mercado sobre palafitas | 1277 | Não herdou um trono reconhecido.
- Ugri das Cordas | chefe | 1238 | Tentativa fracassada após uma luta entre gangues.
'''),
    ],
    'Território Orc': [
        dict(
            house='Clãs independentes', seat='Nudh, Ginar, Irkudh e Lulgard', type='Chefias locais',
            note='Nenhum soberano fala por todas as tribos; cada assentamento preserva compromissos próprios.',
            nodes='''
- Urga Garh-Nudh | chefe de Nudh | 1277 | Procura preservar uma trégua com comerciantes itinerantes.
- Borzug de Ginar | veterano de Ginar | 1277 | Autoridade construída por alianças, não por título real.
- Morgha de Irkudh | chefe de Irkudh | 1268–presente | Venceu um duelo e manteve o rival como comandante.
- Thrag Lulgard | chefe de Lulgard | 1277 | Grande prestígio, sem mando automático sobre os outros centros.
'''),
    ],
}

# Texto que abre a seção dinástica quando não há casa soberana única.
DYNASTY_NOTES = {
    'Piglia': 'A sucessão pontifícia é eletiva. O Conclave dos Seis Santos escolhe o Alto Pontífice; nenhuma família herda o cargo. A régua de pontífices abaixo reúne os nomes destacados pela crônica, não a lista completa.',
    'Sete Cidades': 'As sete cidades não formam um reino único. A árvore abaixo apresenta as casas e conselhos de cada salão; nenhuma delas é soberana sobre as demais.',
}
