"""Produce original self-contained glTF 2.0 (.glb) tree assets for Silvengard.
No external/third-party meshes; these assets are original to this build.
"""
import math, hashlib, json
from pathlib import Path
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix

OUT=Path('/mnt/data/work_v21/silvengard-interactive-map/app/dist/assets/optimized/vegetation')
OUT.mkdir(parents=True,exist_ok=True)

def rgb(hex_code):
 h=hex_code.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))+(255,)

def mesh_color(mesh, color):
 mesh.visual.vertex_colors=np.tile(np.array(rgb(color),dtype=np.uint8),(len(mesh.vertices),1))
 return mesh

def add(scene,name,mesh,color):
 scene.add_geometry(mesh_color(mesh,color),geom_name=name,node_name=name)

def cylinder_between(a,b,r,n=9):
 a=np.asarray(a,float);b=np.asarray(b,float);d=b-a
 m=trimesh.creation.cylinder(radius=r,height=float(np.linalg.norm(d)),sections=n)
 from trimesh.geometry import align_vectors
 t=align_vectors([0,0,1], d)
 m.apply_transform(t)
 m.apply_translation((a+b)/2)
 return m

def ellipsoid(center,radius,subdiv=1):
 m=trimesh.creation.icosphere(subdivisions=subdiv, radius=1)
 m.apply_scale(radius);m.apply_translation(center)
 return m

def cone(center_y,base,top,h,n=12):
 # low-poly cone, axis y, with base at y=0
 angles=np.arange(n,dtype=float)*2*math.pi/n
 verts=[[0.,0.,0.]]+[[base*math.cos(a),0.,base*math.sin(a)] for a in angles]+[[0.,h,0.]]
 inds=[]
 for i in range(n):
  j=(i+1)%n
  inds.append([0,j+1,i+1]);inds.append([i+1,j+1,n+1])
 m=trimesh.Trimesh(vertices=verts,faces=inds,process=False)
 m.apply_translation([0,center_y,0]);return m

def make_tree(name):
 scene=trimesh.Scene();s=0
 seed={'oak-old':37,'oak-young':18,'birch':29,'pine':43,'spruce':53,'cypress':79,'willow':11,'blossom':61}[name]
 rand=np.random.default_rng(seed)
 evergreen=name in ('pine','spruce','cypress')
 heights={'oak-old':9.6,'oak-young':7.4,'birch':9.0,'pine':11.2,'spruce':9.9,'cypress':10.5,'willow':9.5,'blossom':7.5}
 H=heights[name]
 bark={'birch':'#dbd8c7','oak-old':'#74634e','oak-young':'#7b6b51','willow':'#676349','blossom':'#6c5148','pine':'#6c5c49','spruce':'#6e5944','cypress':'#6b6146'}[name]
 leaf={'oak-old':'#537d51','oak-young':'#73a461','birch':'#85ad66','pine':'#48725c','spruce':'#416c59','cypress':'#568164','willow':'#76aa6d','blossom':'#b67993'}[name]
 def shade(hexcolor,delta):
  c=np.asarray(rgb(hexcolor)[:3],int)
  return '#'+''.join(f'{int(v):02x}' for v in np.clip(c+delta,0,255))
 if evergreen:
  trunkH=H*.93
  add(scene,'trunk',cylinder_between((0,0,0),(0,trunkH,0),.21),bark)
  levels=7 if name!='cypress' else 11
  for i in range(levels):
   y=H*.16+i*H*.072 if name=='cypress' else H*.18+i*H*.087
   r=(.65 if name=='cypress' else 2.0)*(1-i/(levels+2))
   hh=(2.2 if name=='cypress' else 2.6)*(1-i/(levels+6))
   add(scene,f'needle-branch-{i}',cone(y,r,0,hh,n=9 if name=='cypress' else 11),shade(leaf,(i%4-2)*9))
 else:
  trunkH=H*.65
  add(scene,'trunk',cylinder_between((0,0,0),(.12,trunkH,0),.24 if name!='oak-old' else .34),bark)
  if name=='birch':
   for i in range(6):
    y=.9+i*.85
    m=trimesh.creation.box(extents=[.33,.13,.34]);m.apply_translation([.13,y,0]);add(scene,f'bark-mark-{i}',m,'#747977')
  branch_count=8 if name in ('oak-old','willow') else 6
  for i in range(branch_count):
   a=i*math.tau/branch_count+.13
   y0=trunkH*(.45+rand.uniform(0,.24))
   span=(2.8 if name=='oak-old' else 2.2 if name!='birch' else 1.7)*rand.uniform(.7,1.08)
   y1=(H*.73 if name=='willow' else H*.78)+rand.uniform(-1.1,1.0)
   tip=(math.cos(a)*span,y1,math.sin(a)*span)
   add(scene,f'branch-{i}',cylinder_between((.1,y0,0),tip,.12),bark)
   for j in range(2 if name!='birch' else 3):
    cx=tip[0]+rand.uniform(-.65,.65)
    cy=tip[1]+rand.uniform(-.35,.7)
    cz=tip[2]+rand.uniform(-.65,.65)
    if name=='willow':
     ry=rand.uniform(1.0,2.1);rad=[rand.uniform(.5,.8),ry,rand.uniform(.48,.8)]
     cy-=ry*.35
    elif name=='birch':rad=[.8,.92,.72]
    elif name=='blossom':rad=[1.02,.91,.98]
    elif name=='oak-old':rad=[1.35,1.22,1.22]
    else:rad=[1.0,1.0,1.0]
    add(scene,f'foliage-{i}-{j}',ellipsoid((cx,cy,cz),rad),shade(leaf,int(rand.integers(-21,22))))
  add(scene,'foliage-central',ellipsoid((0,H*.79,0),[1.2 if name!='oak-old' else 1.8,1.05,1.25]),leaf)
 return scene

metadata=[]
for n in ['oak-old','oak-young','birch','pine','spruce','cypress','willow','blossom']:
 tree=make_tree(n)
 # One coloured mesh per species: one InstancedMesh / draw call at runtime.
 combined=trimesh.util.concatenate(list(tree.geometry.values()))
 tree=trimesh.Scene();tree.add_geometry(combined,geom_name=n,node_name=n)
 data=tree.export(file_type='glb', include_normals=True)
 p=OUT/(n+'.glb');p.write_bytes(data)
 loaded=trimesh.load(str(p),force='scene');b=loaded.bounds
 metadata.append({'id':n,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'height':round(float(b[1][1]-b[0][1]),2),'bounds_m':np.round(b,2).tolist(),'parts':len(loaded.geometry)})
 print(n,round(len(data)/1024,1),'KiB',round(float(b[1][1]-b[0][1]),2),'m',len(loaded.geometry),'parts')
(OUT/'manifest-build.json').write_text(json.dumps(metadata,indent=2))
