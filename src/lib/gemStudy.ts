import type { Player, SocketGemId } from '@/types/game'
import { getSocketGemDef, SOCKET_GEMS } from '@/data/socketGems'
import { jewelResourceId } from '@/lib/jewelResources'
import { getGemStudyDurationMs, getStudyBlockReason } from '@/lib/gemCrafting'

/** Базовая длительность изучения (редкий камень). Для конкретного камня см. getGemStudyDurationMs. */
export const GEM_STUDY_DURATION_MS = getGemStudyDurationMs('ruby')

export interface GemStudyEntry {
  gemId: SocketGemId
  readyAt: string
}

export function getStudiedGems(player: Player): SocketGemId[] {
  return player.studiedGems ?? []
}

export function getActiveGemStudies(player: Player): GemStudyEntry[] {
  return player.activeGemStudies ?? []
}

export function isGemStudied(player: Player, gemId: SocketGemId): boolean {
  return getStudiedGems(player).includes(gemId)
}

export function getActiveGemStudy(player: Player, gemId: SocketGemId): GemStudyEntry | null {
  return getActiveGemStudies(player).find((s) => s.gemId === gemId) ?? null
}

export function isGemStudying(player: Player, gemId: SocketGemId): boolean {
  const entry = getActiveGemStudy(player, gemId)
  if (!entry) return false
  return new Date(entry.readyAt).getTime() > Date.now()
}

export function getGemStudyRemainingMs(player: Player, gemId: SocketGemId): number {
  const entry = getActiveGemStudy(player, gemId)
  if (!entry) return 0
  return Math.max(0, new Date(entry.readyAt).getTime() - Date.now())
}

export function hasActiveGemStudy(player: Player): boolean {
  return getActiveGemStudies(player).some((s) => new Date(s.readyAt).getTime() > Date.now())
}

export function canWorkWithGem(player: Player, gemId: SocketGemId): boolean {
  return isGemStudied(player, gemId) && !isGemStudying(player, gemId)
}

export function canStartGemStudy(player: Player, gemId: SocketGemId): boolean {
  if (isGemStudied(player, gemId)) return false
  if (isGemStudying(player, gemId)) return false
  if (hasActiveGemStudy(player)) return false
  if (getStudyBlockReason(player, gemId)) return false
  return true
}

export function formatGemStudyCountdown(ms: number): string {
  if (ms <= 0) return 'готово'
  const totalMin = Math.ceil(ms / 60_000)
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return m > 0 ? `${h} ч ${m} м` : `${h} ч`
  }
  return `${totalMin} м`
}

export function migrateStudiedGems(player: Player): SocketGemId[] {
  const studied = new Set<SocketGemId>(player.studiedGems ?? [])
  for (const gem of SOCKET_GEMS) {
    if ((player.socketGemLevels?.[gem.id] ?? 0) > 0) studied.add(gem.id)
    if ((player.resources?.[jewelResourceId(gem.id)] ?? 0) > 0) studied.add(gem.id)
  }
  return [...studied]
}

export function getGemStudyLabel(gemId: SocketGemId): string {
  return getSocketGemDef(gemId).nameRu
}
