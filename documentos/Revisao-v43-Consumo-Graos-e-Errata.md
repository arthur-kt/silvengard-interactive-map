# Revisão 43 — consumo social, alimentos, Veniun e história

Aplicada em 9 de novembro de 2026.

## Consumo ligado à composição social

Antes desta revisão, a composição social determinava estimativas de renda e a liquidez inicial. O consumo ainda usava principalmente coeficientes por habitante. Agora ela também determina a procura e o consumo efetivo de bens.

As despesas básicas têm prioridade. A maior parte de moradia, tributos e subsistência permanece abstraída; a parcela comercial de alimentos e utilidades tem um limite de gasto. Pessoas escravizadas continuam incluídas na população que precisa de alimentação, sem renda familiar própria.

O orçamento mensal de luxo usa estas parcelas da **renda monetária disponível após as despesas básicas**:

| Estrato | Parcela destinada a luxo |
|---|---:|
| Camponeses e trabalhadores comuns | 0% |
| Modesto | 2% |
| Confortável | 15% |
| Ricos | 35% |
| Aristocracia | 50% |

Os grupos procuram cestas diferentes. Os modestos buscam pequenos consumos de vinho, chá e açúcar; a classe confortável também procura livros e artigos domésticos; ricos e aristocratas têm maior procura por seda, joias, especiarias, perfume, incenso e materiais de prestígio. Um orçamento não cria oferta nem moedas: compras continuam dependentes de caixa, estoque, rotas, preço entregue, diplomacia e bloqueios.

As compras são distribuídas em rodadas para reduzir a vantagem artificial da primeira cidade na ordem de processamento. A procura de luxo e os preços por escassez também consideram a composição social. Não se atribui um consumo fixo de luxo a toda cidade apenas por sua população ou por ser capital.

Na ficha econômica da cidade, província ou estado, abra **Consumo por classe social**. A tabela compara orçamento e valor consumido/comprometido. Inclui consumo de estoque próprio e pagamentos de cargas em trânsito; não é necessariamente um pagamento integral em moedas no próprio local.

Os testes confirmam que transformar a população de uma cidade de camponeses para ricos altera o consumo real; com camponeses não há compras de luxo. Uma cidade sem dinheiro não recebe crédito automático para realizar seu orçamento.

## Redução do domínio dos grãos

A quantidade anterior de grãos era calculada pela população da cidade e seu entorno rural. Por isso uma capital de 1,05 milhão de habitantes carregava também uma produção agrícola muito grande. Isso deixava os demais setores pequenos nas fichas, mesmo depois da correção visual do mapa.

Foi adotada uma abstração deliberada de jogo: **somente 1% da oferta e da necessidade básica de alimentos entra no balanço comercial modelado**. Os 99% restantes ficam abstraídos no abastecimento básico de fundo, sem criar novas pessoas, moedas ou produção nas localidades. Isso não afirma que todas as cidades sejam autossuficientes; distribuições e abastecimentos fora desse recorte não são detalhados.

A redução é aplicada de maneira coerente à oferta primária de alimentos e à necessidade comercial correspondente. Os preços e pesos físicos das unidades permanecem definidos. Oficinas continuam precisando adquirir e consumir os ingredientes de suas receitas. A quantidade reduzida é uma parcela econômica abstrata, não a alegação de que a população passou a comer cem vezes menos.

| Cidade de Elucitor | Antes | Depois |
|---|---:|---:|
| Capacidade de grãos, a preços-base | 346.500 PO | 3.465 PO |
| Participação dos grãos na capacidade total | 92,1% | 10,5% |
| Participação na produção efetiva da nova simulação | — | aproximadamente 30,6% |

Capacidade e produção efetiva são diferentes: faltas de insumos, acesso ou dinheiro podem impedir que uma oficina use toda a capacidade. O último percentual pode variar conforme os parâmetros e a diplomacia. A população de Elucitor continua em **1.050.000**.

Os estoques/ciclos da calibração anterior foram arquivados no mapa e no backup. A nova simulação parte do ciclo zero, para não misturar quantidades das duas escalas. Jornadas, cidades, províncias, relações diplomáticas e edições do mapa foram preservadas.

## Mercado de Alqa

**Anteventium, Aleravum, Fovium e Odusonsium** integram o mercado de Alqa. Toda a área terrestre de Veniun também recebeu essa associação, sem mudar sua soberania política ou as fronteiras do estado.

O mercado de Alqa passa a ter 14 localidades, e o de Elucitor, 17. As outras associações comerciais foram mantidas.

## Brasão de Drácon

O brasão anterior foi substituído pelo desenho renderizado a partir do código exato fornecido:

```json
{"t1":"sanguine","charges":[{"charge":"wyvern","t":"sable","p":"e","size":1.5}],"division":{"division":"perPile","line":"arched","t":"sable"},"shield":"horsehead2"}
```

O desenho agora usa a wyvern negra, o campo sanguine, a divisão perPile com linha arched e o escudo horsehead2. A definição também foi gravada nos padrões que recompõem o Atlas.

## Errata histórica e cultural

Foi lido e aplicado `Silvengard_Errata_Historica_e_Cultural_Sem_Mercados.md`. As correções alteram os textos existentes, sem acrescentar uma segunda versão concorrente da mesma passagem.

- Retirados os topônimos não aprovados Cratera do Cron e Wyrmrealm; preservados o avatar de Dravanir, a devastação e a barreira de Gugacon e a infância de Arthur e Rodrick na região de Winterhelm.
- Garnalos padronizado como nome da cidade, do templo e da escola.
- Remissões técnicas substituídas por narrativa onde a errata fornece texto, preservando as informações históricas. Identificadores internos necessários ao programa continuam ocultos no leitor.
- Preservados os dossiês já desenvolvidos de Vitravion, Piglia, Sete Cidades, Valar e Veniun, os glossários das culturas ativas e religiões e os mistérios arqueológicos. Não foram duplicados os capítulos de Vitravion.
- Não foi introduzido o episódio Terremotos de Balásco, nem culturas inativas ou histórias inventadas para preencher lacunas.

Os arquivos originais anteriores à revisão estão no backup de cada instalação: `backups/v43-before-consumption`.

## Para carregar

Use **Ctrl+F5**. As alterações já foram gravadas como padrão, separadamente nas duas instalações, preservando as últimas edições do autor. Os relatórios de estados, províncias, cidades, economia e mercados também foram atualizados.
