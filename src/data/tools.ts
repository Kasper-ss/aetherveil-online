import type { ShopItem } from '@/types/game'

export const TOOL_IDS = ['pickaxe', 'fishing_rod'] as const
export type ToolId = (typeof TOOL_IDS)[number]

export const TOOL_LABELS: Record<ToolId, string> = {
  pickaxe: 'Кирка',
  fishing_rod: 'Удочка',
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
    id: 'shop_fishing_rod',
    name: 'Fishing Rod',
    nameRu: 'Удочка',
    description: 'Required for fishing activities.',
    descriptionRu: 'Нужна для рыбалки у охотника.',
    type: 'tool',
    goldPrice: 380,
    icon: '🎣',
    toolId: 'fishing_rod',
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
  return player.ownedTools?.includes(toolId) ?? false
}
