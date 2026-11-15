#!/usr/bin/env python3
"""Aplica o urbanismo de Dragonfall sem mudar world.json nem as referencias Azgaar/Watabou."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BP=ROOT/'app/dist/city-blueprints.json'
WORLD=ROOT/'app/dist/world.json'

def district(kind,label,angle=-1,rf=.45,wf=.2,port=False):
    item=dict(kind=kind,label=label,angleOffset=angle,radiusFactor=rf,widthFactor=wf)
    if port:item['usePortDir']=True
    return item
D=district
# Colocar niveis de detalhe e funcoes urbanas baseadas nos registros de 1277 AQD.
PROFILES={
 2:dict(pattern='elfic-organic',label='Ereth: bosque fluvial alto-elfico e vias arcanas',architecture='high-elf',identity='ereth-forest-river',province='Ducado de Ereth',level='A',role='floresta-elfica',wood=(.67,.85),districts=[D('palace','Casa do Conselho Élfico',-1.0,.35,.2),D('grove','Bosque Antigo',1.67,.48,.24),D('temple','Jardins de Gavanon',2.54,.55,.18),D('market','Mercado das Pontes',.18,.4,.2),D('harbour','Embarcadouro Fluvial',.05,.77,.23,True),D('residential','Casas dos Bosques',3.0,.77,.33)]),
 3:dict(pattern='capital-fan',label='Asgorath: capital Dragonbane com palacio nortenho e vestigios alto-elficos',architecture='northern-human',identity='dragonbane-royal-elfin',province='Ducado de Asgorath',level='A',role='capital-real',districts=None),
 4:dict(pattern='forest-settlement',label='Rivertown: mercado halfling, hortas e caminhos fluviais',architecture='halfling',identity='halfling-river-trade',province='Ducado de Asgorath',level='A',role='halfling-campos',wood=(.24,.47),districts=[D('market','Praça dos Barqueiros',.25,.38,.21),D('grove','Hortas e Pomares',1.8,.53,.24),D('harbour','Cais das Balsas',0,.71,.22,True),D('craft','Moinhos e Oficinas',-1.0,.56,.19),D('residential','Casas dos Halflings',2.9,.81,.34)]),
 5:dict(pattern='organic-town',label='Torre Solitária: escola arcana, torre sobrevivente e ruinas da queda',architecture='northern-arcane',identity='sole-arcane-tower',province='Enseada das Cinzas',level='A',role='torre-arcana',wood=(.10,.25),districts=[D('academy','Torre Solitária',-1.06,.35,.27),D('temple','Santuário de Gavanon',1.72,.46,.2),D('market','Largo dos Aprendizes',.12,.49,.19),D('residential','Alojamentos da Escola',2.98,.83,.31)]),
 10:dict(pattern='dwarven-terraces',label='Dagorah: salao anao, portao monumental e forjas dos clas',architecture='dwarven',identity='dagorah-clan-forges',province='Salão de Dagorah',level='A',role='salon-anao',districts=None),
 11:dict(pattern='organic-town',label='Malacatt: cidadela khajitt e ruas de terreno umido',architecture='khajitt',identity='khajitt-wetland-citadel',province='Capitania de Amestrina',level='A',role='cidade-khajitt',wood=(.40,.58),districts=[D('military','Cidadela Felina',-.95,.34,.21),D('market','Feira das Caravanas',.21,.48,.22),D('grove','Pátio do Grande Espírito',1.88,.51,.2),D('craft','Oficinas dos Pântanos',-2.08,.59,.2),D('residential','Bairros de Malacatt',3.05,.82,.34)]),
 12:dict(pattern='desert-medina',label='Savhalla: caravançarai husajita e mercado de Amestris',architecture='husajita',identity='savhalla-caravan',province='Capitania de Amestrina',level='A',role='caravanas-deserto',wood=(.01,.09),districts=[D('market','Mercado de Amestris',.08,.43,.23),D('caravan','Pátio das Caravanas',-.93,.58,.21),D('temple','Pátio de Al\'Ashabab',1.91,.49,.2),D('craft','Armazéns do Deserto',-2.18,.62,.2),D('residential','Casas de Adobe',2.98,.81,.33)]),
 18:dict(pattern='harbor-front',label='Porto das Cinzas: docas marcadas pelo cataclismo e comércio reaberto',architecture='ash-northern',identity='ash-fall-harbour',province='Enseada das Cinzas',level='A',role='porto-cinzas',wood=(.03,.15),districts=[D('harbour','Docas Enegrecidas',.01,.77,.27,True),D('market','Mercado dos Armadores',.22,.44,.21,True),D('noble','Casa Longrock',-1.2,.54,.18),D('temple','Capela de Remus',1.81,.5,.18),D('craft','Estaleiros de Cinza',-2.16,.58,.22),D('residential','Casario Reconstruído',2.95,.8,.31)]),
 23:dict(pattern='fortress',label='Winterhelm: cidade forte Windbear ao pé da serra',architecture='northern-human',identity='windbear-winter-fort',province='Marca de Winterhelm',level='A',role='fortaleza-norte',districts=None),
 33:dict(pattern='volcanic',label='Gugacon: cidade draconata vulcanica em reconstrução',architecture='draconato-volcanic',identity='gugacon-volcanic-restoration',province='Ilha de Gugacon',level='A',role='cidade-vulcanica',wood=(.02,.12),districts=[D('military','Bastião da Escarpa',-1.16,.32,.22),D('market','Mercado da Reabertura',.2,.46,.23),D('temple','Terraço dos Ancestrais',1.7,.49,.22),D('craft','Forjas da Lava',-2.12,.56,.2),D('residential','Casas de Pedra Negra',2.98,.81,.31)]),
 34:dict(pattern='fortress',label='Rinnton: bastião Corvenhal e vila da guarda',architecture='northern-human',identity='rinnton-raven-garrison',province='Marca de Winterhelm',level='B',role='bastiao-fronteira',districts=[D('military','Bastião de Rinnton',-1.0,.35,.23),D('temple','Capela de Mátilla',1.82,.47,.18),D('market','Feira das Guarnições',.13,.46,.21),D('craft','Arsenal e Celeiros',-2.16,.57,.21),D('residential','Casas Fortificadas',3.0,.82,.32)]),
 51:dict(pattern='harbor-front',label='Clifshore: vila de escarpas, farol de vigia e pescadores',architecture='northern-human',identity='clifshore-watch-coast',province='Enseada das Cinzas',level='B',role='costa-escarpas',wood=(.14,.3),districts=[D('harbour','Cais dos Pescadores',.05,.76,.24,True),D('military','Vigia dos Penhascos',-1.05,.36,.2),D('market','Feira das Redes',.21,.48,.2),D('craft','Armazéns de Sal',1.8,.55,.2),D('residential','Bairro da Encosta',2.95,.79,.33)]),
 120:dict(pattern='fortress',label='Lakenford: muralha de neve, torre de sinais e celeiros de inverno',architecture='northern-human',identity='lakenford-winter-watch',province='Marca de Winterhelm',level='B',role='forte-frio',wood=(.08,.25),districts=[D('military','Guarda dos Muros',-1.05,.36,.23),D('temple','Pedras do Grande Norte',1.78,.47,.18),D('market','Entreposto de Inverno',.16,.48,.2),D('craft','Celeiros e Oficinas',-2.08,.6,.2),D('residential','Casas da Neve',2.97,.82,.32)]),
 2003:dict(pattern='ruins',label='Nilhelm: localidade sem habitantes contabilizados, ruinas e marcos antigos',architecture='northern-imperial-ruins',identity='nilhelm-uninhabited',province='Ducado de Asgorath',level='C',role='ruinas-sem-habitantes',wood=(.22,.42),districts=[]),
 2004:dict(pattern='forest-settlement',label='Vila Sardinhas: aldeia costeira de elfos da floresta e pescadores',architecture='woodland-elf',identity='sardinhas-woodland-fishers',province='Enseada das Cinzas',level='C',role='pesca-florestal',wood=(.51,.74),districts=[D('harbour','Trapiches das Sardinhas',.01,.72,.23,True),D('grove','Bosque Comunitário',1.55,.45,.26),D('market','Feira do Pescado',.24,.4,.2),D('residential','Casas dos Pescadores',2.98,.78,.33)]),
 10001:dict(pattern='elfic-organic',label='Porto Naril: porto alto-elfico e jardins de Gavanon',architecture='high-elf',identity='naril-elfic-port',province='Ducado de Ereth',level='B',role='porto-elfico',wood=(.58,.76),districts=[D('harbour','Cais de Naril',.04,.76,.25,True),D('grove','Bosques dos Navegantes',1.7,.47,.22),D('temple','Pavilhão de Gavanon',2.36,.49,.18),D('market','Mercado das Águas',.22,.44,.2,True),D('residential','Casario Alto-Élfico',3.0,.83,.32)]),
 10002:dict(pattern='harbor-front',label='Porto Sarandir: novo porto draconato com cais de basalto e Bahamut',architecture='draconato-volcanic',identity='sarandir-dragonborn-harbour',province='Ilha de Gugacon',level='A',role='porto-draconato',wood=(.02,.12),districts=[D('harbour','Docas de Basalto',.02,.77,.28,True),D('temple','Pátio de Bahamut',1.7,.49,.2),D('market','Mercado do Reassentamento',.26,.45,.2,True),D('craft','Oficinas do Porto Novo',-1.04,.58,.2),D('residential','Bairros dos Regressados',3.02,.81,.34)])
}

def run():
    obj=json.loads(BP.read_text(encoding='utf-8'))
    w=json.loads(WORLD.read_text(encoding='utf-8'))
    state_ids={int(c['i']) for c in w['cities'] if c.get('state')==12}
    assert state_ids==set(PROFILES),f'Mapa: {state_ids-set(PROFILES)}, profiles extras: {set(PROFILES)-state_ids}'
    for cid,info in PROFILES.items():
        bp=obj['cities'][str(cid)]
        assert bp['cityId']==cid
        bp['pattern']=info['pattern'];bp['patternLabel']=info['label']
        classification=dict(bp.get('classification') or {})
        classification.update(architecture=info['architecture'],urbanIdentity=info['identity'],dragonfallProvince=info['province'])
        bp['classification']=classification
        if 'wood' in info:
            lo,hi=info['wood']
            terrain=bp.setdefault('terrain',{})
            woodland=terrain.setdefault('woodland',{})
            woodland.update(densityMin=lo,densityMax=hi)
        if info.get('districts') is not None:
            bp.setdefault('urbanDesign',{})['districts']=info['districts']
        bp['dragonfallV14']=dict(role=info['identity'],function=info['role'],province=info['province'],detail=info['level'],era=1277)
        if cid==2003:
            bp['features'].update(market=False,empty=True,capital=False,walls=False,citadel=False)
        if cid==5:
            bp['classification']['magicCampus']=True
            bp.setdefault('urbanV7',{})['cityIdentity']='Torre única sobrevivente do cataclismo, em meio a alvenaria danificada'
        if cid in (2,10001):
            bp.setdefault('urbanV7',{})['cityIdentity']='Vias e monumentos élficos entre árvores antigas, próximos a Ereth'
        if cid in (33,10002):
            bp.setdefault('urbanV7',{})['cityIdentity']='Reconstrução draconata em pedra vulcânica após a Queda Infernal'
    BP.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('v14: modificadas',len(PROFILES),'localidades de Dragonfall')
if __name__=='__main__':run()
