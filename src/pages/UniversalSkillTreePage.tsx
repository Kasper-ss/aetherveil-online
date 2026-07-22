import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { UniversalSkillId } from '@/types/game'
import {
  UNIVERSAL_SKILLS,
  UNIVERSAL_SKILL_TIERS,
  UNIVERSAL_SKILL_MAX_LEVEL,
  getAvailableUniversalSkillPoints,
  getTotalUniversalSkillPoints,
  getSpentUniversalSkillPoints,
  getScaledUniversalSkill,
} from '@/data/universalSkillTree'

export function UniversalSkillTreePage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const spendUniversalSkillPoint = usePlayerStore((s) => s.spendUniversalSkillPoint)

  useTelegramBackButton(() => navigate('/skills'), true)

  if (!player) return null

  const levels = player.universalSkillLevels ?? {}
  const totalPoints = getTotalUniversalSkillPoints(player.level)
  const spentPoints = getSpentUniversalSkillPoints(levels)
  const availablePoints = getAvailableUniversalSkillPoints(player)

  function handleSpend(skillId: UniversalSkillId) {
    if (spendUniversalSkillPoint(skillId)) hapticSuccess()
    else hapticError()
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/skills')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Дерево навыков</h1>
          <p className="text-xs text-slate-400">Общее для всех классов · до 200 ур.</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-aether-purple/40">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Очки навыков</span>
              <span className="font-bold text-aether-gold">{availablePoints} / {totalPoints}</span>
            </div>
            <Progress value={totalPoints > 0 ? (spentPoints / totalPoints) * 100 : 0} className="h-2" />
            <p className="text-[10px] text-slate-500">
              Первое очко на 10 ур., далее каждые 5 ур. Макс. {totalPoints} очков на 200 ур.
              Каждый скилл — до {UNIVERSAL_SKILL_MAX_LEVEL} ур. (+35–50% за улучшение).
            </p>
          </CardContent>
        </Card>

        {UNIVERSAL_SKILL_TIERS.map((tier) => {
          const tierUnlocked = player.level >= tier.unlockLevel
          return (
            <div key={tier.unlockLevel} className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-aether-cyan" />
                <h2 className="text-sm font-semibold text-aether-cyan">
                  Уровень {tier.unlockLevel}
                </h2>
                {!tierUnlocked && (
                  <Badge variant="common" className="text-[10px]">
                    <Lock className="h-3 w-3 mr-1" />Нужен ур. {tier.unlockLevel}
                  </Badge>
                )}
              </div>

              {tier.skillIds.map((skillId) => {
                const skill = UNIVERSAL_SKILLS[skillId]
                const level = levels[skillId] ?? 0
                const maxed = level >= UNIVERSAL_SKILL_MAX_LEVEL
                const canSpend = tierUnlocked && !maxed && availablePoints > 0
                const scaled = level > 0 ? getScaledUniversalSkill(skill, level) : null

                return (
                  <Card key={skillId} className={!tierUnlocked ? 'opacity-50' : ''}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{skill.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-white">{skill.nameRu}</span>
                            {level > 0 ? (
                              <Badge variant="rare">Ур. {level}/{UNIVERSAL_SKILL_MAX_LEVEL}</Badge>
                            ) : (
                              <Badge variant="common">Не изучен</Badge>
                            )}
                            {skill.effect === 'passive' && (
                              <Badge variant="rare" className="text-[9px]">Пассив</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{skill.descriptionRu}</p>
                          {scaled && skill.effect !== 'passive' && (
                            <p className="text-[10px] text-aether-cyan mt-1">
                              {skill.healPercent > 0 && skill.damageMultiplier === 0
                                ? `Исцеление: ${Math.round(scaled.healPercent * 100)}% HP`
                                : skill.damageMultiplier > 0 && skill.healPercent > 0
                                  ? `Урон ×${scaled.damageMultiplier.toFixed(1)} · Вамп ${Math.round(scaled.healPercent * 100)}%`
                                  : `Урон ×${scaled.damageMultiplier.toFixed(1)}`}
                              {scaled.cooldown > 0 && ` · CD ${scaled.cooldown}с · ⚡${scaled.energyCost}`}
                            </p>
                          )}
                          {level > 0 && (
                            <Progress value={(level / UNIVERSAL_SKILL_MAX_LEVEL) * 100} className="mt-2 h-1" />
                          )}
                          {canSpend && (
                            <Button size="sm" className="mt-2 w-full" onClick={() => handleSpend(skillId)}>
                              {level === 0 ? 'Изучить (−1 очко)' : `Улучшить (−1 очко) → ур. ${level + 1}`}
                            </Button>
                          )}
                          {maxed && (
                            <p className="text-[10px] text-aether-gold mt-2">Максимальный уровень</p>
                          )}
                          {tierUnlocked && !maxed && availablePoints === 0 && level === 0 && (
                            <p className="text-[10px] text-slate-500 mt-2">Нет свободных очков</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
