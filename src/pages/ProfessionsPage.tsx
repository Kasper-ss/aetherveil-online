import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import {
  PROFESSION_CATALOG,
  getProfessionCatalogEntry,
  type ProfessionCatalogEntry,
} from '@/data/professionCatalog'
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
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { ProfessionId } from '@/types/game'
import type { MissingCost } from '@/lib/craftCosts'

const CATALOG_GRIND_ROUTES: Record<string, { path: string; label: string }> = {
  mining: { path: '/mine', label: '⛏️ Перейти в шахту' },
  herbalism: { path: '/field', label: '🌿 Перейти на поле трав' },
  skinning: { path: '/hunt', label: '🏹 Охотничьи угодья' },
  jewelcrafting: { path: '/gems', label: '💠 Кристальные рудники' },
  enchanting: { path: '/aether', label: '✨ Эфирный разлом' },
}

function formatUpgradeCost(cost: ProfessionUpgradeCost): string {
  const parts = [`🪙${cost.gold}`]
  for (const [rid, amount] of Object.entries(cost.resources)) {
    if (!amount || amount <= 0) continue
    parts.push(`${RESOURCES[rid as keyof typeof RESOURCES].icon}${amount}`)
  }
  return parts.join(' · ')
}

function ProfessionCompareRow({ entry }: { entry: ProfessionCatalogEntry }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-400 py-1 border-b border-aether-border/50 last:border-0">
      <span className="text-lg">{entry.icon}</span>
      <span className="text-white flex-1">{entry.nameRu}</span>
      <Badge variant="default" className={`text-[9px] ${entry.type === 'gathering' ? 'text-aether-cyan' : 'text-aether-gold'}`}>
        {entry.typeLabelRu}
      </Badge>
    </div>
  )
}

function ProfessionSkillTree({
  gameProfessionId,
  player,
  onMissing,
}: {
  gameProfessionId: ProfessionId
  player: NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>
  onMissing: (title: string, missing: MissingCost[]) => void
}) {
  const upgradeProfessionSkill = usePlayerStore((s) => s.upgradeProfessionSkill)
  const upgradeProfessionMythicSkill = usePlayerStore((s) => s.upgradeProfessionMythicSkill)
  const getProfessionSkillMissing = usePlayerStore((s) => s.getProfessionSkillMissing)
  const getProfessionMythicSkillMissing = usePlayerStore((s) => s.getProfessionMythicSkillMissing)

  const prof = PROFESSIONS.find((p) => p.id === gameProfessionId)
  if (!prof) return null

  const levels = player.professionLevels[gameProfessionId] ?? new Array(10).fill(0)
  const mythicLevels = player.professionMythicLevels[gameProfessionId] ?? new Array(5).fill(0)
  const mythicUnlocked = isProfessionMaxed(gameProfessionId, levels)
  const mythicSkills = MYTHIC_SKILLS[gameProfessionId]
  const profRank = getProfessionRankProgress(getProfessionExp(player, gameProfessionId))
  const profActive = isProfessionActive(player, gameProfessionId)

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white">Ранг в игре</span>
            <span className="text-aether-cyan">{profRank.rank} / 30</span>
          </div>
          <Progress value={(profRank.intoRank / profRank.needed) * 100} />
          <p className="text-[10px] text-slate-500 mt-1">
            {profActive ? '★ Основная профессия' : 'Вспомогательная — только 1-й навык'}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {prof.skills.map((skill, idx) => {
          const lvl = levels[idx] ?? 0
          const maxed = lvl >= skill.maxLevel
          const cost = getProfessionSkillUpgradeCost(prof.id, idx, lvl)
          const rankReq = professionRankRequiredForSkill(idx)
          const rankLocked = profRank.rank < rankReq
          const inactiveLocked = !canUpgradeProfessionSkill(player, prof.id, idx)
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
                  disabled={maxed || rankLocked || inactiveLocked}
                  onClick={() => {
                    const missing = getProfessionSkillMissing(prof.id, idx)
                    if (missing.length > 0) {
                      onMissing('Недостаточно для улучшения навыка', missing)
                      return
                    }
                    if (upgradeProfessionSkill(prof.id, idx)) hapticSuccess()
                    else hapticError()
                  }}
                >
                  {maxed ? 'Макс.' : `Улучшить · ${cost ? formatUpgradeCost(cost) : ''}`}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {mythicUnlocked && (
        <div className="space-y-2">
          <Badge variant="mythic">Мифические навыки</Badge>
          {mythicSkills.map((skill, idx) => {
            const lvl = mythicLevels[idx] ?? 0
            const maxed = lvl >= skill.maxLevel
            const cost = getProfessionMythicSkillUpgradeCost(prof.id, idx, lvl)
            const mythicInactive = !canUpgradeProfessionMythicSkill(player, prof.id)
            return (
              <Card key={skill.id} className="border-fuchsia-500/30">
                <CardContent className="p-3">
                  <div className="text-sm font-medium text-fuchsia-300">{skill.nameRu}</div>
                  <div className="text-[10px] text-slate-400 mb-2">{skill.descriptionRu}</div>
                  <Button
                    type="button"
                    size="sm"
                    variant={maxed ? 'secondary' : 'gold'}
                    className="w-full"
                    disabled={maxed || mythicInactive}
                    onClick={() => {
                      const missing = getProfessionMythicSkillMissing(prof.id, idx)
                      if (missing.length > 0) {
                        onMissing('Недостаточно для мифического навыка', missing)
                        return
                      }
                      if (upgradeProfessionMythicSkill(prof.id, idx)) hapticSuccess()
                      else hapticError()
                    }}
                  >
                    {maxed ? 'Макс.' : `Улучшить · ${cost ? formatUpgradeCost(cost) : ''}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProfessionDetail({
  entry,
  player,
  onBack,
  onMissing,
}: {
  entry: ProfessionCatalogEntry
  player: NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>
  onBack: () => void
  onMissing: (title: string, missing: MissingCost[]) => void
}) {
  const navigate = useNavigate()
  const toggleActiveProfession = usePlayerStore((s) => s.toggleActiveProfession)
  const activeList = getActiveProfessions(player)
  const slotLimit = getProfessionSlotLimit(player)
  const gameId = entry.gameProfessionId
  const isActive = gameId ? activeList.includes(gameId) : false

  return (
    <div className="pb-6">
      <div className="p-4 border-b border-aether-border">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{entry.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">{entry.nameRu}</h2>
            <p className="text-[10px] text-slate-500">{entry.nameEn}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="default" className={entry.type === 'gathering' ? 'text-aether-cyan' : 'text-aether-gold'}>{entry.typeLabelRu}</Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">{entry.descriptionRu}</p>
      </div>

      <div className="p-4 space-y-3">
        {CATALOG_GRIND_ROUTES[entry.id] && (
          <Button
            variant="outline"
            className="w-full text-xs"
            onClick={() => navigate(CATALOG_GRIND_ROUTES[entry.id].path)}
          >
            {CATALOG_GRIND_ROUTES[entry.id].label}
          </Button>
        )}

        {entry.passiveBonusRu && (
          <Card>
            <CardContent className="p-3">
              <div className="text-[10px] text-slate-500 mb-1">Пассивный бонус</div>
              <div className="text-sm text-aether-cyan">{entry.passiveBonusRu}</div>
            </CardContent>
          </Card>
        )}

        {entry.activeAbilityRu && (
          <Card>
            <CardContent className="p-3">
              <div className="text-[10px] text-slate-500 mb-1">Активная способность</div>
              <div className="text-sm text-green-400">{entry.activeAbilityRu}</div>
            </CardContent>
          </Card>
        )}

        {entry.mainBonusesRu.length > 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="text-[10px] text-slate-500 mb-2">Основные бонусы</div>
              <ul className="space-y-1">
                {entry.mainBonusesRu.map((b) => (
                  <li key={b} className="text-xs text-slate-300">• {b}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {entry.specializations.length > 0 && (
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="text-sm font-semibold text-white">Ветки специализаций</div>
              {entry.specializations.map((spec) => (
                <div key={spec.id} className="border-t border-aether-border/50 pt-2 first:border-0 first:pt-0">
                  <div className="text-sm font-medium text-aether-cyan">{spec.nameRu}</div>
                  <p className="text-[10px] text-slate-400 mb-1">{spec.descriptionRu}</p>
                  <ul className="space-y-0.5">
                    {spec.benefitsRu.map((b) => (
                      <li key={b} className="text-[10px] text-slate-300">✦ {b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-3">
            <div className="text-sm font-semibold text-white mb-2">Лучшие комбинации</div>
            {entry.combos.map((c) => (
              <div key={c.professionName} className="mb-2 last:mb-0">
                <span className="text-xs text-aether-gold">{c.professionName}</span>
                <p className="text-[10px] text-slate-400">{c.reasonRu}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="text-sm font-semibold text-white mb-1">Сравнение</div>
            <p className="text-[10px] text-slate-400 mb-2">{entry.compareNoteRu}</p>
            {PROFESSION_CATALOG.filter((p) => p.id !== entry.id).slice(0, 4).map((p) => (
              <ProfessionCompareRow key={p.id} entry={p} />
            ))}
          </CardContent>
        </Card>

        {gameId && (
          <Tabs defaultValue="progress">
            <TabsList className="w-full">
              <TabsTrigger value="progress" className="flex-1 text-xs">Прокачка</TabsTrigger>
            </TabsList>
            <TabsContent value="progress" className="mt-3">
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? 'secondary' : 'default'}
                  className="flex-1 text-xs"
                  onClick={() => {
                    if (toggleActiveProfession(gameId)) hapticSuccess()
                    else hapticError()
                  }}
                >
                  {isActive ? 'Снять с основных' : activeList.length >= slotLimit ? 'Слоты заняты' : 'Сделать основной'}
                </Button>
              </div>
              <ProfessionSkillTree
                gameProfessionId={gameId}
                player={player}
                onMissing={onMissing}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <div className="px-4">
        <Button variant="outline" className="w-full" onClick={onBack}>← К списку профессий</Button>
      </div>
    </div>
  )
}

export function ProfessionsPage() {
  const navigate = useNavigate()
  const { professionId } = useParams<{ professionId?: string }>()
  const player = usePlayerStore((s) => s.player)
  const [missingModal, setMissingModal] = useState<{ title: string; missing: MissingCost[] } | null>(null)

  const entry = professionId ? getProfessionCatalogEntry(professionId) : null
  const activeList = player ? getActiveProfessions(player) : []
  const slotLimit = player ? getProfessionSlotLimit(player) : 2

  useTelegramBackButton(() => {
    if (entry) navigate('/professions')
    else navigate('/')
  }, true)

  if (!player) return null

  function showMissing(title: string, missing: MissingCost[]) {
    setMissingModal({ title, missing })
    hapticError()
  }

  if (entry) {
    return (
      <div className="h-full overflow-y-auto page-enter">
        <MissingResourcesModal
          open={!!missingModal}
          title={missingModal?.title ?? ''}
          missing={missingModal?.missing ?? []}
          onClose={() => setMissingModal(null)}
        />
        <div className="flex items-center gap-3 p-4 border-b border-aether-border">
          <Button variant="ghost" size="icon" onClick={() => navigate('/professions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold truncate">{entry.nameRu}</h1>
        </div>
        <ProfessionDetail
          entry={entry}
          player={player}
          onBack={() => navigate('/professions')}
          onMissing={showMissing}
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Профессии</h1>
        <Badge className="ml-auto text-[10px]">{activeList.length}/{slotLimit} основных</Badge>
      </div>

      <p className="px-4 py-2 text-[11px] text-slate-400">
        Выберите профессию для описания и прокачки навыков. До 3 основных — полное древо.
      </p>

      <Card className="mx-4 mb-2 border-aether-cyan/30">
        <CardContent className="p-3 text-[10px] text-slate-400 space-y-1">
          <p className="text-xs font-medium text-aether-cyan">Как прокачивать профессии</p>
          <p>1. <span className="text-slate-300">XP ранга</span> — добывайте в точках сбора. На низких уровнях нужно мало XP, дальше — больше.</p>
          <p>2. <span className="text-slate-300">Навыки</span> — откройте профессию → «Прокачка» → улучшайте за золото и ресурсы.</p>
          <p>3. <span className="text-slate-300">Основные слоты</span> — назначьте до {slotLimit} профессий основными, чтобы открыть все навыки и мифические ветки.</p>
        </CardContent>
      </Card>

      <div className="p-4 grid grid-cols-2 gap-3">
        {PROFESSION_CATALOG.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer hover:border-aether-cyan/50 transition-colors"
            onClick={() => navigate(`/professions/${p.id}`)}
          >
            <CardContent className="p-3 text-center">
              <div className="text-3xl mb-1">{p.icon}</div>
              <div className="text-xs font-bold text-white">{p.nameRu}</div>
              <Badge
                variant="default"
                className={`text-[8px] mt-1 ${p.type === 'gathering' ? 'text-aether-cyan' : 'text-aether-gold'}`}
              >
                {p.typeLabelRu}
              </Badge>
              <p className="text-[9px] text-slate-500 mt-2 line-clamp-2">{p.summaryRu}</p>
              {p.gameProfessionId && activeList.includes(p.gameProfessionId) && (
                <div className="text-[9px] text-aether-cyan mt-1">★ Основная</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
