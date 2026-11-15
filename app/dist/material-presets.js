const PRESETS={
 default:{
  id:'default',label:'base temperada',
  ground:{sand:'#d1bd8f',rock:'#8d877b',wet:'#6f6650',snow:'#edf2ef',grass:'#a9be73',urbanBase:'#53473a',urbanHi:'#847664',urbanStone:'#9c927f',urbanDirt:'#6f5b42'},
  roads:{stoneA:'#5d5448',stoneB:'#8c806d',dirtA:'#6f5a44',dirtB:'#8d7251',snow:'#eef2f4'}
 },
 imperial:{
  id:'imperial',label:'imperial',
  ground:{sand:'#d0bc95',rock:'#9b9185',wet:'#746955',snow:'#eff3f2',grass:'#b2bd78',urbanBase:'#5c4b3a',urbanHi:'#8d7a63',urbanStone:'#a59a88',urbanDirt:'#796249'},
  roads:{stoneA:'#665a4d',stoneB:'#998b75',dirtA:'#7a644c',dirtB:'#9a7a58',snow:'#f3f5f7'}
 },
 'elucitor-overview':{
  base:'imperial',id:'elucitor-overview',label:'Elucitor · visão geral',
  ground:{urbanBase:'#5a4837',urbanHi:'#8f7a62',urbanStone:'#ab9e8b'},
  roads:{stoneA:'#685c50',stoneB:'#a1917b',dirtA:'#75624e',dirtB:'#97795b'}
 },
 'elucitor-palace':{
  base:'imperial',id:'elucitor-palace',label:'Elucitor · palácio',
  ground:{sand:'#d8c7a2',rock:'#a79d92',urbanBase:'#62513d',urbanHi:'#9d896f',urbanStone:'#b8ad98',grass:'#b8c57f'},
  roads:{stoneA:'#726658',stoneB:'#afa089',dirtA:'#806852',dirtB:'#a88764'}
 },
 'elucitor-high':{
  base:'imperial',id:'elucitor-high',label:'Elucitor · cidade alta',
  ground:{urbanBase:'#5b4c3b',urbanHi:'#927e67',urbanStone:'#aea28d',grass:'#b1bf78'},
  roads:{stoneA:'#6d6052',stoneB:'#a2937d'}
 },
 'elucitor-market':{
  base:'imperial',id:'elucitor-market',label:'Elucitor · mercado',
  ground:{sand:'#cfb98f',urbanBase:'#654f37',urbanHi:'#977b57',urbanStone:'#a89177',urbanDirt:'#826648'},
  roads:{stoneA:'#6d5947',stoneB:'#977d61',dirtA:'#876746',dirtB:'#ad875d'}
 },
 'elucitor-harbour':{
  base:'imperial',id:'elucitor-harbour',label:'Elucitor · porto',
  ground:{sand:'#c8b28d',wet:'#665b48',urbanBase:'#564639',urbanHi:'#7b6857',urbanStone:'#968776',urbanDirt:'#6d573f'},
  roads:{stoneA:'#5d5248',stoneB:'#817466',dirtA:'#70583f',dirtB:'#8a6b4c'}
 },
 'elucitor-temple':{
  base:'imperial',id:'elucitor-temple',label:'Elucitor · templo',
  ground:{sand:'#d9ccb3',rock:'#a6a6a1',urbanBase:'#685b4d',urbanHi:'#9b8f82',urbanStone:'#c1b8ac',grass:'#b8c98d'},
  roads:{stoneA:'#7b756e',stoneB:'#b0a89d',dirtA:'#8a7760',dirtB:'#aa9276'}
 },
 'elucitor-noble':{
  base:'imperial',id:'elucitor-noble',label:'Elucitor · nobre',
  ground:{urbanBase:'#5e4b38',urbanHi:'#8f775e',urbanStone:'#b09f89',grass:'#b5c27a'},
  roads:{stoneA:'#695949',stoneB:'#a08b71'}
 },
 'elucitor-craft':{
  base:'imperial',id:'elucitor-craft',label:'Elucitor · ofícios',
  ground:{sand:'#c8b08a',rock:'#877d73',wet:'#5d5448',urbanBase:'#4f4134',urbanHi:'#756351',urbanStone:'#8c7e71',urbanDirt:'#6d573f'},
  roads:{stoneA:'#554d46',stoneB:'#797168',dirtA:'#675340',dirtB:'#81664d'}
 },
 'elucitor-residential':{
  base:'imperial',id:'elucitor-residential',label:'Elucitor · cidade baixa',
  ground:{sand:'#d2bc93',urbanBase:'#594737',urbanHi:'#876f58',urbanStone:'#9d8b76',urbanDirt:'#765d45',grass:'#aebc77'},
  roads:{stoneA:'#62574a',stoneB:'#8f806d',dirtA:'#745f49',dirtB:'#95775a'}
 },
 'castamor-tharok':{
  base:'imperial',id:'castamor-tharok',label:'Castamor · fortaleza nevada',
  ground:{rock:'#6e7479',snow:'#e2e6e6',urbanBase:'#515355',urbanHi:'#77787b',urbanStone:'#94979a',grass:'#8c9c8b'},
  roads:{stoneA:'#555a60',stoneB:'#828487',dirtA:'#5b544d',dirtB:'#797067'}
 },
 'lorvus-poor':{
  base:'imperial',id:'lorvus-poor',label:'Lorvus · aldeia mineira',
  ground:{rock:'#686663',urbanBase:'#4c473f',urbanHi:'#786d5c',urbanStone:'#77736d',urbanDirt:'#5b4b3b',grass:'#828c73'},
  roads:{stoneA:'#514b43',stoneB:'#6a6257',dirtA:'#61513e',dirtB:'#7a6448'}
 },
 'alia-rural':{
  base:'imperial',id:'alia-rural',label:'Condado de Alia · campinas',
  ground:{rock:'#8a8f7a',grass:'#9abb79',urbanBase:'#756549',urbanHi:'#9a835e',urbanStone:'#998d70',urbanDirt:'#8d754c'},
  roads:{stoneA:'#8b8167',stoneB:'#aaa085',dirtA:'#8b7351',dirtB:'#ad9268'}
 },
 'tramor-provincial':{base:'imperial',id:'tramor-provincial',label:'Tramor · estrada provincial',ground:{urbanBase:'#65503c',urbanHi:'#907352'},roads:{dirtA:'#7d6047',dirtB:'#997755'}},
 'rimae-fort':{base:'imperial',id:'rimae-fort',label:'Rimae · muralha de fronteira',ground:{rock:'#777c7d',urbanBase:'#585b5b',urbanStone:'#858b88'},roads:{stoneA:'#5f6060',stoneB:'#898b87'}},
 'rimae-market':{base:'imperial',id:'rimae-market',label:'Bomaria · mercado de trégua',ground:{urbanBase:'#695949',urbanHi:'#927f69'},roads:{stoneB:'#9e8c75'}},
 'danumbria-arcane':{base:'imperial',id:'danumbria-arcane',label:'Danumbria · campus arcano',ground:{urbanBase:'#5e5961',urbanHi:'#8a8490',urbanStone:'#b8b8c6',grass:'#a6ba86'},roads:{stoneA:'#66606d',stoneB:'#9891a2'}},
 'feixos-littoral':{base:'imperial',id:'feixos-littoral',label:'Feixos · porto sincrético',ground:{sand:'#c7b08b',wet:'#655646',urbanBase:'#5b4739',urbanHi:'#8a6e55',urbanStone:'#9b8d7c'},roads:{stoneA:'#645547',stoneB:'#8a7764',dirtA:'#735940',dirtB:'#936f4e'}},
 'mestrina-southern':{base:'imperial',id:'mestrina-southern',label:'Mestrina · mercado meridional',ground:{sand:'#d4b58b',urbanBase:'#6a4e38',urbanHi:'#9a7350',urbanStone:'#ac9070',urbanDirt:'#8a6645',grass:'#b9bb74'},roads:{stoneA:'#6b5645',stoneB:'#99775f',dirtA:'#896342',dirtB:'#ad8056'}},
 'althor-fort':{base:'imperial',id:'althor-fort',label:'Althor · fortaleza antiga',ground:{rock:'#78736d',urbanBase:'#55483f',urbanHi:'#7f6b5d',urbanStone:'#97897b',grass:'#95a07c'},roads:{stoneA:'#5f564e',stoneB:'#85786a'}},
 'arenor-winter':{base:'imperial',id:'arenor-winter',label:'Arenor · marca invernal',ground:{rock:'#757880',snow:'#e9edf0',urbanBase:'#54565c',urbanHi:'#7b8089',urbanStone:'#9fa4ae',grass:'#8e9a8a'},roads:{stoneA:'#5d6168',stoneB:'#8b9096'}},
 'vennoduro-port':{base:'imperial',id:'vennoduro-port',label:'Vennoduro · porto senhorial',ground:{sand:'#cab497',urbanBase:'#594839',urbanHi:'#846b56',urbanStone:'#9a8a78'},roads:{stoneA:'#63584e',stoneB:'#887a6b',dirtA:'#725d47',dirtB:'#91735a'}},
 'dragonfall-royal':{base:'imperial',id:'dragonfall-royal',label:'Asgorath · nobreza do norte',ground:{rock:'#85888a',urbanBase:'#53565b',urbanHi:'#858486',urbanStone:'#adaea9',grass:'#9aac88'},roads:{stoneA:'#60646b',stoneB:'#98999b'}},
 'dragonfall-elfic':{base:'imperial',id:'dragonfall-elfic',label:'Ereth e Porto Naril · jardins élficos',ground:{rock:'#b6b8aa',urbanBase:'#747967',urbanHi:'#b2b9a3',urbanStone:'#d6dacc',grass:'#7faa80'},roads:{stoneA:'#959e91',stoneB:'#cad1bc',dirtA:'#788060',dirtB:'#98a27e'}},
 'dragonfall-halfling':{base:'imperial',id:'dragonfall-halfling',label:'Rivertown · caminhos e hortas',ground:{urbanBase:'#76654c',urbanHi:'#a3906c',urbanStone:'#999981',urbanDirt:'#917a57',grass:'#a3be78'},roads:{stoneA:'#827660',stoneB:'#b0a085',dirtA:'#8b7150',dirtB:'#ac8b64'}},
 'dragonfall-arcane':{base:'imperial',id:'dragonfall-arcane',label:'Torre Solitária · alvenaria arcana',ground:{rock:'#96989b',urbanBase:'#5e636a',urbanHi:'#8c919b',urbanStone:'#b9bec7',grass:'#8d9b8f'},roads:{stoneA:'#60646a',stoneB:'#979da7'}},
 'dragonfall-dwarven':{base:'imperial',id:'dragonfall-dwarven',label:'Dagorah · pedra dos clãs',ground:{rock:'#777775',urbanBase:'#4f4e4b',urbanHi:'#827c73',urbanStone:'#a69c8d',grass:'#919a86'},roads:{stoneA:'#585550',stoneB:'#888076'}},
 'dragonfall-khajitt':{base:'imperial',id:'dragonfall-khajitt',label:'Malacatt · terras úmidas',ground:{sand:'#b1a184',rock:'#77736d',wet:'#504e3e',urbanBase:'#554d3e',urbanHi:'#81745c',urbanStone:'#9b9078',grass:'#74977b'},roads:{stoneA:'#60554a',stoneB:'#8c7964',dirtA:'#675540',dirtB:'#89714f'}},
 'dragonfall-caravan':{base:'imperial',id:'dragonfall-caravan',label:'Savhalla · ocre e areia',ground:{sand:'#dab782',rock:'#a78b69',wet:'#8c765c',urbanBase:'#7e6043',urbanHi:'#b08d60',urbanStone:'#cbb08a',grass:'#c2b47c'},roads:{stoneA:'#887056',stoneB:'#b5976f',dirtA:'#96704d',dirtB:'#c09562'}},
 'dragonfall-ash':{base:'imperial',id:'dragonfall-ash',label:'Porto das Cinzas · pedra queimada',ground:{sand:'#b4aa9e',rock:'#69686a',wet:'#51504e',urbanBase:'#4c4b4c',urbanHi:'#747173',urbanStone:'#989292',grass:'#83887d'},roads:{stoneA:'#575358',stoneB:'#898386',dirtA:'#625951',dirtB:'#86756c'}},
 'dragonfall-north':{base:'imperial',id:'dragonfall-north',label:'Fortalezas do norte',ground:{rock:'#7a8085',snow:'#e9eff0',urbanBase:'#4d5258',urbanHi:'#747d84',urbanStone:'#979fa6',grass:'#829587'},roads:{stoneA:'#52585f',stoneB:'#858d95',dirtA:'#666257',dirtB:'#8a8374'}},
 'dragonfall-volcanic':{base:'imperial',id:'dragonfall-volcanic',label:'Gugacon · basalto e cinza',ground:{sand:'#82786e',rock:'#4e4a4f',wet:'#4b4141',urbanBase:'#35353a',urbanHi:'#62595b',urbanStone:'#817575',grass:'#7f786e'},roads:{stoneA:'#3d383c',stoneB:'#71676a',dirtA:'#554944',dirtB:'#75625a'}},
 'dragonfall-ruins':{base:'imperial',id:'dragonfall-ruins',label:'Nilhelm · vestígios',ground:{rock:'#7b7e7a',urbanBase:'#77746c',urbanHi:'#9b958a',urbanStone:'#b2aea6',grass:'#879b83'}},
 'dragonfall-fishers':{base:'dragonfall-elfic',id:'dragonfall-fishers',label:'Vila Sardinhas · floresta e pesca',ground:{urbanBase:'#726753',urbanHi:'#a28d6e',grass:'#85a980'},roads:{dirtA:'#816849',dirtB:'#a18b69'}},

 'vitravion-elfic':{base:'imperial',id:'vitravion-elfic',label:'Vitravion · bosque alto-élfico',ground:{sand:'#d8c9ab',rock:'#9ea28f',wet:'#6e6f58',urbanBase:'#6a6556',urbanHi:'#a2a28f',urbanStone:'#c7cbbc',grass:'#8fb27f'},roads:{stoneA:'#7d8174',stoneB:'#bcc2b4',dirtA:'#7c745e',dirtB:'#9e957a'}},
 'vitravion-port':{base:'vitravion-elfic',id:'vitravion-port',label:'Vitravion · porto republicano',ground:{sand:'#ceb696',wet:'#6b6557',urbanBase:'#5f5649',urbanHi:'#8d806f',urbanStone:'#b6b09f',grass:'#87a17b'},roads:{stoneA:'#6e6558',stoneB:'#a19786',dirtA:'#7c6247',dirtB:'#9c7c59'}},
 'vitravion-republic':{base:'vitravion-elfic',id:'vitravion-republic',label:'Vitravion · república ajardinada',ground:{urbanBase:'#676153',urbanHi:'#9d9887',urbanStone:'#c7c4b7',grass:'#93b384'},roads:{stoneA:'#78786c',stoneB:'#b1b3a9',dirtA:'#7a6c58',dirtB:'#a08d73'}},
 'vitravion-mountain':{base:'imperial',id:'vitravion-mountain',label:'Vitravion · portal de montanha',ground:{rock:'#75716a',urbanBase:'#4f4b45',urbanHi:'#7a7369',urbanStone:'#958d82',grass:'#87927d'},roads:{stoneA:'#58534d',stoneB:'#7d766e'}},
 'navi-capital':{base:'vitravion-elfic',id:'navi-capital',label:'Navï Velaffëll · capital imperial',ground:{sand:'#d8c5a8',urbanBase:'#6a6255',urbanHi:'#a59b89',urbanStone:'#d4d2c8',grass:'#8db283'},roads:{stoneA:'#78786e',stoneB:'#c0c4b8',dirtA:'#7d6c57',dirtB:'#a08a70'}},
 'navi-port':{base:'vitravion-port',id:'navi-port',label:'Navï Velaffëll · porto',ground:{sand:'#ccb294',wet:'#686152',urbanBase:'#5d5448',urbanHi:'#8b7d6c',urbanStone:'#c0baad',grass:'#87a37b'},roads:{stoneA:'#6a6257',stoneB:'#a59b8c',dirtA:'#7b5f45',dirtB:'#9d7b58'}},
 'navi-forest':{base:'vitravion-elfic',id:'navi-forest',label:'Navï Velaffëll · floresta',ground:{urbanBase:'#645f54',urbanHi:'#989685',urbanStone:'#c3c5b9',grass:'#7fa878'},roads:{stoneA:'#73786e',stoneB:'#b3b9ae',dirtA:'#6e654e',dirtB:'#93886a'}},
 'navi-civic':{base:'vitravion-republic',id:'navi-civic',label:'Navï Velaffëll · cidade cívica',ground:{urbanBase:'#6a6256',urbanHi:'#9a9486',urbanStone:'#cbc8bc',grass:'#8dae7f'},roads:{stoneA:'#79796f',stoneB:'#bcc0b4',dirtA:'#796a57',dirtB:'#9b8a73'}},
 'navi-sacred':{base:'vitravion-elfic',id:'navi-sacred',label:'Navï Velaffëll · centro sagrado',ground:{urbanBase:'#666056',urbanHi:'#a39d8d',urbanStone:'#dad6cc',grass:'#8cb486'},roads:{stoneA:'#77766e',stoneB:'#c3c5be',dirtA:'#766a58',dirtB:'#9d8c78'}},
 'navi-arcane':{base:'vitravion-elfic',id:'navi-arcane',label:'Navï Velaffëll · centro arcano',ground:{urbanBase:'#615e66',urbanHi:'#9995a2',urbanStone:'#cbc9d5',grass:'#8ba27f'},roads:{stoneA:'#6c6a76',stoneB:'#b0afbc',dirtA:'#72685b',dirtB:'#938674'}},
};

const merge=(a,b)=>{
 const out={...(a||{})};
 for(const[k,v]of Object.entries(b||{}))out[k]=v&&typeof v==='object'&&!Array.isArray(v)?merge(out[k],v):v;
 return out;
};
export function materialPreset(name='default'){
 const src=PRESETS[name]||PRESETS.default;
 const base=src.base?materialPreset(src.base):{};
 return merge(base,src);
}
export function resolveMaterialPreset({cityName='',districtKey='',architecture='',blueprintPattern='',climate='temperate'}={}){
 const name=(cityName||'').toLowerCase();
 const special={'castamor':'castamor-tharok','lorvus':'lorvus-poor','alia':'alia-rural',
  'tramor':'tramor-provincial','ignis':'rimae-fort','nostris':'rimae-fort','vostris':'rimae-fort','bomaria':'rimae-market',
  'danumbria':'danumbria-arcane','feixos':'feixos-littoral','mestrina':'mestrina-southern','althor':'althor-fort','arenor':'arenor-winter','vennoduro':'vennoduro-port',
  'asgorath':'dragonfall-royal','ereth':'dragonfall-elfic','porto naril':'dragonfall-elfic',
  'rivertown':'dragonfall-halfling','torre solitária':'dragonfall-arcane','dagorah':'dragonfall-dwarven',
  'malacatt':'dragonfall-khajitt','savhalla':'dragonfall-caravan','porto das cinzas':'dragonfall-ash',
  'winterhelm':'dragonfall-north','rinnton':'dragonfall-north','clifshore':'dragonfall-north','lakenford':'dragonfall-north',
  'gugacon':'dragonfall-volcanic','porto sarandir':'dragonfall-volcanic','nilhelm':'dragonfall-ruins',
  'vila sardinhas':'dragonfall-fishers',
  'vir':'vitravion-elfic','triovorn':'vitravion-elfic','guernica':'vitravion-republic','kyon':'vitravion-republic',
  'porto de vern':'vitravion-port','porto do álamo':'vitravion-port','lirion':'vitravion-elfic','oregon':'vitravion-republic',
  'pyrenor':'vitravion-mountain','sulpa':'vitravion-elfic','guil':'vitravion-elfic','bernut':'vitravion-port','vyoh':'vitravion-republic','mauron':'vitravion-mountain',
  'velaffeld':'navi-capital','chaundor':'navi-civic','lyadargor':'navi-civic','natheas':'navi-port','liriathyr':'navi-civic',
  'garnalos':'navi-sacred','himlumn':'navi-sacred','sahtalys':'navi-arcane','allanan':'navi-port','nythan':'navi-forest','sel-shofela':'navi-forest',
  'selne':'navi-civic','karno\'ande':'navi-forest','jalha':'navi-forest','oraland ise':'navi-forest'};
 if(special[name])return materialPreset(special[name]);
 if(/elucitor/.test(name)){
  if(districtKey&&districtKey!=='overview')return materialPreset(`elucitor-${districtKey}`);
  return materialPreset('elucitor-overview');
 }
 if(/dwarven|volcanic|fortress/.test(`${architecture} ${blueprintPattern}`.toLowerCase()))return materialPreset('imperial');
 if(/cold|alpine/.test(String(climate).toLowerCase()))return materialPreset('default');
 return materialPreset('default');
}
export const MATERIAL_PRESETS=PRESETS;
