'use client'

/**
 * V2 Inspection Wizard — shared UI primitives.
 * All components are touch-first (44px min targets) and follow the Harcourts brand.
 */

import React, { useState, useRef, useEffect } from 'react'

// ── TileSelect ────────────────────────────────────────────────────────────────
// Single-select grid of labelled option buttons.

interface TileOption { value: string; label: string; icon?: string }

export function TileSelect({
  label,
  options,
  value,
  onChange,
  columns = 2,
}: {
  label?: string
  options: TileOption[]
  value: string | null
  onChange: (v: string) => void
  columns?: 2 | 3 | 4
}) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[columns]
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-medium text-gray-500">{label}</p>}
      <div className={`grid ${cols} gap-2`}>
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-xl text-xs font-semibold border-2 transition-colors min-h-[52px] ${
              value === o.value
                ? 'bg-harcourts-navy text-white border-harcourts-navy'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            {o.icon && <span className="text-base leading-none">{o.icon}</span>}
            <span className="text-center leading-tight">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── MultiSelect ───────────────────────────────────────────────────────────────
// Multi-select grid — same visuals as TileSelect but toggles.

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  columns = 2,
}: {
  label?: string
  options: TileOption[]
  value: string[]
  onChange: (v: string[]) => void
  columns?: 2 | 3 | 4
}) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[columns]
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-medium text-gray-500">{label}</p>}
      <div className={`grid ${cols} gap-2`}>
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-xl text-xs font-semibold border-2 transition-colors min-h-[52px] ${
              value.includes(o.value)
                ? 'bg-harcourts-navy text-white border-harcourts-navy'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            {o.icon && <span className="text-base leading-none">{o.icon}</span>}
            <span className="text-center leading-tight">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── YesNo ─────────────────────────────────────────────────────────────────────

export function YesNo({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <p className="text-sm text-gray-700 flex-1 pr-4">{label}</p>
      <div className="flex gap-1.5 shrink-0">
        {([true, false] as const).map(v => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-colors ${
              value === v
                ? 'bg-harcourts-navy text-white border-harcourts-navy'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── NumInput ──────────────────────────────────────────────────────────────────

export function NumInput({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  step = 1,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  function inc() { if (value < max) onChange(Math.round((value + step) * 10) / 10) }
  function dec() { if (value > min) onChange(Math.round((value - step) * 10) / 10) }
  return (
    <div className="flex items-center justify-between py-1">
      <p className="text-sm text-gray-700 flex-1">{label}</p>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={dec} disabled={value <= min}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-30 hover:bg-gray-200 transition-colors leading-none">
          −
        </button>
        <span className="w-8 text-center font-semibold text-sm tabular-nums">
          {value}{suffix}
        </span>
        <button type="button" onClick={inc} disabled={value >= max}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-30 hover:bg-gray-200 transition-colors leading-none">
          +
        </button>
      </div>
    </div>
  )
}

// ── TextInput ─────────────────────────────────────────────────────────────────

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  type?: 'text' | 'number' | 'url'
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-harcourts-navy"
      />
    </div>
  )
}

// ── NoteInput ─────────────────────────────────────────────────────────────────
// Includes a mic button (Web Speech API) so notes can be dictated instead of
// typed — useful mid-walkthrough with hands full of a phone/tape measure.
// Silently omits the button on browsers with no SpeechRecognition support
// (e.g. desktop Firefox) rather than showing a broken control.

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null
}

function MicButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    setSupported(!!getSpeechRecognition())
  }, [])

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const SpeechRecognitionCtor = getSpeechRecognition()
    if (!SpeechRecognitionCtor) return

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-ZA'
    recognition.onresult = event => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) transcript += result[0].transcript
      }
      if (transcript.trim()) onTranscript(transcript.trim())
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? 'Stop dictating' : 'Dictate note'}
      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
        listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 11a7 7 0 0 1-14 0M12 19v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function NoteInput({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-medium text-gray-500">{label}</p>}
      <div className="flex items-start gap-2">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'Notes…'}
          rows={rows}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-harcourts-navy"
        />
        <MicButton onTranscript={text => onChange(value ? `${value} ${text}` : text)} />
      </div>
    </div>
  )
}

// ── ScoreSelect ───────────────────────────────────────────────────────────────
// 1–5 rating with labels.

const SCORE_LABELS: Record<number, string> = {
  1: 'Very poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent',
}

export function ScoreSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {value && <p className="text-xs text-gray-400">{SCORE_LABELS[value]}</p>}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
              value === n
                ? 'bg-harcourts-navy text-white border-harcourts-navy'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── SectionCard ───────────────────────────────────────────────────────────────

export function SectionCard({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</p>
        <span className="text-gray-400 text-sm">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-4 py-3 space-y-3">{children}</div>}
    </div>
  )
}

// ── ConditionSelect ───────────────────────────────────────────────────────────

export function ConditionSelect({
  label = 'Condition',
  value,
  onChange,
}: {
  label?: string
  value: string | null
  onChange: (v: 'good' | 'fair' | 'needs_work') => void
}) {
  return (
    <TileSelect
      label={label}
      columns={3}
      value={value}
      onChange={v => onChange(v as 'good' | 'fair' | 'needs_work')}
      options={[
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'needs_work', label: 'Needs work' },
      ]}
    />
  )
}

// ── NextButton ────────────────────────────────────────────────────────────────

export function NextButton({
  onPress,
  saving,
  disabled,
  label = 'Next',
}: {
  onPress: () => void
  saving?: boolean
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={saving || disabled}
      className="w-full bg-harcourts-navy text-white font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40 hover:bg-harcourts-navy/90 transition-colors mt-2"
    >
      {saving ? 'Saving…' : label}
    </button>
  )
}
