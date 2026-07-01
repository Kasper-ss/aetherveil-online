import { useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { ProfessionGrindPage } from '@/components/ui/ProfessionGrindPage'
import { HUNT_LEVELS } from '@/data/huntLevels'
import { BASIC_RESOURCE_IDS } from '@/data/resourceCatalog'

export function HuntPage() {
  const player = usePlayerStore((s) => s.player)
  const performHunt = usePlayerStore((s) => s.performHunt)
  const [selectedLevel, setSelectedLevel] = useState(player?.huntLevel ?? 1)

  if (!player) return null

  return (
    <ProfessionGrindPage
      title="Охотничьи угодья"
      xpLabel="Опыт охоты"
      actionVerb="Охотиться"
      levels={HUNT_LEVELS}
      xp={player.huntXp ?? 0}
      selectedLevel={selectedLevel}
      onSelectLevel={setSelectedLevel}
      professionId="hunter"
      perform={performHunt}
      stockSections={[{ id: 'hunt', titleRu: 'Трофеи', resourceIds: BASIC_RESOURCE_IDS.filter((id) => ['hide', 'meat', 'bone', 'gem_shard', 'rare_spice', 'abyssal_pearl', 'star_shard', 'aether_dust'].includes(id)) }]}
    />
  )
}
