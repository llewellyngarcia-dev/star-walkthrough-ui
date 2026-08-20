'use client'

import { useState, useRef, useEffect } from 'react'
import {
  TileSelect, MultiSelect, NumInput, YesNo, NoteInput,
  ScoreSelect, SectionCard, ConditionSelect, NextButton, TextInput,
} from './ui'
import type { DwellingData, BedroomData, BathroomData, LoungeData, KitchenData, RoomPhoto, ViewType } from './room-types'
import type { Structure, StructureRole, PhotoRef } from './walkthrough-types'

// ── Photo lightbox ────────────────────────────────────────────────────────────
// Full-screen enlarge for any walkthrough photo — tap a thumbnail, see it
// properly instead of squinting at a 56px square. Click outside or Esc closes.

function PhotoLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
    </div>
  )
}

// ── Room-level photo capture ─────────────────────────────────────────────────
// Compact photo strip embedded directly in each room card (bedroom, bathroom,
// lounge, kitchen) so a photo is captured right alongside that room's own
// description/condition fields — an "Analyse with AI" finding gets appended
// to THAT room's notes, not lumped into the whole structure's defect list.

function RoomPhotoStrip({
  structureId, roomKey, photos, onChange, onFindingAccepted, onQueueMarketingPhoto, onUploadPhoto, onAnalyzePhoto, onPhotoClick,
}: {
  structureId: string
  roomKey: string
  photos: RoomPhoto[]
  onChange: (photos: RoomPhoto[]) => void
  onFindingAccepted: (text: string) => void
  /** Every photo doubles as a marketing candidate — same camera, same
   *  quality, no separate capture step. It joins this room's reference
   *  photos AND gets queued into the property-level marketing queue for
   *  later enhance + Drive save. */
  onQueueMarketingPhoto: (photo: { path: string; url: string; takenAt: string }) => void
  onUploadPhoto: PhotoUploadFn
  onAnalyzePhoto: PhotoAnalyzeFn
  onPhotoClick: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [analyzingIdx, setAnalyzingIdx] = useState<number | null>(null)
  const [pendingFinding, setPendingFinding] = useState<{ idx: number; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSelected(file: File) {
    setUploading(true)
    try {
      const { path, url } = await onUploadPhoto(file, { structureId, roomKey })
      const taken = { path, url, takenAt: new Date().toISOString() }
      onChange([...photos, taken])
      onQueueMarketingPhoto(taken)
    } catch {
      // Non-fatal — agent can just retry
    } finally {
      setUploading(false)
    }
  }

  async function analyze(idx: number) {
    const photo = photos[idx]
    if (!photo) return
    setAnalyzingIdx(idx)
    setPendingFinding(null)
    try {
      const finding = await onAnalyzePhoto(photo.path, roomKey)
      setPendingFinding({ idx, text: finding })
    } catch {
      // Non-fatal — agent can just retry
    } finally {
      setAnalyzingIdx(null)
    }
  }

  function accept() {
    if (!pendingFinding) return
    onChange(photos.map((p, i) => i === pendingFinding.idx ? { ...p, aiFinding: pendingFinding.text } : p))
    onFindingAccepted(pendingFinding.text)
    setPendingFinding(null)
  }

  function remove(idx: number) {
    onChange(photos.filter((_, i) => i !== idx))
    if (pendingFinding?.idx === idx) setPendingFinding(null)
  }

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center gap-2 flex-wrap">
        {photos.map((p, i) => (
          <div key={p.path} className="relative">
            <button type="button" onClick={() => onPhotoClick(p.url)} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
            </button>
            <button type="button" onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-50 text-red-400 text-[10px] flex items-center justify-center hover:bg-red-100">×</button>
            {!p.aiFinding && (
              <button type="button" onClick={() => analyze(i)} disabled={analyzingIdx === i}
                className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] py-0.5 rounded-b-lg leading-tight">
                {analyzingIdx === i ? '…' : 'AI'}
              </button>
            )}
            {p.aiFinding && (
              <div className="absolute inset-x-0 bottom-0 bg-green-600/80 text-white text-[8px] py-0.5 rounded-b-lg leading-tight text-center">✓</div>
            )}
          </div>
        ))}
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleSelected(f); e.target.value = '' }} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs hover:border-harcourts-blue hover:text-harcourts-blue">
          {uploading ? '…' : '+ 📷'}
        </button>
      </div>
      {pendingFinding && (
        <div className="bg-harcourts-blue/5 border border-harcourts-blue/30 rounded-lg px-2.5 py-2 space-y-1.5">
          <p className="text-xs text-gray-700">{pendingFinding.text}</p>
          <div className="flex gap-2">
            <button type="button" onClick={accept} className="text-[11px] font-semibold bg-harcourts-navy text-white rounded-md px-2 py-1">Add to notes</button>
            <button type="button" onClick={() => setPendingFinding(null)} className="text-[11px] text-gray-500 px-2 py-1">Discard</button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Full room-by-room capture form — used both for the main dwelling
 * (MainDwellingStage) and for any livable secondary structure
 * (SecondaryStructuresStage's "Edit rooms →" action), so a flatlet or
 * cottage gets identical capture depth to the main house instead of just a
 * bedroom/bathroom count.
 */

// ── Default constructors ───────────────────────────────────────────────────────

function newBedroom(n: number): BedroomData {
  const label = n === 1 ? 'Main Bedroom' : `Bedroom ${n}`
  return { label, en_suite_ref: null, features: [], flooring: '', window_type: '', window_frame_type: null, notes: '' }
}

function newBathroom(n: number): BathroomData {
  return {
    label: `B${n}`,
    bath_type: 'family',
    has_shower: true,
    has_bath: false,
    double_vanity: false,
    heated_towel_rail: false,
    condition: null,
    window_frame_type: null,
    notes: '',
  }
}

function newLounge(n: number): LoungeData {
  return {
    label: n === 1 ? 'Main Lounge' : `Lounge ${n}`,
    approx_size: 'medium',
    flooring: '',
    has_aircon: false,
    has_fireplace: false,
    has_ceiling_fan: false,
    condition: null,
    window_frame_type: null,
    notes: '',
  }
}

function defaultKitchen(): KitchenData {
  return {
    type: 'open_plan',
    countertop: 'granite',
    stove_type: null,
    stove_config: null,
    stove_included: null,
    has_scullery: false,
    has_island: false,
    window_frame_type: null,
    notes: '',
  }
}

// Sync bedroom/bathroom arrays to match count, preserving existing data
function syncArray<T>(arr: T[], count: number, factory: (n: number) => T): T[] {
  if (count > arr.length) {
    const additions = Array.from({ length: count - arr.length }, (_, i) => factory(arr.length + i + 1))
    return [...arr, ...additions]
  }
  return arr.slice(0, count)
}

// Adapts a WalkthroughV2 Structure into the DwellingData shape this form
// reads everywhere — generic over any role, not just main_dwelling.
export function structureToDwellingData(s: Structure | null | undefined): DwellingData | null {
  if (!s) return null
  return {
    condition_score: s.conditionScore,
    modernity_score: s.modernityScore,
    build_year: s.buildYear ?? null,
    wall_type: s.wallType ?? null,
    roof_type: s.roofType ?? null,
    storeys: s.storeys ?? 1,
    bedrooms_total: s.bedroomsTotal ?? s.bedrooms ?? 0,
    bathrooms_total: s.bathroomsTotal ?? s.bathrooms ?? 0,
    en_suites_count: s.enSuitesCount ?? 0,
    dining_rooms: s.diningRooms ?? 0,
    bedrooms: s.bedroomDetails ?? [],
    bathrooms: s.bathroomDetails ?? [],
    lounges: s.lounges ?? [],
    kitchen: s.kitchen ?? null,
    has_study: s.hasStudy ?? false,
    has_laundry: s.hasLaundry ?? false,
    flooring_types: s.flooringTypes ?? [],
    window_types: s.windowTypes ?? [],
    garages: s.garages ?? 0,
    garages_automated: s.garagesAutomated ?? false,
    garage_direct_access: s.garageDirectAccess ?? false,
    carports: s.carports ?? 0,
    has_patio: s.hasPatio ?? false,
    has_balcony: s.hasBalcony ?? false,
    outdoor_features: s.outdoorFeatures ?? [],
    driveway_type: s.drivewayType ?? null,
    gate_type: s.gateType ?? null,
    garden_slope: s.gardenSlope ?? null,
    garden_condition: s.gardenCondition ?? null,
    boundary_type: s.boundaryType ?? null,
    construction_notes: s.constructionNotes ?? '',
    parking_notes: s.parkingNotes ?? '',
    outdoor_notes: s.outdoorNotes ?? '',
    defects: s.defects ?? [],
    defect_notes: s.defectNotes ?? '',
    views: s.views ?? [],
    view_notes: s.viewNotes ?? '',
  }
}

// Reverse: applies a DwellingData payload onto a base Structure, preserving
// whatever the base already carries (id/role/label, and for secondary
// structures independence/ownEntrance/ownMeter/ownGeyser/hasOwnSolar/sizeSqm
// — none of which this form edits).
export function applyDwellingDataToStructure(base: Structure, d: DwellingData): Structure {
  return {
    ...base,
    bedrooms: d.bedrooms_total, bathrooms: d.bathrooms_total,
    conditionScore: d.condition_score, modernityScore: d.modernity_score,
    buildYear: d.build_year ?? undefined,
    wallType: d.wall_type ?? undefined,
    roofType: d.roof_type ?? undefined,
    storeys: d.storeys,
    bedroomsTotal: d.bedrooms_total, bathroomsTotal: d.bathrooms_total,
    enSuitesCount: d.en_suites_count, diningRooms: d.dining_rooms,
    bedroomDetails: d.bedrooms, bathroomDetails: d.bathrooms, lounges: d.lounges, kitchen: d.kitchen,
    hasStudy: d.has_study, hasLaundry: d.has_laundry,
    flooringTypes: d.flooring_types, windowTypes: d.window_types,
    garages: d.garages, garagesAutomated: d.garages_automated, garageDirectAccess: d.garage_direct_access, carports: d.carports,
    hasPatio: d.has_patio, hasBalcony: d.has_balcony, outdoorFeatures: d.outdoor_features,
    drivewayType: d.driveway_type, gateType: d.gate_type, gardenSlope: d.garden_slope, gardenCondition: d.garden_condition, boundaryType: d.boundary_type,
    constructionNotes: d.construction_notes, parkingNotes: d.parking_notes, outdoorNotes: d.outdoor_notes,
    defects: d.defects, defectNotes: d.defect_notes,
    views: d.views, viewNotes: d.view_notes,
  }
}

// ── Option lists ──────────────────────────────────────────────────────────────

const WALL_TYPES   = [{ value: 'plaster', label: 'Plaster' }, { value: 'face_brick', label: 'Face Brick' }, { value: 'combination', label: 'Combination' }, { value: 'timber', label: 'Timber' }, { value: 'other', label: 'Other' }]
const ROOF_TYPES   = [{ value: 'clay_tiles', label: 'Clay Tiles' }, { value: 'concrete_tiles', label: 'Concrete Tiles' }, { value: 'ibr', label: 'IBR Sheet' }, { value: 'corrugated', label: 'Corrugated' }, { value: 'thatch', label: 'Thatch' }, { value: 'flat', label: 'Flat/Waterproof' }]
const WINDOW_FRAME_TYPES = [{ value: 'wooden', label: 'Wooden' }, { value: 'steel', label: 'Steel' }, { value: 'aluminium', label: 'Aluminum' }, { value: 'pvc', label: 'PVC' }]
const FLOORING_OPTS = [{ value: 'tiles', label: 'Tiles' }, { value: 'timber', label: 'Timber' }, { value: 'carpet', label: 'Carpet' }, { value: 'vinyl', label: 'Vinyl' }, { value: 'polished_concrete', label: 'Polished Concrete' }, { value: 'mixed', label: 'Mixed' }]
const BEDROOM_FEATURES = [{ value: 'BIC', label: 'BIC' }, { value: 'Aircon', label: 'Aircon' }, { value: 'Ceiling Fan', label: 'Ceiling Fan' }, { value: 'Balcony', label: 'Balcony' }, { value: 'Study Nook', label: 'Study Nook' }]
const LOUNGE_SIZES = [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'xl', label: 'XL' }]
const KITCHEN_TYPES = [{ value: 'open_plan', label: 'Open Plan' }, { value: 'separate', label: 'Separate' }, { value: 'scullery', label: 'With Scullery' }]
const COUNTERTOP_TYPES = [{ value: 'granite', label: 'Granite' }, { value: 'quartz', label: 'Quartz' }, { value: 'marble', label: 'Marble' }, { value: 'laminate', label: 'Laminate' }, { value: 'tile', label: 'Tile' }, { value: 'timber', label: 'Timber' }]
const STOVE_TYPES = [{ value: 'gas', label: 'Gas' }, { value: 'electric', label: 'Electric' }, { value: 'induction', label: 'Induction' }, { value: 'gas_hob_electric_oven', label: 'Gas Hob / Electric Oven' }]
const STOVE_CONFIGS = [{ value: 'freestanding', label: 'Freestanding' }, { value: 'built_in', label: 'Built-in' }]
const DRIVEWAY_TYPES = [{ value: 'paved', label: 'Paved' }, { value: 'cobble', label: 'Cobble' }, { value: 'concrete', label: 'Concrete' }, { value: 'gravel', label: 'Gravel' }, { value: 'grass', label: 'Grass' }]
const GATE_TYPES = [{ value: 'none', label: 'None' }, { value: 'manual', label: 'Manual' }, { value: 'automated', label: 'Automated' }]
const BOUNDARY_TYPES = [{ value: 'walled', label: 'Walled' }, { value: 'fenced', label: 'Fenced' }, { value: 'open', label: 'Open' }, { value: 'combination', label: 'Combination' }]
const GARDEN_SLOPES = [{ value: 'flat', label: 'Flat' }, { value: 'gently_sloping', label: 'Gentle Slope' }, { value: 'steep', label: 'Steep' }]
const OUTDOOR_FEATURES = [{ value: 'braai', label: 'Braai' }, { value: 'lapa', label: 'Lapa' }, { value: 'boma', label: 'Boma' }, { value: 'pergola', label: 'Pergola' }, { value: 'outdoor_kitchen', label: 'Outdoor Kitchen' }, { value: 'courtyard', label: 'Courtyard' }]
const VIEW_TYPES = [
  { value: 'none',        label: 'No view' },
  { value: 'inland',      label: 'Inland / Bush' },
  { value: 'partial_sea', label: 'Partial Sea' },
  { value: 'full_sea',    label: 'Full Sea' },
  { value: 'river',       label: 'River / Dam' },
  { value: 'golf',        label: 'Golf Course' },
  { value: 'other',       label: 'Other' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export type PhotoUploadFn = (file: File, context: { structureId: string; roomKey?: string }) => Promise<{ path: string; url: string }>
export type PhotoAnalyzeFn = (path: string, label: string) => Promise<string>

export function DwellingDetailForm({
  structureId, role, defaultLabel, propertyType, existingStructure, saving, onSave, saveLabel = 'Next', onQueueMarketingPhoto, onUploadPhoto, onAnalyzePhoto, onAutosave,
}: {
  structureId: string
  role: StructureRole
  defaultLabel: string
  propertyType: 'freehold' | 'sectional' | null
  existingStructure: Structure | null
  saving: boolean
  onSave: (structure: Structure) => Promise<void>
  saveLabel?: string
  /** Uploads a photo (to whichever storage/route the consuming app uses) and
   *  returns its stored path + public URL. Each app supplies its own — STAR
   *  hits /api/v2/inspections/[id]/upload-photo, Homescape hits its own
   *  equivalent — this component doesn't know or care which. */
  onUploadPhoto: PhotoUploadFn
  /** Sends a photo for AI analysis, returns a proposed one-sentence finding.
   *  Never writes anywhere itself — the caller decides what happens with it. */
  onAnalyzePhoto: PhotoAnalyzeFn
  /** Every room photo also queues here for later marketing enhance + Drive
   *  save — one capture, both purposes. */
  onQueueMarketingPhoto: (photo: { path: string; url: string; takenAt: string }) => void
  /** Fires a debounced silent save (no stage-advance) whenever a photo is
   *  added or an AI finding accepted — since stage navigation is unlocked,
   *  an agent can jump to a different tab any time, and photos/findings must
   *  not depend on ever reaching the Next/Save button to survive that. */
  onAutosave?: (structure: Structure) => void
}) {
  const existing = structureToDwellingData(existingStructure)

  // Click-to-enlarge — shared by RoomPhotoStrip thumbnails and the
  // structure-level "Other Photos" grid below.
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Layer 5: Condition & Modernity
  const [condScore, setCondScore] = useState<number | null>(existing?.condition_score ?? null)
  const [modScore,  setModScore]  = useState<number | null>(existing?.modernity_score ?? null)
  const [buildYear, setBuildYear] = useState(existing?.build_year ? String(existing.build_year) : '')

  // Materials
  const [wallType, setWallType] = useState(existing?.wall_type ?? null)
  const [roofType, setRoofType] = useState(existing?.roof_type ?? null)
  const [storeys,  setStoreys]  = useState(existing?.storeys ?? 1)
  const [flooringTypes, setFlooringTypes] = useState<string[]>(existing?.flooring_types ?? [])

  // Room counts
  const [bedroomsTotal,  setBedroomsTotal]  = useState(existing?.bedrooms_total  ?? 3)
  const [bathroomsTotal, setBathroomsTotal] = useState(existing?.bathrooms_total ?? 2)
  const [loungesCount,   setLoungesCount]   = useState(existing?.lounges?.length ?? 1)
  const [diningRooms,    setDiningRooms]    = useState(existing?.dining_rooms ?? 0)
  const [hasStudy,       setHasStudy]       = useState(existing?.has_study ?? false)
  const [hasLaundry,     setHasLaundry]     = useState(existing?.has_laundry ?? false)

  // Room detail arrays
  const [bedrooms,  setBedrooms]  = useState<BedroomData[]>(() =>
    syncArray(existing?.bedrooms ?? [], bedroomsTotal, newBedroom)
  )
  const [bathrooms, setBathrooms] = useState<BathroomData[]>(() =>
    syncArray(existing?.bathrooms ?? [], bathroomsTotal, newBathroom)
  )
  const [lounges, setLounges] = useState<LoungeData[]>(() =>
    syncArray(existing?.lounges ?? [], loungesCount, newLounge)
  )

  // Kitchen
  const [kitchen, setKitchen] = useState<KitchenData>(existing?.kitchen ?? defaultKitchen())

  // Parking
  const [garages,             setGarages]             = useState(existing?.garages ?? 0)
  const [garagesAutomated,    setGaragesAutomated]    = useState(existing?.garages_automated ?? false)
  const [garageDirectAccess,  setGarageDirectAccess]  = useState(existing?.garage_direct_access ?? false)
  const [carports,            setCarports]            = useState(existing?.carports ?? 0)

  // Outdoor
  const [hasPatio,        setHasPatio]        = useState(existing?.has_patio ?? false)
  const [hasBalcony,      setHasBalcony]      = useState(existing?.has_balcony ?? false)
  const [outdoorFeatures, setOutdoorFeatures] = useState<string[]>(existing?.outdoor_features ?? [])
  const [driveType,       setDriveType]       = useState(existing?.driveway_type ?? null)
  const [gateType,        setGateType]        = useState(existing?.gate_type ?? null)
  const [gardenSlope,     setGardenSlope]     = useState(existing?.garden_slope ?? null)
  const [boundaryType,    setBoundaryType]    = useState(existing?.boundary_type ?? null)

  // Section notes
  const [constructionNotes, setConstructionNotes] = useState(existing?.construction_notes ?? '')
  const [parkingNotes,      setParkingNotes]      = useState(existing?.parking_notes      ?? '')
  const [outdoorNotes,      setOutdoorNotes]      = useState(existing?.outdoor_notes      ?? '')

  // Defects
  const [defectNotes, setDefectNotes] = useState(existing?.defect_notes ?? '')

  // Views — multi-select, per-structure (a flatlet can face a different
  // direction than the main house)
  const [views,     setViews]     = useState<ViewType[]>(existing?.views ?? [])
  const [viewNotes, setViewNotes] = useState(existing?.view_notes ?? '')

  // Reference photos — informational, never fed into size/price calculations
  const [photos, setPhotos] = useState<PhotoRef[]>(existingStructure?.photos ?? [])
  const [uploading, setUploading] = useState(false)
  const [analyzingIdx, setAnalyzingIdx] = useState<number | null>(null)
  const [pendingFinding, setPendingFinding] = useState<{ idx: number; text: string } | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoSelected(file: File) {
    setUploading(true)
    try {
      const { path, url } = await onUploadPhoto(file, { structureId })
      const taken = { path, url, takenAt: new Date().toISOString() }
      setPhotos(prev => [...prev, taken])
      onQueueMarketingPhoto(taken)
    } catch {
      // Non-fatal — agent can just retry the photo
    } finally {
      setUploading(false)
    }
  }

  async function analyzePhoto(idx: number) {
    const photo = photos[idx]
    if (!photo) return
    setAnalyzingIdx(idx)
    setPendingFinding(null)
    try {
      const finding = await onAnalyzePhoto(photo.path, defaultLabel)
      setPendingFinding({ idx, text: finding })
    } catch {
      // Non-fatal — agent can just retry
    } finally {
      setAnalyzingIdx(null)
    }
  }

  function acceptFinding() {
    if (!pendingFinding) return
    setPhotos(prev => prev.map((p, i) => i === pendingFinding.idx ? { ...p, aiFinding: pendingFinding.text } : p))
    setDefectNotes(prev => prev ? `${prev}\n${pendingFinding.text}` : pendingFinding.text)
    setPendingFinding(null)
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    if (pendingFinding?.idx === idx) setPendingFinding(null)
  }

  // ── Sync arrays when counts change ─────────────────────────────────────────

  function handleBedroomCount(n: number) {
    setBedroomsTotal(n)
    setBedrooms(prev => syncArray(prev, n, newBedroom))
  }

  function handleBathroomCount(n: number) {
    setBathroomsTotal(n)
    setBathrooms(prev => syncArray(prev, n, newBathroom))
  }

  function handleLoungeCount(n: number) {
    setLoungesCount(n)
    setLounges(prev => syncArray(prev, n, newLounge))
  }

  // ── Bathroom type derivation ────────────────────────────────────────────────
  // A bathroom is en_suite if any bedroom references its label
  const enSuiteRefs = new Set(bedrooms.map(b => b.en_suite_ref).filter(Boolean))
  function effectiveBathroomType(b: BathroomData): BathroomData['bath_type'] {
    if (enSuiteRefs.has(b.label)) return 'en_suite'
    return b.bath_type === 'en_suite' ? 'family' : b.bath_type
  }

  // ── Build and save ──────────────────────────────────────────────────────────

  function buildPayload(): DwellingData {
    const enSuiteCount = bedrooms.filter(b => b.en_suite_ref).length
    return {
      condition_score: condScore as DwellingData['condition_score'],
      modernity_score: modScore  as DwellingData['modernity_score'],
      build_year:  buildYear ? Number(buildYear) : null,
      wall_type:   wallType  as DwellingData['wall_type'],
      roof_type:   roofType  as DwellingData['roof_type'],
      storeys,
      bedrooms_total:  bedroomsTotal,
      bathrooms_total: bathroomsTotal,
      en_suites_count: enSuiteCount,
      dining_rooms:    diningRooms,
      bedrooms,
      bathrooms: bathrooms.map(b => ({ ...b, bath_type: effectiveBathroomType(b) })),
      lounges,
      kitchen,
      has_study:   hasStudy,
      has_laundry: hasLaundry,
      flooring_types: flooringTypes,
      window_types:   [],
      garages,
      garages_automated:    garagesAutomated,
      garage_direct_access: garageDirectAccess,
      carports,
      has_patio:       hasPatio,
      has_balcony:     hasBalcony,
      outdoor_features: outdoorFeatures,
      driveway_type: driveType as DwellingData['driveway_type'],
      gate_type:     gateType  as DwellingData['gate_type'],
      garden_slope:  gardenSlope as DwellingData['garden_slope'],
      garden_condition: null,
      boundary_type: boundaryType as DwellingData['boundary_type'],
      construction_notes: constructionNotes,
      parking_notes:      parkingNotes,
      outdoor_notes:      outdoorNotes,
      defects:            [],
      defect_notes:       defectNotes,
      views,
      view_notes: viewNotes,
    }
  }

  // Debounced autosave — fires whenever photos or room data change, so work
  // survives a jump to a different stage tab without ever pressing Next.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipFirstAutosave = useRef(true)
  useEffect(() => {
    if (!onAutosave) return
    if (skipFirstAutosave.current) { skipFirstAutosave.current = false; return }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      const base: Structure = existingStructure ?? {
        id: structureId, role, label: defaultLabel,
        conditionScore: null, modernityScore: null,
      }
      const structure = applyDwellingDataToStructure(base, buildPayload())
      onAutosave({ ...structure, photos: photos.length ? photos : undefined })
    }, 600)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, bedrooms, bathrooms, lounges, kitchen, defectNotes])

  async function handleSave() {
    const base: Structure = existingStructure ?? {
      id: structureId, role, label: defaultLabel,
      conditionScore: null, modernityScore: null,
    }
    const structure = applyDwellingDataToStructure(base, buildPayload())
    await onSave({ ...structure, photos: photos.length ? photos : undefined })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const inp = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-harcourts-navy'

  return (
    <div className="space-y-4">

      {/* Condition & Modernity */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{defaultLabel} — Condition</p>
        <ScoreSelect label="Overall condition" value={condScore} onChange={setCondScore} />
        <ScoreSelect label="Modernity / renovation level" value={modScore} onChange={setModScore} />
        <TextInput label="Year built (approx)" value={buildYear} onChange={setBuildYear} placeholder="2005" type="number" />
      </div>

      {/* Construction */}
      <SectionCard title="Construction">
        <TileSelect label="Wall type" options={WALL_TYPES} value={wallType} onChange={v => setWallType(v as typeof wallType)} columns={3} />
        <TileSelect label="Roof type" options={ROOF_TYPES}  value={roofType} onChange={v => setRoofType(v as typeof roofType)} columns={3} />
        <NumInput  label="Storeys" value={storeys} onChange={setStoreys} min={1} max={4} />
        <MultiSelect label="Flooring types" options={FLOORING_OPTS} value={flooringTypes} onChange={setFlooringTypes} columns={3} />
        <NoteInput value={constructionNotes} onChange={setConstructionNotes} placeholder="e.g. Face brick repainted, slight damp on north wall" />
      </SectionCard>

      {/* Views — applies to any structure/property type (a sectional unit can
          still have sea views), so kept outside the freehold-only Outdoor
          section below. */}
      <SectionCard title={`${defaultLabel} — Views`}>
        <MultiSelect options={VIEW_TYPES} value={views} onChange={v => setViews(v as ViewType[])} columns={3} />
        <NoteInput
          value={viewNotes}
          onChange={setViewNotes}
          placeholder="e.g. Full unobstructed ocean views from living areas and main bedroom"
        />
      </SectionCard>

      {/* Room counts */}
      <SectionCard title="Room Counts">
        <NumInput label="Bedrooms (incl. main/master)" value={bedroomsTotal} onChange={handleBedroomCount} min={0} max={10} />
        <NumInput label="Bathrooms (total, incl. en-suites)" value={bathroomsTotal} onChange={handleBathroomCount} min={0} max={8} step={0.5} />
        <NumInput label="Lounges"    value={loungesCount}   onChange={handleLoungeCount}   min={0} max={6} />
        <NumInput label="Dining rooms" value={diningRooms}  onChange={setDiningRooms}      min={0} max={4} />
        <YesNo label="Study / home office" value={hasStudy}   onChange={setHasStudy} />
        <YesNo label="Laundry room"        value={hasLaundry} onChange={setHasLaundry} />
      </SectionCard>

      {/* Bedroom cards */}
      {bedrooms.length > 0 && (
        <SectionCard title="Bedroom Detail">
          <div className="space-y-4">
            {bedrooms.map((bed, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                <input
                  className={inp}
                  value={bed.label}
                  onChange={e => setBedrooms(prev => prev.map((b, j) => j === i ? { ...b, label: e.target.value } : b))}
                  placeholder="Bedroom label"
                />

                {bathroomsTotal > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">En-suite bathroom</p>
                    <select
                      className={inp}
                      value={bed.en_suite_ref ?? ''}
                      onChange={e => setBedrooms(prev => prev.map((b, j) => j === i ? { ...b, en_suite_ref: e.target.value || null } : b))}
                    >
                      <option value="">None</option>
                      {bathrooms.map(bth => (
                        <option key={bth.label} value={bth.label}>{bth.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <MultiSelect
                  label="Features"
                  options={BEDROOM_FEATURES}
                  value={bed.features}
                  onChange={features => setBedrooms(prev => prev.map((b, j) => j === i ? { ...b, features } : b))}
                  columns={3}
                />

                <TileSelect
                  label="Flooring"
                  options={[{ value: 'tiles', label: 'Tiles' }, { value: 'carpet', label: 'Carpet' }, { value: 'timber', label: 'Timber' }, { value: 'vinyl', label: 'Vinyl' }]}
                  value={bed.flooring || null}
                  onChange={flooring => setBedrooms(prev => prev.map((b, j) => j === i ? { ...b, flooring } : b))}
                  columns={4}
                />

                <TileSelect
                  label="Window frames"
                  options={WINDOW_FRAME_TYPES}
                  value={bed.window_frame_type}
                  onChange={v => setBedrooms(prev => prev.map((b, j) => j === i ? { ...b, window_frame_type: v as BedroomData['window_frame_type'] } : b))}
                  columns={4}
                />

                <NoteInput
                  value={bed.notes}
                  onChange={notes => setBedrooms(prev => prev.map((b, j) => j === i ? { ...b, notes } : b))}
                />
                <RoomPhotoStrip
                  structureId={structureId} roomKey={`bed-${i}-${bed.label}`}
                  photos={bed.photos ?? []}
                  onChange={photos => setBedrooms(prev => prev.map((b, j) => j === i ? { ...b, photos } : b))}
                  onFindingAccepted={text => setBedrooms(prev => prev.map((b, j) => j === i ? { ...b, notes: b.notes ? `${b.notes}\n${text}` : text } : b))}
                  onQueueMarketingPhoto={onQueueMarketingPhoto}
                  onUploadPhoto={onUploadPhoto}
                  onAnalyzePhoto={onAnalyzePhoto}
                  onPhotoClick={setLightboxUrl}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Bathroom cards */}
      {bathrooms.length > 0 && (
        <SectionCard title="Bathroom Detail">
          <div className="space-y-4">
            {bathrooms.map((bth, i) => {
              const effectiveType = effectiveBathroomType(bth)
              return (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      className={`${inp} flex-1`}
                      value={bth.label}
                      onChange={e => setBathrooms(prev => prev.map((b, j) => j === i ? { ...b, label: e.target.value } : b))}
                      placeholder="Bathroom label"
                    />
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${effectiveType === 'en_suite' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {effectiveType === 'en_suite' ? 'En-suite' : effectiveType === 'guest' ? 'Guest' : 'Family'}
                    </span>
                  </div>

                  {effectiveType !== 'en_suite' && (
                    <TileSelect
                      label="Type"
                      options={[{ value: 'family', label: 'Family' }, { value: 'guest', label: 'Guest' }]}
                      value={bth.bath_type}
                      onChange={v => setBathrooms(prev => prev.map((b, j) => j === i ? { ...b, bath_type: v as BathroomData['bath_type'] } : b))}
                      columns={2}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-x-4">
                    {([
                      ['has_shower', 'Shower'],
                      ['has_bath', 'Bath'],
                      ['double_vanity', 'Double vanity'],
                      ['heated_towel_rail', 'Towel rail'],
                    ] as const).map(([field, label]) => (
                      <YesNo
                        key={field}
                        label={label}
                        value={bth[field]}
                        onChange={v => setBathrooms(prev => prev.map((b, j) => j === i ? { ...b, [field]: v } : b))}
                      />
                    ))}
                  </div>

                  <ConditionSelect
                    value={bth.condition}
                    onChange={condition => setBathrooms(prev => prev.map((b, j) => j === i ? { ...b, condition } : b))}
                  />
                  <TileSelect
                    label="Window frames"
                    options={WINDOW_FRAME_TYPES}
                    value={bth.window_frame_type}
                    onChange={v => setBathrooms(prev => prev.map((b, j) => j === i ? { ...b, window_frame_type: v as BathroomData['window_frame_type'] } : b))}
                    columns={4}
                  />
                  <NoteInput
                    value={bth.notes}
                    onChange={notes => setBathrooms(prev => prev.map((b, j) => j === i ? { ...b, notes } : b))}
                  />
                  <RoomPhotoStrip
                    structureId={structureId} roomKey={`bath-${i}-${bth.label}`}
                    photos={bth.photos ?? []}
                    onChange={photos => setBathrooms(prev => prev.map((b, j) => j === i ? { ...b, photos } : b))}
                    onFindingAccepted={text => setBathrooms(prev => prev.map((b, j) => j === i ? { ...b, notes: b.notes ? `${b.notes}\n${text}` : text } : b))}
                    onQueueMarketingPhoto={onQueueMarketingPhoto}
                  onUploadPhoto={onUploadPhoto}
                  onAnalyzePhoto={onAnalyzePhoto}
                  onPhotoClick={setLightboxUrl}
                  />
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* Lounge cards */}
      {lounges.length > 0 && (
        <SectionCard title="Lounge Detail">
          <div className="space-y-4">
            {lounges.map((lng, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                <input
                  className={inp}
                  value={lng.label}
                  onChange={e => setLounges(prev => prev.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
                />
                <TileSelect
                  label="Approximate size"
                  options={LOUNGE_SIZES}
                  value={lng.approx_size}
                  onChange={v => setLounges(prev => prev.map((l, j) => j === i ? { ...l, approx_size: v as LoungeData['approx_size'] } : l))}
                  columns={4}
                />
                <TileSelect
                  label="Flooring"
                  options={[{ value: 'tiles', label: 'Tiles' }, { value: 'carpet', label: 'Carpet' }, { value: 'timber', label: 'Timber' }, { value: 'vinyl', label: 'Vinyl' }]}
                  value={lng.flooring || null}
                  onChange={v => setLounges(prev => prev.map((l, j) => j === i ? { ...l, flooring: v } : l))}
                  columns={4}
                />
                <div className="grid grid-cols-1">
                  <YesNo label="Aircon"      value={lng.has_aircon}      onChange={v => setLounges(prev => prev.map((l, j) => j === i ? { ...l, has_aircon: v } : l))} />
                  <YesNo label="Ceiling fan" value={lng.has_ceiling_fan} onChange={v => setLounges(prev => prev.map((l, j) => j === i ? { ...l, has_ceiling_fan: v } : l))} />
                  <YesNo label="Fireplace"   value={lng.has_fireplace}   onChange={v => setLounges(prev => prev.map((l, j) => j === i ? { ...l, has_fireplace: v } : l))} />
                </div>
                <ConditionSelect
                  value={lng.condition}
                  onChange={condition => setLounges(prev => prev.map((l, j) => j === i ? { ...l, condition } : l))}
                />
                <TileSelect
                  label="Window frames"
                  options={WINDOW_FRAME_TYPES}
                  value={lng.window_frame_type}
                  onChange={v => setLounges(prev => prev.map((l, j) => j === i ? { ...l, window_frame_type: v as LoungeData['window_frame_type'] } : l))}
                  columns={4}
                />
                <NoteInput
                  value={lng.notes}
                  onChange={notes => setLounges(prev => prev.map((l, j) => j === i ? { ...l, notes } : l))}
                />
                <RoomPhotoStrip
                  structureId={structureId} roomKey={`lounge-${i}-${lng.label}`}
                  photos={lng.photos ?? []}
                  onChange={photos => setLounges(prev => prev.map((l, j) => j === i ? { ...l, photos } : l))}
                  onFindingAccepted={text => setLounges(prev => prev.map((l, j) => j === i ? { ...l, notes: l.notes ? `${l.notes}\n${text}` : text } : l))}
                  onQueueMarketingPhoto={onQueueMarketingPhoto}
                  onUploadPhoto={onUploadPhoto}
                  onAnalyzePhoto={onAnalyzePhoto}
                  onPhotoClick={setLightboxUrl}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Kitchen */}
      <SectionCard title="Kitchen">
        <TileSelect label="Kitchen type"  options={KITCHEN_TYPES}    value={kitchen.type}      onChange={v => setKitchen(k => ({ ...k, type: v as KitchenData['type'] }))}        columns={3} />
        <TileSelect label="Countertop"    options={COUNTERTOP_TYPES} value={kitchen.countertop} onChange={v => setKitchen(k => ({ ...k, countertop: v as KitchenData['countertop'] }))} columns={3} />
        <TileSelect label="Stove type"    options={STOVE_TYPES}      value={kitchen.stove_type ?? null} onChange={v => setKitchen(k => ({ ...k, stove_type: v as KitchenData['stove_type'] }))}   columns={2} />
        {kitchen.stove_type && (
          <TileSelect label="Stove configuration" options={STOVE_CONFIGS} value={kitchen.stove_config ?? null} onChange={v => setKitchen(k => ({ ...k, stove_config: v as KitchenData['stove_config'] }))} columns={2} />
        )}
        {kitchen.stove_config === 'freestanding' && (
          <YesNo label="Stove included in sale?" value={kitchen.stove_included} onChange={v => setKitchen(k => ({ ...k, stove_included: v }))} />
        )}
        <YesNo label="Has scullery"      value={kitchen.has_scullery} onChange={v => setKitchen(k => ({ ...k, has_scullery: v }))} />
        <YesNo label="Has kitchen island" value={kitchen.has_island}  onChange={v => setKitchen(k => ({ ...k, has_island: v }))} />
        <TileSelect label="Window frames" options={WINDOW_FRAME_TYPES} value={kitchen.window_frame_type} onChange={v => setKitchen(k => ({ ...k, window_frame_type: v as KitchenData['window_frame_type'] }))} columns={4} />
        <NoteInput value={kitchen.notes} onChange={v => setKitchen(k => ({ ...k, notes: v }))} />
        <RoomPhotoStrip
          structureId={structureId} roomKey="kitchen"
          photos={kitchen.photos ?? []}
          onChange={photos => setKitchen(k => ({ ...k, photos }))}
          onFindingAccepted={text => setKitchen(k => ({ ...k, notes: k.notes ? `${k.notes}\n${text}` : text }))}
          onQueueMarketingPhoto={onQueueMarketingPhoto}
                  onUploadPhoto={onUploadPhoto}
                  onAnalyzePhoto={onAnalyzePhoto}
                  onPhotoClick={setLightboxUrl}
        />
      </SectionCard>

      {/* Parking */}
      <SectionCard title="Parking">
        <NumInput label="Garages" value={garages} onChange={setGarages} min={0} max={6} />
        {garages > 0 && <>
          <YesNo label="Automated / electric doors" value={garagesAutomated}   onChange={setGaragesAutomated} />
          <YesNo label="Direct access to house"      value={garageDirectAccess} onChange={setGarageDirectAccess} />
        </>}
        <NumInput label="Carports" value={carports} onChange={setCarports} min={0} max={6} />
        <NoteInput value={parkingNotes} onChange={setParkingNotes} placeholder="e.g. Double garage with workshop area, extra parking bay on driveway" />
      </SectionCard>

      {/* Outdoor */}
      {propertyType === 'freehold' && (
        <SectionCard title="Outdoor & Garden">
          <YesNo label="Covered patio / stoep"  value={hasPatio}   onChange={setHasPatio} />
          <YesNo label="Balcony / deck"          value={hasBalcony} onChange={setHasBalcony} />
          <MultiSelect label="Outdoor features"  options={OUTDOOR_FEATURES}  value={outdoorFeatures} onChange={setOutdoorFeatures} columns={3} />
          <TileSelect label="Driveway"      options={DRIVEWAY_TYPES} value={driveType}    onChange={v => setDriveType(v as typeof driveType)}    columns={3} />
          <TileSelect label="Gate"          options={GATE_TYPES}     value={gateType}     onChange={v => setGateType(v as typeof gateType)}       columns={3} />
          <TileSelect label="Garden slope"  options={GARDEN_SLOPES}  value={gardenSlope}  onChange={v => setGardenSlope(v as typeof gardenSlope)} columns={3} />
          <TileSelect label="Boundary"      options={BOUNDARY_TYPES} value={boundaryType} onChange={v => setBoundaryType(v as typeof boundaryType)} columns={2} />
          <NoteInput value={outdoorNotes} onChange={setOutdoorNotes} placeholder="e.g. Large garden with established trees, vegetable garden, well-maintained lawn" />
        </SectionCard>
      )}

      {/* Photos not tied to one room — exterior, hallway, general shots.
          Per-room photos live inline on each bedroom/bathroom/lounge/kitchen
          card above instead. */}
      <SectionCard title="Other Photos (exterior, hallway, general)" defaultOpen={photos.length > 0}>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.path} className="relative">
              <button type="button" onClick={() => setLightboxUrl(p.url)} className="block w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
              </button>
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-50 text-red-400 text-xs flex items-center justify-center hover:bg-red-100"
              >
                ×
              </button>
              {p.aiFinding && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-b-lg leading-tight">✓ noted</div>
              )}
              <button
                type="button"
                onClick={() => analyzePhoto(i)}
                disabled={analyzingIdx === i || !!p.aiFinding}
                className="mt-1 w-full text-[10px] font-medium text-harcourts-blue disabled:text-gray-300"
              >
                {analyzingIdx === i ? 'Analysing…' : p.aiFinding ? 'Noted below' : 'Analyse with AI'}
              </button>
            </div>
          ))}
        </div>

        {pendingFinding && (
          <div className="bg-harcourts-blue/5 border border-harcourts-blue/30 rounded-lg px-3 py-2 space-y-2">
            <p className="text-xs font-semibold text-harcourts-navy">AI found:</p>
            <p className="text-xs text-gray-700">{pendingFinding.text}</p>
            <div className="flex gap-2">
              <button type="button" onClick={acceptFinding} className="text-xs font-semibold bg-harcourts-navy text-white rounded-lg px-3 py-1.5">
                Add to defects
              </button>
              <button type="button" onClick={() => setPendingFinding(null)} className="text-xs text-gray-500 px-3 py-1.5">
                Discard
              </button>
            </div>
          </div>
        )}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelected(f); e.target.value = '' }}
        />
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={uploading}
          className="w-full text-sm font-semibold text-harcourts-blue border border-harcourts-blue/40 rounded-lg py-2 hover:bg-harcourts-blue/5 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : '+ Reference photo'}
        </button>
      </SectionCard>

      {/* Defects */}
      <SectionCard title="Defects / Issues" defaultOpen={false}>
        <NoteInput
          label="Note any defects, damp, cracks, unapproved structures, etc."
          value={defectNotes}
          onChange={setDefectNotes}
          rows={3}
          placeholder="e.g. Slight damp on north wall of main bedroom, hairline crack above lounge window — cosmetic only"
        />
      </SectionCard>

      <NextButton onPress={handleSave} saving={saving} label={saveLabel} />

      {lightboxUrl && (
        <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}
