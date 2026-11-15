# Silvengard · Atualização v12 — Cidades do Império de Elucitor

## Objetivo
Repaginação **efetiva do gerador de cenas locais 3D**, com plantas 2D atualizadas e sem reescrever a geografia política, os dados de população ou a economia do Atlas.

Esta atualização implementa oito localidades do Império de Elucitor com planejamento e função próprios, a partir das grafias confirmadas no mapa: **Castamor, Lorvus, Alia, Tramor, Ignis, Nostris, Vostris e Bomaria**.

## O que mudou nas cidades

| Localidade (ID) | Província | Alteração no modo 3D |
|---|---|---|
| **Castamor (1240)** | Marca de Castamor | Morro central com cerca de 84 m de relevo adicional, castelo elevado e fortificado, acesso em espiral, pátio, torres altas, rua periférica e pequena torre antiga parcialmente danificada como recurso cênico proposto |
| **Lorvus (20)** | Marca de Althor | Povoado pequeno e simples, limite de casas geradas, poço, mina escavada na montanha, passagem coberta com duas aberturas caminháveis, forja rústica, carros de minério e pilhas de pedra; **sem palácio ou indústria opulenta** |
| **Alia (1244)** | Condado de Alia | Arquitetura camponesa acolhedora com influência rural/halfling, pomares, campos, celeiros, telhados de palha e caminhos sinuosos; sem muralha urbana |
| **Tramor (27)** | Marca de Althor | Entreposto secundário de comércio nas estradas, pequenas bancas e oficinas, casario contido e nenhuma cidadela monumental |
| **Ignis (15)** | Protetorado de Rimae | Fortificação reforçada, quartéis, caminhos de patrulha, segmentos de muralha voltados para Nostris e Vostris, torres de sinalização |
| **Nostris (17)** | Protetorado de Rimae | Fortaleza de guarnição conectada visualmente à linha de Rimae, torres de vigia e caminhos em direção a Ignis |
| **Vostris (28)** | Protetorado de Rimae | Fortaleza de porte menor, mas murada, com linha de patrulha voltada para Ignis |
| **Bomaria (161)** | Protetorado de Rimae | Mercado de fronteira e pequeno pavilhão evocando a trégua, sem grande aparato militar |

### Castamor: morro e castelo verdadeiros
O campo de altura **sobe fisicamente** até o cume, com patamar central para a fortaleza. A rua de acesso é uma **espiral real em 3D**, além das vias de anel e dos bairros de encosta. O castelo tem muralha com vão de passagem, torre principal, torres menores, pátio e anexos. A torre danificada é uma **licença artística nova**; não altera o cânone dos Reis Bruxos ou dos Dravenholt.

### Lorvus: povoado mineiro sem luxo
O tamanho do núcleo urbano continua derivado da população do mapa (2.267), e o casario é deliberadamente limitado: máximo de 88 casas instanciadas da periferia mais o pequeno núcleo detalhado. A passagem da mina atravessa uma elevação gerada **com um desfiladeiro rebaixado**; os dois portais são abertos, existe cobertura de rocha e madeira acima do caminho, e uma forja rústica fica ao lado. Não são galerias mineiras profundas com múltiplos níveis e não há interiores de edifícios.

### Alia: a vida nas Campinas
O ambiente lembra um condado agrícola e acolhedor, mas **a cultura predominante do catálogo permanece imperial humana**: a presença halfling acrescenta tradição rural, sem reclassificar os habitantes. Pequenos pomares e campos cultivados reforçam o papel de abastecimento.

### Rimae: escala de fronteira
O arquivo `world.json` já contém linhas regionais nomeadas **Muralha de Rimae** e **Muralha de Policia**. A v12 **não altera essas linhas**: acrescenta **trechos locais em 3D** orientados para os fortes vizinhos. Como os fortes estão separados por dezenas de quilômetros no mapa, não é uma única malha contínua caminhável entre as fortalezas. O modelo 3D local mostra a continuação e a organização defensiva da muralha.

## Arquivos principais
- `app/dist/imperial-v12-core.js` — relevo do morro e do corredor mineiro, perfis de estradas e muralhas
- `app/dist/imperial-v12-art.js` — castelo, mina/forja, pomar, mercado e linhas defensivas 3D
- `app/dist/city-blueprints.json` — identidade e planejamento por cidade, sem mudar população
- `app/dist/local-field.js` — altura física dos relevos
- `app/dist/city-plan-core.js` — ruas em espiral, passagens e rotas militares
- `app/dist/town.js` — construção, limites de densidade, elementos específicos e moradores de pequena escala
- `app/dist/street.js` — seleção dos estilos, materiais e povoamento local
- `app/dist/material-presets.js` — paletas de chão/ruas por cidade, compatíveis com v10
- `app/dist/city-plan-preview.js` — planta 2D esquemática atualizada
- `desenvolvimento/testes/imperial-v12.test.mjs` — testes automatizados

## Compatibilidade e instalação
Esta é uma atualização **consolidada** sobre o ZIP da v10, destinada à pasta existente `silvengard-interactive-map`. Não contém o executável base do aplicativo. Para instalar, extraia o arquivo na **pasta que contém** `silvengard-interactive-map`, permitindo substituir os arquivos. Faça backup antes.

As texturas CC0 opcionais da v10 continuam sendo carregadas a partir de `app/dist/textures/cc0` caso o instalador `INSTALAR-TEXTURAS-CC0.bat` já tenha sido executado. Caso não, os shaders procedurais continuam disponíveis como fallback.

## Limitações explicitadas
- Não é uma réplica histórica literal de cada edifício; a geometria é procedural orientada por lugares.
- O túnel de Lorvus é uma passagem coberta física em uma crista com rebaixo, **não** um sistema mineiro subterrâneo completo.
- Os prédios não possuem interiores abertos nesta fase; o voo permanece disponível na cena local.
- Os NPCs são representações simples ao longo de ruas, não simulam uma economia urbana viva.
- A análise 3D foi feita com geometria real do Three.js e testes sem WebGL. A execução final no Windows **não foi testada** neste ambiente.

## Fontes da identidade local
- `Silvangad 5.0.map` e `world.json` do Atlas (nomes, localizações, população, fortalezas e linhas regionais)
- `Silvengard_Cronicas_do_Mundo_Conhecido_Edicao_Dinastica_1277_AQD.md` (história e divisões territoriais)
- pedido do autor para a mina de Lorvus e o castelo no cume de Castamor (novas diretrizes de arte)
