import {
  Bell,
  CalendarCheck,
  Clock3,
  IndianRupee,
  PieChart,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import Reveal from './Reveal.jsx'
import SectionHeader from './SectionHeader.jsx'

const metricCards = [
  {
    label: 'Donation analytics',
    value: 'INR 8.42L',
    trend: '+18%',
    icon: TrendingUp,
  },
  {
    label: 'Daily collections',
    value: 'INR 3.18L',
    trend: '+11%',
    icon: IndianRupee,
  },
  {
    label: 'Devotee statistics',
    value: '12,840',
    trend: '+24%',
    icon: UsersRound,
  },
]

const overviewItems = [
  { label: 'Booking overview', value: '186 active', icon: CalendarCheck },
  { label: 'Festival management', value: '9 upcoming', icon: Bell },
  { label: 'Expense tracking', value: '72 cleared', icon: PieChart },
  { label: 'Membership renewals', value: '418 due', icon: Clock3 },
]

const chartBars = [48, 72, 58, 86, 64, 92, 76, 88, 66, 95, 82, 90]

export default function DashboardPreview() {
  return (
    <section
      id="dashboard"
      className="relative overflow-hidden bg-[#0B1F3A] px-5 py-24 sm:px-8"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4A017]/60 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          inverse
          eyebrow="Live Admin Dashboard"
          title="Executive clarity for trustees and temple administrators"
          copy="Track every counter, booking, donation, festival expense, and membership renewal with a dashboard built for daily decisions and audit confidence."
        />

        <Reveal className="mt-14">
          <div className="dashboard-grid rounded-lg border border-[#F8F6F0]/14 bg-[#F8F6F0] p-4 text-[#0B1F3A] shadow-[0_32px_90px_rgba(0,0,0,0.36)] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-[#0B1F3A]/10 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-[#9C7414]">
                  THEERTHA Command Center
                </p>
                <h3 className="font-display mt-2 text-3xl font-semibold">
                  Temple Operations Overview
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Today', 'Festival', 'Audit'].map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-[#D4A017]/24 bg-white px-3 py-2 text-sm font-semibold text-[#0B1F3A]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {metricCards.map((metric) => {
                const Icon = metric.icon
                return (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-[#0B1F3A]/10 bg-white/88 p-5 shadow-[0_14px_40px_rgba(11,31,58,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#42516A]">
                          {metric.label}
                        </p>
                        <p className="font-display mt-3 text-3xl font-semibold">
                          {metric.value}
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                        <Icon size={21} aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-[#11875D]">
                      {metric.trend} from previous week
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-lg border border-[#0B1F3A]/10 bg-white/90 p-5 shadow-[0_14px_40px_rgba(11,31,58,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase text-[#9C7414]">
                      Collection Flow
                    </p>
                    <h4 className="font-display mt-2 text-2xl font-semibold">
                      Daily counter and donation trend
                    </h4>
                  </div>
                  <span className="rounded-md bg-[#EFE6D3] px-3 py-2 text-sm font-semibold">
                    Live
                  </span>
                </div>
                <div className="mt-8 flex h-64 items-end gap-3">
                  {chartBars.map((height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className="flex flex-1 flex-col items-center gap-3"
                    >
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-[#0B1F3A] to-[#D4A017] shadow-[0_0_22px_rgba(212,160,23,0.22)]"
                        style={{ height: `${height}%` }}
                      />
                      <span className="h-1 w-1 rounded-full bg-[#D4A017]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {overviewItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-[#0B1F3A]/10 bg-white/90 p-5 shadow-[0_14px_40px_rgba(11,31,58,0.08)]"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EFE6D3] text-[#9C7414]">
                          <Icon size={21} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          <p className="mt-1 text-sm text-[#42516A]">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
