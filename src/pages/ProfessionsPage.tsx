import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MissingResourcesModal } from '@/components/ui/MissingResourcesModal'
import { usePlayerStore } from '@/store/playerStore'
import {
  PROFESSIONS,
  MYTHIC_SKILLS,
  RESOURCES,
  isProfessionMaxed,
  getProfessionSkillUpgradeCost,
  getProfessionMythicSkillUpgradeCost,
  type ProfessionUpgradeCost,
} from '@/data/classes'
import { getActivitiesForProfession } from '@/data/professionActivities'
import { TOOL_LABELS, playerHasTool } from '@/data/tools'
import {
  getActiveProfessions,
  getProfessionExp,
  getProfessionRankProgress,
  getProfessionSlotLimit,
  professionRankRequiredForSkill,
  canUpgradeProfessionSkill,
  canUpgradeProfessionMythicSkill,
  isProfessionActive,
} from '@/lib/professionProgress'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { useLocaleStore } from '@/store/localeStore'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { ProfessionId } from '@/types/game'
import type { MissingCost } from '@/lib/craftCosts'

function formatUpgradeCost(cost: ProfessionUpgradeCost): string {
  const parts = [`🪙${cost.gold}`]
  for (const [rid, amount] of Object.entries(cost.resources)) {
    if (!amount || amount <= 0) continue
    parts.push(`${RESOURCES[rid as keyof typeof RESOURCES].icon}${amount}`)
  }
  return parts.join(' · ')
}

export function ProfessionsPage() {
  const navigate = useNavigate()
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const player = usePlayerStore((s) => s.player)
  const toggleActiveProfession = usePlayerStore((s) => s.toggleActiveProfession)
  const performProfessionGrind = usePlayerStore((s) => s.performProfessionGrind)
  const upgradeProfessionSkill = usePlayerStore((s) => s.upgradeProfessionSkill)
  const upgradeProfessionMythicSkill = usePlayerStore((s) => s.upgradeProfessionMythicSkill)
  const getProfessionSkillMissing = usePlayerStore((s) => s.getProfessionSkillMissing)
  const getProfessionMythicSkillMissing = usePlayerStore((s) => s.getProfessionMythicSkillMissing)
  const [activeProf, setActiveProf] = useState<ProfessionId | null>(player?.profession ?? null)
  const [missingModal, setMissingModal] = useState<{ title: string; missing: MissingCost[] } | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const activeList = getActiveProfessions(player)
  const slotLimit = getProfessionSlotLimit(player)
  const prof = activeProf ? PROFESSIONS.find((p) => p.id === activeProf) : null
  const levels = activeProf ? (player.professionLevels[activeProf] ?? new Array(10).fill(0)) : []
  const mythicLevels = activeProf ? (player.professionMythicLevels[activeProf] ?? new Array(5).fill(0)) : []
  const mythicUnlocked = activeProf ? isProfessionMaxed(activeProf, levels) : false
  const mythicSkills = activeProf ? MYTHIC_SKILLS[activeProf] : []
  const profRank = activeProf
    ? getProfessionRankProgress(getProfessionExp(player, activeProf))
    : null
  const activities = activeProf ? getActivitiesForProfession(activeProf) : []

  function profLabel(id: ProfessionId) {
    return t(`professions.${id}` as import('@/lib/i18n').TranslationKey)
  }

  function showMissing(title: string, missing: MissingCost[]) {
    setMissingModal({ title, missing })
    hapticError()
  }

  function handleToggleActive(professionId: ProfessionId, e: React.MouseEvent) {
    e.stopPropagation()
    if (toggleActiveProfession(professionId)) hapticSuccess()
    else hapticError()
  }

  function handleSkillUpgrade(professionId: ProfessionId, skillIndex: number) {
    if (!canUpgradeProfessionSkill(player!, professionId, skillIndex)) {
      hapticError()
      return
    }
    const rank = getProfessionRankProgress(getProfessionExp(player!, professionId)).rank
    if (rank < professionRankRequiredForSkill(skillIndex)) {
      hapticError()
      return
    }
    const missing = getProfessionSkillMissing(professionId, skillIndex)
    if (missing.length > 0) {
      showMissing('Недостаточно для улучшения навыка', missing)
      return
    }
    if (upgradeProfessionSkill(professionId, skillIndex)) hapticSuccess()
    else hapticError()
  }

  function handleMythicUpgrade(professionId: ProfessionId, skillIndex: number) {
    if (!canUpgradeProfessionMythicSkill(player!, professionId)) {
      hapticError()
      return
    }
    const missing = getProfessionMythicSkillMissing(professionId, skillIndex)
    if (missing.length > 0) {
      showMissing('Недостаточно для мифического навыка', missing)
      return
    }
    if (upgradeProfessionMythicSkill(professionId, skillIndex)) hapticSuccess()
    else hapticError()
  }

  function handleGrind(activityId: string) {
    if (performProfessionGrind(activityId)) hapticSuccess()
    else hapticError()
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <MissingResourcesModal
        open={!!missingModal}
        title={missingModal?.title ?? ''}
        missing={missingModal?.missing ?? []}
        onClose={() => setMissingModal(null)}
      />

      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">{t('professions.title')}</h1>
        <Badge className="ml-auto text-[10px]">{activeList.length}/{slotLimit} активных</Badge>
      </div>

      <div className="p-4 grid grid-cols-2 gap-2">
        {PROFESSIONS.map((p) => {
          const isActive = activeList.includes(p.id)
          return (
            <Card
              key={p.id}
              className={`cursor-pointer ${activeProf === p.id ? 'border-aether-cyan glow-cyan' : ''}`}
              onClick={() => setActiveProf(p.id)}
            >
              <CardContent className="p-3 text-center">
                <div className="text-3xl">{p.icon}</div>
                <div className="text-xs font-bold text-white mt-1">{profLabel(p.id)}</div>
                {isActive && (
                  <div className="text-[9px] text-aether-cyan">★ Активна</div>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? 'secondary' : 'default'}
                  className="w-full mt-2 h-7 text-[10px]"
                  onClick={(e) => handleToggleActive(p.id, e)}
                >
                  {isActive ? 'Снять' : activeList.length >= slotLimit ? 'Слоты заняты' : 'Активировать'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {prof && profRank && (
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-400 mb-2">
            {locale === 'ru' ? prof.descriptionRu : prof.description}
          </p>
          <Card className="mb-3">
            <CardContent className="p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white">Ранг профессии</span>
                <span className="text-aether-cyan">{profRank.rank} / 30</span>
              </div>
              <Progress value={(profRank.intoRank / profRank.needed) * 100} />
              <div className="text-[10px] text-slate-500 mt-1">
                {profRank.intoRank} / {profRank.needed} XP до следующего ранга
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="farm">
            <TabsList className="w-full mb-3">
              <TabsTrigger value="farm" className="flex-1 text-xs">Фарм</TabsTrigger>
              <TabsTrigger value="skills" className="flex-1 text-xs">{t('professions.skillTree')}</TabsTrigger>
            </TabsList>

            <TabsContent value="farm">
              <div className="space-y-2">
                {activities.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">Нет доступных активностей</p>
                )}
                {activities.map((act) => {
                  const rankOk = !act.minRank || profRank.rank >= act.minRank
                  const toolOk = !act.requiredTool || playerHasTool(player, act.requiredTool)
                  const baitCount = act.consumesItemId
                    ? player.inventory.filter((i) => i.id === act.consumesItemId).length
                    : 0
                  const baitOk = !act.consumesItemId || baitCount > 0
                  const canDo = activeList.includes(act.professionId) && rankOk && toolOk && baitOk
                  const rewardStr = Object.entries(act.rewards)
                    .filter(([, v]) => v)
                    .map(([rid, v]) => `${RESOURCES[rid as keyof typeof RESOURCES].icon}${v}`)
                    .join(' ')

                  return (
                    <Card key={act.id}>
                      <CardContent className="p-3">
                        <div className="flex gap-2 items-start">
                          <div className="text-2xl">{act.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">{act.nameRu}</div>
                            <div className="text-[10px] text-slate-400">{act.descriptionRu}</div>
                            <div className="text-[10px] text-aether-cyan mt-1">
                              ⚡{act.energyCost} · +{act.professionXp} XP · {rewardStr}
                            </div>
                            {act.requiredTool && (
                              <div className={`text-[9px] mt-0.5 ${toolOk ? 'text-slate-500' : 'text-red-400'}`}>
                                Нужно: {TOOL_LABELS[act.requiredTool as keyof typeof TOOL_LABELS] ?? act.requiredTool}
                              </div>
                            )}
                            {act.minRank && !rankOk && (
                              <div className="text-[9px] text-red-400">Ранг {act.minRank}+</div>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="w-full mt-2"
                          disabled={!canDo}
                          onClick={() => handleGrind(act.id)}
                        >
                          Выполнить
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="skills">
              <div className="space-y-2">
                {prof.skills.map((skill, idx) => {
                  const lvl = levels[idx] ?? 0
                  const maxed = lvl >= skill.maxLevel
                  const cost = getProfessionSkillUpgradeCost(prof.id, idx, lvl)
                  const rankReq = professionRankRequiredForSkill(idx)
                  const rankLocked = profRank.rank < rankReq
                  const inactiveLocked = !canUpgradeProfessionSkill(player, prof.id, idx)
                  const profActive = isProfessionActive(player, prof.id)
                  return (
                    <Card key={skill.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <div className="text-sm font-medium text-white">{skill.nameRu}</div>
                            <div className="text-[10px] text-slate-400">{skill.descriptionRu}</div>
                            {rankLocked && (
                              <div className="text-[9px] text-amber-400">Ранг профессии {rankReq}+</div>
                            )}
                            {inactiveLocked && (
                              <div className="text-[9px] text-slate-500">Активируйте профессию для улучшения</div>
                            )}
                            {!profActive && idx === 0 && (
                              <div className="text-[9px] text-aether-cyan">Базовый навык доступен без активации</div>
                            )}
                          </div>
                          <span className="text-xs text-aether-cyan">Ур.{lvl}/{skill.maxLevel}</span>
                        </div>
                        <Progress value={(lvl / skill.maxLevel) * 100} className="mb-2" />
                        <Button
                          type="button"
                          size="sm"
                          variant={maxed ? 'secondary' : 'default'}
                          className="w-full"
                          disabled={maxed || rankLocked || inactiveLocked}
                          onClick={() => handleSkillUpgrade(prof.id, idx)}
                        >
                          {maxed
                            ? t('professions.maxed')
                            : `${t('professions.upgrade')} · ${cost ? formatUpgradeCost(cost) : ''}`}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {mythicUnlocked && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-sm font-semibold text-white">Мифический уровень</h2>
                    <Badge variant="mythic">✦ Разблокировано</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Все навыки профессии на максимуме. Доступны 5 мифических навыков.
                  </p>
                  <div className="space-y-2">
                    {mythicSkills.map((skill, idx) => {
                      const lvl = mythicLevels[idx] ?? 0
                      const maxed = lvl >= skill.maxLevel
                      const cost = getProfessionMythicSkillUpgradeCost(prof.id, idx, lvl)
                      const mythicInactive = !canUpgradeProfessionMythicSkill(player, prof.id)
                      return (
                        <Card key={skill.id} className="border-fuchsia-500/30">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <div className="text-sm font-medium text-fuchsia-300">{skill.nameRu}</div>
                                <div className="text-[10px] text-slate-400">{skill.descriptionRu}</div>
                                {mythicInactive && (
                                  <div className="text-[9px] text-slate-500">Нужна активная профессия</div>
                                )}
                              </div>
                              <span className="text-xs text-fuchsia-400">Ур.{lvl}/{skill.maxLevel}</span>
                            </div>
                            <Progress value={(lvl / skill.maxLevel) * 100} className="mb-2" />
                            <Button
                              type="button"
                              size="sm"
                              variant={maxed ? 'secondary' : 'gold'}
                              className="w-full"
                              disabled={maxed || mythicInactive}
                              onClick={() => handleMythicUpgrade(prof.id, idx)}
                            >
                              {maxed
                                ? t('professions.maxed')
                                : `${t('professions.upgrade')} · ${cost ? formatUpgradeCost(cost) : ''}`}
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
