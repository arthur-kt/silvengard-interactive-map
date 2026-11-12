#!/usr/bin/env python3
"""Gera o pacote de consulta de D&D 5e do Atlas a partir do repositório
rpg-companion-app-systems (somente systems/5e).

Uso:
    python desenvolvimento/ferramentas/gerar-dados-5e.py \
        --repo .tmp/rpg-systems \
        --out app/dist/5e

O pacote é dado de terceiros (CC BY-NC + conteúdo da WotC). Não é código MIT
do Atlas; veja documentos/Analise-Integracao-RPG-Companion.md.
"""
from __future__ import annotations

import argparse
import json
import re
import statistics
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# utilidades de leitura do formato .rpg.json
# ---------------------------------------------------------------------------

def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def unwrap(value):
    """Achata os envelopes {value: ...} e {resource_id, stats: ...} do app."""
    if isinstance(value, list):
        return [unwrap(v) for v in value]
    if isinstance(value, dict):
        if "stats" in value and "resource_id" in value:
            out = {"_type": value["resource_id"]}
            for key, item in value["stats"].items():
                out[key] = unwrap(item)
            return out
        if "value" in value and "stats" not in value:
            return unwrap(value["value"])
        return {
            key: unwrap(item)
            for key, item in value.items()
            if key not in {"updated_at", "id"}
        }
    return value


def as_list(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def text(value, default=""):
    return value if isinstance(value, str) and value.strip() else default


def title_case(value):
    if not value:
        return ""
    return " ".join(part.capitalize() for part in str(value).replace("_", " ").split())


def level_from_id(value, prefix="spell_level_"):
    if not isinstance(value, str):
        return None
    if value.startswith(prefix):
        try:
            return int(value[len(prefix):])
        except ValueError:
            return None
    return None


def cr_from_id(value):
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None
    raw = value.removeprefix("cr_")
    if raw in {"1_8", "1_4", "1_2", "3_4"}:
        a, b = raw.split("_")
        return int(a) / int(b)
    try:
        return float(raw)
    except ValueError:
        return None


def cost_of(value):
    if not isinstance(value, dict):
        return None
    amount = value.get("value")
    unit = value.get("unit") or ""
    if amount is None:
        return None
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return str(amount)
    if amount.is_integer():
        amount = int(amount)
    label = {"gold": "po", "silver": "pp", "copper": "pc", "platinum": "pl", "electrum": "pe"}.get(unit, unit)
    return f"{amount} {label}".strip()


def weight_of(value):
    if not isinstance(value, dict):
        return None
    amount = value.get("value")
    unit = value.get("unit") or ""
    if amount is None:
        return None
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return str(amount)
    if amount.is_integer():
        amount = int(amount)
    return f"{amount} {unit}".strip()


def dice_text(dice):
    """Recebe o resultado de unwrap() em damage_dice/dice_roll."""
    if not isinstance(dice, dict):
        return ""
    amount = dice.get("dice_amount")
    kind = dice.get("dice_type")
    constant = dice.get("constant")
    if amount is None or not kind:
        return ""
    out = f"{int(amount)}{kind}"
    if constant:
        out += f" {int(constant):+d}"
    return out


def damage_text(damage_dice):
    entries = []
    for item in as_list(damage_dice):
        if not isinstance(item, dict):
            continue
        dices = " + ".join(filter(None, (dice_text(d) for d in as_list(item.get("dices")))))
        dtype = title_case(item.get("damage_type") or "")
        if dices:
            entries.append(f"{dices} {dtype}".strip())
    return ", ".join(entries)


def feature_summary(feature, default_level=1):
    """Converte um recurso feat (classe, raça, antecedente) em algo simples."""
    data = feature
    if isinstance(data, dict) and "stats" in data:
        data = unwrap(data)
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    descriptions = []
    levels = []
    for desc in as_list(data.get("descriptions")):
        if isinstance(desc, dict):
            body = text(desc.get("description"))
            level = desc.get("level")
            if isinstance(level, int):
                levels.append(level)
            if body:
                descriptions.append((level, body))
    wrapper_level = data.get("level")
    if isinstance(wrapper_level, int):
        levels.append(wrapper_level)
    level = min(levels) if levels else default_level
    if len(descriptions) == 1:
        description = descriptions[0][1]
    elif descriptions:
        description = "\n\n".join(
            (f"[Nível {lvl}] {body}" if isinstance(lvl, int) else body)
            for lvl, body in descriptions
        )
    else:
        description = ""
    return {
        "name": name,
        "level": level,
        "description": description,
        "source": text(data.get("source")),
    }


def features_of(items, default_level=1):
    out = []
    seen = set()
    for item in as_list(items):
        summary = feature_summary(item, default_level=default_level)
        if not summary or not summary["description"]:
            continue
        key = (summary["name"], summary["level"])
        if key in seen:
            continue
        seen.add(key)
        out.append(summary)
    out.sort(key=lambda f: (f["level"], f["name"]))
    return out


def proficiency_options(items):
    options = []
    for item in as_list(items):
        if isinstance(item, dict) and "stats" in item:
            item = unwrap(item)
        if not isinstance(item, dict):
            continue
        for option in as_list(item.get("options")):
            if isinstance(option, str) and option not in options:
                options.append(option)
    return options


def choice_texts(items):
    options = []
    for item in as_list(items):
        if isinstance(item, dict) and "stats" in item:
            item = unwrap(item)
        if not isinstance(item, dict):
            continue
        value = item.get("options")
        if isinstance(value, str) and value not in options:
            options.append(value)
        elif isinstance(value, list):
            for option in value:
                if isinstance(option, str) and option not in options:
                    options.append(option)
    return options


# ---------------------------------------------------------------------------
# normalizadores por tipo
# ---------------------------------------------------------------------------

CLASS_FALLBACK_HIT_DIE = {
    "barbarian": "d12", "fighter": "d10", "paladin": "d10", "ranger": "d10",
    "bard": "d8", "cleric": "d8", "druid": "d8", "monk": "d8", "rogue": "d8", "warlock": "d8",
    "sorcerer": "d6", "wizard": "d6", "artificer": "d8",
}
CLASS_FALLBACK_CASTER = {
    "bard": "charisma", "cleric": "wisdom", "druid": "wisdom", "sorcerer": "charisma",
    "warlock": "charisma", "wizard": "intelligence", "paladin": "charisma", "ranger": "wisdom",
    "artificer": "intelligence",
}
CLASS_SUBCLASS_LEVEL = {
    "cleric": 1, "sorcerer": 1, "warlock": 1, "druid": 2, "wizard": 2,
}


def class_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    cid = text(data.get("id"), name.lower().replace(" ", "_"))
    saving = []
    for key, value in data.items():
        if key.endswith("_saving_throw_proficiency") and value is True:
            ability = key.removesuffix("_saving_throw_proficiency")
            saving.append(ability)
    skills = proficiency_options(data.get("skill_proficiencies"))
    skill_count = len(as_list(data.get("skill_proficiencies")))
    armor = proficiency_options(data.get("armor_proficiencies"))
    weapons = proficiency_options(data.get("weapon_proficiencies"))
    features = features_of(data.get("features"))
    subclasses = []
    for ark in as_list(data.get("archetypes")):
        if isinstance(ark, dict) and "stats" in ark:
            ark = unwrap(ark)
        if not isinstance(ark, dict):
            continue
        sub_name = text(ark.get("name"))
        if not sub_name:
            continue
        subclasses.append({
            "id": text(ark.get("id"), sub_name.lower().replace(" ", "_")),
            "name": sub_name,
            "source": text(ark.get("source")),
            "features": features_of(ark.get("features")),
        })
    subclasses.sort(key=lambda x: x["name"])
    subclass_level = data.get("archetype_selection_level")
    if not isinstance(subclass_level, int):
        subclass_level = CLASS_SUBCLASS_LEVEL.get(cid.lower(), 3)
    return {
        "id": cid,
        "name": name,
        "source": text(data.get("source")),
        "hitDie": text(data.get("hit_die"), CLASS_FALLBACK_HIT_DIE.get(cid.lower(), "d8")),
        "savingThrows": saving,
        "spellcastingAbility": text(data.get("spellcasting_ability"), CLASS_FALLBACK_CASTER.get(cid.lower(), "")),
        "skillOptions": skills,
        "skillCount": skill_count or (2 if skills else 0),
        "armorProficiencies": armor,
        "weaponProficiencies": weapons,
        "features": features,
        "subclasses": subclasses,
        "subclassLevel": subclass_level,
    }


def ability_increases(items):
    out = []
    for item in as_list(items):
        if isinstance(item, dict) and "stats" in item:
            item = unwrap(item)
        if not isinstance(item, dict):
            continue
        amount = item.get("value", 1)
        try:
            amount = int(amount)
        except (TypeError, ValueError):
            amount = 1
        options = [str(x) for x in as_list(item.get("modifier_options")) if isinstance(x, str)]
        if not options:
            continue
        if len(options) == 1:
            out.append({"ability": options[0], "amount": amount})
        else:
            out.append({"choose": options, "amount": amount})
    return out


def race_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    rid = text(data.get("id"), name.lower().replace(" ", "_"))
    speed = data.get("speed", 30)
    if not isinstance(speed, (int, float)):
        speed = 30
    subraces = []
    for sub in as_list(data.get("subraces")):
        if isinstance(sub, dict) and "stats" in sub:
            sub = unwrap(sub)
        if not isinstance(sub, dict):
            continue
        sub_name = text(sub.get("name"))
        if not sub_name:
            continue
        sub_speed = sub.get("speed", speed)
        if not isinstance(sub_speed, (int, float)):
            sub_speed = speed
        subraces.append({
            "id": text(sub.get("id"), sub_name.lower().replace(" ", "_")),
            "name": sub_name,
            "source": text(sub.get("source")),
            "speed": int(sub_speed),
            "abilityIncreases": ability_increases(sub.get("ability_score_increases")),
            "traits": features_of(sub.get("traits")),
        })
    subraces.sort(key=lambda x: x["name"])
    return {
        "id": rid,
        "name": name,
        "source": text(data.get("source")),
        "speed": int(speed),
        "abilityIncreases": ability_increases(data.get("ability_score_increases")),
        "traits": features_of(data.get("traits")),
        "languages": choice_texts(data.get("language_proficiencies")),
        "skillProficiencies": proficiency_options(data.get("skill_proficiencies")),
        "subraces": subraces,
    }


def background_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    equipment = []
    for group in as_list(data.get("selectable_equipments")):
        if isinstance(group, dict) and "stats" in group:
            group = unwrap(group)
        if not isinstance(group, dict):
            continue
        for option in as_list(group.get("options")):
            if not isinstance(option, dict):
                continue
            item = option.get("item")
            if isinstance(item, dict):
                item = unwrap(item)
            if isinstance(item, dict):
                label = text(item.get("name"))
                amount = option.get("amount", 1)
                if label:
                    equipment.append(f"{amount}× {label}" if amount != 1 else label)
    return {
        "id": text(data.get("id"), name.lower().replace(" ", "_")),
        "name": name,
        "source": text(data.get("source")),
        "skills": proficiency_options(data.get("skill_proficiencies")),
        "tools": choice_texts(data.get("tool_proficiencies")),
        "languages": choice_texts(data.get("language_proficiencies")),
        "features": features_of(data.get("features")),
        "equipment": equipment,
        "gold": data.get("gold_pieces", 0),
    }


def spell_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    level = level_from_id(data.get("level"))
    school = title_case(str(data.get("school", "")).removeprefix("spell_school_"))
    components = []
    if data.get("verbal"):
        components.append("V")
    if data.get("somatic"):
        components.append("S")
    if data.get("material"):
        components.append("M")
    material = text(data.get("components"))
    components_text = ", ".join(components)
    if material:
        components_text += f" ({material})"
    classes = [str(x) for x in as_list(data.get("classes")) if isinstance(x, str)]
    damage = []
    for die in as_list(data.get("dice")):
        if isinstance(die, dict) and "stats" in die:
            die = unwrap(die)
        if not isinstance(die, dict):
            continue
        for dmg in as_list(die.get("damage_dice")):
            if isinstance(dmg, dict) and "stats" in dmg:
                dmg = unwrap(dmg)
            label = damage_text(dmg)
            if label and label not in damage:
                damage.append(label)
    description = text(data.get("description"))
    save = None
    match = re.search(r"make a ([A-Za-z]+) saving throw", description, re.IGNORECASE)
    if match:
        save = match.group(1).capitalize()
    return {
        "id": text(data.get("id"), name.lower().replace(" ", "_")),
        "name": name,
        "source": text(data.get("source")),
        "level": level,
        "school": school,
        "castingTime": text(data.get("casting_time")),
        "range": text(data.get("range")),
        "duration": text(data.get("duration")),
        "components": components_text,
        "ritual": bool(data.get("ritual") or data.get("is_ritual")),
        "concentration": "concentration" in text(data.get("duration")).lower(),
        "description": description,
        "higherLevels": text(data.get("higher_level_description")),
        "classes": classes,
        "damage": damage,
        "save": save,
    }


def monster_actions(items):
    out = []
    for action in as_list(items):
        if isinstance(action, dict) and "stats" in action:
            action = unwrap(action)
        if isinstance(action, dict):
            out.append({
                "name": text(action.get("action_name")),
                "description": text(action.get("action_description")),
                "type": text(action.get("action_type")),
                "attackBonus": action.get("action_attack_bonus"),
            })
    return out


def monster_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    hp_value = data.get("hit_points")
    hp = None
    hp_formula = ""
    if isinstance(hp_value, (int, float)):
        hp = int(hp_value)
    elif isinstance(hp_value, dict):
        amount = hp_value.get("dice_amount")
        kind = hp_value.get("dice_type")
        constant = hp_value.get("constant") or 0
        if isinstance(amount, (int, float)) and isinstance(kind, str) and kind.startswith("d"):
            sides = int(kind[1:]) if kind[1:].isdigit() else 0
            if sides:
                hp = int(amount * (sides + 1) / 2 + constant)
                hp_formula = f"{int(amount)}{kind}"
                if constant:
                    hp_formula += f" {int(constant):+d}"
    cr = cr_from_id(data.get("cr"))
    traits = []
    for trait in as_list(data.get("traits")):
        if isinstance(trait, dict) and "stats" in trait:
            trait = unwrap(trait)
        if isinstance(trait, dict):
            traits.append({
                "name": text(trait.get("trait_name")),
                "description": text(trait.get("trait_description")),
            })
    actions = monster_actions(data.get("actions"))
    bonus_actions = monster_actions(data.get("bonus_actions"))
    reactions = monster_actions(data.get("reactions"))
    legendary_actions = monster_actions(data.get("legendary_actions"))
    saving_throws = {}
    for key, value in data.items():
        if key.endswith("_saving_throw_modifier"):
            ability = key.removesuffix("_saving_throw_modifier")
            if value:
                saving_throws[ability] = value
    spells = []
    for spell in as_list(data.get("spells")):
        if isinstance(spell, dict) and "stats" in spell:
            spell = unwrap(spell)
        if isinstance(spell, dict):
            spells.append(text(spell.get("name")))
    return {
        "id": text(data.get("id"), name.lower().replace(" ", "_")),
        "name": name,
        "source": text(data.get("source")),
        "cr": cr,
        "xp": data.get("xp"),
        "ac": data.get("armor_class"),
        "hp": hp,
        "hpFormula": hp_formula,
        "speed": data.get("speed"),
        "initiative": data.get("initiative"),
        "abilities": {
            "str": data.get("strength_score"),
            "dex": data.get("dexterity_score"),
            "con": data.get("constitution_score"),
            "int": data.get("intelligence_score"),
            "wis": data.get("wisdom_score"),
            "cha": data.get("charisma_score"),
        },
        "skills": text(data.get("skills")),
        "senses": text(data.get("senses")),
        "languages": text(data.get("languages")),
        "size": title_case(data.get("size")),
        "type": title_case(data.get("type")),
        "alignment": title_case(data.get("alignment")),
        "tag": text(data.get("tag")),
        "savingThrows": saving_throws,
        "vulnerabilities": text(data.get("vulnerabilities")),
        "resistances": text(data.get("resistances")),
        "immunities": text(data.get("immunities")),
        "traits": traits,
        "actions": actions,
        "bonusActions": bonus_actions,
        "reactions": reactions,
        "legendaryActions": legendary_actions,
        "spells": [s for s in spells if s],
        "habitat": as_list(data.get("habitat")),
    }


def item_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    return {
        "id": text(data.get("id"), name.lower().replace(" ", "_")),
        "name": name,
        "source": text(data.get("source")),
        "type": title_case(data.get("type")),
        "rarity": title_case(data.get("rarity")),
        "cost": cost_of(data.get("cost")),
        "weight": weight_of(data.get("weight")),
        "description": text(data.get("description")),
        "magic": bool(data.get("is_magic")),
        "attunement": bool(data.get("requires_attunement")),
        "cursed": bool(data.get("is_cursed")),
    }


def weapon_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    return {
        "id": text(data.get("id"), name.lower().replace(" ", "_")),
        "name": name,
        "source": text(data.get("source")),
        "type": title_case(data.get("type")),
        "simple": bool(data.get("is_simple")),
        "damage": damage_text(data.get("damage_dice")),
        "versatileDamage": damage_text(data.get("versatile_damage_dice")),
        "cost": cost_of(data.get("cost")),
        "weight": weight_of(data.get("weight")),
        "rarity": title_case(data.get("rarity")),
    }


def armor_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    return {
        "id": text(data.get("id"), name.lower().replace(" ", "_")),
        "name": name,
        "source": text(data.get("source")),
        "type": title_case(data.get("type")),
        "baseAc": data.get("base_ac"),
        "requiredStrength": data.get("required_strength"),
        "stealthDisadvantage": bool(data.get("impose_stealth_disadvantage")),
        "cost": cost_of(data.get("cost")),
        "weight": weight_of(data.get("weight")),
    }


def feat_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    summary = feature_summary(data, default_level=0)
    if not summary:
        return None
    summary["id"] = text(data.get("id"), summary["name"].lower().replace(" ", "_"))
    return summary


# ---------------------------------------------------------------------------
# montagem
# ---------------------------------------------------------------------------

def encounter_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    name = text(data.get("name"))
    if not name:
        return None
    combatants = []
    for entry in as_list(data.get("combatant_pool")):
        if isinstance(entry, dict) and "stats" in entry:
            entry = unwrap(entry)
        if not isinstance(entry, dict):
            continue
        monster = entry.get("combatant")
        if isinstance(monster, dict) and "stats" in monster:
            monster = unwrap(monster)
        if isinstance(monster, dict):
            combatants.append({
                "name": text(monster.get("name")),
                "cr": cr_from_id(monster.get("cr")),
                "xp": monster.get("xp"),
            })
    return {
        "id": text(data.get("id"), name.lower().replace(" ", "_")),
        "name": name,
        "source": text(data.get("source")),
        "description": text(data.get("description")),
        "combatants": combatants,
    }


def source_summary(path: Path):
    data = unwrap(load_json(path))
    if not isinstance(data, dict):
        return None
    sid = text(data.get("id"))
    if not sid:
        return None
    abbreviation = text(data.get("abbreviation"), sid.upper())
    return {
        "id": sid,
        "name": abbreviation,
        "abbreviation": abbreviation,
    }


CATEGORIES = {
    "spells": ("spell_", spell_summary, "magias"),
    "monsters": ("monster_", monster_summary, "monstros"),
    "items": ("item_", item_summary, "itens"),
    "weapons": ("weapon_", weapon_summary, "armas"),
    "armors": ("armor_", armor_summary, "armaduras"),
    "feats": ("feat_", feat_summary, "talentos"),
    "races": ("race_", race_summary, "raças"),
    "backgrounds": ("background_", background_summary, "antecedentes"),
    "classes": ("class_", class_summary, "classes"),
    "encounters": ("encounter_", encounter_summary, "encontros"),
    "sources": ("source_", source_summary, "fontes"),
}


def build(repo: Path, out: Path):
    resources = repo / "systems" / "5e" / "resource_instances"
    system = repo / "systems" / "5e" / "system" / "system.rpg.json"
    if not resources.is_dir():
        raise SystemExit(f"Não encontrei {resources}. Rode o sparse checkout do systems/5e.")
    out.mkdir(parents=True, exist_ok=True)
    manifest = {
        "system": "5e",
        "version": None,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "counts": {},
        "sources": {},
    }
    if system.is_file():
        meta = load_json(system)
        manifest["version"] = meta.get("version")
        manifest["name"] = meta.get("name")
        manifest["minAppVersion"] = meta.get("min_app_version")
    all_counts = {}
    for category, (prefix, normalizer, _label) in CATEGORIES.items():
        entries = []
        for path in sorted(resources.glob(f"{prefix}*.json")):
            try:
                entry = normalizer(path)
            except Exception as exc:  # noqa: BLE001 - relatório de dados sujos
                print(f"AVISO {path.name}: {exc}")
                continue
            if entry:
                entries.append(entry)
        entries.sort(key=lambda x: x.get("name", ""))
        destination = out / f"{category}.json"
        destination.write_text(
            json.dumps(entries, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        all_counts[category] = len(entries)
        manifest["counts"][category] = len(entries)
        manifest["sources"][category] = dict(Counter(e.get("source") for e in entries).most_common())
        print(f"{category:12} {len(entries):5}  {destination.stat().st_size / 1024 / 1024:6.2f} MB")
    manifest["total"] = sum(all_counts.values())
    (out / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("total", manifest["total"])
    return manifest


def main():
    parser = argparse.ArgumentParser(description="Gera o pacote de dados 5e do Atlas.")
    parser.add_argument("--repo", default=".tmp/rpg-systems", type=Path)
    parser.add_argument("--out", default="app/dist/5e", type=Path)
    args = parser.parse_args()
    build(args.repo, args.out)


if __name__ == "__main__":
    main()
