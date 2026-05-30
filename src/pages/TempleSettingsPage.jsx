import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BedDouble,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
  Hash,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  Sparkles,
  Star,
  Store,
  Trash2,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { addCounter, deleteCounter, loadCounters } from '../lib/counterStore.js'
import { addQuickItem, addStar, deleteQuickItem, deleteStar, loadQuickItems, loadStars } from '../lib/settingsStore.js'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'

const mainMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter', icon: ReceiptText, href: '/temple/counter' },
  { label: 'Accounts', icon: WalletCards, href: '/temple/dashboard' },
  { label: 'Nadavaravu', icon: ClipboardList, href: '/temple/dashboard' },
  { label: 'Membership', icon: UsersRound, href: '/temple/dashboard' },
  { label: 'Billing', icon: FileText, href: '/temple/dashboard' },
  { label: 'Temple', icon: Landmark, href: '/temple/dashboard' },
  { label: 'Assets', icon: Building2, href: '/temple/dashboard' },
  { label: 'Devotees', icon: Heart, href: '/temple/dashboard' },
]

const addonItems = [
  { label: 'Elephant', icon: PawPrint, href: '/temple/dashboard' },
  { label: 'Guest House', icon: BedDouble, href: '/temple/dashboard' },
  { label: 'Store', icon: Store, href: '/temple/dashboard' },
  { label: 'Fixed Deposit', icon: PiggyBank, href: '/temple/dashboard' },
]

function getInitials(name = 'Temple') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join('')
    .toUpperCase()
}

/**
 * Auto-generate a counter Login ID from temple name, counter name, counter number.
 * Format: CTR-{TEMPLE_ABBR}-{NAME_ABBR}{NUM:02d}
 * Example: CTR-SPT-ME03  (Sree Padmanabha Temple, Main Entrance, counter 3)
 */
function generateCounterLoginId(templeName = '', counterName = '', counterNumber = '') {
  function abbr(text, maxWords) {
    return text
      .replace(/[^a-zA-Z\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, maxWords)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }

  const templeAbbr = abbr(templeName, 3) || 'TPL'
  const nameAbbr   = abbr(counterName, 2) || 'CTR'
  const num        = String(Number(counterNumber) || 0).padStart(2, '0')

  return `CTR-${templeAbbr}-${nameAbbr}${num}`
}

/* ─── Sidebar content (shared by mobile & desktop) ─── */
function SidebarContent({ temple, onClose }) {
  return (
    <>
      <a href="/" aria-label="Back to THEERTHA landing page">
        <BrandMark compact />
      </a>
      <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">
        Main Menu
      </p>
      <nav className="mt-3 grid gap-2">
        {mainMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]"
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </a>
          )
        })}
      </nav>
      <p className="mt-6 px-4 text-xs font-semibold uppercase text-[#F7D77C]">
        Addons
      </p>
      <nav className="mt-3 grid gap-2">
        {addonItems.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]"
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </a>
          )
        })}
      </nav>
      <div className="mt-6 border-t border-[#F8F6F0]/12 pt-4">
        <a
          href="/temple/settings"
          onClick={onClose}
          className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold bg-[#D4A017]/14 text-[#F7D77C]"
        >
          <Settings size={18} aria-hidden="true" />
          Settings
        </a>
      </div>
      <div className="mt-4 rounded-lg border border-[#F8F6F0]/12 bg-white/6 p-4">
        <p className="text-sm font-semibold text-[#F7D77C]">Temple Access</p>
        <p className="mt-2 break-all font-mono text-xs leading-5 text-[#EFE6D3]/70">
          {temple?.loginId}
        </p>
      </div>
    </>
  )
}

/* ─── Counter row ─── */
function CounterRow({ counter, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await onDelete(counter.id)
    setDeleting(false)
  }

  return (
    <tr className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]">
      <td className="px-5 py-4">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1F3A] text-sm font-bold text-[#F7D77C]">
          {counter.number}
        </span>
      </td>
      <td className="px-5 py-4 font-semibold">{counter.name}</td>
      <td className="px-5 py-4 font-mono text-sm text-[#42516A]">
        {counter.loginId}
      </td>
      <td className="px-5 py-4 text-xs text-[#42516A]">
        {counter.createdAt
          ? new Date(counter.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—'}
      </td>
      <td className="px-5 py-4">
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="flex h-8 w-8 items-center justify-center rounded-md text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          aria-label={`Delete counter ${counter.number}`}
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  )
}

/* ─── Main page ─── */
export default function TempleSettingsPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* counters state */
  const [counters, setCounters] = useState([])
  const [loadingCounters, setLoadingCounters] = useState(true)
  const [counterError, setCounterError] = useState('')

  /* stars state */
  const [stars, setStars] = useState([])
  const [loadingStars, setLoadingStars] = useState(true)
  const [starInput, setStarInput] = useState('')
  const [starSaving, setStarSaving] = useState(false)
  const [starError, setStarError] = useState('')
  const [starSuccess, setStarSuccess] = useState('')

  /* quick items state */
  const [quickItems, setQuickItems] = useState([])
  const [loadingQuickItems, setLoadingQuickItems] = useState(true)
  const [qiForm, setQiForm] = useState({ name: '', amount: '' })
  const [qiSaving, setQiSaving] = useState(false)
  const [qiError, setQiError] = useState('')
  const [qiSuccess, setQiSuccess] = useState('')

  /* add-counter form */
  const [form, setForm] = useState({ number: '', name: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const templeName = temple?.name || 'Temple'
  const initials    = useMemo(() => getInitials(templeName), [templeName])

  /* auto-generated login id — updates live as user types */
  const autoLoginId = useMemo(
    () => generateCounterLoginId(templeName, form.name, form.number),
    [templeName, form.name, form.number],
  )

  /* redirect if not logged in */
  useEffect(() => {
    if (!session) {
      window.location.href = '/temple-login'
    }
  }, [session])

  /* load temple & counters */
  useEffect(() => {
    if (!session) return

    let isActive = true

    getRegisteredTemple(session.id)
      .then((t) => { if (isActive) setTemple(t || session) })
      .catch(() => {})

    loadCounters(session.id)
      .then((list) => { if (isActive) setCounters(list) })
      .catch(() => { if (isActive) setCounterError('Failed to load counters.') })
      .finally(() => { if (isActive) setLoadingCounters(false) })

    loadStars(session.id)
      .then((list) => { if (isActive) setStars(list) })
      .catch(() => {})
      .finally(() => { if (isActive) setLoadingStars(false) })

    loadQuickItems(session.id)
      .then((list) => { if (isActive) setQuickItems(list) })
      .catch(() => {})
      .finally(() => { if (isActive) setLoadingQuickItems(false) })

    return () => { isActive = false }
  }, [session])

  function handleLogout() {
    endTempleSession()
    window.location.href = '/temple-login'
  }

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFormError('')
    setSuccessMsg('')
  }


  async function handleAddCounter(e) {
    e.preventDefault()
    const num  = form.number.toString().trim()
    const name = form.name.trim()

    if (!num || !name) {
      setFormError('Counter number and name are required.')
      return
    }

    if (isNaN(Number(num)) || Number(num) < 1) {
      setFormError('Counter number must be a positive integer.')
      return
    }

    const duplicate = counters.find((c) => String(c.number) === String(num))
    if (duplicate) {
      setFormError(`Counter number ${num} already exists.`)
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const added = await addCounter(session.id, {
        number: Number(num),
        name,
        loginId: autoLoginId,
      })
      setCounters((prev) =>
        [...prev, added].sort((a, b) => Number(a.number) - Number(b.number)),
      )
      setForm({ number: '', name: '' })
      setSuccessMsg(`Counter ${num} added — Login ID: ${autoLoginId}`)
    } catch {
      setFormError('Failed to save counter. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCounter(counterId) {
    try {
      await deleteCounter(session.id, counterId)
      setCounters((prev) => prev.filter((c) => c.id !== counterId))
    } catch {
      setCounterError('Failed to delete counter.')
    }
  }

  /* ── Stars handlers ── */
  async function handleAddStar(e) {
    e.preventDefault()
    const name = starInput.trim()
    if (!name) { setStarError('Star name is required.'); return }
    if (stars.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setStarError(`"${name}" already exists.`); return
    }
    setStarSaving(true); setStarError(''); setStarSuccess('')
    try {
      const added = await addStar(session.id, name)
      setStars((prev) => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)))
      setStarInput('')
      setStarSuccess(`"${name}" added.`)
    } catch { setStarError('Failed to save. Try again.') }
    finally { setStarSaving(false) }
  }

  async function handleDeleteStar(starId) {
    try {
      await deleteStar(session.id, starId)
      setStars((prev) => prev.filter((s) => s.id !== starId))
    } catch { setStarError('Failed to delete.') }
  }

  /* ── Quick Items handlers ── */
  async function handleAddQuickItem(e) {
    e.preventDefault()
    const name = qiForm.name.trim()
    const amount = Number(qiForm.amount)
    if (!name || !amount || amount <= 0) { setQiError('Name and a valid amount are required.'); return }
    if (quickItems.some((q) => q.name.toLowerCase() === name.toLowerCase())) {
      setQiError(`"${name}" already exists.`); return
    }
    setQiSaving(true); setQiError(''); setQiSuccess('')
    try {
      const added = await addQuickItem(session.id, { name, amount })
      setQuickItems((prev) => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)))
      setQiForm({ name: '', amount: '' })
      setQiSuccess(`"${name}" added.`)
    } catch { setQiError('Failed to save. Try again.') }
    finally { setQiSaving(false) }
  }

  async function handleDeleteQuickItem(itemId) {
    try {
      await deleteQuickItem(session.id, itemId)
      setQuickItems((prev) => prev.filter((q) => q.id !== itemId))
    } catch { setQiError('Failed to delete.') }
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <SidebarContent temple={temple} onClose={() => setSidebarOpen(false)} />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 transition hover:bg-white/10 hover:text-[#F8F6F0]"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent temple={temple} onClose={undefined} />
      </aside>

      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] transition hover:bg-[#D4A017]/10 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="pl-12 lg:pl-0">
              <p className="text-sm font-semibold uppercase text-[#9C7414]">
                Temple Settings
              </p>
              <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">
                Settings
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#42516A]">
                {templeName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] font-semibold text-[#F7D77C]">
                {initials}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761]"
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">

          {/* ── Counter Management Section ── */}
          <section className="rounded-xl border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">

            {/* Section header */}
            <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <ReceiptText size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    Counter Management
                  </h2>
                  <p className="text-sm text-[#42516A]">
                    Add and manage collection counters for this temple
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#D4A017]/12 px-3 py-1 text-xs font-bold text-[#9C7414]">
                {counters.length} counter{counters.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Add counter form */}
            <div className="border-b border-[#EFE6D3] bg-[#F8F6F0]/60 px-6 py-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#9C7414]">
                Add New Counter
              </h3>
              <form
                onSubmit={handleAddCounter}
                className="grid gap-4 sm:grid-cols-[120px_1fr_auto]"
              >
                {/* Counter number */}
                <div className="grid gap-1.5">
                  <label
                    htmlFor="counter-number"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]"
                  >
                    <Hash size={13} />
                    Counter No.
                  </label>
                  <input
                    id="counter-number"
                    type="number"
                    name="number"
                    min="1"
                    value={form.number}
                    onChange={handleFormChange}
                    placeholder="1"
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none ring-0 transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>

                {/* Counter name */}
                <div className="grid gap-1.5">
                  <label
                    htmlFor="counter-name"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]"
                  >
                    <UserRoundCheck size={13} />
                    Counter Name
                  </label>
                  <input
                    id="counter-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Main Entrance Counter"
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none ring-0 transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>

                {/* Submit */}
                <div className="flex items-end">
                  <button
                    id="add-counter-btn"
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50 sm:w-auto"
                  >
                    <PlusCircle size={16} />
                    {saving ? 'Saving…' : 'Add'}
                  </button>
                </div>
              </form>

              {/* Auto-generated Login ID preview */}
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#D4A017]/24 bg-[#D4A017]/6 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#9C7414]">
                  Auto Login ID:
                </span>
                <span className="font-mono text-sm font-bold text-[#0B1F3A]">
                  {autoLoginId}
                </span>
                <span className="ml-auto rounded-full bg-[#D4A017]/16 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9C7414]">
                  Generated
                </span>
              </div>

              {/* Form feedback */}
              {formError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                  <AlertCircle size={15} />
                  {formError}
                </div>
              )}
              {successMsg && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                  ✓ {successMsg}
                </div>
              )}
            </div>

            {/* Counter table */}
            <div className="overflow-x-auto">
              {loadingCounters ? (
                <p className="px-6 py-8 text-sm font-semibold text-[#42516A]">
                  Loading counters…
                </p>
              ) : counters.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFE6D3] text-[#9C7414]">
                    <ReceiptText size={26} />
                  </span>
                  <p className="font-semibold text-[#0B1F3A]">No counters yet</p>
                  <p className="text-sm text-[#42516A]">
                    Add your first counter using the form above.
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-xs font-semibold uppercase tracking-wide text-[#42516A]">
                      <th className="px-5 py-3">No.</th>
                      <th className="px-5 py-3">Counter Name</th>
                      <th className="px-5 py-3">Login ID</th>
                      <th className="px-5 py-3">Added On</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {counters.map((counter) => (
                      <CounterRow
                        key={counter.id}
                        counter={counter}
                        onDelete={handleDeleteCounter}
                      />
                    ))}
                  </tbody>
                </table>
              )}
              {counterError && (
                <p className="px-6 pb-4 text-sm font-semibold text-red-600">
                  {counterError}
                </p>
              )}
            </div>
          </section>

          {/* ══ Stars (Nakshatra) Section ══ */}
          <section className="mt-6 rounded-xl border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <Star size={20} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Stars (Nakshatra)</h2>
                  <p className="text-sm text-[#42516A]">Add stars that appear in the counter receipt dropdown</p>
                </div>
              </div>
              <span className="rounded-full bg-[#D4A017]/12 px-3 py-1 text-xs font-bold text-[#9C7414]">
                {stars.length} star{stars.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Add star form */}
            <div className="border-b border-[#EFE6D3] bg-[#F8F6F0]/60 px-6 py-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#9C7414]">Add New Star</h3>
              <form onSubmit={handleAddStar} className="flex gap-3">
                <input
                  id="star-name-input"
                  type="text"
                  value={starInput}
                  onChange={(e) => { setStarInput(e.target.value); setStarError(''); setStarSuccess('') }}
                  placeholder="e.g. Karthika"
                  className="flex-1 rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                />
                <button
                  type="submit"
                  disabled={starSaving}
                  className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50"
                >
                  <PlusCircle size={15} />
                  {starSaving ? 'Saving…' : 'Add'}
                </button>
              </form>
              {starError && <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"><AlertCircle size={14} />{starError}</div>}
              {starSuccess && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">✓ {starSuccess}</div>}
            </div>

            {/* Stars list */}
            <div className="p-6">
              {loadingStars ? (
                <p className="text-sm text-[#42516A]">Loading…</p>
              ) : stars.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Star size={28} className="text-[#D4A017]/40" />
                  <p className="text-sm text-[#42516A]">No stars added yet.</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {stars.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-[#D4A017]/18 bg-[#F8F6F0] px-4 py-2.5">
                      <span className="text-sm font-semibold text-[#0B1F3A]">{s.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteStar(s.id)}
                        className="ml-3 flex h-7 w-7 items-center justify-center rounded-md text-red-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${s.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ══ Quick Add Items Section ══ */}
          <section className="mt-6 rounded-xl border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <Zap size={20} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Quick Add Items</h2>
                  <p className="text-sm text-[#42516A]">Seva / offering buttons shown on the counter receipt screen</p>
                </div>
              </div>
              <span className="rounded-full bg-[#D4A017]/12 px-3 py-1 text-xs font-bold text-[#9C7414]">
                {quickItems.length} item{quickItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Add quick item form */}
            <div className="border-b border-[#EFE6D3] bg-[#F8F6F0]/60 px-6 py-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#9C7414]">Add New Item</h3>
              <form onSubmit={handleAddQuickItem} className="grid gap-4 sm:grid-cols-[1fr_160px_auto]">
                <div className="grid gap-1.5">
                  <label htmlFor="qi-name" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]"><Sparkles size={12} />Item / Seva Name</label>
                  <input
                    id="qi-name"
                    type="text"
                    value={qiForm.name}
                    onChange={(e) => { setQiForm((p) => ({ ...p, name: e.target.value })); setQiError(''); setQiSuccess('') }}
                    placeholder="e.g. Abhishekam"
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="qi-amount" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]"><IndianRupee size={12} />Amount (₹)</label>
                  <input
                    id="qi-amount"
                    type="number"
                    min="1"
                    value={qiForm.amount}
                    onChange={(e) => { setQiForm((p) => ({ ...p, amount: e.target.value })); setQiError(''); setQiSuccess('') }}
                    placeholder="500"
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={qiSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50"
                  >
                    <PlusCircle size={15} />
                    {qiSaving ? 'Saving…' : 'Add'}
                  </button>
                </div>
              </form>
              {qiError && <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"><AlertCircle size={14} />{qiError}</div>}
              {qiSuccess && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">✓ {qiSuccess}</div>}
            </div>

            {/* Quick items list */}
            <div className="overflow-x-auto">
              {loadingQuickItems ? (
                <p className="px-6 py-8 text-sm text-[#42516A]">Loading…</p>
              ) : quickItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Zap size={28} className="text-[#D4A017]/40" />
                  <p className="font-semibold text-[#0B1F3A]">No quick items yet</p>
                  <p className="text-sm text-[#42516A]">Add sevas / offerings above.</p>
                </div>
              ) : (
                <table className="w-full min-w-[420px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-xs font-semibold uppercase tracking-wide text-[#42516A]">
                      <th className="px-5 py-3">Item / Seva</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {quickItems.map((qi) => (
                      <tr key={qi.id} className="border-b border-[#EFE6D3] hover:bg-[#F8F6F0]">
                        <td className="px-5 py-3.5 font-semibold">{qi.name}</td>
                        <td className="px-5 py-3.5 font-semibold text-[#9C7414]">₹{Number(qi.amount).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteQuickItem(qi.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-red-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${qi.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
