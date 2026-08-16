/**
 * Room-detail data shapes — canonical source for both STAR and Homescape.
 * Moved from star-platform/src/lib/inspections/types.ts (Phase A extraction).
 */

export type ConditionRating = 'good' | 'fair' | 'needs_work' | null
export type Score1to5 = 1 | 2 | 3 | 4 | 5

export interface RoomPhoto {
  path:      string
  url:       string
  aiFinding?: string | null
  takenAt:   string
}

export interface BedroomData {
  label: string
  en_suite_ref: string | null
  features: string[]
  flooring: string
  window_type: string
  notes: string
  photos?: RoomPhoto[]
}

export interface BathroomData {
  label: string
  bath_type: 'en_suite' | 'family' | 'guest'
  has_shower: boolean
  has_bath: boolean
  double_vanity: boolean
  heated_towel_rail: boolean
  condition: ConditionRating
  notes: string
  photos?: RoomPhoto[]
}

export interface LoungeData {
  label: string
  approx_size: 'small' | 'medium' | 'large' | 'xl'
  flooring: string
  has_aircon: boolean
  has_fireplace: boolean
  has_ceiling_fan: boolean
  condition: ConditionRating
  notes: string
  photos?: RoomPhoto[]
}

export interface KitchenData {
  type: 'open_plan' | 'separate' | 'scullery'
  countertop: 'granite' | 'quartz' | 'marble' | 'laminate' | 'timber' | 'tile' | 'other'
  stove_type: 'gas' | 'electric' | 'induction' | 'gas_hob_electric_oven' | null
  stove_config: 'freestanding' | 'built_in' | null
  stove_included: boolean | null
  has_scullery: boolean
  has_island: boolean
  notes: string
  photos?: RoomPhoto[]
}

export interface DwellingData {
  condition_score: Score1to5 | null
  modernity_score: Score1to5 | null
  build_year: number | null

  wall_type: 'plaster' | 'face_brick' | 'combination' | 'timber' | 'other' | null
  roof_type: 'clay_tiles' | 'concrete_tiles' | 'ibr' | 'corrugated' | 'thatch' | 'flat' | null
  storeys: number

  bedrooms_total: number
  bathrooms_total: number
  en_suites_count: number
  dining_rooms: number

  bedrooms: BedroomData[]
  bathrooms: BathroomData[]
  lounges: LoungeData[]
  kitchen: KitchenData | null

  has_study: boolean
  has_laundry: boolean

  flooring_types: string[]
  window_types: string[]

  garages: number
  garages_automated: boolean
  garage_direct_access: boolean
  carports: number

  has_patio: boolean
  has_balcony: boolean
  outdoor_features: string[]
  driveway_type: 'paved' | 'cobble' | 'gravel' | 'concrete' | 'grass' | null
  gate_type: 'none' | 'manual' | 'automated' | null
  garden_slope: 'flat' | 'gently_sloping' | 'steep' | null
  garden_condition: 'neat' | 'average' | 'overgrown' | null
  boundary_type: 'walled' | 'fenced' | 'open' | 'combination' | null

  construction_notes: string
  parking_notes: string
  outdoor_notes: string

  defects: string[]
  defect_notes: string
}

export interface SolarSystem {
  label: string
  serves: 'main_house' | 'flatlet' | 'whole_property'
  inverter_kva: number | null
  battery_kwh: number | null
  panel_count: number | null
  panel_wattage_w: number | null
  owned: boolean | null
  notes: string
}

export interface PoolData {
  pool_type: 'fiberglass' | 'marbelite' | 'other' | null
  condition: ConditionRating | null
  fenced: boolean
  has_cover: boolean
  has_heating: boolean
  salt_chlorinator: boolean
  entertainment_area: {
    exists: boolean
    type: 'lapa' | 'covered_patio' | 'deck' | 'none'
    has_braai: boolean
    notes: string
  }
  notes: string
}

export interface UtilitiesData {
  solar_systems: SolarSystem[]
  has_backup_battery: boolean
  has_generator: boolean
  geyser_type: 'electric' | 'gas' | 'solar' | 'heat_pump' | null
  has_water_tank: boolean
  water_tank_litres: number | null
  water_tank_plumbed: boolean
  water_tank_pump: boolean
  has_borehole: boolean
  borehole_equipped: boolean
  electricity_type: 'prepaid' | 'municipal' | null
  has_fibre: boolean
  notes: string
}

export interface ProximityData {
  issues: string[]
  notes: string
}
