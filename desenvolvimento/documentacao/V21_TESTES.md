# Silvengard Atlas — Testes executados na v21

**16/11/2026.** Testes executados no container Linux/Node e Python. **Não são testes Windows, WebGL ou comparações visuais dentro do jogo.**

## Verificações que passaram

- Sintaxe de todos os arquivos JS da distribuição verificada via `node --check` (consulte log automático).
- Parsing binário glTF 2.0: 8/8 GLB carregados com vértices, cores e triângulos válidos.
- `mountArchitecturalKitV21`: 47 lotes de teste, 11 tipos distintos, 36 draw calls nas amostras unitárias.
- `mountPilotForestV21`: quatro biomas com instancing real e GLBs locais (4–5 draw calls por teste de floresta); 404 simulada produziu fallback cultural e não travou.
- Simulação de `buildTownV2` com **blueprints reais** e terreno/máscaras de cenário simulados (campo de altura sintético). A contagem não garante geometria idêntica no Windows.

| ID | Cidade | Lotes v21 | Residências | Funções urbanas | legacyHouses |
|---:|---|---:|---:|---:|---:|
| 7 | Elucitor | 1501 | 1167 | 334 | 0 (pipeline) |
| 1240 | Castamor | 326 | 256 | 70 | 0 (pipeline) |
| 1 | Velaffeld | 1451 | 1119 | 332 | 0 (pipeline) |
| 3 | Asgorath | 1473 | 1086 | 387 | 0 (pipeline) |

## Evidências de integridade

- `world.json`: SHA-256 `1b1ec2f213ca4413678d946a5ffd379205fdde5ff0591ebeae9969cf0cf6b735`, **não editado**.
- `city-blueprints.json`: SHA-256 `34d8b29a7708f0a9ddbc23cf053500f84c7e9b0ebda8e8bb9ee69a6ba6b9bffe`, **não editado**.
- Identidade das localidades 7/1240/1/3 obtida por ID, não por posição no vetor.
- Preservado `ensureStreetEngine()` como import dinâmico no botão `Ver no local`.

## Limitações dos testes

- O Chromium do container retornou `net::ERR_BLOCKED_BY_ADMINISTRATOR` ao acessar `127.0.0.1`, portanto não foi possível capturar imagens reais do Atlas nem certificar FPS.
- O executável `.exe` não foi executado em Windows; wrapper original mantido intacto.
- A validação precisa ser repetida no computador do usuário: mapa → ficha (sem rede 3D) → Ver no local → cidade → saída → repetição por 10 vezes.
- Verificar visualmente que o palácio de Elucitor ocupa a extremidade alta, que Castamor tem caminho contínuo até o castelo e que os espaços nobres estão desobstruídos.
- Verificar em F12/Rede a ausência de `assets/optimized` antes do clique; após o clique, o manifesto v21 e GLBs da cidade devem aparecer.
