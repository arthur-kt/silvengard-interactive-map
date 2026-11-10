# Silvengard · Atlas vivo

**O mundo de Silvengard num mapa 3D que dá para explorar, editar e simular.**

![O Atlas aberto, com o mapa de culturas e os pincéis da edição do autor](documentos/imagens/atlas.jpg)

---

## O que é

Silvengard é um cenário de campanha de RPG. Este repositório é o **Atlas**: um mapa-múndi
tridimensional que roda no navegador, feito para o mestre consultar o mundo, mexer nele e
mostrar à mesa.

O mapa começou como exportação do [Azgaar's Fantasy Map Generator](https://azgaar.github.io/Fantasy-Map-Generator/)
e desde então foi trabalhado à mão: fronteiras, nomes, províncias, cidades, rotas, populações,
economia e história. Hoje é um programa com ferramentas de verdade — pincéis para repintar o
terreno, editor de cidades e de rotas, calculadora de jornadas, leitor das crônicas e um
simulador econômico com dez mercados regionais.

Tudo roda **na sua máquina**. O servidor escuta só em `127.0.0.1`; nada sai para a internet.

## Abrir

1. Dê dois cliques em **`Silvengard-Atlas.exe`**.
2. O navegador abre sozinho em `http://127.0.0.1:8765/`.
3. Para encerrar: botão direito no ícone da bandeja → **Sair**.

O ícone na bandeja também serve para **Parar** e **Reiniciar** o servidor — útil depois de mexer
em arquivos. Se o `.exe` for fechado de qualquer jeito, o servidor morre junto: nada fica perdido
em segundo plano.

| No terminal | O que faz |
| --- | --- |
| `Silvengard-Atlas.exe` | abre o Atlas com navegador |
| `Silvengard-Atlas.exe --start` | só liga o servidor |
| `Silvengard-Atlas.exe --stop` | encerra o servidor de qualquer sessão |
| `Silvengard-Atlas.exe --status` | diz se está aberto |
| `Silvengard-Atlas.exe --diagnostico` | grava `app/logs/diagnostico.txt` |

**Requisitos:** Windows e Python 3 instalado (o `.exe` procura sozinho, inclusive em
`%LOCALAPPDATA%\Programs\Python`). O Node já vem embutido em `app/runtime` — não precisa instalar.
Se a porta 8765 estiver ocupada, o Atlas sobe na próxima livre até 8785 e avisa no balão.

> **Clonou do GitHub?** O `app/runtime/node.exe` fica fora do Git (89 MB). O Atlas abre, navega e
> edita sem ele; só o botão **Definir como padrão** precisa desse binário. Nesse caso, copie o
> `node.exe` de uma instalação que já funciona, ou baixe o Node e coloque em `app/runtime/`.

**Plano B**, se o Windows bloquear o `.exe` (Smart App Control, antivírus): `Iniciar-Atlas.cmd`
liga o servidor do mesmo jeito, e `Encerrar-Atlas.cmd` desliga. O passo a passo completo, com
solução de problemas, está no [LEIA-ME.md](LEIA-ME.md).

## O que dá para fazer

| Ferramenta | O que faz |
| --- | --- |
| **Explorar** | mapa 3D com relevo, vegetação, rios, estradas, rotas marítimas, névoa de Valar, minimapa e busca por cidade ou estado |
| **Camadas** | liga e desliga vegetação, cidades, rios, estradas, fronteiras, pontos de interesse, nomes, barras de população, sombras, água animada — e ajusta o relevo |
| **Mapas temáticos** | político, população, províncias, cultura, religião e economia (mercados, bens produzidos, comércio, quantidade de um bem, preços) |
| **Editar mapa** | pincéis de político, bioma, vegetação, cultura e religião, com desfazer/refazer e tamanho de pincel |
| **Cidades** | ficha completa (população, tipo, fé, língua, perfil social, demografia, brasão), editor e ciclo de vida — criar cidade, conectar à rede, remover com segurança e reparar capitais |
| **Províncias** | 67 províncias com nomes e limites editáveis e prévia no mapa |
| **Rotas e jornadas** | inspetor de rotas com distância e tempo, edição de traçado, e calculadora de viagem por ritmo e velocidade de navio |
| **Histórias** | três documentos longos (história geral, estados e cidades, culturas e instituições) lidos dentro do próprio Atlas, ligados às fichas |
| **Economia** | dez mercados regionais, 85 bens, produção rural e urbana, consumo por classe social, preços locais, fluxos entre mercados, políticas marítimas e ciclos simuláveis |
| **Ver no local** | botão 👁 ou tecla **V**: você desce ao chão e caminha pelo ponto escolhido, com casas, ruas, muralhas, portos, torres e fortalezas gerados na hora conforme o clima — manhã, dia, entardecer e noite |

![Livro de comércio, com os dez mercados regionais](documentos/imagens/economia.jpg)

A **visão local** não altera nada dos dados: ela lê o mesmo `world.json` e constrói a cena em
código — não há modelos 3D guardados em disco. A mesma técnica de materiais procedurais gera
alvenaria, telhado, reboco, madeira e palha.

![Casas, torre e fortaleza geradas em código](documentos/imagens/vista-local.jpg)

## O mundo em números

| | |
| --- | --- |
| Grade do mapa | 480 × 234 — **112.320 células** de Voronoi |
| Extensão do mapa | 1920 × 937 |
| Estados | **20** entradas (19 com governo + as terras neutras) |
| Cidades e localidades | **152** |
| Províncias | **67** (30 com nome próprio do autor) |
| Pontos de interesse nomeados | **44** |
| Culturas | **23** |
| Religiões | **17** |
| Biomas | **13** |
| Rios | **152** |
| Rotas | **163** (144 terrestres + 19 marítimas) |
| Mercados regionais | **10** |
| Bens econômicos | **85** (83 ativos) |
| Brasões e emblemas | **265** brasões em SVG (de cidades e de estados) e **39** emblemas |
| Histórico de padrões salvos | **18** revisões |

## Como o mapa é feito

```
world.json  →  app/dist/*.js  →  three.js (WebGL)  →  navegador
```

- **Sem build.** O navegador carrega os módulos ES direto de `app/dist/`. Mexeu no arquivo,
  recarregou a página, mudou.
- **`app/dist/world.json`** é o mundo inteiro: células, vértices, estados, cidades, biomas,
  culturas, rios, rotas, pontos de interesse, províncias, economia e histórias.
- **`app/dist/*.js`** desenha o relevo, a água, as árvores e as sombras, e carrega os editores,
  a economia e o leitor de histórias.
- **three.js** está embutido em `app/dist/vendor/` — nada de CDN, funciona sem internet.
- **`app/serve.py`** é o servidor (`http.server` da biblioteca padrão), com duas rotas de API:
  as histórias e a gravação de padrões.
- **`app/runtime/node.exe`** só entra em cena ao usar **Definir como padrão**, para gravar os
  arquivos com backup.

## Estrutura do projeto

```
Silvengard-Atlas.exe     ← o único arquivo que você precisa abrir
Iniciar-Atlas.cmd        ← plano B, se o .exe não abrir
Encerrar-Atlas.cmd       ← plano B para encerrar

app/                     ← O PROGRAMA (não precisa mexer)
  dist/                    mapa, módulos, estilos, world.json, brasões
  serve.py                 servidor local
  historic_archives/       os três documentos de história
  runtime/node.exe         Node embutido, usado ao gravar padrões
  tools/bake-defaults.mjs  gravação dos padrões
  saved-author-defaults.json   histórico de padrões aprovados
  logs/                    registros de erro e do inicializador

dados/                   ← dados de referência e checkpoints das revisões
documentos/              ← catálogo, propostas, revisões, README técnico e imagens
desenvolvimento/         ← scripts de reconstrução, ferramentas, testes e o código do .exe
acervo/                  ← TUDO O QUE É HISTÓRICO (nada aqui é lido pelo programa)
  backups/                 uma cópia completa a cada padrão gravado
  edicoes/                 edições exportadas
  previas/                 imagens de prévia de cada revisão
  revisoes/                relatórios e verificações
  referencias/             desenhos do autor e capturas de tela
```

Regra simples: **se está em `acervo/`, é passado.**

## Salvar e voltar atrás

O botão **Definir como padrão** grava o mundo em `app/dist/world.json` e cria uma pasta nova em
`acervo/backups/defaults-AAAAMMDD-HHMMSS-…/` com o `world.json` de antes, o histórico de padrões
e a edição exata que você mandou salvar.

Para desfazer, copie o `world.json` daquela pasta para `app/dist/world.json` e recarregue com
`Ctrl+R`. Além disso, **Exportar edição** baixa um `.json` e **Importar** devolve — dá para trocar
edições entre sessões.

## Desenvolvimento

```bat
desenvolvimento\rodar-testes.cmd
```

São **37 arquivos de teste** (29 em JavaScript, 8 em Python) cobrindo o mundo canônico, a
economia, as rotas, a população, a edição de cidades e províncias e o leitor de histórias.

| Onde | O que tem |
| --- | --- |
| `desenvolvimento/` | scripts de reconstrução e verificação do mapa |
| `desenvolvimento/ferramentas/` | ferramentas de revisão, uma por etapa da economia e da história |
| `desenvolvimento/testes/` | a suíte; `base.mjs` resolve os caminhos da nova estrutura |
| `desenvolvimento/launcher/` | `Atlas.cs` — o código do `Silvengard-Atlas.exe` (compilado com `csc`) |

Guia de desenvolvimento, com o histórico de cada revisão: [desenvolvimento/LEIA-ME.md](desenvolvimento/LEIA-ME.md).

## Documentação

| Documento | Para quê |
| --- | --- |
| [LEIA-ME.md](LEIA-ME.md) | manual de uso: abrir, encerrar, backups, problemas |
| [documentos/README.md](documentos/README.md) | documento técnico completo, revisão por revisão |
| [documentos/Catalogo-de-Silvengard.md](documentos/Catalogo-de-Silvengard.md) | catálogo do mundo |
| [documentos/Historias-do-Atlas.md](documentos/Historias-do-Atlas.md) | como as crônicas alimentam a aba Histórias |
| [documentos/Silvengard-Economia-e-Mercados.md](documentos/Silvengard-Economia-e-Mercados.md) | a economia por dentro |

## Licença e créditos

Código e dados sob licença **MIT** — veja [LICENSE](LICENSE). © 2026 Arthur Kafrouni Tomazi.

- Mapa-base: [Azgaar's Fantasy Map Generator](https://azgaar.github.io/Fantasy-Map-Generator/)
- Brasões: [Armoria](https://azgaar.github.io/Armoria/), adaptado — veja
  `desenvolvimento/ferramentas/armoria/LICENSE` e `LOCAL-ADAPTATIONS.txt`
- Renderização 3D: [three.js](https://threejs.org/) (MIT), embutido em `app/dist/vendor/`

> Silvengard é um mundo fictício. Nomes, povos, dinastias e a economia inteira saíram de uma
> campanha de mesa — qualquer semelhança com lugares reais é coincidência de mapa.
