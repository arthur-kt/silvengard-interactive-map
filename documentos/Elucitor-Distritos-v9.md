# Elucitor — upgrade v9 dos distritos

## Ordem aplicada
Conforme solicitado, esta versão executa **primeiro o item 2** (aprofundamento visual dos distritos) e **depois o item 1** (primeiro pacote de materiais).

## 1) Identidade visual por distrito
Nesta versão, os distritos deixam de ser apenas zonas funcionais e passam a influenciar diretamente a aparência urbana.

### O que foi implementado
- **Paletas próprias por tipo de distrito** em `town.js`.
- **Variação arquitetônica local** nas casas instanciadas do tecido urbano.
- **Estilo dedicado para edifícios colocados dentro do distrito** (`warehouse`, `house`, `hall`, `smithy`, etc.).
- **Escala/volume do casario ajustados por distrito**:
  - `palace`: lotes maiores, casas mais monumentais.
  - `high`: casario um pouco mais alto e nobre.
  - `market`: adensamento e verticalização leve.
  - `harbour`: casario mais estreito e alto, com linguagem mais utilitária.
  - `temple`: tons claros e tratamento mais solene.
  - `craft`: aspecto mais sóbrio e funcional.
  - `residential`: casario mais baixo e caloroso.
  - `noble`: paleta e massa edificada mais aristocráticas.

### Resultado esperado em Elucitor
- **Cidade alta / palaciana**: mais pedra clara, telhados mais organizados, leitura mais monumental.
- **Mercado baixo**: mistura mais quente e densa, com energia comercial.
- **Porto e armazéns**: leitura mais robusta, terrosa e funcional.
- **Templo**: área mais clara, limpa e com sensação cerimonial.
- **Oficinas**: bairro mais sóbrio, levemente escurecido e prático.
- **Residências**: aparência mais cotidiana e orgânica.

## Arquivos alterados
- `app/dist/town.js`
- `app/dist/street.js`
