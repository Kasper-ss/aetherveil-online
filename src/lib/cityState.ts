import type { CityPlacedBuilding, CityState, Player, ResourceId } from '@/types/game'
import {
  CITY_GRID_SIZE,
  getCityBuildingDef,
  getCityLevelMultiplier,
  type CityBuildingId,
  type CityPassiveRates,
} from '@/data/cityBuildings'

export const CITY_PASSIVE_CAP_HOURS = 24

/** Building gives stat bonuses (keeps current level during upgrade). */
export function isCityBuildingActiveForBonuses(building: CityPlacedBuilding): boolean {
  if (!building.readyAt) return true
  if (new Date(building.readyAt).getTime() <= Date.now()) return true
  return !!building.pendingLevel
}

/** Building is fully operational (passive production, no construction). */
export function isCityBuildingReady(building: CityPlacedBuilding): boolean {
  if (!building.readyAt) return true
  return new Date(building.readyAt).getTime() <= Date.now()
}

export function getCityBuildingEffectiveLevel(building: CityPlacedBuilding): number {
  if (
    building.pendingLevel
    && building.readyAt
    && new Date(building.readyAt).getTime() > Date.now()
  ) {
    return building.level
  }
  return building.level
}

export function finalizeCityBuildings(buildings: CityPlacedBuilding[]): CityPlacedBuilding[] {
  const now = Date.now()
  return buildings.map((building) => {
    if (!building.readyAt || new Date(building.readyAt).getTime() > now) return building
    if (building.pendingLevel) {
      return {
        ...building,
        level: building.pendingLevel,
        pendingLevel: undefined,
        readyAt: undefined,
      }
    }
    return { ...building, readyAt: undefined }
  })
}

export function defaultCityState(): CityState {
  return {
    buildings: [],
    pendingPassive: {},
    passiveLastTickAt: new Date().toISOString(),
  }
}

export function getCityState(player: Player): CityState {
  return player.cityState ?? defaultCityState()
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

export function getBuildingAt(player: Player, x: number, y: number): CityPlacedBuilding | null {
  const key = cellKey(x, y)
  return getCityState(player).buildings.find((b) => cellKey(b.x, b.y) === key) ?? null
}

export function getCityBuildRemainingMs(building: CityPlacedBuilding): number {
  if (!building.readyAt) return 0
  return Math.max(0, new Date(building.readyAt).getTime() - Date.now())
}

export function getCompletedCityBuildings(player: Player): CityPlacedBuilding[] {
  return getCityState(player).buildings
}

export function canPlaceAt(player: Player, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= CITY_GRID_SIZE || y >= CITY_GRID_SIZE) return false
  return !getBuildingAt(player, x, y)
}

export function scalePassiveRates(rates: CityPassiveRates, level: number): CityPassiveRates {
  const mult = getCityLevelMultiplier(level)
  const scaled: CityPassiveRates = {}
  for (const [k, v] of Object.entries(rates)) {
    if (!v) continue
    scaled[k as keyof CityPassiveRates] = v * mult
  }
  return scaled
}

export function calcPassiveAccrual(
  player: Player,
  nowMs = Date.now(),
): { resources: Partial<Record<ResourceId, number>>; passiveLastTickAt: string } {
  const state = getCityState(player)
  const last = new Date(state.passiveLastTickAt).getTime()
  const elapsedMs = Math.max(0, nowMs - last)
  const hours = Math.min(CITY_PASSIVE_CAP_HOURS, elapsedMs / 3_600_000)
  if (hours <= 0) {
    return { resources: {}, passiveLastTickAt: state.passiveLastTickAt }
  }

  const accrued: Partial<Record<ResourceId, number>> = { ...state.pendingPassive }
  for (const placed of state.buildings) {
    if (!isCityBuildingReady(placed)) continue
    const def = getCityBuildingDef(placed.buildingId as CityBuildingId)
    if (!def.passiveRates) continue
    const rates = scalePassiveRates(def.passiveRates, getCityBuildingEffectiveLevel(placed))
    for (const [rid, perHour] of Object.entries(rates)) {
      if (!perHour) continue
      const id = rid as ResourceId
      accrued[id] = (accrued[id] ?? 0) + perHour * hours
    }
  }

  const floored: Partial<Record<ResourceId, number>> = {}
  for (const [rid, amt] of Object.entries(accrued)) {
    const n = Math.floor(amt)
    if (n > 0) floored[rid as ResourceId] = n
  }

  return {
    resources: floored,
    passiveLastTickAt: new Date(nowMs).toISOString(),
  }
}

export function getPassiveRatesPerHour(player: Player): Partial<Record<ResourceId, number>> {
  const totals: Partial<Record<ResourceId, number>> = {}
  for (const placed of getCityState(player).buildings) {
    if (!isCityBuildingReady(placed)) continue
    const def = getCityBuildingDef(placed.buildingId as CityBuildingId)
    if (!def.passiveRates) continue
    const rates = scalePassiveRates(def.passiveRates, getCityBuildingEffectiveLevel(placed))
    for (const [rid, perHour] of Object.entries(rates)) {
      if (!perHour) continue
      const id = rid as ResourceId
      totals[id] = (totals[id] ?? 0) + perHour
    }
  }
  return totals
}

export function formatCityCountdown(ms: number): string {
  if (ms <= 0) return 'готово'
  const totalMin = Math.ceil(ms / 60_000)
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`
  }
  return `${totalMin}м`
}
