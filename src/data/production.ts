import type { ResourceId } from '@/types/game'

export const PRODUCTION_UNLOCK_FLOOR = 15

export type EnergyGeneratorId =
  | 'generator'
  | 'windmill'
  | 'power_plant'
  | 'nuclear_plant'
  | 'nuclear_reactor'

export type ProductionMachineId =
  | 'pyrolyzer'
  | 'vacuum_pump'
  | 'crystallizer'
  | 'centrifuge'
  | 'plasma_cutter'

export interface EnergyGeneratorDef {
  id: EnergyGeneratorId
  nameRu: string
  icon: string
  goldCost: number
  energyPerSec: number
  descriptionRu: string
}

export interface ProductionMachineDef {
  id: ProductionMachineId
  nameRu: string
  icon: string
  goldCost: number
  durationMs: number
  energyPerSec: number
  inputs: Partial<Record<ResourceId, number>>
  output: ResourceId
  outputAmount: number
  descriptionRu: string
}

export const ENERGY_GENERATORS: EnergyGeneratorDef[] = [
  { id: 'generator', nameRu: 'Генератор', icon: '⚡', goldCost: 300_000, energyPerSec: 1, descriptionRu: '+1 энергии/сек' },
  { id: 'windmill', nameRu: 'Ветряк', icon: '🌀', goldCost: 550_000, energyPerSec: 3, descriptionRu: '+3 энергии/сек' },
  { id: 'power_plant', nameRu: 'Электростанция', icon: '🏭', goldCost: 900_000, energyPerSec: 8, descriptionRu: '+8 энергии/сек' },
  { id: 'nuclear_plant', nameRu: 'АЭС', icon: '☢️', goldCost: 1_800_000, energyPerSec: 20, descriptionRu: '+20 энергии/сек' },
  { id: 'nuclear_reactor', nameRu: 'Ядерный реактор', icon: '🔥', goldCost: 3_500_000, energyPerSec: 50, descriptionRu: '+50 энергии/сек' },
]

export const PRODUCTION_MACHINES: ProductionMachineDef[] = [
  {
    id: 'pyrolyzer',
    nameRu: 'Пиролизатор',
    icon: '🔥',
    goldCost: 300_000,
    durationMs: 60_000,
    energyPerSec: 2,
    inputs: { wood_plank: 2 },
    output: 'industrial_gas',
    outputAmount: 1,
    descriptionRu: 'Доски → Газ (1 мин)',
  },
  {
    id: 'centrifuge',
    nameRu: 'Центрифуга',
    icon: '🔄',
    goldCost: 450_000,
    durationMs: 60_000,
    energyPerSec: 8,
    inputs: { mithril_ore: 2, adamantite: 1 },
    output: 'dark_ore',
    outputAmount: 1,
    descriptionRu: 'Мифрил + Адамантий → Dark Ore (1 мин)',
  },
  {
    id: 'plasma_cutter',
    nameRu: 'Плазменный резак',
    icon: '✂️',
    goldCost: 800_000,
    durationMs: 600_000,
    energyPerSec: 12,
    inputs: { dark_ore: 1, industrial_gas: 2 },
    output: 'aura_ore',
    outputAmount: 1,
    descriptionRu: 'Dark Ore + Газ → Aura Ore (10 мин)',
  },
  {
    id: 'vacuum_pump',
    nameRu: 'Вакуумный насос',
    icon: '🧪',
    goldCost: 600_000,
    durationMs: 600_000,
    energyPerSec: 15,
    inputs: { aura_ore: 1, raw_diamond: 1 },
    output: 'goodnes_ore',
    outputAmount: 1,
    descriptionRu: 'Aura Ore + Алмаз → Goodnes Ore (10 мин)',
  },
  {
    id: 'crystallizer',
    nameRu: 'Кристаллизатор',
    icon: '💎',
    goldCost: 1_200_000,
    durationMs: 1_800_000,
    energyPerSec: 40,
    inputs: { goodnes_ore: 1, industrial_gas: 3, dark_ore: 2 },
    output: 'maximit_ore',
    outputAmount: 1,
    descriptionRu: 'Goodnes Ore + Газ + Dark Ore → Maximit Ore (30 мин)',
  },
]

export function getGeneratorDef(id: EnergyGeneratorId): EnergyGeneratorDef {
  return ENERGY_GENERATORS.find((g) => g.id === id)!
}

export function getMachineDef(id: ProductionMachineId): ProductionMachineDef {
  return PRODUCTION_MACHINES.find((m) => m.id === id)!
}

export function calcTotalEnergyPerSec(
  generators: Partial<Record<EnergyGeneratorId, number>> | undefined,
): number {
  let total = 0
  for (const gen of ENERGY_GENERATORS) {
    total += (generators?.[gen.id] ?? 0) * gen.energyPerSec
  }
  return total
}

export function calcJobEnergyCost(machine: ProductionMachineDef): number {
  return Math.ceil((machine.durationMs / 1000) * machine.energyPerSec)
}

export function calcProductionEnergyCap(
  generators: Partial<Record<EnergyGeneratorId, number>> | undefined,
): number {
  const rate = calcTotalEnergyPerSec(generators)
  return Math.max(500, rate * 120)
}
