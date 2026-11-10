# Histórias no Atlas

O menu **Histórias** é a biblioteca geral do mundo. As fichas do mapa mostram a história diretamente junto das outras informações. Cidades, estados e províncias têm uma seção **História**; culturas e religiões mostram sua descrição no próprio cartão. **Ver história completa** ou **Ver informações completas** abre a página correspondente na biblioteca geral, como uma opção de leitura mais ampla.

## Apresentação

- Estados: identidade política breve, casa governante atual e capítulos da própria história, sempre abertos.
- Cidades e províncias: trecho da narrativa própria na ficha, com acesso opcional ao capítulo completo, sem herdar listas de localidades do estado.
- Capítulos: cartões de navegação e subtítulos; clique para ir ao trecho desejado.
- Cronologias locais: acontecimentos clicáveis, mantendo os anos ou eras escritos no texto. A cronologia geral continua disponível na biblioteca.
- Culturas, religiões e instituições: textos narrativos com navegação por região.

Notas editoriais, instruções de redação, pendências, observações cartográficas, diretórios técnicos e apêndices não aparecem na leitura. As histórias preservam seus acontecimentos e mistérios; não são inventadas datas ou histórias para preencher lacunas.

## Onde editar

Continue editando os três Markdown em `historic_archives`, na pasta principal `silvengard-atlas`:

- `Silvengard_Estados_Historias_Provincias_e_Cidades.md`
- `Silvengard_Culturas_Religioes_e_Instituicoes_Consolidadas.md`
- `Silvengard_Historia_Geral_e_Cronologia_Consolidada.md`

Salve o documento em UTF-8 e clique em **Atualizar histórias**. Fechar e reabrir a história também relê os arquivos. Não é preciso usar **Definir como padrão** ou enviar uma exportação.

Mantenha os identificadores `## Estado:`, `#### Província:`, `##### Cidade:` e os comentários com IDs dos estados. Os nomes devem acompanhar os nomes do mapa. O texto narrativo pode ser editado livremente. A apresentação limpa é gerada sem apagar os originais. A lógica dessa apresentação está em `history_presentation.py`.

As duas pastas do aplicativo têm a integração. A cópia `silvengard-atlas v2` consulta os arquivos da pasta principal enquanto não tiver sua própria pasta `historic_archives`.

O servidor local relê os documentos em `/api/history`. Para publicar como site puramente estático, execute `python history_archive.py` e publique também `dist/history-archive.json` após editar as histórias.
