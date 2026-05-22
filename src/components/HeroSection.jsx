import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react'
import BrandMark from './BrandMark.jsx'

const heroBadges = [
  { icon: ShieldCheck, label: 'Secure temple operations' },
  { icon: CalendarCheck, label: 'Ritual and festival planning' },
  { icon: Sparkles, label: 'Premium devotee experience' },
]

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="temple-hero-bg relative isolate overflow-hidden px-5 pb-24 pt-16 sm:px-8 sm:pb-28 sm:pt-20"
    >
      <div className="gold-orbit" aria-hidden="true" />
      <div className="diya-glow" aria-hidden="true" />
      <div className="temple-silhouette" aria-hidden="true" />

      <div className="mx-auto flex min-h-[78svh] max-w-7xl flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <BrandMark showText={false} className="justify-center" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-8 text-sm font-semibold uppercase text-[#F7D77C]"
        >
          THEERTHA Temple Management Software
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28 }}
          className="font-display mt-5 max-w-5xl text-5xl font-semibold leading-[1.05] text-[#F8F6F0] sm:text-7xl lg:text-8xl"
        >
          Manage Temples with{' '}
          <span className="gold-text">Divine Precision</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-7 max-w-3xl text-lg leading-8 text-[#EFE6D3]/86 sm:text-xl"
        >
          Complete digital ecosystem for temple administration, devotees,
          finance, offerings, assets, and rituals.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.52 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#pricing"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#D4A017] px-6 py-3 font-semibold text-[#07172D] shadow-[0_16px_48px_rgba(212,160,23,0.35)] transition hover:bg-[#F7D77C]"
          >
            Request Demo
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a
            href="#features"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#F8F6F0]/18 bg-white/8 px-6 py-3 font-semibold text-[#F8F6F0] backdrop-blur transition hover:border-[#D4A017]/60 hover:bg-white/12"
          >
            Get Started
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.68 }}
          className="mt-12 grid w-full max-w-4xl gap-3 sm:grid-cols-3"
        >
          {heroBadges.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.label}
                className="glass-card rounded-lg px-4 py-4 text-left"
              >
                <Icon className="mb-3 text-[#F7D77C]" size={22} />
                <p className="text-sm font-semibold text-[#F8F6F0]">
                  {badge.label}
                </p>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
