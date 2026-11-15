# Upgrade v20 — Campanhas e História da Campanha

Este upgrade foi desenvolvido **sobre o Atlas de Silvengard do ZIP enviado**, preservando a sua arquitetura (`app/dist` JavaScript, servidor local `app/serve.py`, fichas do módulo `characters.js` e jornadas do módulo `journeys.js`).

## Instalação rápida (Windows)

1. Feche o Atlas pelo ícone da bandeja, escolhendo **Sair (encerra o servidor)**.
2. Extraia o arquivo de upgrade em uma pasta (não execute de dentro do ZIP).
3. Execute `INSTALAR-UPGRADE.bat` dentro da pasta extraída. O instalador procura a pasta `silvengard-interactive-map` ao lado, na pasta superior, ou permite digitar o caminho.
4. Abra novamente `Silvengard-Atlas.exe` da instalação original e recarregue a página usando `Ctrl+Shift+R` se estiver aberta.

A instalação copia só os arquivos novos ou modificados, **sem substituir o mapa, cidades, texturas, fichas ou dados do mundo**. Os arquivos existentes substituídos são copiados para `upgrade-backups/campanhas-v20-<data>/` antes de serem atualizados. As campanhas já registradas em `app/campaigns` não são sobrescritas.

### Instalação manual

Se preferir, copie o conteúdo da subpasta `arquivos/` para a pasta-raiz `silvengard-interactive-map/`, preservando as subpastas. Salve antes cópias dos arquivos que serão substituídos. Não substitua a pasta inteira do seu Atlas pelo upgrade.

## O que foi adicionado

- **✦ Campanhas** no cabeçalho, com biblioteca de campanhas independentes e criação, exclusão, importação/exportação JSON.
- Página por campanha com **contexto inicial**, **situação atual**, **personagens da equipe**, **jornada**, **personagens importantes** e **história da campanha**, nessa ordem.
- **Fichas vinculadas por ID**, com acesso direto e botão **Atualizar ficha** (importação de uma versão mais recente `.cah`; preserva ID e até 3 versões anteriores no histórico). As fichas nativas criadas pelo Atlas continuam editáveis pelos recursos já existentes, mas não usam substituição de `.cah`.
- Associação da campanha a um **grupo do módulo Jornadas** existente ou criação de um grupo novo. Mostra posição atual, trechos efetivamente percorridos, quilômetros e acesso ao traçado no mapa.
- **◉ Jornadas visíveis / ◌ Jornadas ocultas** na barra de ferramentas do mapa, mais um controle por grupo na tela da campanha e no painel de Jornadas. O estado dos controles é salvo com as Jornadas.
- Cadastro de NPCs com função, facção, localização, descrição e edição.
- Acontecimentos por sessão, capítulo, local, data fictícia, tipo e narrativa, com linha do tempo, busca e edição. Textos aceitam `**negrito**`, `*itálico*`, linhas com `-` e títulos `#`.
- Arquivos JSON individuais em `app/campaigns/`, sincronização externa a cada 7,5 segundos **somente enquanto a tela estiver aberta**, botão **Sincronizar**, salvamentos atômicos, backups e proteção contra sobrescrita de alterações externas.

## Editar a história fora do Atlas

Abra `app/campaigns/<id-da-campanha>.json` em um editor de texto. Os campos mais úteis são `premise` (contexto), `summary` (situação atual), `npcs` (personagens importantes) e `events` (acontecimentos). Guarde a estrutura do JSON e mantenha o campo `id` inalterado. O Atlas relê o arquivo automaticamente enquanto a tela Campanhas estiver aberta ou ao clicar em **↻ Sincronizar**.

Para começar sem escrever o JSON do zero, use o botão **Importar campanha JSON** e escolha `documentos/EXEMPLO-CAMPANHA-1277.json` (incluso neste upgrade); o exemplo é identificado como tal e **não é importado automaticamente**.

Se outra janela ou um editor externo alterar o arquivo entre sua leitura e o clique em **Salvar** no Atlas, o servidor bloqueia a gravação e pede uma nova leitura. As versões anteriores são arquivadas em `app/campaigns/.backups/<id>/`. Campanhas excluídas também vão para esse backup, em vez de serem apagadas definitivamente.

## Onde cada tipo de dado fica

| Tipo | Armazenamento |
| --- | --- |
| Contexto, equipe, NPCs, acontecimentos | `app/campaigns/<id>.json` |
| Backup das campanhas | `app/campaigns/.backups/<id>/` |
| Posição, planos e trechos de Jornada | Módulo Jornadas (navegador, com exportação/importação de edição) |
| Fichas de personagem e versões anteriores | IndexedDB do navegador (módulo Fichas) |
| Mapa, cidades, texturas e lore existentes | Inalterados |

**Importante:** `Exportar edição` do mapa **não inclui** os JSON das campanhas. Para fazer uma cópia da campanha, use **Exportar JSON** dentro dela ou faça backup da pasta `app/campaigns`. A jornada é referenciada pelo `journeyPartyId`, mas os dados do trajeto continuam no próprio módulo Jornadas.

## Verificação

- Executar: `python -m unittest desenvolvimento/testes/test_campaign_service.py -v` a partir da raiz do projeto.
- O servidor mantém a política de acessar apenas `127.0.0.1`; escrita na API exige Origin/Host locais e hash de revisão.
- Não requer instalação de novas bibliotecas ou alteração do `Silvengard-Atlas.exe`.

### Compatibilidade e limites

- A persistência em arquivos requer executar o Atlas pelo seu **servidor local** (`Silvengard-Atlas.exe`, `Iniciar-Atlas.cmd` ou `python app/serve.py`), não abrindo `index.html` diretamente como `file://`.
- A atualização de ficha aceita arquivos **`.cah` JSON do D&D 5e Companion antigo**, formato já reconhecido pelo Atlas. Links `.rpg` de aplicativos diferentes não foram implementados neste upgrade.
- As campanhas são locais ao computador; não há sincronização online nem permissões multiplayer neste pacote.
