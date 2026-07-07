/**
 * Ratio-based mitigation: damage = atk² / (atk + def × coeff).
 * At def=0 → full atk; more DEF yields stronger % reduction (unlike flat subtraction).
 */
export function calcMitigatedDamage(rawAtk: number, targetDef: number, defCoeff: number): number {
  const atk = Math.max(1, Math.floor(rawAtk))
  const armor = Math.max(0, Math.floor(targetDef * defCoeff))
  return Math.max(1, Math.floor((atk * atk) / (atk + armor)))
}

/** Player DEF vs incoming enemy hits. */
export const PLAYER_DEF_MITIGATION = 3.4

/** Enemy DEF vs player outgoing hits. */
export const ENEMY_DEF_MITIGATION = 0.26
