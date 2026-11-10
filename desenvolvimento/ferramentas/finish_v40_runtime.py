"""Small deterministic source transforms for the approved economic review."""
from pathlib import Path
B=Path(__file__).resolve().parents[2]
def edit(name,old,new):
 p=B/'app/dist'/name;s=p.read_text(encoding='utf-8')
 if old not in s:
  if new in s:return
  raise ValueError('Missing source anchor: '+name+' '+old[:80])
 p.write_text(s.replace(old,new),encoding='utf-8')
def replace_body(name,start,end,new):
 p=B/'app/dist'/name;s=p.read_text(encoding='utf-8');a=s.index(start);b=s.index(end,a);p.write_text(s[:a]+new+s[b:],encoding='utf-8')
if __name__=='__main__':
 for target,src in [('economy-simulation.js','economy-simulation-v40.js'),('economy-scarcity.js','economy-scarcity-v40.js')]: (B/'app/dist'/target).write_text((B/'app/dist'/src).read_text(encoding='utf-8'),encoding='utf-8')
 edit('economy-trade.js',"import {piracyField} from './economy-policy.js?v=32';","import {routeGraph} from './economy-routing.js?v=40';\nimport {economicNodes} from './economy-rural.js?v=40';")
 replace_body('economy-trade.js','export function tradeGraph(D,nodes,edits){','export function routeFlows',"export function tradeGraph(D,nodes,edits){return routeGraph(D,nodes,edits,atWar);}\n")
 edit('economy-trade.js',"const scarcity=context?marketScarcity", "const prepared=context?{...context,nodes:context.nodes||economicNodes(D,data,model,context.provinces||[],context.provinceAt)}:null;if(prepared)prepared.graph=tradeGraph(D,prepared.nodes,model.edits);\n const scarcity=context?marketScarcity")
 edit('economy-trade.js','cityMarket,rawPrice,context):','cityMarket,rawPrice,prepared):')
 edit('economy-trade.js','scarcity.factors[m?.i]?.[g]??1','scarcity.byState?.[b?.state]?.[m?.i]?.[g]??scarcity.factors[m?.i]?.[g]??1')
 edit('economy-trade.js',"({Enemy:'Em guerra',Neutral:","({War:'Em guerra',Enemy:'Inimizade',Rival:'Rivalidade',Neutral:")
 edit('economy-policy.js','Rival:1.2','Rival:1.2,Enemy:1.35')
 edit('economy-policy.js',"if(relations.some(r=>['Enemy','War'].includes(r)))return 'Enemy';", "if((D.activeWars||[]).some(p=>p.includes(a)&&p.includes(b))||relations.includes('War'))return 'War';if(relations.includes('Enemy'))return 'Enemy';")
 edit('economy-policy.js',"if(['Enemy','War'].includes(relation)||isEmbargoed", "if((relation==='War'||relation==='Enemy'&&!D.economicReview)||isEmbargoed")
 edit('route-info.js',"if(distance<=6)stops.push", "if((route.stopMode==='explicit'?((route.stops||[]).includes(b.i)||route.fromCity===b.i||route.toCity===b.i):distance<=6))stops.push")
 edit('population-core.js','Math.max(0,b.demographics?.population??','b.demographics?.populationKnown===false?0:Math.max(0,b.demographics?.population??')
 edit('app.js',"const pop=b=>b.demographics?fmt(b.demographics.population)","const pop=b=>b.demographics?.populationKnown===false?'Desconhecida':b.demographics?fmt(b.demographics.population)+(b.demographics.itinerantPopulation?' residentes + '+fmt(b.demographics.itinerantPopulation)+' itinerantes':'')")
 # Shared economic nodes are also used in quotes, so split rural markets do not disappear.
 for name in ['economy-ledger.js','economy-price-comparison.js','economy-map-core.js']:
  p=B/'app/dist'/name;s=p.read_text(encoding='utf-8');s="import {economicNodes} from './economy-rural.js?v=40';\nimport {populationDescription} from './economy-society.js?v=40';\n"+s if 'import {economicNodes}' not in s else s;p.write_text(s,encoding='utf-8')
 edit('economy-ledger.js','null,ps,provinceAt),flows','null,ps,provinceAt,{instant:true}),flows')
 edit('economy-ledger.js','recorded.last?recorded:null,ps,provinceAt),flows','recorded.last?recorded:null,ps,provinceAt,{instant:true}),flows')
 # Browser dependencies must all load the same implementation and the new baseline.
 for p in (B/'app/dist').glob('*.js'):
  s=p.read_text(encoding='utf-8')
  import re
  s=re.sub(r"((?:economy-[a-z-]+|route-info|population-core|market-territories)\.js)\?v=\d+",r'\1?v=40',s)
  p.write_text(s,encoding='utf-8')
 p=B/'app/dist/index.html';s=p.read_text(encoding='utf-8');s=s.replace('app.js?v=39','app.js?v=40');p.write_text(s,encoding='utf-8')
