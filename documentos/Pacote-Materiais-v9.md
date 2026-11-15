# Pacote de materiais v9

## Objetivo
Criar um **primeiro pacote integrado de materiais** para a visualização local, já preparado para evolução futura com bibliotecas externas.

## O que foi implementado
Foi adicionada uma nova camada de presets em `app/dist/material-presets.js`.

### Presets incluídos
- `default`
- `imperial`
- `elucitor-overview`
- `elucitor-palace`
- `elucitor-high`
- `elucitor-market`
- `elucitor-harbour`
- `elucitor-temple`
- `elucitor-noble`
- `elucitor-craft`
- `elucitor-residential`

## Onde os presets atuam
### Terreno (`localGroundMaterial`)
Agora o chão local aceita preset e controla:
- areia
- rocha
- áreas úmidas
- neve
- tom de relva
- base urbana
- destaque urbano
- pedra urbana
- terra urbana

### Ruas (`localRoadMaterial`)
Agora as ruas aceitam preset e controlam:
- pedra principal
- pedra secundária
- terra principal
- terra secundária
- neve sobre a via

## Resolução automática do preset
Em `street.js`, o preset é resolvido com base em:
- nome da cidade
- distrito focado
- padrão do blueprint
- arquitetura
- clima

Isso significa que, ao entrar em Elucitor, a cena local já troca automaticamente o material-base conforme o distrito selecionado.

## Observação importante
Este pacote é um **primeiro passo integrado de materiais** e ainda usa linguagem procedural/shader para manter desempenho e coerência. Ele foi preparado para, no próximo passo, receber texturas externas grátis/CC0 de bibliotecas como:
- ambientCG
- Poly Haven
- Kenney
- OpenGameArt (filtrando por licenças compatíveis)

Ou seja: nesta versão já existe a infraestrutura de materiais por contexto, e a próxima etapa pode plugar bibliotecas externas por categoria (telha, pedra, terra, cais, madeira, floresta, etc.).

## Arquivos alterados
- `app/dist/material-presets.js`
- `app/dist/local-scene.js`
- `app/dist/street.js`
