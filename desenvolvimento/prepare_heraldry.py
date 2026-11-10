"""Prepare native COAs for local rendering. No map data leaves this machine."""
from pathlib import Path
import copy,json,shutil,xml.etree.ElementTree as ET
from source_profiles import load_sources

base=Path(__file__).resolve().parent.parent
source=load_sources(base)
output=base/'app/dist/heraldry';output.mkdir(exist_ok=True)
items=[];index={}
for kind,entries in [('state',source['states']),('city',source['cities'])]:
    for id,entry in entries.items():
        coa=entry.get('coa')
        if not id or entry.get('removed') or not coa:continue
        if not coa.get('custom'):items.append({'kind':kind,'id':id,'coa':coa})
lines=(base.parent/'Mapas/Silvangad 5.0.map').read_text(encoding='utf-8').splitlines()
root=ET.fromstring('\n'.join(lines[5:161]))
ET.register_namespace('','http://www.w3.org/2000/svg')
ET.register_namespace('xlink','http://www.w3.org/1999/xlink')
for element in root.iter():
    id=element.get('id','')
    if id.startswith('stateCOA') and id[8:].isdigit():
        state_id=int(id[8:]);target=output/f'state-{state_id}.svg'
        svg=copy.deepcopy(element);svg.set('width','256');svg.set('height','256')
        target.write_bytes(ET.tostring(svg,encoding='utf-8',xml_declaration=True))
        index[f'state:{state_id}']='heraldry/'+target.name
(base/'desenvolvimento/ferramentas/armoria/input.json').write_text(json.dumps({'items':items,'native':index}),encoding='utf-8')
print('Prepared',len(items),'native COA descriptions and',len(index),'embedded original images')
