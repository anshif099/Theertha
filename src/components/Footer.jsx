import { Globe2, Mail, MapPin, MessagesSquare, Phone, Share2 } from 'lucide-react'
import BrandMark from './BrandMark.jsx'

const quickLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Footer() {
  return (
    <footer className="border-t border-[#F8F6F0]/10 bg-[#07172D] px-5 py-12 text-[#F8F6F0] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_1fr]">
        <div>
          <BrandMark compact />
          <p className="mt-5 max-w-md leading-7 text-[#EFE6D3]/74">
            Premium temple management software for administration, devotees,
            billing, finance, assets, offerings, and rituals.
          </p>
          <div className="mt-6 flex gap-3">
            {[Globe2, MessagesSquare, Share2].map((Icon, index) => (
              <a
                key={index}
                href="#hero"
                aria-label="THEERTHA social link"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[#F8F6F0]/12 bg-white/6 text-[#F7D77C] transition hover:border-[#D4A017]/60 hover:bg-[#D4A017]/12"
              >
                <Icon size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold">Quick Links</h3>
          <div className="mt-5 grid gap-3">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[#EFE6D3]/72 transition hover:text-[#F7D77C]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold">Contact</h3>
          <div className="mt-5 grid gap-4 text-[#EFE6D3]/78">
            <p className="flex items-center gap-3">
              <Mail size={18} className="text-[#F7D77C]" aria-hidden="true" />
              hello@theertha.app
            </p>
            <p className="flex items-center gap-3">
              <Phone size={18} className="text-[#F7D77C]" aria-hidden="true" />
              +91 00000 00000
            </p>
            <p className="flex items-center gap-3">
              <MapPin size={18} className="text-[#F7D77C]" aria-hidden="true" />
              Kerala, India
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-[#F8F6F0]/10 pt-6 text-sm text-[#EFE6D3]/58 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright 2026 THEERTHA. All rights reserved.</p>
        <p>Temple Management Software Platform</p>
      </div>
    </footer>
  )
}
