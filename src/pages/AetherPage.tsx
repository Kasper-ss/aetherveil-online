import { useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { ProfessionGrindPage } from '@/components/ui/ProfessionGrindPage'
import { AETHER_RIFT_LEVELS } from '@/data/aetherRiftLevels'
import { BASIC_RESOURCE_IDS, HERB_RESOURCE_IDS } from '@/data/resourceCatalog'

const AETHER_RESOURCE_IDS = [...BASIC_RESOURCE_IDS.filter((id) => ['mana_crystal', 'aether_dust', 'star_shard', 'gem_shard', 'abyssal_pearl'].includes(id)), ...HERB_RESOURCE_IDS.filter((id) => id !== 'herb')]

export function AetherPage() {
  const player = usePlayerStore((s) => s.player)
  const performAetherGather = usePlayerStore((s) => s.performAetherGather)
  const [selectedLevel, setSelectedLevel] = useState(player?.aetherRiftLevel ?? 1)

  if (!player) return null

  return (
    <ProfessionGrindPage
      title="Эфирный разлом"
      xpLabel="Опыт эфира"
      actionVerb="Собирать"
      levels={AETHER_RIFT_LEVELS}
      xp={player.aetherRiftXp ?? 0}
      selectedLevel={selectedLevel}
      onSelectLevel={setSelectedLevel}
      professionId="sorcerer"
      perform={performAetherGather}
      stockSections={[{ id: 'aether', titleRu: 'Эфирные материалы', resourceIds: AETHER_RESOURCE_IDS }]}
    />
  )
}
