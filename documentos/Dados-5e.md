# Dados de D&D 5e no Atlas

**O que foi implementado, como regenerar e o que é provisório.**

---

## 1. Leitor de fichas `.cah`

O botão **Fichas** no cabeçalho abre o painel de personagens. A primeira aba importa o arquivo `.cah` do antigo **D&D 5e Companion** — o mesmo formato da ficha `character_Tytos_Karnenhall.cah`.

O leitor extrai:

- nome, jogador, alinhamento, retrato, experiência, datas;
- raça, classes, subclasse, estilo de luta (subtype), nível e bônus de proficiência;
- atributos, modificadores, salvaguardas e 18 perícias com proficiência;
- CA (armadura + escudo + Destreza quando aplicável), PV, deslocamento, iniciativa e percepção passiva;
- CD de magia e ataque mágico (quando a classe conjura);
- ataques com acerto, dano, versátil e tipo;
- magias por nível, com tempo de conjuração, alcance, duração, componentes, descrição e níveis superiores;
- armaduras equipadas, equipamento, moedas e proficiências;
- habilidades de classe, raça, antecedente e subclasse até o nível atual;
- recursos com **usos** (Divine Sense) e **pools** (Lay on Hands);
- anotações e até 3 versões anteriores do `.cah`.

O arquivo bruto é guardado no **IndexedDB** do navegador. Nada é enviado para servidor. Reimportar a mesma ficha (mesmo `id`) cria uma versão anterior baixável.

### O que o `.cah` contém

É um JSON grande (o Tytos tem ~1,7 MB, incluindo o retrato em base64). Os campos principais são:

```text
name, player, alignmentName, level (via jobs), jobs, allRequiredClasses.jobs,
requiredRace, requiredBackground, strength..charisma, skills, proficiencies,
hp, baseHp, tempHp, ac, armors, weapons, equipment, spells, spellSlots,
specialAbilities, selectableFeatures, notes, image, created, updated
```

As classes, a raça e o antecedente vêm **embutidos** como strings JSON (`allRequiredClasses.jobs`, `requiredRace`, `requiredBackground`). Por isso o leitor funciona sem consultar o repositório para ler a ficha.

### 1.1. Ficha jogável (estado de mesa)

A ficha não é só leitura. O Atlas mantém um **estado de jogo** separado do arquivo original, no IndexedDB:

- **PV atual**, PV temporários, dano/cura rápidos, **descanso curto** (gasta dados de vida e cura) e **descanso longo** (restaura PV, espaços, recursos e dados de vida);
- **Dados de vida** por classe/nível, com gasto no descanso curto;
- **Recursos com usos** (marcadores) e **pools** (Lay on Hands, Ki, Pontos de Feitiçaria): botões de gastar, restaurar e a distinção visual `USOS` / `POOL`; recursos de descanso curto (Channel Divinity, Ki, Action Surge, Wild Shape, Pact Magic, Bardic Inspiration) são restaurados no descanso curto;
- **Condições** (15 condições comuns), **exaustão** 0–6, **carga automática** (soma armaduras, armas, itens e moedas; ajuste manual opcional e variante), **testes de morte** e estabilização;
- **Magias preparadas**, **conhecidas**, **truques** e **grimório**: limites por classe (paladino/artífice = modificador + metade do nível; clérigo/drugo/mago = modificador + nível; bardo/feiticeiro/bruxo/patrulheiro usam a tabela de conhecidas; mago tem grimório 6 + 2/nível);
- **Espaços de magia** por nível, com `restante/máximo`; o botão **Conjurar** abre a escolha de espaço (upcast), mostra o texto de **nível superior** e gasta o espaço escolhido; truques não gastam; warlock usa espaços de pacto;
- **Rolagem de dados**: aba **Dados** com expressões tipo `10d20+2`, `2d6+1d8+3`, histórico e atalhos d4–d100;
- **Equipar/desequipar armadura e escudo** recalcula CA e deslocamento automaticamente (armadura pesada com Força insuficiente reduz o deslocamento em 10 pés);
- **Armas e armaduras em ficha nativa** também são automáticas: arrastar uma armadura cria a armadura, equipar recalcula CA e o peso; arrastar uma arma cria o ataque;
- **Sintonia** de até 3 itens mágicos; bônus de CA de itens comuns (Ring/Cloak of Protection, Bracers of Defense, Ioun Stone) e efeitos ativos **Shield** e **Mage Armor**;
- **XP** com a tabela padrão do 5e (0, 300, 900, 2.700, 6.500, 14.000, 23.000, 34.000…) e **calculadora de XP por encontro** com multiplicador de monstros e dificuldade (fácil/médio/difícil/mortal); o XP pode ser aplicado a **todas as fichas selecionadas**, não só à ativa;
- **Subir nível** também para `.cah` importado: o Atlas edita uma **cópia interna** (jobs/level, HP/baseHp, espaços, atributos), nunca o arquivo original no disco;
- **Arrastar magias/itens/armas/armaduras** do compêndio para a ficha;
- **Baixar ficha** exporta a cópia de trabalho (`.cah` ou JSON nativo).

### 1.2. Mesa tática 2D (VTT-lite)

O botão **Tabuleiro** abre uma mesa tática 2D:

- grade de **30 × 20 quadrados**, cada quadrado = **5 pés**;
- adicionar **personagens** das fichas salvas e **monstros** do bestiário (1.416);
- arrastar tokens; o deslocamento é comparado com o `speed` da ficha/monstro e o token avisa quando passa;
- **sem depender do scroll**: o token selecionado tem setas `← ↑ ↓ →` para andar um quadrado, e a visão tem botões de panorâmica/zoom (`← ↑ ↓ →`, `+`, `−`, `1:1`); arrastar o fundo também move a visão;
- **Medir**: dois cliques mostram a distância em pés;
- **Área**: escolher uma magia do personagem selecionado e clicar no mapa; o Atlas lê a descrição e desenha **raio/esfera, cone, linha ou cubo** na escala de 5 pés, mostrando também o alcance;
- **Terreno difícil**: modo “Difícil” pinta quadrados; o custo de movimento passa a 10 pés por quadrado pintado;
- **Iniciativa e turnos**: rolar iniciativa (d20 + bônus), ordem, rodada, próximo/anterior, destaque do token do turno;
- **PV sincronizado**: os botões −1/+1 PV do token atualizam a ficha de personagem;
- **Salvar/carregar combate**: guarda tokens, terreno e iniciativa no `localStorage`; há **modelos** prontos (goblins, orcs, kobolds, esqueletos, lobos etc.);
- **Nova rodada** zera o movimento dos tokens;
- estado do tabuleiro persistido no `localStorage`;
- tokens de personagem usam PV, speed e nome atuais da ficha ao abrir o tabuleiro.

No modo local, o HUD ganhou o botão **⚔ Combate**, que fecha a visão local e abre a mesa tática. A mesa é 2D por enquanto; a versão 3D pode reaproveitar a cena local depois.

> O arquivo `.cah` original em `character/` não é alterado. Se você reimportar o mesmo `id`, o Atlas guarda uma versão anterior no histórico.

---

## 2. Compêndio 5e

O pacote é gerado a partir de `systems/5e` do repositório
[`blastervla/rpg-companion-app-systems`](https://github.com/blastervla/rpg-companion-app-systems),
**somente a versão 5e (2014)**, não a 5.5e/2024.

| Categoria | Registros |
|---|---:|
| Magias | 538 |
| Monstros | 1.416 |
| Itens | 734 |
| Armas | 194 |
| Armaduras | 62 |
| Talentos | 148 |
| Raças | 101 |
| Antecedentes | 91 |
| Classes | 16 (208 subclasses) |
| Encontros | 11 |
| Fontes | 72 |
| **Total** | **3.383** |

O pacote final tem cerca de **5 MB** de JSON compacto e é carregado por categoria, sob demanda. Monstros incluem ações, ações bônus, reações, ações lendárias, salvaguardas, resistências, imunidades e vulnerabilidades; classes incluem features por nível e subclasses.

Arquivos em `app/dist/5e/`:

```text
manifest.json
spells.json      monsters.json     items.json
weapons.json     armors.json       feats.json
races.json       backgrounds.json  classes.json
encounters.json  sources.json
```

> **Licença:** esses dados são de terceiros. O repositório de origem declara CC BY-NC-SA 4.0 no README e CC BY-NC 4.0 no LICENSE.md, e o conteúdo inclui material da Wizards of the Coast que não é só SRD. O pacote **não é código MIT do Atlas** e é ignorado pelo Git (`app/dist/5e/`). Para uso público/comercial, use o SRD 5.1 (CC BY 4.0) ou dados importados pelo usuário. Veja a análise completa em [Analise-Integracao-RPG-Companion.md](Analise-Integracao-RPG-Companion.md).

---

## 3. Como regenerar o pacote

Pré-requisito: Python 3 e Git.

```powershell
# 1. clone apenas o sistema 5e (sparse checkout)
New-Item -ItemType Directory -Force .tmp | Out-Null
git -c http.sslBackend=openssl clone --depth 1 --filter=blob:none --sparse `
  https://github.com/blastervla/rpg-companion-app-systems.git .tmp/rpg-systems
git -C .tmp/rpg-systems config http.sslBackend openssl
git -C .tmp/rpg-systems sparse-checkout set systems/5e systems/_stdlib

# 2. gere o pacote
python desenvolvimento/ferramentas/gerar-dados-5e.py `
  --repo .tmp/rpg-systems --out app/dist/5e
```

O gerador lê os `.rpg.json`, normaliza os envelopes `{resource_id, stats: {value: ...}}` e grava os JSONs compactos. Ele também imprime as contagens e os tamanhos.

---

## 4. Criador provisório

A aba **Criador** monta uma ficha nativa no nível 1:

1. nome, jogador, alinhamento;
2. raça, classe e antecedente;
3. atributos base (3–18) com bônus racial aplicado;
4. perícias de classe (quantidade definida pela classe) + perícias do antecedente;
5. resumo com PV, CA, deslocamento, PB e salvaguardas.

A ficha nativa é guardada no IndexedDB. O botão **Subir nível**:

- aumenta o nível e os PV (média do dado de vida + Con);
- recalcula o bônus de proficiência;
- no nível 4/8/12/16/19, permite +2 em um atributo ou +1 em dois;
- no nível de subclasse da classe, permite escolher a subclasse;
- mostra as novas features e os espaços de magia calculados.

### Limitações atuais (provisórias)

- O criador não escolhe equipamento, magias iniciais nem truques.
- O nível 1 usa CA 10 + Destreza; armaduras entram depois, manualmente ou no futuro.
- O nível de subclasse é o da classe; **multiclasse** não está implementado.
- Fichas `.cah` **podem subir de nível**, mas o Atlas edita uma cópia de trabalho; o arquivo original não muda.
- **Condições** aplicam efeitos óbvios (deslocamento 0, exaustão, PV máximo), mas vantagem/desvantagem, concentração e efeitos de condições específicas continuam manuais.
- **Carga** soma o peso de armaduras, armas, itens e moedas; ainda falta o peso de alguns itens antigos do `.cah` que não trazem o campo. Há ajuste manual.
- **Itens mágicos**: a sintonia e alguns bônus comuns de CA são automáticos; efeitos genéricos de itens (resistências, cargas, magias) continuam manuais.
- **Magias conhecidas/truques/grimório** mostram o limite e avisam quando o total passa; o arrastar não bloqueia automaticamente o excesso.
- **XP por encontro** usa a tabela padrão e o multiplicador de monstros; não importa encontros prontos. O XP pode ser aplicado a todas as fichas marcadas, mas não existe um “grupo” persistente.
- **Ações de classe** (Action Surge, Channel Divinity, Ki, Wild Shape, Rage, Bardic Inspiration) têm recursos virtuais das classes principais; subclasses exóticas e recursos homebrew continuam manuais.
- **Tabuleiro**: já sincroniza PV do token para a ficha, tem iniciativa/turnos, terreno difícil e combates salvos; ainda não tem 3D, linha de visão/neblina, cobertura ou automação de ataques.
- **Multiclasse** é o único item grande que ficou de fora desta rodada.

### Regras que já estão no Atlas × regras que faltam

| Regra | Situação |
|---|---|
| Tabela de XP 5e | Implementada (padrão) |
| Dado de vida/PV por nível | Implementado (média; campo editável) |
| Bônus de proficiência por nível | Implementado |
| ASI em 4/8/12/16/19 | Implementado (+2 ou +1/+1) |
| Subclasse no nível da classe | Implementado (ficha nativa; `.cah` já vem com a escolha) |
| Espaços de magia (full/half/warlock) | Implementado para as classes padrão |
| Magias conhecidas/truques/grimório | Limites exibidos e avisados |
| Preparação de magias | Fórmula padrão + lista da ficha |
| CA por armadura/escudo/Destreza | Implementado |
| Penalidade de armadura pesada no deslocamento | Implementado |
| Pool × usos | Implementado |
| Descanso curto + dados de vida | Implementado |
| Recursos de descanso curto | Implementado para as classes principais |
| Condições/exaustão/carga/morte | Implementado o essencial |
| Itens mágicos/sintonia/CA | Implementado para itens comuns; resto manual |
| XP por encontro | Calculadora implementada; aplica a várias fichas |
| Arrastar magia/item/arma/armadura | Implementado |
| Mesa tática 2D | Implementada (grade, tokens, distância, áreas, terreno difícil) |
| Iniciativa/turnos | Implementados (rolagem, ordem, rodada) |
| Combates salvos/modelos | Implementados |
| PV token ↔ ficha | Implementado (token atualiza a ficha) |
| Rolagem de dados | Implementada (`XdY+Z`) |
| Upcast de magia | Implementado com texto de nível superior |
| Multiclasse | Ainda não |

Se você quiser fidelidade total nos pontos manuais, os textos que mais ajudam são: **itens mágicos e sintonia**, **condições/exaustão**, **magias conhecidas por classe** e **multiclasse**. Sem eles, o Atlas usa as fórmulas padrão e deixa o resto manual.

---

## 5. Arquivos

| Arquivo | Papel |
|---|---|
| `app/dist/sheet-core.js` | parser `.cah` e modelo nativo (funções puras) |
| `app/dist/characters.js` | painel Ficha / Compêndio / Criador / Dados, IndexedDB e eventos |
| `app/dist/characters.css` | estilos do painel |
| `app/dist/battleboard.js` | mesa tática 2D: canvas, tokens, grade, áreas, iniciativa e combates salvos |
| `app/dist/battleboard.css` | estilos do tabuleiro |
| `desenvolvimento/ferramentas/gerar-dados-5e.py` | gerador do pacote 5e |
| `app/dist/5e/` | pacote gerado (ignorado pelo Git) |

O botão `#charactersBtn` e o painel são integrados em `app/dist/index.html` e `app/dist/app.js`. O painel abre por cima do mapa e fecha quando outro editor é aberto.

---

## 6. Testes feitos

- Parser do `.cah` do Tytos: nome, Paladin 7, Oath of Devotion, Defense, CA 20, PV 49, speed 30, CD 14, ataque mágico +6, 10 magias, 4 perícias com proficiência.
- Ficha nativa Paladin 1: CA 12, PV 12, atributos com bônus humano, perícias de classe e antecedente.
- Passagem para nível 2: PV 20, features de nível 2, espaços de magia de paladino.
- Ficha `.cah` jogável: Lay on Hands 35/35 (pool), gasto de 5 → 30/35; Divine Sense 4/4 (usos); preparar 1/6 e conjurar Command gastando 1 espaço (3/4); dano → 48/49; descanso longo → 49/49; Plate desequipada → CA 13, equipada → CA 20; subir para nível 8 → PV 56.
- Descanso curto: gastar 1 dado de vida recupera 7 PV e deixa 6/7 dados; Channel Divinity aparece como recurso recuperado no descanso curto.
- Condições/exaustão: adicionar/remover condição; exaustão 2 deixa o deslocamento em 15 pés; PV 0 mostra testes de morte; rolar morte e estabilizar funcionam.
- Itens: arrastar Ring of Protection para a ficha e sintonizar deixa a CA em 21; Shield ativo leva a CA a 25.
- XP: calculadora de encontro carrega monstros, aceita Goblin e mostra XP/dificuldade; botão de XP direto funciona.
- Arrastar: magia do compêndio vira magia na ficha; item vira equipamento.
- Ficha nativa: arrastar Plate criou a armadura, equipar deixou CA 18 e peso 65 lb; arrastar Longsword criou o ataque.
- Upcast: Command conjurada com espaço de 2º nível; diálogo mostrou 2 opções de espaço e o texto de nível superior.
- Dados: 10d20+2 retornou 136 com detalhe `[9, 17, 11, 5, 12, 16, 16, 20, 16, 12] = 134 · +2`.
- Tabuleiro: abriu, listou o Tytos, adicionou personagem e Goblin, mediu 30 pés entre dois quadrados.
- Tabuleiro: a seta moveu o token de `14,9` para `15,9` com 5 pés gastos; arrastar do centro real da célula moveu para `17,9`; −1 PV no token atualizou a ficha para `48/49`; rolar iniciativa criou a ordem e a rodada; salvar combate funcionou.
- Tabuleiro: canvas renderizou na resolução real (`1054 × 632` CSS px) e o botão **⚔ Combate** foi adicionado ao HUD local.
- Compêndio: busca de Fireball, Goblin, Paladin e Potion of Healing.
- Cabeçalho: botão Fichas e fechamento ao abrir Jornadas/Rotas/Editor/Economia/Mapa 2D.

---

## 7. Próximos passos naturais

1. Escolher equipamento inicial no criador e calcular CA com armadura desde o nível 1.
2. Sincronizar tokens/HP do tabuleiro com as fichas e o grupo/campanha.
3. Iniciativa e turnos no tabuleiro; depois uma versão 3D usando a cena local.
4. Multiclasse e efeitos genéricos de itens mágicos.
5. Mais ações de classe/subclasse e condições automáticas.
