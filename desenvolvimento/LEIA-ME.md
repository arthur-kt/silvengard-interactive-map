# Desenvolvimento do Atlas

Scripts que reconstroem, verificam e testam o mapa. **Nada aqui é necessário para jogar.**

## Estrutura

```
desenvolvimento/
  convert.py               reconstrói app/dist/world.json a partir de ../Mapas
  world_updates.py         curadoria aplicada sobre a conversão
  reference_rebuild.py     reconstrução guiada pelas referências do autor
  author_defaults.py       padrões do autor (cidades/mapa)
  city_defaults.py, market_defaults.py, network_defaults.py,
  scenario_defaults.py, canonical_world.py, source_profiles.py,
  latest_author_defaults.py, prepare_heraldry.py
  verify_geography.py      confere rios, costas, biomas e localidades
  verify_author_defaults.py confere os padrões aprovados contra o arquivo
  ferramentas/             scripts de revisão (v15…v43) e a biblioteca Armoria
  launcher/                código-fonte e ícone do Silvengard-Atlas.exe
  testes/                  testes automatizados (Node + Python)
  rodar-testes.cmd         roda todos os testes de uma vez
```

## Testes

```
desenvolvimento\rodar-testes.cmd
```

ou manualmente:

```
app\runtime\node.exe desenvolvimento\testes\travel.test.mjs
python desenvolvimento\testes\test_history_archive.py
```

Os testes resolvem os caminhos por `desenvolvimento/testes/base.mjs` (Node) e
`desenvolvimento/testes/caminhos.py` (Python), que procuram os arquivos em `app/`,
`dados/`, `documentos/` e `acervo/`. Se você mover arquivos entre essas pastas,
ajuste as listas `LOCAIS` nesses dois arquivos.

## Reconstruir o mapa

```
python desenvolvimento\convert.py
```

`convert.py` lê `../Mapas` e `../Emblemas e mapas` (pastas ao lado do repositório) e
grava em `app/dist/`. Depois rode `python desenvolvimento\verify_geography.py`.

## Recompilar o inicializador (opcional)

Só é necessário se você mudar `launcher/Atlas.cs`:

```
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:winexe /optimize+ ^
  /out:..\Silvengard-Atlas.exe /win32icon:launcher\atlas.ico ^
  /r:System.Windows.Forms.dll /r:System.Drawing.dll launcher\Atlas.cs
```

## Scripts históricos

`ferramentas/` guarda os scripts que aplicaram as revisões v15 a v43. Eles foram
escritos para a estrutura antiga (tudo na raiz) e **já cumpriram sua função**: a
maioria altera `app/dist/world.json` no lugar e não deve ser rodada de novo, sob pena
de aplicar a mesma revisão duas vezes. Ficam aqui como registro do que foi feito.

Se precisar reexecutar algum, confira antes os caminhos no topo do arquivo
(`parents[2]` aponta para a raiz do repositório; o programa está em `app/`).

## Observações

- `verify_geography.py` foi escrito para a malha da revisão 9; ele passa com
  `--world acervo\backups\v10\world.json` e falha com o `world.json` atual porque a
  geografia mudou nas revisões seguintes (a asserção de fortes élficos é o exemplo).
- `documentos/README.md` é o histórico técnico completo, escrito na estrutura antiga;
  os caminhos citados lá (`dist/`, `backups/`, `tests/`, `tools/`) hoje correspondem a
  `app/dist/`, `acervo/backups/`, `desenvolvimento/testes/` e
  `desenvolvimento/ferramentas/`.
