# Composição social, bens e trabalho — revisão 42

## Onde consultar

Clique em uma cidade e abra **Cultura e sociedade → Composição social · consultar**. A ficha mostra os cinco estratos, percentuais e número estimado de pessoas. Para alterar, use **Editar cidade → Composição social e renda estimada**. Nas localidades pertinentes, também aparece o percentual de população escravizada, incluído no estrato de trabalhadores comuns.

No livro de economia, cidades, províncias e estados continuam mostrando os agregados de renda. Os percentuais iniciais são estimativas editáveis; não são estatísticas estabelecidas pelas histórias. As edições sociais já marcadas como personalizadas foram preservadas.

## Subsistência e tamanho da economia

A revisão inicial atribuía sobra excessiva e monetização alta aos camponeses. Agora, a renda bruta de referência desse estrato é 1,01 vez a despesa básica; aproximadamente **99% é gasto com subsistência**. Só **10% da renda** é tratado como dinheiro; o restante representa autoconsumo, remuneração em espécie e trocas. A sobra corresponde a cerca de 1% da parcela monetária.

Os perfis sociais estimados também foram ajustados para uma maioria maior de trabalhadores comuns: normalmente 88%, 93% em localidades agrárias/estepe, com proporções menores em capitais, portos, escolas e centros de ofício. A composição mundial atual tem aproximadamente **81,7% nesse estrato**. As populações aprovadas e as edições recentes do autor foram mantidas.

A produção física não foi reduzida por um multiplicador arbitrário: alimentar milhões de habitantes exige volumes grandes de comida. No recorte mensal auditado, o valor bruto dos bens efetivamente produzidos é aproximadamente **1,72 milhão de PO**, para cerca de **4,22 milhões de habitantes e itinerantes vinculados**. Isso equivale a aproximadamente 0,41 PO por pessoa/mês em bens modelados, não a dinheiro livre por habitante.

Esses números ainda são aproximações de cenário, não uma contabilidade nacional completa. É necessário distinguir:

- **Produção:** valor dos bens; inclui matérias-primas e etapas intermediárias. Não é PIB ou lucro.
- **Giro comercial:** soma de pagamentos; a mesma moeda pode passar por várias transações.
- **Renda familiar de referência:** cálculo social paralelo, incluindo atividades e trocas não detalhadas nas cadeias de mercadorias.
- **Caixa:** estoque de moedas das contas simuladas, conservado nas transferências.

Portanto, não considero adequado afirmar que todos os números já representam uma economia histórica perfeitamente calibrada. A estrutura material faz sentido como modelo de campanha, mas renda e produção ainda não são duas faces de um sistema completo de salários, serviços, propriedade e impostos. A renda estimada não é distribuída automaticamente em moedas a cada ciclo.

## Mapa de bens produzidos

O critério anterior comparava o valor total de cada bem. Como cada cidade inclui o campo ao redor, a comida de subsistência fazia os grãos dominar 58 províncias.

Agora há dois critérios na legenda:

1. **Especialização comercial**, padrão: desconta dos alimentos a parcela necessária para o abastecimento local e compara o valor restante com os outros bens. Se não há outra atividade, preserva o produto local como referência.
2. **Maior valor total · inclui subsistência:** mantém a comparação integral anterior.

Isso muda apenas a leitura temática. Não apaga comida, não aumenta produção e não altera as contas dos mercados. A auditoria da especialização identificou **20 bens predominantes diferentes**; grãos aparecem em 16 províncias, com madeira, couro, bronze, ferro, cobre, livros, Lavanthir e outros produtos nas demais. Todos os bens de cada província continuam em sua ficha.

O seletor e a legenda também ficam acessíveis em janelas menores.

## Escravidão

Conforme a decisão do autor, agora há **regime de trabalho e comércio de pessoas escravizadas** em Drácon, Husaj e Território Orc, fora das escolas de magia. O bem comercial tem uma ficha própria em **Economia → Produtos → Pessoas escravizadas**, com localidades, pessoas alocadas, estoque disponível, transações e preços.

Para iniciar o modelo, foram adotadas hipóteses editáveis de 12% em Drácon, 15% em Husaj e 8% no Território Orc. Esses percentuais não constam como censos nas histórias. São subconjuntos dos habitantes existentes, sem população adicional. Pessoas escravizadas não recebem renda familiar própria na estimativa e continuam incluídas na demanda alimentar do censo.

Os custos operacionais usam um modificador de cenário para a apropriação do trabalho; não há bônus automático de produção. Esse modificador não pretende demonstrar eficiência histórica universal do trabalho escravizado.

O estoque inicial é dividido entre trabalho alocado e disponibilidade para transferência. Drácon tem demanda adicional de aquisição; os outros dois territórios dispõem de uma parcela negociável maior. Não há geração mensal, reprodução ou captura automática. A transferência move pessoas inteiras, respeita os estados habilitados, rotas, diplomacia, embargos, tarifas e fretes. Pessoas capturadas por piratas são contabilizadas em uma conta própria, sem simplesmente desaparecerem.

A auditoria conservou **53.416 pessoas** nos estoques, trabalho alocado, cargas e capturas em dois ciclos. Não houve fabricação de pessoas nem desgaste como se fossem equipamento. O censo urbano é uma fotografia inicial: ainda não se recalcula automaticamente a população de origem/destino ou a composição social após cada transferência. Os estoques salvos, por sua vez, acompanham as transferências. Editar o percentual inicial exige reiniciar a simulação para refazer esses estoques.

## Catálogo de bens

Não foram apagados todos os bens secundários. O catálogo conserva 85 registros por compatibilidade, dos quais **83 ficam ativos na consulta principal**. Moedas cunhadas e elefantes sem atividade foram arquivados na interface; moedas cunhadas não criam dinheiro a partir de ouro por ciclo.

Na revisão anterior foram acrescentados **aço, armaduras, lã, leite, enxofre e carne**. Eles completam cadeias de metalurgia, equipamento, tecidos, alimentação e pólvora. Permanecem os materiais de ossos de dragão, Lavanthir e pesquisa arcana.

Considero coerentes os grupos de alimentos, minérios, matérias-primas, manufaturas, equipamento, construção naval e bens arcanos. Produtos como perfume, incenso, joias, bebidas e tabaco são secundários de luxo ou contexto regional; podem ter menor destaque, mas não são automaticamente incompatíveis com o mundo. Não acrescentaria novos bens antes de observar essas cadeias em uso e ajustar suas quantidades e procura.

## Bandeira e verificações

A imagem `Dracon.png` foi incorporada, sem alteração dos pixels, ao brasão de Drácon usado pelo Atlas. O arquivo anterior está no backup `backups/v42-before-social-goods`.

Os padrões foram gravados separadamente nas duas instalações. As últimas edições do autor — incluindo Alia e ajustes de população — foram preservadas. O arquivo comercial também passou a aceitar nomes anteriores registrados como aliases, para que uma renomeação de cidade não quebre sua associação no rebuild.

Os **134 testes JavaScript** passaram, incluindo subsistência, edição social, estoques finitos, restrição de comércio por estado, preservação de moedas, diversidade do mapa e correspondência da nova bandeira com a imagem fornecida.

Recarregue o Atlas com **Ctrl+F5** para receber o código e o padrão atualizados.
