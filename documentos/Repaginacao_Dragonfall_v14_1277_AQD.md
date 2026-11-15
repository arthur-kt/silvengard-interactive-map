# Atlas de Silvengard v14 — Repaginação de Dragonfall (1277 AQD)

## Objetivo e fonte de referência

Revisar **as 17 localidades pertencentes ao Estado de Dragonfall** na versão atual do `world.json`, usando como referência a obra `Silvengard_Cronicas_do_Mundo_Conhecido_Edicao_Dinastica_1277_AQD.md`, especialmente **Dragonfall — províncias e localidades; identidade e geografia; culturas e religiões; a Queda Infernal e a Guerra das Relíquias**. Os perfis acompanham a situação do reino em 1277 AQD e evitam equiparar origem cultural, religião ou moralidade.

As classificações são **interpretações visuais** da obra, não alterações dos fatos do cânone. Nenhuma cidade muda de nome, Estado, população, coordenadas, cultura original ou soberania no mapa-múndi. Alguns nomes de bairros e monumentos são identificações **cenográficas propostas**, não denominações oficiais da história.

## Revisão cidade a cidade

| Localidade | Direção de arte / urbanismo | Intervenção visual implementada |
|---|---|---|
| **Asgorath** | Capital Dragonbane de base humana nortenha, mantendo estruturas herdadas da ocupação alto-élfica; lago e porto, Igreja de Mátilla | Preserva palácio régio monumental, muralha e distrito militar; acrescenta arcadas élficas antigas e templo de Mátilla, materiais mais solenes |
| **Ereth** | Centro alto-élfico ligado a Gavanon, com floresta e caminhos fluviais | Avenidas orgânicas, bairro-jardim, casas entre árvores, bosque e arcadas, mercado das pontes e embarcadouro |
| **Rivertown** | Cidade halfling, comunitária, hortas e travessias fluviais | Malha orgânica/rural, hortas e cercas, pequenos marcos de feira, materiais acolhedores; não replica cidade imperial |
| **Torre Solitária** | Escola de Gavanon associada à antiga torre sobrevivente da Queda Infernal | Torre arcana alta, fragmentos de alvenaria e santuário; preserva campus e muralhas |
| **Dagorah** | Salão anão de clãs, mineração e forjas, culto de Thur'rum | Mantém galerias subterrâneas navegáveis e portal; acrescenta oficinas/forjas no núcleo de acesso e tons de rocha talhada |
| **Malacatt** | Fundação khajitt, entre regiões relativamente úmidas e rotas comerciais | Ruas orgânicas, praça de comércio, pátio do Grande Espírito, materiais de madeira e solo úmido, sem confundir com a cidade goblin do pântano |
| **Savhalla** | Entreposto husajita do deserto de Amestris, com Al'Ashabab | Medina de baixa opulência; caravançarai com tendas e cargas, mercado de caravanas, tons de adobe e ocre |
| **Porto das Cinzas** | Porto comercial marcado pelo cataclismo; humanos, elfos negros, Remus e famílias mercantis | Cais e estaleiros cinzentos, vestígios escurecidos, cargueiros e armazéns; atividade comercial apesar das cicatrizes da Queda Infernal |
| **Winterhelm** | Fortaleza Windbear do norte, Senhor do Inverno, serra e memória de guerras | Preserva a cadeia montanhosa e fortaleza; acrescenta pedras cerimoniais do Grande Norte e posto de vigia nortenho |
| **Gugacon** | Cidade draconata vulcânica, devastada e em reconstrução após reabertura | Basalto, terraços escuros, oficina de recuperação e vestígios de pedra; não impõe uma única fé a todos os draconatos |
| **Rinnton** | Fortificação nortenha, tradição Corvenhal e Igreja de Mátilla | Reforço de torres de vigia, bastião, depósitos e pátios militares |
| **Clifshore** | Cidade de litoral e escarpas, vigias e pesca | Vigia costeira com torre, pequena área de pesca e armazéns; sem opulência palaciana |
| **Lakenford** | Localidade nortenha murada, defesa da neve e fé no Grande Norte | Torre de sinal, depósitos de inverno, cercas e pedras cerimoniais |
| **Nilhelm** | Localidade com **zero habitantes contabilizados** no mapa de 1277 | Converte o modelo local em **ruínas desabitadas**, sem casario ativo nem habitantes procedurais; preserva o marcador no mapa-múndi |
| **Vila Sardinhas** | Pequeno porto dos elfos da floresta, pesca e litoral arborizado | Casas simples, casas em árvores pontuais, bosque comunitário e racks de pesca; escala rural |
| **Porto Naril** | Porto alto-élfico de Ereth ligado a Gavanon Arcanus | Cais e arcos élficos, jardins e casas arborizadas; ligação visual com Ereth |
| **Porto Sarandir** | Porto draconato novo, da reabertura de Gugacon, Ordem de Bahamut | Docas de basalto, pátio de Bahamut em pedra clara, cargas e torre portuária simples, áreas de reassentamento |

## O que é efetivamente novo no aplicativo

- **Perfis urbanos novos ou refinados para as 17 cidades**: `pattern`, nomes de distritos, arquitetura, condicionantes culturais e densidade de bosque.
- **17 cenas externas com marcos 3D específicos**, gerados pelo módulo `dragonfall-v14-art.js`, com correspondência de localização na planta 2D (`dragonfallMarks`).
- **Paletas de materiais por cultura e local** em `material-presets.js`: pedra nortenha, madeira halfling, verde élfico, ocre husajita, cinzas e basalto, entre outras.
- **Habitantes simulados nas ruas** das cidades povoadas, retomando o sistema de caminhada já presente no Atlas. Nilhelm não recebe habitantes.
- **Compatibilidade com a v12 e v13**, inclusive Elucitor por distritos, Castamor, Lorvus, Rimae, Crild e interiores anões.
- **Gerador de plantas** atualizado para preservar os perfis v12–v14 se for executado novamente no futuro.
- **Plantas 2D exportadas em PNG** para todas as localidades de Dragonfall, dentro de `amostras-dragonfall-v14/`.

## Limites e o que não foi afirmado

- A arquitetura segue um modelo procedural de quarteirões e marcos; não é réplica arquitetônica precisa de cada edificação real.
- As figuras de árvores, torres, tendas, cais e templos são **representações exteriores**. Não foram adicionados interiores completos de palácios, templos, forjas ou navios, salvo os interiores anões já existentes.
- Os barcos/utensílios/mercadorias são elementos cênicos, não economia simulada em tempo real.
- Os distritos são zonas de geração local, **não divisões administrativas novas do mapa**.
- Testes de Node verificaram criação das geometrias e seus perfis, mas **o fluxo gráfico integral do executável no Windows ainda precisa de inspeção no computador**.
- A v10 continua oferecendo o instalador opcional de texturas CC0; as texturas externas reais não estão embutidas no ZIP até que o instalador seja executado.

## Arquivos principais

- `app/dist/dragonfall-v14-art.js`: marcos culturais de Dragonfall.
- `app/dist/city-blueprints.json`: perfis de arquitetura, distrito e território.
- `app/dist/town.js`: composição das cidades e circulação de moradores.
- `app/dist/street.js`: estilos por cultura e tratamento de Nilhelm.
- `app/dist/material-presets.js`: materiais locais.
- `app/dist/city-plan-core.js`, `city-plan-preview.js`: leitura do perfil e mapas 2D.
- `desenvolvimento/ferramentas/revisar_dragonfall_v14.py`: regeneração idempotente dos perfis de Dragonfall.
- `desenvolvimento/testes/dragonfall-v14.test.mjs`: testes específicos.

## Instalação

1. Fazer cópia da instalação original `silvengard-interactive-map`.
2. Extrair este ZIP **na pasta que contém** `silvengard-interactive-map`, aceitando a substituição de arquivos.
3. Executar `Silvengard-Atlas.exe` da instalação original.
4. Opcional: executar `INSTALAR-TEXTURAS-CC0.bat` na instalação, conectado à internet, para baixar os materiais CC0 da v10.

**Este arquivo é um upgrade, não contém instalador completo nem o `.exe`.**
