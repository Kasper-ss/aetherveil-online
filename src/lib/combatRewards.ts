/** Награды зависят от этажа (см. floors.ts); штраф за перелевел отключён. */
export function getCombatRewardEase(_playerLevel: number, _floor: number): { expMult: number; goldMult: number } {
  return { expMult: 1, goldMult: 1 }
}

export function applyCombatRewardEase(
  exp: number,
  gold: number,
  playerLevel: number,
  floor: number,
): { exp: number; gold: number } {
  const ease = getCombatRewardEase(playerLevel, floor)
  return {
    exp: Math.max(1, Math.floor(exp * ease.expMult)),
    gold: Math.max(0, Math.floor(gold * ease.goldMult)),
  }
}
