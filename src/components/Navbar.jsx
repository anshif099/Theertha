import BrandMark from './BrandMark.jsx'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#F8F6F0]/10 bg-[#0B1F3A]/76 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
        <a href="#hero" aria-label="THEERTHA home">
          <BrandMark compact />
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#EFE6D3]/76 transition hover:text-[#F7D77C]"
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href="/superadmin"
          className="rounded-md border border-[#D4A017]/50 bg-[#D4A017]/12 px-4 py-2 text-sm font-semibold text-[#F8F6F0] shadow-[0_0_34px_rgba(212,160,23,0.14)] transition hover:border-[#F7D77C] hover:bg-[#D4A017]/22"
        >
          Super Admin
        </a>
      </nav>
    </header>
  )
}
