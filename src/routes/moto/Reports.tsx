import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { BarChart2, Fuel, Wrench, Cog, RouteIcon, TrendingUp } from 'lucide-react'
import { useMoto } from '@/store/moto'
import { fuelLogsRepo } from '@/db/repos/moto/fuelLogs'
import { servicesRepo } from '@/db/repos/moto/services'
import { partsRepo } from '@/db/repos/moto/parts'
import { VehicleSwitcher } from '@/components/moto/VehicleSwitcher'
import { EmptyState } from '@/components/ui'
import { DesktopPageHeader } from '@/components/DesktopPageHeader'
import { PageHeader } from '@/components/PageHeader'
import {
  computeMotoReportData,
  motoReportPeriodLabel,
  type MotoReportPeriod,
} from '@/lib/moto/reports'
import { format, parseISO } from 'date-fns'

const PERIODS: MotoReportPeriod[] = ['3m', '6m', '12m']

const SERVICE_TYPE_LABEL: Record<string, string> = {
  general: 'General', oil_change: 'Oil Change', tire: 'Tyre',
  brake: 'Brake', battery: 'Battery', major: 'Major', other: 'Other',
}

function formatK(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)   return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl px-4 py-4" style={{ background: 'var(--bg-surface-2)' }}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</span>
      </div>
      <div className="font-sans text-[22px] font-extrabold text-[var(--text-primary)]">{value}</div>
      {sub && <div className="font-body text-[11px] text-[var(--text-tertiary)]">{sub}</div>}
    </div>
  )
}

const tooltipStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
}

export default function MotoReports() {
  const { activeVehicleId } = useMoto()
  const [period, setPeriod] = useState<MotoReportPeriod>('6m')

  const fuelLogs = useLiveQuery(
    () => activeVehicleId ? fuelLogsRepo.getAllForVehicle(activeVehicleId) : Promise.resolve([]),
    [activeVehicleId],
  ) ?? []

  const services = useLiveQuery(
    () => activeVehicleId ? servicesRepo.getAllForVehicle(activeVehicleId) : Promise.resolve([]),
    [activeVehicleId],
  ) ?? []

  const parts = useLiveQuery(
    () => activeVehicleId ? partsRepo.getAllForVehicle(activeVehicleId) : Promise.resolve([]),
    [activeVehicleId],
  ) ?? []

  const data = useMemo(
    () => computeMotoReportData(fuelLogs, services, parts, period),
    [fuelLogs, services, parts, period],
  )

  const isEmpty = fuelLogs.length === 0 && services.length === 0 && parts.length === 0

  return (
    <div className="min-h-screen pb-28 bg-app">
      <DesktopPageHeader />
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="px-4 pt-4">
          <PageHeader kicker="Moto" title="Reports" description="Cost breakdowns, efficiency trends, and service history." />
        </div>

        {/* Vehicle switcher */}
        <div className="pt-2">
          <VehicleSwitcher />
        </div>

      <div className="px-4 pt-3 pb-4">
      {/* Period selector */}
      <div className="mb-5 flex gap-1.5">
        {PERIODS.map(p => {
          const active = period === p
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-full px-4 py-2 font-sans text-[12px] font-bold transition-all"
              style={{
                background: active ? 'var(--color-brand-500)' : 'var(--bg-surface-2)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: active ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              {motoReportPeriodLabel(p)}
            </button>
          )
        })}
      </div>

      {!activeVehicleId && (
        <EmptyState
          icon={<BarChart2 size={20} strokeWidth={1.8} />}
          headline="No vehicle selected"
          subheadline="Select a vehicle above to view its reports."
        />
      )}

      {activeVehicleId && isEmpty && (
        <EmptyState
          icon={<BarChart2 size={20} strokeWidth={1.8} />}
          headline="No data yet"
          subheadline="Log fuel fills and service visits to unlock reports."
        />
      )}

      {activeVehicleId && !isEmpty && (
        <div className="flex flex-col gap-5">

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<BarChart2 size={14} color="var(--color-brand-500)" strokeWidth={2} />}
              label="Total cost"
              value={`₹${Math.round(data.totalCost).toLocaleString()}`}
              sub={motoReportPeriodLabel(period)}
            />
            <StatCard
              icon={<RouteIcon size={14} color="var(--color-brand-500)" strokeWidth={2} />}
              label="Cost per km"
              value={data.costPerKm !== null ? `₹${data.costPerKm.toFixed(2)}` : '—'}
              sub={data.totalDistanceKm > 0 ? `${data.totalDistanceKm.toLocaleString()} km tracked` : 'Not enough data'}
            />
            <StatCard
              icon={<TrendingUp size={14} color="#16a34a" strokeWidth={2} />}
              label="Avg efficiency"
              value={data.avgKmpl !== null ? `${data.avgKmpl.toFixed(1)} km/L` : '—'}
              sub={data.fillCount > 0 ? `${data.fillCount} fill${data.fillCount !== 1 ? 's' : ''}` : undefined}
            />
            <StatCard
              icon={<Fuel size={14} color="#f97316" strokeWidth={2} />}
              label="Avg monthly"
              value={`₹${Math.round(data.avgMonthlySpend).toLocaleString()}`}
              sub="all categories"
            />
          </div>

          {/* Monthly spend bar chart */}
          <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--bg-surface-2)' }}>
            <div className="mb-1 font-sans text-[14px] font-bold text-[var(--text-primary)]">Monthly spend</div>
            <div className="mb-4 font-body text-[12px] text-[var(--text-secondary)]">Fuel · Service · Parts by month</div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={data.monthlyBars} barCategoryGap="30%" barGap={2}>
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: 'var(--font-sans)', fontSize: 11, fill: 'var(--text-tertiary)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={formatK}
                  tick={{ fontFamily: 'var(--font-sans)', fontSize: 10, fill: 'var(--text-tertiary)' }}
                  axisLine={false} tickLine={false} width={36}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [`₹${Math.round(value).toLocaleString()}`, name]}
                  labelStyle={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'var(--bg-surface-3)', radius: 6 }}
                />
                <Bar dataKey="fuel"    name="Fuel"    stackId="a" fill="#e50914" radius={[0,0,0,0]} />
                <Bar dataKey="service" name="Service" stackId="a" fill="#f97316" radius={[0,0,0,0]} />
                <Bar dataKey="parts"   name="Parts"   stackId="a" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-center gap-5">
              {[{ color: '#e50914', label: 'Fuel' }, { color: '#f97316', label: 'Service' }, { color: '#6366f1', label: 'Parts' }].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--text-tertiary)]">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Cost split pie */}
          {data.costSplit.length > 0 && (
            <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="mb-1 font-sans text-[14px] font-bold text-[var(--text-primary)]">Cost breakdown</div>
              <div className="mb-4 font-body text-[12px] text-[var(--text-secondary)]">Share of total spend by category</div>
              <div className="flex items-center gap-6">
                <PieChart width={160} height={160}>
                  <Pie
                    data={data.costSplit} cx={80} cy={80}
                    innerRadius={46} outerRadius={72}
                    paddingAngle={2} dataKey="value" strokeWidth={0}
                  >
                    {data.costSplit.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => `₹${Math.round(v).toLocaleString()}`}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
                <div className="flex flex-col gap-3 flex-1">
                  {data.costSplit.map(s => {
                    const pct = data.totalCost > 0 ? (s.value / data.totalCost) * 100 : 0
                    return (
                      <div key={s.name}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-sans text-[12px] font-bold text-[var(--text-primary)]">{s.name}</span>
                          <span className="font-sans text-[11px] text-[var(--text-tertiary)]">{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-surface-3)' }}>
                          <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: s.color }} />
                        </div>
                        <div className="mt-0.5 font-sans text-[11px] font-bold text-[var(--text-secondary)]">
                          ₹{Math.round(s.value).toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Fuel efficiency trend */}
          {data.efficiencyPoints.length >= 2 && (
            <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="mb-1 font-sans text-[14px] font-bold text-[var(--text-primary)]">Fuel efficiency trend</div>
              <div className="mb-4 font-body text-[12px] text-[var(--text-secondary)]">km/L per full-tank fill · fill-to-fill method</div>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={data.efficiencyPoints} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontFamily: 'var(--font-sans)', fontSize: 10, fill: 'var(--text-tertiary)' }}
                    axisLine={false} tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={v => `${v}`}
                    tick={{ fontFamily: 'var(--font-sans)', fontSize: 10, fill: 'var(--text-tertiary)' }}
                    axisLine={false} tickLine={false} width={30}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} km/L`, 'Efficiency']}
                    labelStyle={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}
                    contentStyle={tooltipStyle}
                  />
                  <Line
                    type="monotone" dataKey="kmpl"
                    stroke="#16a34a" strokeWidth={2.5}
                    dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {data.avgKmpl !== null && (
                <div className="mt-3 text-center font-sans text-[12px] text-[var(--text-tertiary)]">
                  Average: <span className="font-bold text-[#16a34a]">{data.avgKmpl.toFixed(1)} km/L</span>
                </div>
              )}
            </div>
          )}

          {/* Service interval timeline */}
          {data.serviceTimeline.length > 0 && (
            <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="mb-1 font-sans text-[14px] font-bold text-[var(--text-primary)]">Service history</div>
              <div className="mb-4 font-body text-[12px] text-[var(--text-secondary)]">Interval between visits</div>
              <div className="flex flex-col gap-0">
                {data.serviceTimeline.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5">
                    {/* timeline dot + line */}
                    <div className="flex flex-col items-center gap-0 shrink-0 pt-0.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-brand-500)' }} />
                      {i < data.serviceTimeline.length - 1 && (
                        <div className="w-px flex-1 mt-0.5" style={{ height: 32, background: 'var(--border-subtle)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans text-[13px] font-bold text-[var(--text-primary)]">
                          {SERVICE_TYPE_LABEL[item.serviceType] ?? item.serviceType}
                        </span>
                        {item.intervalKm !== undefined && item.intervalKm > 0 && (
                          <span className="rounded-xl px-2 py-0.5 font-sans text-[10px] font-bold"
                            style={{ background: 'var(--bg-surface-3)', color: 'var(--text-tertiary)' }}>
                            +{item.intervalKm.toLocaleString()} km
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-body text-[11px] text-[var(--text-tertiary)]">
                        {format(parseISO(item.date), 'd MMM yyyy')} · {item.odoKm.toLocaleString()} km · ₹{Math.round(item.totalCost).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-category totals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 rounded-2xl py-3" style={{ background: 'var(--bg-surface-2)' }}>
              <Fuel size={16} color="#e50914" strokeWidth={2} />
              <div className="font-sans text-[13px] font-extrabold text-[var(--text-primary)]">₹{Math.round(data.totalFuelCost).toLocaleString()}</div>
              <div className="font-body text-[10px] text-[var(--text-tertiary)]">Fuel</div>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-2xl py-3" style={{ background: 'var(--bg-surface-2)' }}>
              <Wrench size={16} color="#f97316" strokeWidth={2} />
              <div className="font-sans text-[13px] font-extrabold text-[var(--text-primary)]">₹{Math.round(data.totalServiceCost).toLocaleString()}</div>
              <div className="font-body text-[10px] text-[var(--text-tertiary)]">Service</div>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-2xl py-3" style={{ background: 'var(--bg-surface-2)' }}>
              <Cog size={16} color="#6366f1" strokeWidth={2} />
              <div className="font-sans text-[13px] font-extrabold text-[var(--text-primary)]">₹{Math.round(data.totalPartsCost).toLocaleString()}</div>
              <div className="font-body text-[10px] text-[var(--text-tertiary)]">Parts</div>
            </div>
          </div>

        </div>
      )}
      </div>
      </div>
    </div>
  )
}
