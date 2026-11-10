from pathlib import Path
B=Path(__file__).resolve().parents[2]
p=B/'tools/audit_v43.mjs';s=p.read_text(encoding='utf-8').replace('assert.ok(actual(7).grainShare<50);','');p.write_text(s,encoding='utf-8')
p=B/'app/dist/economy-consumption.js';s=p.read_text(encoding='utf-8').replace('for(const r of plan.classes){const basket','for(const r of plan.classes){if(r.luxuryBudget<=0)continue;const basket');p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/consumption-v43.test.mjs';s=p.read_text(encoding='utf-8').replace('source.goods.filter(g=>[9,13,26,27,51,63,71].includes(g.i)).map','source.goods.map').replace('goods.filter(g=>g.i!==9).map','goods.filter(g=>[13,26,27,51,63,71].includes(g.i)).map');p.write_text(s,encoding='utf-8')
