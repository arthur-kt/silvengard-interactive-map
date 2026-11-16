# Pipeline urbano real após a implementação v21

## Ponto de entrada e carregamento

1. `app/dist/app.js` mantém `ensureStreetEngine()` como `import('./street.js?v=20.0')`: só é acionado ao usar o botão **Ver no local** ou o link explícito `?local=<ID>`.
2. `street.js` lê o blueprint, entra no carregador existente `city-assets-v19.js`, constrói `siteFor`, `createField`, `lay`, importa terreno e gera construções.
3. Para os IDs 1, 3, 7 e 1240, `urban-v21-core.js` aplica perfil e reservas locais **antes** do campo de alturas, depois de aplicar blueprint urbano.
4. `town.js` calcula distritos, vias e monumentos. `put()` agora encaminha **todos** os lotes de construção nos quatro pilotos à lista `prefabSlots`; fora dos pilotos, segue o pipeline anterior.
5. `addFabric()` bifurca por `lay.v21`: os pilotos usam `generateFabricSlotsV21()` em `urban-v21-fabric.js`, com grade espacial, largura de rua, reserva de monumentos, separação social e funções do lote. **Não existe cota de 340 casas aplicada nos pilotos.** As demais cidades permanecem usando sua lógica anterior, sem regressão.
6. `city-architecture-v21.js` consome integralmente a lista de lotes; reaproveita a geometria cultural multipeças de `createArchitecturalPrefab` (v20), adiciona sinalização funcional, chaminés e colunatas instanciadas; devolve contadores de residências, funções e templates.
7. `urban-v21-forest.js` só é chamado na visão local; busca `city-assets/v21/<ID>.json` e os oito modelos GLB **locais**, decodificados por `city-glb-v21.js`. InstancedMesh por espécie e fallback novo cultural em caso de 404/corrupção.
8. `street.js` atualiza estatísticas de auditoria e descarta a cena em `disposeScene()`; texturas/meshes são liberados junto ao restante do runtime local.

## Cidades piloto

| ID | Perfil | Regra especial |
|---:|---|---|
| 7 | imperial-capital-v21 | Palácio na extremidade oposta ao porto e em patamar elevado. Catedral de Mátilla e ilha preservadas. |
| 1240 | fortress-cliff-v21 | Penhasco a 148 m, platô 116 m, raio 405 m, estrada sinuosa de 1,7 voltas; casas quase só na base. |
| 1 | high-elf-organic-v21 | Avenidas orgânicas, bosques e jardins nobres. Palácio Aelvaris e Pedra Áurea preservados. |
| 3 | northern-royal-v21 | Fortificação real, praça comercial, militar e casario nortenho. Lago das Lágrimas preservado. |

## Arquivos existentes que NÃO foram substituídos

`world.json`, `city-blueprints.json`, `history-archive.json`, `app.js`, `local-scene.js`, `urban-v7-art.js`, `imperial-v12-art.js`, `dragonfall-v14-art.js`, `settlements.js`, dados econômicos, editor de mapa e fichas 5e, entre outros. Não renumerar cidades. O projeto-fonte já continha código de versões posteriores ao v20, e foi mantido.

## Limitação técnica

A arquitetura v21 em edifícios é original/procedural instanciada, NÃO Kenney ou outros GLBs externos. O GLB de árvores também é original, pois não foi possível recuperar arquivos binários externos. A integração Quaternius/Kenney continua pendente.
