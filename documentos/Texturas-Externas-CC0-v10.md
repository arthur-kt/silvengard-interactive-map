# Silvengard v10 — Texturas CC0 externas

## Implementado

O Atlas agora consegue usar **imagens reais** de uma biblioteca CC0, adicionadas em `app/dist/textures/cc0/`. A integração é opcional: quando as imagens não estão disponíveis, os materiais procedurais anteriores continuam funcionando. Os shaders misturam parte da imagem ao padrão procedural, preservando a identidade cultural das cidades.

A integração foi feita para os materiais da **visão local 3D**, não para o mapa político/interativo do mundo.

## Instalação em Windows (com internet)

1. Descompacte o ZIP de upgrade **na pasta que contém** `silvengard-interactive-map`, substituindo os arquivos anteriores.
2. Entre em `silvengard-interactive-map`.
3. Clique duas vezes em **`INSTALAR-TEXTURAS-CC0.bat`**. O script PowerShell baixa 7 pacotes oficiais CC0 em qualidade 1K-JPG e extrai somente o mapa de cor de cada material.
4. Abra `Silvengard-Atlas.exe` normalmente.

**Atenção:** os arquivos JPEG das texturas não estão no ZIP porque o ambiente de criação não conseguiu baixar as fontes externas. O `.bat` faz o download no computador do usuário. Precisa de internet na primeira execução do instalador; após isso, funciona offline. Caso algum download falhe, o Atlas volta ao material procedural anterior sem travar.

## Materiais oficiais usados

| Slot do Atlas | Material do ambientCG | Uso | Link |
| --- | --- | --- | --- |
| paving.jpg | PavingStones036 | ruas e pavimentos de pedra | https://ambientcg.com/view?id=PavingStones036 |
| stone.jpg | Bricks001 | alvenaria de pedra/tijolo | https://ambientcg.com/view?id=Bricks001 |
| rock.jpg | Rocks001 | reserva de pedra para melhorias futuras | https://ambientcg.com/view?id=Rocks001 |
| wood.jpg | Planks001 | madeira em construções | https://ambientcg.com/view?id=Planks001 |
| roofing.jpg | RoofingTiles001 | telhas e coberturas | https://ambientcg.com/view?id=RoofingTiles001 |
| ground.jpg | Ground103 | solo, textura urbana e paisagens locais | https://ambientcg.com/view?id=Ground103 |
| mud.jpg | Ground051 | reserva de lama para biomas úmidos | https://ambientcg.com/view?id=Ground051 |

Fonte e licença: **ambientCG CC0 1.0** — https://docs.ambientcg.com/license/

As imagens originais são baixadas diretamente dos domínios de ambientCG. Este projeto não depende de conexão permanente à biblioteca nem de suas APIs em tempo de execução. O script faz download sob solicitação local e não distribui as imagens dentro do ZIP.

## Alterações no código

- `app/dist/cc0-textures.js`: cache / fallback / carregamento sob demanda das imagens locais.
- `app/dist/settlements.js`: edifícios 3D fundidos (pedra, madeira, reboco, telhados).
- `app/dist/town.js`: malha instanciada de casas e telhados.
- `app/dist/local-scene.js`: solo e ruas da visão local.
- `app/dist/street.js`: pré-carregamento e ativação dos materiais ao entrar numa localidade.
- `app/dist/material-presets.js`: preservado o sistema de paletas culturais da v9.

## Limitações

- Nesta versão usam-se mapas de **cor/albedo 1K**, não o conjunto PBR completo de normal/roughness/displacement.
- As imagens aparecem com mistura de cor para evitar substituir completamente o estilo artístico do Atlas.
- Telhados de todos os tipos usam a mesma base fotográfica; materiais próprios por cultura são um passo posterior.
- `rock.jpg` e `mud.jpg` são baixadas como reserva para as próximas expansões, ainda não entram nos shaders atuais.
- Não houve teste visual de WebGL no aplicativo Windows; foram executados testes estáticos e de geração de cidades.
