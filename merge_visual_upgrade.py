"""One-time selective integration of the supplied visual package into v13."""
from pathlib import Path
import shutil, difflib, hashlib, json

base = Path(__file__).resolve().parent
source = base.parent / 'silvengard-atlas v2' / 'dist'
dest = base / 'dist'
backup = base / 'backups' / 'v14-before-visual'
backup.mkdir(parents=True, exist_ok=True)
for name in ['app.js','features.js','index.html','style.css','world.json']:
    if not (backup/name).exists(): shutil.copy2(dest/name, backup/name)

a=(dest/'app.js').read_text(encoding='utf-8')
v=(source/'app.js').read_text(encoding='utf-8')
def section(s,start,end): return s[s.index(start):s.index(end,s.index(start))]
def replace(old,new):
    global a
    assert old in a, old[:100]
    a=a.replace(old,new,1)

replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {buildShoreField,shapeRelief,SEA_LEVEL} from './terrain-shape.js?v=14';\nimport {shared,shoreTexture,terrainMaterial,createOcean,skyTexture,setupShadows,markShadows} from './visuals.js?v=14';")
replace(section(a,' const vertexNormals=', ' const vertexColors='),section(v,' const shore=',' const vertexColors='))
replace(section(a,' const material=new THREE.MeshStandardMaterial({vertexColors:', ' const base=new THREE.Mesh'),section(v,' const material=terrainMaterial();',' const base=new THREE.Mesh'))
replace("if(!land(c))return -1;", "if(!land(c))return SEA_LEVEL;")
a=a.replace('new THREE.Vector3(0,1,0),1.4*relief','new THREE.Vector3(0,1,0),-SEA_LEVEL*relief')
replace('layers.trees.visible=shown;refreshVisibility();','markShadows(layers.trees);layers.trees.visible=shown;shadowVersion++;refreshVisibility();')
replace("$('#relief').oninput=", "$('#shadowToggle').onchange=e=>{shadowsOn=e.target.checked;renderer.shadowMap.enabled=shadowsOn;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true});dirty=true};$('#waterToggle').onchange=e=>{waterAnim=e.target.checked;dirty=true};$('#relief').oninput=")
replace(section(a,'let last=0;function animate','async function init'),section(v,'let last=0,shadowSig=','async function init'))
# Freeze both water and tree wind when animation is disabled; retain the last frame.
replace('shared.uTime.value=now*.001;', 'if(waterAnim)shared.uTime.value=now*.001;')
replace("scene.background=new THREE.Color('#244a59');scene.fog=new THREE.Fog('#244a59',2400,6200);", "scene.background=skyTexture();scene.fog=new THREE.Fog('#5b8b99',2600,7200);")
replace("renderer.setClearColor('#244a59')", "renderer.setClearColor('#34677a')")
replace("scene.add(new THREE.HemisphereLight('#e4eff2','#656a4b',2));const light=new THREE.DirectionalLight('#ffedcd',3);light.position.set(-600,1000,-450);scene.add(light);", "scene.add(new THREE.HemisphereLight('#e4eff2','#656a4b',1.75));const light=new THREE.DirectionalLight('#ffedcd',3.3);light.position.set(-1062,1770,-796);scene.add(light);setupShadows(renderer,light);")
replace('layers.trees=nature({D,world,point,rand,paths:waterways.paths});mist=', 'layers.trees=nature({D,world,point,rand,paths:waterways.paths});markShadows(layers.trees);mist=')
replace('cities();featureLabels();','cities();markShadows(layers.cities);markShadows(layers.places);markShadows(layers.landscape);featureLabels();')
replace("'./features.js?v=13'", "'./features.js?v=14'")
(dest/'app.js').write_text(a,encoding='utf-8')

# Apply only the visual hunks; retain the newer dwarven fortress and harbour models.
old=(backup/'features.js').read_text(encoding='utf-8').splitlines(True)
new=(source/'features.js').read_text(encoding='utf-8').splitlines(True)
out=[]
for tag,i,j,k,l in difflib.SequenceMatcher(None,old,new).get_opcodes():
    if tag=='equal': out+=old[i:j]
    elif 'export function dwarvenModel' in ''.join(old[i:j]): out+=old[i:j]
    else: out+=new[k:l]
f=''.join(out).replace('./visuals.js?v=12','./visuals.js?v=14')
assert 'export function dwarvenModel' in f and 'export function harborModel' in f
(dest/'features.js').write_text(f,encoding='utf-8')
for name in ['visuals.js','terrain-shape.js']: shutil.copy2(source/name,dest/name)
html=(dest/'index.html').read_text(encoding='utf-8')
html=html.replace('app.js?v=13.2','app.js?v=14').replace('<label class="slider">Relevo', '<label><input type="checkbox" id="shadowToggle" checked>Sombras</label><label><input type="checkbox" id="waterToggle" checked>Água animada e vento</label><label class="slider">Relevo')
(dest/'index.html').write_text(html,encoding='utf-8')
assert hashlib.sha256((dest/'world.json').read_bytes()).digest()==hashlib.sha256((backup/'world.json').read_bytes()).digest()
print('Visual upgrade merged; world data unchanged; backup:',backup)
