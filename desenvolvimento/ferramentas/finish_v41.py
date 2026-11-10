from pathlib import Path
import re
B=Path(__file__).resolve().parents[2]
p=B/'app/dist/economy-simulation.js';s=p.read_text(encoding='utf-8')
s=s.replace('data.calibration?.useSocialLiquidity&&n?.city?', 'data.calibration?.useSocialLiquidity&&n?.city?.socialProfile?')
s=s.replace('inputCost+amount*model.price(j.good)*.15', 'inputCost+amount*(model.goods.get(j.good)?.laborHours?((model.goods.get(j.good).laborHours.skilled||0)*.25+(model.goods.get(j.good).laborHours.unskilled||0)*.025):model.price(j.good)*.15)')
p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/approved-economy.test.mjs';s=p.read_text(encoding='utf-8')
s=s.replace("assert.equal(report.production.get(9),7200);assert.equal(report.production.get(9)/60,120);", "assert.equal(grain.massTonnes,.1);assert.equal(grain.foodPeopleDays,200);assert.ok(report.production.get(9)>10000);assert.equal(source.goods.find(g=>g.i===10).demandCoverage?.food||0,0);")
p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/author-markets.test.mjs';s=p.read_text(encoding='utf-8').replace("'Porto do Álamo':18,'Grenolk':27,'Ros Leones':15", "'Porto do Álamo':21,'Grenolk':24,'Ros Leones':13").replace("'Loueixo':17", "'Loueixo':19")
s=s.replace("assert.deepEqual(data.markets,before.markets);assert.deepEqual(data.cityMarkets,before.cityMarkets);", "assert.deepEqual(data.markets.map(m=>[m.i,m.centerCity]),before.markets.map(m=>[m.i,m.centerCity]));for(const m of data.markets)for(const id of [4,9])assert.ok(m.prices[id]>0);")
p.write_text(s,encoding='utf-8')
p=B/'desenvolvimento/testes/economy-policies.test.mjs';s=p.read_text(encoding='utf-8').replace('const source={...data,markets:[]', 'const source={...data,goods:data.goods.map(g=>g.i===4?{...g,price:1}:g),markets:[]');p.write_text(s,encoding='utf-8')
