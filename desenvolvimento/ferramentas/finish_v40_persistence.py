from finish_v40_runtime import edit,B

edit('network-core.js',"kind:r.kind,...(parts?{parts}:{}),majorRoute:","kind:r.kind,stopMode:r.stopMode==='explicit'?'explicit':undefined,tradeUse:r.tradeUse!==false,routeClass:r.routeClass,...(parts?{parts}:{}),majorRoute:")
edit('route-editor.js',"if(saved)model.importData(JSON.parse(saved));", "if(saved){const raw=JSON.parse(saved);if(D.networkReview?.version===40){const same=(a,b)=>['name','kind','enabled','majorRoute','points','controls','stops','fromCity','toCity'].every(k=>JSON.stringify(a[k])===JSON.stringify(b[k]));raw.routes=raw.routes.filter(r=>!D.networkReview.priorRoutes.some(p=>p.id===r.id&&same(normalizeRoute(p),normalizeRoute(r))));}model.importData(raw);}")
edit('route-editor.js',"const report=routeReport(D,draft);draft.fromCity=", "const report=routeReport(D,draft);draft.stopMode='explicit';draft.stops=report.stops.map(p=>p.id);draft.tradeUse=draft.stops.length>=2;draft.fromCity=")
edit('route-editor.js',"draft.toCity=b.i;changedDraft();", "draft.toCity=b.i;draft.stops=[...new Set([...(draft.stops||[]),b.i])];changedDraft();")
# Imports of the route and population editor must use the migrated modules too.
import re
for p in (B/'app/dist').glob('*.js'):
 s=p.read_text(encoding='utf-8');s=re.sub(r'((?:network-core|route-editor|profile-ui|city-editor-core|city-manager)\.js)\?v=\d+',r'\1?v=40',s);p.write_text(s,encoding='utf-8')

# Rebuilds replay this approved checkpoint before later manual editions.
p=B/'persistent_defaults.py';s=p.read_text(encoding='utf-8')
old="    path=Path(base)/'app/saved-author-defaults.json'"
new="""    checkpoint=Path(base)/'dados/economic-review-defaults.json'
    if checkpoint.exists():
        config=json.loads(checkpoint.read_text(encoding='utf-8'))
        for city in world['cities']:
            patch=config['demographics'].get(str(city['i']))
            if patch:city.update(patch)
        for key in ['economyEdits','economicReview','activeWars','localTradeAgreements','routes']:world[key]=config[key]
    path=Path(base)/'app/saved-author-defaults.json'"""
if old in s and 'checkpoint=Path(base)' not in s:s=s.replace(old,new)
# Historical saved editions predate the checkpoint. Replay only later revisions
# once an economy checkpoint exists, or old populations would overwrite it.
s=s.replace("[r['edition'] for r in data['revisions']]", "[r['edition'] for r in data['revisions'] if not checkpoint.exists() or r.get('afterEconomicReview')==40]")
p.write_text(s,encoding='utf-8')
p=B/'defaults_service.py';s=p.read_text(encoding='utf-8');s=s.replace("'edition':edition})", "'edition':edition,'afterEconomicReview':world.get('economicReview',{}).get('version')})");p.write_text(s,encoding='utf-8')
p=B/'tools/build_economy.py';s=p.read_text(encoding='utf-8');marker="data,_=apply_market_defaults(base,data,w)";extra="""# The approved economic checkpoint replaces the obsolete imported calibration.
checkpoint=base/'economy-review-source.json'
if checkpoint.exists():data=json.loads(checkpoint.read_text(encoding='utf-8'))
""";s=s.replace(marker,extra+marker) if 'economy-review-source.json' not in s else s;p.write_text(s,encoding='utf-8')
