from pathlib import Path
import json,re,shutil
B=Path(__file__).resolve().parents[2]
p=B/'app/dist/economy-ledger.js';s=p.read_text(encoding='utf-8')
s=s.replace('${incomeHTML(r.cities)}${productRows(production,c)}','${productRows(production,c)}')
s=s.replace("${kind==='state'?'<h3>Províncias", "${incomeHTML(r.cities)}${kind==='state'?'<h3>Províncias")
s=s.replace('<details class="ledgerIncome" open>','<details class="ledgerIncome">')
p.write_text(s,encoding='utf-8')
for p in (B/'app/historic_archives').glob('*.md'):
 s=p.read_text(encoding='utf-8');s=s.replace('Lavanthir','Lavhantir');p.write_text(s,encoding='utf-8')
p=B/'tools/export_hierarchy_economy.mjs';s=p.read_text(encoding='utf-8')
s=s.replace('Salários detalhados, inflação monetária e tonelagem não são modelados.','As populações incluem a cidade e o entorno rural, sem censo adicional. Os perfis sociais estimam renda familiar e trocas em espécie; não creditam moedas automaticamente. Inflação monetária e contracheques individuais não são modelados.')
p.write_text(s,encoding='utf-8')
# Validate source coverage without implying that an editorial instruction became a new event.
p=B/'historias-correcoes-v41.json';a=json.loads(p.read_text(encoding='utf-8'));a['correctionsReviewed']=a.pop('correctionsCovered');a['scope']='Correções canônicas, complementos culturais e arqueológicos; mistérios mantidos. Decisões comerciais posteriores prevalecem. C25 é regra da interface econômica e C34 impede acrescentar continentes não aprovados.';p.write_text(json.dumps(a,ensure_ascii=False,indent=2),encoding='utf-8')
# Main and v2 retain independent world files and independent author checkpoints.
for root in [B,B.parent/'silvengard-atlas v2']:
 w=json.loads((root/'app/dist/world.json').read_text(encoding='utf-8'));cp=json.loads((root/'dados/economic-review-defaults.json').read_text(encoding='utf-8'))
 for b in w['cities']:assert cp['demographics'][str(b['i'])]['socialProfile']==b['socialProfile']
 for key in ['economyEdits','routes','savedDefaults']:assert cp[key]==w[key]
 assert w['economicReview']['version']==41
print('Independent v41 checkpoints validated')
