# Plano de upgrade de texturas — fase 1

## Objetivo

Melhorar a qualidade visual geral do Atlas, começando pelas texturas e superfícies mais impactantes na leitura do cenário.

Como o sistema atual usa muitos materiais procedurais, o upgrade ideal não é apenas “trocar imagens”, mas criar uma **biblioteca base de materiais** organizada por uso.

## Prioridade desta fase

### 1. Primeiro foco
**Visual ilustrativo / leitura estilizada do protótipo**

Isto significa priorizar materiais que melhorem:
- solo urbano;
- ruas;
- pedra de muralhas e cidadelas;
- madeira de casas e docas;
- telhados;
- vegetação base.

### 2. Fase seguinte
Depois disso, expandir para:
- casas e módulos específicos por cultura;
- florestas;
- materiais do mapa explorável em escala maior;
- materiais do mundo principal fora da interface interativa.

## Bibliotecas grátis recomendadas

### A. Poly Haven
Melhor para:
- pedra realista;
- pavimento;
- madeira;
- solo;
- materiais PBR de alta qualidade.

Pontos fortes:
- excelente qualidade;
- biblioteca consistente;
- ideal para muralhas, cais, ruas e rochas.

Licença:
- **CC0**.

### B. ambientCG
Melhor para:
- materiais PBR variados;
- solo, lama, pedra, reboco, madeira, metal.

Pontos fortes:
- enorme volume de materiais;
- útil para cobrir quase todos os slots do projeto.

Licença:
- gratuito para uso livre.

### C. cgbookcase
Melhor para:
- superfícies arquitetônicas;
- madeira, pedra, alvenaria e chão.

Pontos fortes:
- boa curadoria;
- fácil de separar por categoria.

Licença:
- **CC0**.

### D. Kenney
Melhor para:
- texturas mais estilizadas;
- padrões, packs modulares e recursos visuais mais “game-ready”.

Pontos fortes:
- excelente para a camada mais ilustrativa / stylized;
- bom para testes rápidos de direção de arte.

Licença:
- **CC0** nos asset pages.

### E. OpenGameArt
Melhor para:
- buscar recursos complementares;
- estilização específica;
- alternativas para elementos menos centrais.

Pontos de atenção:
- verificar a licença individual de cada asset;
- preferir CC0 ou CC-BY quando quisermos integração simples.

## Organização recomendada dos materiais

Criar uma biblioteca local com esta estrutura:

- `materials/ground/`
- `materials/roads/`
- `materials/stone/`
- `materials/wood/`
- `materials/roofs/`
- `materials/foliage/`
- `materials/water/`
- `materials/special/elucitor/`

## Aplicação sugerida por cidade / contexto

### Elucitor
- pedra imperial clara para muralhas e terraços;
- ruas de laje / pavimento de capital;
- madeira portuária nas docas;
- telhados em tons quentes e nobres.

### Dragonfall / cidades anãs / vulcânicas
- basalto, ardósia, metal escurecido;
- pedra pesada e monumental.

### cidades élficas
- pedra clara, madeira refinada, cobertura suave;
- vegetação mais integrada à arquitetura.

### pântano / marsh
- madeira úmida, passarelas, lama, juncos.

### ermos / mapa explorável
- grama, terra batida, rocha exposta, areia, neve conforme bioma.

## Plano técnico recomendado

### Etapa 1
Montar a shortlist de materiais por categoria.

### Etapa 2
Integrar primeiro apenas estes grupos:
- chão urbano;
- ruas;
- pedra;
- madeira;
- telhados.

### Etapa 3
Criar presets por cultura / padrão urbano.

### Etapa 4
Expandir para vegetação, elementos especiais e mundo explorável.

## Conclusão

A melhor abordagem é fazer isso em camadas.

**Primeiro:** consolidar a identidade visual base do protótipo.

**Depois:** especializar por cidade, cultura e bioma.

Com isso, Elucitor e as demais cidades passam a ganhar não só mais detalhe, mas também mais identidade própria.
