import type { Player, PlayerRace } from '@/types/game'
import { addActiveEffect } from '@/lib/activeEffects'
import { getCombatMaxHp } from '@/lib/playerStats'

export const RACIAL_COOLDOWN_MS = 90_000

export function getRacialCooldownRemaining(player: Player): number {
  const until = player.racialCooldownUntil
  if (!until) return 0
  return Math.max(0, new Date(until).getTime() - Date.now())
}

export function canUseRacialAbility(player: Player): boolean {
  return !!player.raceId && getRacialCooldownRemaining(player) <= 0
}

export function applyRacialAbility(player: Player): {
  player: Partial<Player>
  log: string
  combatMods?: { dodgeBonus?: number; damageTakenMult?: number; atkMult?: number }
} {
  const race = player.raceId
  if (!race) return { player: {}, log: '' }
  const until = new Date(Date.now() + RACIAL_COOLDOWN_MS).toISOString()
  const base = { racialCooldownUntil: until }

  switch (race) {
    case 'human': {
      const effects = addActiveEffect(player.activeEffects, {
        id: 'racial_human',
        label: 'Каждый за себя',
        type: 'buff',
        stat: 'all',
        mult: 1.1,
        durationMs: 10_000,
      })
      return { player: { ...base, activeEffects: effects }, log: '🧑 Каждый за себя: +10% ко всем статам на 10 сек!' }
    }
    case 'dwarf': {
      const effects = addActiveEffect(player.activeEffects, {
        id: 'racial_dwarf',
        label: 'Каменная форма',
        type: 'buff',
        stat: 'def',
        mult: 1.35,
        durationMs: 8_000,
      })
      return {
        player: { ...base, activeEffects: effects },
        log: '🧔 Каменная форма: иммунитет к дебаффам, −30% урона!',
        combatMods: { damageTakenMult: 0.7 },
      }
    }
    case 'night_elf':
      return {
        player: { ...base, racialStealthTurns: 2 },
        log: '🌙 Тень: повышенное уклонение на 2 хода!',
        combatMods: { dodgeBonus: 0.4 },
      }
    case 'orc':
      return {
        player: { ...base, racialBerserkTurns: 3 },
        log: '💪 Кровавое неистовство: +25% скорости атаки на 15 сек!',
        combatMods: { atkMult: 1.25 },
      }
    case 'undead': {
      const effects = addActiveEffect(player.activeEffects, {
        id: 'racial_undead',
        label: 'Воля Отрекшихся',
        type: 'buff',
        stat: 'all',
        mult: 1.05,
        durationMs: 12_000,
      })
      return { player: { ...base, activeEffects: effects }, log: '💀 Воля Отрекшихся: сняты страх и контроль!' }
    }
    case 'troll':
      return {
        player: { ...base, racialBerserkTurns: 2 },
        log: '🗿 Берсерк: +20% скорости атаки!',
        combatMods: { atkMult: 1.2 },
      }
    case 'blood_elf': {
      const maxMana = player.maxMana ?? 0
      const healEnergy = Math.floor(player.maxEnergy * 0.35)
      return {
        player: {
          ...base,
          energy: Math.min(player.maxEnergy, player.energy + healEnergy),
          currentMana: maxMana > 0 ? Math.min(maxMana, (player.currentMana ?? 0) + Math.floor(maxMana * 0.4)) : player.currentMana,
        },
        log: '🔮 Волшебный поток: восстановлена энергия/мана!',
      }
    }
    default:
      return { player: base, log: '' }
  }
}

export function rollDwarfTreasureFind(raceId: PlayerRace | undefined): { gold: number; message: string } | null {
  if (raceId !== 'dwarf' || Math.random() > 0.12) return null
  const gold = 500 + Math.floor(Math.random() * 1500)
  return { gold, message: `🧔💎 Дворф нашёл сокровище: +${gold} 🪙!` }
}

export function getCannibalizeHeal(player: Player): number {
  return Math.floor(getCombatMaxHp(player) * 0.25)
}

export function tickRacialCombatState(player: Player): Partial<Player> {
  const updates: Partial<Player> = {}
  if (player.racialStealthTurns && player.racialStealthTurns > 0) {
    updates.racialStealthTurns = player.racialStealthTurns - 1
  }
  if (player.racialBerserkTurns && player.racialBerserkTurns > 0) {
    updates.racialBerserkTurns = player.racialBerserkTurns - 1
  }
  return updates
}

export function getRacialStatPassives(raceId: PlayerRace | undefined): Partial<{ atk: number; def: number; crit: number; speed: number }> {
  if (!raceId) return {}
  const map: Record<PlayerRace, Partial<{ atk: number; def: number; crit: number; speed: number }>> = {
    human: {},
    dwarf: { crit: 5 },
    night_elf: { speed: 2 },
    orc: { atk: 5 },
    undead: { def: 3 },
    troll: { crit: 5 },
    blood_elf: { crit: 5 },
  }
  return map[raceId] ?? {}
}
