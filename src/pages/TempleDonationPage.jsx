import { useEffect, useState, useMemo } from 'react'
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Edit2,
  FileText,
  HandCoins,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  Trash2,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import {
  loadDonations,
  saveDonation,
  updateDonation,
  deleteDonation,
  getNextDonationNo,
} from '../lib/settingsStore.js'
import { navigateTo } from '../lib/router.js'

/* ─── Sidebar menu items ─── */
const mainMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter', icon: ReceiptText, href: '/temple/counter' },
  { label: 'Accounts', icon: WalletCards, href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList, href: '/temple/nadavaravu' },
  { label: 'Membership', icon: UsersRound, href: '/temple/membership' },
  { label: 'Billing', icon: FileText, href: '/temple/billing' },
  { label: 'Temple', icon: Landmark, href: '/temple/profile' },
  { label: 'Assets', icon: Building2, href: '/temple/assets' },
  { label: 'Devotees', icon: Heart, href: '/temple/devotees' },
]

const addonItems = [
  { label: 'Daily Schedule', icon: CalendarDays, href: '/temple/daily-schedule' },
  { label: 'Donation', icon: HandCoins, href: '/temple/donations' },
  { label: 'Fixed Deposit', icon: PiggyBank, href: '/temple/fixed-deposit' },
]

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque']
const PURPOSE_OPTIONS = ['General', 'Annadhanam', 'Renovation', 'Festival', 'Education', 'Other']

function getInitials(name = 'Temple') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join('')
    .toUpperCase()
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function TempleDonationPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Donations data */
  const [donations, setDonations] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)

  /* Search */
  const [searchQuery, setSearchQuery] = useState('')

  /* Form state */
  const [showForm, setShowForm] = useState(false)
  const [formDonorName, setFormDonorName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(todayStr())
  const [formPaymentMode, setFormPaymentMode] = useState('Cash')
  const [formPurpose, setFormPurpose] = useState('General')
  const [formNotes, setFormNotes] = useState('')

  /* Edit modal */
  const [editingDonation, setEditingDonation] = useState(null)
  const [editDonorName, setEditDonorName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editPaymentMode, setEditPaymentMode] = useState('Cash')
  const [editPurpose, setEditPurpose] = useState('General')
  const [editNotes, setEditNotes] = useState('')

  /* Delete confirmation */
  const [deletingId, setDeletingId] = useState(null)

  const templeName = temple?.name || 'Temple'
  const initials = useMemo(() => getInitials(templeName), [templeName])

  /* ─── Load data ─── */
  function refreshDonations() {
    if (!session) return
    setLoadingData(true)
    loadDonations(session.id)
      .then((data) => setDonations(data || []))
      .catch((err) => console.warn('Failed to load donations:', err))
      .finally(() => setLoadingData(false))
  }

  useEffect(() => {
    if (!session) {
      navigateTo('/temple-login')
      return
    }
    getRegisteredTemple(session.id)
      .then((t) => setTemple(t || session))
      .catch(() => setTemple(session))
    refreshDonations()
  }, [session])

  /* ─── Filtered list ─── */
  const filteredDonations = useMemo(() => {
    if (!searchQuery.trim()) return donations
    const q = searchQuery.toLowerCase()
    return donations.filter(
      (d) =>
        (d.donorName || '').toLowerCase().includes(q) ||
        (d.purpose || '').toLowerCase().includes(q) ||
        (d.donationNo || '').toLowerCase().includes(q) ||
        (d.paymentMode || '').toLowerCase().includes(q)
    )
  }, [donations, searchQuery])

  /* ─── Summary metrics ─── */
  const metrics = useMemo(() => {
    const totalCount = donations.length
    const totalAmount = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    const cashTotal = donations
      .filter((d) => d.paymentMode === 'Cash')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    const digitalTotal = donations
      .filter((d) => d.paymentMode !== 'Cash')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    return { totalCount, totalAmount, cashTotal, digitalTotal }
  }, [donations])

  /* ─── Handlers ─── */
  async function handleAddDonation(e) {
    e.preventDefault()
    if (!formDonorName.trim() || !formAmount) return
    setSaving(true)
    try {
      const donationNo = await getNextDonationNo(session.id)
      await saveDonation(session.id, {
        donationNo,
        donorName: formDonorName.trim(),
        amount: Number(formAmount),
        date: formDate,
        paymentMode: formPaymentMode,
        purpose: formPurpose,
        notes: formNotes.trim(),
      })
      setFormDonorName('')
      setFormAmount('')
      setFormDate(todayStr())
      setFormPaymentMode('Cash')
      setFormPurpose('General')
      setFormNotes('')
      setShowForm(false)
      refreshDonations()
    } catch (err) {
      console.error('Failed to save donation:', err)
      alert('Failed to save donation. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function openEditModal(donation) {
    setEditingDonation(donation)
    setEditDonorName(donation.donorName || '')
    setEditAmount(String(donation.amount || ''))
    setEditDate(donation.date || todayStr())
    setEditPaymentMode(donation.paymentMode || 'Cash')
    setEditPurpose(donation.purpose || 'General')
    setEditNotes(donation.notes || '')
  }

  async function handleUpdateDonation(e) {
    e.preventDefault()
    if (!editingDonation || !editDonorName.trim() || !editAmount) return
    setSaving(true)
    try {
      await updateDonation(session.id, editingDonation.id, {
        donorName: editDonorName.trim(),
        amount: Number(editAmount),
        date: editDate,
        paymentMode: editPaymentMode,
        purpose: editPurpose,
        notes: editNotes.trim(),
      })
      setEditingDonation(null)
      refreshDonations()
    } catch (err) {
      console.error('Failed to update donation:', err)
      alert('Failed to update donation.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteDonation(donationId) {
    try {
      await deleteDonation(session.id, donationId)
      setDeletingId(null)
      refreshDonations()
    } catch (err) {
      console.error('Failed to delete donation:', err)
    }
  }

  function handleLogout() {
    endTempleSession()
    navigateTo('/temple-login')
  }

  if (!session) return null

  /* ─── Sidebar Component ─── */
  function SidebarContent() {
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
                onClick={() => setSidebarOpen(false)}
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
            const isActive = item.label === 'Donation'
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#D4A017]/14 text-[#F7D77C]'
                    : 'text-[#EFE6D3]/68 hover:bg-white/8 hover:text-[#F8F6F0]'
                }`}
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
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]"
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

  /* ──────────────────── RENDER ──────────────────── */
  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">

      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <SidebarContent />
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

      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-72">
        {/* ── Header ── */}
        <header className="no-print sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] transition hover:bg-[#D4A017]/10 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="pl-12 lg:pl-0">
              <p className="text-sm font-semibold uppercase text-[#9C7414]">
                Donation / Sambavana
              </p>
              <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">
                <HandCoins size={28} className="inline-block mr-2 align-middle text-[#D4A017]" />
                Donation Register
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#42516A]">
                {templeName} — Manage all donations and sambavana records
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-[#F7D77C] transition hover:bg-[#123761]"
              >
                <Plus size={16} /> Add Donation
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-md border border-[#D4A017]/22 bg-white px-4 py-2.5 text-sm font-semibold text-[#42516A] transition hover:bg-[#F8F6F0]"
              >
                <Printer size={16} /> Print
              </button>
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

          {/* ── Metrics ── */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Donations', value: metrics.totalCount, icon: HandCoins, trend: 'All-time donation records' },
              { label: 'Total Collection', value: `INR ${metrics.totalAmount.toLocaleString('en-IN')}`, icon: IndianRupee, trend: 'Cumulative donation value' },
              { label: 'Cash Donations', value: `INR ${metrics.cashTotal.toLocaleString('en-IN')}`, icon: WalletCards, trend: 'Cash payment total' },
              { label: 'UPI / Digital', value: `INR ${metrics.digitalTotal.toLocaleString('en-IN')}`, icon: ReceiptText, trend: 'Online & bank payments' },
            ].map((m) => {
              const Icon = m.icon
              return (
                <article key={m.label} className="rounded-lg border border-[#D4A017]/18 bg-white p-5 shadow-[0_16px_42px_rgba(11,31,58,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#42516A]">{m.label}</p>
                      <p className="font-display mt-3 text-3xl font-semibold">{m.value}</p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#11875D]">{m.trend}</p>
                </article>
              )
            })}
          </section>

          {/* ── Add Donation Form ── */}
          {showForm && (
            <section className="mt-6 rounded-lg border border-[#D4A017]/18 bg-white p-6 shadow-[0_16px_42px_rgba(11,31,58,0.08)]">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
                <Plus size={18} className="text-[#D4A017]" /> New Donation Entry
              </h3>
              <form onSubmit={handleAddDonation} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Donor Name *</label>
                  <input
                    value={formDonorName}
                    onChange={(e) => setFormDonorName(e.target.value)}
                    placeholder="Enter donor name"
                    required
                    className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Payment Mode</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  >
                    {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Purpose / Category</label>
                  <select
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  >
                    {PURPOSE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Notes</label>
                  <input
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Optional notes"
                    className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-[#F7D77C] transition hover:bg-[#123761] disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Donation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-md border border-[#D4A017]/22 bg-white px-5 py-2.5 text-sm font-semibold text-[#42516A] transition hover:bg-[#F8F6F0]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ── Search ── */}
          <div className="no-print mt-6 relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#42516A]/60" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by donor, purpose, receipt no…"
              className="w-full rounded-md border border-[#D4A017]/22 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
            />
          </div>

          {/* ── Donations Table ── */}
          <div className="mt-6">
            <section className="rounded-lg border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-5 py-4">
                <h2 className="font-display text-2xl font-semibold">Donation Records</h2>
                <span className="text-sm font-semibold text-[#9C7414]">
                  {filteredDonations.length} {filteredDonations.length === 1 ? 'record' : 'records'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table id="donations-table" className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-sm text-[#42516A]">
                      <th className="px-5 py-3 font-semibold">#</th>
                      <th className="px-5 py-3 font-semibold">Donation No</th>
                      <th className="px-5 py-3 font-semibold">Donor Name</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Payment</th>
                      <th className="px-5 py-3 font-semibold">Purpose</th>
                      <th className="px-5 py-3 font-semibold">Notes</th>
                      <th className="px-5 py-3 font-semibold no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingData ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-8 text-center text-sm font-semibold text-[#42516A]/70">
                          Loading donations…
                        </td>
                      </tr>
                    ) : filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-8 text-center text-sm font-semibold text-[#42516A]/70">
                          {searchQuery ? 'No donations match your search.' : 'No donations recorded yet. Click "Add Donation" to begin.'}
                        </td>
                      </tr>
                    ) : (
                      filteredDonations.map((d, idx) => (
                        <tr key={d.id} className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]">
                          <td className="px-5 py-4 text-sm font-semibold text-[#42516A]">{idx + 1}</td>
                          <td className="px-5 py-4 font-mono text-sm font-semibold text-[#9C7414]">{d.donationNo || '—'}</td>
                          <td className="px-5 py-4 font-semibold">{d.donorName}</td>
                          <td className="px-5 py-4 font-semibold text-[#11875D]">INR {Number(d.amount || 0).toLocaleString('en-IN')}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#42516A]">
                            {d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-md px-3 py-1 text-xs font-bold ring-1 ${
                              d.paymentMode === 'Cash'
                                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                : d.paymentMode === 'UPI'
                                ? 'bg-blue-50 text-blue-700 ring-blue-200'
                                : d.paymentMode === 'Bank Transfer'
                                ? 'bg-purple-50 text-purple-700 ring-purple-200'
                                : 'bg-[#EFE6D3] text-[#0B1F3A] ring-[#D4A017]/24'
                            }`}>
                              {d.paymentMode}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-md bg-[#D4A017]/10 px-3 py-1 text-xs font-bold text-[#9C7414] ring-1 ring-[#D4A017]/20">
                              {d.purpose}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#42516A] max-w-[160px] truncate" title={d.notes || ''}>
                            {d.notes || '—'}
                          </td>
                          <td className="px-5 py-4 no-print">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(d)}
                                title="Edit"
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#D4A017]/10 text-[#9C7414] transition hover:bg-[#D4A017]/20"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingId(d.id)}
                                title="Delete"
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-lg border border-[#D4A017]/18 bg-white p-8 text-center shadow-xl max-w-sm w-[90%]">
            <Trash2 size={32} className="mx-auto text-red-500 mb-3" />
            <h3 className="font-display text-lg font-semibold mb-2">Delete Donation?</h3>
            <p className="text-sm text-[#42516A] mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-md border border-[#D4A017]/22 bg-white px-5 py-2.5 text-sm font-semibold text-[#42516A] transition hover:bg-[#F8F6F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDonation(deletingId)}
                className="rounded-md bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editingDonation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-lg border border-[#D4A017]/18 bg-white p-6 shadow-xl max-w-lg w-[94%]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Edit2 size={16} className="text-[#D4A017]" />
                Edit Donation
              </h3>
              <button onClick={() => setEditingDonation(null)} className="text-[#42516A] hover:text-[#0B1F3A]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateDonation} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Donor Name *</label>
                <input value={editDonorName} onChange={(e) => setEditDonorName(e.target.value)} required className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Amount (₹) *</label>
                <input type="number" min="1" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Date</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Payment Mode</label>
                <select value={editPaymentMode} onChange={(e) => setEditPaymentMode(e.target.value)} className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20">
                  {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Purpose</label>
                <select value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20">
                  {PURPOSE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#42516A] mb-1.5">Notes</label>
                <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Optional" className="w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20" />
              </div>
              <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDonation(null)}
                  className="rounded-md border border-[#D4A017]/22 bg-white px-5 py-2.5 text-sm font-semibold text-[#42516A] transition hover:bg-[#F8F6F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-[#F7D77C] transition hover:bg-[#123761] disabled:opacity-50"
                >
                  {saving ? 'Updating…' : 'Update Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Print stylesheet ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .lg\\:pl-72 { padding-left: 0 !important; }
          aside { display: none !important; }
        }
      `}</style>
    </div>
  )
}
