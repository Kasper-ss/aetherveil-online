import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { MissingResourcesModal } from '@/components/ui/MissingResourcesModal'
import { usePlayerStore } from '@/store/playerStore'
import { SKILLS, CLASS_SKILL_TREES, getSkillUpgradeCost, getScaledSkill, SKILL_MAX_LEVEL } from '@/data/playerSkills'
import { getSkillDebuffDescription } from '@/lib/skillDebuffs'
import { getClassData, RESOURCES } from '@/data/classes'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { PlayerClass, SkillId } from '@/types/game'
import type { MissingCost } from '@/lib/craftCosts'

function formatCost(gold: number, resources: Partial<Record<string, number>>): string {
  const parts = [`🪙${gold}`]
  for (const [rid, amount] of Object.entries(resources)) {
    if (!amount || amount <= 0) continue
    parts.push(`${RESOURCES[rid as keyof typeof RESOURCES].icon}${amount}`)
  }
  return parts.join(' · ')
}

function SkillTreeSection({
  classId,
  player,
  onUpgrade,
  title,
}: {
  classId: PlayerClass
  player: NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>
  onUpgrade: (skillId: SkillId) => void
  title: string
}) {
  const t = useT()
  const tree = CLASS_SKILL_TREES[classId]

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-aether-cyan">{title}</h2>
      {tree.map((node) => {
        const skill = SKILLS[node.skillId]
        const unlocked = player.level >= node.unlockLevel
        const owned = player.skills.includes(node.skillId)
        const level = player.skillLevels[node.skillId] ?? 0
        const scaled = owned ? getScaledSkill(skill, level) : null
        const cost = owned && level < SKILL_MAX_LEVEL ? getSkillUpgradeCost(node.skillId, level) : null
        const maxed = level >= SKILL_MAX_LEVEL

        return (
          <Card key={`${classId}_${node.skillId}`} className={!unlocked ? 'opacity-50' : ''}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{skill.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{skill.nameRu}</span>
                    {owned ? (
                      <Badge variant="rare">Ур. {level}/{SKILL_MAX_LEVEL}</Badge>
                    ) : (
                      <Badge variant="common"><Lock className="h-3 w-3 mr-1" />{t('skills.unlockAt')} {node.unlockLevel}</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{skill.descriptionRu}</p>
                  <p className="text-[10px] text-amber-400/90 mt-0.5">{getSkillDebuffDescription(node.skillId)}</p>
                  {scaled && (
                    <p className="text-[10px] text-aether-cyan mt-1">
                      {skill.healPercent > 0 && skill.damageMultiplier === 0
                        ? `Исцеление: ${Math.round(scaled.healPercent * 100)}% HP`
                        : `Урон ×${scaled.damageMultiplier.toFixed(1)}`}
                      {' · '}Перезарядка: {scaled.cooldown}с · Энергия: {scaled.energyCost}
                    </p>
                  )}
                  {owned && !maxed && cost && (
                    <>
                      <Progress value={(level / SKILL_MAX_LEVEL) * 100} className="mt-2 h-1" />
                      <p className="text-[10px] text-slate-500 mt-1">
                        {t('skills.upgradeCost')}: {formatCost(cost.gold, cost.resources)}
                      </p>
                      <Button size="sm" className="mt-2 w-full" onClick={() => onUpgrade(node.skillId)}>
                        {t('skills.upgrade')}
                      </Button>
                    </>
                  )}
                  {maxed && <p className="text-[10px] text-aether-gold mt-2">{t('skills.maxed')}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function SkillsPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const upgradePlayerSkill = usePlayerStore((s) => s.upgradePlayerSkill)
  const getPlayerSkillMissing = usePlayerStore((s) => s.getPlayerSkillMissing)
  const [missingModal, setMissingModal] = useState<{ title: string; missing: MissingCost[] } | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player || !player.classId) return null

  const primaryName = getClassData(player.classId).nameRu
  const secondaryName = player.secondaryClassId ? getClassData(player.secondaryClassId).nameRu : null

  function handleUpgrade(skillId: SkillId) {
    const missing = getPlayerSkillMissing(skillId)
    if (missing.length > 0) {
      setMissingModal({ title: t('skills.upgradeMissing'), missing })
      hapticError()
      return
    }
    if (upgradePlayerSkill(skillId)) hapticSuccess()
    else hapticError()
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{t('skills.title')}</h1>
          <p className="text-xs text-slate-400">{t('skills.subtitle')}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <SkillTreeSection
          classId={player.classId}
          player={player}
          onUpgrade={handleUpgrade}
          title={`Основной класс · ${primaryName}`}
        />
        {player.secondaryClassId && (
          <SkillTreeSection
            classId={player.secondaryClassId}
            player={player}
            onUpgrade={handleUpgrade}
            title={`Второй класс · ${secondaryName}`}
          />
        )}
        {!player.secondaryClassId && player.highestFloor >= 10 && (
          <p className="text-xs text-slate-500 text-center">
            Доступен второй класс — выберите его в уведомлении при входе в игру.
          </p>
        )}
      </div>

      {missingModal && (
        <MissingResourcesModal
          open
          title={missingModal.title}
          missing={missingModal.missing}
          onClose={() => setMissingModal(null)}
        />
      )}
    </div>
  )
}
