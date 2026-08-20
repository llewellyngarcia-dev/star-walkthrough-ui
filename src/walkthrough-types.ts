/**
 * WalkthroughV2 — the shared adaptive property-capture shape used by all
 * three walkthrough surfaces: STAR's own inspection wizard, Homescape's
 * agent-driven walkthrough, and Homescape's public self-serve estimate.
 * This is the ONE canonical definition (Phase A of the shared-package
 * extraction) — star-platform and homescape-app both import it from here
 * instead of maintaining their own copies, eliminating the drift that
 * happened when Homescape's manual mirror was never kept in sync.
 *
 * Structure is a superset: N dynamic buildings (main dwelling + any number
 * of flatlets/cottages/outbuildings), each carrying either just the
 * lightweight fields (bedrooms/bathrooms/sizeSqm/scores — what Homescape
 * agents and public users fill in) OR the full STAR-level room-by-room
 * detail (BedroomData/BathroomData/LoungeData/KitchenData family, from
 * room-types.ts in this same package) when captured via the rich wizard.
 * Every rich field is optional so the two capture depths coexist in one
 * shape without either surface losing anything it has today.
 */

import type {
  BedroomData, BathroomData, LoungeData, KitchenData,
  PoolData, UtilitiesData, ProximityData, Score1to5, ViewType,
} from './room-types'

export interface PhotoRef {
  path:      string            // storage path
  url:       string            // public URL
  caption?:  string
  aiFinding?: string | null    // proposed finding, only set once the agent accepts it
  takenAt:   string
}

export type StructureRole =
  | 'main_dwelling'
  | 'flatlet'
  | 'cottage'
  | 'staff_quarters'
  | 'garage'
  | 'store_room'
  | 'workshop'
  | 'other'

export const LIVABLE_ROLES: StructureRole[] = ['main_dwelling', 'flatlet', 'cottage', 'staff_quarters']

export interface Structure {
  id:              string   // client-generated, stable across edits
  role:            StructureRole
  label:           string   // agent-editable, e.g. "Main house", "Garden cottage"

  // ── Lightweight fields — what Homescape (agent + public) fills in ────────
  bedrooms?:       number   // only meaningful for livable roles
  bathrooms?:      number
  sizeSqm?:        number
  conditionScore:  Score1to5 | null
  modernityScore:  Score1to5 | null   // only meaningful for livable roles
  notes?:          string

  // ── Rich detail — STAR's wizard only, all optional ────────────────────────
  // Matches DwellingData/FlatletData from inspections/types.ts, generalized
  // across any structure instead of fixed main_dwelling/flatlet columns.
  buildYear?:           number
  wallType?:             'plaster' | 'face_brick' | 'combination' | 'timber' | 'other'
  roofType?:              'clay_tiles' | 'concrete_tiles' | 'ibr' | 'corrugated' | 'thatch' | 'flat'
  storeys?:              number
  bedroomsTotal?:        number   // authoritative count (bedrooms above may be a simple fallback count)
  bathroomsTotal?:       number
  enSuitesCount?:        number
  diningRooms?:          number
  bedroomDetails?:       BedroomData[]
  bathroomDetails?:      BathroomData[]
  lounges?:              LoungeData[]
  kitchen?:              KitchenData | null
  hasStudy?:             boolean
  hasLaundry?:           boolean
  flooringTypes?:        string[]
  windowTypes?:          string[]
  garages?:              number
  garagesAutomated?:     boolean
  garageDirectAccess?:   boolean
  carports?:             number
  hasPatio?:             boolean
  hasBalcony?:           boolean
  outdoorFeatures?:      string[]

  // Multi-select — only meaningful for livable roles (LIVABLE_ROLES). A
  // flatlet/cottage can face a different direction than the main house, so
  // this is captured per-structure rather than once for the whole property.
  views?:                ViewType[]
  viewNotes?:            string
  drivewayType?:         'paved' | 'cobble' | 'gravel' | 'concrete' | 'grass' | null
  gateType?:             'none' | 'manual' | 'automated' | null
  gardenSlope?:          'flat' | 'gently_sloping' | 'steep' | null
  gardenCondition?:      'neat' | 'average' | 'overgrown' | null
  boundaryType?:         'walled' | 'fenced' | 'open' | 'combination' | null
  constructionNotes?:    string
  parkingNotes?:         string
  outdoorNotes?:         string
  defects?:              string[]
  defectNotes?:          string

  // Independence info — only meaningful for flatlet/cottage/staff_quarters
  independence?:  'attached' | 'semi_independent' | 'fully_independent'
  ownEntrance?:   boolean
  ownMeter?:      boolean
  ownGeyser?:     boolean
  hasOwnSolar?:   boolean

  // Reference photos taken during the walkthrough — informational, never
  // fed into size/price calculations.
  photos?: PhotoRef[]
}

export interface SiteFeatures {
  hasPool:           boolean
  hasBorehole:       boolean
  hasSolar:          boolean
  hasStudy:          boolean
  hasCarpetAnywhere: boolean
  viewType:          string     // '' | 'partial_sea' | 'full_sea' | other
  security:          string[]   // ["electric_fence", "alarm", "cctv", "security_gates", ...]
}

export interface ComplexFeatures {
  securityEstate: boolean
  communalPool:   boolean
  gym:            boolean
  clubhouse:      boolean
  petsAllowed:    'yes' | 'no' | 'restricted' | null
  monthlyLevy?:   number
}

export interface WalkthroughV2 {
  structures:       Structure[]           // at least one, must include a main_dwelling (unless vacant_land)
  siteFeatures:     SiteFeatures           // simple summary flags — what pricing (aggregateStructures) reads
  complexFeatures?: ComplexFeatures        // sectional title only

  // ── Rich detail sidecars — STAR's wizard only, all optional ───────────────
  // Pool/utilities/proximity aren't "buildings" so they don't belong in
  // structures[] — they stay property-level, matching inspections/types.ts's
  // shape exactly so the wizard's existing stages can write directly here.
  // The lightweight siteFeatures.hasPool/hasBorehole/hasSolar flags stay the
  // single source of truth for pricing; these are richer capture only.
  poolDetail?:      PoolData
  utilitiesDetail?: UtilitiesData
  proximityDetail?: ProximityData

  // Exterior/general photos not tied to one structure
  photos?:          PhotoRef[]

  notes:            string                 // free-text catch-all, also the AI-extraction input
}

export function emptyWalkthrough(): WalkthroughV2 {
  return {
    structures: [],
    siteFeatures: {
      hasPool: false, hasBorehole: false, hasSolar: false, hasStudy: false, hasCarpetAnywhere: false,
      viewType: '', security: [],
    },
    notes: '',
  }
}

export function findMainDwelling(w: WalkthroughV2 | null | undefined): Structure | null {
  if (!w) return null
  return w.structures.find(s => s.role === 'main_dwelling') ?? null
}

// Pricing (computeFinalValuation) still takes one viewType string — a sea
// view premium doesn't stack per-structure. This picks the single best view
// across all livable structures, most valuable first, so siteFeatures.viewType
// can stay in sync automatically instead of needing separate manual entry
// now that views are captured per-structure.
const VIEW_RANK: ViewType[] = ['full_sea', 'partial_sea', 'river', 'golf', 'inland', 'other', 'none']

export function deriveBestView(structures: Structure[]): string {
  const all = structures
    .filter(s => LIVABLE_ROLES.includes(s.role))
    .flatMap(s => s.views ?? [])
  for (const rank of VIEW_RANK) {
    if (all.includes(rank) && rank !== 'none') return rank
  }
  return ''
}
