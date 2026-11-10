import fs from 'node:fs';
import {defaultSocialProfile,aggregateIncome} from '../../app/dist/economy-income.js';
const main=new URL('../',import.meta.url),roots=[main,new URL('../silvengard-atlas v2/',main)],read=p=>JSON.parse(fs.readFileSync(p));
for(const root of roots){const p=new URL('dist/world.json',root),w=read(p);for(const b of w.cities)if(b.socialProfile?.estimated!==false)b.socialProfile=defaultSocialProfile(b);fs.writeFileSync(p,JSON.stringify(w));console.log(root.pathname,aggregateIncome(w.cities));}
