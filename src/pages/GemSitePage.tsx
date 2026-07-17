import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { ProfessionGrindPage } from '@/components/ui/ProfessionGrindPage'
import { GEM_SITE_LEVELS } from '@/data/gemSiteLevels'
import { BASIC_RESOURCE_IDS, ORE_RESOURCE_IDS } from '@/data/resourceCatalog'

const GEM_RESOURCE_IDS = [...BASIC_RESOURCE_IDS.filter((id) => ['gem_shard', 'mana_crystal', 'star_shard', 'aether_dust', 'abyssal_pearl', 'upgrade_core'].includes(id)), ...ORE_RESOURCE_IDS.filter((id) => ['raw_diamond'].includes(id))]

export function GemSitePage() {
  const player = usePlayerStore((s) => s.player)
  const performGemDig = usePlayerStore((s) => s.performGemDig)
  const [selectedLevel, setSelectedLevel] = useState(player?.gemSiteLevel ?? 1)

  useEffect(() => {
    if (player?.gemSiteLevel != null) setSelectedLevel(player.gemSiteLevel)
  }, [player?.gemSiteLevel])

  if (!player) return null

  return (
    <ProfessionGrindPage
      title="Кристальные рудники"
      xpLabel="Опыт добычи"
      actionVerb="Копать"
      levels={GEM_SITE_LEVELS}
      xp={player.gemSiteXp ?? 0}
      selectedLevel={selectedLevel}
      onSelectLevel={setSelectedLevel}
      professionId="jeweler"
      requiredTool="pickaxe"
      missingToolLabel="Купите кирку в магазине"
      perform={performGemDig}
      stockSections={[{ id: 'gems', titleRu: 'Кристаллы', resourceIds: GEM_RESOURCE_IDS }]}
    />
  )
}
