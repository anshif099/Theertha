import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarDays,
  CalendarCheck,
  Check,
  ClipboardList,
  FileText,
  HandCoins,
  Hash,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  PiggyBank,
  Phone,
  PlusCircle,
  ReceiptText,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { addCounter, deleteCounter, loadCounters } from '../lib/counterStore.js'
import {
  addQuickItem,
  addMultipleQuickItems,
  updateQuickItem,
  toggleQuickItemCounter,
  addStar,
  deleteQuickItem,
  deleteStar,
  loadQuickItems,
  loadStars,
  loadSlotsConfig,
  saveSlotsConfig,
  addPriest,
  deletePriest,
  loadPriests,
} from '../lib/settingsStore.js'
import { COMMON_POOJAS, POOJA_CATEGORIES } from '../lib/commonPoojas.js'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadMembershipConfig, saveMembershipConfig } from '../lib/membershipStore.js'
import { navigateTo } from '../lib/router.js'

const mainMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter', icon: ReceiptText, href: '/temple/counter' },
  { label: 'Booking', icon: CalendarCheck, href: '/temple/booking' },
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
  { label: 'Fixed Deposit',  icon: PiggyBank,    href: '/temple/fixed-deposit' },
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

  /* edit quick item state */
  const [editingQiItem, setEditingQiItem] = useState(null)
  const [editQiSaving, setEditQiSaving] = useState(false)
  const [editQiError, setEditQiError] = useState('')

  /* filter & search in quick items table */
  const [qiFilter, setQiFilter] = useState('all') // 'all' | 'counter' | 'hidden'
  const [qiSearch, setQiSearch] = useState('')

  /* common poojas catalog modal state */
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogCategory, setCatalogCategory] = useState('All')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedCatalogNames, setSelectedCatalogNames] = useState(new Set())
  const [catalogImporting, setCatalogImporting] = useState(false)
  const [catalogSuccessMsg, setCatalogSuccessMsg] = useState('')

  /* priests state */
  const [priests, setPriests] = useState([])
  const [loadingPriests, setLoadingPriests] = useState(true)
  const [priestForm, setPriestForm] = useState({ name: '', salary: '', phone: '', address: '', role: 'Priest' })
  const [priestSaving, setPriestSaving] = useState(false)
  const [priestError, setPriestError] = useState('')
  const [priestSuccess, setPriestSuccess] = useState('')

  /* pooja slots config state */
  const [slotsList, setSlotsList] = useState([
    { key: 'nirmalyam', time: '5:30 AM', name: 'Nirmalyam', priest: 'Rajan Pillai', capacity: 1, status: 'Reserved' },
    { key: 'ushapooja', time: '6:30 AM', name: 'Usha Pooja', priest: 'Rajan Pillai', capacity: 5, status: 'Booked' },
    { key: 'abhishekam_default', time: '8:00 AM', name: 'Abhishekam', priest: 'Suresh Varma', capacity: 1, status: 'Booked' },
    { key: 'pantheeradi_default', time: '10:00 AM', name: 'Pantheeradi Pooja', priest: 'Rajan Pillai', capacity: 10, status: 'Available' },
    { key: 'uchapooja', time: '12:00 PM', name: 'Ucha Pooja', priest: 'Suresh Varma', capacity: 5, status: 'Limited' },
    { key: 'sayahna', time: '3:30 PM', name: 'Sayahna', priest: 'Krishnan M.', capacity: 8, status: 'Available' },
    { key: 'deeparadhana', time: '6:30 PM', name: 'Deeparadhana', priest: 'Rajan Pillai', capacity: 15, status: 'Available' },
    { key: 'athazhapooja', time: '8:30 PM', name: 'Athazha Pooja', priest: 'Krishnan M.', capacity: 5, status: 'Available' },
  ])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [slotsSaving, setSlotsSaving] = useState(false)
  const [slotsSuccess, setSlotsSuccess] = useState('')
  const [slotsError, setSlotsError] = useState('')

  /* membership config state */
  const [membershipForm, setMembershipForm] = useState({ monthlyAmount: '', yearlyAmount: '' })
  const [loadingMembership, setLoadingMembership] = useState(true)
  const [membershipSaving, setMembershipSaving] = useState(false)
  const [membershipSuccess, setMembershipSuccess] = useState('')
  const [membershipError, setMembershipError] = useState('')


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
      navigateTo('/temple-login')
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

    loadPriests(session.id)
      .then((list) => { if (isActive) setPriests(list) })
      .catch(() => {})
      .finally(() => { if (isActive) setLoadingPriests(false) })

    loadSlotsConfig(session.id)
      .then((config) => {
        if (config && Array.isArray(config) && config.length > 0) {
          if (isActive) setSlotsList(config)
        }
      })
      .catch(() => {})
      .finally(() => { if (isActive) setLoadingSlots(false) })

    loadMembershipConfig(session.id)
      .then((cfg) => {
        if (isActive) {
          setMembershipForm({
            monthlyAmount: cfg.monthlyAmount.toString(),
            yearlyAmount: cfg.yearlyAmount.toString(),
          })
        }
      })
      .catch(() => {})
      .finally(() => { if (isActive) setLoadingMembership(false) })

    return () => { isActive = false }
  }, [session])

  function handleLogout() {
    endTempleSession()
    navigateTo('/temple-login')
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
    } catch (err) {
      console.error('Failed to add counter:', err)
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

  /* ── Quick items derived values & helper handlers ── */
  const existingQiNames = useMemo(
    () => new Set(quickItems.map((q) => q.name.trim().toLowerCase())),
    [quickItems]
  )

  const checkedCounterCount = useMemo(
    () => quickItems.filter((q) => q.showInCounter !== false).length,
    [quickItems]
  )

  const hiddenCounterCount = useMemo(
    () => quickItems.filter((q) => q.showInCounter === false).length,
    [quickItems]
  )

  const filteredQuickItems = useMemo(() => {
    return quickItems.filter((q) => {
      if (qiFilter === 'counter' && q.showInCounter === false) return false
      if (qiFilter === 'hidden' && q.showInCounter !== false) return false
      if (qiSearch.trim()) {
        const query = qiSearch.toLowerCase().trim()
        const matchName = q.name.toLowerCase().includes(query)
        const matchCat = (q.category || '').toLowerCase().includes(query)
        return matchName || matchCat
      }
      return true
    })
  }, [quickItems, qiFilter, qiSearch])

  const filteredCatalogPoojas = useMemo(() => {
    return COMMON_POOJAS.filter((p) => {
      if (catalogCategory !== 'All' && p.category !== catalogCategory) return false
      if (catalogSearch.trim()) {
        const query = catalogSearch.toLowerCase().trim()
        const matchName = p.name.toLowerCase().includes(query)
        const matchMal = (p.malayalam || '').toLowerCase().includes(query)
        const matchCat = (p.category || '').toLowerCase().includes(query)
        return matchName || matchMal || matchCat
      }
      return true
    })
  }, [catalogCategory, catalogSearch])

  async function handleToggleCounter(item) {
    const nextStatus = item.showInCounter === false ? true : false
    try {
      await toggleQuickItemCounter(session.id, item.id, nextStatus)
      setQuickItems((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, showInCounter: nextStatus } : q))
      )
    } catch {
      setQiError('Failed to update counter visibility.')
    }
  }

  function handleStartEdit(item) {
    setEditingQiItem({
      id: item.id,
      name: item.name,
      amount: item.amount,
      showInCounter: item.showInCounter !== false,
      category: item.category || 'General',
    })
    setEditQiError('')
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editingQiItem) return
    const name = editingQiItem.name.trim()
    const amount = Number(editingQiItem.amount)
    if (!name || !amount || amount <= 0) {
      setEditQiError('Name and a valid amount are required.')
      return
    }
    if (
      quickItems.some(
        (q) => q.id !== editingQiItem.id && q.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setEditQiError(`"${name}" already exists.`)
      return
    }
    setEditQiSaving(true)
    setEditQiError('')
    try {
      const updated = await updateQuickItem(session.id, editingQiItem.id, {
        name,
        amount,
        showInCounter: editingQiItem.showInCounter,
        category: editingQiItem.category,
      })
      setQuickItems((prev) =>
        prev.map((q) => (q.id === editingQiItem.id ? { ...q, ...updated } : q))
      )
      setEditingQiItem(null)
      setQiSuccess(`"${name}" updated successfully.`)
    } catch {
      setEditQiError('Failed to save changes.')
    } finally {
      setEditQiSaving(false)
    }
  }

  function handleOpenCatalog() {
    setSelectedCatalogNames(new Set())
    setCatalogSearch('')
    setCatalogCategory('All')
    setCatalogSuccessMsg('')
    setShowCatalogModal(true)
  }

  function handleToggleSelectCatalog(pName) {
    setSelectedCatalogNames((prev) => {
      const next = new Set(prev)
      if (next.has(pName)) {
        next.delete(pName)
      } else {
        next.add(pName)
      }
      return next
    })
  }

  function handleSelectAllVisibleCatalog() {
    const available = filteredCatalogPoojas.filter(
      (p) => !existingQiNames.has(p.name.trim().toLowerCase())
    )
    const allSelected = available.length > 0 && available.every((p) => selectedCatalogNames.has(p.name))
    setSelectedCatalogNames((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        available.forEach((p) => next.delete(p.name))
      } else {
        available.forEach((p) => next.add(p.name))
      }
      return next
    })
  }

  async function handleImportSelectedCatalog() {
    if (selectedCatalogNames.size === 0) return
    setCatalogImporting(true)
    setCatalogSuccessMsg('')
    try {
      const toAdd = COMMON_POOJAS.filter(
        (p) =>
          selectedCatalogNames.has(p.name) &&
          !existingQiNames.has(p.name.trim().toLowerCase())
      ).map((p) => ({
        name: p.name,
        amount: p.defaultAmount || 100,
        category: p.category || 'General',
        showInCounter: true,
      }))

      if (toAdd.length === 0) {
        setCatalogSuccessMsg('All selected items were already added.')
        return
      }

      const addedList = await addMultipleQuickItems(session.id, toAdd)
      setQuickItems((prev) =>
        [...prev, ...addedList].sort((a, b) => a.name.localeCompare(b.name))
      )
      setQiSuccess(`Imported ${addedList.length} pooja${addedList.length !== 1 ? 's' : ''} to quick items.`)
      setShowCatalogModal(false)
    } catch {
      setCatalogSuccessMsg('Failed to import selected poojas. Please try again.')
    } finally {
      setCatalogImporting(false)
    }
  }

  async function handleBulkToggleCounter(turnOn) {
    const targets = filteredQuickItems.filter((q) =>
      turnOn ? q.showInCounter === false : q.showInCounter !== false
    )
    if (targets.length === 0) return
    try {
      await Promise.all(
        targets.map((t) => toggleQuickItemCounter(session.id, t.id, turnOn))
      )
      setQuickItems((prev) =>
        prev.map((q) => {
          if (targets.some((t) => t.id === q.id)) {
            return { ...q, showInCounter: turnOn }
          }
          return q
        })
      )
    } catch {
      setQiError('Failed to bulk update.')
    }
  }

  /* ── Priest handlers ── */
  async function handleAddPriest(e) {
    e.preventDefault()
    const name = priestForm.name.trim()
    const salary = Number(priestForm.salary)
    const phone = priestForm.phone.trim()
    const address = priestForm.address.trim()
    const role = priestForm.role || 'Priest'
    if (!name) { setPriestError('Name is required.'); return }
    if (priests.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setPriestError(`"${name}" already exists.`); return
    }
    setPriestSaving(true); setPriestError(''); setPriestSuccess('')
    try {
      const added = await addPriest(session.id, { name, salary, phone, address, role })
      setPriests((prev) => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)))
      setPriestForm({ name: '', salary: '', phone: '', address: '', role: 'Priest' })
      setPriestSuccess(`"${name}" added successfully.`)
    } catch { setPriestError('Failed to save. Try again.') }
    finally { setPriestSaving(false) }
  }

  async function handleDeletePriest(priestId) {
    try {
      await deletePriest(session.id, priestId)
      setPriests((prev) => prev.filter((p) => p.id !== priestId))
    } catch { setPriestError('Failed to delete.') }
  }

  /* ── Pooja Slots handlers ── */
  function handleSlotChange(idx, field, value) {
    setSlotsList((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setSlotsSuccess('')
    setSlotsError('')
  }

  async function handleSaveSlotsConfig(e) {
    e.preventDefault()
    setSlotsSaving(true)
    setSlotsError('')
    setSlotsSuccess('')
    try {
      await saveSlotsConfig(session.id, slotsList)
      setSlotsSuccess('Pooja slot configuration saved successfully!')
    } catch {
      setSlotsError('Failed to save pooja slot configuration. Please try again.')
    } finally {
      setSlotsSaving(false)
    }
  }

  async function handleSaveMembershipConfig(e) {
    e.preventDefault()
    const monthly = Number(membershipForm.monthlyAmount)
    const yearly = Number(membershipForm.yearlyAmount)
    if (isNaN(monthly) || monthly <= 0 || isNaN(yearly) || yearly <= 0) {
      setMembershipError('Amounts must be positive numbers.')
      return
    }
    setMembershipSaving(true)
    setMembershipError('')
    setMembershipSuccess('')
    try {
      await saveMembershipConfig(session.id, { monthlyAmount: monthly, yearlyAmount: yearly })
      setMembershipSuccess('Membership pricing saved successfully!')
    } catch {
      setMembershipError('Failed to save membership plan pricing. Try again.')
    } finally {
      setMembershipSaving(false)
    }
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
                  <p className="text-sm text-[#42516A]">All 27 standard Nakshatras are pre-loaded & active for Counter & Devotee bookings</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                All {stars.length || 27} Nakshatras Pre-loaded
              </span>
            </div>

            {/* Preloaded Info Banner */}
            <div className="border-b border-[#EFE6D3] bg-[#F8F6F0]/60 px-6 py-4 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#42516A]">
                ✓ All 27 Malayalam / Vedic Nakshatras (Ashwathi to Revathi) are automatically available in Counter Booking and calendar repeating bookings.
              </p>
            </div>

            {/* Stars list */}
            <div className="p-6">
              {loadingStars ? (
                <p className="text-sm text-[#42516A]">Loading stars…</p>
              ) : stars.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Star size={28} className="text-[#D4A017]/40" />
                  <p className="text-sm text-[#42516A]">Loading pre-loaded Nakshatras…</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {stars.map((s, idx) => (
                    <div key={s.id || idx} className="flex items-center justify-between rounded-lg border border-[#D4A017]/18 bg-[#F8F6F0] px-4 py-2.5">
                      <span className="text-xs font-bold text-[#9C7414] mr-2">#{idx + 1}</span>
                      <span className="text-sm font-semibold text-[#0B1F3A] truncate">{s.name}</span>
                      <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500" title="Pre-loaded & active" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ══ Quick Add Items Section ══ */}
          <section className="mt-6 rounded-xl border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <Zap size={20} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Quick Add Items &amp; Common Poojas</h2>
                  <p className="text-sm text-[#42516A]">Seva / offering buttons shown on the counter receipt screen. Check items to show them in counter.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenCatalog}
                  className="flex items-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2 text-xs sm:text-sm font-bold text-[#0B1F3A] shadow-sm transition hover:bg-[#E5B228] active:scale-[0.98]"
                >
                  <BookOpen size={16} />
                  <span>Browse Common Poojas ({COMMON_POOJAS.length})</span>
                </button>
                <span className="rounded-full bg-[#0B1F3A] px-3 py-1.5 text-xs font-bold text-[#F7D77C]">
                  {checkedCounterCount} active / {quickItems.length} total
                </span>
              </div>
            </div>

            {/* Add quick item form (Untouched manual add) */}
            <div className="border-b border-[#EFE6D3] bg-[#F8F6F0]/60 px-6 py-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#9C7414]">Add New Item (Manual)</h3>
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

            {/* Filter tabs & table search */}
            <div className="flex flex-col gap-3 border-b border-[#EFE6D3] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQiFilter('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    qiFilter === 'all'
                      ? 'bg-[#0B1F3A] text-[#F8F6F0]'
                      : 'bg-[#F8F6F0] text-[#42516A] hover:bg-[#EFE6D3]'
                  }`}
                >
                  All Items ({quickItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQiFilter('counter')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    qiFilter === 'counter'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#F8F6F0] text-[#42516A] hover:bg-[#EFE6D3]'
                  }`}
                >
                  <Check size={13} className="text-emerald-300" />
                  <span>Checked / Counter Visible ({checkedCounterCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQiFilter('hidden')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    qiFilter === 'hidden'
                      ? 'bg-slate-700 text-white'
                      : 'bg-[#F8F6F0] text-[#42516A] hover:bg-[#EFE6D3]'
                  }`}
                >
                  Hidden ({hiddenCounterCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#42516A]/50" />
                  <input
                    type="text"
                    value={qiSearch}
                    onChange={(e) => setQiSearch(e.target.value)}
                    placeholder="Search quick items..."
                    className="rounded-lg border border-[#D4A017]/30 bg-[#F8F6F0]/60 py-1.5 pl-8 pr-3 text-xs font-medium text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/50 focus:border-[#D4A017] focus:bg-white"
                  />
                  {qiSearch && (
                    <button
                      type="button"
                      onClick={() => setQiSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {filteredQuickItems.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleBulkToggleCounter(true)}
                      title="Check all in this filtered view"
                      className="rounded border border-[#D4A017]/30 bg-white px-2 py-1.5 text-[11px] font-semibold text-[#0B1F3A] transition hover:bg-[#F8F6F0]"
                    >
                      Check All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkToggleCounter(false)}
                      title="Uncheck all in this filtered view"
                      className="rounded border border-[#D4A017]/30 bg-white px-2 py-1.5 text-[11px] font-semibold text-[#42516A] transition hover:bg-[#F8F6F0]"
                    >
                      Uncheck All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick items list */}
            <div className="overflow-x-auto">
              {loadingQuickItems ? (
                <p className="px-6 py-8 text-sm text-[#42516A]">Loading…</p>
              ) : filteredQuickItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Zap size={28} className="text-[#D4A017]/40" />
                  <p className="font-semibold text-[#0B1F3A]">
                    {quickItems.length === 0
                      ? 'No quick items yet'
                      : 'No items match your filter/search'}
                  </p>
                  <p className="text-sm text-[#42516A]">
                    {quickItems.length === 0
                      ? 'Add items manually above or browse the Common Poojas catalog.'
                      : 'Try resetting the search or filter tabs.'}
                  </p>
                  {quickItems.length === 0 && (
                    <button
                      type="button"
                      onClick={handleOpenCatalog}
                      className="mt-2 flex items-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2 text-xs font-bold text-[#0B1F3A] hover:bg-[#E5B228]"
                    >
                      <BookOpen size={14} /> Browse Common Poojas Catalog
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-xs font-semibold uppercase tracking-wide text-[#42516A]">
                      <th className="px-4 py-3 w-28 text-center">Show in Counter</th>
                      <th className="px-5 py-3">Item / Seva</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuickItems.map((qi) => {
                      const isShown = qi.showInCounter !== false
                      return (
                        <tr key={qi.id} className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]/80">
                          {/* Checkbox column */}
                          <td className="px-4 py-3.5 text-center">
                            <label className="inline-flex cursor-pointer items-center justify-center p-1" title={isShown ? 'Shown in Counter (click to hide)' : 'Hidden in Counter (click to show)'}>
                              <input
                                type="checkbox"
                                checked={isShown}
                                onChange={() => handleToggleCounter(qi)}
                                className="h-4 w-4 rounded border-gray-300 text-[#0B1F3A] focus:ring-[#D4A017] cursor-pointer"
                              />
                            </label>
                          </td>
                          {/* Name column */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#0B1F3A]">{qi.name}</span>
                              {isShown ? (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                  Counter Active
                                </span>
                              ) : (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                  Hidden
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Category column */}
                          <td className="px-5 py-3.5 text-xs text-[#42516A]">
                            <span className="rounded-full bg-[#D4A017]/10 px-2.5 py-0.5 font-medium text-[#9C7414]">
                              {qi.category || 'General'}
                            </span>
                          </td>
                          {/* Amount column */}
                          <td className="px-5 py-3.5 font-semibold text-[#9C7414]">
                            ₹{Number(qi.amount).toLocaleString('en-IN')}
                          </td>
                          {/* Actions column: Edit & Delete */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(qi)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-[#0B1F3A] transition hover:bg-[#D4A017]/15 hover:text-[#9C7414]"
                                title={`Edit ${qi.name}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuickItem(qi.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-red-400 transition hover:bg-red-50 hover:text-red-600"
                                title={`Delete ${qi.name}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ══ Pooja Slot Management Section ══ */}
          <section className="mt-6 rounded-xl border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)] mb-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <CalendarCheck size={20} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Pooja Slot Management</h2>
                  <p className="text-sm text-[#42516A]">Configure daily slots, default capacities, assigned priests, and current booking states</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSlotsConfig}>
              <div className="overflow-x-auto">
                {loadingSlots ? (
                  <p className="px-6 py-8 text-sm text-[#42516A]">Loading slot configuration…</p>
                ) : (
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-xs font-semibold uppercase tracking-wide text-[#42516A]">
                        <th className="px-5 py-3">Pooja Name & Time</th>
                        <th className="px-5 py-3">Capacity</th>
                        <th className="px-5 py-3">Assigned Priest</th>
                        <th className="px-5 py-3">Booking Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slotsList.map((slot, idx) => (
                        <tr key={slot.key || idx} className="border-b border-[#EFE6D3] hover:bg-[#F8F6F0]/50 transition">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#0B1F3A]">{slot.name}</div>
                            <div className="text-xs text-[#42516A]">{slot.time}</div>
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="number"
                              min="0"
                              value={slot.capacity}
                              onChange={(e) => handleSlotChange(idx, 'capacity', Number(e.target.value))}
                              className="w-24 rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={slot.priest || ''}
                              onChange={(e) => handleSlotChange(idx, 'priest', e.target.value)}
                              className="w-48 rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017]"
                            >
                              <option value="">— Select Priest —</option>
                              {priests.map((p) => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={slot.status || 'Available'}
                              onChange={(e) => handleSlotChange(idx, 'status', e.target.value)}
                              className={`w-40 rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2 text-sm font-semibold outline-none transition focus:border-[#D4A017] ${
                                slot.status === 'Available' ? 'text-emerald-700 bg-emerald-50/50' :
                                slot.status === 'Limited' ? 'text-amber-700 bg-amber-50/50' :
                                slot.status === 'Booked' ? 'text-red-700 bg-red-50/50' :
                                'text-blue-700 bg-blue-50/50'
                              }`}
                            >
                              <option value="Available" className="text-emerald-700">Available</option>
                              <option value="Limited" className="text-amber-700">Limited</option>
                              <option value="Booked" className="text-red-700">Booked</option>
                              <option value="Reserved" className="text-blue-700">Reserved</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="border-t border-[#EFE6D3] bg-[#F8F6F0]/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  {slotsSuccess && <div className="text-sm font-semibold text-emerald-700">✓ {slotsSuccess}</div>}
                  {slotsError && <div className="text-sm font-semibold text-red-700">✗ {slotsError}</div>}
                </div>
                <button
                  type="submit"
                  disabled={slotsSaving || loadingSlots}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-6 py-2.5 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50"
                >
                  {slotsSaving ? 'Saving slots config…' : 'Save Slot Configuration'}
                </button>
              </div>
            </form>
          </section>

          {/* ══ Staff Management Section ══ */}
          <section className="mt-6 mb-8 rounded-xl border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <UsersRound size={20} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Staff Management</h2>
                  <p className="text-sm text-[#42516A]">Register temple staff with their role, salary, contact, and address details</p>
                </div>
              </div>
              <span className="rounded-full bg-[#D4A017]/12 px-3 py-1 text-xs font-bold text-[#9C7414]">
                {priests.length} staff member{priests.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Add staff form */}
            <div className="border-b border-[#EFE6D3] bg-[#F8F6F0]/60 px-6 py-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#9C7414]">Add New Staff Member</h3>
              <form onSubmit={handleAddPriest} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {/* Name */}
                <div className="grid gap-1.5">
                  <label htmlFor="priest-name" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]">
                    <UserRoundCheck size={13} /> Staff Name
                  </label>
                  <input
                    id="priest-name"
                    type="text"
                    value={priestForm.name}
                    onChange={(e) => { setPriestForm((p) => ({ ...p, name: e.target.value })); setPriestError(''); setPriestSuccess('') }}
                    placeholder="e.g. Rajan Pillai"
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                {/* Role */}
                <div className="grid gap-1.5">
                  <label htmlFor="priest-role" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]">
                    <UsersRound size={13} /> Role
                  </label>
                  <select
                    id="priest-role"
                    value={priestForm.role}
                    onChange={(e) => { setPriestForm((p) => ({ ...p, role: e.target.value })); setPriestError(''); setPriestSuccess('') }}
                    className="w-full h-10 rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2 text-sm font-semibold text-[#0B1F3A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  >
                    <option value="Priest">Priest</option>
                    <option value="Manager">Manager</option>
                    <option value="Clerk">Clerk</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Helper">Helper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {/* Salary */}
                <div className="grid gap-1.5">
                  <label htmlFor="priest-salary" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]">
                    <IndianRupee size={13} /> Monthly Salary (₹)
                  </label>
                  <input
                    id="priest-salary"
                    type="number"
                    min="0"
                    value={priestForm.salary}
                    onChange={(e) => { setPriestForm((p) => ({ ...p, salary: e.target.value })); setPriestError(''); setPriestSuccess('') }}
                    placeholder="e.g. 25000"
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                {/* Phone */}
                <div className="grid gap-1.5">
                  <label htmlFor="priest-phone" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]">
                    <Phone size={13} /> Phone Number
                  </label>
                  <input
                    id="priest-phone"
                    type="tel"
                    value={priestForm.phone}
                    onChange={(e) => { setPriestForm((p) => ({ ...p, phone: e.target.value })); setPriestError(''); setPriestSuccess('') }}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                {/* Address */}
                <div className="grid gap-1.5">
                  <label htmlFor="priest-address" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]">
                    <MapPin size={13} /> Address
                  </label>
                  <input
                    id="priest-address"
                    type="text"
                    value={priestForm.address}
                    onChange={(e) => { setPriestForm((p) => ({ ...p, address: e.target.value })); setPriestError(''); setPriestSuccess('') }}
                    placeholder="e.g. Thiruvananthapuram"
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                {/* Submit spanning full row */}
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5 flex justify-end">
                  <button
                    id="add-priest-btn"
                    type="submit"
                    disabled={priestSaving}
                    className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-6 py-2.5 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50"
                  >
                    <PlusCircle size={15} />
                    {priestSaving ? 'Saving…' : 'Add Staff Member'}
                  </button>
                </div>
              </form>
              {priestError && <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"><AlertCircle size={14} />{priestError}</div>}
              {priestSuccess && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">✓ {priestSuccess}</div>}
            </div>

            {/* Staff table */}
            <div className="overflow-x-auto">
              {loadingPriests ? (
                <p className="px-6 py-8 text-sm text-[#42516A]">Loading staff members…</p>
              ) : priests.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <UsersRound size={28} className="text-[#D4A017]/40" />
                  <p className="font-semibold text-[#0B1F3A]">No staff members registered yet</p>
                  <p className="text-sm text-[#42516A]">Add staff details using the form above.</p>
                </div>
              ) : (
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-xs font-semibold uppercase tracking-wide text-[#42516A]">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Monthly Salary</th>
                      <th className="px-5 py-3">Phone</th>
                      <th className="px-5 py-3">Address</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {priests.map((p) => (
                      <tr key={p.id} className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1F3A] text-xs font-bold text-[#F7D77C]">
                              {p.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-semibold text-[#0B1F3A]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#42516A]">
                          {p.role || 'Priest'}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#9C7414]">
                          {p.salary ? `₹${Number(p.salary).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {p.phone ? (
                            <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-sm font-semibold text-[#42516A] hover:text-[#0B1F3A]">
                              <Phone size={13} />{p.phone}
                            </a>
                          ) : <span className="text-[#42516A]/50">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#42516A]">
                          {p.address || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleDeletePriest(p.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-red-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${p.name}`}
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

          {/* ══ Membership Pricing Management Section ══ */}
          <section className="mt-6 mb-8 rounded-xl border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <UsersRound size={20} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Membership Management</h2>
                  <p className="text-sm text-[#42516A]">Configure Monthly and Yearly plan pricing for devotees</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              {loadingMembership ? (
                <p className="py-4 text-sm text-[#42516A]">Loading membership details…</p>
              ) : (
                <form onSubmit={handleSaveMembershipConfig} className="grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Monthly Amount */}
                    <div className="grid gap-1.5">
                      <label htmlFor="monthly-amount" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]">
                        <IndianRupee size={13} /> Monthly Plan Amount (₹)
                      </label>
                      <input
                        id="monthly-amount"
                        type="number"
                        min="1"
                        value={membershipForm.monthlyAmount}
                        onChange={(e) => {
                          setMembershipForm((prev) => ({ ...prev, monthlyAmount: e.target.value }))
                          setMembershipError('')
                          setMembershipSuccess('')
                        }}
                        placeholder="e.g. 120"
                        className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                        required
                      />
                    </div>
                    {/* Yearly Amount */}
                    <div className="grid gap-1.5">
                      <label htmlFor="yearly-amount" className="flex items-center gap-1.5 text-xs font-semibold text-[#42516A]">
                        <IndianRupee size={13} /> Yearly Plan Amount (₹)
                      </label>
                      <input
                        id="yearly-amount"
                        type="number"
                        min="1"
                        value={membershipForm.yearlyAmount}
                        onChange={(e) => {
                          setMembershipForm((prev) => ({ ...prev, yearlyAmount: e.target.value }))
                          setMembershipError('')
                          setMembershipSuccess('')
                        }}
                        placeholder="e.g. 1200"
                        className="w-full rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#EFE6D3] pt-4 mt-2">
                    <div className="flex-1">
                      {membershipSuccess && <div className="text-sm font-semibold text-emerald-700">✓ {membershipSuccess}</div>}
                      {membershipError && <div className="text-sm font-semibold text-red-700">✗ {membershipError}</div>}
                    </div>
                    <button
                      type="submit"
                      disabled={membershipSaving}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-6 py-2.5 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50"
                    >
                      {membershipSaving ? 'Saving…' : 'Save Pricing'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* ── Edit Quick Item Modal ── */}
      {editingQiItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#D4A017]/30 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE6D3] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <Pencil size={16} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0B1F3A]">Edit Quick Item</h3>
                  <p className="text-xs text-[#42516A]">Update seva name, amount, or visibility</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingQiItem(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#42516A]">Item / Seva Name</label>
                <input
                  type="text"
                  value={editingQiItem.name}
                  onChange={(e) => setEditingQiItem((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-[#D4A017]/30 px-3.5 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#42516A]">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={editingQiItem.amount}
                  onChange={(e) => setEditingQiItem((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full rounded-lg border border-[#D4A017]/30 px-3.5 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#42516A]">Category</label>
                <select
                  value={editingQiItem.category || 'General'}
                  onChange={(e) => setEditingQiItem((p) => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-lg border border-[#D4A017]/30 px-3.5 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017]"
                >
                  {POOJA_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-[#EFE6D3] bg-[#F8F6F0] p-3">
                <input
                  id="edit-show-counter"
                  type="checkbox"
                  checked={editingQiItem.showInCounter}
                  onChange={(e) => setEditingQiItem((p) => ({ ...p, showInCounter: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#0B1F3A] focus:ring-[#D4A017] cursor-pointer"
                />
                <label htmlFor="edit-show-counter" className="text-xs font-semibold text-[#0B1F3A] cursor-pointer">
                  Show this item in Counter Quick Items
                </label>
              </div>

              {editQiError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700">
                  <AlertCircle size={14} /> {editQiError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQiItem(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editQiSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-5 py-2 text-xs font-bold text-[#F7D77C] hover:bg-[#123761] disabled:opacity-50"
                >
                  {editQiSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Common Poojas Catalog Modal ── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[88vh] max-h-[750px] w-full max-w-4xl flex-col rounded-2xl border border-[#D4A017]/30 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EFE6D3] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1F3A] text-[#F7D77C]">
                  <BookOpen size={20} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0B1F3A]">Common Poojas Catalog</h3>
                  <p className="text-xs text-[#42516A]">
                    Curated offerings from Kerala Pazhani &amp; Temple of Quilon. Check poojas to add them to your temple's items.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="border-b border-[#EFE6D3] bg-[#F8F6F0]/60 px-6 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#42516A]/60" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search by pooja name (English / മലയാളം)..."
                    className="w-full rounded-lg border border-[#D4A017]/30 bg-white py-2 pl-9 pr-4 text-xs font-semibold text-[#0B1F3A] outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllVisibleCatalog}
                    className="rounded-lg border border-[#0B1F3A] bg-white px-3 py-1.5 text-xs font-bold text-[#0B1F3A] transition hover:bg-[#0B1F3A] hover:text-[#F7D77C]"
                  >
                    Select All Visible
                  </button>
                  {selectedCatalogNames.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCatalogNames(new Set())}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      Clear ({selectedCatalogNames.size})
                    </button>
                  )}
                </div>
              </div>

              {/* Category Pills */}
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCatalogCategory('All')}
                  className={`shrink-0 rounded-full px-3 py-1 font-semibold transition ${
                    catalogCategory === 'All'
                      ? 'bg-[#0B1F3A] text-[#F7D77C]'
                      : 'bg-white text-[#42516A] hover:bg-[#EFE6D3]/60'
                  }`}
                >
                  All ({COMMON_POOJAS.length})
                </button>
                {POOJA_CATEGORIES.map((cat) => {
                  const count = COMMON_POOJAS.filter((p) => p.category === cat).length
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatalogCategory(cat)}
                      className={`shrink-0 rounded-full px-3 py-1 font-semibold transition ${
                        catalogCategory === cat
                          ? 'bg-[#0B1F3A] text-[#F7D77C]'
                          : 'bg-white text-[#42516A] hover:bg-[#EFE6D3]/60'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Poojas Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {catalogSuccessMsg && (
                <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800 border border-amber-200">
                  {catalogSuccessMsg}
                </div>
              )}

              {filteredCatalogPoojas.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#42516A]">
                  No poojas found matching your search.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCatalogPoojas.map((p) => {
                    const isAlreadyAdded = existingQiNames.has(p.name.trim().toLowerCase())
                    const isSelected = selectedCatalogNames.has(p.name)

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (!isAlreadyAdded) handleToggleSelectCatalog(p.name)
                        }}
                        className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition ${
                          isAlreadyAdded
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50/70 opacity-60'
                            : isSelected
                            ? 'cursor-pointer border-[#D4A017] bg-[#F7D77C]/15 ring-2 ring-[#D4A017]/30 shadow-sm'
                            : 'cursor-pointer border-[#EFE6D3] bg-white hover:border-[#D4A017]/60 hover:bg-[#F8F6F0]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              disabled={isAlreadyAdded}
                              checked={isAlreadyAdded || isSelected}
                              onChange={() => {
                                if (!isAlreadyAdded) handleToggleSelectCatalog(p.name)
                              }}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0B1F3A] focus:ring-[#D4A017]"
                            />
                            <div>
                              <p className="text-sm font-bold text-[#0B1F3A] leading-tight">
                                {p.name}
                              </p>
                              {p.malayalam && (
                                <p className="text-[11px] text-[#42516A] mt-0.5 font-medium">
                                  {p.malayalam}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-[#EFE6D3]/60 pt-2 text-xs">
                          <span className="font-bold text-[#9C7414]">
                            ₹{p.defaultAmount}
                          </span>
                          {isAlreadyAdded ? (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Already Added
                            </span>
                          ) : (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                              {p.category}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#EFE6D3] bg-[#F8F6F0] px-6 py-4">
              <span className="text-xs font-semibold text-[#42516A]">
                {selectedCatalogNames.size} pooja{selectedCatalogNames.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedCatalogNames.size === 0 || catalogImporting}
                  onClick={handleImportSelectedCatalog}
                  className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2 text-xs font-bold text-[#F7D77C] shadow-md transition hover:bg-[#123761] disabled:opacity-40"
                >
                  <PlusCircle size={15} />
                  {catalogImporting
                    ? 'Importing…'
                    : `Add Selected (${selectedCatalogNames.size}) to Quick Items`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
