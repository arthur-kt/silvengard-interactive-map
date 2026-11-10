// Labour status overlaps social strata; it never adds people to the census.
export const SLAVE_TRADING_STATES=[20,24,29];
export const slaveTradeAllowed=b=>!!b&&SLAVE_TRADING_STATES.includes(b.state)&&!b.magicSchool;
export const forcedLaborPeople=b=>slaveTradeAllowed(b)?Math.floor((b.demographics?.populationKnown===false?0:b.demographics?.population||0)*(b.forcedLaborShare||0)/100):0;
export function cleanForcedLaborShare(n,b){if(!Number.isFinite(n)||n<0||n>100)throw Error('Trabalho escravizado: informe um percentual de 0 a 100.');if(n&&!slaveTradeAllowed(b))throw Error('O comércio de pessoas não está habilitado neste estado ou escola.');return n;}
export function laborCostFactor(b,account){const people=account?account.assets?.[31]||0:forcedLaborPeople(b),population=b?.demographics?.population||0;return population?Math.max(.6,1-.75*Math.min(.4,people/population)):1;}
