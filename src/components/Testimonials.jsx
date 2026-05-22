import { Quote } from 'lucide-react'
import Reveal from './Reveal.jsx'
import SectionHeader from './SectionHeader.jsx'

const testimonials = [
  {
    quote:
      'THEERTHA gave our counters, pooja bookings, and accounts a single reliable system. Reports that took hours are now ready before committee review.',
    name: 'Temple Administrator',
    role: 'Major Devaswom Office',
  },
  {
    quote:
      'The workflow feels premium but simple for staff. Devotee registration, receipts, and offerings stay organized even during festival season.',
    name: 'Executive Officer',
    role: 'Kerala Temple Trust',
  },
  {
    quote:
      'We wanted spiritual dignity with enterprise control. THEERTHA brought both into daily operations without overwhelming the team.',
    name: 'Trust Board Member',
    role: 'Heritage Temple Committee',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-[#F8F6F0] px-5 py-24 text-[#0B1F3A] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Administrator Feedback"
          title="Trusted by teams who carry sacred responsibility"
          copy="Elegant software for the practical demands of temple service, public counters, finance reviews, and festival administration."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal
              key={testimonial.name}
              delay={index * 0.08}
              className="h-full"
            >
              <article className="h-full rounded-lg border border-[#D4A017]/22 bg-white p-7 shadow-[0_18px_58px_rgba(11,31,58,0.08)]">
                <Quote className="text-[#D4A017]" size={30} />
                <p className="mt-6 text-lg leading-8 text-[#253A58]">
                  {testimonial.quote}
                </p>
                <div className="mt-8 border-t border-[#EFE6D3] pt-5">
                  <p className="font-display text-xl font-semibold">
                    {testimonial.name}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#9C7414]">
                    {testimonial.role}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
