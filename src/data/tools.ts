import type { ShopItem } from '@/types/game'

export const TOOL_IDS = ['pickaxe', 'fishing_rod', 'steel_pickaxe', 'master_rod', 'herbal_sickle'] as const
export type ToolId = (typeof TOOL_IDS)[number]

export const TOOL_LABELS: Record<ToolId, string> = {
  pickaxe: 'Кирка',
  fishing_rod: 'Удочка',
  steel_pickaxe: 'Стальная кирка',
  master_rod: 'Мастер-удочка',
  herbal_sickle: 'Серп травника',
}

const BASE_TOOL_ALIASES: Record<string, string[]> = {
  pickaxe: ['pickaxe', 'steel_pickaxe'],
  fishing_rod: ['fishing_rod', 'master_rod'],
}

export const TOOL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'shop_pickaxe',
    name: 'Iron Pickaxe',
    nameRu: 'Железная кирка',
    description: 'Required for mining and gem digging.',
    descriptionRu: 'Нужна для добычи руды и кристаллов (Кузнец, Ювелир).',
    type: 'tool',
    goldPrice: 450,
    icon: '⛏️',
    toolId: 'pickaxe',
  },
  {
    id: 'shop_steel_pickaxe',
    name: 'Steel Pickaxe',
    nameRu: 'Стальная кирка',
    description: '+5% double ore chance in mine.',
    descriptionRu: 'Улучшенная кирка: +5% к двойной добыче в шахте.',
    type: 'tool',
    goldPrice: 1200,
    gemsPrice: 8,
    icon: '⛏️',
    toolId: 'steel_pickaxe',
  },
  {
    id: 'shop_fishing_rod',
    name: 'Fishing Rod',
    nameRu: 'Удочка',
    description: 'Required for fishing activities.',
    descriptionRu: 'Нужна для рыбалки.',
    type: 'tool',
    goldPrice: 380,
    icon: '🎣',
    toolId: 'fishing_rod',
  },
  {
    id: 'shop_master_rod',
    name: 'Master Rod',
    nameRu: 'Мастер-удочка',
    description: 'Less junk, better fish odds.',
    descriptionRu: 'Меньше мусора при рыбалке.',
    type: 'tool',
    goldPrice: 950,
    gemsPrice: 6,
    icon: '🎣',
    toolId: 'master_rod',
  },
  {
    id: 'shop_herbal_sickle',
    name: 'Herbal Sickle',
    nameRu: 'Серп травника',
    description: 'Bonus herbs from alchemist grind.',
    descriptionRu: 'Бонус к сбору трав (алхимик).',
    type: 'tool',
    goldPrice: 280,
    icon: '🌿',
    toolId: 'herbal_sickle',
  },
  {
    id: 'shop_fishing_bait',
    name: 'Bait x10',
    nameRu: 'Наживка x10',
    description: 'Consumable bait for fishing.',
    descriptionRu: 'Расходник для рыбалки (10 шт.).',
    type: 'consumable',
    goldPrice: 60,
    icon: '🪱',
    itemId: 'fishing_bait',
    bundleCount: 10,
  },
]

export function playerHasTool(player: { ownedTools?: string[] }, toolId: string): boolean {
  const owned = player.ownedTools ?? []
  const aliases = BASE_TOOL_ALIASES[toolId]
  if (aliases) return aliases.some((id) => owned.includes(id))
  return owned.includes(toolId)
}

export function getMineDoubleBonus(player: { ownedTools?: string[] }): number {
  if (player.ownedTools?.includes('steel_pickaxe')) return 0.05
  return 0
}

export function getFishingJunkReduction(player: { ownedTools?: string[] }): number {
  if (player.ownedTools?.includes('master_rod')) return 0.04
  return 0
}

export function getHerbGatherBonus(player: { ownedTools?: string[] }): number {
  if (player.ownedTools?.includes('herbal_sickle')) return 1
  return 0
}
