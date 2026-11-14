# Atlas de Silvengard — upgrade das plantas urbanas (1277 AQD)

## Revisão v4 — interiores anões navegáveis

A v3 apenas acrescentava um paredão de montanha e um portão; isso não equivalia a uma cidade subterrânea. A v4 inclui efetivamente uma **cena 3D interna separada** em cada uma das sete cidades subterrâneas: piso caminhável, teto rochoso, paredes com colisão, colunas, iluminação, desníveis, salão central, quatro galerias principais e oito câmaras de anexos, num total de **13 espaços conectados** por galerias. O modelo interno é acessado no botão **⛏ Entrar na montanha** ou na entrada monumental por meio da tecla E, e pode ser explorado em primeira pessoa com WASD/Shift. No subsolo, o botão **▦ Mapa das galerias** apresenta a mesma topologia do 3D.

A geração troca o grande casario externo das cidades escavadas por um acesso fortificado mais enxuto; as cidades híbridas e de superfície não recebem o teleporte subterrâneo. A mudança se aplica a Dagorah, Mauron, Liotorn, Khizdush, Adush, Shararukthu e Shunzargil, e respeita as anteriores distinções de Grenolk e as demais.

**Escopo real:** o ambiente implementado representa o núcleo público de cada cidade, não a cidade inteira com todas as habitações, oficinas e túneis em escala de população. A transição entre exterior e cavernas carrega uma cena separada; não há um túnel único aberto que ligue fisicamente as duas malhas. Sem NPCs internos nesta versão. Todas as 13 câmaras são procedurais e não copiadas do Watabou.

## O que o arquivo de Azgaar fornece

- `Silvangad 5.0.map`: 239 localidades ativas; dados de posicao e caracteristicas.
- 12 links Watabou no `.map`, que guardam sementes e parametros, **nao** a geometria das plantas.
- 152 localidades do Atlas recebem perfil procedural no arquivo `city-blueprints.json`.
- 36 localidades tiveram diferenca de mais de 26 unidades de mapa relativamente ao registro original.
- As novas malhas de rua, edificios e muralhas sao **interpretacoes 3D**, nao importacoes exatas das plantas Watabou.
- A identidade e a posicao atual do Atlas sao preservadas. As cidades deslocadas podem adotar uma base geografica proxima.
- **Elucitor**: ilha irregular fechada; agua em todo o contorno do terreno local, inclusive atras da cidade.

## Correspondencias utilizadas

| ID | Cidade no Atlas | Tracado | Base de referencia | Metodo | Deslocamento | Link original |
|---:|---|---|---|---|---:|---|
| 1 | Velaffeld | elfic-organic | Velaffeld (#1) | watabou-semente | 0.0 | sim |
| 2 | Ereth | elfic-organic | Ereth (#2) | watabou-semente | 137.4 | sim |
| 3 | Asgorath | capital-fan | Asghorat (#3) | watabou-semente | 77.3 | sim |
| 4 | Rivertown | trading-town | Atapurnobun (#221) | proximidade | 111.2 | nao |
| 5 | Torre Solitária | organic-town | Torre Solitária (#5) | identidade-relocada | 33.2 | nao |
| 6 | Anteventium | imperial-grid | Anteventium (#6) | identidade | 0.0 | nao |
| 7 | Elucitor | imperial-grid | Elucitor (#7) | watabou-semente | 0.0 | sim |
| 8 | Valari | ruins | Valari (#8) | watabou-semente | 0.0 | sim |
| 9 | Alqa | desert-medina | Alqa (#9) | identidade-relocada | 70.3 | nao |
| 10 | Dagorah | dwarven-terraces | Dagorah (#10) | identidade | 19.2 | nao |
| 11 | Malacatt | organic-town | Mallacatt (#11) | identidade-relocada | 37.9 | nao |
| 12 | Savhalla | desert-medina | Getiaputum (#58) | proximidade | 62.0 | nao |
| 13 | Vila Candelápria | harbor-front | Vila Candelápria (#13) | identidade | 0.0 | nao |
| 14 | Gugacon | ruins | Vern (#26) | proximidade | 39.3 | nao |
| 15 | Ignis | fortress | Onimbricum (#188) | proximidade | 70.1 | nao |
| 16 | Vir | fortress | Triovorn (#19) | proximidade | 27.0 | nao |
| 17 | Nostris | fortress | Nostris (#17) | watabou-semente | 97.5 | sim |
| 18 | Porto das Cinzas | harbor-front | Timber (#34) | proximidade | 120.6 | nao |
| 19 | Triovorn | fortress | Triovorn (#19) | identidade-relocada | 50.8 | nao |
| 20 | Lorvus | imperial-grid | Lorvus (#20) | watabou-semente | 55.6 | sim |
| 21 | Guernica | organic-town | Guernica (#21) | identidade-relocada | 49.2 | nao |
| 22 | Drácon | volcanic | Drácon (#22) | identidade-relocada | 55.3 | nao |
| 23 | Winterhelm | fortress | Winterhelm (#23) | watabou-semente | 0.0 | sim |
| 24 | Forte Drakis | fortress | Lintum (#139) | proximidade | 122.8 | nao |
| 25 | Kyon | organic-town | Mauron (#29) | proximidade | 53.6 | nao |
| 26 | Porto de Vern | fortress | Telhaca (#98) | proximidade | 82.7 | nao |
| 27 | Tramor | imperial-grid | Andigantia (#204) | proximidade | 53.2 | nao |
| 28 | Vostris | fortress | Vostris (#28) | watabou-semente | 119.8 | sim |
| 29 | Mauron | dwarven-terraces | Mauron (#29) | identidade-relocada | 41.5 | nao |
| 30 | Porto do Álamo | harbor-front | Porto do Álamo (#30) | identidade-relocada | 40.9 | nao |
| 31 | Lirion | organic-town | Lirion (#31) | identidade-relocada | 29.3 | nao |
| 32 | Oregon | organic-town | Brerao (#125) | proximidade | 59.9 | nao |
| 33 | Gugacon | volcanic | Gugacon (#33) | watabou-semente | 0.0 | sim |
| 34 | Rinnton | fortress | Rosemide (#95) | proximidade | 120.9 | nao |
| 35 | Argendau | imperial-grid | Argendau (#35) | identidade | 24.2 | nao |
| 36 | Grenolk | dwarven-terraces | Gulukkharb (#36) | identidade | 0.0 | nao |
| 38 | Viacaledebo | organic-town | Viacaledebo (#38) | identidade | 0.0 | nao |
| 45 | Almirarem | harbor-front | Almirarem (#45) | identidade | 0.0 | nao |
| 51 | Clifshore | organic-town | Clifshiel (#51) | identidade | 18.0 | nao |
| 52 | Hethlothloth | volcanic | Hethlothloth (#52) | identidade | 0.0 | nao |
| 53 | Oraland Ise | elfic-organic | Oraland Ise (#53) | identidade | 0.0 | nao |
| 56 | Viras | harbor-front | Viras (#56) | identidade | 0.0 | nao |
| 61 | Allanan | elfic-organic | Nanalyelumy (#61) | identidade | 0.0 | nao |
| 62 | Vilenages | imperial-grid | Bonimbridu (#208) | proximidade | 58.9 | nao |
| 67 | Himlumn | elfic-organic | Himlumytenor (#67) | identidade | 0.0 | nao |
| 68 | Parnum | imperial-grid | Parnum (#68) | identidade | 0.0 | nao |
| 69 | Odira | imperial-grid | Odira (#69) | identidade | 0.0 | nao |
| 70 | Sel-Shofela | elfic-organic | Sel-Shofela (#70) | identidade-relocada | 40.9 | nao |
| 72 | Lulgard | organic-town | Lulgard (#72) | identidade | 0.0 | nao |
| 75 | Tserost | steppe-camp | Tsetsogt (#75) | identidade | 0.0 | nao |
| 77 | Jalha | elfic-organic | Jalha (#77) | identidade | 0.0 | nao |
| 78 | Lyadargor | elfic-organic | Lyadargor (#78) | identidade | 0.0 | nao |
| 81 | Chaundor | elfic-organic | Chaundor (#81) | identidade | 0.0 | nao |
| 85 | Glouyaloss | harbor-front | Glouyaloss (#85) | identidade | 0.0 | nao |
| 88 | Maleluz | trading-town | Maleluz (#88) | identidade | 0.0 | nao |
| 89 | Sobrirosen | trading-town | Sobrirosen (#89) | identidade | 0.0 | nao |
| 90 | Vilaguezejo | harbor-front | Vilaguezejo (#90) | identidade | 0.0 | nao |
| 92 | Allos | dwarven-terraces | Allos (#92) | identidade | 0.0 | nao |
| 93 | Bral | organic-town | Bral (#93) | identidade | 0.0 | nao |
| 96 | Selne | elfic-organic | Selne (#96) | identidade | 0.0 | nao |
| 99 | Braveira | organic-town | Braveira (#99) | identidade | 18.2 | nao |
| 100 | Varta | trading-town | Varta (#100) | identidade | 0.0 | nao |
| 102 | Paiaga | trading-town | Paiaga (#102) | identidade | 0.0 | nao |
| 104 | Cananhos | organic-town | Caganho (#104) | identidade | 11.0 | nao |
| 108 | Pinhem | organic-town | Pinhem (#108) | identidade | 0.0 | nao |
| 109 | Vedioria | imperial-grid | Vedioria (#109) | identidade | 0.0 | nao |
| 110 | Bilnulbun | dwarven-terraces | Bilnulbun (#110) | identidade | 0.0 | nao |
| 113 | Nirgona | imperial-grid | Premapuri (#113) | identidade | 0.0 | nao |
| 115 | Ridualhos | trading-town | Ridualhos (#115) | identidade | 0.0 | nao |
| 116 | Feixos | imperial-grid | Funco (#116) | identidade-relocada | 26.7 | nao |
| 119 | Nudh | organic-town | Nudh (#119) | identidade | 0.0 | nao |
| 120 | Lakenford | fortress | Steamouth (#120) | identidade | 0.0 | nao |
| 127 | Shunzargil | dwarven-terraces | Shunzargil (#127) | identidade | 0.0 | nao |
| 128 | Natheas | elfic-organic | Natheas (#128) | identidade | 0.0 | nao |
| 129 | Hellas | imperial-grid | Hellas (#129) | identidade | 0.0 | nao |
| 130 | Gannas | organic-town | Aleravum (#130) | identidade | 0.0 | nao |
| 132 | Auyalalagh | organic-town | Auyalalagh (#132) | identidade | 0.0 | nao |
| 134 | Odusonsium | organic-town | Odusonsium (#134) | identidade | 0.0 | nao |
| 135 | Sanha | organic-town | Sanha (#135) | identidade | 0.0 | nao |
| 136 | Sharntosz | harbor-front | Sharntosz (#136) | identidade | 0.0 | nao |
| 137 | Vinquertiro | organic-town | Vinquertiro (#137) | identidade | 0.0 | nao |
| 138 | Tonkhet | steppe-camp | Tonkhet (#138) | identidade | 0.0 | nao |
| 140 | Tog Iret | steppe-camp | Tog Iret (#140) | identidade | 25.6 | nao |
| 142 | Urlyzaak | harbor-front | Urlylithalazak (#142) | identidade | 0.0 | nao |
| 143 | Chulagtoh | steppe-camp | Chulagtoh (#143) | identidade | 0.0 | nao |
| 147 | Litorum | imperial-grid | Litorum (#147) | identidade | 0.0 | nao |
| 149 | Grainhem | steppe-camp | Grainhem (#149) | identidade | 23.3 | nao |
| 150 | Brelas | dwarven-terraces | Brelas (#150) | identidade | 0.0 | nao |
| 153 | Guiras | organic-town | Guiras (#153) | identidade | 0.0 | nao |
| 154 | Alveiras | organic-town | Alveiras (#154) | identidade | 0.0 | nao |
| 158 | Alsas | organic-town | Alsas (#158) | identidade | 0.0 | nao |
| 159 | Olcanha | organic-town | Olcanha (#159) | identidade | 0.0 | nao |
| 160 | Pantos | imperial-grid | Moufeixas (#212) | proximidade | 195.4 | nao |
| 161 | Bomaria | imperial-grid | Himlaquana (#198) | proximidade | 84.8 | nao |
| 164 | Calha | trading-town | Calha (#164) | identidade | 0.0 | nao |
| 168 | Pyrenor | organic-town | Pirerewick (#168) | identidade | 0.0 | nao |
| 169 | Irkudh | organic-town | Irkudh (#169) | identidade | 0.0 | nao |
| 170 | Ginar | dwarven-terraces | Ginar (#170) | identidade | 0.0 | nao |
| 174 | Caspinho | organic-town | Caspinho (#174) | identidade | 0.0 | nao |
| 176 | Khizdush | dwarven-terraces | Khizdush (#176) | identidade | 0.0 | nao |
| 177 | Kharagz | dwarven-terraces | Kharagz (#177) | identidade | 0.0 | nao |
| 179 | Urentog | steppe-camp | Urentog (#179) | identidade | 0.0 | nao |
| 180 | Orgener | steppe-camp | Orgayankher (#180) | identidade-relocada | 38.9 | nao |
| 181 | Liriathyr | elfic-organic | Liriathyr (#181) | identidade | 0.0 | nao |
| 182 | Tessert | steppe-camp | Tsogtsogt (#182) | identidade | 0.0 | nao |
| 183 | Mestrina | imperial-grid | Momaco (#183) | identidade | 0.0 | nao |
| 184 | Fovium | organic-town | Fovium (#184) | identidade | 0.0 | nao |
| 189 | Garnalos | elfic-organic | Oshanalos (#189) | identidade | 0.0 | nao |
| 191 | Vennoduro | imperial-grid | Tredetorum (#146) | proximidade | 32.6 | nao |
| 197 | Althor | fortress | Althor (#197) | watabou-semente | 60.6 | sim |
| 199 | Amrithruk | volcanic | Amrithruk (#199) | identidade | 0.0 | nao |
| 202 | Nythan | elfic-organic | Nythan (#202) | identidade | 0.0 | nao |
| 207 | Sobral | organic-town | Sobral (#207) | identidade | 0.0 | nao |
| 211 | Coliras | trading-town | Coliras (#211) | identidade | 0.0 | nao |
| 214 | Khegosla | organic-town | Quegosola (#214) | identidade-relocada | 66.3 | nao |
| 220 | Karno'ande | elfic-organic | Karno'ande (#220) | identidade | 0.0 | nao |
| 223 | Crild | marsh-causeways | Crild (#223) | identidade | 0.0 | nao |
| 224 | Loueixo | harbor-front | Loueixo (#224) | identidade | 0.0 | nao |
| 225 | Forteirosin | harbor-front | Forteirosin (#225) | identidade | 0.0 | nao |
| 226 | Panhadaril | harbor-front | Panhadaril (#226) | identidade | 0.0 | nao |
| 227 | Tarinquer | harbor-front | Tarinquer (#227) | identidade | 0.0 | nao |
| 228 | Adinhoes | harbor-front | Adinhoes (#228) | identidade | 0.0 | nao |
| 229 | Malegreiro | harbor-front | Malegreiro (#229) | identidade | 0.0 | nao |
| 230 | Veltidin | harbor-front | Veltidikivgit (#230) | identidade | 0.0 | nao |
| 232 | Ma'naar | harbor-front | Ma'naar (#232) | identidade | 0.0 | nao |
| 233 | Metiscina | harbor-front | Metiscinthaxis (#233) | identidade | 0.0 | nao |
| 235 | Sobrizeloba | trading-town | Sobrizeloba (#235) | identidade | 0.0 | nao |
| 236 | Osagos | trading-town | Osagos (#236) | identidade | 0.0 | nao |
| 237 | Shaled | dwarven-terraces | Shaled (#237) | identidade | 0.0 | nao |
| 238 | Adush | dwarven-terraces | Adush (#238) | watabou-semente | 0.0 | sim |
| 239 | Shararukthu | dwarven-terraces | Shararukthu (#239) | identidade | 0.0 | nao |
| 242 | Porto Corujos | harbor-front | Porto Corujos (#242) | identidade | 2.6 | nao |
| 1239 | Arenor | fortress | Nigripina (#152) | proximidade | — | nao |
| 1240 | Castamor | fortress | Argendau (#35) | proximidade | — | nao |
| 1241 | Nediora | imperial-grid | Ducuscia (#114) | proximidade | — | nao |
| 1242 | Meriadoc | imperial-grid | Nigripiro (#157) | proximidade | — | nao |
| 1243 | Cetolo | imperial-grid | Nigripina (#152) | proximidade | — | nao |
| 1244 | Alia | imperial-grid | Lorimine (#48) | proximidade | — | nao |
| 2000 | Danumbria | imperial-grid | Cacho (#163) | proximidade | — | nao |
| 2001 | Adhuc Vivere | fortress | Bomaria (#161) | proximidade | — | nao |
| 2002 | Ros Leones | imperial-grid | Aethei (#40) | proximidade | — | nao |
| 2003 | Nilhelm | organic-town | Ignis (#15) | proximidade | — | nao |
| 2004 | Vila Sardinhas | forest-settlement | Sherin (#219) | proximidade | — | nao |
| 2006 | Sulpa | organic-town | Kyon (#25) | proximidade | — | nao |
| 2007 | Guil | organic-town | Houndpassti (#94) | proximidade | — | nao |
| 2008 | Bernut | harbor-front | Contexto historico/cultural | historico-cultural | — | nao |
| 4000 | Liotorn | dwarven-terraces | Nunar (#241) | proximidade | — | nao |
| 4001 | Vyoh | organic-town | Porto do Álamo (#30) | proximidade | — | nao |
| 4002 | Sahtalys | elfic-organic | Nanalyelumy (#61) | proximidade | — | nao |
| 4003 | Aleravum | organic-town | Aleravum (#130) | identidade-relocada | 51.3 | nao |
| 10001 | Porto Naril | elfic-organic | Meethethyr (#217) | proximidade | — | nao |
| 10002 | Porto Sarandir | harbor-front | Gugacon (#33) | proximidade | — | nao |


## Ajustes visuais adicionais desta revisao

- **Asgorath, Elucitor e Velaffeld** agora recebem um **distrito palaciano** dedicado, tratado como cidade alta/cidadela.
- **Elucitor** passa a ter distritos mais explicitamente separados: **cidade alta/palacio**, **bairro alto**, **porto e armazens**, **mercado baixo**, **grande templo**, **bairro nobre** e **cidade baixa**.
- **Winterhelm** recebeu um **maciço montanhoso encostado em um dos lados** da cidade, para reforcar a leitura de fortaleza de fronteira.
- **Dagorah** passa a ser tratada como uma cidade ana **embutida na montanha**, com paredao rochoso proximo e **portal monumental** de entrada, alem do perfil de terracos.
- Os novos distritos usam lotes e marcos diferentes (palacios, armazens, bairros nobres, pracas altas), mas continuam dentro do modelo procedural do Atlas.

## Classificacao proposta para as cidades anas

### Subterraneas
- Dagorah
- Mauron
- Liotorn
- Khizdush
- Adush
- Shararukthu
- Shunzargil

### Hibridas (superficie + galerias)
- Shaled
- Kharagz

### De superficie
- Grenolk
- Allos
- Ginar
- Brelas
- Bilnulbun

Nesta revisao do upgrade, as cidades do primeiro grupo recebem parede montanhosa proxima e um tratamento de **cidade anã dentro da montanha**, com portao monumental. As cidades do segundo grupo recebem uma montanha encostada e leitura de fortaleza de encosta, mas sem serem tratadas como plenamente subterraneas. O terceiro grupo permanece com urbanismo anao de superficie, sem montanha artificial imediata.

## Limites de fidelidade

O arquivo `.map` nao inclui os poligonos de casas, lotes e vias do gerador Watabou. As doze sementes preservadas podem recriar o desenho no site do gerador, mas a cena 3D deste upgrade usa sua propria geracao deterministica de ruas, com perfil, clima e escala do Atlas.
Uma importacao geometrica exata exigiria os SVG/JSON exportados do Watabou para cada cidade.

## Compatibilidade

O upgrade modifica apenas os arquivos da visao local e adiciona dados de planta; nao altera `world.json`, economia, territorios, fichas ou edicoes anteriores.
