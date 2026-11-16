# Ações do token, rolagens no tabuleiro e multiclasse (tabuleiro v6)

## Como usar
1. Abra o **Tabuleiro**, adicione personagens e monstros e clique num token. Aparece a **barra de ações** no fundo do mapa.
2. **Alvo:** clique **direito** num token (Shift+direito adiciona vários). A barra mostra alvo, distância em pés e CA. Se escolher uma ação sem alvo, o tabuleiro pede para clicar no alvo.
3. **Vantagem / Normal / Desvantagem** manual na barra. As automáticas (condições, efeitos, distância) aparecem escritas no registo.
4. **Rolagens** ficam no painel direito ("Rolagens", guardadas no navegador). O botão **Dados** (canto superior esquerdo do mapa) rola d4–d100, expressões (`8d6+3`) e d20 com vantagem/desvantagem.

## Menus da barra
- **Atacar** – personagem: armas da ficha, versátil (duas mãos), furtivo (Ladino), −5/+10 e **Ataque Extra** automático. Monstro: Multiataque, ataques, salvaguardas (sopro) com **recarga**, ação em área.
- **Magias** – por nível, mostra espaços restantes (incl. pacto), consome espaço, espaço superior (+dados), truques escalam com o nível, concentração, cura, Mísseis Mágicos, Raio Ardente, Rajada Mística, salvaguarda com metade do dano e condições. Área: posicione o modelo e os alvos são calculados.
- **Itens** – poções de cura, ácido, fogo alquímico, água benta, armas de arremesso; gasta a quantidade da ficha.
- **Habilidades** – recursos da ficha, Retomar o Fôlego, Impor as Mãos, Fúria; monstros: bônus, reações, lendárias (custo) e traços.
- **Ações** – Esquivar, Disparada, Desengajar, Ajudar, Esconder, Preparar.
- **Testes** – atributos, salvaguardas e perícias do token.
- **Efeitos** – condições e efeitos (Bênção, Maldição, Fúria, Marca do Caçador, Escudo…).

## Regras automatizadas
- d20 contra a CA efetiva; 20 natural acerta e é crítico, 1 natural erra; crítico dobra dados (não modificadores); paralisado/inconsciente a 5 pés = crítico.
- Vantagem/desvantagem por condições, alvo caído, alcance longo, inimigo adjacente em ataque à distância, Esquiva, Ajudar.
- Dano com resistência/vulnerabilidade/imunidade, PV temporário primeiro, queda a 0 PV, morte instantânea, salvaguarda contra a morte.
- Concentração: cada dano rola Con vs CD = máx(10, dano/2).
- Punição Divina: botões no registo após acerto de Paladino (gasta o espaço).
- Ataque Extra: Guerreiro 5/11/20 → 2/3/4; Bárbaro, Monge, Paladino, Guardião 5 → 2; não acumula entre classes.
- Início do turno: zera ações, reabilita lendárias, rola recarga de sopros.
- PV, PV temporário, espaços, recursos e itens sincronizam com a ficha.

## Multiclasse (fichas nativas)
- O diálogo **+ Multiclasse** confere os pré-requisitos (13) da classe atual e da nova, mostra ✓/✗ e bloqueia (com opção "regra da casa").
- Mostra as proficiências ganhas e corrige o texto: o nível total passa de N para N+1.
- Cada classe conjuradora tem a sua CD e bônus de ataque; a magia usa a classe indicada em `spell.classes`.

## Limites conhecidos
- Reações (ataque de oportunidade, Escudo, contrafeitiço) e Resistência Lendária são manuais.
- Alvos de área usam o centro do token; cobertura e visão ainda não entram na CA.
- Magias fora da tabela de efeitos mostram a descrição no registo sem aplicar efeito.
- Subclasses conjuradoras e proficiências de multiclasse aplicadas à ficha ainda não são automáticas; fichas .cah mostram multiclasse mas não editam.
