from pathlib import Path
import json,shutil,re,hashlib,base64
B=Path(__file__).resolve().parents[2];roots=[B,B.parent/'silvengard-atlas v2']
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
for root in roots:
 backup=root/'acervo/backups/v42-before-social-goods';backup.mkdir(exist_ok=True)
 for name in ['app/dist/world.json','app/dist/economy-source.json','economic-review-defaults.json','economy-review-source.json','app/dist/economy-income.js','app/dist/economy-map-core.js','app/dist/economy-simulation.js','app/dist/profile-ui.js','app/dist/app.js','app/dist/economy-ledger.js','app/dist/heraldry/author-state-20-v19.svg']:
  target=backup/name;target.parent.mkdir(exist_ok=True,parents=True)
  if not target.exists():shutil.copy2(root/name,target)
def edit(name,fn):
 p=B/'app/dist'/name;s=p.read_text(encoding='utf-8');p.write_text(fn(s),encoding='utf-8')
def income(s):
 s="import {forcedLaborPeople} from './economy-labor.js?v=42';\n"+s
 s=s.replace('incomeFactor:1.1,cashShare:.25','incomeFactor:1.01,cashShare:.10')
 for old,new in [('[78,14,6,1.8,.2]','[88,8,3,.9,.1]'),('[64,20,12,3.5,.5]','[78,13,7,1.8,.2]'),('[66,19,11,3.6,.4]','[80,12,6,1.8,.2]'),('[52,23,20,4.6,.4]','[70,18,10,1.8,.2]'),('[51,28,17,3.6,.4]','[76,15,7,1.8,.2]'),('[86,9,4,.8,.2]','[93,5,1.7,.25,.05]')]:s=s.replace(old,new)
 s=s.replace('units=residents/profile.householdSize','unfree=c.id===\'peasant\'?Math.min(residents,forcedLaborPeople(b)):0,units=(residents-unfree)/profile.householdSize')
 s=s.replace('residents,units,gross','residents,unfree,units,gross')
 return s
edit('economy-income.js',income)
def profile(s):
 s=s.replace(' const income=incomeReport(b);', ''' const income=incomeReport(b);
 const social=`<details class="socialComposition"><summary>Composição social · consultar</summary><p>População da cidade e entorno. Percentuais iniciais estimados e editáveis.</p>${income.rows.map(r=>fact(r.name,Number(r.share).toLocaleString('pt-BR')+'% · '+number(r.residents)+' pessoas')).join('')}<p>Camponeses destinam cerca de 99% da renda de referência à subsistência. A maior parte é autoconsumo e trocas em espécie.</p>${b.forcedLaborShare?fact('Trabalho escravizado · incluído na população',number(b.forcedLaborShare)+'%'):''}</details>`;''')
 return s.replace('<h3>Cultura e sociedade</h3>','<h3>Cultura e sociedade</h3>${social}')
edit('profile-ui.js',profile)
def editor(s):
 s="import {cleanForcedLaborShare,slaveTradeAllowed} from './economy-labor.js?v=42';\n"+s
 s=s.replace('const e={};if(raw.socialProfile',"const e={};if(raw.forcedLaborShare!==undefined)e.forcedLaborShare=cleanForcedLaborShare(raw.forcedLaborShare,{...D.cities?.find(b=>b.i===raw.id),state:raw.state??20});if(raw.socialProfile")
 # Location/state-specific validation happens again when applying the edit.
 s=s.replace('if(e.socialProfile!==undefined)b.socialProfile=e.socialProfile;', 'if(e.socialProfile!==undefined)b.socialProfile=e.socialProfile;if(e.forcedLaborShare!==undefined){cleanForcedLaborShare(e.forcedLaborShare,b);if(e.forcedLaborShare>(b.socialProfile?.shares?.peasant??100))throw Error("O trabalho escravizado deve estar incluído no estrato de trabalhadores comuns.");b.forcedLaborShare=e.forcedLaborShare;}')
 return s
edit('city-editor-core.js',editor)
def editor_ui(s):
 s="import {slaveTradeAllowed} from './economy-labor.js?v=42';\n"+s
 s=s.replace('</details><fieldset><legend>Características', '${slaveTradeAllowed(b)?`<label>População escravizada · % incluído nos trabalhadores comuns<input id="cityForcedLaborShare" type="number" min="0" max="100" step="0.1" value="${b.forcedLaborShare||0}"></label><p>Estimativa de cenário. Sem salário próprio; participa da demanda alimentar. Estoques e transferências são registrados na simulação.</p>`:\'\'}</details><fieldset><legend>Características')
 s=s.replace('cleanCityEdit({socialProfile,inhabitants:',"cleanCityEdit({socialProfile,...($('#cityForcedLaborShare')?{forcedLaborShare:Number($('#cityForcedLaborShare').value)}:{}),inhabitants:")
 return s
edit('city-editor-ui.js',editor_ui)
def map_core(s):
 s="import {economicPopulation} from './economy-society.js?v=42';\n"+s
 s=s.replace('buildEconomicMap(D,c,provinces,provinceAt){',"buildEconomicMap(D,c,provinces,provinceAt,{goodsBasis='specialization'}={}){")
 s=s.replace('const dominant=[...rows]', '''const candidates=new Map(rows),foodNeed=(r?.cities||[]).reduce((n,b)=>n+economicPopulation(b),0)/1000*c.model.edits.foodPer1000*c.model.edits.cycleDays/30,foodOutput=[...rows].reduce((n,[g,q])=>n+q*(c.model.goods.get(g)?.demandCoverage?.food||0),0),surplus=foodOutput?Math.max(0,1-foodNeed/foodOutput):0;
  if(goodsBasis==='specialization')for(const [g,q]of rows)if(c.model.goods.get(g)?.demandCoverage?.food)candidates.set(g,q*surplus);
  // Subsistence is discounted only in this thematic view; production and food remain unchanged.
  if(![...candidates.values()].some(n=>n>1e-8))for(const [g,n]of rows)candidates.set(g,n);
  const dominant=[...candidates]''')
 s=s.replace('production:rows,color:', 'production:rows,commercialProduction:candidates,goodsBasis,color:')
 return s
edit('economy-map-core.js',map_core)
def ledger(s):
 s=s.replace("let panel=null,section=", "let goodsBasis='specialization';\n let panel=null,section=")
 s=s.replace('c.maps??=buildEconomicMap(D,c,provinces(),provinceAt)', 'c.maps??=buildEconomicMap(D,c,provinces(),provinceAt,{goodsBasis})')
 s=s.replace('maps,goodsList:()=>data.goods,',"maps,goodsBasis:()=>goodsBasis,setGoodsBasis(value){if(!['specialization','total'].includes(value))return;goodsBasis=value;const c=current();c.maps=null;},goodsList:()=>data.goods.filter(g=>!g.inactive),")
 s=s.replace('sorted(data.goods,g=>','sorted(data.goods.filter(g=>!g.inactive),g=>')
 s=s.replace('Escolha um bem para comparar produtores, matérias-primas e preços nos mercados.', 'Escolha um bem para comparar produção, preços e comércio. Moedas cunhadas e elefantes sem atividade estão arquivados. Pessoas escravizadas são estoques transferidos, nunca produção mensal.')
 s=s.replace("<h3>Onde é produzido</h3>","${g.i===31?'<p>Pessoas escravizadas: não há fabricação ou geração mensal. O estoque inicial é uma parcela estimada dos habitantes existentes de Drácon, Husaj e Território Orc. Comércio e bloqueios seguem as rotas; capturas por piratas ficam registradas separadamente. O censo aprovado permanece como referência inicial, sem atualização demográfica automática por transferência.</p>':''}<h3>Onde é produzido</h3>")
 return s
edit('economy-ledger.js',ledger)
def app(s):
 s=s.replace("Cada província mostra seu bem predominante por valor produzido. As demais produções continuam na ficha.","Especialização comercial desconta a alimentação local antes de comparar valores. A produção total continua disponível na opção abaixo e nas fichas.")
 needle="$$('[data-legend-good]').forEach"
 pos=s.index(needle,s.index("const goods=m==='economicGoods'"))
 s=s[:pos]+'''if(goods){const selector=document.createElement('select');selector.id='goodsMapBasis';selector.setAttribute('aria-label','Critério de bens produzidos');selector.innerHTML='<option value="specialization">Especialização comercial</option><option value="total">Maior valor total · inclui subsistência</option>';selector.value=economy.goodsBasis();selector.onchange=()=>{economy.setGoodsBasis(selector.value);refreshEconomicColors('economicGoods',economicGood);};$('#economicLegend').prepend(selector);}
  '''+s[pos:]
 return s
edit('app.js',app)
def simulation(s):
 s="import {forcedLaborPeople,slaveTradeAllowed,laborCostFactor} from './economy-labor.js?v=42';\n"+s
 s=s.replace('last.newCapital+=coins;', '''if(n?.city&&data.calibration?.finiteCaptiveTrade){const total=forcedLaborPeople(n.city),retained=Math.floor(total*(n.state===20?.85:.7));state.accounts[id].assets[31]=retained;state.accounts[id].stock[31]=total-retained;}last.newCapital+=coins;''')
 s=s.replace('if(missing<1e-8)return;const sellers=[];',"if(missing<1e-8||g===31&&!slaveTradeAllowed(buyer.city))return;const sellers=[];")
 s=s.replace('for(const seller of nodes.values()){', 'for(const seller of nodes.values()){if(g===31&&!slaveTradeAllowed(seller.city))continue;')
 s=s.replace('const units=Math.min(missing/q.survival,stock(seller,g),q.shippedPrice>0?buyer.account.coins/(q.shippedPrice*100):Infinity);', 'const available=Math.min(missing/q.survival,stock(seller,g),q.shippedPrice>0?buyer.account.coins/(q.shippedPrice*100):Infinity),units=g===31?Math.floor(available):available;')
 s=s.replace('delivered=units*q.survival,lost=units-delivered', 'lost=g===31?Math.floor(units*(1-q.survival)):units*(1-q.survival),delivered=units-lost')
 s=s.replace('if(lost>1e-8)bump(last.piracyLoss,buyer.id,g,lost);',"if(lost>1e-8){bump(last.piracyLoss,buyer.id,g,lost);if(g===31){const captors=account('captivity:piracy');captors.assets[31]=(captors.assets[31]||0)+lost;}}")
 s=s.replace(" // Civilian/rural food goes ahead", ''' // Existing forced-labour cohorts can be transferred, never produced or consumed as equipment.
 if(data.calibration?.finiteCaptiveTrade)for(const n of nodes.values())if(slaveTradeAllowed(n.city)){const target=Math.floor(forcedLaborPeople(n.city)*(n.state===20?1.1:.7)),held=n.account.assets[31]||0;procure(n,31,Math.max(0,target-held));const installed=Math.min(stock(n,31),Math.max(0,target-held));if(installed){take(n,31,installed);n.account.assets[31]=held+installed;}}
 // Civilian/rural food goes ahead''')
 s=s.replace('if(good?.transport)serviceTransfer', 'if(good?.transport)serviceTransfer').replace('(good?.annualWear||.04)', '(good?.annualWear??.04)')
 s=s.replace("for(const [g,units]of Object.entries(n.account.assets)){const good=", "for(const [g,units]of Object.entries(n.account.assets)){if(+g===31)continue;const good=")
 s=s.replace("produce(n,j.good,amount,inputCost+amount*((model.goods.get(j.good)?.labourHours||0)*.25+(model.goods.get(j.good)?.unskilledHours||0)*.025||model.price(j.good)*.15),day)","produce(n,j.good,amount,inputCost+amount*(((model.goods.get(j.good)?.labourHours||0)*.25+(model.goods.get(j.good)?.unskilledHours||0)*.025)*laborCostFactor(j.node.city,j.node.account)||model.price(j.good)*.15),day)")
 return s
edit('economy-simulation.js',simulation)
# Persisted city edits include the labour percentage too.
p=B/'tools/persist_review_checkpoint.py';s=p.read_text(encoding='utf-8').replace("'economicStatus','socialProfile'", "'economicStatus','socialProfile','forcedLaborShare'");p.write_text(s,encoding='utf-8')
# The latest graphic is embedded unchanged in the existing SVG asset, so rebuilds retain it.
png=(B.parent/'Dracon.png').read_bytes();svg='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 1200 1280"><image width="1200" height="1280" href="data:image/png;base64,'+base64.b64encode(png).decode()+'"/></svg>'
for root in roots:
 (root/'app/dist/heraldry/author-state-20-v19.svg').write_text(svg,encoding='utf-8')
 w=read(root/'app/dist/world.json');d=read(root/'app/dist/economy-source.json')
 if d.get('socialRevision')==42:continue
 for b in w['cities']:
  if b['state'] in [20,24,29] and not b.get('magicSchool') and b['demographics'].get('populationKnown',True):b['forcedLaborShare']={20:12,24:15,29:8}[b['state']]
 for g in d['goods']:
  if g['i'] in [19,62]:g['inactive']=True
  if g['i']==31:g.update(name='Pessoas escravizadas',unit='pessoa',kind='captive',eventOnly=True,durable=False,demandCoverage={},annualWear=0)
 d['socialRevision']=42;d['calibration']['finiteCaptiveTrade']=True
 w['economicReview']['socialRevision']=42;w['economyStateArchiveV41']=w.get('economyState');w['economyState']={'format':'silvengard-economy-state-v1','cycle':0,'accounts':{},'history':[],'last':None}
 w['savedDefaults']['id']=hashlib.sha256((w['savedDefaults']['id']+'social42').encode()).hexdigest();w['authorAtlasDefaults']['id']=w['savedDefaults']['id']
 s=next(s for s in w['states'] if s['i']==20);s['emblemProvenance']={'kind':'author','label':'Bandeira fornecida pelo autor — Dracon.png'}
 write(root/'app/dist/world.json',w);write(root/'app/dist/economy-source.json',d)
# Cache revisions cover all modules that import the modified economic/profile components.
for p in (B/'app/dist').glob('*.js'):p.write_text(re.sub(r'\?v=41\b','?v=42',p.read_text(encoding='utf-8')),encoding='utf-8')
p=B/'app/dist/index.html';p.write_text(p.read_text(encoding='utf-8').replace('app.js?v=41','app.js?v=42'),encoding='utf-8')
print('v42 code and data prepared; social presets require Node materialization next')
