// Silvengard · leitura de fichas .cah (D&D 5e Companion antigo) e fichas nativas.
// Funções puras: sem DOM, sem three.js. Podem ser testadas no Node.

export const ABILITIES = [
  {key: 'str', short: 'FOR', name: 'Força', cah: 'strength'},
  {key: 'dex', short: 'DES', name: 'Destreza', cah: 'dexterity'},
  {key: 'con', short: 'CON', name: 'Constituição', cah: 'constitution'},
  {key: 'int', short: 'INT', name: 'Inteligência', cah: 'intelligence'},
  {key: 'wis', short: 'SAB', name: 'Sabedoria', cah: 'wisdom'},
  {key: 'cha', short: 'CAR', name: 'Carisma', cah: 'charisma'},
];

export const SKILLS = [
  {key: 'acrobatics', name: 'Acrobacia', ability: 'dex', cah: 'ACROBATICS'},
  {key: 'animal_handling', name: 'Adestrar Animais', ability: 'wis', cah: 'ANIMAL_HANDLING'},
  {key: 'arcana', name: 'Arcanismo', ability: 'int', cah: 'ARCANA'},
  {key: 'athletics', name: 'Atletismo', ability: 'str', cah: 'ATHLETICS'},
  {key: 'deception', name: 'Enganação', ability: 'cha', cah: 'DECEPTION'},
  {key: 'history', name: 'História', ability: 'int', cah: 'HISTORY'},
  {key: 'insight', name: 'Intuição', ability: 'wis', cah: 'INSIGHT'},
  {key: 'intimidation', name: 'Intimidação', ability: 'cha', cah: 'INTIMIDATION'},
  {key: 'investigation', name: 'Investigação', ability: 'int', cah: 'INVESTIGATION'},
  {key: 'medicine', name: 'Medicina', ability: 'wis', cah: 'MEDICINE'},
  {key: 'nature', name: 'Natureza', ability: 'int', cah: 'NATURE'},
  {key: 'perception', name: 'Percepção', ability: 'wis', cah: 'PERCEPTION'},
  {key: 'performance', name: 'Atuação', ability: 'cha', cah: 'PERFORMANCE'},
  {key: 'persuasion', name: 'Persuasão', ability: 'cha', cah: 'PERSUASION'},
  {key: 'religion', name: 'Religião', ability: 'int', cah: 'RELIGION'},
  {key: 'sleight_of_hand', name: 'Prestidigitação', ability: 'dex', cah: 'SLEIGHT_OF_HAND'},
  {key: 'stealth', name: 'Furtividade', ability: 'dex', cah: 'STEALTH'},
  {key: 'survival', name: 'Sobrevivência', ability: 'wis', cah: 'SURVIVAL'},
];

const ABILITY_BY_CAH = Object.fromEntries(ABILITIES.map((a) => [a.cah, a.key]));
const ABILITY_BY_NAME = Object.fromEntries(ABILITIES.map((a) => [a.name.toLowerCase(), a.key]));
const SKILL_BY_CAH = Object.fromEntries(SKILLS.map((s) => [s.cah, s]));
const ALIGNMENTS = {
  LAWFUL_GOOD: 'Leal e Bom',
  NEUTRAL_GOOD: 'Neutro e Bom',
  CHAOTIC_GOOD: 'Caótico e Bom',
  LAWFUL_NEUTRAL: 'Leal e Neutro',
  TRUE_NEUTRAL: 'Neutro',
  NEUTRAL: 'Neutro',
  CHAOTIC_NEUTRAL: 'Caótico e Neutro',
  LAWFUL_EVIL: 'Leal e Mau',
  NEUTRAL_EVIL: 'Neutro e Mau',
  CHAOTIC_EVIL: 'Caótico e Mau',
};

export function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function abilityMod(score) {
  return Math.floor((num(score, 10) - 10) / 2);
}

export function weightNumber(value) {
  if (typeof value === 'number') return value;
  const raw = String(value || '').toLowerCase().replace(',', '.');
  const match = raw.match(/([\d.]+)\s*(lb|lbs|pound|pounds|oz|ounce|ounces|kg)?/);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  const unit = match[2] || 'lb';
  if (/oz|ounce/.test(unit)) return amount / 16;
  if (unit === 'kg') return amount * 2.20462;
  return amount;
}

export function signed(value) {
  const n = num(value, 0);
  return n >= 0 ? `+${n}` : String(n);
}

export function pbForLevel(level) {
  return 1 + Math.ceil(num(level, 1) / 4);
}

export function parseEmbedded(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value && typeof value === 'object' ? value : null;
}

export function alignmentName(value) {
  return ALIGNMENTS[String(value || '').toUpperCase()] || String(value || '');
}

export function sourceName(source) {
  const map = {
    phb: 'PHB', mm: 'MM', dmg: 'DMG', xge: 'XGE', tce: 'TCE', scag: 'SCAG',
    vgm: 'VGM', mtf: 'MTF', mom: 'MPMM', mpmm: 'MPMM', ftd: 'FTD', vrgr: 'VRGR',
    egw: 'EGW', scc: 'SCC', bgg: 'BGG', aag: 'AAG', ai: 'AI', bmt: 'BMT',
    homebrew: 'Homebrew', ua: 'UA', phb2024: 'PHB 2024', xphb: 'PHB 2024',
  };
  return map[String(source || '').toLowerCase()] || String(source || '').toUpperCase();
}

function featureFromCah(entry, fallbackLevel = 1) {
  if (!entry) return null;
  const feat = entry.feat || entry;
  const name = feat?.name || feat?.feat?.name || '';
  if (!name) return null;
  const models = feat?.descriptionModels || feat?.descriptions || [];
  const descriptions = models
    .map((model) => {
      if (typeof model === 'string') return model;
      return model?.description || model?.text || '';
    })
    .filter(Boolean);
  const levels = models
    .map((model) => model?.level)
    .filter((level) => Number.isFinite(Number(level)))
    .map(Number);
  const level = num(entry.level ?? feat.level ?? (levels.length ? Math.min(...levels) : fallbackLevel), fallbackLevel);
  return {
    name,
    level,
    description: descriptions.join('\n\n'),
    source: feat.source || '',
  };
}

function featureList(entries, maxLevel = 99, fallbackLevel = 1) {
  const out = [];
  const seen = new Set();
  for (const entry of entries || []) {
    const feature = featureFromCah(entry, fallbackLevel);
    if (!feature || feature.level > maxLevel) continue;
    if (!feature.description && / points$/i.test(feature.name)) continue;
    const key = `${feature.name}|${feature.level}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(feature);
  }
  out.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'pt-BR'));
  return out;
}

function classSkillCount(classDef) {
  const groups = Array.isArray(classDef?.skill_proficiencies) ? classDef.skill_proficiencies : [];
  return Math.max(1, groups.length || 2);
}

function classSkillOptions(classDef) {
  const out = [];
  for (const group of classDef?.skill_proficiencies || []) {
    for (const option of group?.stats?.options?.value || group?.options?.value || group?.options || []) {
      if (typeof option === 'string' && !out.includes(option)) out.push(option);
    }
  }
  return out;
}

function classFeatureEntries(classDef, maxLevel) {
  const entries = featureList(classDef?.features, maxLevel);
  for (const archetype of classDef?.archetypes || []) {
    if (archetype?.id !== undefined && archetype?.id === classDef.__selectedArchetypeId) {
      entries.push(...featureList(archetype.features, maxLevel, 3));
    }
  }
  return entries;
}

function collectFeatures({cah, classDefs, level, race, background}) {
  const features = [];
  for (const classDef of classDefs) {
    features.push(...featureList(classDef.features, level));
    if (classDef.__selectedArchetype) {
      features.push(...featureList(classDef.__selectedArchetype.features, level, classDef.__subclassLevel || 3));
    }
    if (classDef.__selectedSubtype) {
      features.push(...featureList(classDef.__selectedSubtype.features, level, 1));
    }
  }
  features.push(...featureList(race?.traits, level));
  features.push(...featureList(background?.features, level));
  features.push(...featureList(cah?.feats, level));
  for (const group of cah?.selectableFeatures || []) {
    features.push(...featureList(group?.selectedFeatures, level));
  }
  const seen = new Set();
  return features
    .filter((feature) => {
      const key = `${feature.name}|${feature.level}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'pt-BR'));
}

function computeSkills(cah, abilities, pb) {
  const rows = Array.isArray(cah?.skills) ? cah.skills : [];
  return SKILLS.map((skill) => {
    const raw = rows.find((row) => String(row?.typeName || '').toUpperCase() === skill.cah) || {};
    const prof = String(raw.proficiencyName || 'NONE').toUpperCase();
    const abilityScore = abilities[skill.ability]?.score ?? 10;
    const abilityModifier = abilityMod(abilityScore);
    const bonus = prof === 'EXPERT' || prof === 'EXPERTISE'
      ? pb * 2
      : prof === 'FULL' || prof === 'PROFICIENT'
        ? pb
        : prof === 'HALF'
          ? Math.floor(pb / 2)
          : 0;
    return {
      ...skill,
      abilityMod: abilityModifier,
      proficiency: prof,
      bonus,
      total: abilityModifier + bonus,
    };
  });
}

function computeArmor(cah, abilities) {
  const armors = Array.isArray(cah?.armors) ? cah.armors : [];
  const dex = abilityMod(abilities.dex?.score ?? 10);
  const body = armors.find((armor) => armor.equipped && !/shield/i.test(String(armor.category || armor.name || '')) && num(armor.armor) > 0);
  const shield = armors.find((armor) => armor.equipped && /shield/i.test(String(armor.category || armor.name || '')));
  let ac = num(cah?.baseAc, 10) + dex;
  if (body) {
    ac = num(body.armor, 10);
    if (/light/i.test(String(body.category))) ac += dex;
    else if (/medium/i.test(String(body.category))) ac += Math.min(dex, 2);
  }
  if (shield) ac += num(shield.armor);
  ac += num(cah?.extraAC);
  return {ac, body, shield, dex};
}

function computeArmorList(armors, dex, base = 10, extra = 0) {
  const body = (armors || []).find((armor) => armor.equipped && !/shield/i.test(String(armor.category || armor.name || '')) && num(armor.ac, num(armor.armor, 0)) > 0);
  const shield = (armors || []).find((armor) => armor.equipped && /shield/i.test(String(armor.category || armor.name || '')));
  let ac = num(base, 10) + dex;
  if (body) {
    ac = num(body.ac, num(body.armor, 10));
    if (/light/i.test(String(body.category))) ac += dex;
    else if (/medium/i.test(String(body.category))) ac += Math.min(dex, 2);
  }
  if (shield) ac += num(shield.ac, num(shield.armor, 0));
  return {ac: ac + num(extra), body, shield, dex};
}

function computeSpeed(cah, race, abilities, armors) {
  const base = num(race?.speed?.normal, 30) + num(cah?.speedModifier);
  const body = (armors || []).find((armor) => armor.equipped && /heavy/i.test(String(armor.category || '')));
  const lacksStrength = body && num(body.strRequired) > num(abilities.str?.score);
  return Math.max(0, base - (lacksStrength ? 10 : 0));
}

function computeWeaponAttack(weapon, abilities, pb) {
  const abilityKey = String(weapon?.attackAbilityName || 'Strength').toLowerCase().startsWith('dex') ? 'dex' : 'str';
  const abilityModifier = abilityMod(abilities[abilityKey]?.score ?? 10);
  const proficient = weapon?.proficient !== false;
  const attack = abilityModifier + (proficient ? pb : 0) + num(weapon?.bonus) + num(weapon?.extraAttackBonus);
  const damageMod = abilityModifier + num(weapon?.extraDamageBonus);
  const damageDie = `${num(weapon?.damageDiceAmount, 1)}${String(weapon?.damageDiceName || 'd4').toLowerCase()}`;
  const damage = `${damageDie}${damageMod ? signed(damageMod) : ''}`;
  const versatile = weapon?.isVersatile
    ? `${num(weapon?.versatileDamageDiceAmount, 1)}${String(weapon?.versatileDamageDie || 'd4').toLowerCase()}${damageMod ? signed(damageMod) : ''}`
    : '';
  return {
    name: weapon?.name || 'Ataque',
    ability: abilityKey,
    abilityMod: abilityModifier,
    proficient,
    attack,
    damage,
    damageType: weapon?.damageTypeName || '',
    versatile,
    properties: weapon?.properties || '',
    range: weapon?.isRanged ? 'à distância' : 'corpo a corpo',
    description: weapon?.description || '',
    weight: weightNumber(weapon?.weight),
  };
}

function computeSpellcasting(classDefs, abilities, pb, cah) {
  const caster = classDefs.find((classDef) => classDef?.spellcastingAbility) || classDefs[0];
  const rawAbility = String(caster?.spellcastingAbility || '').toLowerCase();
  const abilityKey = ABILITY_BY_NAME[rawAbility] || (rawAbility.startsWith('char') ? 'cha' : rawAbility.startsWith('wis') ? 'wis' : rawAbility.startsWith('int') ? 'int' : '');
  const abilityScore = abilityKey ? abilities[abilityKey]?.score : 10;
  const abilityModifier = abilityMod(abilityScore);
  return {
    ability: abilityKey,
    abilityName: abilityKey ? ABILITIES.find((a) => a.key === abilityKey)?.name : '—',
    dc: 8 + pb + abilityModifier + num(cah?.spellDCExtraBonus),
    attack: pb + abilityModifier + num(cah?.spellAttackExtraBonus),
    abilityMod: abilityModifier,
  };
}

function spellSlotArray(slots) {
  const order = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];
  return order.map((key) => num(slots?.[key], 0));
}

function normalizeSpells(spells) {
  return (Array.isArray(spells) ? spells : []).map((spell) => ({
    id: spell.id || spell.name,
    name: spell.name || 'Magia',
    level: num(spell.level, 0),
    school: spell.school || '',
    type: spell.type || '',
    castingTime: spell.castingTime || '',
    range: spell.range || '',
    duration: spell.duration || '',
    components: spell.components || '',
    description: spell.description || '',
    higherLevels: spell.higherLevels || spell.higher_level_description || '',
    prepared: !!spell.prepared,
    ritual: !!spell.isRitual || !!spell.ritual,
    concentration: /concentration/i.test(String(spell.duration || '')),
    classes: spell.classes || '',
  })).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'pt-BR'));
}

function uniqueProficiencies(proficiencies) {
  const groups = {};
  for (const item of proficiencies || []) {
    const type = String(item?.typeName || 'OUTROS').toUpperCase();
    if (!groups[type]) groups[type] = [];
    if (item?.name && !groups[type].includes(item.name)) groups[type].push(item.name);
  }
  return groups;
}

function specialAbilities(cah, features, level) {
  return (Array.isArray(cah?.specialAbilities) ? cah.specialAbilities : []).map((ability) => {
    const amounts = Array.isArray(ability.amountsPerLevel) ? ability.amountsPerLevel : [];
    const matching = amounts.filter((entry) => num(entry.level) <= level);
    const maxUses = matching.length ? num(matching[matching.length - 1].amount) : num(ability.usesLeft);
    const normalizedName = String(ability.name || '').toLowerCase().replace(/ (uses|points)$/, '');
    const feature = features.find((item) => {
      const name = item.name.toLowerCase();
      return name === normalizedName || name.startsWith(normalizedName);
    });
    return {
      id: ability.id || ability.name,
      name: String(ability.name || 'Habilidade').replace(/ (points|uses)$/i, ''),
      usesLeft: num(ability.usesLeft),
      maxUses,
      kind: amounts.length ? 'pool' : 'uses',
      recharge: 'long',
      description: feature?.description || '',
      available: maxUses > 0 || num(ability.usesLeft) > 0,
    };
  }).filter((ability) => ability.available);
}

export function normalizeCah(raw) {
  const cah = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!cah || cah.jsonType !== 'character') {
    throw new Error('Este arquivo não é uma ficha .cah do D&D 5e Companion.');
  }
  const jobs = Array.isArray(cah.jobs) ? cah.jobs : [];
  const classDefs = (cah.allRequiredClasses?.jobs || [])
    .map(parseEmbedded)
    .filter((item) => item && item.id);
  const race = parseEmbedded(cah.requiredRace) || {};
  const background = parseEmbedded(cah.requiredBackground) || {};
  const level = Math.max(1, jobs.reduce((total, job) => total + num(job.level), 0));
  const pb = pbForLevel(level);
  const abilities = {};
  for (const ability of ABILITIES) {
    const rawAbility = cah[ability.cah] || {};
    const score = num(rawAbility.score, 10);
    const save = !!rawAbility.save;
    abilities[ability.key] = {
      ...ability,
      score,
      mod: abilityMod(score),
      save,
      saveMod: abilityMod(score) + (save ? pb : 0) + num(rawAbility.saveModifier),
      saveExtra: num(rawAbility.saveModifier),
    };
  }
  const classes = jobs.map((job) => {
    const def = classDefs.find((item) => item.id === job.jobId) || {};
    const archetype = (def.archetypes || []).find((item) => item.id === job.archetypeId) || null;
    const subtype = (def.subtypes || []).find((item) => item.id === job.subtypeId) || null;
    return {
      id: job.jobId,
      name: def.name || job.jobId || 'Classe',
      level: num(job.level, 1),
      hitDie: def.hitDie || 'd8',
      dice: num(job.dice, num(job.level, 1)),
      subclass: archetype?.name || '',
      subtype: subtype?.name || '',
      def,
      archetype,
      subtypeDef: subtype,
    };
  });
  // Marca as escolhas para a coleta de features.
  for (const cls of classes) {
    cls.def.__selectedArchetype = cls.archetype;
    cls.def.__selectedSubtype = cls.subtypeDef;
    cls.def.__subclassLevel = num(cls.def.subclassSelectionLevel ?? cls.def.archetypeSelectionLevel, 3);
  }
  const features = collectFeatures({
    cah,
    classDefs: classes.map((cls) => cls.def),
    level,
    race,
    background,
  });
  const skills = computeSkills(cah, abilities, pb);
  const perception = skills.find((skill) => skill.key === 'perception');
  const {ac, body, shield} = computeArmor(cah, abilities);
  const speed = computeSpeed(cah, race, abilities, cah.armors || []);
  const spellcasting = computeSpellcasting(classes.map((cls) => cls.def), abilities, pb, cah);
  const weapons = (Array.isArray(cah.weapons) ? cah.weapons : []).map((weapon) => computeWeaponAttack(weapon, abilities, pb));
  const equipment = (Array.isArray(cah.equipment) ? cah.equipment : []).map((item) => ({
    id: item.id || item.name || 'item',
    name: item.name || 'Item',
    amount: num(item.amount, 1),
    equipped: !!item.isEquipped,
    attuned: !!item.isAttuned,
    description: item.description || '',
    weight: weightNumber(item.weight),
  }));
  const hitDice = classes.map((cls) => {
    const die = cls.hitDie || 'd8';
    const max = Math.max(1, num(cls.level));
    const rawDice = num(cls.dice, max);
    return {die, max, current: Math.max(0, Math.min(max, rawDice))};
  });
  const armors = (Array.isArray(cah.armors) ? cah.armors : []).map((armor) => ({
    id: armor.id || armor.name || 'armor',
    name: armor.name || 'Armadura',
    category: armor.category || '',
    ac: num(armor.armor),
    equipped: !!armor.equipped,
    proficient: armor.isProficient !== false,
    requiredStrength: num(armor.strRequired),
    stealthDisadvantage: !!armor.stealthDisadvantage,
    weight: weightNumber(armor.weight),
    cost: armor.cost || '',
  }));
  const notes = (Array.isArray(cah.notes) ? cah.notes : []).map((note) => note.text).filter(Boolean);
  const image = cah.image
    ? cah.image.startsWith('data:')
      ? cah.image
      : cah.image.startsWith('/9j/')
        ? `data:image/jpeg;base64,${cah.image}`
        : cah.image.startsWith('iVBOR')
          ? `data:image/png;base64,${cah.image}`
          : `data:image/jpeg;base64,${cah.image}`
    : '';
  const pact = classes.some((cls) => String(cls.id).toLowerCase() === 'warlock')
    ? spellSlotsFor('warlock', level)
    : null;
  return {
    kind: 'cah',
    id: cah.id || `cah-${Date.now()}`,
    name: cah.name || 'Personagem sem nome',
    player: cah.player || '',
    alignment: alignmentName(cah.alignmentName),
    alignmentRaw: cah.alignmentName || '',
    race: {
      id: race.id || '',
      name: race.name || '—',
      speed: num(race.speed?.normal, 30),
      size: race.size || 'Médio',
      traits: featureList(race.traits, level),
    },
    background: {
      id: background.id || '',
      name: background.name || '—',
      feature: featureList(background.features, level)[0] || null,
    },
    classes,
    classLine: classes.map((cls) => `${cls.name} ${cls.level}`).join(' / ') || '—',
    level,
    pb,
    exp: num(cah.exp),
    abilities,
    skills,
    ac,
    armor: body ? body.name : '',
    shield: shield ? shield.name : '',
    hp: {
      max: num(cah.hp, num(cah.baseHp, 1)),
      current: num(cah.hp, num(cah.baseHp, 1)),
      base: num(cah.baseHp),
      temp: num(cah.tempHp),
      failures: num(cah.failures),
      successes: num(cah.successes),
    },
    speed,
    initiative: abilities.dex.mod + num(cah.initiativeModifier),
    passivePerception: 10 + (perception?.total || 0) + num(cah.passivePerceptionModifier),
    spellcasting,
    spellSlots: pact?.type === 'pact' ? [] : spellSlotArray(cah.spellSlots),
    pactMagic: pact?.type === 'pact' ? {count: pact.count, slotLevel: pact.slotLevel} : null,
    bonusSpellSlots: spellSlotArray(cah.bonusSpellSlots),
    spells: normalizeSpells(cah.spells),
    attacks: weapons,
    equipment,
    armors,
    coins: {
      pp: num(cah.platinum),
      gp: num(cah.gold),
      ep: num(cah.electrum),
      sp: num(cah.silver),
      cp: num(cah.copper),
    },
    features,
    specialAbilities: specialAbilities(cah, features, level),
    hitDice,
    proficiencies: uniqueProficiencies(cah.proficiencies),
    notes,
    about: cah.about || '',
    personality: cah.personalityTraits || '',
    ideals: cah.ideals || '',
    bonds: cah.bonds || '',
    flaws: cah.flaws || '',
    conditions: Object.keys(cah.conditions || {}).map((key) => String(key)),
    advantages: (cah.advantages || []).map((item) => typeof item === 'string' ? item : item?.name || JSON.stringify(item)),
    disadvantages: (cah.disadvantages || []).map((item) => typeof item === 'string' ? item : item?.name || JSON.stringify(item)),
    inspiration: !!cah.hasInspiration,
    image,
    createdAt: cah.created || '',
    updatedAt: cah.updated || '',
    raw: cah,
  };
}

// ---------------------------------------------------------------------------
// Fichas nativas do Atlas (criador provisório / passagem de nível)
// ---------------------------------------------------------------------------

export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

export function levelForXp(xp) {
  const value = num(xp, 0);
  let level = 1;
  for (let index = 1; index < XP_THRESHOLDS.length; index += 1) {
    if (value >= XP_THRESHOLDS[index]) level = index + 1;
  }
  return Math.min(20, level);
}

export function xpForLevel(level) {
  return XP_THRESHOLDS[Math.max(0, Math.min(19, num(level, 1) - 1))] ?? 0;
}

export const FULL_CASTER_SLOTS = [
  [], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

export const HALF_CASTER_SLOTS = [
  [], [], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
  [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2],
  [4, 3, 3, 2, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
];

export const WARLOCK_SLOTS = [
  [], [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
  [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
];

export function spellSlotsFor(classId, level) {
  const id = String(classId || '').toLowerCase();
  const lvl = Math.max(1, Math.min(20, num(level, 1)));
  if (id === 'warlock') {
    const [count, slotLevel] = WARLOCK_SLOTS[lvl] || [0, 0];
    return {type: 'pact', count, slotLevel, slots: []};
  }
  if (['paladin', 'ranger'].includes(id)) {
    return {type: 'half', count: 0, slotLevel: 0, slots: HALF_CASTER_SLOTS[lvl] || []};
  }
  if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard', 'artificer'].includes(id)) {
    return {type: 'full', count: 0, slotLevel: 0, slots: FULL_CASTER_SLOTS[lvl] || []};
  }
  return {type: 'none', count: 0, slotLevel: 0, slots: []};
}

const FULL_CASTER_IDS = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'wizard']);
const HALF_CASTER_IDS = new Set(['paladin', 'ranger']);

export function baseClassId(value) {
  return String(value || '').toLowerCase().split('__')[0];
}

export function multiclassSpellSlots(entries) {
  let casterLevel = 0;
  let pact = null;
  for (const entry of entries || []) {
    const id = baseClassId(entry.class?.id || entry.id);
    const level = Math.max(1, num(entry.level, 1));
    if (FULL_CASTER_IDS.has(id) || id === 'artificer') casterLevel += level;
    else if (HALF_CASTER_IDS.has(id)) casterLevel += Math.floor(level / 2);
    else if (id === 'warlock') pact = spellSlotsFor('warlock', level);
  }
  const slots = casterLevel > 0 ? (spellSlotsFor('wizard', Math.min(20, casterLevel)).slots || []) : [];
  return {casterLevel, slots, pactMagic: pact};
}

export function normalizeNative(native) {
  const n = native || {};
  const rawClasses = Array.isArray(n.classes) && n.classes.length ? n.classes : [{class: n.class, level: n.level, subclass: n.subclass}];
  const classEntries = rawClasses.map((entry, index) => {
    const classDef = entry.class || entry.def || (entry.id ? entry : null) || n.class || {};
    return {
      class: classDef,
      level: Math.max(1, num(entry.level, index === 0 ? n.level : 1)),
      subclass: entry.subclass || (index === 0 ? n.subclass : null),
    };
  }).filter((entry) => entry.class && (entry.class.id || entry.class.name));
  if (!classEntries.length) classEntries.push({class: n.class || {}, level: Math.max(1, num(n.level, 1)), subclass: n.subclass || null});
  const level = Math.max(1, Math.min(20, classEntries.reduce((sum, entry) => sum + num(entry.level, 1), 0)));
  const primaryEntry = [...classEntries].sort((a, b) => num(b.level) - num(a.level))[0];
  const pb = pbForLevel(level);
  const abilities = {};
  for (const ability of ABILITIES) {
    const score = num(n.abilities?.[ability.key], 10);
    const save = (n.saves || []).includes(ability.key);
    abilities[ability.key] = {
      ...ability,
      score,
      mod: abilityMod(score),
      save,
      saveMod: abilityMod(score) + (save ? pb : 0),
      saveExtra: 0,
    };
  }
  const skills = SKILLS.map((skill) => {
    const prof = String(n.skills?.[skill.key] || 'NONE').toUpperCase();
    const abilityModifier = abilityMod(abilities[skill.ability].score);
    const bonus = prof === 'EXPERT' ? pb * 2 : prof === 'FULL' ? pb : prof === 'HALF' ? Math.floor(pb / 2) : 0;
    return {...skill, abilityMod: abilityModifier, proficiency: prof, bonus, total: abilityModifier + bonus};
  });
  const perception = skills.find((skill) => skill.key === 'perception');
  const features = [];
  const seen = new Set();
  const pushFeature = (feature) => {
    if (!feature || feature.level > level) return;
    if (!feature.description && / points$/i.test(feature.name)) return;
    const key = `${feature.name}|${feature.level}`;
    if (seen.has(key)) return;
    seen.add(key);
    features.push(feature);
  };
  for (const entry of classEntries) {
    for (const feature of entry.class?.features || []) {
      if (num(feature.level, 1) <= num(entry.level, 1)) pushFeature(feature);
    }
    for (const feature of entry.subclass?.features || []) {
      if (num(feature.level, 1) <= num(entry.level, 1)) pushFeature(feature);
    }
  }
  for (const feature of n.race?.traits || []) pushFeature(feature);
  for (const feature of n.background?.features || []) pushFeature(feature);
  features.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'pt-BR'));
  const casterEntry = classEntries.find((entry) => entry.class?.spellcastingAbility) || primaryEntry;
  const spellcastingAbility = String(casterEntry.class?.spellcastingAbility || '').toLowerCase();
  const abilityKey = ABILITY_BY_NAME[spellcastingAbility] || (spellcastingAbility.startsWith('char') ? 'cha' : spellcastingAbility.startsWith('wis') ? 'wis' : spellcastingAbility.startsWith('int') ? 'int' : '');
  const abilityModifier = abilityMod(abilityKey ? abilities[abilityKey].score : 10);
  const multiclass = classEntries.length > 1;
  const slots = multiclass
    ? multiclassSpellSlots(classEntries)
    : spellSlotsFor(casterEntry.class?.id, casterEntry.level);
  const pactMagic = multiclass
    ? slots.pactMagic
    : (slots.type === 'pact' ? {count: slots.count, slotLevel: slots.slotLevel} : null);
  const image = n.image || '';
  const nativeArmors = (n.armors || []).map((armor, index) => ({
    id: armor.id || `armor-${index}`,
    name: armor.name || 'Armadura',
    category: armor.category || '',
    ac: num(armor.ac, num(armor.armor, 10)),
    equipped: !!armor.equipped,
    proficient: armor.proficient !== false,
    requiredStrength: num(armor.requiredStrength),
    stealthDisadvantage: !!armor.stealthDisadvantage,
    weight: weightNumber(armor.weight),
    cost: armor.cost || '',
  }));
  const nativeArmor = computeArmorList(nativeArmors, abilities.dex.mod, 10, n.extraAC || 0);
  const heavyArmor = nativeArmors.find((armor) => armor.equipped && /heavy/i.test(String(armor.category)) && num(armor.requiredStrength) > abilities.str.score);
  const nativeSpeed = Math.max(0, num(n.race?.speed, 30) - (heavyArmor ? 10 : 0));
  const nativeWeapons = [
    ...(n.attacks || []).map((attack) => ({...attack, weight: weightNumber(attack.weight)})),
    ...(n.weapons || []).map((weapon) => computeWeaponAttack(weapon, abilities, pb)),
  ];
  return {
    kind: 'atlas',
    id: n.id || `atlas-${Date.now()}`,
    name: n.name || 'Personagem sem nome',
    player: n.player || '',
    alignment: alignmentName(n.alignment),
    alignmentRaw: n.alignment || '',
    race: {
      id: n.race?.id || '',
      name: n.race?.name || '—',
      speed: num(n.race?.speed, 30),
      size: n.race?.size || 'Médio',
      traits: n.race?.traits || [],
    },
    background: {
      id: n.background?.id || '',
      name: n.background?.name || '—',
      feature: (n.background?.features || [])[0] || null,
    },
    classes: classEntries.map((entry) => ({
      id: entry.class?.id || '',
      name: entry.class?.name || 'Classe',
      level: num(entry.level, 1),
      hitDie: entry.class?.hitDie || 'd8',
      dice: num(entry.level, 1),
      subclass: entry.subclass?.name || '',
      subtype: '',
      def: entry.class,
      subclassDef: entry.subclass,
    })),
    multiclass,
    classLine: classEntries.map((entry) => `${entry.class?.name || 'Classe'} ${num(entry.level, 1)}`).join(' / '),
    level,
    pb,
    exp: num(n.exp),
    abilities,
    skills,
    ac: nativeArmors.some((armor) => armor.equipped) ? nativeArmor.ac : num(n.ac, nativeArmor.ac),
    armor: nativeArmor.body?.name || '',
    shield: nativeArmor.shield?.name || '',
    hp: {
      max: num(n.maxHp, num(n.hp, 1)),
      current: num(n.hp, num(n.maxHp, 1)),
      base: num(n.maxHp, num(n.hp, 1)),
      temp: num(n.tempHp),
      failures: 0,
      successes: 0,
    },
    speed: nativeSpeed,
    initiative: abilities.dex.mod,
    passivePerception: 10 + (perception?.total || 0),
    spellcasting: {
      ability: abilityKey,
      abilityName: abilityKey ? ABILITIES.find((a) => a.key === abilityKey)?.name : '—',
      dc: 8 + pb + abilityModifier,
      attack: pb + abilityModifier,
      abilityMod: abilityModifier,
    },
    hitDice: classEntries.map((entry) => ({die: entry.class?.hitDie || 'd8', max: num(entry.level, 1), current: num(entry.level, 1)})),
    spellSlots: slots.slots || [],
    bonusSpellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    pactMagic,
    spells: normalizeSpells(n.spells),
    attacks: nativeWeapons,
    armors: nativeArmors,
    equipment: (n.equipment || []).map((item, index) => ({
      id: item.id || `item-${index}`,
      name: item.name || 'Item',
      amount: num(item.amount, 1),
      equipped: !!item.equipped,
      attuned: !!item.attuned,
      description: item.description || '',
      weight: weightNumber(item.weight),
    })),
    armors: (n.armors || []).map((armor, index) => ({
      id: armor.id || `armor-${index}`,
      name: armor.name || 'Armadura',
      category: armor.category || '',
      ac: num(armor.ac, num(armor.armor, 10)),
      equipped: !!armor.equipped,
      proficient: armor.proficient !== false,
      requiredStrength: num(armor.requiredStrength),
      stealthDisadvantage: !!armor.stealthDisadvantage,
      weight: weightNumber(armor.weight),
      cost: armor.cost || '',
    })),
    coins: n.coins || {pp: 0, gp: 0, ep: 0, sp: 0, cp: 0},
    features,
    specialAbilities: [],
    proficiencies: n.proficiencies || {},
    notes: n.notes || [],
    about: n.about || '',
    personality: n.personality || '',
    ideals: n.ideals || '',
    bonds: n.bonds || '',
    flaws: n.flaws || '',
    conditions: n.conditions || [],
    advantages: n.advantages || [],
    disadvantages: n.disadvantages || [],
    inspiration: !!n.inspiration,
    image,
    createdAt: n.createdAt || '',
    updatedAt: n.updatedAt || '',
    native: n,
  };
}

export function levelUpCah(raw, options = {}) {
  const cah = structuredClone(raw);
  const jobs = Array.isArray(cah.jobs) ? cah.jobs : [];
  if (!jobs.length) throw new Error('A ficha não tem uma classe para subir de nível.');
  const totalLevel = jobs.reduce((total, job) => total + num(job.level), 0);
  if (totalLevel >= 20) throw new Error('Nível máximo (20) atingido.');
  const job = jobs.find((candidate) => String(candidate.jobId) === String(options.classId)) || jobs[0];
  const classDefs = (cah.allRequiredClasses?.jobs || []).map(parseEmbedded).filter(Boolean);
  const classDef = classDefs.find((item) => item.id === job.jobId) || {};
  const hitDie = classDef.hitDie || 'd8';
  const sides = Number(String(hitDie).replace(/[^0-9]/g, '')) || 8;
  const conKey = 'constitution';
  const conBefore = abilityMod(cah[conKey]?.score ?? 10);
  const gain = options.hpGain != null ? Math.max(1, num(options.hpGain)) : Math.floor(sides / 2) + 1 + conBefore;
  const baseGain = Math.max(1, gain - conBefore);
  const currentBase = cah.baseHp != null ? num(cah.baseHp) : Math.max(1, num(cah.hp) - conBefore * totalLevel);
  cah.baseHp = currentBase + baseGain;
  for (const [ability, amount] of Object.entries(options.abilityChoices || {})) {
    const source = ABILITIES.find((item) => item.key === ability);
    if (!source || !cah[source.cah]) continue;
    cah[source.cah].score = Math.min(20, num(cah[source.cah].score, 10) + num(amount));
  }
  const conAfter = abilityMod(cah[conKey]?.score ?? 10);
  const nextLevel = totalLevel + 1;
  cah.hp = Math.max(1, num(cah.baseHp) + conAfter * nextLevel);
  job.level = num(job.level, 1) + 1;
  const entries = jobs.map((candidate) => ({
    class: classDefs.find((item) => item.id === candidate.jobId) || {id: candidate.jobId},
    level: num(candidate.level, 1),
  }));
  const slots = entries.length > 1
    ? multiclassSpellSlots(entries)
    : spellSlotsFor(job.jobId, num(job.level, 1));
  if (entries.length > 1 || slots.type !== 'none') {
    const names = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];
    cah.spellSlots = Object.fromEntries(names.map((name, index) => [name, (slots.slots || [])[index] || 0]));
  }
  if (options.xp != null) cah.exp = num(options.xp);
  cah.updated = new Date().toISOString();
  return cah;
}

export function averageHpGain(hitDie, conMod) {
  const sides = Number(String(hitDie || 'd8').replace(/[^0-9]/g, '')) || 8;
  return Math.max(1, Math.floor(sides / 2) + 1 + num(conMod));
}

export function isAsiLevel(level) {
  return [4, 8, 12, 16, 19].includes(num(level));
}

export function levelUpNative(native, options = {}) {
  const n = structuredClone(native);
  const entries = Array.isArray(n.classes) && n.classes.length
    ? n.classes
    : [{class: n.class, level: Math.max(1, num(n.level, 1)), subclass: n.subclass || null}];
  const targetId = baseClassId(options.classId || entries[0]?.class?.id);
  let entry = entries.find((candidate) => baseClassId(candidate.class?.id) === targetId);
  if (!entry && options.classDef) {
    entry = {class: options.classDef, level: 0, subclass: options.subclass || null};
    entries.push(entry);
  }
  if (!entry) entry = entries[0];
  if (!entry) throw new Error('A ficha não tem uma classe para subir de nível.');
  const currentLevel = Math.max(1, entries.reduce((sum, candidate) => sum + num(candidate.level, 1), 0));
  if (currentLevel >= 20) throw new Error('Nível máximo (20) atingido.');
  const conMod = abilityMod(n.abilities?.con ?? 10);
  const hitDie = entry.class?.hitDie || 'd8';
  const gain = options.hpGain != null ? Math.max(1, num(options.hpGain)) : averageHpGain(hitDie, conMod);
  entry.level = num(entry.level, 0) + 1;
  if (options.subclass) entry.subclass = options.subclass;
  const nextLevel = currentLevel + 1;
  n.level = nextLevel;
  n.maxHp = num(n.maxHp, num(n.hp, 1)) + gain;
  n.hp = n.maxHp;
  n.pb = pbForLevel(nextLevel);
  if (options.abilityChoices) {
    for (const [key, amount] of Object.entries(options.abilityChoices)) {
      if (key in (n.abilities || {})) n.abilities[key] = Math.min(20, num(n.abilities[key], 10) + num(amount));
    }
  }
  const newConMod = abilityMod(n.abilities?.con ?? 10);
  if (newConMod !== conMod) {
    n.maxHp = Math.max(1, n.maxHp + (newConMod - conMod) * nextLevel);
    n.hp = n.maxHp;
  }
  n.classes = entries;
  n.class = entries[0]?.class || null;
  n.subclass = entries[0]?.subclass || null;
  n.updatedAt = new Date().toISOString();
  return n;
}

const SAVE_KEYS = {
  strength: 'str', dexterity: 'dex', constitution: 'con',
  intelligence: 'int', wisdom: 'wis', charisma: 'cha',
  str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha',
};

export function makeNativeCharacter(fields) {
  const level = Math.max(1, Math.min(20, num(fields.level, 1)));
  const abilities = {};
  for (const ability of ABILITIES) abilities[ability.key] = Math.max(3, Math.min(20, num(fields.abilities?.[ability.key], 10)));
  const conMod = abilityMod(abilities.con);
  const hitDie = fields.class?.hitDie || 'd8';
  const sides = Number(String(hitDie).replace(/[^0-9]/g, '')) || 8;
  const maxHp = Math.max(1, sides + conMod);
  const dexMod = abilityMod(abilities.dex);
  const now = new Date().toISOString();
  return {
    schema: 'silvengard-character-v1',
    id: crypto.randomUUID(),
    name: String(fields.name || 'Aventureiro').slice(0, 100),
    player: String(fields.player || '').slice(0, 100),
    alignment: fields.alignment || 'TRUE_NEUTRAL',
    race: fields.race || null,
    class: fields.class || null,
    classes: fields.classes || (fields.class ? [{class: fields.class, level, subclass: fields.subclass || null}] : []),
    subclass: fields.subclass || null,
    background: fields.background || null,
    level,
    abilities,
    skills: fields.skills || {},
    saves: (fields.class?.savingThrows || []).map((save) => SAVE_KEYS[String(save).toLowerCase()] || save),
    hp: maxHp,
    maxHp,
    ac: 10 + dexMod,
    speed: num(fields.race?.speed, 30),
    spells: fields.spells || [],
    attacks: fields.attacks || [],
    weapons: fields.weapons || [],
    armors: fields.armors || [],
    equipment: fields.equipment || [],
    proficiencies: fields.proficiencies || {},
    coins: {pp: 0, gp: 0, ep: 0, sp: 0, cp: 0},
    notes: fields.notes || [],
    image: fields.image || '',
    createdAt: now,
    updatedAt: now,
  };
}
