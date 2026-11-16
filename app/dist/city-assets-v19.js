// Silvengard v19 - zero city asset requests before an explicit local-view action.
// The small manifests and culture kits describe assets; THREE objects live only
// while the matching local scene is open. LRU is metadata-only, not GPU cache.
export const V19_ASSET_VERSION=19;
const SAFE_KIT=/^[a-z][a-z0-9-]{0,35}$/;
const SAFE_MODEL=/^[a-z0-9][a-z0-9/_-]{0,100}\.json$/;
const SLOTS=new Set(['paving','stone','rock','wood','roofing','ground','mud']);
const LIMIT_MODELS=8;

const safeList=(items,allowed)=>Array.isArray(items)?[...new Set(items.filter(v=>typeof v==='string'&&allowed(v)))]:[];
const validModel=v=>v&&typeof v==='object'&&typeof v.file==='string'&&SAFE_MODEL.test(v.file)&&
  !v.file.split('/').includes('..')&&['market','noble','palace','academy','temple','craft','grove','military','residential','harbour'].includes(v.district)&&
  (v.scale===undefined||(Number.isFinite(v.scale)&&v.scale>0&&v.scale<=5));

function fallback(cityId){return {version:V19_ASSET_VERSION,cityId,kit:'default',textures:['ground','stone','wood','roofing'],models:[]};}
const record=(cityId,man,kit)=>({version:V19_ASSET_VERSION,cityId,
 kit:man.kit||'default',
 textures:safeList([...(kit.textures||[]),...(man.textures||[])],v=>SLOTS.has(v)),
 models:[...(kit.models||[]),...(man.models||[])].filter(validModel).slice(0,LIMIT_MODELS),
 quality:man.quality||kit.quality||'procedural',
 architecture:kit.architecture?.enabled?{enabled:true,theme:kit.architecture.theme||'timber',coreCoverage:Math.min(.75,Math.max(.10,Number(kit.architecture.coreCoverage)||.52)),maxHouses:Math.min(450,Math.max(8,Number(kit.architecture.maxHouses)||290))}:null});

export function createCityAssetManager({fetcher=fetch,base='./city-assets',maxMetadata=2}={}){
 const cache=new Map();let active=null;
 const getJSON=async(path,signal)=>{
  const res=await fetcher(path,{signal,cache:'no-cache'}); // v20: nao reutilizar JSON da v19
  if(!res?.ok)throw new Error(`Pacote urbano indisponível: ${path} (${res?.status||'sem resposta'})`);
  return res.json();
 };
 const load=async(cityId,{signal,onProgress}={})=>{
  if(!Number.isSafeInteger(cityId)||cityId<=0)return fallback(null);
  if(signal?.aborted)throw signal.reason||new Error('Carregamento cancelado');
  const cached=cache.get(cityId);
  if(cached){cache.delete(cityId);cache.set(cityId,cached);active=cityId;return cached}
  onProgress?.('Lendo os recursos desta cidade…');
  let manifest;
  try{manifest=await getJSON(`${base}/manifests/${cityId}.json`,signal)}
  catch(e){if(signal?.aborted)throw e;console.warn('[v19] Sem manifesto; usando cidade procedural:',e);manifest=fallback(cityId)}
  if(manifest.cityId!==cityId)throw new Error(`Manifesto da cidade ${cityId} não corresponde ao local selecionado`);
  const kitName=SAFE_KIT.test(manifest.kit||'')?manifest.kit:'default';
  onProgress?.('Selecionando o conjunto cultural…');
  let kit;
  try{kit=await getJSON(`${base}/kits/${kitName}.json`,signal)}
  catch(e){if(signal?.aborted)throw e;console.warn('[v19] Kit ausente; mantendo visual procedural:',e);kit={textures:['ground','stone','wood','roofing'],models:[]}}
  const pack=record(cityId,{...manifest,kit:kitName},kit);
  cache.set(cityId,pack);
  while(cache.size>Math.max(1,Math.min(5,maxMetadata)))cache.delete(cache.keys().next().value);
  active=cityId;
  return pack;
 };
 return {
  load,
  leave(){active=null},
  clear(){active=null;cache.clear()},
  get activeCityId(){return active},
  get metadataCount(){return cache.size},
  get modelsInMemory(){return 0} // model geometries are owned by each street scene, never this manager
 };
}
