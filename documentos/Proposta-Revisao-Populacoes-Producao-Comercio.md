# Proposta de revisão de populações, produção e comércio de Silvengard

**9 de novembro de 2026 — proposta para avaliação.** Somente as mudanças de mercados solicitadas foram aplicadas. As populações, capacidades de produção, estradas, rotas marítimas e regras de simulação abaixo continuam como estavam no aplicativo.

## O que já foi aplicado

Nythan → Allanan; Arenor → Ros Leones; Fovium, Odusonsium e Lakenford → Alqa. O Norte Desconhecido fica fora de todos os mercados. As outras transferências anteriores permanecem.

## Minha recomendação principal

Eu corrigiria primeiro os lugares cuja atividade contradiz a história e os mecanismos que tornam o comércio artificial. Depois ajustaria os centros urbanos pequenos que têm grande importância narrativa. Não reduziria toda a população por uma regra única, nem faria toda sede de mercado virar a maior cidade da região.

A população atribuída aos 152 marcadores soma **5.000.417**. Isso não é um censo completo do continente: há população rural mal representada e, em Marshell, alguns números podem representar comunidades itinerantes. Elucitor, Velaffeld e Asgorath somam **2.307.000**, cerca de **46,1%** do total cadastrado. Essa concentração pode ser uma escolha de fantasia; exige uma logística de abastecimento correspondente.

A revisão considera as histórias dos três arquivos, os 19 estados/regiões, as 67 províncias, as 152 localidades, os 77 bens e os 157 traçados. Os anexos registram todas as localidades e províncias; o levantamento completo das rotas também está em `revisao-historia-economia-dados.json`.

## 1. Inconsistências que eu corrigiria primeiro

| Prioridade | Situação atual verificada | O que eu mudaria |
| --- | --- | --- |
| Alta | Gugacon de Vitravion: 3.460 habitantes e cunhagem, apesar de ser a cidade perdida da história. | Retirar do censo e do comércio conhecidos. Exibir população desconhecida e nenhuma atividade regular confirmada; isso não afirma que a cidade real esteja vazia. |
| Alta | Porto Sarandir: 22.043 habitantes e nenhuma produção cadastrada. | Representar pesca/provisões/reparos e renda portuária. Zero bens não significa que um porto não tenha economia; faltam serviços no modelo. |
| Alta | Asgorath produz até 18 navios/mês; Vila Candelápria, 2. A referência atual tem um único bem chamado Navios. | Separar embarcações fluviais/lacustres dos navios marítimos e localizar cada estaleiro no corpo de água correto. |
| Alta | Na simulação de diagnóstico, 17,85 navios de Asgorath chegam a Velaffeld por um percurso com 1.129 km de estrada; outros 1,93 partem da Vila Candelápria por um percurso com trecho terrestre. | Proibir transporte terrestre de navios completos. Entrega naval deve respeitar água navegável; peças desmontadas seriam outro produto. |
| Alta | Navios também entram no consumo mensal genérico de bens militares. | Tratar navios como frota durável: aquisição, manutenção, reparos e perdas, em vez de consumo integral periódico. |
| Alta | 17 dos 157 traçados têm menos de duas localidades reconhecidas pelo cálculo comercial. | Reparar ancoragens e escalas, atualizar nomes e distinguir ramais internos de ligações entre cidades. Não apagar caminhos de exploração apenas por não terem fluxo. |
| Alta | Pyrenor fabrica 2 unidades de artilharia; Ginar, 4; Kyon, 4; Alqa, 4. | Priorizar pesquisa em Pyrenor, apoio à Patrulha em Kyon e produtos de caravanas/clãs nos demais. Concentrar a produção regular de pólvora/artilharia onde o lore e os insumos sustentam essa tecnologia, sobretudo Drácon. |
| Alta | O recorte de diagnóstico deixa 254,24 pontos abstratos de demanda alimentar sem atendimento. | Priorizar abastecimento, acesso e orçamento antes de simplesmente multiplicar toda a produção. Pontos de demanda não equivalem diretamente a pessoas ou toneladas. |
| Média | Khegosla produz 5 unidades de prata e 3 de moedas; Tog Iret tem velas como principal produto. | Reorientar a primeira para peregrinação e redes khajitt; a segunda para cavalos, rebanhos, arreios, couro e encontros sazonais. |
| Média | Husaj tem 12 elefantes/mês em produção rural; o Baronato de Guernica, 8. | Não consolidar elefantes como especialização nativa sem a definição narrativa correspondente. Importação, comércio ou um futuro projeto militar são coisas diferentes. |

## 2. Populações: ajustes pontuais, sem trocar cultura, religião ou brasões

Os números propostos são escolhas de desenho do cenário, não censos encontrados nas histórias. Quando eu proponho mudar habitantes, não estou propondo mover cidades nem trocar seus outros atributos. A população se refere ao conjunto da localidade civil, não apenas à guarnição ou aos estudantes.

| Localidade | Atual | Proposta | Motivo |
| --- | --- | --- | --- |
| Torre Solitária | 19.140 | 8.000 | Núcleo menor em torno da torre e da escola; preservar a importância arcana. |
| Dagorah | 7.408 | 18.000 | Cidade de vários clãs e forjas; reforçar o núcleo civil e artesanal. |
| Savhalla | 1.130 | 5.000 | Entreposto das caravanas de Amestris, sem o transformar numa metrópole. |
| Arenor | 3.900 | 10.000 | Centro histórico de uma marca, com atividade marcial e torneios. |
| Castamor | 5.500 | 10.000 | Reforçar a cidade da antiga marca, mantendo o isolamento montanhoso. |
| Vennoduro | 3.634 | 12.000 | Travessias lacustres, circulação da capital e tradição de torneios. |
| Allanan | 5.984 | 14.000 | Porto e sede mercantil regional, sem precisar superar Garnalos ou Himlumn. |
| Anteventium | 4.498 | 18.000 | Central das Guildas e corte de Veniun; fortalecer o núcleo institucional. |
| Aleravum | 22.600 | 12.000 | Escola regional e povoação acadêmica, distinguindo-a do perfil minerador de Fovium. |
| Grenolk | 7.180 | 18.000 | Fortaleza principesca, forjas e sede mercantil; Brelas pode continuar maior. |
| Almirarem | 7.492 | 15.000 | Porto principal dos Reinos Médios, mesmo sem ser sede do mercado. |
| Porto do Álamo | 4.360 | 18.000 | Polo portuário de Vitravion e participante do Pacto dos Portos Livres. |
| Porto Corujos | 564 | 3.500 | Porto importante de Osmorn, com docas, oficinas e moradores permanentes. |
| Hellas | 6.552 | 12.000 | Templos, assistência e acolhimento; não é uma regra de que toda capital deva ser a maior cidade. |
| Triovorn | 3.286 | 6.000 | Um dos três núcleos fortificados élficos; autonomia preservada. |

### Casos que eu preservaria ou trataria separadamente

- **Nilhelm:** manter 0, pela catástrofe já definida. **Gugacon de Dragonfall:** manter 4.200 como ponto de partida, sem desfazer a troca de população que você pediu. **Winterhelm e Rinnton:** preservar a relação atual de 51.874 e 25.078.
- **Gugacon de Vitravion:** população real desconhecida; retirar os 3.460 do total conhecido sem decidir quem vive lá. A ilha de Dragonfall e a cidade perdida não são o mesmo lugar.
- **Gugacon/Porto Sarandir:** podem ser dois núcleos distintos da mesma ilha. É preciso evitar contar a população da ilha inteira no marcador Gugacon e depois somar o porto novamente. Não reduziria Sarandir automaticamente só por ser um porto recente.
- **Kyon:** manter 27.786 é defensável, porque o lore confirma uma população civil além da Patrulha. Não o reduziria a um quartel de poucos soldados.
- **Khegosla:** os 12.534 residentes podem permanecer; peregrinos e viajantes precisam de um contador sazonal separado, e não de um aumento permanente arbitrário.
- **Elucitor/Velaffeld/Asgorath:** numa versão mais compacta, eu testaria 300.000 / 250.000 / 150.000. Isso sozinho retiraria 1.607.000 do total cadastrado. Não recomendo aplicar essa redução antes de decidir a escala populacional do mundo; também é válido manter as metrópoles e fortalecer sua infraestrutura alimentar, sanitária e logística.

### Marshell: residentes e hordas não são a mesma contagem

Eu criaria residentes, população itinerante vinculada e visitantes temporários. Só depois consideraria os valores permanentes abaixo. Sem esse segundo cadastro, manteria os números atuais para não fazer pessoas desaparecerem da economia.

| Assentamento | Número atual | Residentes de referência, condicionais |
| --- | --- | --- |
| Tog Iret | 31.836 | 6.000 |
| Urentog | 36.208 | 5.000 |
| Chulagtoh | 33.066 | 7.000 |
| Grainhem | 13.660 | 4.000 |
| Tserost | 6.424 | 2.000 |
| Tonkhet | 3.638 | 1.500 |

Esses valores somam 25.500 residentes. A diferença para os 124.832 atuais de Marshell precisa continuar representada em comunidades itinerantes, com consumo, rebanhos e circulação; não é uma proposta de extinção dessa população.

## 3. Produção e comércio: revisão de todos os estados/regiões

### Dragonfall

**População cadastrada:** 745.912.

**Papel econômico:** Grãos e abastecimento no sul; metalurgia anã em Dagorah; ossos de dragão em Winterhelm; Lavanthir na Gugacon vulcânica; comércio e reparos nos portos.

**Produção que eu ajustaria:** Manter Rivertown com 120 cargas de grãos/mês. Preservar os 6 lotes de ossos e 3 de Lavanthir como origens exclusivas atuais. Dar produção/serviços a Porto Sarandir. Separar os barcos do lago de Asgorath dos navios oceânicos.

**Comércio e rotas:** Fortalecer Rivertown–Asgorath–Winterhelm e o abastecimento Gugacon–Sarandir–Cinzas. Manter tarifas seletivas com Navï Velaffëll, sem presumir uma guerra permanente.

### Elucitor

**População cadastrada:** 1.397.226.

**Papel econômico:** Centro imperial diversificado; Alia agrícola; Arenor e Castamor militares; Danumbria acadêmica; Ros Leones portuária; Adhuc Vivere dependente de abastecimento externo.

**Produção que eu ajustaria:** Concentrar alimentos nas terras férteis e oficinas militares nas fortalezas. Manter Adhuc sem alimentos/extração rural e com oficinas de armas/ferramentas. Não transformar o rio entre terras mortas em fonte de agricultura.

**Comércio e rotas:** Manter Estrada Imperial, Flores e Rimae, verificando as escalas reais. Integrar o mercado de Ros Leones por estrada e navegação; o corredor de mercado não cria uma estrada automaticamente.

### Navï Velaffëll

**População cadastrada:** 1.157.821.

**Papel econômico:** Tradição marítima, construção naval, artesanato florestal, templos e centros arcanos distintos.

**Produção que eu ajustaria:** Conservar Velaffeld como grande estaleiro. Fortalecer reparos/comércio em Natheas e Allanan. Garnalos e Sahtalys devem vender pesquisa, livros e trabalho especializado, não ser cópias de forjas genéricas.

**Comércio e rotas:** Separar a rede do mercado de Allanan da rede setentrional de Velaffeld sem cortar as rotas entre ambas. Manter comunicação Allanan–Sahtalys e os contatos do Levante.

### Valar

**População cadastrada:** 0.

**Papel econômico:** Terra morta e civilização desaparecida.

**Produção que eu ajustaria:** Manter população conhecida e produção regular em zero. Relíquias de expedições seriam eventos raros, não uma mina ou fábrica mensal.

**Comércio e rotas:** Nenhuma cidade ou conta comercial regular em Valar. Caminhos de exploração podem existir sem virar rotas de abastecimento comerciais.

### Drácon

**População cadastrada:** 318.103.

**Papel econômico:** Império conquistador com frota, metalurgia, pólvora, artilharia, agricultura civil e economia de conquista.

**Produção que eu ajustaria:** Criar um polo naval em Urlyzaak e reforçar a indústria militar do núcleo imperial/Sharntosz. As jazidas do vulcão justificam rever a extração, mas não autorizam duplicar Lavanthir fora de Gugacon. Conquista e escravização devem depender de eventos e de pessoas existentes, não gerar população cativa infinitamente.

**Comércio e rotas:** Distinguir as linhas imperiais das linhas civis do Pacto dos Portos Livres. Hostilidade não deve obrigar um navio de terceiro a atracar em porto inimigo para seguir viagem.

### Sete Cidades

**População cadastrada:** 145.266.

**Papel econômico:** Maior concentração anã conhecida: sete cidades autônomas de mineração e forja.

**Produção que eu ajustaria:** Manter ferro, cobre, estanho, prata e ouro. Reequilibrar oficinas para que ferramentas e armas de forja anã tenham presença em vários salões; substituir parte das armas genéricas, sem duplicar a mesma produção. Importar parte dos alimentos.

**Comércio e rotas:** Fortalecer o eixo metalúrgico com Khegosla, Alqa e Grenolk. Travessias em conflito com clãs orcs devem ter risco/limites locais, não fechamento automático de todos os contatos por identidade racial.

### Husaj

**População cadastrada:** 29.848.

**Papel econômico:** Califado das caravanas, camelos, tâmaras, sal, comércio e fiscalização.

**Produção que eu ajustaria:** Alqa hoje tem artilharia como principal manufatura: eu deslocaria esse protagonismo para abastecimento e equipamento de caravanas. Manter cereais apenas em áreas irrigáveis. Os 12 elefantes/mês do campo não deveriam ser uma especialização estabelecida enquanto essa ideia for apenas proposta de lore.

**Comércio e rotas:** Consolidar Alqa–Savhalla–Mestrina–Fovium/Odusonsium, com acesso a Aleravum e às Sete Cidades. Representar licenças/taxas do Califado separadamente de frete.

### Khajataad

**População cadastrada:** 12.534.

**Papel econômico:** Centro espiritual khajitt, retorno dos viajantes, anciãos, caça e circulação livre.

**Produção que eu ajustaria:** Khegosla produz 5 unidades de prata e 3 de moedas: esse perfil minerador/cunhador não decorre da história. Eu levaria essa extração a uma origem mineral apropriada e daria ao centro caça, couro, alimentos locais e renda de hospedagem/intermediação.

**Comércio e rotas:** Khegosla coordena redistribuição, não possui soberania sobre os salões anões do mesmo mercado. Demanda de peregrinos deve ser sazonal, sem confundi-los com moradores.

### Veniun

**População cadastrada:** 85.416.

**Papel econômico:** Reino de cidades autônomas, montanhas, ouro, escola e guildas de aventureiros.

**Produção que eu ajustaria:** Manter os 4 lingotes de ouro/mês em Fovium e a prata de Liotorn. Anteventium deve ganhar oficinas de equipamento, provisões e renda de contratos. Aleravum precisa de perfil acadêmico próprio em vez da cópia de cobre/armas do núcleo minerador.

**Comércio e rotas:** Reparar a ligação Aleravum–Anteventium. Veniun deve ter risco de monstros/escolta maior que o centro de Elucitor, sem alterar a regra de ritmo normal nas estradas mantidas.

### Território Orc

**População cadastrada:** 134.706.

**Papel econômico:** Clãs orcs diferentes, alguns mercantis, outros mais guerreiros; ausência de governo único.

**Produção que eu ajustaria:** Diversificar entre armas simples, couro, caça, rebanhos, madeira e forjas locais. Ginar e Irkudh não deveriam fabricar artilharia em escala sem uma tradição tecnológica definida. Não reduzir a população só por serem orcs.

**Comércio e rotas:** Nudh e os contatos de fronteira precisam de ligações seletivas com Khegosla/Grenolk/Reinos Médios. Guerra ou acordo de um clã não equivale automaticamente à decisão de todos.

### Mountport

**População cadastrada:** 119.550.

**Papel econômico:** Cidades oligárquicas, agricultura halfling/humana, navegação e hospitalidade de Remus.

**Produção que eu ajustaria:** Fortalecer alimentos, bebidas, hospedagem e provisões náuticas. Sobrirosen tem 31 mil moradores e nenhuma produção rural no seu condado: eu verificaria solos e restituiria agricultura apropriada. Manter o vidro de Ridualhos onde houver areia/insumos.

**Comércio e rotas:** Viras deve funcionar como porto alimentador da rede de Loueixo; decisões mercantis locais podem variar, sem criar um monarca ou alfândega única inexistente na história.

### Goblinburgo

**População cadastrada:** 6.400.

**Papel econômico:** Porto conhecido e redes clandestinas ligadas a uma sociedade fragmentada e a uma cidade de localização incerta.

**Produção que eu ajustaria:** Não tratar os 6.400 habitantes de Crild como censo de toda a população goblin. A renda deveria incluir pesca, reparos, redistribuição e contrabando, em vez de depender apenas de armas/carvão/couro.

**Comércio e rotas:** Separar a rota legal do Mar de Nur de ramais clandestinos. O risco deve seguir águas e grupos atuantes, não transformar todo comerciante goblin em pirata.

### Piglia

**População cadastrada:** 35.384.

**Papel econômico:** Templos, concílio, assistência, acolhimento e convivência religiosa.

**Produção que eu ajustaria:** Substituir o predomínio genérico de armas por livros, papel, serviços de cura/hospedagem e provisões. Gannas não deve ganhar uma escola de magia de volta: seu papel atual é distinto. Serviços não precisam ser mercadorias estocáveis.

**Comércio e rotas:** Manter ligações de peregrinação e abastecimento com Alqa, Veniun e os vizinhos. Neutralidade e abrigo não significam ausência de defesa, mas também não fundamentam uma grande indústria bélica.

### Marshell

**População cadastrada:** 124.832.

**Papel econômico:** Hordas e assentamentos seminômades, cavalos, rebanhos e encontros sazonais.

**Produção que eu ajustaria:** Tog Iret produz sobretudo velas; eu daria prioridade a cavalos, arreios, couro, alimentos conservados e serviços de feira. Separar residentes dos contingentes itinerantes antes de diminuir números nos marcadores.

**Comércio e rotas:** Representar percursos de reunião/feira e oferta sazonal. Preservar o total de pessoas das hordas ao redistribuí-las; não desaparecer com população por ela deixar de ser classificada como urbana.

### Duräk

**População cadastrada:** 67.854.

**Papel econômico:** Fortaleza anã entre rios e florestas, forjas, mercenários e comércio.

**Produção que eu ajustaria:** Grenolk deve ganhar ferramentas, armas/forja anã e processamento de carvão. Importar minérios das Sete Cidades/Liotorn; não inventar grandes minas montanhosas num reino cuja singularidade é estar fora delas. Prata fluvial continua uma hipótese.

**Comércio e rotas:** Consolidar Grenolk–Almirarem e os contatos com as forjas e os mercados do interior; o porto continua útil mesmo com a sede em Grenolk.

### Reinos Médios

**População cadastrada:** 151.016.

**Papel econômico:** Reinos e cidades independentes, sem capital ou governo de toda a região.

**Produção que eu ajustaria:** Manter diversidade local: metalurgia onde houver infraestrutura, agricultura nos vales, artesanato e atividade portuária em Almirarem. Não distribuir artilharia apenas por herança de perfis antigos.

**Comércio e rotas:** Almirarem é a porta marítima para Grenolk. Tarifas, pactos e guerras podem precisar de exceções provinciais/locais, pois o grupo cartográfico não é um reino unificado.

### Vitravion

**População cadastrada:** 174.151.

**Papel econômico:** Cidades autônomas: Guernica humana, porto multicultural, Tríplice Élfica, Mauron, Kyon e Pyrenor.

**Produção que eu ajustaria:** Retirar a Gugacon perdida do comércio regular e do censo conhecido, sem afirmar que não há habitantes reais. Manter Guernica como maior cidade humana. Kyon tem civis, não só patrulheiros. Mauron merece forja/mineração; Pyrenor, pesquisa em vez de artilharia.

**Comércio e rotas:** Porto do Álamo ganha peso sem se tornar capital política de Vitravion. Preservar Vir/Triovorn/Porto de Vern como Tríplice Élfica e Lirion/Oregon como núcleos humanos. O Norte desconhecido não oferece estoques ou mercados automáticos.

### Osmorn

**População cadastrada:** 130.900.

**Papel econômico:** Reino cavaleiresco de Bahamut, campos, cavalos, forjas e porto de apoio.

**Produção que eu ajustaria:** Valorizar criação de cavalos, arreios, equipamento militar e suprimentos. Porto Corujos precisa de papel econômico portuário; a capacidade naval da Vila Candelápria deve ser distinguida entre fluvial e marítima, respeitando a posição real.

**Comércio e rotas:** Conectar o porto e as oficinas ao circuito de Grenolk/Ros Leones e ao Mar de Nur. Não presumir participação obrigatória no Pacto dos Portos Livres.

### Batovia

**População cadastrada:** 163.498.

**Papel econômico:** Federação marítima, construção naval, invenções, instrumentos e pesquisa experimental.

**Produção que eu ajustaria:** Loueixo deve ser um dos principais estaleiros humanos. Panhadaril mantém pesquisa e instrumentos/vidro, com importação de insumos. Ilhas sem sítios rurais não precisam receber cidades novas; pesca e abastecimento marítimo podem suprir as habitadas.

**Comércio e rotas:** Dar à navegação interinsular regularidade e à rota do Poente comboios voluntários. Não acrescentar dirigíveis ou monopólio político sobre todos os parceiros.

## 4. Quantidades iniciais que eu testaria

São pontos de partida de capacidade mensal, sujeitos à unidade física e à disponibilidade de insumos. Em muitos casos a proposta é substituir capacidade genérica, não somar fábricas novas à mesma mão de obra.

| Núcleo | Referência atual | Teste sugerido |
| --- | --- | --- |
| Rivertown | 120 cargas de grãos/mês na cidade | Preservar. Relacionar com o entorno agrícola sem contabilizar a mesma safra duas vezes. |
| Campinas/Condado de Alia | 60 cargas de grãos/mês rurais | Testar 120–180, se a área cultivável e a unidade da carga sustentarem esse volume. |
| Fovium / Liotorn | 4 lingotes de ouro / 0,8 de prata por mês | Preservar a distribuição decidida pelo autor. |
| Winterhelm / Gugacon de Dragonfall | 6 lotes de ossos / 3 de Lavanthir por mês | Preservar inicialmente; raridade, reservas e oficinas limitam expansão. |
| Porto Sarandir | Sem produção | Testar 4 cargas de peixe, 2 lotes de conservas e 1 de cordas; acrescentar renda de docas com pagadores identificados. |
| Grenolk | 1 unidade de armas e 1 de carvão, entre outros | Testar 3–4 conjuntos de equipamento/forja e 3 de ferramentas, com minério importado e insumos de combustível. |
| Sete Cidades | Forja anã especial concentrada em 0,5 conjunto/mês em Adush | Redistribuir 8–12 conjuntos/mês entre os sete salões, substituindo parte das armas genéricas e preservando o balanço de metal. |
| Urlyzaak | Sem construção naval registrada | Testar estaleiro de 3–6 navios marítimos/mês, com madeira, cordas, tecido/velas e trabalho especializado. |
| Porto das Cinzas / Porto do Álamo / Viras | Não têm estaleiros correspondentes ao seu papel no perfil atual | Testar 1–3 navios/mês onde houver docas e suprimentos; reparos podem ser mais importantes que cascos novos. |
| Velaffeld / Loueixo | 36 / 6 navios por mês de capacidade | Depois de definir o que é um navio, testar 12–18 / 8–12 cascos marítimos equivalentes; não impor essa escala antes da revisão de unidades. |
| Sete escolas arcanas | Pesquisa arcana já existe; capacidade varia com população e insumos | Manter as sete e diferenciar a especialização no texto. Primeiro assegurar papel/tinta, contratos e transporte, antes de ampliar números. |

## 5. O que eu mudaria nas rotas comerciais

Manteria as estradas locais como ligações. Somente os grandes corredores precisam de nome de rota principal. Um trecho sem negócios neste mês não é necessariamente inútil: guerra, orçamento, bloqueio ou sazonalidade podem explicar isso.

### Corredores principais existentes

| Rota | Distância atual | Ação proposta |
| --- | --- | --- |
| Rota da Neve | 338,06 km | Preservar; abastecer norte, escola e porto. Diferenciar necessidades civis, Patrulha/fortificações e exportação rara. |
| Estrada Imperial | 875,65 km | Preservar; verificar escalas, postos e abastecimento. Não confundir uma rota contínua com cada pequeno ramal. |
| Rota das Flores | 886,11 km | Preservar; revisar continuidade entre cidades após movimentos dos marcadores; incluir o acesso ao eixo Ros Leones sem alterar Arenor por inferência. |
| Estrada Rimae | 624,17 km | Preservar; fluxo militar e civil, com acesso controlado à fronteira morta de Adhuc. |
| Rota dos Portos | 520,89 km | Preservar; a história distingue o centro humano, os portos e a Tríplice Élfica. O nome não torna todas as escalas cidades portuárias. |
| Rota dos Portos do Poente | 1.611,35 km | Separar tronco civil dos ramais que efetivamente atracam em Drácon; o Pacto é uma rede de cooperação voluntária. |
| Rota do Mar de Nur | 1.544,63 km | Preservar tronco; distinguir escalas legais, ramais de Crild e risco clandestino/pirata. |
| Rota Marítima do Norte | 3.987,11 km | Rever escalas obrigatórias e operação sazonal. O percurso atual é longo: não tratar oito horas/dia de viagem a pé como escala obrigatória de uma tripulação em turnos. |
| Rota do Levante | 1.385,73 km | Preservar; fortalecer a escala Allanan–Sahtalys, sem criar passagem terrestre para navios completos. |
| Rota comercial marítima · Loueixo — Forteirosin | 225,42 km | Manter como ramal interinsular, sem o mesmo destaque de um grande corredor continental. |
| Rota comercial marítima · Urlyzaak — Metiscina | 205,96 km | Manter como ramal imperial local, não como rota principal independente obrigatória. |

### Ligações que eu consolidaria como eixos de abastecimento

- **Caravanas de Amestris:** Alqa ↔ Savhalla ↔ Mestrina, com ramais para Fovium/Odusonsium, Aleravum/Anteventium e Sete Cidades. Aproveitar os traçados existentes antes de desenhar uma estrada nova.
- **Metais e forjas:** salões das Sete Cidades ↔ Khegosla/Alqa ↔ Grenolk, com ligação portuária por Almirarem. Isso não cria livre comércio automático entre inimigos.
- **Abastecimento do norte de Dragonfall:** Rivertown/entorno fértil ↔ Asgorath ↔ Winterhelm/Dagorah/Lakenford, além de embarque para Cinzas/Sarandir/Gugacon.
- **Academias:** papel, tinta, livros e contratos entre os sete centros; Panhadaril–Pyrenor tem fundamento narrativo especialmente claro. Não inventar uma universidade central que governe todos.
- **Cavalos e arreios:** encontros de Marshell ↔ Grenolk/Reinos Médios/Osmorn. Comercializar excedente de rebanhos sem tornar todos os grupos uma administração única.
- **Portos Livres:** Loueixo, Viras e Porto do Álamo como referências da cooperação, com escalas e adesões específicas. Não incluir Osmorn automaticamente num pacto militar.

### Os 17 traçados com menos de duas escalas reconhecidas

Eles foram identificados pelo mesmo cálculo geométrico usado no comércio. Eu corrigiria ou reclassificaria cada um antes de acrescentar mais ligações; o nome da estrada não prova que seus pontos ainda alcançam as cidades.

| Traçado | Distância | Escalas reconhecidas | Proposta |
| --- | --- | --- | --- |
| Caminho local · Anteventium — Anteventium (`land-0`) | 29,74 km | Anteventium | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Sel-Shofela — Allanan (`land-19`) | 85,24 km | Nenhuma | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Allanan — Allanan (`land-24`) | 90,44 km | Allanan | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Caspinho — Bral (`land-35`) | 124,06 km | Bral | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Braveira — Braveira (`land-40`) | 13,88 km | Braveira | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Cananhos — Cananhos (`land-41`) | 14 km | Nenhuma | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Vilaguezejo — Ridualhos (`land-45`) | 56,42 km | Ridualhos | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Cananhos — Vinquertiro (`land-52`) | 44,84 km | Vinquertiro | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Grainhem — Tonkhet (`land-53`) | 119,42 km | Tonkhet | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Tog Iret — Tog Iret (`land-54`) | 17,38 km | Nenhuma | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Caspinho — Caspinho (`land-61`) | 44,13 km | Caspinho | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Vilaguezejo — Coliras (`land-76`) | 68,15 km | Coliras | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Aleravum — Anteventium (`land-aleravum`) | 47,74 km | Aleravum | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Sel-Shofela — Sel-Shofela (`land-author-70`) | 9,34 km | Sel-Shofela | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Cananhos — Cananhos (`land-author-104`) | 10,44 km | Cananhos | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Tog Iret — Tog Iret (`land-author-140`) | 38,47 km | Tog Iret | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |
| Caminho local · Grainhem — Grainhem (`land-author-149`) | 21,30 km | Grainhem | Reposicionar ancoragens/atualizar escalas; se for caminho interno ou trilha, manter sem tratá-lo como enlace comercial. |

No recorte mensal, **48 traçados não tiveram fluxo**. Esse número é diferente dos 17 casos acima: ausência de negócios não demonstra erro de geometria.

## 6. Ajustes no funcionamento da economia que eu faria junto

1. **Unidades antes de realismo numérico.** Hoje grãos são cargas, animais são cabeças e pesquisa é um tratado. Definir peso/cobertura alimentar e escala de oficinas antes de comparar essas unidades com milhões de habitantes. Não afirmo que 1.413 cargas de grãos alimentem ou não cinco milhões sem essa definição.
2. **Residentes, população rural e visitantes.** A demanda rural atual depende de sítios produtivos, não de um censo rural provincial. Restaurar essa população na contabilidade, sem somar cegamente os totais rurais antigos do `.map` às fronteiras modificadas.
3. **Bens duráveis.** Navios, artilharia, equipamento e capital instalado precisam de estoque e manutenção. Não são todos consumíveis mensais equivalentes a comida.
4. **Produção rural em províncias divididas.** Hoje o conjunto rural de uma província acompanha o hub urbano mais populoso. Eu atribuiria cada sítio produtivo ao mercado de sua posição, agregando depois por província. Assim uma área pintada como Ros Leones não fica contabilizada em outro mercado só porque a capital provincial é maior.
5. **Oferta realmente acessível.** A escassez não deveria usar produção de um participante inimigo como oferta disponível a quem não pode negociar com ele. Manter o mercado regional, mas calcular acesso por comprador, rota, embargo e guerra.
6. **Hostilidade e guerra ativa.** O código trata `Enemy` como guerra, enquanto algumas fichas importadas o chamam de inimizade. Separar os dois conceitos. Dragonfall–Elucitor continua neutra; Navï Velaffëll pode impor restrições seletivas, em vez de um bloqueio absoluto presumido. Drácon e seus adversários precisam de decisões coerentes com as campanhas narradas.
7. **Escalas explícitas.** Uma cidade perto do desenho da linha não deve virar automaticamente uma atracação obrigatória. Isso é especialmente relevante na rota do Poente e em portos inimigos.
8. **Tempo de transporte.** Manter o panorama atual, mas nos ciclos avançados registrar cargas em trânsito e chegada. A distância hoje limita o caminho e altera o custo, mas a compra acessível já entra no estoque no mesmo ciclo. Separar as horas de marcha dos viajantes das jornadas de uma tripulação ou de uma caravana com revezamento.
9. **Serviços e renda.** Portos, templos e guildas podem ser importantes sem extrair minério. Taxas de doca, frete, assistência e contratos precisam de pagadores e destinatários; não de dinheiro criado gratuitamente. O frete atual é contabilizado no preço pago ao vendedor; uma camada de transportadores/portos permitiria distribuir essa receita.
10. **Cunhagem e população cativa.** Cunhar moeda não deve duplicar ouro/numerário; capturar pessoas não deve criar habitantes do nada. Tratar conversões e eventos com balanços próprios.
11. **Alimentação e investimento.** O consumo mensal vem depois da fabricação; eu criaria uma política explícita de abastecimento mínimo e distribuição, para a ordem dos nós não decidir sozinha quem compra primeiro. Não esconder o desabastecimento apenas aumentando todas as safras.
12. **Dinâmica local.** Condições de monstros em Veniun, expedições de Kyon, encontros de Marshell, peregrinações e comboios do Pacto podem alterar demanda, atraso e segurança. Não mudar o ritmo normal das estradas mantidas que já foi combinado para as jornadas.

## 7. Ordem em que eu implementaria, se você aprovar

1. Corrigir Gugacon perdida, Porto Sarandir, os 17 enlaces e o transporte/consumo de navios.
2. Especializar produtores e remover as cópias mais destoantes: Pyrenor/Aleravum/Torre, Tog Iret, Khegosla, Alqa e as forjas/estaleiros conhecidos.
3. Ajustar os centros menores da tabela de população; manter as grandes metrópoles até decidir a escala geral.
4. Repartir produção rural por mercado e melhorar demanda/acesso, orçamento de serviços e tempo de entrega.
5. Só depois introduzir sazonalidade, esgotamento de reservas raras, guerras locais e contratos de grande porte.

## Anexo A — revisão individual das 152 localidades

“Manter” significa ausência de uma mudança demográfica proposta nesta revisão; não significa que o lugar perdeu sua história. Os bens são os principais por valor na capacidade cadastrada, não toda a produção nem a renda comercial.

### Dragonfall

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Asgorath | 450.985 | Manter; cenário compacto opcional: 150.000 | Asgorath | Navios 18, Velas náuticas 36, Alimentos conservados 45 | Separar construção lacustre de navios marítimos; manter abastecimento, artesanato e administração. |
| Clifshore | 16.596 | Manter | Asgorath | Ferramentas 1, Bronze 1, Alimentos conservados 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Dagorah | 7.408 | 18.000 | Alqa | Armas 2,70, Couro 1 | Reforçar forja anã e ferramentas; clãs não devem ser apenas descrição sem reflexo econômico. |
| Ereth | 27.310 | Manter | Asgorath | Velas 5,66, Alimentos conservados 3, Óleo 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Gugacon | 4.200 | Manter | Asgorath | Armas de Lavanthir 2, Lavanthir 3 | Manter 3 lotes de Lavanthir e 2 conjuntos de armas como ponto de partida; não duplicar a origem. |
| Lakenford | 27.782 | Manter | Alqa | Ferramentas 3,89, Artilharia 1, Carvão 5 | Reduzir o protagonismo da artilharia; provisões, ferramentas e atividades lacustres adequadas ao lugar. |
| Malacatt | 12.084 | Manter | Alqa | Armas 4,04, Couro 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Nilhelm | 0 | Manter | Asgorath | Sem bens cadastrados | Manter zero habitantes e nenhuma produção, conforme a catástrofe já definida. |
| Porto Naril | 10.230 | Manter | Asgorath | Velas 2,12, Alimentos conservados 1,12, Óleo 1,12 | Abastecimento naval e ligação com Ereth; preservar o perfil alto-élfico. |
| Porto Sarandir | 22.043 | Manter | Asgorath | Sem bens cadastrados | Perfil portuário hoje vazio: propor pesca/conservas, reparos e renda de docas/comércio. |
| Porto das Cinzas | 39.208 | Manter | Asgorath | Corantes 12,29, Velas 6,15, Alimentos conservados 4,10 | Pesca/conservas, cordas e reparos navais; retomar a ligação com Gugacon/Sarandir. |
| Rinnton | 25.078 | Manter | Asgorath | Destilados 2,42, Alimentos conservados 2,90, Cerâmica 1,93 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Rivertown | 28.344 | Manter | Asgorath | Grãos 120, Sabão 7, Alimentos conservados 3 | Manter 120 cargas de grãos/mês e fortalecer moagem/conservação e seus vínculos rurais. |
| Savhalla | 1.130 | 5.000 | Alqa | Joias 0,56 | Provisões, couro, arreios e comércio de caravanas; joias podem permanecer como atividade secundária. |
| Torre Solitária | 19.140 | 8.000 | Asgorath | Pesquisa arcana 1,38, Alimentos conservados 4,39, Vidro 1,27 | Pesquisa, livros, tinta e instrumentos; retirar criação de gado do perfil principal da escola. |
| Vila Sardinhas | 2.500 | Manter | Asgorath | Armas 0,75, Ferramentas 0,51 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Winterhelm | 51.874 | Manter | Asgorath | Armas de osso de dragão 4, Ossos de dragão 6, Sabão 16,55 | Manter ossos de dragão e suas armas; indústria rara, não extração ilimitada. |

### Elucitor

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Adhuc Vivere | 3.200 | Manter | Ros Leones | Ferramentas 3, Armas 2 | Manter ferramentas/armas e nenhum alimento local; abastecimento externo e natureza da população preservados. |
| Althor | 11.209 | Manter | Elucitor | Sabão 4,60, Alimentos conservados 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Arenor | 3.900 | 10.000 | Ros Leones | Velas 0,94, Couro 1 | Armas/equipamento e oficinas de uma marca marcial; não apenas velas e couro. |
| Argendau | 57.316 | Manter | Ros Leones | Livros 4, Ferramentas 2, Alimentos conservados 6 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Bomaria | 3.222 | Manter | Elucitor | Armas 1, Ferramentas 0,61 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Castamor | 5.500 | 10.000 | Ros Leones | Armas 0,75, Couro 1, Carvão 1 | Forjas menores, equipamento, couro e suprimentos; importações por passagens montanhosas. |
| Cetolo | 24.800 | Manter | Elucitor | Livros 2, Armas 1, Velas 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Condado de Alia | 13.000 | Manter | Elucitor | Velas 2,01, Alimentos conservados 2,01, Sabão 1,49 | Priorizar a agricultura da província e processamento/mercado local; não concentrar todos os lavradores na cidade. |
| Danumbria | 15.400 | Manter | Ros Leones | Pesquisa arcana 1,24, Ferramentas 2,01, Alimentos conservados 2,01 | Pesquisa arcana, manuscritos e insumos acadêmicos; manter abastecimento regional. |
| Elucitor | 1.005.030 | Manter; cenário compacto opcional: 300.000 | Elucitor | Livros 81, Alimentos conservados 106, Vidro 45 | Centro imperial diversificado; abastecimento, livros, administração e manufatura; rever escala antes de cortar capacidade. |
| Feixos | 32.108 | Manter | Ros Leones | Livros 4, Tinta 4, Papel 4 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Forte Drakis | 3.620 | Manter | Elucitor | Armas 1, Artilharia 0,81 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Ignis | 8.636 | Manter | Elucitor | Armas 2,32, Carvão 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Liotorn | 13.800 | Manter | Elucitor | Armas de forja anã 4, Ferramentas 8, Joias 2 | Manter prata, ferramentas e forja anã; preservar a decisão de não ser a principal origem do ouro. |
| Litorum | 10.354 | Manter | Elucitor | Velas 3,18, Alimentos conservados 1, Vinagre 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Lorvus | 2.267 | Manter | Elucitor | Ferramentas 1,13 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Meriadoc | 10.400 | Manter | Elucitor | Velas 3,19, Alimentos conservados 1, Vinagre 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Mestrina | 29.382 | Manter | Alqa | Tinta 4, Ferramentas 1, Sabão 2,69 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Nediora | 27.000 | Manter | Ros Leones | Armas 2,99, Carvão 3,99, Alimentos conservados 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Nirgona | 4.678 | Manter | Ros Leones | Armas 1,34, Carvão 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Nostris | 12.248 | Manter | Elucitor | Ferramentas 1, Velas 1,12, Alimentos conservados 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Odira | 18.246 | Manter | Ros Leones | Ferramentas 2, Armas 1, Carvão 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Pantos | 17.674 | Manter | Ros Leones | Armas 1, Ferramentas 1, Alimentos conservados 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Parnum | 20.772 | Manter | Elucitor | Armas 2, Sabão 2,39, Alimentos conservados 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Ros Leones | 22.200 | Manter | Ros Leones | Livros 2, Sabão 2,99, Alimentos conservados 2 | Armazéns, docas, reparos e redistribuição do Mar de Nur/Levante. |
| Tramor | 3.792 | Manter | Elucitor | Artilharia 0,90, Bronze 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Vedioria | 3.888 | Manter | Elucitor | Velas 0,94, Couro 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Vennoduro | 3.634 | 12.000 | Elucitor | Gemas 1,82, Armas 0,82, Couro 1 | Transporte do lago, hospedagem e torneios; gemas não precisam ser sua atividade principal. |
| Vilenages | 5.272 | Manter | Ros Leones | Ferramentas 0,64, Bronze 0,41, Carvão 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Vostris | 4.678 | Manter | Elucitor | Armas 1,34, Carvão 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

### Navï Velaffëll

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Allanan | 5.984 | 14.000 | Allanan | Armas 0,99, Couro 1, Carvão 1 | Reparos, provisões marítimas e redistribuição do mercado de Allanan. |
| Chaundor | 19.680 | Manter | Velaffeld | Armas 1, Alimentos conservados 3, Botas 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Garnalos | 21.410 | Manter | Allanan | Pesquisa arcana 1,46, Armas 2, Livros 1 | Pesquisa e livros ligados ao centro religioso/arcano; armas como complemento, não identidade dominante. |
| Himlumn | 27.322 | Manter | Allanan | Armas 4, Carvão 4, Alimentos conservados 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Jalha | 27.922 | Manter | Velaffeld | Livros 1,96, Alimentos conservados 4, Botas 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Karno'ande | 36.880 | Manter | Velaffeld | Ferramentas 4, Vestuário 2, Alimentos conservados 4 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Liriathyr | 21.190 | Manter | Velaffeld | Livros 3, Alimentos conservados 2,60, Tinta 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Lyadargor | 34.712 | Manter | Velaffeld | Ferramentas 2, Velas náuticas 3, Alimentos conservados 4 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Natheas | 31.556 | Manter | Velaffeld | Velas náuticas 2,78, Ferramentas 1, Alimentos conservados 4 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Nythan | 3.098 | Manter | Allanan | Armas 0,55, Couro 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Oraland Ise | 20.136 | Manter | Velaffeld | Armas 3, Carvão 3, Alimentos conservados 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Sahtalys | 17.600 | Manter | Allanan | Pesquisa arcana 1,33, Velas 3, Livros 0,79 | Pesquisa e saberes antigos; não inventar produção em massa de artefatos sombrios. |
| Sel-Shofela | 5.006 | Manter | Allanan | Moedas cunhadas 1, Joias 0,50, Velas 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Selne | 34.340 | Manter | Velaffeld | Livros 2,17, Vestuário 2, Alimentos conservados 4 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Velaffeld | 850.985 | Manter; cenário compacto opcional: 250.000 | Velaffeld | Navios 36, Velas náuticas 66,22, Alimentos conservados 85 | Grande estaleiro e centro mercantil/arcano; separar navios novos de manutenção da frota. |

### Valar

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Valari | 0 | Manter | Sem mercado | Sem bens cadastrados | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

### Drácon

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Amrithruk | 46.208 | Manter | Grenolk | Velas náuticas 5,10, Tecido 6, Alimentos conservados 5 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Auyalalagh | 22.790 | Manter | Porto do Álamo | Armas 2, Escravos 5, Ferramentas 1 | Captivos vinculados a eventos de conquista, não extração mensal espontânea de pessoas. |
| Drácon | 44.164 | Manter | Porto do Álamo | Armas 6, Carvão 6, Couro 3 | Reforçar armas, pólvora e artilharia do núcleo imperial, com insumos reais. |
| Glouyaloss | 5.794 | Manter | Grenolk | Armas 0,90, Carvão 1, Couro 0,60 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Guiras | 3.242 | Manter | Grenolk | Armas 0,62, Couro 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Hethlothloth | 57.604 | Manter | Grenolk | Livros 5, Botas 5, Alimentos conservados 6 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Ma'naar | 13.977 | Manter | Loueixo | Alimentos conservados 2, Velas 1, Tecido 1,99 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Malegreiro | 11.233 | Manter | Loueixo | Armas 1, Arreios 1, Alimentos conservados 1,62 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Metiscina | 13.987 | Manter | Loueixo | Vidro 2, Alimentos conservados 2, Velas 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Pinhem | 23.322 | Manter | Grenolk | Armas 2, Alimentos conservados 3, Carvão 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Sharntosz | 17.330 | Manter | Porto do Álamo | Armas 1, Artilharia 1, Ferramentas 1 | Oficinas militares e apoio logístico; suprir salitre, carvão e metais. |
| Urlyzaak | 35.264 | Manter | Loueixo | Alimentos conservados 8, Destilados 2,63, Cerâmica 2 | Polo naval do império: propor estaleiro, reparos, cordas e provisões. |
| Veltidin | 12.610 | Manter | Loueixo | Armas 1, Caça 10, Alimentos conservados 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Viacaledebo | 10.578 | Manter | Grenolk | Artilharia 0,29, Carvão 2, Alimentos conservados 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

### Sete Cidades

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Adush | 46.643 | Manter | Khegosla | Armas de forja anã 0,50, Ferro 8, Ferramentas 1 | Ampliar forja especializada sem retirar a autonomia das outras cidades anãs. |
| Allos | 11.064 | Manter | Khegosla | Ferro 10, Armas 1, Ferramentas 1 | Oficinas de forja anã apoiadas em ferro/cobre e carvão. |
| Kharagz | 13.798 | Manter | Khegosla | Armas 1,50, Ferro 7, Cobre 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Khizdush | 6.654 | Manter | Khegosla | Armas 1, Cobre 4, Estanho 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Shaled | 13.967 | Manter | Khegosla | Armas 1, Ferro 5, Prata 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Shararukthu | 4.576 | Manter | Khegosla | Ferro 5, Armas 0,50, Prata 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Shunzargil | 48.564 | Manter | Khegosla | Ferramentas 3, Ferro 12, Armas 1 | Manter extração mineral e ferramentas; substituir parte de armas genéricas por forja anã. |

### Husaj

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Alqa | 29.848 | Manter | Alqa | Artilharia 4, Ferramentas 1, Carvão 5 | Reorientar de artilharia para logística de caravanas, camelos, couro e provisões. |

### Khajataad

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Khegosla | 12.534 | Manter | Khegosla | Moedas cunhadas 3, Prata 5, Carvão 3 | Rever prata e moedas; dar espaço a peregrinação, intermediação, caça/couro e alimentos locais. |

### Veniun

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Aleravum | 22.600 | 12.000 | Alqa | Pesquisa arcana 1,50, Armas 2, Cobre 5 | Separar pesquisa/livros do perfil de cobre/armas herdado de Fovium. |
| Anteventium | 4.498 | 18.000 | Elucitor | Armas 1,25, Mel 2,25, Carvão 1 | Equipamento de aventura, provisões e contratos das guildas; não só mel, armas e carvão. |
| Fovium | 22.588 | Manter | Alqa | Ouro 4, Armas 2, Cobre 5 | Manter o ouro definido pelo autor; extração e apoio logístico, sem deslocá-lo de volta a Liotorn. |
| Odusonsium | 35.730 | Manter | Alqa | Livros 4, Tinta 3,86, Papel 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

### Território Orc

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Ginar | 58.848 | Manter | Khegosla | Artilharia 4, Ferramentas 4, Armas 2 | Retirar fabricação automática de artilharia; diferenciar comércio/forja e armamento adquirido. |
| Irkudh | 28.034 | Manter | Khegosla | Moedas cunhadas 3, Artilharia 1, Ferramentas 1 | Rever artilharia e cunhagem; produtos locais e comércio do clã. |
| Lulgard | 26.010 | Manter | Khegosla | Ferramentas 2, Armas 1,01, Moedas cunhadas 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Nudh | 21.814 | Manter | Khegosla | Armas 6,91, Couro 4 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

### Mountport

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Calha | 3.374 | Manter | Grenolk | Perfume 0,69, Vidro 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Coliras | 13.574 | Manter | Loueixo | Ferramentas 1, Sabão 1,79, Alimentos conservados 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Maleluz | 3.900 | Manter | Grenolk | Armas 0,95, Carvão 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Ridualhos | 26.884 | Manter | Loueixo | Vidro 5, Velas 2, Sabão 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Sobrirosen | 31.036 | Manter | Grenolk | Armas 3,52, Carvão 5, Alimentos conservados 3 | Rever predomínio bélico e ausência de agricultura rural no condado. |
| Vilaguezejo | 13.152 | Manter | Loueixo | Armas 1, Alimentos conservados 2, Areia branca 5 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Viras | 27.630 | Manter | Loueixo | Velas náuticas 2,82, Alimentos conservados 4, Tecido 3 | Reforçar atividade naval, alimentos e hospitalidade; ligação mercantil com Loueixo. |

### Goblinburgo

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Crild | 6.400 | Manter | Ros Leones | Armas 1,20, Carvão 1, Couro 0,60 | Pesca, reparos, intermediação e rede clandestina; não fazer de Crild todo Goblinburgo. |

### Piglia

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Gannas | 21.350 | Manter | Alqa | Armas 2, Livros 0,68, Alimentos conservados 2 | Livros e atividade civil; sem recolocar a escola de Aleravum em Gannas. |
| Hellas | 6.552 | 12.000 | Alqa | Armas 1,28, Couro 1, Carvão 1 | Livros, assistência, provisões e hospedagem; defesa como atividade complementar. |
| Orgener | 3.592 | Manter | Alqa | Armas 1, Moedas cunhadas 0,80 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Tessert | 3.890 | Manter | Alqa | Armas 0,95, Couro 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

### Marshell

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Chulagtoh | 33.066 | Manter até separar itinerantes; residentes condicionais: 7.000 | Grenolk | Velas 5, Vidro 5, Alimentos conservados 4 | Rebanhos, couro, arreios e provisões; vidro só com infraestrutura/insumos justificados. |
| Grainhem | 13.660 | Manter até separar itinerantes; residentes condicionais: 4.000 | Grenolk | Ferramentas 1, Alimentos conservados 2, Velas 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Tog Iret | 31.836 | Manter até separar itinerantes; residentes condicionais: 6.000 | Grenolk | Velas 15,93 | Cavalos, arreios, couro e feira sazonal; retirar velas como especialização principal. |
| Tonkhet | 3.638 | Manter até separar itinerantes; residentes condicionais: 1.500 | Grenolk | Vidro 0,80, Velas 0,23, Sabão 0,33 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Tserost | 6.424 | Manter até separar itinerantes; residentes condicionais: 2.000 | Khegosla | Armas 1,21, Couro 1, Carvão 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Urentog | 36.208 | Manter até separar itinerantes; residentes condicionais: 5.000 | Khegosla | Ferramentas 3, Livros 2,10, Alimentos conservados 4 | Equipamento de caravana/rebanhos e processamento de alimentos; distinguir assentamento e horda itinerante. |

### Duräk

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Bilnulbun | 24.840 | Manter | Grenolk | Armas 3, Alimentos conservados 2,42, Carvão 3 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Brelas | 35.834 | Manter | Grenolk | Livros 2, Cerâmica 3, Destilados 1,92 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Grenolk | 7.180 | 18.000 | Grenolk | Armas 1, Carvão 1, Alimentos conservados 0,59 | Forja, ferramentas, equipamento e comércio; minérios importados em vez de minas presumidas. |

### Reinos Médios

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Almirarem | 7.492 | 15.000 | Grenolk | Armas 1,75, Carvão 1, Couro 0,60 | Porto de acesso a Grenolk: armazéns, reparos e provisões marítimas. |
| Bral | 54.472 | Manter | Khegosla | Armas 5, Alimentos conservados 8, Carvão 5 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Braveira | 3.476 | Manter | Grenolk | Armas 0,74, Couro 1, Cânhamo 1,74 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Cananhos | 8.200 | Manter | Grenolk | Velas 2, Alimentos conservados 1, Vinagre 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Caspinho | 3.694 | Manter | Grenolk | Armas 1, Moedas cunhadas 0,85 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Paiaga | 25.484 | Manter | Grenolk | Artilharia 2, Bronze 2,74, Carvão 6 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Sanha | 3.572 | Manter | Grenolk | Perfume 0,79, Vidro 1, Gado bovino 1,79 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Varta | 13.468 | Manter | Grenolk | Perfume 1,73, Armas 1, Vidro 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Vinquertiro | 31.158 | Manter | Grenolk | Armas 3,58, Alimentos conservados 3, Carvão 4 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

### Vitravion

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Bernut | 4.400 | Manter | Porto do Álamo | Armas 1,19, Couro 1,01 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Guernica | 52.690 | Manter | Porto do Álamo | Vidro 9, Velas 4, Livros 2 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Gugacon | 3.460 | Desconhecida; fora do censo regular | Porto do Álamo | Moedas cunhadas 1,73 | Cidade perdida: sem população conhecida nem comércio regular; situação real mantida como mistério. |
| Guil | 13.400 | Manter | Porto do Álamo | Ferramentas 3, Carvão 3, Velas 0,69 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Kyon | 27.786 | Manter | Porto do Álamo | Artilharia 4, Ferro 7, Cerveja 2 | Manter população civil e apoio à Patrulha; reduzir fabricação de artilharia. |
| Lirion | 13.382 | Manter | Porto do Álamo | Ferramentas 3, Carvão 3, Velas 0,69 | Manter núcleo humano; não o recolocar na Tríplice Élfica nem inventar uma vocação rural obrigatória. |
| Mauron | 8.842 | Manter | Porto do Álamo | Armas 1,42, Carvão 2, Couro 1 | Fortalecer mineração e forja anã no território conhecido. |
| Oregon | 2.857 | Manter | Porto do Álamo | Joias 1,43 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Porto de Vern | 10.444 | Manter | Porto do Álamo | Armas 2, Arreios 1, Couro 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Porto do Álamo | 4.360 | 18.000 | Porto do Álamo | Armas 1,18, Couro 1 | Polo mercantil/portuário; docas, pesca/conservas e reparos, não apenas armas e couro. |
| Pyrenor | 4.214 | Manter | Porto do Álamo | Pesquisa arcana 0,65, Artilharia 2, Ferro 2,11 | Pesquisa dos mistérios do Norte; retirar artilharia como especialização da escola. |
| Sulpa | 13.400 | Manter | Porto do Álamo | Ferramentas 3, Carvão 3, Velas 0,69 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Triovorn | 3.286 | 6.000 | Porto do Álamo | Joias 1, Moedas cunhadas 0,64 | Oficinas, provisões e defesa da Tríplice Élfica; cunhagem não precisa ser o produto principal. |
| Vir | 7.230 | Manter | Porto do Álamo | Armas 1,62, Couro 1, Carvão 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Vyoh | 4.400 | Manter | Porto do Álamo | Armas 1,19, Couro 1,01 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

### Osmorn

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Alsas | 8.136 | Manter | Grenolk | Ferramentas 1,07, Mel 4,07, Velas 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Alveiras | 15.174 | Manter | Grenolk | Armas 1, Ferramentas 1, Bronze 0,71 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Olcanha | 45.698 | Manter | Grenolk | Vidro 5, Artilharia 1, Sabão 4 | Artesanato e abastecimento; manter vidro se houver insumos, rever artilharia genérica. |
| Porto Corujos | 564 | 3.500 | Loueixo | Moedas cunhadas 0,28, Argila 1 | Porto de apoio: reparos, provisões e renda de docas; cunhagem/argila não expressam seu papel. |
| Sobral | 11.096 | Manter | Ros Leones | Armas 1, Velas 1,55, Alimentos conservados 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Vila Candelápria | 50.232 | Manter | Ros Leones | Navios 2, Velas náuticas 4, Artilharia 1 | Cavalaria, equipamento e atividade civil; confirmar se embarcações são fluviais/lacustres. |

### Batovia

| Localidade | População atual | Proposta de população | Mercado atualizado | Capacidade atual: destaques / 30 dias | Produção/atividade proposta |
| --- | --- | --- | --- | --- | --- |
| Adinhoes | 13.885 | Manter | Loueixo | Velas 3,94, Alimentos conservados 2, Botas 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Forteirosin | 11.185 | Manter | Loueixo | Armas 1, Arreios 1, Alimentos conservados 1,59 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Loueixo | 85.490 | Manter | Loueixo | Navios 6, Cordas 12, Alimentos conservados 9 | Reforçar estaleiros e instrumentos de navegação; papel central na federação e no Pacto. |
| Osagos | 13.889 | Manter | Loueixo | Vidro 3,94, Alimentos conservados 2, Cerâmica 1 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Panhadaril | 13.937 | Manter | Loueixo | Pesquisa arcana 1,18, Vidro 2,97, Alimentos conservados 2 | Pesquisa experimental e instrumentos; relação com Pyrenor sem subordinação institucional. |
| Sobrizeloba | 13.853 | Manter | Loueixo | Armas 1, Alimentos conservados 2, Arreios 0,93 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |
| Tarinquer | 11.259 | Manter | Loueixo | Armas 1, Arreios 1, Alimentos conservados 1,63 | Manter o núcleo; ajustar a carteira segundo o perfil estadual acima e o terreno local, sem criar história ou indústria exclusiva nova. |

## Anexo B — as 67 províncias e seus recursos rurais

A linha mostra a produção rural separada das oficinas urbanas. Falta de bens não autoriza inventar população em ilhas sem história de ocupação.

| Província | Estado/região | População dos marcadores | Rural atual: destaques / 30 dias | Revisão proposta |
| --- | --- | --- | --- | --- |
| Ducado de Asgorath | Dragonfall | 479.329 | Caça 20; Cânhamo 36; Elefantes 4; Ovelhas 12; Vinho 8 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ilha de Gugacon | Dragonfall | 26.243 | Peles 4; Madeira 12; Caça 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Salão de Dagorah | Dragonfall | 7.408 | Peles 16; Madeira 48; Carvão 12; Âmbar 4; Grãos 24 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ducado de Ereth | Dragonfall | 37.540 | Ovelhas 12; Madeira 12; Cânhamo 12; Grãos 12; Areia branca 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Marca de Winterhelm | Dragonfall | 104.734 | Corantes 16; Caça 12; Mel 12; Madeira 24; Carvão 8 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Enseada das Cinzas | Dragonfall | 77.444 | Ovelhas 36; Âmbar 8; Caça 12; Madeira 24; Grãos 24 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Capitania de Amestrina | Dragonfall | 13.214 | Corantes 4; Ferro 4; Gado bovino 4; Tâmaras 4; Argila 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Distrito Imperial de Elucitor | Elucitor | 1.008.664 | Grãos 48; Peles 8; Mel 8; Madeira 12; Areia branca 8 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Protetorado de Rimae | Elucitor | 28.784 | Âmbar 4; Gado bovino 12; Madeira 24; Ovelhas 12; Caça 8 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Protetorado de Drakis | Elucitor | 33.002 | Grãos 48; Camelos 4; Corantes 4; Argila 8; Mel 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Marca de Althor | Elucitor | 22.540 | Gado bovino 36; Grãos 60; Corantes 12; Argila 24; Vinho 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Marca de Arenor | Elucitor | 67.160 | Ovelhas 36; Grãos 48; Gado bovino 16; Vinho 8; Mel 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Protetorado de Nùnar | Elucitor | 83.428 | Elefantes 20; Grãos 108; Âmbar 8; Corantes 8; Incenso 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Condado de Alia | Elucitor | 33.754 | Grãos 60; Cânhamo 48; Ovelhas 24; Madeira 24; Corantes 4 | Reforçar a vocação agrícola e a oferta para os grandes núcleos; calibrar a unidade da carga. |
| Marca de Castamor | Elucitor | 94.494 | Cânhamo 72; Corantes 12; Caça 24; Madeira 48; Mel 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Senhorio de Adhuc Vivere | Elucitor | 3.200 | Sem produção rural | Manter sem produção rural; não criar alimentos nas terras mortas. |
| Ilha de Ros Leones | Elucitor | 22.200 | Sem produção rural | Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção. |
| Ducado de Velaffeld | Navï Velaffëll | 905.377 | Madeira 72; Mel 28; Grãos 48; Caça 16; Peles 8 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Principado de Selne | Navï Velaffëll | 119.278 | Grãos 96; Madeira 72; Mel 24; Cânhamo 48; Ovelhas 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Dioocese de Garnalos | Navï Velaffëll | 48.732 | Grãos 84; Madeira 72; Corantes 8; Caça 12; Mel 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Costa de Natheas | Navï Velaffëll | 52.746 | Madeira 60; Caça 12; Grãos 24; Argila 16; Cânhamo 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ducado de Navï | Navï Velaffëll | 31.688 | Madeira 36; Grãos 36; Mel 16; Ovelhas 12; Corantes 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Terra morta de Valar | Valar | 0 | Sem produção rural | Manter sem produção rural; não criar alimentos nas terras mortas. |
| Ilhas de Valar | Valar | 0 | Sem produção rural | Manter sem produção rural; não criar alimentos nas terras mortas. |
| Ilhas de Valar | Valar | 0 | Sem produção rural | Manter sem produção rural; não criar alimentos nas terras mortas. |
| Capital Imperial de Drácon | Drácon | 96.758 | Âmbar 4; Cânhamo 12; Grãos 12; Argila 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Domínio de Guiras | Drácon | 65.822 | Grãos 48; Ovelhas 24; Corantes 4; Madeira 12; Cânhamo 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Domínio de Pinhem | Drácon | 103.716 | Madeira 36; Âmbar 4; Ovelhas 12; Gado bovino 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ilhas de Metiscina | Drácon | 13.987 | Sem produção rural | Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção. |
| Ilhas de Man'naar | Drácon | 37.820 | Caça 4; Areia branca 4; Argila 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Salão de Adush | Sete Cidades | 60.610 | Madeira 36; Corantes 4; Gemas 0,80; Carvão 4; Grãos 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Senhorio das Forjas de Allos | Sete Cidades | 15.640 | Madeira 24; Grãos 12; Caça 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Domínio de Pedra de Shunzargil | Sete Cidades | 69.016 | Peles 4; Madeira 12; Grãos 12; Gado bovino 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Emirado de Alqa | Husaj | 29.848 | Elefantes 12; Camelos 12; Corantes 8; Sal 16; Grãos 24 | Rever elefantes e cereal fora de áreas irrigáveis; priorizar deserto/caravanas. |
| Domínio de Khegosla | Khajataad | 12.534 | Grãos 24; Ovelhas 12; Argila 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ducado de Anteventium | Veniun | 27.098 | Peles 4; Carvão 4; Caça 4; Mel 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Condado de Fovium | Veniun | 58.318 | Madeira 36; Cobre 8; Peles 4; Ferro 4; Cânhamo 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Território do Clã de Lulgard | Território Orc | 112.892 | Grãos 84; Madeira 48; Corantes 8; Peles 8; Cânhamo 24 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Marca de Nudh | Território Orc | 21.814 | Ovelhas 12; Caça 8; Peles 4; Grãos 12; Mel 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Costa de Viras | Mountport | 27.630 | Caça 8; Grãos 12; Mel 4; Gado bovino 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Condado de Sobrirosen | Mountport | 31.036 | Sem produção rural | Investigar agricultura rural ausente no entorno de um núcleo populoso de um estado agrário/mercantil. |
| Distrito de Vilaguezejo | Mountport | 60.884 | Madeira 36; Gado bovino 12; Grãos 24; Ovelhas 12; Areia branca 8 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ilhas de Mountport | Mountport | 0 | Sem produção rural | Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção. |
| Ilhas de Mountport | Mountport | 0 | Sem produção rural | Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção. |
| Ilhas de Mountport | Mountport | 0 | Sem produção rural | Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção. |
| Burgo de Crild | Goblinburgo | 6.400 | Grãos 24; Areia branca 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Principado de Hellas | Piglia | 14.034 | Mel 12; Madeira 24; Cobre 4; Estanho 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Condado de Gannas | Piglia | 21.350 | Madeira 12; Gado bovino 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Campinas de Tog Iret | Marshell | 82.200 | Ovelhas 60; Grãos 48; Gado bovino 16; Mármore 4; Ferro 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Marca das Estepes de Tserost | Marshell | 42.632 | Ovelhas 24; Corantes 4; Grãos 12; Vinho 4; Gado bovino 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Salão de Grenolk | Duräk | 67.854 | Ovelhas 36; Corantes 8; Grãos 24; Cânhamo 12; Caça 4 | Florestas, combustível, agricultura local e oficinas; não presumir grandes jazidas montanhosas. |
| Costa de Almirarem | Reinos Médios | 49.920 | Ovelhas 12; Camelos 4; Gado bovino 8; Cânhamo 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Condado de Vinquertiro | Reinos Médios | 42.930 | Gado bovino 12; Ovelhas 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Marca de Bral | Reinos Médios | 58.166 | Ovelhas 12; Corantes 4; Mel 8; Caça 4; Areia branca 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Baronato de Guernica | Vitravion | 82.329 | Camelos 12; Elefantes 8; Madeira 36; Cânhamo 12; Caça 4 | Rever elefantes e adequar cultivo/pastoreio à zona árida; manter Guernica humana. |
| Costa do Álamo | Vitravion | 8.760 | Grãos 12; Argila 4; Areia branca 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ducado de Supla | Vitravion | 16.860 | Grãos 12; Areia branca 8 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Marca de Kyon | Vitravion | 40.842 | Ferro 16; Mármore 8; Corantes 8; Madeira 36; Carvão 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Tríplice Élfica | Vitravion | 20.960 | Grãos 36; Âmbar 4; Ovelhas 12; Vinho 8; Peles 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ilhas de Vitravion | Vitravion | 4.400 | Sem produção rural | Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção. |
| Ducado de Candelápria | Osmorn | 61.328 | Corantes 4; Madeira 12; Cânhamo 12; Mel 4; Vinho 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ducado de Alveiras | Osmorn | 69.008 | Madeira 24; Mel 8; Grãos 12; Cânhamo 12 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ilha Corujos | Osmorn | 564 | Argila 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ducado de Loueixo | Batovia | 113.232 | Argila 4 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Senhorio de Forteirosin | Batovia | 11.185 | Grãos 24 | Manter as origens plausíveis; conferir bioma e acesso; atribuir sítios ao mercado da posição se a província estiver dividida. |
| Ilhas Adinhoes | Batovia | 25.144 | Sem produção rural | Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção. |
| lha Panhadaril | Batovia | 13.937 | Sem produção rural | Revisar ocupação/insumos antes de adicionar sítios; ilhas não ocupadas podem continuar sem produção. |

## Conferência de números e limites da proposta

- Recorte: 30 dias de diagnóstico, sem salvar ou avançar o calendário. Produção realizada estimada: 20.708,82 PO a preços-base; comércio: 16.050,53 PO.
- Os valores de passagem pelas rotas não devem ser somados como se fossem comércio mundial novo: uma mesma compra pode passar por vários traçados.
- Valores monetários não são lucro, PIB completo, população total ou toneladas sem uma definição adicional de unidades e serviços.
- As cinco alterações de mercado e a exclusão do Norte foram aplicadas. Nenhuma sugestão de população, produto, quantidade, diplomacia, rota ou regra econômica deste documento foi aplicada.
