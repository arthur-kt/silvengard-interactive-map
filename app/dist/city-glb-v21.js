// Silvengard Atlas v21: local, minimal binary glTF 2.0 reader for the eight
// original, self-contained colored vegetation assets in assets/optimized.
// No imports or network requests occur until explicitly entering a city.
import * as THREE from 'three';

const COMP={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const COMPONENT_BYTES={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const ELEMENTS={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
const FILE=/^assets\/optimized\/vegetation\/[a-z0-9-]+\.glb$/;
export function parseCityGLB21(data){
 const dv=new DataView(data),size=data.byteLength;
 if(size<28||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==size)
  throw new Error('GLB inválido: cabeçalho ou tamanho incorreto');
 let pos=12,json=null,binOffset=-1,binLength=0;
 while(pos+8<=size){const len=dv.getUint32(pos,true),kind=dv.getUint32(pos+4,true);pos+=8;
  if(pos+len>size)throw new Error('GLB inválido: bloco ultrapassa o arquivo');
  if(kind===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,pos,len)));
  else if(kind===0x004e4942){binOffset=pos;binLength=len}
  pos+=len;
 }
 if(pos!==size||!json||binOffset<0||json.asset?.version!=='2.0')throw new Error('GLB inválido: conteúdo glTF incompleto');
 if(!Array.isArray(json.meshes)||!Array.isArray(json.accessors)||!Array.isArray(json.bufferViews))throw new Error('GLB sem malha');
 const read=index=>{
  const a=json.accessors[index],view=json.bufferViews[a?.bufferView],C=COMP[a?.componentType],elems=ELEMENTS[a?.type];
  if(!a||!view||!C||!elems||a.sparse||view.byteStride)throw new Error('Atributo GLB não suportado');
  const bytes=COMPONENT_BYTES[a.componentType],length=a.count*elems,byteAt=binOffset+(view.byteOffset||0)+(a.byteOffset||0),end=byteAt+length*bytes;
  if(length>5e6||byteAt<binOffset||end>binOffset+binLength)throw new Error('Buffer GLB fora dos limites');
  // Copy to a new aligned typed array (GLB byte offsets can have arbitrary padding).
  const raw=data.slice(byteAt,end),arr=new C(raw);
  return {array:arr,normalized:!!a.normalized,component:a.componentType,elems};
 };
 const mesh=json.meshes[0],primitives=mesh.primitives||[];
 if(primitives.length!==1||primitives[0].mode!==4)throw new Error('O kit requer uma única malha triangular por árvore');
 const p=primitives[0],position=read(p.attributes.POSITION),normal=p.attributes.NORMAL!==undefined?read(p.attributes.NORMAL):null,color=p.attributes.COLOR_0!==undefined?read(p.attributes.COLOR_0):null;
 if(position.elems!==3||position.component!==5126)throw new Error('Posições GLB inválidas');
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(position.array,3));
 if(normal)geo.setAttribute('normal',new THREE.BufferAttribute(normal.array,3));
 if(color)geo.setAttribute('color',new THREE.BufferAttribute(color.array,color.elems,color.normalized));
 if(p.indices!==undefined){const ids=read(p.indices);if(ids.elems!==1)throw new Error('Índices GLB inválidos');geo.setIndex(new THREE.BufferAttribute(ids.array,1));}
 if(!normal)geo.computeVertexNormals();
 geo.computeBoundingSphere();
 const mat=new THREE.MeshStandardMaterial({vertexColors:!!color,roughness:.92,metalness:0,side:THREE.DoubleSide});
 return {geometry:geo,material:mat,vertices:position.array.length/3,triangles:(geo.index?.count||position.array.length/3)/3};
}
export async function loadCityGLB21(url,{signal}={}){
 if(!FILE.test(url))throw new Error('Caminho de modelo 3D não autorizado: '+url);
 const r=await fetch('./'+url,{signal,cache:'no-cache'});
 if(!r.ok)throw new Error(`Árvore 3D indisponível: ${url} (${r.status})`);
 const b=await r.arrayBuffer();
 if(b.byteLength>8_000_000)throw new Error('Árvore 3D ultrapassa o orçamento individual de 8 MB');
 return parseCityGLB21(b);
}
