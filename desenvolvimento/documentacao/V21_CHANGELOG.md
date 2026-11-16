# Silvengard Atlas — Changelog efetivamente implementado (v21)

**16/11/2026 | Base:** ZIP completo `silvengard-interactive-map.zip` enviado pelo usuário, com módulos v43/v44 e atualizações anteriores. Não houve regressão intencional de editor, economia, combate, fichas e mapas.

## Implementado

- Identificação estável dos quatro pilotos: **Elucitor 7, Castamor 1240, Velaffeld 1, Asgorath 3**.
- Pipeline residencial piloto único e sem cota (`legacyHouses` = 0 por roteamento de código): `town.js` envia centro, periferia e edifícios de funções urbanas aos modelos culturais v21. Não foram apagados os monumentos antigos históricos nem as outras 148 localidades.
- Grade espacial para detectar sobreposição, afastamentos por bairro, exclusão de ruas, água, palácios, falésias e terrenos inclinados; funções de residência, mansão, mercado/loja, taberna, hospedaria, estábulo, depósito, oficina, templo, edifício cívico e quartel.
- Construções culturais instanciadas com variantes de pavimentos, cobertura, chaminés, colunatas, sinais comerciais e variação de cor.
- Elucitor: palácio em setor afastado do porto, patamar alto com eixo processional; reservada a área de esplanada; preservados situação insular e a Catedral de Mátilla.
- Castamor: penhasco elevado, platô, fortaleza existente preservada, estrada serpenteante e loteamento da base.
- Velaffeld: continuidade dos eixos orgânicos élficos, bairros nobres mais vazios, jardins e árvores ornamentais.
- Asgorath: novo agrupamento régio/militar/comercial/residencial, sem alterar lago e soberania.
- Oito **GLBs originais** de árvores: carvalho antigo/jovem, bétula, pinheiro, abeto, cipreste, salgueiro e árvore florida. Modelo único por espécie, instancing, biomas específicos, variação de rotação/tamanho, fallback em erros HTTP/GLB, manifesto por cidade.
- Preservado gatilho de carregamento só após **Ver no local** / link explícito. Nenhum novo recurso GLB é solicitado ao abrir ficha ou mapa político.
- Auditoria com contadores (`architecture`, `urbanV21`, `forestV21`) via `window.__street.state()` em modo debug.

## Ainda pendente

- Modelos externos Quaternius/Kenney efetivamente baixados e inseridos; indisponibilidade de rede para binaries (não substituídos por conteúdo sem licença).
- Vistoria real no Silvengard-Atlas.exe/Windows e capturas in-game v20/v21; navegador automatizado do ambiente bloqueou acesso localhost.
- Medição real de FPS, draw calls GPU, triangles/frame, crescimento de memória em 10 visitas sucessivas.
- Expansão dos modelos de casas/árvores às demais localidades, que permanecem com os pipelines anteriores.
- Ajustes visuais finos de terrenos, rampas e vias com captura real de cena em Windows.
