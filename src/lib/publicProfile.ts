import type { Player, PublicPlayerProfile, ItemRarity } from '@/types/game'
import { getEffectiveStats } from '@/lib/playerStats'
import { SLOT_LABELS_RU } from '@/data/items'

const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const

export function buildPublicProfile(player: Player): PublicPlayerProfile {
  const stats = getEffectiveStats(player)
  const equipped: PublicPlayerProfile['equipped'] = []
  for (const slot of EQUIP_SLOTS) {
    const item = player.equipped[slot]
    if (!item) continue
    equipped.push({ slot: SLOT_LABELS_RU[slot], name: item.name, rarity: item.rarity as ItemRarity })
  }

  return {
    telegramId: player.telegramId,
    displayName: player.displayName,
    username: player.username,
    level: player.level,
    highestFloor: player.highestFloor,
    classId: player.classId,
    stats: { atk: stats.atk, def: stats.def, hp: stats.hp, crit: stats.crit, speed: stats.speed },
    equipped,
    cosmeticAvatarId: player.cosmeticAvatarId,
    profileFrameId: player.profileFrameId,
    pvpWins: player.pvpWins,
    pvpLosses: player.pvpLosses,
    guildId: player.guildId,
  }
}
