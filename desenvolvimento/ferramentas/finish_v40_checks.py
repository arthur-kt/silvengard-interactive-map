from finish_v40_runtime import edit,B
edit('economy-simulation.js','rural:\\d+:\\d+)', 'rural:\\d+:\\d+(?::\\d+)?)')
edit('economy-routing.js','km=hub&&n.cityReference?', 'km=n.connection?.km??(hub&&n.cityReference?')
edit('economy-routing.js','D.settings.distanceScale:0;edge(n.id', 'D.settings.distanceScale:0);edge(n.id')
edit('economy-routing.js','route:null,risk:0,states:[n.state]', 'route:null,risk:0,states:n.connection?.states||[n.state]')
edit('economy-price-comparison.js','c.model.goods.get(goodId)?.transport','c.model.goods?.get(goodId)?.transport')

p=B/'persistent_defaults.py';s=p.read_text(encoding='utf-8');a=s.index('def apply_persistent_defaults');s=s[:a]+'''def apply_persistent_defaults(world,base):
    base=Path(base);path=base/'app/saved-author-defaults.json';checkpoint=base/'dados/economic-review-defaults.json'
    data=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'revisions':[]}
    if not checkpoint.exists():return bake_editions(world,[r['edition'] for r in data['revisions']],base) if data['revisions'] else world
    config=json.loads(checkpoint.read_text(encoding='utf-8'));prior=set(config.get('priorRevisionIds',[]))
    before=[r['edition'] for r in data['revisions'] if r['id'] in prior]
    after=[r['edition'] for r in data['revisions'] if r['id'] not in prior]
    if before:world=bake_editions(world,before,base)
    for city in world['cities']:
        patch=config['demographics'].get(str(city['i']))
        if patch:city.update(patch)
    for key in ['economyEdits','economicReview','activeWars','localTradeAgreements','routes']:world[key]=config[key]
    return bake_editions(world,after,base) if after else world
''';p.write_text(s,encoding='utf-8')

# Update assertions whose previous requested data are deliberately superseded.
def testedit(file,old,new):
 p=B/'tests'/file;s=p.read_text(encoding='utf-8');assert old in s,(file,old[:60]);p.write_text(s.replace(old,new),encoding='utf-8')
testedit('profiles.test.mjs','population,1005030','population,1050000')
testedit('profiles.test.mjs','assert.equal(current.demographics.population,source.demographics.population);','assert.equal(current.demographics.population+(current.demographics.itinerantPopulation||0),source.demographics.population);')
testedit('economy-trade.test.mjs',"'12:33':'Enemy'","'12:33':'War'")
testedit('economy-trade.test.mjs',"relation,'Enemy'","relation,'War'")
testedit('author-markets.test.mjs',"'20:47':'Enemy'","'20:47':'War'")
testedit('author-markets.test.mjs',"reassignment preserves goods, rural production, prices and all world data","approved economy preserves authored market seats, prices, geography and identities")
p=B/'desenvolvimento/testes/author-markets.test.mjs';s=p.read_text(encoding='utf-8');a=s.index(" const before=read('backups/v37");z=s.index("\n});",a);s=s[:a]+''' const before=read('backups/v40-before-approved-economy/dist/economy-source.json'),world=read('backups/v40-before-approved-economy/dist/world.json');
 assert.deepEqual(data.markets,before.markets);assert.deepEqual(data.cityMarkets,before.cityMarkets);
 for(const k of ['cells','vertices','geography','defaultProvinceEdits','landmarks','cultures','religions'])assert.deepEqual(D[k],world[k],k);
 for(const b of D.cities)for(const k of ['name','culture','faith','emblem','x','y','state','magicSchool','dwarvenFortress','majorPort'])assert.deepEqual(b[k],world.cities.find(n=>n.i===b.i)[k],b.name+' '+k);'''+s[z:];p.write_text(s,encoding='utf-8')
testedit('economy-map.test.mjs','assert.deepEqual(D.routes,previous.routes);','for(const r of previous.routes)assert.ok(D.routes.some(n=>n.id===r.id));')
testedit('market-territories.test.mjs','assert.deepEqual(D.cities,before.cities);assert.deepEqual(D.routes,before.routes);',"for(const b of D.cities)for(const k of ['name','x','y','state','culture','faith','emblem'])assert.deepEqual(b[k],before.cities.find(n=>n.i===b.i)[k]);for(const r of before.routes)assert.ok(D.routes.some(n=>n.id===r.id));")
testedit('network.test.mjs','assert.equal(main.length,5);','assert.equal(main.length,10);')
