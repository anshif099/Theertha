import { CheckCircle2, FileStack, Layers3, PencilRuler } from 'lucide-react'

const statClass =
  'rounded-lg border border-[#D4A017]/18 bg-white p-5 shadow-[0_16px_42px_rgba(11,31,58,0.08)]'

export default function TempleStats({ temples }) {
  const activeCount = temples.filter((temple) => temple.status === 'Active')
    .length
  const onboardingCount = temples.filter(
    (temple) => temple.status === 'Onboarding',
  ).length
  const districtCount = new Set(temples.map((temple) => temple.district)).size

  const stats = [
    { label: 'Total Temples', value: temples.length, icon: FileStack },
    { label: 'Active', value: activeCount, icon: CheckCircle2 },
    { label: 'Onboarding', value: onboardingCount, icon: PencilRuler },
    { label: 'Districts', value: districtCount, icon: Layers3 },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <article key={stat.label} className={statClass}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#42516A]">
                  {stat.label}
                </p>
                <p className="font-display mt-2 text-3xl font-semibold">
                  {stat.value}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                <Icon size={21} aria-hidden="true" />
              </span>
            </div>
          </article>
        )
      })}
    </section>
  )
}
