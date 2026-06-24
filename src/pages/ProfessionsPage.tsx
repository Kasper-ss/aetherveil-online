import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
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
  const setProfession = usePlayerStore((s) => s.setProfession)
  const upgradeProfessionSkill = usePlayerStore((s) => s.upgradeProfessionSkill)
  const upgradeProfessionMythicSkill = usePlayerStore((s) => s.upgradeProfessionMythicSkill)
  const getProfessionSkillMissing = usePlayerStore((s) => s.getProfessionSkillMissing)
  const getProfessionMythicSkillMissing = usePlayerStore((s) => s.getProfessionMythicSkillMissing)
  const [activeProf, setActiveProf] = useState<ProfessionId | null>(player?.profession ?? null)
  const [missingModal, setMissingModal] = useState<{ title: string; missing: MissingCost[] } | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const prof = activeProf ? PROFESSIONS.find((p) => p.id === activeProf) : null
  const levels = activeProf ? (player.professionLevels[activeProf] ?? new Array(10).fill(0)) : []
  const mythicLevels = activeProf ? (player.professionMythicLevels[activeProf] ?? new Array(5).fill(0)) : []
  const mythicUnlocked = activeProf ? isProfessionMaxed(activeProf, levels) : false
  const mythicSkills = activeProf ? MYTHIC_SKILLS[activeProf] : []

  function profLabel(id: ProfessionId) {
    return t(`professions.${id}` as import('@/lib/i18n').TranslationKey)
  }

  function showMissing(title: string, missing: MissingCost[]) {
    setMissingModal({ title, missing })
    hapticError()
  }

  function handleSkillUpgrade(professionId: ProfessionId, skillIndex: number) {
    const missing = getProfessionSkillMissing(professionId, skillIndex)
    if (missing.length > 0) {
      showMissing('Недостаточно для улучшения навыка', missing)
      return
    }
    if (upgradeProfessionSkill(professionId, skillIndex)) hapticSuccess()
    else hapticError()
  }

  function handleMythicUpgrade(professionId: ProfessionId, skillIndex: number) {
    const missing = getProfessionMythicSkillMissing(professionId, skillIndex)
    if (missing.length > 0) {
      showMissing('Недостаточно для мифического навыка', missing)
      return
    }
    if (upgradeProfessionMythicSkill(professionId, skillIndex)) hapticSuccess()
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
      </div>

      <div className="p-4 grid grid-cols-2 gap-2">
        {PROFESSIONS.map((p) => (
          <Card
            key={p.id}
            className={`cursor-pointer ${activeProf === p.id ? 'border-aether-cyan glow-cyan' : ''}`}
            onClick={() => { setActiveProf(p.id); setProfession(p.id) }}
          >
            <CardContent className="p-3 text-center">
              <div className="text-3xl">{p.icon}</div>
              <div className="text-xs font-bold text-white mt-1">{profLabel(p.id)}</div>
              {player.profession === p.id && (
                <div className="text-[9px] text-aether-cyan">★ Активна</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {prof && (
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-400 mb-3">
            {locale === 'ru' ? prof.descriptionRu : prof.description}
          </p>
          <h2 className="text-sm font-semibold text-white mb-2">{t('professions.skillTree')}</h2>
          <div className="space-y-2">
            {prof.skills.map((skill, idx) => {
              const lvl = levels[idx] ?? 0
              const maxed = lvl >= skill.maxLevel
              const cost = getProfessionSkillUpgradeCost(prof.id, idx, lvl)
              return (
                <Card key={skill.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-sm font-medium text-white">{skill.nameRu}</div>
                        <div className="text-[10px] text-slate-400">{skill.descriptionRu}</div>
                      </div>
                      <span className="text-xs text-aether-cyan">Ур.{lvl}/{skill.maxLevel}</span>
                    </div>
                    <Progress value={(lvl / skill.maxLevel) * 100} className="mb-2" />
                    <Button
                      type="button"
                      size="sm"
                      variant={maxed ? 'secondary' : 'default'}
                      className="w-full"
                      disabled={maxed}
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
                  return (
                    <Card key={skill.id} className="border-fuchsia-500/30">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <div className="text-sm font-medium text-fuchsia-300">{skill.nameRu}</div>
                            <div className="text-[10px] text-slate-400">{skill.descriptionRu}</div>
                          </div>
                          <span className="text-xs text-fuchsia-400">Ур.{lvl}/{skill.maxLevel}</span>
                        </div>
                        <Progress value={(lvl / skill.maxLevel) * 100} className="mb-2" />
                        <Button
                          type="button"
                          size="sm"
                          variant={maxed ? 'secondary' : 'gold'}
                          className="w-full"
                          disabled={maxed}
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
        </div>
      )}
    </div>
  )
}
