# Histórias no Atlas

O menu **Histórias** é a biblioteca geral do mundo. As fichas do mapa mostram a história diretamente junto das outras informações. Cidades, estados e províncias têm uma seção **História**; culturas e religiões mostram sua descrição no próprio cartão. **Ver história completa** ou **Ver informações completas** abre a página correspondente na biblioteca geral, como uma opção de leitura mais ampla.

## Apresentação

- Estados: identidade política breve, casa governante atual e capítulos da própria história, sempre abertos.
- Cidades e províncias: trecho da narrativa própria na ficha, com acesso opcional ao capítulo completo, sem herdar listas de localidades do estado.
- Capítulos: cartões de navegação e subtítulos; clique para ir ao trecho desejado.
- Cronologias locais: acontecimentos clicáveis, mantendo os anos ou eras escritos no texto. A cronologia geral continua disponível na biblioteca.
- Culturas, religiões e instituições: textos narrativos com navegação por região.
- **Linhagens**: cada casa tem sua própria página, com árvore genealógica interativa e a régua de reinados do Estado. A aba **Linhagens** reúne as 35 casas e conselhos dos dezenove Estados.
- **Cronologia**: as quatro eras, agrupadas por século, com busca dentro da era e navegação por ↑ e ↓.
- **Leitura**: voltar ao verbete anterior, tamanho de texto ajustável, barra de progresso e capítulo ativo destacado no sumário.

Notas editoriais, instruções de redação, pendências, observações cartográficas, diretórios técnicos e apêndices não aparecem na leitura. As histórias preservam seus acontecimentos e mistérios; não são inventadas datas ou histórias para preencher lacunas.

## Onde editar

Continue editando os três Markdown em `historic_archives`, na pasta principal `silvengard-atlas`:

- `Silvengard_Estados_Historias_Provincias_e_Cidades.md`
- `Silvengard_Culturas_Religioes_e_Instituicoes_Consolidadas.md`
- `Silvengard_Historia_Geral_e_Cronologia_Consolidada.md`

Salve o documento em UTF-8 e clique em **Atualizar histórias**. Fechar e reabrir a história também relê os arquivos. Não é preciso usar **Definir como padrão** ou enviar uma exportação.

## Linhagens e sucessões

Cada Estado pode ter uma seção `### Casas, sucessões e linhagens`, colocada antes das províncias. As casas aparecem como subseções `#### Casa …` e a árvore é escrita em um bloco cercado por três crases com a etiqueta `linhagem`:

```
```linhagem
casa: Casa Dragonbane
sede: Asgorath
tipo: Casa real · monarquia eletiva
nota: Texto curto de abertura.
- Garrick III Dragonbane | rei | 1224–1249 | Morreu no trono.
  - Arthur Dragonbane | rei | 1249–presente | Independência em 1262. | par=Elenna Sunhill
    - Alaric Dragonbane | príncipe | n. 1264
```
```

Os campos depois do nome são opcionais: papel, período, observação e `par=` para o consorte. A indentação de dois espaços cria os ramos; a linha `- ⋯ | gerações intermediárias` marca uma lacuna que a crônica não registra. O bloco não aparece como código na leitura: ele vira a árvore interativa.

As réguas de reinado não são escritas à mão. Elas são lidas das tabelas da narrativa cujo cabeçalho tenha **Reinado**, **Governo** ou **Período**. Por isso, ao corrigir um reinado na tabela, a régua acompanha. Tabelas sem coluna de casa usam a casa indicada no título (`Soberano da Casa Lucien`, por exemplo).

## Integração de 1277 AQD

O guia `Silvengard_Guia_Integracao_Atlas_Linhagens_Guerras_Sucessoes_1277_AQD.md` foi incorporado por `desenvolvimento/ferramentas/integrar_historia_1277.py`, que lê o guia e insere:

- a história geral e as guerras de fronteira no volume do mundo;
- 60 marcos novos na cronologia continental (98 no total), sem repetir os antigos;
- os capítulos dos dezenove Estados na **História integral** de cada um;
- os textos de cidades, ruínas e montanhas da Parte IV nos verbetes já existentes;
- as instituições da Parte V nas seções de instituições de cada Estado.

O script é idempotente e usa comentários marcadores (`INTEGRACAO_1277_…`, `1277:lugar:…`). As árvores ficam em `linhagens_1277.py`. O backup anterior à integração está em `acervo/backups/v47-before-historia-1277`.

Mantenha os identificadores `## Estado:`, `#### Província:`, `##### Cidade:` e os comentários com IDs dos estados. Os nomes devem acompanhar os nomes do mapa. O texto narrativo pode ser editado livremente. A apresentação limpa é gerada sem apagar os originais. A lógica dessa apresentação está em `history_presentation.py`. A leitura das árvores e das réguas está em `history_archive.py` (dados) e `dist/history-lineage.js` (interface).

As duas pastas do aplicativo têm a integração. A cópia `silvengard-atlas v2` consulta os arquivos da pasta principal enquanto não tiver sua própria pasta `historic_archives`.

O servidor local relê os documentos em `/api/history`. Para publicar como site puramente estático, execute `python history_archive.py` e publique também `dist/history-archive.json` após editar as histórias.

## Nova ordem de leitura (v48)

**História do mundo** começa por uma abertura de **1277 AQD**: o ano, a Quarta Era, os dezenove Estados e a Paz Armada. Em seguida vêm os atalhos **Mitologia e criação**, **Cronologia completa** e **Os dezenove Estados**, a **linha do tempo interativa** (com as quatro eras) e só então os capítulos, agrupados em **Mitologia e criação**, **As eras e os reinos**, **Casas soberanas e o presente** e **Memórias, lugares e mistérios**. Amestris deixou de ser a primeira coisa que o leitor vê.

**Cada Estado** abre com **Como está hoje**: identidade, governo, casa governante e fatos rápidos (capital, casas, marcos). Depois vêm as casas e os sucessores (com a régua de reinados recolhida), a **linha do tempo do Estado** e os capítulos em blocos: **O Estado e suas instituições**, **Origens e Era dos Dragões**, **Era dos Impérios**, **Era Contemporânea**, seguidas das árvores de **Casas, sucessões e linhagens** e de **Instituições e ofícios**.

## Descrições das localidades do mapa

As 44 localidades marcadas no mapa — lagos, montanhas, florestas, ruínas, mares e a Angra dos Goblins — têm descrição própria em `dist/locality-descriptions.json`. O Atlas carrega esse arquivo ao abrir e o aplica aos pontos de interesse, que antes apareciam como “Sem descrição”. A mesma descrição foi gravada nos verbetes de **Pontos de interesse** dos Estados, para que a aba Histórias conte a mesma versão.

- Angra dos Goblins: região florestal nevada, com ruínas, fortalezas abandonadas e criaturas; distinta de Crild.
- Ask-Lozard, Ruínas de Amestris, Bosque de Bomaria, Alnien, Monte Ganir e as demais receberam textos de 2 a 4 frases, sem inventar datas ou linhagens.
- Para alterar uma descrição, edite `app/dist/locality-descriptions.json` e rode `python desenvolvimento/ferramentas/descrever_localidades.py` para atualizar os verbetes. As descrições não mexem em posições, fronteiras ou economia.

O teste `locality-descriptions.test.mjs` confere que todas as localidades do mapa têm descrição e que nenhuma usa o texto genérico antigo.

## Conflitos e guerras (v49)

A aba **Conflitos**, ao lado de Instituições, reúne **24 guerras, revoltas, cercos e ocupações** dos dezenove Estados. Cada ficha mostra:

- nome, tipo, período e lugar;
- **resultado** e vencedor político;
- **força total** e **baixas totais**;
- **comandantes**, **força** e **baixas de cada lado**;
- **objetivos** do conflito e de cada lado;
- um resumo narrativo e atalhos para os Estados envolvidos.

Os efetivos e as baixas são **estimativas de campanha** do Atlas, marcadas com `~` e com um aviso na própria ficha: a crônica não registra números exatos. Elas servem de referência para a mesa, não como censo. Datas, resultados e comandantes seguem o cânon do guia.

Os dados ficam em [conflicts-source.json](../app/dist/conflicts-source.json); o gerador calcula os totais a partir dos lados. Para acrescentar uma guerra, copie um bloco, ajuste `id`, `sides` e `result` (`victory`, `conquest`, `repression`, `truce`, `compromise`, `defeat`, `liberation`, `occupation` ou `indecisive`) e rode `python app/history_archive.py`.

> **Nota de nomes:** o rei conhecido como **Corvo Colérico** é **Tiberius Rodstrock** (558–585 AQD). O nome antigo foi substituído nos arquivos, nas tabelas, nas árvores e no guia.

