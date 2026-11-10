// Explicit residents, linked itinerants and seasonal visitors; no inferred ethnicity rules.
export const residentPopulation=b=>b.demographics?.populationKnown===false?0:Math.max(0,b.demographics?.population||0);
export const linkedPopulation=b=>Math.max(0,b.demographics?.itinerantPopulation||0);
export const economicPopulation=b=>residentPopulation(b)+linkedPopulation(b);
export function populationDescription(b){return b.demographics?.populationKnown===false?'População desconhecida':residentPopulation(b).toLocaleString('pt-BR')+' residentes'+(linkedPopulation(b)?' · '+linkedPopulation(b).toLocaleString('pt-BR')+' itinerantes vinculados':'');}
export function seasonalVisitors(b,cycle,days){const phase=Math.floor(cycle*days/30)%12;return Math.round((b.seasonalVisitors||0)*([2,5,8,11].includes(phase)?1:.25));}
export function landDensity(c){if(c.h<20||[0,17].includes(c.state)||[13,14,15].includes(c.biome))return 0;const density=({1:.12,2:.2,3:6,4:4,5:3,6:2,7:1.5,8:1,9:.4,10:.1,11:.03,12:.4})[c.biome]||.5;return density*(c.h>=65?.08:c.h>=45?.3:1);}
