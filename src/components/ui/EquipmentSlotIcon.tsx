import type { EquipSlot } from '@/data/items'
import type { ItemRarity } from '@/types/game'

const SLOT_SHORT: Record<EquipSlot, string> = {
  helmet: 'Ш',
  chestplate: 'Н',
  leggings: 'П',
  boots: 'С',
  necklace: 'О',
  ring: 'К',
  weapon: 'У',
  pet: 'Пт',
}

const RARITY_BG: Record<ItemRarity, string> = {
  common: 'bg-slate-600/40 text-slate-200',
  rare: 'bg-blue-600/30 text-blue-200',
  epic: 'bg-purple-600/30 text-purple-200',
  legendary: 'bg-amber-600/30 text-amber-200',
  mythic: 'bg-fuchsia-600/30 text-fuchsia-200',
  divine: 'bg-amber-400/30 text-amber-100',
}

interface EquipmentSlotIconProps {
  slot: EquipSlot
  rarity?: ItemRarity
  size?: 'sm' | 'md'
}

export function EquipmentSlotIcon({ slot, rarity = 'common', size = 'md' }: EquipmentSlotIconProps) {
  const dim = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'
  return (
    <div
      className={`${dim} rounded-md border border-aether-border flex items-center justify-center font-bold shrink-0 ${RARITY_BG[rarity]}`}
    >
      {SLOT_SHORT[slot]}
    </div>
  )
}
