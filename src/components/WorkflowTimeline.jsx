import {
  ArrowRight,
  Calculator,
  CalendarPlus,
  FileText,
  HandCoins,
  Receipt,
  UserPlus,
} from 'lucide-react'
import Reveal from './Reveal.jsx'
import SectionHeader from './SectionHeader.jsx'

const steps = [
  { title: 'Devotee Registration', icon: UserPlus },
  { title: 'Booking', icon: CalendarPlus },
  { title: 'Billing', icon: Receipt },
  { title: 'Donation', icon: HandCoins },
  { title: 'Accounts', icon: Calculator },
  { title: 'Reports', icon: FileText },
]

export default function WorkflowTimeline() {
  return (
    <section
      id="workflow"
      className="relative overflow-hidden bg-[#0B1F3A] px-5 py-24 sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          inverse
          eyebrow="Temple Operations Workflow"
          title="One continuous path from devotee service to trustee reports"
          copy="THEERTHA keeps every step connected, traceable, and easy for staff to operate during quiet days and festival rushes."
        />

        <Reveal className="mt-14">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <article
                  key={step.title}
                  className="glass-card relative rounded-lg p-5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#D4A017] text-[#07172D]">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase text-[#F7D77C]">
                    Step {index + 1}
                  </p>
                  <h3 className="font-display mt-2 text-xl font-semibold">
                    {step.title}
                  </h3>
                  {index < steps.length - 1 ? (
                    <ArrowRight
                      className="absolute right-5 top-5 hidden text-[#F7D77C]/58 xl:block"
                      size={22}
                      aria-hidden="true"
                    />
                  ) : null}
                </article>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
