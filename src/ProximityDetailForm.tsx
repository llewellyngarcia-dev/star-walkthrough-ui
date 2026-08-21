'use client'

/**
 * Proximity issues capture — extracted from star-platform's FeaturesStage.tsx
 * (Phase B), so Homescape flags the same nuisances STAR does.
 */

import { MultiSelect, NoteInput, SectionCard } from './ui'
import type { ProximityData } from './room-types'

const PROXIMITY_ISSUES = [
  { value: 'railway',             label: 'Railway' },
  { value: 'busy_road',           label: 'Busy Road' },
  { value: 'industrial',          label: 'Industrial' },
  { value: 'school',              label: 'School' },
  { value: 'informal_settlement', label: 'Informal Settlement' },
  { value: 'commercial',          label: 'Commercial' },
]

export function ProximityDetailForm({
  value,
  onChange,
  defaultOpen = false,
}: {
  value: ProximityData
  onChange: (v: ProximityData) => void
  defaultOpen?: boolean
}) {
  return (
    <SectionCard title="Proximity Issues" defaultOpen={defaultOpen}>
      <p className="text-xs text-gray-400">Flag anything nearby that could affect value or desirability.</p>
      <MultiSelect options={PROXIMITY_ISSUES} value={value.issues} onChange={issues => onChange({ ...value, issues })} columns={2} />
      <NoteInput value={value.notes} onChange={notes => onChange({ ...value, notes })} />
    </SectionCard>
  )
}

export function emptyProximityData(): ProximityData {
  return { issues: [], notes: '' }
}
