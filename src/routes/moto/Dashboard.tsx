import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  Bike, Droplets, Wrench, AlertTriangle, FileText,
  CheckCircle2, Cog, TrendingUp, Gauge,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useMoto } from '@/store/moto'
import { useMotoDashboard, type RecentActivityItem, type PartDueItem, type EfficiencyPoint } from '@/hooks/useMotoDashboard'
import { openMotoEditor } from '@/store/motoEditor'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { VehicleSnapshotCard } from '@/components/moto/cards/VehicleSnapshotCard'
import { OpenIssuesCard } from '@/components/moto/cards/OpenIssuesCard'
import { ExpiringDocsCard } from '@/components/moto/cards/ExpiringDocsCard'
import { EmptyState } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { ActionDropdown } from '@/components/ActionDropdown'
import { useMotoActions } from '@/hooks/useMotoActions'
import { cn } from '@/lib/utils'

const SERVICE_TYPE_LABEL: Record<string, string> = {
  general: 'General', oil_change: 'Oil Change', tire: 'Tyre',
  brake: 'Brake', battery: 'Battery', major: 'Major', other: 'Other',
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, gradient,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  gradient?: string
}) {
  return (
    <div
      className="glass-panel rounded-[26px] p-4"
      style={gradient
        ? { background: gradient, boxShadow: 'var(--shadow-glow)', border: 'none' }
        : { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }
      }
    >
      <div
        className="font-sans text-[10px] font-bold uppercase tracking-[0.5px] mb-1.5"
        style={{ color: gradient ? 'color-mix(in srgb, var(--text-on-brand) 76%, transparent)' : 'var(--text-tertiary)' }}
      >
        {label}
      </div>
      <div
        className="font-sans font-extrabold text-[24px] leading-none tracking-tight"
        style={{ color: gradient ? 'var(--text-on-brand)' : 'var(--text-primary)' }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="font-body text-[11px] mt-1.5"
          style={{ color: gradient ? 'color-mix(in srgb, var(--text-on-brand) 76%, transparent)' : 'var(--text-secondary)' }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── Quick action button ───────────────────────────────────────────────────────
function QuickActionBtn({
  icon, label, onClick, accentColor,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  accentColor?: string
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel flex flex-col items-center justify-center gap-1.5 rounded-[20px] py-3.5 px-2 transition-all active:scale-95 hover:bg-[var(--bg-surface-2)]"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <div
        className="w-9 h-9 rounded-[14px] flex items-center justify-center"
        style={{ background: accentColor ? `${accentColor}1a` : 'var(--bg-surface-2)' }}
      >
        {icon}
      </div>
      <span className="font-sans text-[11px] font-bold text-[var(--text-secondary)] leading-none">{label}</span>
    </button>
  )
}

// ─── Efficiency mini chart ─────────────────────────────────────────────────────
function EfficiencyMiniChart({
  points, latestKmpl,
}: {
  points: EfficiencyPoint[]
  latestKmpl: number | null
}) {
  const avg = points.reduce((s, p) => s + p.kmpl, 0) / points.length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-sans font-extrabold text-[11px] uppercase tracking-[0.4px] text-[var(--text-tertiary)]">
          Efficiency
        </p>
        {latestKmpl !== null && (
          <span className="font-sans font-extrabold text-[13px]" style={{ color: '#16a34a' }}>
            {latestKmpl.toFixed(1)} km/L
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
            }}
            formatter={(v: number) => [`${v.toFixed(1)} km/L`, '']}
            labelStyle={{ color: 'var(--text-secondary)', marginBottom: 2 }}
          />
          <ReferenceLine y={avg} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="kmpl"
            stroke="var(--color-brand-500)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-brand-500)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="font-body text-[10px] text-[var(--text-tertiary)] mt-1">
        avg {avg.toFixed(1)} km/L · {points.length} fills
      </p>
    </div>
  )
}

// ─── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ item, vehicleId }: { item: RecentActivityItem; vehicleId: string }) {
  if (item.kind === 'fuel') {
    const { log } = item
    return (
      <button
        onClick={() => openMotoEditor({ kind: 'fuel', id: log.id, vehicleId })}
        className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors hover:bg-[var(--bg-surface-2)]"
      >
        <div
          className="w-9 h-9 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.12)' }}
        >
          <Droplets size={16} color="var(--color-brand-500)" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-bold text-[13px] text-[var(--text-primary)] truncate">
            Fuel · {log.litres}L @ ₹{log.pricePerL}/L
          </p>
          <p className="font-body text-[11px] text-[var(--text-secondary)] truncate">
            {format(parseISO(log.date), 'd MMM yyyy')} · {log.odoKm.toLocaleString()} km
            {log.station && ` · ${log.station}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-sans font-extrabold text-[14px] text-[var(--text-primary)]">
            ₹{log.totalCost.toLocaleString()}
          </p>
          {log.fullTank && (
            <p className="font-body text-[10px] text-[var(--text-tertiary)]">Full tank</p>
          )}
        </div>
      </button>
    )
  }

  const { service } = item
  return (
    <button
      onClick={() => openMotoEditor({ kind: 'service', id: service.id, vehicleId })}
      className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors hover:bg-[var(--bg-surface-2)]"
    >
      <div
        className="w-9 h-9 rounded-[14px] flex items-center justify-center shrink-0"
        style={{ background: 'rgba(249,115,22,0.12)' }}
      >
        <Wrench size={16} color="#f97316" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans font-bold text-[13px] text-[var(--text-primary)] truncate">
          {SERVICE_TYPE_LABEL[service.serviceType] ?? service.serviceType}
          {service.workshop && ` · ${service.workshop}`}
        </p>
        <p className="font-body text-[11px] text-[var(--text-secondary)] truncate">
          {format(parseISO(service.date), 'd MMM yyyy')} · {service.odoKm.toLocaleString()} km
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-sans font-extrabold text-[14px] text-[var(--text-primary)]">
          ₹{service.totalCost.toLocaleString()}
        </p>
      </div>
    </button>
  )
}

// ─── Parts due section ─────────────────────────────────────────────────────────
function PartsDueSection({ partsDue, vehicleId }: { partsDue: PartDueItem[]; vehicleId: string }) {
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-sans font-extrabold text-[11px] uppercase tracking-[0.5px] text-[var(--text-secondary)]">
          Parts Attention
        </span>
        <span
          className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full font-sans font-bold text-[10px] text-[var(--text-tertiary)]"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          {partsDue.length}
        </span>
      </div>
      <div
        className="glass-panel rounded-[26px] overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        {partsDue.map(({ part, status }, i) => {
          const isOverdue = status === 'overdue'
          const color = isOverdue ? 'var(--color-brand-500)' : '#f97316'
          const bg    = isOverdue ? 'rgba(229,9,20,0.1)' : 'rgba(251,146,60,0.12)'
          return (
            <button
              key={part.id}
              onClick={() => openMotoEditor({ kind: 'part', id: part.id, vehicleId })}
              className={cn(
                'flex items-center gap-3 px-4 py-3 w-full text-left transition-colors hover:bg-[var(--bg-surface-2)]',
                i < partsDue.length - 1 && 'border-b border-[var(--border-subtle)]',
              )}
            >
              <div
                className="w-9 h-9 rounded-[14px] flex items-center justify-center shrink-0"
                style={{ background: bg }}
              >
                <Cog size={16} color={color} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-[13px] text-[var(--text-primary)] truncate">{part.partName}</p>
                <p className="font-body text-[11px] text-[var(--text-secondary)]">
                  {part.brand && `${part.brand} · `}Installed {format(parseISO(part.installedAt), 'd MMM yyyy')}
                </p>
              </div>
              <span
                className="shrink-0 rounded-xl px-2 py-0.5 font-sans text-[11px] font-bold"
                style={{ background: bg, color }}
              >
                {isOverdue ? 'Overdue' : 'Due soon'}
              </span>
            </button>
          )
        })}
      </div>
      <button
        onClick={() => navigate('/moto/parts')}
        className="mt-2 w-full text-center font-sans text-[12px] font-bold text-[var(--text-tertiary)] py-1 hover:text-[var(--text-primary)] transition-colors"
      >
        View all parts →
      </button>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function MotoDashboard() {
  const navigate    = useNavigate()
  const { activeVehicleId } = useMoto()
  const motoActions = useMotoActions(activeVehicleId ? 'fuel' : 'vehicle')

  const {
    vehicle,
    latestKmpl, monthFuelSpend, totalFillsThisMonth,
    lastService, nextDueStatus,
    openIssues, highPriorityCount, alertDocs,
    partsDue, recentActivity, efficiencyPoints,
    isLoading,
  } = useMotoDashboard(activeVehicleId)


  // ── No vehicle ──────────────────────────────────────────────────────────────
  if (!activeVehicleId) {
    return (
      <div className="min-h-screen bg-app">
        <DesktopPageHeader action={<ActionDropdown items={motoActions} />} />
        <div className="px-4 pb-6">
          <EmptyState
            icon={<Bike size={26} strokeWidth={1.8} />}
            headline="No vehicle selected"
            subheadline="Add your first vehicle to start tracking fuel, service, and costs."
            action={{ label: '+ Add your first vehicle', onClick: () => openMotoEditor({ kind: 'vehicle' }) }}
            hero
          />
        </div>
      </div>
    )
  }

  if (isLoading || !vehicle) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
      </div>
    )
  }

  const allClear = openIssues.length === 0 && alertDocs.length === 0

  const { overall: serviceOverall, daysRemaining } = nextDueStatus

  const serviceStatValue = lastService
    ? serviceOverall === 'overdue'
      ? 'Overdue'
      : serviceOverall === 'due-soon'
        ? 'Due soon'
        : daysRemaining != null
          ? `${daysRemaining}d`
          : 'OK'
    : '—'
  const serviceStatGradient = serviceOverall === 'overdue'
    ? 'linear-gradient(135deg, #e50914 0%, #b91c1c 100%)'
    : serviceOverall === 'due-soon'
      ? 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)'
      : undefined

  return (
    <div className="min-h-screen bg-app">
      <DesktopPageHeader action={<ActionDropdown items={motoActions} />} />

      {/* Vehicle switcher — sticky below header on both breakpoints */}
      <div className="border-b border-[var(--border-subtle)] bg-[rgba(var(--bg-app-rgb),0.72)] backdrop-blur-xl sticky top-[60px] z-10 pt-2">
        <VehicleSwitcher />
      </div>

      {/* ── Mobile: vehicle snapshot + 4-stat strip ──────────────── */}
      <div className="lg:hidden px-4 pt-4 pb-2 space-y-3">
        <VehicleSnapshotCard vehicle={vehicle} />

        <div
          className="glass-panel rounded-2xl px-4 py-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-stretch">
            {[
              {
                value: monthFuelSpend >= 1000
                  ? `₹${(monthFuelSpend / 1000).toFixed(0)}K`
                  : `₹${monthFuelSpend}`,
                label: 'This month',
                color: undefined as string | undefined,
              },
              { value: latestKmpl !== null ? latestKmpl.toFixed(1) : '—', label: 'km/L', color: latestKmpl !== null ? '#16a34a' : undefined },
              { value: String(totalFillsThisMonth), label: 'Fills', color: undefined },
              {
                value: String(openIssues.length),
                label: 'Issues',
                color: openIssues.length > 0 ? 'var(--color-brand-500)' : undefined,
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-1',
                  i > 0 && 'border-l border-[var(--border-subtle)]',
                )}
              >
                <span
                  className="font-sans font-extrabold text-[16px]"
                  style={{ color: stat.color ?? 'var(--text-primary)' }}
                >
                  {stat.value}
                </span>
                <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3px] text-[var(--text-tertiary)]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop: hero vehicle snapshot ───────────────────────── */}
      <div className="hidden lg:block px-6 pt-5">
        <VehicleSnapshotCard vehicle={vehicle} />
      </div>

      {/* ════════════════════════════════════════════════════════════
          STAT CARDS — desktop only
      ════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:grid px-6 pt-5 pb-4 grid-cols-4 gap-3">
        <StatCard
          label="Monthly Spend"
          value={
            <>
              ₹{monthFuelSpend >= 1000
                ? `${(monthFuelSpend / 1000).toFixed(1)}K`
                : monthFuelSpend.toLocaleString()}
            </>
          }
          sub={`${totalFillsThisMonth} fill${totalFillsThisMonth === 1 ? '' : 's'} this month`}
          gradient="var(--color-brand-500)"
        />
        <StatCard
          label="Avg km/L"
          value={latestKmpl !== null
            ? <span style={{ color: '#16a34a' }}>{latestKmpl.toFixed(1)}</span>
            : '—'
          }
          sub="last fill-to-fill efficiency"
        />
        <StatCard
          label="Next Service"
          value={serviceStatValue}
          sub={lastService ? (SERVICE_TYPE_LABEL[lastService.serviceType] ?? lastService.serviceType) : 'No service logged'}
          gradient={serviceStatGradient}
        />
        <StatCard
          label="Open Issues"
          value={<span style={{ color: openIssues.length > 0 ? 'var(--color-brand-500)' : 'var(--text-primary)' }}>{openIssues.length}</span>}
          sub={openIssues.length === 0 ? 'all clear' : highPriorityCount > 0 ? `${highPriorityCount} high priority` : `${openIssues.length} need attention`}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════
          BODY — main column + right sidebar
      ════════════════════════════════════════════════════════════ */}
      <div className="flex items-start">

        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-4 lg:px-6 pb-28 lg:pb-16 space-y-5">

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2.5 pt-1 lg:pt-0">
            <QuickActionBtn
              icon={<Droplets size={18} color="var(--color-brand-500)" strokeWidth={2} />}
              label="Log Fuel"
              onClick={() => openMotoEditor({ kind: 'fuel', vehicleId: activeVehicleId })}
              accentColor="var(--color-brand-500)"
            />
            <QuickActionBtn
              icon={<Wrench size={18} color="#f97316" strokeWidth={2} />}
              label="Service"
              onClick={() => openMotoEditor({ kind: 'service', vehicleId: activeVehicleId })}
              accentColor="#f97316"
            />
            <QuickActionBtn
              icon={<AlertTriangle size={18} color="#eab308" strokeWidth={2} />}
              label="Add Issue"
              onClick={() => openMotoEditor({ kind: 'issue', vehicleId: activeVehicleId })}
              accentColor="#eab308"
            />
            <QuickActionBtn
              icon={<FileText size={18} color="#6366f1" strokeWidth={2} />}
              label="Add Note"
              onClick={() => openMotoEditor({ kind: 'note', vehicleId: activeVehicleId })}
              accentColor="#6366f1"
            />
          </div>

          {/* Alert banners */}
          <div>
            <OpenIssuesCard openIssues={openIssues} highPriorityCount={highPriorityCount} />
            <ExpiringDocsCard alertDocs={alertDocs} />
            {allClear && lastService && (
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <CheckCircle2 size={16} color="#16a34a" strokeWidth={2.2} />
                <span className="font-sans text-[13px] font-bold text-[#16a34a]">
                  No open issues · All documents valid
                </span>
              </div>
            )}
          </div>

          {/* Parts needing attention */}
          {partsDue.length > 0 && (
            <PartsDueSection partsDue={partsDue} vehicleId={activeVehicleId} />
          )}

          {/* Recent activity */}
          {recentActivity.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-extrabold text-[11px] uppercase tracking-[0.5px] text-[var(--text-secondary)]">
                    Recent Activity
                  </span>
                  <span
                    className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full font-sans font-bold text-[10px] text-[var(--text-tertiary)]"
                    style={{ background: 'var(--bg-surface-2)' }}
                  >
                    {recentActivity.length}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/moto/fuel')}
                  className="font-sans text-[12px] font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  View all →
                </button>
              </div>
              <div
                className="glass-panel rounded-[26px] overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                {recentActivity.map((item, i) => (
                  <div
                    key={item.kind === 'fuel' ? item.log.id : item.service.id}
                    className={i < recentActivity.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}
                  >
                    <ActivityRow item={item} vehicleId={activeVehicleId} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state (no data at all) */}
          {recentActivity.length === 0 && openIssues.length === 0 && alertDocs.length === 0 && (
            <EmptyState
              icon={<Gauge size={26} strokeWidth={1.8} />}
              headline="Start tracking"
              subheadline="Log your first fuel fill or service to see activity here."
              action={{
                label: '+ Log first fill',
                onClick: () => openMotoEditor({ kind: 'fuel', vehicleId: activeVehicleId }),
              }}
            />
          )}
        </div>

        {/* ── Right sidebar — desktop only ─────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col gap-6 w-[240px] shrink-0 border-l border-[var(--border-subtle)] px-5 py-5"
          style={{ position: 'sticky', top: '64px', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}
        >
          {/* Efficiency chart */}
          {efficiencyPoints.length >= 2 && (
            <EfficiencyMiniChart points={efficiencyPoints} latestKmpl={latestKmpl} />
          )}

          {/* Month summary */}
          <div>
            <p className="font-sans font-extrabold text-[11px] uppercase tracking-[0.4px] text-[var(--text-tertiary)] mb-3">
              This Month
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-[var(--text-secondary)]">Fuel spend</span>
                <span className="font-sans font-bold text-[12px] text-[var(--text-primary)]">
                  ₹{monthFuelSpend.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-[var(--text-secondary)]">Fills</span>
                <span className="font-sans font-bold text-[12px] text-[var(--text-primary)]">{totalFillsThisMonth}</span>
              </div>
              {latestKmpl !== null && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-[12px] text-[var(--text-secondary)]">Latest km/L</span>
                  <span className="font-sans font-bold text-[12px]" style={{ color: '#16a34a' }}>
                    {latestKmpl.toFixed(1)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-[var(--text-secondary)]">Odometer</span>
                <span className="font-sans font-bold text-[12px] text-[var(--text-primary)]">
                  {vehicle.currentOdoKm.toLocaleString()} km
                </span>
              </div>
            </div>
          </div>

          {/* Next service */}
          {lastService && (
            <div>
              <p className="font-sans font-extrabold text-[11px] uppercase tracking-[0.4px] text-[var(--text-tertiary)] mb-3">
                Next Service
              </p>
              <div
                className="rounded-2xl p-3"
                style={{
                  background: serviceOverall === 'overdue'
                    ? 'rgba(229,9,20,0.06)'
                    : serviceOverall === 'due-soon'
                      ? 'rgba(251,146,60,0.06)'
                      : 'var(--bg-surface-2)',
                  border: serviceOverall === 'overdue'
                    ? '1px solid rgba(229,9,20,0.2)'
                    : serviceOverall === 'due-soon'
                      ? '1px solid rgba(251,146,60,0.2)'
                      : '1px solid var(--border-subtle)',
                }}
              >
                <p className="font-sans font-bold text-[13px] text-[var(--text-primary)]">
                  {SERVICE_TYPE_LABEL[lastService.serviceType] ?? lastService.serviceType}
                </p>
                {lastService.nextDueDate && (
                  <p
                    className="font-body text-[11px] mt-0.5"
                    style={{
                      color: serviceOverall === 'ok'
                        ? 'var(--text-secondary)'
                        : serviceOverall === 'due-soon'
                          ? '#f97316'
                          : 'var(--color-brand-500)',
                    }}
                  >
                    {format(parseISO(lastService.nextDueDate), 'd MMM yyyy')}
                    {daysRemaining != null && ` (${daysRemaining >= 0 ? `${daysRemaining}d` : `${Math.abs(daysRemaining)}d overdue`})`}
                  </p>
                )}
                {lastService.nextDueOdoKm && (
                  <p className="font-body text-[11px] mt-0.5 text-[var(--text-tertiary)]">
                    @ {lastService.nextDueOdoKm.toLocaleString()} km
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate('/moto/service')}
                className="mt-1.5 w-full text-center font-sans text-[11px] font-bold text-[var(--text-tertiary)] py-1 hover:text-[var(--text-primary)] transition-colors"
              >
                View history →
              </button>
            </div>
          )}

          {/* Parts due */}
          {partsDue.length > 0 && (
            <div>
              <p className="font-sans font-extrabold text-[11px] uppercase tracking-[0.4px] text-[var(--text-tertiary)] mb-3">
                Parts ({partsDue.length})
              </p>
              <div className="flex flex-col gap-2">
                {partsDue.slice(0, 5).map(({ part, status }) => {
                  const isOverdue = status === 'overdue'
                  return (
                    <div key={part.id} className="flex items-center gap-2">
                      <Cog
                        size={12}
                        color={isOverdue ? 'var(--color-brand-500)' : '#f97316'}
                        strokeWidth={2}
                        className="shrink-0"
                      />
                      <span className="flex-1 font-sans font-semibold text-[12px] text-[var(--text-primary)] truncate">
                        {part.partName}
                      </span>
                      <span
                        className="font-sans font-bold text-[10px] shrink-0"
                        style={{ color: isOverdue ? 'var(--color-brand-500)' : '#f97316' }}
                      >
                        {isOverdue ? 'Overdue' : 'Soon'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Reports link */}
          <button
            onClick={() => navigate('/moto/reports')}
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-2.5 font-sans font-bold text-[12px] transition-colors hover:bg-[var(--bg-surface-2)]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <TrendingUp size={14} strokeWidth={2} />
            View Reports
          </button>
        </aside>
      </div>

    </div>
  )
}
