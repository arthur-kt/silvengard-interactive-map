"""Author-approved facts, applied after source profiles (idempotent)."""
import json

def apply_scenario_defaults(world, base):
    config = json.loads((base/'scenario-defaults.json').read_text(encoding='utf-8'))
    for city in world['cities']:
        override = config['populations'].get(str(city['i']))
        if override:
            city['population'] = override['raw']
            city['demographics']['population'] = override['inhabitants']
            city['populationAdjustment'] = {'kind': 'author', 'pairedCity': override['pairedCity']}
    for state in world['states']:
        state['diplomaticHistory'] = []
        crest = config['heraldry'].get(str(state['i']))
        if crest:
            state['coa'] = crest
            state['emblem'] = 'heraldry/author-state-'+str(state['i'])+'-v19.svg'
            state['emblemProvenance'] = {'kind':'author','label':'Brasão do estado'}
    world['scenarioDefaults'] = {'version':19}
    return world
