import {
  Archive,
  Banknote,
  Bed,
  Building2,
  HandCoins,
  IdCard,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Store,
  UsersRound,
  Wallet,
} from 'lucide-react'
import Reveal from './Reveal.jsx'
import SectionHeader from './SectionHeader.jsx'

const features = [
  { title: 'Counter Management', icon: Landmark },
  { title: 'Billing Management', icon: ReceiptText },
  { title: 'Temple Management', icon: Building2 },
  { title: 'Devotee Management', icon: UsersRound },
  { title: 'Membership Management', icon: IdCard },
  { title: 'Nadavaravu Management', icon: HandCoins },
  { title: 'Account Management', icon: Wallet },
  { title: 'Asset Management', icon: Archive },
  { title: 'Guest House Management', icon: Bed },
  { title: 'Elephant Management', icon: ShieldCheck },
  { title: 'Store Management', icon: Store },
  { title: 'Fixed Deposit Management', icon: Banknote },
]

export default function FeatureCards() {
  return (
    <section
      id="features"
      className="relative bg-[#F8F6F0] px-5 py-24 text-[#0B1F3A] sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Temple ERP Modules"
          title="A complete command center for every sacred operation"
          copy="THEERTHA unifies counters, receipts, offerings, devotees, finance, inventory, assets, guest rooms, and administration inside a calm enterprise workflow."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Reveal
                key={feature.title}
                delay={(index % 4) * 0.05}
                className="h-full"
              >
                <article className="group h-full rounded-lg border border-[#D4A017]/20 bg-white/78 p-6 shadow-[0_16px_50px_rgba(11,31,58,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#D4A017]/60 hover:shadow-[0_22px_60px_rgba(212,160,23,0.22)]">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C] shadow-[0_12px_32px_rgba(11,31,58,0.18)] transition group-hover:bg-[#D4A017] group-hover:text-[#0B1F3A]">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#0B1F3A]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#42516A]">
                    Structured, auditable, and fast enough for high-volume temple
                    service counters.
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
