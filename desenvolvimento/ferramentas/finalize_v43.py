from pathlib import Path
import re,shutil
B=Path(__file__).resolve().parents[2]
p=B/'app/dist/economy-ledger.js';s=p.read_text(encoding='utf-8').replace('99% ficam abstraídos como subsistência local.','99% ficam abstraídos no abastecimento básico de fundo, sem criar produção adicional nas localidades.').replace('Parte dos pagamentos pode corresponder a cargas ainda em trânsito. Não há criação de moedas para financiar o orçamento.','Inclui o valor de estoques próprios consumidos e pagamentos de cargas ainda em trânsito. Não há criação de moedas para financiar o orçamento.');p.write_text(s,encoding='utf-8')
for p in (B/'app/dist').glob('*.js'):p.write_text(re.sub(r'\?v=43\b(?!\.)','?v=43.1',p.read_text(encoding='utf-8')),encoding='utf-8')
p=B/'app/dist/index.html';p.write_text(p.read_text(encoding='utf-8').replace('app.js?v=43','app.js?v=43.1'),encoding='utf-8')
for p in (B/'app/dist').glob('*.js'):shutil.copy2(p,B.parent/'silvengard-atlas v2/dist'/p.name)
shutil.copy2(B/'app/dist/index.html',B.parent/'silvengard-atlas v2/dist/index.html')
