import type { ClassData, Profession, Resource, CraftRecipe, ResourceId } from '@/types/game'

export const RESOURCES: Record<ResourceId, Resource> = {
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', nameRu: 'Железная руда', icon: '🪨' },
  herb: { id: 'herb', name: 'Healing Herb', nameRu: 'Целебная трава', icon: '🌿' },
  hide: { id: 'hide', name: 'Monster Hide', nameRu: 'Шкура монстра', icon: '🥩' },
  gem_shard: { id: 'gem_shard', name: 'Gem Shard', nameRu: 'Осколок кристалла', icon: '💠' },
  mana_crystal: { id: 'mana_crystal', name: 'Mana Crystal', nameRu: 'Кристалл маны', icon: '🔮' },
  aether_dust: { id: 'aether_dust', name: 'Aether Dust', nameRu: 'Пыль Эфира', icon: '✨' },
  star_shard: { id: 'star_shard', name: 'Star Shard', nameRu: 'Осколок звезды', icon: '⭐' },
  upgrade_core: { id: 'upgrade_core', name: 'Upgrade Core', nameRu: 'Ядро улучшения', icon: '🔧' },
}

function skill(
  id: string, name: string, nameRu: string, desc: string, descRu: string,
  gold = 120, resources?: Partial<Record<ResourceId, number>>
) {
  return { id, name, nameRu, description: desc, descriptionRu: descRu, maxLevel: 10, goldCostPerLevel: gold, resourceCostPerLevel: resources }
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'blacksmith',
    name: 'Blacksmith',
    nameRu: 'Кузнец',
    icon: '🔨',
    description: 'Forge weapons and armor',
    descriptionRu: 'Ковка оружия и брони',
    skills: [
      skill('bs_1', 'Basic Forging', 'Базовая ковка', '+2% weapon ATK per level', '+2% ATK оружия за уровень', 40, { iron_ore: 2 }),
      skill('bs_2', 'Tempering', 'Закалка', '+1% weapon durability', '+1% прочность оружия', 50, { iron_ore: 3 }),
      skill('bs_3', 'Sharp Edge', 'Острая кромка', '+3% crit chance', '+3% шанс крита', 60, { iron_ore: 2, gem_shard: 1 }),
      skill('bs_4', 'Heavy Plating', 'Тяжёлая броня', '+2% armor DEF per level', '+2% DEF брони за уровень', 55, { iron_ore: 4 }),
      skill('bs_5', 'Master Smith', 'Мастер-кузнец', 'Unlock rare recipes', 'Открывает редкие рецепты', 80, { iron_ore: 5, gem_shard: 2 }),
      skill('bs_6', 'Efficient Smelt', 'Эффективная плавка', '-5% craft cost', '-5% стоимость крафта', 45, { iron_ore: 2 }),
      skill('bs_7', 'Rune Etching', 'Руническая гравировка', '+1 ATK on crafted weapons', '+1 ATK на созданном оружии', 70, { gem_shard: 2, aether_dust: 1 }),
      skill('bs_8', 'Bulk Production', 'Массовое производство', '10% chance double craft', '10% шанс двойного крафта', 90, { iron_ore: 6 }),
      skill('bs_9', 'Legendary Forge', 'Легендарная кузница', 'Unlock epic recipes', 'Открывает эпические рецепты', 120, { gem_shard: 4, aether_dust: 2 }),
      skill('bs_10', 'Aether Smithing', 'Эфирная ковка', '+5% all equipment stats', '+5% ко всем характеристикам', 150, { aether_dust: 5, gem_shard: 3 }),
    ],
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    nameRu: 'Алхимик',
    icon: '⚗️',
    description: 'Brew potions and elixirs',
    descriptionRu: 'Варит зелья и эликсиры',
    skills: [
      skill('al_1', 'Herb Lore', 'Знание трав', '+1 potion potency', '+1 сила зелий', 35, { herb: 3 }),
      skill('al_2', 'Quick Brew', 'Быстрое варение', '-10% potion craft time', '-10% время варения', 40, { herb: 2 }),
      skill('al_3', 'Toxic Mix', 'Токсичная смесь', '+2% poison damage', '+2% урон ядом', 50, { herb: 4 }),
      skill('al_4', 'Energy Elixir', 'Эликсир энергии', 'Craft energy drinks', 'Создание энергетиков', 55, { herb: 3, mana_crystal: 1 }),
      skill('al_5', 'Healing Mastery', 'Мастерство лечения', '+5% heal potency', '+5% сила лечения', 65, { herb: 5 }),
      skill('al_6', 'Rare Extract', 'Редкий экстракт', 'Unlock rare potions', 'Открывает редкие зелья', 75, { herb: 4, mana_crystal: 2 }),
      skill('al_7', 'Batch Brewing', 'Партийное варение', 'Craft 2 potions at once', 'Создание 2 зелий сразу', 85, { herb: 6 }),
      skill('al_8', 'Antidote', 'Антидот', 'Resist debuffs +2%', 'Сопротивление дебаффам +2%', 70, { herb: 3, aether_dust: 1 }),
      skill('al_9', 'Philosopher Stone', 'Философский камень', '-15% alchemy cost', '-15% стоимость алхимии', 100, { mana_crystal: 3, aether_dust: 2 }),
      skill('al_10', 'Grand Elixir', 'Великий эликсир', 'Unlock legendary potions', 'Открывает легендарные зелья', 130, { aether_dust: 4, herb: 8 }),
    ],
  },
  {
    id: 'hunter',
    name: 'Hunter',
    nameRu: 'Охотник',
    icon: '🏹',
    description: 'Track monsters and gather materials',
    descriptionRu: 'Выслеживает монстров и собирает материалы',
    skills: [
      skill('hn_1', 'Tracking', 'Выслеживание', '+5% loot drop rate', '+5% шанс дропа', 30, { hide: 2 }),
      skill('hn_2', 'Skinning', 'Снятие шкур', '+1 hide per kill', '+1 шкура за убийство', 40, { hide: 3 }),
      skill('hn_3', 'Critical Hunt', 'Критическая охота', '+2% crit damage', '+2% крит урон', 45, { hide: 2 }),
      skill('hn_4', 'Trap Master', 'Мастер ловушек', '+3% damage vs beasts', '+3% урон по зверям', 50, { hide: 4 }),
      skill('hn_5', 'Rare Prey', 'Редкая добыча', 'Find rare materials', 'Находит редкие материалы', 60, { hide: 3, gem_shard: 1 }),
      skill('hn_6', 'Swift Pursuit', 'Быстрое преследование', '+2 speed', '+2 скорость', 55, { hide: 2 }),
      skill('hn_7', 'Monster Lore', 'Знание монстров', 'Reveal enemy weaknesses', 'Показывает слабости врагов', 65, { hide: 4 }),
      skill('hn_8', 'Bounty Hunter', 'Охотник за головами', '+10% gold from kills', '+10% золота за убийства', 80, { hide: 5 }),
      skill('hn_9', 'Apex Predator', 'Верховный хищник', '+5% ATK vs bosses', '+5% ATK против боссов', 95, { hide: 6, gem_shard: 2 }),
      skill('hn_10', 'Legendary Hunt', 'Легендарная охота', 'Guaranteed rare drop on bosses', 'Гарантированный редкий дроп с боссов', 120, { aether_dust: 3, hide: 8 }),
    ],
  },
  {
    id: 'jeweler',
    name: 'Jeweler',
    nameRu: 'Ювелир',
    icon: '💍',
    description: 'Craft accessories and gems',
    descriptionRu: 'Создаёт аксессуары и украшения',
    skills: [
      skill('jw_1', 'Gem Cutting', 'Огранка камней', '+1 gem shard yield', '+1 осколок кристалла', 45, { gem_shard: 2 }),
      skill('jw_2', 'Fine Setting', 'Тонкая оправа', '+2% accessory stats', '+2% характеристики аксессуаров', 50, { gem_shard: 3 }),
      skill('jw_3', 'Lucky Charm', 'Талисман удачи', '+1% crit', '+1% крит', 55, { gem_shard: 2 }),
      skill('jw_4', 'Enchanted Ring', 'Зачарованное кольцо', 'Craft accessories', 'Создание аксессуаров', 60, { gem_shard: 4, mana_crystal: 1 }),
      skill('jw_5', 'Brilliant Cut', 'Бриллиантовая огранка', '+3% gem value', '+3% ценность камней', 65, { gem_shard: 3 }),
      skill('jw_6', 'Mana Infusion', 'Наполнение маной', '+2 mana crystal yield', '+2 кристалла маны', 70, { mana_crystal: 2 }),
      skill('jw_7', 'Royal Jewels', 'Королевские драгоценности', 'Unlock rare accessories', 'Открывает редкие аксессуары', 85, { gem_shard: 5, aether_dust: 1 }),
      skill('jw_8', 'Prismatic', 'Призматический', '+2 all stats on accessories', '+2 все статы на аксессуарах', 90, { gem_shard: 4, mana_crystal: 2 }),
      skill('jw_9', 'Aether Gem', 'Эфирный камень', 'Craft aether items', 'Создание эфирных предметов', 110, { aether_dust: 3, gem_shard: 4 }),
      skill('jw_10', 'Crown Jeweler', 'Придворный ювелир', '+10% all accessory bonuses', '+10% бонусы аксессуаров', 140, { aether_dust: 5, gem_shard: 5 }),
    ],
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    nameRu: 'Чародей',
    icon: '🧙',
    description: 'Master arcane arts and enchantments',
    descriptionRu: 'Владеет тайной магией и зачарованиями',
    skills: [
      skill('sc_1', 'Arcane Basics', 'Основы магии', '+2% skill damage', '+2% урон навыков', 40, { mana_crystal: 2 }),
      skill('sc_2', 'Mana Flow', 'Поток маны', '-5% skill energy cost', '-5% стоимость навыков', 45, { mana_crystal: 2 }),
      skill('sc_3', 'Elemental Fury', 'Стихийная ярость', '+3% magic ATK', '+3% магический ATK', 55, { mana_crystal: 3 }),
      skill('sc_4', 'Enchant Weapon', 'Зачарование оружия', '+1 ATK on enchanted gear', '+1 ATK на зачарованной экипировке', 60, { mana_crystal: 2, aether_dust: 1 }),
      skill('sc_5', 'Cooldown Mastery', 'Мастерство перезарядки', '-0.5s skill cooldown', '-0.5с перезарядка навыков', 70, { mana_crystal: 4 }),
      skill('sc_6', 'Aether Channel', 'Канал Эфира', '+1 aether dust per battle', '+1 пыль Эфира за бой', 65, { aether_dust: 2 }),
      skill('sc_7', 'Spell Weaving', 'Плетение заклинаний', 'Combo skills deal +5% damage', 'Комбо-навыки +5% урон', 80, { mana_crystal: 4, aether_dust: 2 }),
      skill('sc_8', 'Arcane Shield', 'Магический щит', '+2% magic DEF', '+2% магическая DEF', 75, { mana_crystal: 3 }),
      skill('sc_9', 'Grand Sorcery', 'Великое колдовство', 'Unlock ultimate enchantments', 'Открывает верховные зачарования', 100, { aether_dust: 4, mana_crystal: 5 }),
      skill('sc_10', 'Archmage', 'Архимаг', '+10% all skill effects', '+10% эффект всех навыков', 150, { aether_dust: 6, mana_crystal: 4 }),
    ],
  },
]

export const CLASSES: ClassData[] = [
  {
    id: 'warrior', name: 'Warrior', nameRu: 'Воин', icon: '⚔️',
    description: 'Balanced fighter with high HP and solid ATK.',
    descriptionRu: 'Сбалансированный боец с высоким HP и хорошим ATK.',
    stats: { atk: 14, def: 8, hp: 120, crit: 5, speed: 8 },
    startingSkill: 'dual_blades', startingWeaponId: 'weapon_t1',
  },
  {
    id: 'archer', name: 'Archer', nameRu: 'Лучник', icon: '🏹',
    description: 'Fast and precise with high crit chance.',
    descriptionRu: 'Быстрый и точный с высоким шансом крита.',
    stats: { atk: 12, def: 5, hp: 90, crit: 14, speed: 14 },
    startingSkill: 'dash_strike', startingWeaponId: 'weapon_t1',
  },
  {
    id: 'mage', name: 'Mage', nameRu: 'Маг', icon: '🔮',
    description: 'Devastating magic damage, fragile defense.',
    descriptionRu: 'Разрушительный магический урон, слабая защита.',
    stats: { atk: 16, def: 4, hp: 80, crit: 8, speed: 10 },
    startingSkill: 'sword_skill', startingWeaponId: 'weapon_t1',
  },
  {
    id: 'summoner', name: 'Summoner', nameRu: 'Призыватель', icon: '👻',
    description: 'Support specialist with healing abilities.',
    descriptionRu: 'Специалист поддержки с лечением.',
    stats: { atk: 10, def: 6, hp: 100, crit: 6, speed: 9 },
    startingSkill: 'healing_light', startingWeaponId: 'pet_t1',
  },
  {
    id: 'assassin', name: 'Assassin', nameRu: 'Убийца', icon: '🗡️',
    description: 'Glass cannon with extreme crit and speed.',
    descriptionRu: 'Стеклянная пушка с экстремальным критом и скоростью.',
    stats: { atk: 15, def: 4, hp: 85, crit: 18, speed: 16 },
    startingSkill: 'dash_strike', startingWeaponId: 'weapon_t1',
  },
  {
    id: 'knight', name: 'Knight', nameRu: 'Рыцарь', icon: '🛡️',
    description: 'Tank with highest HP and defense.',
    descriptionRu: 'Танк с максимальным HP и защитой.',
    stats: { atk: 11, def: 12, hp: 130, crit: 4, speed: 7 },
    startingSkill: 'dual_blades', startingWeaponId: 'weapon_t1',
  },
]

export const CRAFT_RECIPES: CraftRecipe[] = [
  { id: 'craft_helmet_t3', resultItemId: 'helmet_t3', name: 'Стальной шлем', description: 'ЗАЩ +8, HP +30', resources: { iron_ore: 12, upgrade_core: 2 }, goldCost: 250, requiredProfession: 'blacksmith', requiredProfessionLevel: 5 },
  { id: 'craft_weapon_t5', resultItemId: 'weapon_t5', name: 'Рунический клинок', description: 'АТК +25, КРИТ +11', resources: { iron_ore: 15, gem_shard: 5, upgrade_core: 3 }, goldCost: 400, requiredProfession: 'blacksmith', requiredProfessionLevel: 8 },
  { id: 'craft_chest_t4', resultItemId: 'chestplate_t4', name: 'Нагрудник охотника', description: 'ЗАЩ +14, HP +55', resources: { hide: 10, iron_ore: 8, upgrade_core: 2 }, goldCost: 350, requiredProfession: 'blacksmith', requiredProfessionLevel: 6 },
  // Set: Восхождение в Тени
  { id: 'craft_shadow_helmet', resultItemId: 'shadow_ascension_helmet', name: 'Шлем Восхождения в Тени', description: 'Сет «Восхождение в Тени». ЗАЩ +28, КРИТ +12, HP +80', resources: { aether_dust: 15, star_shard: 5, gem_shard: 10, upgrade_core: 5 }, goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20, isSetCraft: true },
  { id: 'craft_shadow_chest', resultItemId: 'shadow_ascension_chestplate', name: 'Нагрудник Восхождения в Тени', description: 'Сет «Восхождение в Тени». ЗАЩ +45, HP +150, АТК +8', resources: { aether_dust: 20, star_shard: 8, gem_shard: 12, upgrade_core: 8 }, goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25, isSetCraft: true },
  { id: 'craft_shadow_weapon', resultItemId: 'shadow_ascension_weapon', name: 'Клинок Восхождения в Тени', description: 'Сет «Восхождение в Тени». АТК +55, КРИТ +25, СКР +8', resources: { aether_dust: 25, star_shard: 10, gem_shard: 15, upgrade_core: 10 }, goldCost: 10000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30, isSetCraft: true },
  { id: 'craft_shadow_leggings', resultItemId: 'shadow_ascension_leggings', name: 'Поножи Восхождения в Тени', description: 'Сет «Восхождение в Тени». ЗАЩ +25, СКР +15, КРИТ +5', resources: { aether_dust: 18, star_shard: 7, gem_shard: 10, upgrade_core: 6 }, goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22, isSetCraft: true },
  { id: 'craft_shadow_boots', resultItemId: 'shadow_ascension_boots', name: 'Ботинки Восхождения в Тени', description: 'Сет «Восхождение в Тени». СКР +18, ЗАЩ +12, КРИТ +8', resources: { aether_dust: 16, star_shard: 6, gem_shard: 8, upgrade_core: 5 }, goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21, isSetCraft: true },
  { id: 'craft_shadow_necklace', resultItemId: 'shadow_ascension_necklace', name: 'Ожерелье Восхождения в Тени', description: 'Сет «Восхождение в Тени». АТК +15, КРИТ +18, СКР +5', resources: { aether_dust: 14, star_shard: 6, gem_shard: 12, upgrade_core: 4 }, goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22, isSetCraft: true },
  { id: 'craft_shadow_ring', resultItemId: 'shadow_ascension_ring', name: 'Кольцо Восхождения в Тени', description: 'Сет «Восхождение в Тени». КРИТ +20, АТК +12', resources: { aether_dust: 12, star_shard: 5, gem_shard: 10, upgrade_core: 4 }, goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20, isSetCraft: true },
  // Set: Поднятие уровня в одиночку
  { id: 'craft_solo_helmet', resultItemId: 'solo_leveling_helmet', name: 'Шлем Одиночки', description: 'Сет «Поднятие уровня в одиночку». ЗАЩ +30, HP +100, АТК +5', resources: { aether_dust: 15, star_shard: 5, mana_crystal: 10, upgrade_core: 5 }, goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20, isSetCraft: true },
  { id: 'craft_solo_chest', resultItemId: 'solo_leveling_chestplate', name: 'Нагрудник Одиночки', description: 'Сет «Поднятие уровня в одиночку». ЗАЩ +50, HP +180, АТК +8', resources: { aether_dust: 20, star_shard: 8, mana_crystal: 12, upgrade_core: 8 }, goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25, isSetCraft: true },
  { id: 'craft_solo_weapon', resultItemId: 'solo_leveling_weapon', name: 'Клинок Одиночки', description: 'Сет «Поднятие уровня в одиночку». АТК +60, КРИТ +15, СКР +10', resources: { aether_dust: 25, star_shard: 10, mana_crystal: 15, upgrade_core: 10 }, goldCost: 10000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30, isSetCraft: true },
  { id: 'craft_solo_leggings', resultItemId: 'solo_leveling_leggings', name: 'Поножи Одиночки', description: 'Сет «Поднятие уровня в одиночку». ЗАЩ +28, СКР +12, HP +60', resources: { aether_dust: 18, star_shard: 7, mana_crystal: 10, upgrade_core: 6 }, goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22, isSetCraft: true },
  { id: 'craft_solo_boots', resultItemId: 'solo_leveling_boots', name: 'Ботинки Одиночки', description: 'Сет «Поднятие уровня в одиночку». СКР +16, ЗАЩ +15, АТК +5', resources: { aether_dust: 16, star_shard: 6, mana_crystal: 8, upgrade_core: 5 }, goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21, isSetCraft: true },
  { id: 'craft_solo_necklace', resultItemId: 'solo_leveling_necklace', name: 'Ожерелье Одиночки', description: 'Сет «Поднятие уровня в одиночку». АТК +18, КРИТ +10, HP +50', resources: { aether_dust: 14, star_shard: 6, mana_crystal: 12, upgrade_core: 4 }, goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22, isSetCraft: true },
  { id: 'craft_solo_ring', resultItemId: 'solo_leveling_ring', name: 'Кольцо Одиночки', description: 'Сет «Поднятие уровня в одиночку». АТК +15, КРИТ +12, СКР +5', resources: { aether_dust: 12, star_shard: 5, mana_crystal: 10, upgrade_core: 4 }, goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20, isSetCraft: true },
  // Set: Ванпанчмен
  { id: 'craft_punch_helmet', resultItemId: 'one_punch_helmet', name: 'Плащ Ванпанчмена', description: 'Сет «Ванпанчмен». ЗАЩ +15, АТК +20, КРИТ +10', resources: { aether_dust: 15, star_shard: 5, upgrade_core: 5 }, goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20, isSetCraft: true },
  { id: 'craft_punch_chest', resultItemId: 'one_punch_chestplate', name: 'Костюм Ванпанчмена', description: 'Сет «Ванпанчмен». ЗАЩ +35, АТК +25, HP +120', resources: { aether_dust: 20, star_shard: 8, upgrade_core: 8 }, goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25, isSetCraft: true },
  { id: 'craft_punch_weapon', resultItemId: 'one_punch_weapon', name: 'Кулак справедливости', description: 'Сет «Ванпанчмен». АТК +80, КРИТ +30, СКР +15', resources: { aether_dust: 30, star_shard: 12, upgrade_core: 12 }, goldCost: 12000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30, isSetCraft: true },
  { id: 'craft_punch_leggings', resultItemId: 'one_punch_leggings', name: 'Штаны Ванпанчмена', description: 'Сет «Ванпанчмен». ЗАЩ +20, СКР +20, АТК +10', resources: { aether_dust: 18, star_shard: 7, upgrade_core: 6 }, goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22, isSetCraft: true },
  { id: 'craft_punch_boots', resultItemId: 'one_punch_boots', name: 'Ботинки Ванпанчмена', description: 'Сет «Ванпанчмен». СКР +25, АТК +15, КРИТ +8', resources: { aether_dust: 16, star_shard: 6, upgrade_core: 5 }, goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21, isSetCraft: true },
  { id: 'craft_punch_necklace', resultItemId: 'one_punch_necklace', name: 'Значок героя', description: 'Сет «Ванпанчмен». АТК +30, КРИТ +15', resources: { aether_dust: 14, star_shard: 6, gem_shard: 8, upgrade_core: 4 }, goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22, isSetCraft: true },
  { id: 'craft_punch_ring', resultItemId: 'one_punch_ring', name: 'Перчатка Ванпанчмена', description: 'Сет «Ванпанчмен». АТК +35, КРИТ +20', resources: { aether_dust: 12, star_shard: 5, gem_shard: 8, upgrade_core: 4 }, goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20, isSetCraft: true },
  { id: 'craft_hp_potion', resultItemId: 'hp_potion', name: 'Зелье HP', description: 'Восстанавливает 50% HP в бою.', resources: { herb: 8 }, goldCost: 50, requiredProfession: 'alchemist', requiredProfessionLevel: 1 },
]

export function getUpgradeLevelCost(item: import('@/types/game').Item): { gold: number; resources: Partial<Record<ResourceId, number>> } {
  const lvl = item.upgradeLevel ?? 1
  if (lvl >= 10) return { gold: 0, resources: {} }
  const mult = lvl * lvl
  const rarityMult: Record<string, number> = { common: 1, rare: 2, epic: 4, legendary: 6, mythic: 10 }
  const rm = rarityMult[item.rarity] ?? 1
  return {
    gold: Math.floor(80 * mult * rm),
    resources: {
      upgrade_core: Math.ceil(lvl / 2),
      iron_ore: lvl * 2,
      gem_shard: lvl >= 5 ? Math.ceil(lvl / 3) : 0,
    },
  }
}

export function getStarUpgradeCost(item: import('@/types/game').Item): { gold: number; resources: Partial<Record<ResourceId, number>> } {
  const stars = item.starLevel ?? 0
  if (stars >= 10) return { gold: 0, resources: {} }
  const next = stars + 1
  return {
    gold: Math.floor(150 * next * next),
    resources: {
      star_shard: next,
      gem_shard: Math.ceil(next / 2),
      aether_dust: next >= 5 ? Math.ceil(next / 3) : 0,
    },
  }
}

export const UPGRADE_COSTS = {
  common: { gold: 50, resources: { iron_ore: 2 } as Partial<Record<ResourceId, number>> },
  rare: { gold: 300, resources: { gem_shard: 3, aether_dust: 1 } },
  epic: { gold: 600, resources: { gem_shard: 5, aether_dust: 3 } },
  legendary: { gold: 1200, resources: { aether_dust: 8, gem_shard: 8 } },
  mythic: { gold: 5000, resources: { aether_dust: 20, star_shard: 15 } },
}

export const MYTHIC_UPGRADE_COST = {
  gold: 25000,
  resources: { star_shard: 20, aether_dust: 25, upgrade_core: 15, gem_shard: 15 } as Partial<Record<ResourceId, number>>,
}

function mythicSkill(
  id: string, nameRu: string, descRu: string,
  gold = 250, resources?: Partial<Record<ResourceId, number>>
) {
  return { id, name: nameRu, nameRu, description: descRu, descriptionRu: descRu, maxLevel: 10, goldCostPerLevel: gold, resourceCostPerLevel: resources }
}

export const MYTHIC_SKILLS: Record<import('@/types/game').ProfessionId, import('@/types/game').ProfessionSkill[]> = {
  blacksmith: [
    mythicSkill('bs_m1', 'Кузня Бездны', '+5% ATK на всей экипировке за уровень', 280, { aether_dust: 5, star_shard: 2 }),
    mythicSkill('bs_m2', 'Плавка звёзд', '-10% стоимость улучшений за уровень', 300, { star_shard: 3, upgrade_core: 3 }),
    mythicSkill('bs_m3', 'Мифический клинок', '+8% крит на оружии за уровень', 320, { gem_shard: 4, aether_dust: 4 }),
    mythicSkill('bs_m4', 'Броня титана', '+6% DEF на броне за уровень', 310, { iron_ore: 8, upgrade_core: 4 }),
    mythicSkill('bs_m5', 'Вечная ковка', 'Шанс сохранить ресурсы при крафте', 350, { aether_dust: 6, star_shard: 4 }),
  ],
  alchemist: [
    mythicSkill('al_m1', 'Эликсир бессмертия', '+8% сила зелий за уровень', 260, { herb: 10, mana_crystal: 3 }),
    mythicSkill('al_m2', 'Алхимический огонь', '+5% урон ядом за уровень', 270, { herb: 8, aether_dust: 3 }),
    mythicSkill('al_m3', 'Мастер эссенций', '+2 к добыче трав за уровень', 290, { herb: 12, gem_shard: 2 }),
    mythicSkill('al_m4', 'Катализатор', '-8% стоимость алхимии за уровень', 300, { mana_crystal: 4, aether_dust: 3 }),
    mythicSkill('al_m5', 'Философская кровь', 'Шанс двойного зелья', 340, { aether_dust: 5, star_shard: 3 }),
  ],
  hunter: [
    mythicSkill('hn_m1', 'Охота на боссов', '+10% дроп с боссов за уровень', 270, { hide: 10, gem_shard: 2 }),
    mythicSkill('hn_m2', 'Следопыт', '+3 скорость за уровень', 260, { hide: 8 }),
    mythicSkill('hn_m3', 'Смертельный выстрел', '+6% крит урон за уровень', 290, { hide: 8, gem_shard: 3 }),
    mythicSkill('hn_m4', 'Трофейный мастер', '+15% золото с мобов за уровень', 300, { hide: 12, aether_dust: 2 }),
    mythicSkill('hn_m5', 'Легенда охоты', 'Гарантированный редкий дроп', 350, { aether_dust: 5, star_shard: 3 }),
  ],
  jeweler: [
    mythicSkill('jw_m1', 'Бриллиантовая пыль', '+8% статы аксессуаров за уровень', 280, { gem_shard: 5, aether_dust: 3 }),
    mythicSkill('jw_m2', 'Королевская огранка', '+4% крит за уровень', 270, { gem_shard: 4 }),
    mythicSkill('jw_m3', 'Мана-камень', '+3 кристалла маны за уровень', 290, { mana_crystal: 5 }),
    mythicSkill('jw_m4', 'Эфирная инкрустация', '+5% ко всем статам аксессуаров', 310, { aether_dust: 4, star_shard: 2 }),
    mythicSkill('jw_m5', 'Сокровищница', 'Шанс бонусного камня при крафте', 340, { star_shard: 4, gem_shard: 6 }),
  ],
  sorcerer: [
    mythicSkill('sc_m1', 'Архимагия', '+8% урон навыков за уровень', 280, { mana_crystal: 5, aether_dust: 4 }),
    mythicSkill('sc_m2', 'Бездонная мана', '-8% стоимость энергии навыков', 270, { mana_crystal: 4 }),
    mythicSkill('sc_m3', 'Ритуал звёзд', '-1с перезарядка навыков за 2 уровня', 300, { star_shard: 3, mana_crystal: 4 }),
    mythicSkill('sc_m4', 'Эфирный щит', '+5% магическая защита за уровень', 290, { aether_dust: 4 }),
    mythicSkill('sc_m5', 'Верховное колдовство', '+12% эффект всех навыков', 360, { aether_dust: 6, star_shard: 4 }),
  ],
}

export function isProfessionMaxed(professionId: import('@/types/game').ProfessionId, levels: number[]): boolean {
  const prof = PROFESSIONS.find((p) => p.id === professionId)
  if (!prof) return false
  return prof.skills.every((s, i) => (levels[i] ?? 0) >= s.maxLevel)
}

export function getClassData(classId: import('@/types/game').PlayerClass) {
  return CLASSES.find((c) => c.id === classId)!
}

export function getProfessionData(id: import('@/types/game').ProfessionId) {
  return PROFESSIONS.find((p) => p.id === id)!
}

export function getTotalProfessionLevel(levels: number[]): number {
  return levels.reduce((sum, l) => sum + l, 0)
}
