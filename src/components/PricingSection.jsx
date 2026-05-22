import { Check, Crown } from 'lucide-react'
import Reveal from './Reveal.jsx'
import SectionHeader from './SectionHeader.jsx'

const plans = [
  {
    name: 'Basic',
    price: 'Starter',
    description: 'For small temples moving from manual records to digital flow.',
    features: ['Counter billing', 'Devotee records', 'Daily reports', 'Receipt printing'],
  },
  {
    name: 'Professional',
    price: 'Most chosen',
    description: 'For growing temples with finance, offerings, bookings, and staff access.',
    features: [
      'All Basic features',
      'Accounts and assets',
      'Festival scheduling',
      'QR billing',
      'Cloud backup',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For multi-counter temples, trusts, and advanced administrative teams.',
    features: [
      'All Professional features',
      'Multi-branch access',
      'Advanced audit reports',
      'Priority onboarding',
      'Custom workflows',
    ],
  },
]

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#EFE6D3] px-5 py-24 text-[#0B1F3A] sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Pricing"
          title="Plans for every temple administration journey"
          copy="Start simple, scale with confidence, and add enterprise controls when your operations require deeper governance."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 0.08} className="h-full">
              <article
                className={`relative h-full rounded-lg p-7 shadow-[0_20px_62px_rgba(11,31,58,0.1)] ${
                  plan.featured
                    ? 'border border-[#D4A017] bg-[#0B1F3A] text-[#F8F6F0]'
                    : 'border border-[#D4A017]/22 bg-[#F8F6F0]'
                }`}
              >
                {plan.featured ? (
                  <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-[#D4A017] px-3 py-2 text-sm font-semibold text-[#07172D]">
                    <Crown size={16} aria-hidden="true" />
                    Recommended
                  </div>
                ) : null}
                <h3 className="font-display text-3xl font-semibold">
                  {plan.name}
                </h3>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    plan.featured ? 'text-[#EFE6D3]/82' : 'text-[#42516A]'
                  }`}
                >
                  {plan.description}
                </p>
                <p
                  className={`font-display mt-8 text-4xl font-semibold ${
                    plan.featured ? 'gold-text' : 'text-[#0B1F3A]'
                  }`}
                >
                  {plan.price}
                </p>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={
                          plan.featured ? 'text-[#F7D77C]' : 'text-[#9C7414]'
                        }
                        size={20}
                        aria-hidden="true"
                      />
                      <span
                        className={
                          plan.featured ? 'text-[#F8F6F0]' : 'text-[#253A58]'
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#hero"
                  className={`mt-9 inline-flex min-h-12 w-full items-center justify-center rounded-md px-5 py-3 font-semibold transition ${
                    plan.featured
                      ? 'bg-[#D4A017] text-[#07172D] hover:bg-[#F7D77C]'
                      : 'border border-[#D4A017]/40 text-[#0B1F3A] hover:bg-[#D4A017]/12'
                  }`}
                >
                  Request Demo
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
