# Silvengard · Atlas vivo — revisão 10

> **Nota de estrutura (novembro de 2026).** Este é o histórico técnico das revisões,
> escrito quando todos os arquivos ficavam na raiz do repositório. Hoje o programa
> mora em `app/` e o material histórico em `acervo/`; para o dia a dia veja
> `../LEIA-ME.md`. Correspondência dos caminhos citados adiante:
> `dist/` → `app/dist/` · `backups/` → `acervo/backups/` · `tests/` →
> `desenvolvimento/testes/` · `tools/` → `desenvolvimento/ferramentas/` ·
> `historic_archives/` → `app/historic_archives/` · arquivos `preview*.png`,
> `diagnostico*.png` e os `.md` → `acervo/previas/`, `documentos/`.

Abra `Silvengard-Atlas.exe` (ou http://127.0.0.1:8765/). Recarregue com Ctrl+R depois de atualizar. O servidor atende somente este computador. Arquivos de origem .map e imagens permanecem intactos.

## Geografia revista

A referência permanente de Elucitor é references/elucitor-papel-autor.jpeg, cópia do desenho confirmado pelo autor em 04/11/2026. convert.py a mantém como imagem exibida no atlas. O papel orienta a geografia; correções explícitas do autor têm prioridade sobre os desenhos. O digital ajuda na leitura dos nomes. O registro das posições fica em registro-papel.json. Contornos continuam sendo aproximações manuais, com leitura parcial de Guil e Sulpa sinalizada nas fichas.

- Ros Leones: uma única localidade na ilha, contorno irregular e enseada aberta ao oceano. A costa de Valar respeita essa abertura.
- Adhuc Vivere: somente o forte no enclave; rios Talion e Amares que se encontram a montante e contornam o interflúvio até a costa. A floresta morta fica nesse trecho. Localidades antigas removidas não reaparecem com a opção de incluir cidades omitidas nem com edições anteriores de visibilidade.
- Dragonfall: área ampliada, terra e encostas atrás das montanhas do norte. Savhalla aproxima-se de Asgorath e permanece no estado; Alqa fica dentro do deserto de Husaj. Forte Drakis está mais ao sul, em vegetação temperada.
- Limiar: ilha anteriormente marcada como Ymir, no mar a leste. A ilha artificial no interior foi removida; Limiar é ponto geográfico, sem cidade inventada.
- Vitravion: continua uma ilha. Triovorn, Lirion e Vern ficam na costa leste arborizada, com fortes e muralhas. Oregon está na área desértica. Ilha Pirata substitui Castelo Draco.
- Drácon: montanha menor, povoação e monte na mesma ilha escura. Gugacon tem um vulcão menor, encostas e ruínas.
- Costa ocidental de Elucitor junto a Goblinburgo: terra original recuperada para remover a enseada extra criada pela reconstrução anterior. Vegetação moderada retorna à região de Castamor.
- Florestas predominantemente temperadas, com exceções desérticas, Batovia, terreno vulcânico e áreas frias. Liotorn, Floresta Azul e Winterhelm têm cobertura de neve. Alia tem campinas férteis, sem campos de trigo desenhados.

## Ajustes da revisão 9

Fronteiras: opções Pontilhado fino e Pontilhado grande em Camadas. A opção escolhida fica neste navegador; a caixa Fronteiras pontilhadas continua permitindo ocultar tudo. O controle de tamanho não move a câmera quando recebe teclas de seta.

Dungabás é floresta morta de Dragonfall, junto à região de Tagalar, sem enclave desértico. Khajataad recupera território até essa fronteira e Quegosola (alias Qezola) passa ao interior do reino. O saliente desértico ao sul volta a Husaj; Savhalla permanece no trecho seco de Dragonfall. Ruínas de Amestris ficam em Dragonfall, ao norte de Savhalla. O rio Amestris nasce nos Montes do Degelo e segue até o Lago das Lágrimas; o antigo fragmento Amestrino foi retirado. O rio de Winterhelm agora se chama Colozard.

Ask-Lozard é o maior pico, com altura de célula 83,57 (abaixo de 90), e tem cumes separados por selas em vez de uma parede contínua. O terreno desconhecido do norte segue nevado. A neve em Elucitor se concentra em Liotorn/Floresta Azul e nas montanhas; Althor, Tramor, Lorvus, Fermaletim e Ruínas de Alnien não têm neve. Danumbria mantém pinheiros temperados, sem bosque de outono.

Em Adhuc Vivere não há braço horizontal adicional. Talion e Amares se encontram a montante e se abrem em dois cursos que contornam o interflúvio até o mar. A floresta morta chega à água. Mantêm-se Ros Leones como única cidade de sua ilha e os fortes imperiais em Elucitor, ao sul do Bosque de Ereth, que continua em Dragonfall. Os pântanos seguem chamados Nùnar, com ù grave.

Seleção padrão por reino: Sete Cidades 7/7, Veniun 3/3, Osmorn 6/6, Mountport 6/7, Batávia 7/7. Reinos Médios 9/11, Durak 3/3 e Marshal 9/16. Drácon 10/19, incluindo seis cidades continentais; algumas ilhas pequenas ficam sem cidade na seleção. Orgayankher foi reincluída ao norte de Piglia. Nenhuma cidade inventada para completar a Nação das Sete Cidades. Total: 128 localidades selecionadas.

## Renderização e controles

Malha com 112.320 células, duas faces por célula em vez de ressaltos centrais; alturas compartilhadas por terreno, rios, árvores e construções. Textura contínua em coordenadas do mundo, sem imagem repetida em quadrados. Faixa costeira suaviza montanhas antes de chegarem à água. Névoa de Valar opcional, desligada por padrão.

WASD ou setas deslocam; Shift sozinho aproxima, Ctrl sozinho afasta; Shift com movimento acelera. Roda dá zoom, arrastar gira, botão direito arrasta a câmera. Atalhos de movimento são desativados enquanto se escreve. Buscas em Estados, Cidades e Lugares centralizam os pontos. Notas, nomes e seleção ficam no navegador; exporte a edição JSON para guardar uma cópia. Brasões genuínos disponíveis aparecem nas fichas.

## Reconstruir e verificar

`desenvolvimento/convert.py` executa `world_updates.py` e `reference_rebuild.py` e grava em `app/dist/`. Use C:\Users\Arthur KT\AppData\Local\Python\pythoncore-3.14-64\python.exe, que tem NumPy, SciPy e Matplotlib. O atlas pronto não depende dessas bibliotecas para abrir.

`desenvolvimento/verify_geography.py` verifica caminhos de água até a borda do mundo, exclusividade de localidades, junções dos rios, localização de Limiar, fortes élficos, biomas, lagoas, encostas costeiras, Savhalla e Alqa; a planta sai em `acervo/previas/diagnostico-v9.png`. `app/runtime/node.exe --check` valida os módulos JavaScript. Backups das revisões 1 a 8 ficam em `acervo/backups`. Os testes rodam com `desenvolvimento\rodar-testes.cmd`.


## Jornadas e grupos

Abra **Jornadas** no cabeçalho. Crie um grupo com nome e jogadores opcionais. Use uma cidade como posição ou marque um ponto em terra. Adicione destinos pelo seletor de cidades ou por cliques no mapa; os pontos intermediários permitem orientar o percurso. Concluir marcação reabre o painel. Arrastar a câmera e WASD/setas continuam disponíveis fora dos campos de edição.

O caminho terrestre usa A* com oito vizinhos, sem atravessar água ou cortar diagonais entre células de água. Terreno difícil é detectado em montanhas íngremes, pântanos e florestas densas; o seletor permite substituir a classificação em situações decididas na mesa, como uma estrada transitável. O relevo exagerado não aumenta a distância: usamos distância horizontal. A escala original é 10 km por unidade do mapa, ajustável por grupo; confirme essa escala para sua campanha.

Rápido: 6 km/h e −5 na Percepção Passiva; normal: 4,5 km/h; lento: 3 km/h e Furtividade. O cálculo usa os valores por hora e dia da tabela fornecida pelo autor. Terreno difícil duplica o tempo. O dia padrão tem 8 h em movimento; a 9ª hora completa exige Constituição CD 11, a 10ª CD 12, etc. Cada falha causa Exaustão, resolvida na mesa, sem rolagens automáticas.

Montaria: galope opcional a 12 km/h por até 1 h por dia, seguido de **8 h de descanso** quando a viagem continua, conforme definido pelo autor. O descanso é ajustável. Montarias frescas permitem planejar dias mais longos, com testes de marcha forçada dos personagens indicados separadamente. O modelo usa um galope por dia e dias de viagem separados por intervalos de 24 h (ou mais, quando movimento e descanso ultrapassam esse intervalo). A chegada é estimada; não há hora de partida nem calendário da campanha.

Veículos: ritmo normal; carga puxada total, incluindo o veículo, até 5 vezes a capacidade normal combinada dos animais de tração. Excesso de carga gera aviso e bloqueia o registro como percorrido.

**Salvar plano** guarda o percurso e os parâmetros sem mover o grupo. **Registrar como percorrido** guarda o caminho, data, distância e duração, e move a posição atual para o último ponto. Planos partem da posição atual. O histórico permanece com as coordenadas registradas mesmo se a geografia for atualizada. O marcador dourado mostra o grupo ativo, a linha dourada é o plano e linhas verdes mostram seu histórico.

Os dados ficam no localStorage deste navegador (`silvengard-journeys-v1`). **Exportar edição** inclui grupos, jogadores, planos e histórico junto às fichas; **Importar** restaura esses dados. Exportações antigas sem jornadas continuam válidas e não apagam grupos existentes. Guarde cópias externas; limpar dados do navegador apaga o armazenamento local. Limites: 50 grupos, 200 paradas por plano, 50 planos e 100 trechos por grupo. Travessias marítimas não são calculadas porque não foram definidas regras para barcos.

## Ajustes adicionais da revisão 9

Amares tem curvas mais suaves. A margem oriental inferior pertence a Valar, com névoa opcional; o antigo saliente ao norte foi dividido entre Elucitor e Navï Velaffëll. Monte Ganir foi deslocado para Navï, com floresta ampliada. As fronteiras dos seis estados vizinhos têm um só corpo em cada continente, preservando ilhas reais; o saliente norte de Khajataad volta a Dragonfall e a região da capital Quegosola permanece em Khajataad. Dungabás fica mais localizada. Savhalla e Amestris estão no deserto, na mesma margem, com as ruínas ao norte e distantes do lago. Alqa fica no interior do deserto de Husaj. Arenor passa ao trecho nevado, com transição de pinheiros verdes, sem outono. Vilaguezejo fica omitida por padrão em Mountport, disponível na visão completa. Pontilhado grande usa a mesma cadência do fino com uma faixa de tinta mais espessa.

Verificação das jornadas: `node --test tests/travel.test.mjs`. Não são necessárias dependências adicionais. Os módulos do navegador são ES modules.


## Pincéis de edição — revisão 10

No cabeçalho, abra **Editar mapa**. Escolha Político, Bioma ou Vegetação, selecione o destino e o tamanho e marque **Pintar no mapa**. Arraste o botão esquerdo sobre terra. Botão direito, roda e WASD continuam disponíveis para navegar. Esc ou fechar o painel desliga o pincel. Água, ilhas, costa e altura do relevo permanecem intactas.

- Político: transfere células para um estado (ou terras neutras), redesenha fronteiras, recalcula área e atualiza o estado das cidades atingidas. Permite desenhar livremente, inclusive fronteiras diferentes das referências. Nomes de estados permanecem os mesmos.
- Bioma: altera solo, aridez/neve visual e a vegetação típica. Marcas antigas do bioma na célula são limpas; nomes geográficos desenhados no mapa continuam sendo referências independentes.
- Vegetação: modifica espécie e densidade sem trocar o bioma do solo. Escolha pinheiros, folhas largas, floresta morta, tropical, acácias, tipo automático ou sem árvores; densidade de 0% a 200%. As pequenas clareiras de cidades e rios são preservadas. Cada célula tem distribuição determinística para não mudar árvores de regiões que não foram pintadas.

Cada arrasto é uma ação de desfazer; há **Desfazer**, **Refazer**, Ctrl+Z e Ctrl+Y/Ctrl+Shift+Z. O histórico de até 60 ações vale na sessão atual. As pinceladas são salvas automaticamente neste navegador (`silvengard-map-edits-v1`) e voltam ao recarregar. **Restaurar mapa original** limpa apenas as pinceladas e também pode ser desfeito. Fichas e jornadas são preservadas.

**Exportar alterações do mapa** gera `silvengard-alteracoes-mapa.json`, com as células alteradas, tipo/densidade de vegetação, bioma, estado e clima visual. Envie esse JSON para incorporar sua edição à base definitiva. O formato é `silvengard-map-edits-v1`. A base geométrica continua na revisão 9: a revisão 10 acrescenta o editor sem mudar a malha. Isso protege os identificadores das células. Arquivos com malha ou revisão de base diferentes são rejeitados antes de alterar o mapa, para permitir adaptação consciente.

**Importar alterações** aceita o JSON específico ou uma exportação completa que contenha `mapEdits`. Substitui as pinceladas locais; pode ser desfeito. **Exportar edição**, no rodapé, inclui também `mapEdits` junto às jornadas e fichas. Exportações antigas sem `mapEdits` preservam as pinceladas atuais. Os arquivos originais não são modificados pelo navegador. As rotas novas de jornadas usam os biomas e densidades pintados.

Sablarumrith (203) fica omitida e Glouyaloss (85) passa à seleção padrão. O total permanece em 128 localidades. A troca também está no gerador, para persistir após reconstruir.

Verificar: `node --test tests/editor.test.mjs tests/travel.test.mjs`. Testes de pincel circular, preservação de água, desfazer/refazer, restauração de clima e campos opcionais, exportação/importação, rejeição de arquivos inválidos e troca de versão de malha. Backup anterior ao editor em `backups/v9`.


### Escala de viagem em destaque

Jornadas agora começa com **Escala de viagem · km por unidade do mapa**, disponível mesmo antes de criar um grupo. Há atalhos para 1, 5 e 10 km por unidade. O último valor escolhido vira o padrão de grupos novos; quando há grupo ativo, recalcula o plano dele imediatamente. O histórico já registrado é preservado. A escala é incluída na exportação das jornadas (`defaultScale`) e nos parâmetros de cada grupo/plano. O valor original do mundo continua sendo 10 km por unidade. A escala de viagem é uma calibração do simulador; a área mostrada nas fichas de estados continua na escala de origem.


## Padrão aprovado do autor — revisão 11

A edição `silvengard-alteracoes-mapa (4).json`, exportada pelo autor em 05/11/2026, foi incorporada ao padrão: 5.471 células com valores de território, bioma, espécie/densidade de vegetação, neve e aridez. A cópia validada está em `author-map-defaults.json`. O arquivo enviado permanece intacto.

`convert.py` executa `author_defaults.apply_author_defaults` depois da reconstrução por referências. Assim, os valores aprovados têm prioridade sobre os desenhos e sobre a curadoria anterior, inclusive em futuras reconstruções. A geometria e a revisão da malha continuam iguais; os novos pincéis são deltas sobre esse padrão aprovado. Restaurar o mapa original no editor agora restaura esse padrão. Edições locais que já coincidam com o padrão são normalizadas para zero células pendentes; jornadas e fichas são preservadas.

O aplicador valida o arquivo inteiro antes de modificar dados, atualiza o estado das cidades atingidas, áreas, vizinhos e polos territoriais. Não altera altura, costa, lagos, rios, estradas, posições das cidades ou seleção de localidades. Allos, localidade omitida, acompanha a célula transferida para Sete Cidades; nenhuma cidade visível muda de estado nesta edição. Um identificador SHA-256 e a procedência ficam em `world.json` em `authorMapDefaults`.

Validação do padrão atual: `python verify_author_defaults.py`. Compara cada célula ao arquivo aprovado e verifica que todos os demais dados físicos permanecem iguais ao backup. Testes do aplicador: `python -m unittest discover -s tests -p test_author_defaults.py`. Os testes antigos de clima/fronteiras do desenho valem para a base anterior: `python verify_geography.py --world backups/v10/world.json` (com o Python 3.14 descrito acima). Não se deve impor essas expectativas antigas às escolhas explícitas feitas pelo autor com os pincéis.

Backup antes da incorporação: `backups/v10`. Prévia: `preview-padrao-autor.png`.


## Rede de estradas, navegação e povoações — revisão 12

A edição `silvengard-alteracoes-mapa (5).json` acrescenta 576 células ao padrão aprovado anterior. Os campos foram mesclados, mantendo as edições (4): o padrão acumulado contém 5.583 células. O backup anterior está em `backups/v11`. `network_defaults.py`, chamado por `convert.py` após aplicar os pincéis do autor, mantém a nova rede e os papéis das cidades nas reconstruções.

A escala padrão do mundo e das jornadas é **1,5 km por unidade**. Uma migração troca o antigo padrão salvo e os grupos que ainda o usavam; escalas personalizadas de outros grupos, planos e históricos são preservadas. Novos grupos usam 1,5. O campo no início de Jornadas continua ajustável.

Portos principais: Velaffeld, Porto das Cinzas, Ros Leones, Viras, Enquertei (nome confirmado pelo autor), Loueixo, Porto Corujos, Porto do Álamo e Porto de Vern. Têm símbolo de âncora e cais com embarcação. O porto que também é forte conserva suas muralhas e recebe uma torre no cais e o símbolo combinado. Vila Sardinhas conserva seu porto secundário, sem marca de porto principal; Selne não foi promovida.

Mauron, Liotorn e Dagorah, todas as Sete Cidades e as cidades de Duräk têm identificação anã. A capital de Duräk e as fortalezas explicitamente indicadas usam portões monumentais de pedra escura com detalhes de metal e picaretas. As fichas dessas localidades mostram Anões, sem repetir a classificação humana original do gerador. Símbolos e arquitetura não alteram suas posições ou relevo.

Foram cadastradas **20 rotas marítimas**, conectando os portos principais e alguns secundários. Seus pontos ficam no oceano, contornando terra; lagos interiores não são confundidos com o mar. As aproximações portuárias conectam a cidade à água próxima sem mudar o terreno. As 120 estradas/trilhas anteriores são preservadas e recebem nomes editáveis. Estrada Imperial e Rimae usam o papel de Elucitor como referência; demais nomes são descritivos, geralmente pelas cidades próximas, sem atribuir leitura segura onde o papel não permite.

Abra **Rotas** no cabeçalho. Filtre por estado, tipo ou nome. A ficha de cada estado também tem **Ver traçados deste estado**. Selecione uma estrada ou rota marítima para renomear, ativar/desativar ou editar os pontos. Ligue **Editar pontos no mapa** e arraste os marcadores. Também é possível selecionar um ponto e usar Mover, Inserir, Remover ou reordenar, marcar novos pontos com cliques e acrescentar uma cidade/porto. Novos traçados têm botões próprios de Estrada e Marítima. O caminho é reconstruído sobre o tipo de superfície correto. **Salvar traçado** confirma; renomear não redesenha a geometria. **Descartar** recupera o salvo. Remoções e alterações têm Desfazer/Refazer.

Rotas locais ficam em `silvengard-network-v1`. **Exportar estradas e rotas** gera `silvengard-estradas-rotas.json`; Importar restaura. A exportação completa inclui `networkEdits`, junto a fichas, jornadas e pincéis. Envie esse JSON para incorporar sua rede à base definitiva. Importar preserva a rede padrão, aplicando substituições e remoções por identificador estável. Exportações sem rede preservam as rotas atuais.

Nas jornadas, A* usa estradas como terreno normal, mesmo dentro de montanhas, florestas densas e pântanos. O acesso ao mar ocorre por portos e as travessias usam apenas corredores marítimos cadastrados. Trechos marítimos são normais e usam **velocidade de embarcação ajustável**, inicialmente 4,5 km/h; não é uma velocidade universal de barcos. Não se aplica galope ou marcha forçada dos passageiros à parte marítima. Marcha forçada e carga continuam valendo para os trechos terrestres. O limite diário pode ser ajustado até 24 h. **Seguir estrada ou rota marítima** e **Usar na jornada** acrescentam pontos do traçado ao plano do grupo; editar/salvar uma estrada não move nenhum grupo.

Verificações: `node --test tests/editor.test.mjs tests/travel.test.mjs tests/network.test.mjs`; `python -m unittest discover -s tests -p test_author_defaults.py`; e `verify_author_defaults.py` com o Python 3.14. A última recompõe o padrão esperado, incluindo a rede, e compara ao arquivo servido.


## Rotas principais e caminhos locais — revisão 13

Os 120 caminhos terrestres anteriores continuam com exatamente os mesmos pontos. Eles passam a ser classificados como ligações locais, sem rótulos de grandes rotas no mapa. Há apenas cinco corredores terrestres com nomes próprios: **Rota da Neve**, **Estrada Imperial**, **Rota das Flores**, **Estrada Rimae** e **Rota dos Portos**. Cada um é um caminho contínuo no grafo das estradas já existentes, agrupando diversos trechos locais. Não há saltos entre os trechos, nem estradas novas desenhadas para ligar artificialmente os corredores.

No mar, as vinte ligações anteriores dão lugar a quatro corredores contínuos: **Rota dos Portos do Poente** (Álamo–Vern–Almirarem–Urlylithalazak–Loueixo–Viras), **Rota do Mar de Nur** (Viras–Porto Corujos–Crild–Pantos–Nediora–Ros Leones), **Rota Marítima do Norte** (Vern–Porto das Cinzas–Selne) e **Rota do Levante** (Selne–Velaffeld–Ros Leones). As escalas são pontos da mesma rota, não nomes individuais para cada pequeno trecho. Todos os portos principais estão conectados por essa rede. Os trechos marítimos são traçados pelo oceano, contornando terra.

Almirarem substitui Enquertei como porto principal dos Reinos Médios. Nediora, Pantos, Crild, Selne (também encontrada como Seline/Celine) e Urlylithalazak foram incluídos entre os principais. Urlylithalazak foi confirmada pelo autor como a cidade próxima de Drácon. Não foi criada uma cidade fictícia chamada Issy: a referência era a Seline. A escala continua em 1,5.

O menu **Rotas** mostra somente os nove corredores principais por padrão. **Incluir caminhos locais sem nome próprio** revela as ligações menores para consulta e edição. A caixa **Rota principal com nome no mapa** permite promover ou rebaixar um traçado. Nas jornadas, o seletor de percursos também destaca as grandes rotas; os caminhos locais continuam disponíveis ao cálculo automático e são terreno normal. O filtro das fichas de estado segue a mesma organização.

A rede tem versão 13. Importações da versão 12 continuam aceitas: edições dos antigos trechos são preservadas como ligações locais; podem ser promovidas no editor. Não são reaplicados todos os antigos nomes automaticamente. Novas exportações registram a classificação `majorRoute` e as escalas marítimas em `stops`. Backup anterior em `backups/v12`.

A Rota da Neve parte de Winterhelm, passa pela Torre Solitária e chega ao Porto das Cinzas, seguindo os caminhos existentes da região fria. O corredor não passa pelo deserto de Savhalla.


## Upgrade visual integrado · v14

Integração seletiva do pacote `silvengard-atlas-v12-upgrade-visual.zip` sobre o atlas atual: terreno com rocha estratificada e microtextura, praias suavizadas, mar com profundidade/ondas/reflexos/espuma, fluxo dos rios, coníferas em camadas, vento, céu e sombras. Os controles Sombras e Água animada e vento ficam em Camadas.

Preservados: world.json integralmente, 5.583 células de pintura aprovadas, escala 1,5, portos/modelos de cais, fortalezas anãs, rotas nomeadas, estradas locais, editores, jornadas e armazenamento do navegador. Os símbolos portuários e anões aparecem também no primeiro carregamento. As rotas e os cais usam a nova altura da água. O modo político mantém as cores territoriais legíveis.

Ask-Lozard recebeu uma remodelagem **visual** na função shapeNorthernRange de dist/terrain-shape.js: cristas assimétricas conectadas, ramificações e picos próximos, sem o domo isolado anterior. Depois da suavização, o pico fica 3,5% acima da segunda maior montanha (altura de exibição). Altitudes cartográficas e custos de jornadas não foram recalibrados. Nenhum estado, rio, cidade ou célula foi deslocado por essa alteração visual.

Backup anterior completo dos arquivos afetados e do mundo: backups/v14-before-visual. Não extrair o pacote antigo inteiro por cima desta versão; ele contém app.js/features.js anteriores ao sistema de portos e rotas.

Verificação: node --test tests/editor.test.mjs tests/travel.test.mjs tests/network.test.mjs tests/visual.test.mjs; python verify_author_defaults.py.


## Edição do autor e escolas de magia · v15

Incorporados `silvengard-edicao (9).json` (49 fichas de cidades: nomes, notas e visibilidade) e `silvengard-alteracoes-mapa (8).json` (1.230 células, idênticas ao bloco mapEdits da edição completa). Os campos foram mesclados uma única vez sobre o padrão anterior, somando 6.592 células aprovadas. Os arquivos originais enviados permanecem intactos.

Novos padrões em author-city-defaults.json e city_defaults.py; aplicados no convert.py após a pintura do autor e antes da rede. As jornadas contidas no arquivo não foram semeadas em novos navegadores; grupos e histórico existentes no navegador são preservados. As notas padrão aparecem nas fichas mesmo em navegador novo.

Sel-Shofela moveu-se rio acima para [1320.4,624.5]; Cananhos apenas ao norte para [397.26,470.4]. Allanan tornou-se porto principal com cais e escala na Rota do Levante. Sahtalys, nome escolhido pelo autor, ocupa a ilha sem cidade original em frente a Allanan, em [1434,686], sem modificar a costa.

Escolas de magia com torre própria e símbolo ♜: Sahtalys, Garnalos, Danumbria, Torre Solitária, Aleravum, Pyrenor e Panhadaril. Hellas permanece capital, sem escola de magia. Pequenos patamares de relevo visual apoiam as fundações das torres; a Torre Solitária deixou de atravessar a encosta. Altitudes cartográficas não foram recalibradas.

Backup: backups/v15-before-author-edition. Testes: node --test tests/editor.test.mjs tests/travel.test.mjs tests/network.test.mjs tests/visual.test.mjs tests/cities.test.mjs; python verify_author_defaults.py.


## Fichas de rotas e cidades definitivas · v16

Rotas: clicar no nome ou traçado no mapa abre a ficha diretamente; a lista anterior fica recolhida. O botão Editar pontos no mapa liga os marcadores. É possível arrastar, mover por clique, inserir, remover e reordenar pontos, ou adicionar cidades/portos. + Estrada e + Marítima criam novos percursos por pontos livres ou cidades. Salvar alterações fica na barra superior; Descartar e Desfazer permitem recuperar o traçado. Criações e edições continuam no navegador e na exportação do Atlas.

Ficha: quilômetros pela geometria real, horas em movimento, dias com as horas/dia escolhidas, localidades em sequência, distâncias acumuladas, distância e tempo desde a cidade anterior e média entre localidades. Aceita ritmo lento/normal/rápido, velocidade do navio e horas/dia; Recalcular estimativa aplica os valores. As cidades são identificadas por proximidade de até seis unidades ao traçado; no mar usam a posição do cais. Estradas e rotas marítimas contam como terreno normal. A escala acompanha o padrão atual de Jornadas. Horas estimadas excluem paradas, encontros e outras intercorrências.

A névoa de Valar inicia ligada, com a opção de desligar em Camadas. As 105 cidades omitidas foram retiradas dos dados ativos, da busca e dos modelos; o controle de incluí-las e a opção de inclusão na ficha foram retirados. canonical_world.finalize_world poda ramais sem destino e mantém as grandes rotas e ligações úteis. Restam 72 caminhos locais, incluindo o acesso curto da nova Aleravum; 49 identificadores de caminhos antigos foram aposentados. Importações antigas não restauram esses traçados automaticamente. O mapa tem 153 cidades: as 152 selecionadas antes, mais a nova Aleravum. Os backups preservam as cidades retiradas.

Aleravum (4003) é a nova escola de magia em Veniun, [795,466], no sopé ocidental do Monte Vathnis, à esquerda da nascente do Ghol-Cha. A cidade anterior de Piglia (130) é Gannas e não tem escola de magia. Mantidos os outros seis centros mágicos, portos, fortalezas anãs e o upgrade visual. Nenhuma célula de pintura aprovada, rio ou costa foi alterado.

Backup anterior: backups/v16-before-route-inspector. Novos módulos: canonical_world.py e dist/route-info.js. A etapa de seleção definitiva fica no final do convert.py, depois de nomes, pintura e rede.


## Marshell, margem de Aleravum e ritmos marítimos · v17

Aleravum passou de [795,466] para [823,449], na margem oposta do Ghol-Cha. O centro fica a mais de 19 unidades do rio, além do patamar visual de 15 unidades e da fundação de 6 unidades, deixando a passagem livre.

Tog Iret (140) é a capital de Marshell, com capital única no estado e símbolo correspondente; Tserost deixa de ser capital. Tog Iret foi deslocada para [605.5,512.5], um pouco mais ao centro e junto ao mesmo rio Bayantog. Grainhem passou para [615.41,563.085], exatamente o ponto médio entre sua posição anterior e Ulanzad. Tuyench (103), Shundurbara (175) e Ulanzad (192) foram excluídas dos dados ativos. Os caminhos sem destino foram podados e há conexões locais para as cidades movidas. Total: 150 localidades e 74 caminhos locais.

Navegação, conforme as faixas fornecidas pelo autor: ritmo lento 6 km/h, médio 11 km/h (média de 9–13), rápido 20 km/h (média de 18–22), além de Personalizado. As opções estão na ficha de rota marítima e em Parâmetros da viagem nas Jornadas. O campo numérico continua ajustável. Caminhada normal permanece 4,5 km/h. Padrão novo: médio, 11 km/h.

Migração de jornadas: o antigo valor padrão 4,5 km/h é atualizado para 11 apenas nos parâmetros atuais dos grupos e uma única vez, com seaPaceVersion 17. Velocidades personalizadas, planos salvos e histórico mantêm seus valores. Novos grupos usam 11. A marca da migração acompanha exportações e importações.

Backup: backups/v17-before-marshell. Verificação: 38 testes JS e verify_author_defaults.py; 6.592 células aprovadas intactas. QA: ritmos 11 e 20 na ficha, 20 e 6 nas jornadas; grupo temporário removido; ficha de Marshell com Tog Iret como capital; Aleravum conferida na outra margem, sem erros no console.


## Dados de cidades, brasões e diplomacia · v18

source_profiles.py incorpora dados do arquivo Mapas/Silvangad 5.0.map e das células, depois da seleção definitiva do mapa. Foram encontrados dados próprios de 132 cidades atuais. As outras 18 receberam referências documentadas, por proximidade, cultura e importância (vila, fortaleza, academia, porto, cidade). Populações estimadas são marcadas na ficha, com nome da cidade usada e método; culturas/religiões/estruturas derivados são identificados como referência. Nenhuma cidade excluída foi reativada por ser usada como comparação estatística.

População original: valor bruto × escala 1.000 × urbanização 2. A população territorial dos estados é a do arquivo original, identificada separadamente das novas fronteiras. Idioma não foi deduzido da base de nomes: o arquivo tem culturas e bases de geração de nomes, mas não um cadastro de línguas faladas.

Os brasões foram desenhados localmente com as descrições COA nativas e os desenhos oficiais do Armoria (https://github.com/Azgaar/armoria-api), licença MIT em tools/armoria/LICENSE. O brasão personalizado de Dragonfall foi extraído da imagem incorporada ao próprio .map. Mantidos os brasões autorais já associados às cidades. Todas as 150 cidades e 19 estados atuais têm imagens locais válidas; imagens emprestadas são marcadas como brasões de referência. Renderização não usa API externa nem geração aleatória. A adaptação local e os arquivos originais estão em tools/armoria.

Fichas: origem da população, cultura, religião e divindade, estruturas e província de origem (ou referência). Estados: forma de governo, diplomacia clicável, histórico diplomático e campos editáveis. Atalhos Diplomacia / Governante ou Governo / História / Salvar no topo. Nas monarquias, governante e família/dinastia podem ser preenchidos; em repúblicas e conselhos nenhum monarca ou presidente foi criado. Campos de idioma, governante, dinastia e história são preservados no navegador e em exportações/importações.

O arquivo não contém nomes de governantes, dinastias, línguas nem história narrativa. O histórico disponível são 63 registros diplomáticos, exibidos como arquivo histórico e separados da situação atual. O calendário original é 1083 da Quarta Era. Não se inventaram nomes de pessoas para preencher lacunas.

Dragonfall: Reino de Dragonfall, monarquia independente, sem suserano; relação Neutra com Elucitor em ambas as direções, conforme alteração explícita do autor. Eventos antigos de vassalagem continuam no registro histórico, sem determinar a política atual.

Relatório de todas as fontes e referências: relatorio-fichas-v18.json. Backup anterior: backups/v18-before-profiles. O .map original permanece intacto (SHA-256 d1b6ce825651321f80855feac5cde9a62561dd9d9aee120b2922cf7c46e1ece8).

Edição das cidades (v21): abra uma cidade e use Editar para alterar população, cultura, tipo de localidade, religião e características. A divindade acompanha a religião selecionada. Salvar confirma os campos. O bioma modifica a célula do local e integra a exportação do pincel.

Localização leva ao botão Mudar localização no mapa. Clique em terra para reposicionar a cidade e reconectar os caminhos próximos. Portos precisam continuar junto à costa; capitais continuam no próprio estado. Cancelar ou Esc abandona a marcação. Desfazer última mudança restaura a posição e os caminhos enquanto estes não forem editados novamente. O histórico das jornadas permanece intacto.

Explorar reabre o menu lateral; a seta o recolhe e o X o oculta. A preferência fica salva no navegador. Exportar edição inclui os novos dados das fichas, as posições, os pincéis, as rotas e as jornadas, permitindo importar a edição em outro navegador.

A exportação silvengard-alteracoes-mapa (9).json foi incorporada ao padrão, preservando os ajustes anteriores.

Controles da versão 22:
- Criar cidade fica no menu Explorar. Informe nome e habitantes, escolha cultura e religião e clique no mapa. É possível conectar uma estrada à cidade mais próxima que tenha acesso por terra.
- Excluir cidade fica ao final da ficha. Ligações sem destino são retiradas, enquanto estradas que servem outras cidades continuam. Restaurar excluídas recupera a cidade e suas ligações. Se uma capital for excluída, a cidade restante com mais habitantes assume como capital.
- Início da rota, Anterior e Próxima cidade percorrem as localidades no inspetor de rotas e nas Jornadas, tanto por terra como por mar. Esses botões movem a câmera e não deslocam a party nem registram viagem.
- População mostra uma concentração ilustrativa em torno das cidades, com cores em escala logarítmica. Barras de população, nas camadas, compara as quantidades em escala linear. O modo não atribui habitantes à população rural.
- Exportar edição inclui as cidades criadas, as exclusões recuperáveis e os ajustes da rede de transporte.
As camadas de cultura e religião continuam pendentes de definição; nenhuma divisão temática nova foi aplicada.

Atualização 23: as edições silvengard-alteracoes-mapa (11).json e silvengard-edicao (10).json estão incorporadas aos padrões. Porto Naril e Porto de Sarandir são portos principais; Natheas assume o papel portuário de Selne nas rotas marítimas. Os rios Aquozard, Aldain, Auror e Nilnor têm os nomes corrigidos, e o pequeno trecho Stormouth foi retirado.

Catalogo-de-Silvengard.md reúne estados, cidades, características, habitantes, culturas, religiões, divindades, geografia e rotas da edição atual. Para regenerar o arquivo após mudanças no world.json, execute tools/export_catalog.py com o Python do projeto. latest_author_defaults.py aplica as últimas configurações depois das etapas anteriores da conversão.

Versão 24 — padrões locais, rotas híbridas e proposta de províncias:
- A edição silvengard-edicao (11).json está incorporada, incluindo Porto Sarandir, o ajuste de posição de Porto das Cinzas e a geometria marítima editada.
- Definir como padrão, no rodapé, grava a edição do mapa nos arquivos locais. Cada gravação cria um backup em backups/defaults-*. Ao abrir ou recarregar, o Atlas busca world.json sem cache. Edições incompletas de rotas precisam ser salvas antes de definir o padrão. O histórico local das jornadas é preservado.
- O servidor serve.py disponibiliza a gravação somente para a própria origem local, valida a edição, verifica conflitos entre abas e usa gravações atômicas. As revisões em saved-author-defaults.json são reproduzidas na conversão por persistent_defaults.py. O Node local executa os mesmos validadores do editor.
- Em Rotas, + Híbrida permite combinar terra e mar. As passagens entre os meios usam os portos e as rotas marítimas cadastradas. O relatório separa quilômetros e velocidades de terra e mar; as jornadas mantêm as regras de terreno, galope e marcha forçada apenas nos trechos correspondentes.
- Províncias · proposta é uma prévia para revisão, sem atribuir províncias definitivas às células. Primeiro clique: estado; segundo clique no terreno do mesmo estado: província. Cultura e religião não foram alteradas.
- proposta-provincias-elucitor.png apresenta 13 províncias sugeridas; proposta-provincias-silvengard.png é a visão geral; Proposta-de-provincias.md lista nomes, sedes e localidades. tools/propose_provinces.py regenera os artefatos da proposta.


Versão 29 — livro de comércio e panorama econômico:
- Economia abre um livro lateral: Estados → Províncias → Cidades; Produtos mostra produtores e insumos; Mercados compara preços regionais e a menor oferta entregue, com frete e origem.
- O panorama atual é uma estimativa mensal recalculada a partir do cenário atual, sem avançar o calendário nem alterar estoques salvos. Simular ciclos futuros mantém o sistema de estoques; Recorte permite consultar o último ciclo registrado no livro e nas rotas.
- As dez regiões comerciais conservam seus preços relativos. Preços-base editáveis escalam os preços regionais. Recursos novos usam a referência própria; ofertas entregues variam com o caminho e o transporte.
- Diplomacia permite modificar relações recíprocas. Guerra bloqueia compras bilaterais e trânsito por terra inimiga; fornecedores acessíveis são comparados pelo preço entregue. A alteração vale para o panorama e os próximos ciclos e acompanha Exportar edição / Definir como padrão.
- Fretes são percentuais do preço por km, ajustáveis, inicialmente 0,05% por terra e 0,015% por mar. É uma aproximação por unidade comercial, sem peso, tonelagem, capacidade de navios ou cerco naval. O frete continua pago ao fornecedor.
- Produção, Comércio e Preços são modos econômicos do mapa. A produção e os preços usam províncias e seus mercados; comércio usa o fluxo total de cada estado. Verde indica menor valor e vermelho maior, em escala logarítmica. Valar não participa.
- Cada rota mostra valores e bens que passam por ela. Cargas que percorrem mais de uma rota aparecem em cada trecho; não se somam novamente ao comércio mundial. Caravanas e barcos ilustram até 64 rotas com maior fluxo; a animação não representa duração real de viagem.
- Valores de produção, consumo e preços são ajustáveis. A estimativa é um cenário de referência, não um censo histórico ou um cálculo de lucro: salários, tributos, inflação e bloqueios navais não são modelados.


Versão 30 — mercados, bens predominantes e fluxos:
- Mercados agora possui áreas coloridas independentes dos estados. Cada célula terrestre recebe a influência da cidade habitada mais próxima e conserva o mercado dessa cidade. Valar fica fora. Os setores rurais permanecem contabilizados no mercado da maior cidade de sua província; o desenho territorial é uma visualização de influência, não uma nova divisão política.
- Bens produzidos mostra um bem predominante por província, escolhido pelo maior valor produzido no recorte atual, com cor, símbolo e quantidade. A ficha mantém todos os outros bens e manufaturas. A antiga escala de calor continua como Quantidade de um bem.
- Comércio mostra os centros e os 22 maiores fluxos entre mercados, com setas do vendedor ao comprador e largura proporcional ao valor. As curvas entre centros são esquemáticas; a simulação continua usando estradas, portos e caminhos efetivamente cadastrados, fretes e guerras. O valor de uma transferência intermercados entra uma única vez no fluxo correspondente; ligações opostas aparecem separadas.
- Ícones e áreas são clicáveis. A ficha de mercado reúne valor da produção a preços locais, compras, vendas, produtos predominantes, preços por unidade, estados participantes, estoques agregados e localidades. Os estoques dos participantes não se transformam num depósito comum.
- As sete localidades das Sete Cidades tiveram parte de seus bens substituída por minas de ferro, cobre, estanho, prata e ouro, além de carvão, ferramentas, armas e forja anã. As configurações foram gravadas por Definir como padrão com backup; cidades, habitantes, culturas, religiões, brasões e geografia foram preservados.
- Os dois arquivos Markdown de estados/províncias/cidades e economia/mercados foram atualizados por tools/export_hierarchy_economy.mjs.
- Referência visual de centros e setas: manual oficial de Europa Universalis IV, https://cdn.steamstatic.com/steam/apps/236850/manuals/EuropaUniversalisIV_Manual_English.pdf. A economia do Atlas continua própria, com fluxos bidirecionais calculados, sem regras fixas de coleta ou poder comercial do EU4.


Versão 31 — comparação compacta de preços:
- A ficha de cada mercado ganhou a coluna Comparação + frete nos principais produtos e na lista completa de bens.
- Base compara o preço local com o preço-base ajustável. Média usa a média aritmética dos dez mercados, incluindo o próprio. Próximos usa os três outros centros geograficamente mais próximos, sem ponderar por produção.
- Frete médio é uma cotação indicativa por unidade comercial: média simples dos pares acessíveis de fornecedor externo e cidade de destino do mercado, conforme rotas, duração do recorte, fretes terrestres/marítimos e guerras. Só considera fornecedores com produção no recorte, sem reservar estoque ou caixa. Não é a média ponderada das compras realizadas.
- Importar já soma o preço médio na origem ao frete médio dessas cotações; não se acrescenta novamente o preço local. Não havendo oferta externa acessível, a coluna informa isso em vez de atribuir custo zero. O cursor sobre cada indicador mostra as referências, mercados vizinhos e método.


Versão 32 — políticas, transporte e produção arcana (substitui as limitações indicadas nas versões anteriores):
- Preços e Quantidade de um bem exibem o seletor Bem diretamente na barra do mapa. Ele inclui todos os bens, mantém a escolha ao trocar de camada e sincroniza com o livro de economia.
- Aliança reduz a referência de venda em 10%, amizade em 5%, desconfiança acrescenta 15% e rivalidade 20%. Guerra bloqueia. O preço efetivo nunca desce do custo registrado do estoque; matérias-primas usam piso operacional de referência de 50% do preço-base, e oficinas somam seus insumos adquiridos e 15% do preço-base como referência de trabalho. São pisos de preço, não débitos automáticos de salários. Ingredientes ainda indefinidos, como a composição do Lavanthir, continuam sem custo exato.
- Embargo é uma decisão de um estado que bloqueia compras e vendas de todos os bens ou dos bens escolhidos com outro estado. Não impede o trânsito de terceiros. Geral, específicos e retirada ficam em Economia → Diplomacia.
- Tarifas padrão de 5% incidem sobre o preço da mercadoria nas compras internacionais, sem frete; cada estado pode alterar ou zerar sua alíquota. A receita vai para uma conta Alfândega do estado importador. Moedas são conservadas nas transferências.
- Bloqueios navais fecham os trechos marítimos de entrada e saída dos portos do estado atingido, sem alterar estradas. São ações explícitas, retiradas pelo mesmo menu; guerra não cria bloqueio automaticamente.
- Pirataria usa zonas costeiras editáveis. Inicialmente são Goblinburgo (até 14%) e Drácon (até 12%), com alcance de 90 unidades e intensidade decrescente longe da costa. O risco por trecho resulta em perdas médias de carga, não em um sorteio. Carga expedida, entregue e perdida são registradas; compras buscam compensar a perda quando há estoque e caixa. A escolha de caminho considera o risco.
- Escassez considera produção, insumos industriais, demanda e estoques de cada mercado. O preço regional varia entre 65% e 250% de sua referência; intensidade padrão 65%, editável ou desativável. Ciclos seguintes usam produção realizada e estoques existentes. O panorama atual projeta um recorte sem gravar ou avançar o tempo.
- Pesquisa arcana é o bem 77: tratados produzidos exclusivamente por cidades com escola de magia, usando papel, tinta e trabalho especializado. Possui demanda, preço, frete e comércio próprios. Insumos escassos são repartidos proporcionalmente entre oficinas na mesma etapa produtiva, sem dar preferência especial a uma escola.
- Liotorn passou a produzir 0,8 lingote de prata por 30 dias; os 4 lingotes de ouro foram para Fovium, em Veniun. A ocorrência rural de prata de Fovium foi transferida, preservando o total mundial desses dois metais.
- Descontos, tarifas, escassez e riscos entram nas cotações de importação e nos ciclos. Referências de preço local não incorporam uma relação bilateral específica; o preço entregue considera o comprador e o fornecedor.


Correção do salvamento local — novembro de 2026:
- O Atlas inclui runtime/node.exe e não depende mais do Node disponível no ambiente do Codex ou no PATH do Windows. Ao copiar a pasta, leve runtime junto.
- GET /api/defaults informa a pasta do servidor e se o runtime foi encontrado. Falhas inesperadas ficam em logs/salvamento.log, com mensagens específicas para componente ausente e falta de permissão.
- Um padrão alterado nos arquivos pode deixar uma aba desatualizada mesmo sem outra sessão aberta. Exporte sua edição antes de recarregar quando houver mudanças locais ainda não salvas.


## Histórias do mundo (v34)

O menu **Histórias** reúne o acervo narrativo, a cronologia interativa e as histórias vinculadas às fichas. Edite os três Markdown em `historic_archives` na pasta principal e clique em **Atualizar histórias** no leitor. Não é preciso definir um novo padrão do mapa. Veja [Histórias do Atlas](Historias-do-Atlas.md) para detalhes.


## Leitura narrativa (v35)

As fichas abrem histórias em pop-ups diretos, com capítulos abertos e cronologias locais. Estados não incorporam os diretórios das cidades e províncias. Notas editoriais, pendências e apêndices foram retirados da apresentação; os Markdown originais continuam editáveis. Veja [Histórias do Atlas](Historias-do-Atlas.md).


## Histórias nas fichas (v36)

As histórias aparecem nas próprias fichas de cidades, estados e províncias. Os cartões temáticos de cultura e religião também mostram seus textos. O botão de leitura completa abre a biblioteca geral opcionalmente. O pop-up de leitura rápida foi retirado.


## Mercados definidos pelo autor (v37)

As sedes e a vinculação das localidades seguem `Silvengard_Mercados_Atualizado.md`. São dez mercados, com 151 localidades vinculadas; Valari permanece sem mercado. Nilhelm está vinculada a Asgorath, sem atividade produtiva. A ficha dos mercados inclui províncias participantes e informa quantas localidades de cada província pertencem ao mercado. As fronteiras políticas, as rotas e os bens produzidos são preservados.

Para reaplicar futuras alterações nesta tabela, execute `python market_defaults.py` na pasta principal. O compilador valida cada localidade por nome e estado, exige uma atribuição única, verifica as sedes e mantém os IDs dos mercados e suas referências de preços. O gerador econômico também aplica essa configuração durante uma reconstrução. A cópia v2 consulta o documento da pasta principal quando não tiver uma cópia própria.


## Revisão das sedes e limites comerciais (v38)

O antigo mercado de Selne passa a ter sede em Allanan; Selne, Jalha e Karno’ande pertencem a Velaffeld, enquanto Allanan e Sahtalys se unem a Garnalos, Himlumn e Sel-Shofela. O antigo mercado de Almirarem passa a chamar-se Grenolk, com sede em Grenolk. As demais transferências estão registradas em `Silvengard_Mercados_Atualizado.md`.

`market-territories.json` define o corredor comercial de Ros Leones entre Vilenages e Danumbria, excluindo a Marca de Arenor. Ele é um limite do modo Mercados e não muda terreno, fronteiras políticas ou traçados. Os limites acompanham as posições das duas localidades e preservam as atribuições individuais das cidades.


## Mercados e revisão histórica (v39)

Nythan pertence a Allanan; Arenor, a Ros Leones; Fovium, Odusonsium e Lakenford, a Alqa. O Norte Desconhecido está excluído dos mercados. A revisão demográfica e produtiva está em `Proposta-Revisao-Populacoes-Producao-Comercio.md`, apenas como proposta: populações, capacidades e rotas não foram alteradas por essa revisão.


## Revisão econômica v40 — 9/11/2026

Revisão aprovada: Elucitor 1.050.000, Velaffeld 250.000 e Asgorath 100.000 habitantes. Produção, frotas duráveis, logística, contas rurais, serviços, comboios e censos de comunidades itinerantes foram atualizados. A revisão está salva nos padrões; use Ctrl+F5 numa aba aberta anteriormente.

O registro completo está em `Revisao-Economica-Aplicada.md`. Os checkpoints `economic-review-defaults.json` e `economy-review-source.json` preservam a revisão nos rebuilds e as edições posteriores feitas com Definir como padrão continuam sendo aplicadas. Backups em `backups/v40-before-approved-economy`. Validação: 128 testes passaram; duas simulações consecutivas em cada instalação conservaram moedas e reconciliaram os mercados.
