# Elucitor v8 — visão geral + entrada por distritos

## O que foi implementado

Nesta versão, Elucitor deixa de ser tratada apenas como uma única massa urbana compacta.

Agora, ao clicar para entrar em **Elucitor**, a interface abre um **seletor de escala urbana** com duas opções de uso:

1. **Visão geral da capital**
   - mantém a leitura da cidade inteira;
   - preserva a noção de Elucitor como capital insular gigantesca;
   - usa uma ampliação moderada da escala para evitar compressão excessiva.

2. **Entrada por distrito**
   - abre uma versão **distrital ampliada**;
   - reduz a sensação de densidade artificial;
   - dá mais espaço para leitura urbana, circulação e ambientação.

## Distritos expostos no seletor

- Cidade Alta / Palácio
- Bairro Alto
- Mercado Baixo
- Porto e Armazéns
- Distrito do Grande Templo
- Distrito Nobre
- Oficinas e Mercado Secundário
- Cidade Baixa

## Efeito prático no protótipo

- Elucitor agora tem uma **camada de navegação urbana em duas escalas**.
- A HUD mostra quando a visita está em **visão geral** ou em **foco distrital**.
- O perfil urbano da cidade também informa quando a cena está usando um **corte distrital ampliado**.
- O ponto inicial do jogador, quando um distrito é escolhido, tenta nascer já próximo do setor correspondente.

## Por que isso melhora Elucitor

A cidade é descrita como a maior do mundo. Em escala única, isso tende a causar um destes problemas:

- ou a cidade fica compactada demais;
- ou perde-se legibilidade;
- ou a experiência local não transmite a monumentalidade esperada.

A solução por distritos conserva a noção de **macrocapital** sem sacrificar a experiência **micro-urbana**.

## Próximo passo recomendado

O próximo passo ideal é aprofundar a identidade visual de cada distrito com:

- paletas próprias;
- materiais próprios;
- tipologia de edifícios por setor;
- microdecoração contextual (docas, templos, mercados, pátios nobres, oficinas, etc.).
