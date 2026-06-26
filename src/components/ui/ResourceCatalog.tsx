import { RESOURCES } from '@/data/classes'
import { RESOURCE_SECTIONS } from '@/data/resourceCatalog'
import type { ResourceId } from '@/types/game'
import { Card, CardContent } from '@/components/ui/card'

interface ResourceCatalogProps {
  resources: Partial<Record<ResourceId, number>>
  sections?: typeof RESOURCE_SECTIONS
  showZero?: boolean
  compact?: boolean
}

export function ResourceCatalog({
  resources,
  sections = RESOURCE_SECTIONS,
  showZero = true,
  compact = false,
}: ResourceCatalogProps) {
  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="text-xs font-medium text-slate-400 mb-1.5">{section.titleRu}</p>
          <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
            {section.resourceIds.map((rid) => {
              const count = resources[rid] ?? 0
              if (!showZero && count <= 0) return null
              const res = RESOURCES[rid]
              return (
                <Card key={rid} className={count <= 0 ? 'opacity-50' : ''}>
                  <CardContent className={`${compact ? 'p-2' : 'p-2.5'} flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{res.icon}</span>
                      <span className="text-xs text-white truncate">{res.nameRu}</span>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${count > 0 ? 'text-aether-cyan' : 'text-slate-600'}`}>
                      {count}
                    </span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
