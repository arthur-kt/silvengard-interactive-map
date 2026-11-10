# Revisão do Atlas — economia, renda e histórias

Aplicada em 9 de novembro de 2026. Os mapas das duas pastas foram preservados separadamente; cada instalação continua com suas próprias edições e populações locais.

## População e renda

A população de cada localidade representa a cidade e suas redondezas rurais. Não foi acrescentado um segundo censo rural. Elucitor continua com **1.050.000**, Velaffeld com **250.000** e Asgorath com **100.000 habitantes**.

Cada cidade recebeu uma composição social inicial editável: camponeses/trabalhadores comuns, modesto, confortável, rico e aristocracia. As proporções variam conforme capital, porto, escola, fortaleza, atividade agrícola e região. São estimativas de cenário, não percentuais documentados nas histórias. Podem ser alteradas em **Editar cidade → Composição social e renda estimada**; precisam somar 100%.

O cálculo usa, inicialmente, três pessoas por unidade familiar de renda. Assim, não atribui automaticamente um salário a cada criança ou dependente. O tamanho familiar também é editável.

| Estrato | Despesa familiar mensal de referência | Renda bruta estimada / despesa | Parcela em moeda |
|---|---:|---:|---:|
| Camponeses e trabalhadores comuns | 6 PO | 1,10 | 25% |
| Modesto | 30 PO | 1,20 | 50% |
| Confortável | 60 PO | 1,30 | 80% |
| Rico | 120 PO | 1,50 | 90% |
| Aristocracia | 300 PO | 2,00 | 95% |

Os patamares de estilo de vida de D&D são **despesas**, não salários garantidos. Os fatores de renda, a aplicação familiar e as parcelas em moeda acima são escolhas do simulador. O Atlas separa renda bruta de referência, dinheiro, valor em espécie/autoconsumo e sobra após despesas básicas. Essas estimativas não são arrecadação estatal nem PIB.

A renda **não é criada em moedas a cada ciclo**. Ela dimensiona uma reserva inicial de liquidez de um quarto da renda monetária mensal, ajustável pelo multiplicador do caixa inicial. Depois, compras, fretes, tarifas e serviços transferem moedas entre contas. Isso é uma aproximação: o Atlas ainda não simula contracheques individuais ou uma macroeconomia completa.

Referências de estilos de vida, serviços e alguns preços de mercadorias: [regras básicas oficiais de D&D 2014](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment). A maioria dos preços de fabricação e dos materiais fantásticos continua sendo uma estimativa do cenário.

## Produção e preços

Foram desfeitos os multiplicadores de quantidade que tornavam a comparação anterior inconsistente. Os bens agora indicam unidades físicas: grãos em sacos de 100 kg, metais comuns em lotes de 100 kg, metais preciosos em lingotes de 1 kg, líquidos em lotes/barris e animais por cabeça. O preço corresponde à unidade indicada.

Um saco de grãos cobre 200 pessoas-dia de alimentação. A demanda mensal de mil pessoas equivale a 150 sacos se atendida exclusivamente por grãos; outros alimentos também podem cobrir essa demanda. O gado vivo não é contado diretamente como comida.

Foram acrescentados **aço, armaduras, lã, leite, enxofre e carne**, completando cadeias existentes. Bronze exige cobre **e** estanho; lã e leite exigem animais disponíveis sem consumi-los como matéria-prima. Carne exige abate. Oficinas registram insumos e custos operacionais, e podem produzir abaixo da capacidade quando faltam insumos, acesso ou dinheiro.

Rivertown e Condado de Alia têm especialização agrícola forte. A agricultura de entorno está vinculada às localidades, evitando população e comida rural duplicadas. Valar permanece sem produção. Adhuc Vivere mantém apenas oficinas militares abastecidas de fora. Ossos de dragão permanecem em Winterhelm; o metal vulcânico de Gugacon continua mais valioso. Ouro permanece em Fovium/Veniun e prata em Liotorn.

Armas são produzidas em vários estados e forjas anãs. A capacidade de artilharia não fica restrita a Drácon, mas continua limitada. Navios são bens duráveis e não podem ser transportados por estradas. Pessoas escravizadas não são geradas automaticamente como um produto mensal; instituições de escravidão continuam presentes nas histórias pertinentes.

## Mercados

Foram aplicadas as transferências solicitadas:

- Mountport, Vila Candelápria e Porto Corujos → **Loueixo**.
- Sobral e Amrithruk → **Grenolk**.
- Metiscina, Hethlothloth e Urlyzaak → **Porto do Álamo**.
- As decisões anteriores de Allanan, Alqa, Ros Leones e demais mercados foram mantidas.

São dez mercados. A distribuição atual tem 19 localidades em Loueixo, 24 em Grenolk e 21 em Porto do Álamo. Os vínculos comerciais não alteram as fronteiras políticas. Valar e o Norte Desconhecido não integram mercados ativos.

O mapa conserva 163 traçados, incluindo caminhos internos que não servem ao comércio entre localidades. A auditoria não encontrou rotas comerciais sem duas paradas válidas nem localidades economicamente ativas sem conexão. Guerra, embargos, tarifas, pirataria e fretes continuam afetando as compras e a busca por fornecedores.

## Diplomacia

Na ficha de um estado, **Editar relações diplomáticas** abre o painel com esse estado selecionado. Também é possível clicar diretamente na relação com outro estado. A alteração é recíproca, aparece nas fichas e afeta o panorama comercial e os ciclos seguintes. Pode ser exportada e gravada com **Definir como padrão**.

## Histórias e culturas

As correções do documento `Silvengard_Correcoes_e_Acrescentimos_Sem_Culturas_Inativas.md` foram incorporadas aos três arquivos de `historic_archives`. Foram acrescentados os quatro dossiês de Piglia, Sete Cidades, Valar e Veniun, descrições das culturas ativas e categorias religiosas, além dos complementos sobre Amestris, Baranor e o personagem draconato.

Foram harmonizados temas como a monarquia eletiva de Dragonfall, a Casa Grunvar em Duräk, os dirigentes e instituições citados nas narrativas, Garnalos, as escolas de magia, o calendário e as tradições religiosas. A grafia narrativa é **Lavhantir**; o catálogo econômico conserva o rótulo legado **Lavanthir** para o mesmo material.

As decisões comerciais mais recentes prevalecem sobre trechos antigos do documento: as sedes são Allanan e Grenolk; Anteventium está no mercado de Elucitor, e Aleravum, Fovium e Odusonsium no de Alqa. Não foram inventadas histórias para cidades sem narrativa, nem resolvidos mistérios deliberados. Trechos substituídos são preservados em comentários, ocultos no leitor.

## Validação e uso

- **131 testes JavaScript** e **11 testes das histórias** passaram.
- As duas instalações foram auditadas com seus próprios mapas: população rural adicional igual a zero; totais dos mercados reconciliados; moedas conservadas entre ciclos; nenhuma criação de capital no segundo ciclo; arquivos canônicos preservados durante a simulação.
- A interface foi conferida para a edição social da cidade, a história de Dragonfall e a abertura da diplomacia pela ficha do estado.
- Backups anteriores à revisão estão em `backups/v41-before-recalibration` em cada instalação.

Os padrões foram gravados nos arquivos do Atlas. Use **Ctrl+F5** para carregar o código atualizado. Mudanças futuras feitas no navegador devem ser gravadas com **Definir como padrão** quando desejar mantê-las nos arquivos.

Os relatórios completos `Silvengard-Economia-e-Mercados.md`, `Silvengard-Estados-Provincias-Cidades.md` e o catálogo de nomes foram atualizados. Valores de capacidade são distintos da produção realizável; os totais de bens incluem etapas intermediárias e não devem ser interpretados como renda dos moradores.
