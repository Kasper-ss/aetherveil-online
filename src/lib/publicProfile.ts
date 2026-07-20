import type { Player, PublicPlayerProfile, ItemRarity } from '@/types/game'
import { getEffectiveStats } from '@/lib/playerStats'
import { getPlayerRankFromPlayer } from '@/lib/playerRank'
import { SLOT_LABELS_RU } from '@/data/items'
import { normalizeMonthlyStats } from '@/lib/monthlyStats'
import { getActiveSetBonuses } from '@/lib/setBonuses'

const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const

export function buildPublicProfile(player: Player): PublicPlayerProfile {
  const stats = getEffectiveStats(player)
  const equipped: PublicPlayerProfile['equipped'] = []
  for (const slot of EQUIP_SLOTS) {
    const item = player.equipped[slot]
    if (!item) continue
    equipped.push({
      slot: SLOT_LABELS_RU[slot],
      name: item.name,
      rarity: item.rarity as ItemRarity,
      setId: item.setId,
    })
  }

  return {
    telegramId: player.telegramId,
    displayName: player.displayName,
    username: player.username,
    playerRank: getPlayerRankFromPlayer(player),
    level: player.level,
    highestFloor: player.highestFloor,
    classId: player.classId,
    gold: player.gold,
    gems: player.gems,
    stats: { atk: stats.atk, def: stats.def, hp: stats.hp, crit: stats.crit, speed: stats.speed },
    equipped,
    activeSets: getActiveSetBonuses(player).map((b) => ({
      name: b.name,
      description: b.description,
    })),
    cosmeticAvatarId: player.cosmeticAvatarId,
    profileFrameId: player.profileFrameId,
    profileTitleId: player.profileTitleId,
    pvpWins: player.pvpWins,
    pvpLosses: player.pvpLosses,
    guildId: player.guildId,
    monthlyStats: normalizeMonthlyStats(player),
  }
}
