import {
  CalendarDays,
  Cloud,
  Database,
  LockKeyhole,
  Printer,
  QrCode,
  Smartphone,
  UsersRound,
} from 'lucide-react'
import Reveal from './Reveal.jsx'
import SectionHeader from './SectionHeader.jsx'

const reasons = [
  { title: 'Multi-user access', icon: UsersRound },
  { title: 'Cloud backup', icon: Cloud },
  { title: 'Real-time reports', icon: Database },
  { title: 'Secure accounting', icon: LockKeyhole },
  { title: 'QR billing', icon: QrCode },
  { title: 'Festival scheduling', icon: CalendarDays },
  { title: 'Receipt printing', icon: Printer },
  { title: 'Mobile-friendly interface', icon: Smartphone },
]

export default function WhyChoose() {
  return (
    <section className="relative bg-[#EFE6D3] px-5 py-24 text-[#0B1F3A] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Why Choose THEERTHA"
          title="Built for tradition, governed like modern enterprise software"
          copy="Bring calm control to daily service counters, trusteeship, accounting, inventory, devotee services, and festival scale operations."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => {
            const Icon = reason.icon
            return (
              <Reveal
                key={reason.title}
                delay={(index % 4) * 0.05}
                className="h-full"
              >
                <article className="h-full rounded-lg border border-[#D4A017]/24 bg-[#F8F6F0]/82 p-6 shadow-[0_18px_54px_rgba(11,31,58,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(212,160,23,0.18)]">
                  <Icon className="text-[#9C7414]" size={28} />
                  <h3 className="font-display mt-5 text-xl font-semibold">
                    {reason.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#42516A]">
                    Designed for reliable temple administration across counters,
                    offices, and trustee reviews.
                  </p>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
