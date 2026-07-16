import type { Player, ProductionJob, ProductionState } from '@/types/game'
import {
  calcJobEnergyCost,
  calcProductionEnergyCap,
  calcTotalEnergyPerSec,
  getMachineDef,
  type ProductionMachineId,
} from '@/data/production'

export function defaultProductionState(): ProductionState {
  return {
    generators: {},
    machines: {},
    energyStored: 0,
    lastTickAt: new Date().toISOString(),
    jobs: [],
  }
}

export function getProductionState(player: Player): ProductionState {
  return { ...defaultProductionState(), ...player.productionState }
}

export function tickProductionState(state: ProductionState, now = Date.now()): {
  state: ProductionState
  completed: ProductionJob[]
} {
  const last = new Date(state.lastTickAt).getTime()
  const elapsedSec = Math.max(0, (now - last) / 1000)
  const rate = calcTotalEnergyPerSec(state.generators)
  const cap = calcProductionEnergyCap(state.generators)
  const energyStored = Math.min(cap, state.energyStored + rate * elapsedSec)

  const completed: ProductionJob[] = []
  const active: ProductionJob[] = []

  for (const job of state.jobs) {
    if (new Date(job.readyAt).getTime() <= now) {
      completed.push(job)
    } else {
      active.push(job)
    }
  }

  return {
    state: {
      ...state,
      energyStored,
      lastTickAt: new Date(now).toISOString(),
      jobs: active,
    },
    completed,
  }
}

export function canStartProductionJob(
  player: Player,
  machineId: ProductionMachineId,
): { ok: boolean; reason?: string } {
  const state = getProductionState(player)
  const owned = state.machines[machineId] ?? 0
  if (owned < 1) return { ok: false, reason: 'Купите механизм' }

  const machine = getMachineDef(machineId)
  for (const [resId, amt] of Object.entries(machine.inputs)) {
    if ((player.resources[resId as keyof typeof player.resources] ?? 0) < (amt ?? 0)) {
      return { ok: false, reason: 'Недостаточно ресурсов' }
    }
  }

  const energyCost = calcJobEnergyCost(machine)
  if (state.energyStored < energyCost) {
    return { ok: false, reason: `Нужно ${energyCost} произв. энергии` }
  }

  const running = state.jobs.filter((j) => j.machineId === machineId).length
  if (running >= owned) return { ok: false, reason: 'Все механизмы заняты' }

  return { ok: true }
}

export function createProductionJob(machineId: ProductionMachineId): ProductionJob {
  const machine = getMachineDef(machineId)
  const now = Date.now()
  return {
    id: `job_${machineId}_${now}`,
    machineId,
    startedAt: new Date(now).toISOString(),
    readyAt: new Date(now + machine.durationMs).toISOString(),
    amount: machine.outputAmount,
  }
}
