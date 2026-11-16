# Silvengard Atlas — Registro de assets 3D (v21)

**Data:** 16/11/2026. **Cenário:** 1277 AQD.

## Itens REALMENTE incluídos

Os oito modelos abaixo são **modelos 3D originais elaborados para esta atualização**, por geração de malhas com o script `desenvolvimento/ferramentas/gerar_arvores_v21.py`. Não são modelos baixados de Quaternius, Kenney ou Poly Haven. O Atlas pode redistribuí-los como parte deste projeto; não há dependência de CDN.

Malhas: glTF 2.0 binário (.glb), autossuficiente, uma malha por espécie, cores nos vértices, sem texturas externas. Unidade de origem = metro; conversão a 2,2 m/unidade de cena. Renderer específico: `app/dist/city-glb-v21.js` (leitura simplificada de uma malha triangular, sem suporte a todas as extensões glTF).

| Arquivo | Altura original | Tamanho | SHA-256 |
|---|---:|---:|---|
| `assets/optimized/vegetation/oak-old.glb` | 9.44 m | 46404 bytes | `74ac0297484ce6a91067818c97bd71cc678673f6f452ea0da58839bf67cd2ed8` |
| `assets/optimized/vegetation/oak-young.glb` | 8.23 m | 35884 bytes | `6da060db727a02f5b7e987febaf546e17accf253a658c798f7e12ae55b80ef7e` |
| `assets/optimized/vegetation/birch.glb` | 9.28 m | 50904 bytes | `c25372714a1d3a29128044751e4f4015f5b7919a6007646817df8afaa479fcac` |
| `assets/optimized/vegetation/pine.glb` | 10.42 m | 6572 bytes | `1ae2ffc07ac98c11bff60fe8993348a424114f8b23c4d4ac935a1ad13e6cb997` |
| `assets/optimized/vegetation/spruce.glb` | 9.21 m | 6572 bytes | `d5ef9cef06cc9cfb19ca8ddc958a8f7f58a58572273c34b8c55775c6058700dd` |
| `assets/optimized/vegetation/cypress.glb` | 10.15 m | 7956 bytes | `e7798174629817137a624fbe86c4e71e48a805417c9065bb2233b54c7c6818b0` |
| `assets/optimized/vegetation/willow.glb` | 9.39 m | 46404 bytes | `e0a219bece65335daf9b659df4a519efd6d0387a969eaee5bb1f079cf53482ee` |
| `assets/optimized/vegetation/blossom.glb` | 7.28 m | 35880 bytes | `f5eb492bb4aef3c7206afacc6170eba58a53d85d6c0880b9cc33597f93551fd3` |

## Bibliotecas/ferramentas utilizadas na geração

- Python + `trimesh` (ferramenta de autoria; não é dependência de execução do Atlas).
- `three.module.js` (Three.js r170) já incluído no projeto-base; seu aviso MIT permanece junto ao código vendorizado.
- Texturas ambientais anteriores: mantidas de forma idêntica; ver `INSTALAR-TEXTURAS-CC0.bat` e documentação histórica.

## Pacotes externos previstos, mas NÃO integrados

Conforme o roteiro original, ainda se deseja integrar modelos externos de árvores **Quaternius Stylized Nature MegaKit** e edifícios **Kenney Fantasy Town Kit / Castle Kit**, preservando o estilo visual. Não foram adicionados neste ZIP: o ambiente de desenvolvimento não conseguiu recuperar os pacotes de origem. Não declarar esses modelos como baixados, licenciados individualmente, otimizados ou testados aqui.

Fontes para a etapa pendente: https://quaternius.com/ ; https://kenney.nl/assets ; https://polyhaven.com/ ; https://ambientcg.com/ . Antes de importar, verificar licença, versão, transformação, footprint, GLB, triângulos, instancing e direito de redistribuição. O carregador v21 incluído só suporta a subclasse simples de GLBs gerados; converter formatos externos antes de substituir os modelos.
