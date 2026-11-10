# Silvengard · Atlas vivo

Este é o programa do Atlas. Para usar, **dê dois cliques em `Silvengard-Atlas.exe`**.

---

## Abrir, reiniciar e encerrar

| O que você quer | O que fazer |
| --- | --- |
| Abrir o Atlas | Dois cliques em `Silvengard-Atlas.exe`. O navegador abre no endereço certo sozinho. |
| Abrir de novo (já estava aberto) | Clique no ícone da bandeja (perto do relógio) ou rode o `.exe` outra vez: ele só reabre o navegador. |
| Encerrar a sessão | Botão direito no ícone da bandeja → **Sair (encerra o servidor)**. |
| Fechar só o servidor | Botão direito no ícone → **Parar servidor**. O ícone continua ali para você iniciar de novo. |
| Reiniciar (depois de mexer em arquivos) | Botão direito no ícone → **Reiniciar servidor**. |

O servidor **não fica perdido** em segundo plano: se o `.exe` for fechado de qualquer jeito
(inclusive pelo Gerenciador de Tarefas), o servidor do Atlas é encerrado junto.

Atalhos de linha de comando, se precisar:

```
Silvengard-Atlas.exe                abre o Atlas (com navegador)
Silvengard-Atlas.exe --start        só liga o servidor, sem abrir navegador
Silvengard-Atlas.exe --stop         encerra o servidor de qualquer sessão anterior
Silvengard-Atlas.exe --status       mostra se o servidor está aberto
Silvengard-Atlas.exe --diagnostico  gera app\logs\diagnostico.txt
```

> O Atlas atende apenas este computador (`127.0.0.1`). Nada sai para a internet.

---

## O que é cada pasta

```
Silvengard-Atlas.exe    ← o único arquivo que você precisa abrir
Iniciar-Atlas.cmd       ← plano B, só se o .exe não abrir
Encerrar-Atlas.cmd      ← plano B para encerrar o que o .cmd iniciou

app/                    ← O PROGRAMA (necessário para rodar). Não precisa mexer.
  dist/                 mapa, telas, módulos e o world.json
  serve.py              servidor local
  historic_archives/    os três documentos de história que alimentam a aba "Histórias"
  runtime/node.exe      Node embutido, usado ao gravar os padrões
  tools/bake-defaults.mjs
  saved-author-defaults.json  padrões já aprovados por você
  logs/                 registros de erro de gravação e do inicializador

dados/                  ← dados de referência e checkpoints das revisões
documentos/             ← catálogo, propostas, revisões e o README técnico completo
desenvolvimento/        ← scripts que reconstroem e verificam o mapa, e os testes
acervo/                 ← TUDO O QUE É HISTÓRICO (não é necessário para rodar)
  backups/              uma cópia completa a cada padrão gravado e a cada revisão
  edicoes/              edições exportadas (silvengard-edicao…, alteracoes-mapa…, provincias…)
  previas/              imagens de prévia de cada revisão (preview…, diagnostico…)
  revisoes/             relatórios e verificações das revisões
  pacotes/              os .zip de versões antigas
  logs/                 registros de execuções antigas de teste
  referencias/          desenhos do autor e capturas de tela
```

Regra simples: **se estiver em `acervo/`, é passado.** Nada em `acervo/` é lido pelo programa.

---

## Onde ficam os backups

Cada vez que você usa **Definir como padrão**, o Atlas cria uma pasta nova em
`acervo/backups/defaults-AAAAMMDD-HHMMSS-…/` com:

- `world.json` — como o mapa estava antes da gravação;
- `saved-author-defaults.json` — o histórico de padrões;
- `edition.json` — exatamente a edição que você mandou salvar.

Para voltar atrás, copie o `world.json` da pasta do backup para `app/dist/world.json`.

---

## Se algo der errado

### O `.exe` não abre nada

1. **Plano B (funciona sempre):** dê dois cliques em `Iniciar-Atlas.cmd`. Ele liga o
   servidor do mesmo jeito e abre o navegador. Para encerrar, use `Encerrar-Atlas.cmd`.
2. **Veja o registro:** `app\logs\atlas-launcher.log` — o `.exe` grava cada passo
   (Python encontrado, porta escolhida, servidor pronto). É o primeiro lugar a olhar.
3. **Windows bloqueando:** esta máquina está com o **Smart App Control** ligado, que
   pode recusar programas sem assinatura digital. Se for esse o caso, o `.exe`
   simplesmente não executa e nenhum log aparece — use o plano B acima, ou desligue em
   *Segurança do Windows → Controle de aplicativo e navegador → Smart App Control*
   (atenção: desligar é definitivo; só volta reinstalando o Windows).
4. **Diagnóstico automático:** abra o Prompt de Comando na pasta do Atlas e rode
   `Silvengard-Atlas.exe --diagnostico`. Ele cria `app\logs\diagnostico.txt` com o
   caminho do Python, a porta, o PID e o estado do servidor.

### Outros problemas

1. Olhe `app/logs/salvamento.log` (erros ao gravar padrões).
2. Olhe `app/logs/atlas-launcher.log` (erros ao iniciar o servidor).
3. Feche o Atlas, abra de novo e recarregue a página com `Ctrl+R`.

**Requisito:** Python 3 instalado no Windows. O `.exe` procura o Python
automaticamente (pasta padrão do instalador ou `PATH`); se não encontrar, avisa com o
link oficial. O Node já vai embutido em `app/runtime` — não é preciso instalar.

Se a porta 8765 estiver ocupada por outro programa, o Atlas abre em 8766 (ou na
próxima livre) e avisa no balão da bandeja. O backup e o salvamento continuam iguais.

---

## Git (versionamento)

Esta pasta é um repositório Git ligado a
`https://github.com/arthur-kt/silvengard-interactive-map`. A branch com a
reorganização é **`fix/organize-repo`** (a `main` continua no estado antigo).

O que **não** entra no Git (de propósito, veja `.gitignore`):

- `acervo/backups/` — 1,4 GB de cópias completas;
- `app/runtime/node.exe` — 89 MB, binário redistribuível;
- `app/logs/` e `acervo/logs/` — registros que mudam a cada execução;
- caches do Python (`__pycache__`).

Publicar (faça no **seu** terminal — aqui não há credenciais do GitHub):

```
git push -u origin fix/organize-repo
```

Trazer para o outro clone (`silvengard-interactive-map`), sem internet:

```
cd "C:\Users\Arthur KT\Documents\RPG\silvengard-interactive-map"
git fetch "C:\Users\Arthur KT\Documents\RPG\silvengard-atlas v2" fix/organize-repo
git checkout fix/organize-repo
git merge --ff-only FETCH_HEAD
```

Criar uma nova alteração:

```
git checkout -b minha-mudanca
git add -A
git commit -m "descreve o que mudou"
git push -u origin minha-mudanca
```

---

## Para quem for mexer no código

Veja `desenvolvimento/LEIA-ME.md` (testes, reconstrução do mapa e scripts históricos).

O documento técnico completo das revisões está em `documentos/README.md`.
