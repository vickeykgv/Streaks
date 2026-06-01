import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Droplets, Wrench, Cog, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { useModule } from '@/store/module'
import { useLiveQuery } from 'dexie-react-hooks'
import { vehiclesRepo } from '@/db/repos/moto/vehicles'
import { openMotoEditor } from '@/store/motoEditor'

type QuickKind = 'fuel' | 'service' | 'part' | 'issue'

const QUICK_OPTIONS: { kind: QuickKind; Icon: LucideIcon; label: string; desc: string; color: string }[] = [
  { kind: 'fuel',    Icon: Droplets,      label: 'Fuel-up',     desc: 'Litres, cost & odometer', color: 'var(--color-brand-500)' },
  { kind: 'service', Icon: Wrench,        label: 'Service',     desc: 'Repairs & maintenance',   color: '#f97316' },
  { kind: 'part',    Icon: Cog,           label: 'Spare part',  desc: 'With warranty tracking',  color: '#6366f1' },
  { kind: 'issue',   Icon: AlertTriangle, label: 'To-fix note', desc: 'Jot a niggle for later',  color: '#eab308' },
]

function QuickChooser({ open, onClose, onPick, vehicleName }: {
  open: boolean
  onClose: () => void
  onPick: (k: QuickKind) => void
  vehicleName?: string
}) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    } else {
      setShown(false)
      t = setTimeout(() => setMounted(false), 400)
    }
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 30,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: shown ? 1 : 0,
          transition: 'opacity 0.34s ease',
        }}
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        className="fixed inset-x-0 bottom-0 rounded-t-[26px]"
        style={{
          zIndex: 31,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderBottom: 'none',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
          transform: shown ? 'translateY(0)' : 'translateY(104%)',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-0.5">
          <div
            className="w-9 h-[3.5px] rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-3 pb-3">
          <div>
            <p className="font-sans text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
              What happened?
            </p>
            {vehicleName && (
              <p className="font-body text-[13px] text-[var(--text-secondary)] mt-0.5">
                Logging for your {vehicleName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center font-sans text-[14px] text-[var(--text-secondary)]"
            style={{ background: 'var(--bg-surface-2)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 2×2 quick-log grid */}
        <div
          className="grid grid-cols-2 gap-3 px-5"
          style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
        >
          {QUICK_OPTIONS.map(({ kind, Icon, label, desc, color }) => (
            <button
              key={kind}
              type="button"
              onClick={() => onPick(kind)}
              className="flex flex-col items-start rounded-[16px] p-[15px] text-left transition-transform active:scale-[0.97]"
              style={{
                gap: '5px',
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center"
                style={{
                  marginBottom: 4,
                  background: `color-mix(in srgb, ${color} 16%, transparent)`,
                  color,
                }}
              >
                <Icon size={22} strokeWidth={1.6} />
              </div>
              <span className="font-sans text-[15px] font-semibold text-[var(--text-primary)]">
                {label}
              </span>
              <span
                className="font-body leading-[1.3] text-[var(--text-tertiary)]"
                style={{ fontSize: '11.5px' }}
              >
                {desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  )
}

export function MotoFAB() {
  const { activeModule } = useModule()
  const { activeVehicleId } = useMoto()
  const [open, setOpen] = useState(false)

  const vehicle = useLiveQuery(
    () => activeVehicleId ? vehiclesRepo.getById(activeVehicleId) : Promise.resolve(undefined),
    [activeVehicleId],
  )

  if (activeModule !== 'moto' || !activeVehicleId) return null

  const close = () => setOpen(false)

  const pick = (kind: QuickKind) => {
    close()
    setTimeout(() => openMotoEditor({ kind, vehicleId: activeVehicleId }), 360)
  }

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="lg:hidden fixed bottom-24 right-4 w-[56px] h-[56px] rounded-[18px] flex items-center justify-center z-20 transition-all duration-200"
        style={{
          background: 'var(--color-brand-500)',
          boxShadow: 'var(--shadow-fab)',
          transform: open ? 'scale(0.9) rotate(45deg)' : 'scale(1) rotate(0deg)',
        }}
        aria-label="Quick log"
      >
        <Plus size={24} strokeWidth={2.4} color="#fff" />
      </button>

      <QuickChooser
        open={open}
        onClose={close}
        onPick={pick}
        vehicleName={vehicle?.name}
      />
    </>
  )
}
