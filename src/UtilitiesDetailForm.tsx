'use client'

/**
 * Utilities & Water capture — solar systems, backup power, geyser,
 * electricity, water tank, borehole. Extracted from star-platform's
 * FeaturesStage.tsx (Phase B) so Homescape captures the exact same detail
 * STAR does, instead of only the lightweight SiteFeatures toggles.
 */

import { NumInput, NoteInput, SectionCard, TileSelect, YesNo } from './ui'
import type { SolarSystem, UtilitiesData } from './room-types'

const GEYSER_TYPES = [
  { value: 'electric', label: 'Electric' },
  { value: 'gas',       label: 'Gas' },
  { value: 'solar',     label: 'Solar' },
  { value: 'heat_pump', label: 'Heat Pump' },
]

const inp = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-harcourts-navy'

function newSolarSystem(): SolarSystem {
  return { label: 'Main House', serves: 'main_house', inverter_kva: null, battery_kwh: null, panel_count: null, panel_wattage_w: null, owned: true, notes: '' }
}

export function UtilitiesDetailForm({
  value,
  onChange,
}: {
  value: UtilitiesData
  onChange: (v: UtilitiesData) => void
}) {
  function set<K extends keyof UtilitiesData>(field: K, v: UtilitiesData[K]) {
    onChange({ ...value, [field]: v })
  }
  function setSolar(updater: (prev: SolarSystem[]) => SolarSystem[]) {
    onChange({ ...value, solar_systems: updater(value.solar_systems) })
  }

  return (
    <>
      {/* Solar */}
      <SectionCard title="Solar & Power">
        <div className="space-y-3">
          {value.solar_systems.map((sys, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className={`${inp} flex-1`}
                  value={sys.label}
                  onChange={e => setSolar(prev => prev.map((s, j) => j === i ? { ...s, label: e.target.value } : s))}
                  placeholder="Main House"
                />
                <button type="button" onClick={() => setSolar(prev => prev.filter((_, j) => j !== i))}
                  className="w-7 h-7 rounded-full bg-red-50 text-red-400 text-sm flex items-center justify-center shrink-0">×</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([['inverter_kva', 'Inverter (kVA)', '0.1'], ['battery_kwh', 'Battery (kWh)', '0.5'], ['panel_count', 'Panels', '1']] as const).map(([field, label, step]) => (
                  <div key={field} className="space-y-0.5">
                    <p className="text-xs text-gray-500">{label}</p>
                    <input type="number" step={step} min={0}
                      value={sys[field] ?? ''}
                      onChange={e => setSolar(prev => prev.map((s, j) => j === i ? { ...s, [field]: e.target.value ? Number(e.target.value) : null } : s))}
                      className={inp} placeholder="0" />
                  </div>
                ))}
              </div>
              <NoteInput
                value={sys.notes}
                onChange={notes => setSolar(prev => prev.map((s, j) => j === i ? { ...s, notes } : s))}
                placeholder="e.g. System owned, installed 2022, feeds whole house"
              />
            </div>
          ))}
          <button type="button" onClick={() => setSolar(prev => [...prev, newSolarSystem()])}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 transition-colors">
            + Add solar system
          </button>
        </div>

        <YesNo label="Backup battery (no solar panels)" value={value.has_backup_battery} onChange={v => set('has_backup_battery', v)} />
        <YesNo label="Generator"                         value={value.has_generator}     onChange={v => set('has_generator', v)} />
        <TileSelect label="Geyser type" options={GEYSER_TYPES} value={value.geyser_type} onChange={v => set('geyser_type', v as UtilitiesData['geyser_type'])} columns={2} />
        <TileSelect label="Electricity" options={[{ value: 'prepaid', label: 'Prepaid' }, { value: 'municipal', label: 'Municipal' }]} value={value.electricity_type} onChange={v => set('electricity_type', v as UtilitiesData['electricity_type'])} columns={2} />
        <YesNo label="Fibre internet" value={value.has_fibre} onChange={v => set('has_fibre', v)} />
      </SectionCard>

      {/* Water */}
      <SectionCard title="Water">
        <YesNo label="Water storage tank" value={value.has_water_tank} onChange={v => set('has_water_tank', v)} />
        {value.has_water_tank && (
          <>
            <NumInput label="Capacity (litres)" value={value.water_tank_litres ?? 0} onChange={v => set('water_tank_litres', v)} min={0} max={50000} step={500} suffix="L" />
            <YesNo    label="Plumbed into supply" value={value.water_tank_plumbed} onChange={v => set('water_tank_plumbed', v)} />
          </>
        )}
        <YesNo label="Borehole" value={value.has_borehole} onChange={v => set('has_borehole', v)} />
        {value.has_borehole && <YesNo label="Borehole equipped (pump, plumbed)" value={value.borehole_equipped} onChange={v => set('borehole_equipped', v)} />}
        <NoteInput value={value.notes} onChange={v => set('notes', v)} placeholder="e.g. 5000L tank plumbed into main supply, borehole services garden only" />
      </SectionCard>
    </>
  )
}

export function emptyUtilitiesData(): UtilitiesData {
  return {
    solar_systems:      [],
    has_backup_battery: false,
    has_generator:      false,
    geyser_type:        null,
    has_water_tank:      false,
    water_tank_litres:   null,
    water_tank_plumbed:  false,
    water_tank_pump:     false,
    has_borehole:        false,
    borehole_equipped:   false,
    electricity_type:    null,
    has_fibre:           false,
    notes:               '',
  }
}
