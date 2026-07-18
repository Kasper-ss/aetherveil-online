import type { ItemRarity, Player, ResourceId, SocketGemId } from '@/types/game'
import { RESOURCES } from '@/data/classes'
import { getSocketGemDef, MAX_SOCKET_GEM_LEVEL } from '@/data/socketGems'
import { getProfessionExp, getProfessionRank } from '@/lib/professionProgress'

export type GemCraftCost = {
  gold: number
  resources: Partial<Record<ResourceId, number>>
}

const RARITY_MULT: Record<ItemRarity, number> = {
  common: 1,
  rare: 1,
  epic: 1.65,
  legendary: 2.5,
  mythic: 3.75,
  divine: 4.5,
}

const STUDY_DURATION_MS: Record<ItemRarity, number> = {
  common: 60 * 60_000,
  rare: 90 * 60_000,
  epic: 120 * 60_000,
  legendary: 180 * 60_000,
  mythic: 240 * 60_000,
  divine: 300 * 60_000,
}

function rarityMult(gemId: SocketGemId): number {
  return RARITY_MULT[getSocketGemDef(gemId).rarity]
}

export function getJewelerRank(player: Player): number {
  return getProfessionRank(getProfessionExp(player, 'jeweler'))
}

/** Минимальный ранг ювелира для создания камня (зависит от редкости камня и текущего уровня огранки). */
export function getRequiredJewelerRankForCombine(gemId: SocketGemId, craftLevel: number): number {
  const rarity = getSocketGemDef(gemId).rarity
  const rarityBase = { common: 1, rare: 2, epic: 5, legendary: 9, mythic: 14, divine: 18 }[rarity]
  return rarityBase + Math.max(0, craftLevel - 2)
}

/** Минимальный ранг для улучшения до следующего уровня. */
export function getRequiredJewelerRankForUpgrade(currentLevel: number): number {
  if (currentLevel <= 1) return 2
  if (currentLevel <= 3) return 4
  if (currentLevel <= 5) return 7
  if (currentLevel <= 7) return 10
  if (currentLevel <= 8) return 13
  return 16
}

export function getGemCombineCost(gemId: SocketGemId, craftLevel: number): GemCraftCost {
  const mult = rarityMult(gemId)
  const rarity = getSocketGemDef(gemId).rarity
  const levelScale = 1 + (Math.max(1, craftLevel) - 1) * 0.4
  const resources: Partial<Record<ResourceId, number>> = {
    gem_shard: Math.ceil((5 + craftLevel * 2) * mult * levelScale),
  }

  if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic' || rarity === 'divine') {
    resources.mana_crystal = Math.ceil((1 + craftLevel * 0.6) * mult)
  }
  if (craftLevel >= 3 && (rarity === 'legendary' || rarity === 'mythic' || rarity === 'divine')) {
    resources.upgrade_core = Math.ceil(craftLevel / 3)
  }
  if (craftLevel >= 2 && (rarity === 'mythic' || rarity === 'divine')) {
    resources.raw_diamond = Math.ceil(craftLevel / 4)
  }
  if (craftLevel >= 5 && rarity === 'mythic') {
    resources.star_shard = 1
  }
  if (craftLevel >= 4 && rarity === 'legendary') {
    resources.aether_dust = Math.ceil(craftLevel / 4)
  }

  return {
    gold: Math.floor((1200 + craftLevel * 450) * mult * levelScale),
    resources,
  }
}

export function getGemUpgradeCost(gemId: SocketGemId, currentLevel: number): GemCraftCost {
  const mult = rarityMult(gemId)
  const rarity = getSocketGemDef(gemId).rarity
  const resources: Partial<Record<ResourceId, number>> = {
    gem_shard: Math.ceil((6 + currentLevel * 3) * mult),
  }

  if (currentLevel >= 2) {
    resources.mana_crystal = Math.ceil((1 + currentLevel * 0.5) * mult)
  }
  if (currentLevel >= 4) {
    resources.raw_diamond = Math.ceil(currentLevel / 3)
  }
  if (currentLevel >= 5) {
    resources.upgrade_core = Math.ceil(currentLevel / 5)
  }
  if (currentLevel >= 7 && (rarity === 'legendary' || rarity === 'mythic' || rarity === 'divine')) {
    resources.aether_dust = Math.ceil(currentLevel / 4)
  }
  if (currentLevel >= 8 && (rarity === 'mythic' || rarity === 'divine')) {
    resources.star_shard = Math.ceil(currentLevel / 6)
  }

  return {
    gold: Math.floor((1500 + currentLevel * 750) * mult),
    resources,
  }
}

/** Шанс успешного улучшения (0–1). Ресурсы тратятся при любом исходе. */
export function getGemUpgradeSuccessChance(gemId: SocketGemId, currentLevel: number, jewelerRank: number): number {
  const required = getRequiredJewelerRankForUpgrade(currentLevel)
  const rarityPenalty = { common: 0, rare: 0, epic: 0.02, legendary: 0.04, mythic: 0.06, divine: 0.08 }[
    getSocketGemDef(gemId).rarity
  ]
  const base = Math.max(0.52, 1 - (currentLevel - 1) * 0.05) - rarityPenalty
  const rankBonus = Math.max(0, jewelerRank - required) * 0.015
  return Math.min(0.98, base + rankBonus)
}

export function getGemStudyDurationMs(gemId: SocketGemId): number {
  return STUDY_DURATION_MS[getSocketGemDef(gemId).rarity]
}

export function getGemStudyCost(gemId: SocketGemId): GemCraftCost {
  const mult = rarityMult(gemId)
  const rarity = getSocketGemDef(gemId).rarity
  const resources: Partial<Record<ResourceId, number>> = {
    gem_shard: Math.ceil(6 * mult),
  }

  if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic' || rarity === 'divine') {
    resources.mana_crystal = Math.ceil(2 * mult)
  }
  if (rarity === 'legendary' || rarity === 'mythic' || rarity === 'divine') {
    resources.upgrade_core = rarity === 'legendary' ? 1 : 2
  }
  if (rarity === 'mythic' || rarity === 'divine') {
    resources.raw_diamond = 1
  }
  if (rarity === 'mythic') {
    resources.star_shard = 1
  }

  return {
    gold: Math.floor(800 * mult),
    resources,
  }
}

export function playerHasGemCraftCost(player: Player, cost: GemCraftCost): boolean {
  if (player.gold < cost.gold) return false
  for (const [rid, amt] of Object.entries(cost.resources)) {
    if (!amt) continue
    if ((player.resources?.[rid as ResourceId] ?? 0) < amt) return false
  }
  return true
}

export function formatGemCraftCost(cost: GemCraftCost): string {
  const parts = [`🪙${cost.gold}`]
  for (const [rid, amt] of Object.entries(cost.resources)) {
    if (!amt) continue
    const res = RESOURCES[rid as ResourceId]
    parts.push(`${res?.icon ?? '·'}${amt}`)
  }
  return parts.join(' · ')
}

export function getCombineBlockReason(player: Player, gemId: SocketGemId): string | null {
  const craftLevel = player.socketGemLevels?.[gemId] ?? 1
  const rank = getJewelerRank(player)
  const required = getRequiredJewelerRankForCombine(gemId, craftLevel)
  if (rank < required) {
    return `Нужен ранг ювелира ${required} (сейчас ${rank})`
  }
  const cost = getGemCombineCost(gemId, craftLevel)
  if (!playerHasGemCraftCost(player, cost)) {
    return `Не хватает ресурсов: ${formatGemCraftCost(cost)}`
  }
  return null
}

export function getUpgradeBlockReason(player: Player, gemId: SocketGemId): string | null {
  const level = player.socketGemLevels?.[gemId] ?? 0
  if (level <= 0) return 'Сначала создайте камень'
  if (level >= MAX_SOCKET_GEM_LEVEL) return 'Максимальный уровень'
  const rank = getJewelerRank(player)
  const required = getRequiredJewelerRankForUpgrade(level)
  if (rank < required) {
    return `Нужен ранг ювелира ${required} (сейчас ${rank})`
  }
  const cost = getGemUpgradeCost(gemId, level)
  if (!playerHasGemCraftCost(player, cost)) {
    return `Не хватает ресурсов: ${formatGemCraftCost(cost)}`
  }
  return null
}

export function getStudyBlockReason(player: Player, gemId: SocketGemId): string | null {
  const cost = getGemStudyCost(gemId)
  if (!playerHasGemCraftCost(player, cost)) {
    return `Не хватает ресурсов: ${formatGemCraftCost(cost)}`
  }
  return null
}

/** @deprecated use getGemCombineCost */
export function getCombineCost(level: number): { gold: number; gem_shard: number } {
  const cost = getGemCombineCost('ruby', level)
  return { gold: cost.gold, gem_shard: cost.resources.gem_shard ?? 0 }
}

/** @deprecated use getGemUpgradeCost */
export function getUpgradeCost(level: number): { gold: number; gem_shard: number; raw_diamond: number } {
  const cost = getGemUpgradeCost('ruby', level)
  return {
    gold: cost.gold,
    gem_shard: cost.resources.gem_shard ?? 0,
    raw_diamond: cost.resources.raw_diamond ?? 0,
  }
}
