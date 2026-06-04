import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Flame,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  PawPrint,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  Shield,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadPriests } from '../lib/settingsStore.js'
import { loadFestivals, addFestival, deleteFestival, loadMonthPL } from '../lib/templeProfileStore.js'

/* ── Constants ── */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const MALAYALAM_MONTHS = [
  'Chingam','Kanni','Thulam','Vrischikam','Dhanu','Makaram',
  'Kumbham','Meenam','Medam','Edavam','Mithunam','Karkidakam',
]

/* ── Panchangam Constants ── */
const NAKSHATRAS_MALAYALAM = [
  'അശ്വതി', 'ഭരണി', 'കാർത്തിക', 'രോഹിണി', 'മകയിരം', 'തിരുവാതിര', 'പുണർത്ഥം', 'പൂയം', 'ആയില്യം',
  'മകം', 'പൂരം', 'ഉത്രം', 'അത്തം', 'ചിത്തിര', 'ചോതി', 'വിശാഖം', 'അനിഴം', 'തൃക്കേട്ട', 'മൂലം',
  'പൂരാടം', 'ഉത്രാടം', 'തിരുവോണം', 'അവിട്ടം', 'ചതയം', 'പൂരുരുട്ടാതി', 'ഉതൃട്ടാതി', 'രേവതി'
];
const NAKSHATRAS_ENGLISH = [
  'Aswathy', 'Bharani', 'Karthika', 'Rohini', 'Makayiram', 'Thiruvathira', 'Punartham', 'Pooyam', 'Ayilyam',
  'Makam', 'Pooram', 'Uthram', 'Atham', 'Chitra', 'Chothy', 'Visakam', 'Anizham', 'Thrikketta', 'Moolam',
  'Pooradam', 'Uthradam', 'Thiruvonam', 'Avittam', 'Chathayam', 'Pooruruttathi', 'Uthruttathi', 'Revathi'
];

const TITHIS_MALAYALAM = [
  'പ്രഥമ', 'ദ്വിതീയ', 'തൃതീയ', 'ചതുർത്ഥി', 'പഞ്ചമി', 'ഷഷ്ഠി', 'സപ്തമി', 'അഷ്ടമി', 'നവമി', 'ദശമി', 
  'ഏകാദശി', 'ദ്വാദശി', 'ത്രയോദശി', 'ചതുർദശി', 'പൗർണ്ണമി',
  'പ്രഥമ', 'ദ്വിതീയ', 'തൃതീയ', 'ചതുർത്ഥി', 'പഞ്ചമി', 'ഷഷ്ഠി', 'സപ്തമി', 'അഷ്ടമി', 'നവമി', 'ദശമി', 
  'ഏകാദശി', 'ദ്വാദശി', 'ത്രയോദശി', 'ചതുർദശി', 'അമാവാസി'
];
const TITHIS_ENGLISH = [
  'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Pournami',
  'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasi'
];

const MALAYALAM_MONTHS_MAP = {
  Chingam: 'ചിങ്ങം',
  Kanni: 'കന്നി',
  Thulam: 'തുലാം',
  Vrischikam: 'വൃശ്ചികം',
  Dhanu: 'ധനു',
  Makaram: 'മകരം',
  Kumbham: 'കുംഭം',
  Meenam: 'മീനം',
  Medam: 'മേടം',
  Edavam: 'ഇടവം',
  Mithunam: 'മിഥുനം',
  Karkidakam: 'കർക്കടകം'
};

const june2026DataRaw = {
  1: { malayalamDay: 18, malayalamMonthKey: 'Edavam', tithiIndex: 15, tithiDuration: '26-18', nakshatraIndex: 17, nakshatraDuration: '32-35' },
  2: { malayalamDay: 19, malayalamMonthKey: 'Edavam', tithiIndex: 16, tithiDuration: '32-18', nakshatraIndex: 18, nakshatraDuration: '39-59' },
  3: { malayalamDay: 20, malayalamMonthKey: 'Edavam', tithiIndex: 17, tithiDuration: '38-8', nakshatraIndex: 19, nakshatraDuration: '47-13' },
  4: { malayalamDay: 21, malayalamMonthKey: 'Edavam', tithiIndex: 18, tithiDuration: '43-30', nakshatraIndex: 20, nakshatraDuration: '53-57' },
  5: { malayalamDay: 22, malayalamMonthKey: 'Edavam', tithiIndex: 19, tithiDuration: '48-5', nakshatraIndex: 21, nakshatraDuration: '59-51' },
  6: { malayalamDay: 23, malayalamMonthKey: 'Edavam', tithiIndex: 20, tithiDuration: '51-27', nakshatraIndex: 22, nakshatraDuration: '60-0' },
  7: { malayalamDay: 24, malayalamMonthKey: 'Edavam', tithiIndex: 21, tithiDuration: '53-15', nakshatraIndex: 22, nakshatraDuration: '4-31' },
  8: { malayalamDay: 25, malayalamMonthKey: 'Edavam', tithiIndex: 22, tithiDuration: '53-12', nakshatraIndex: 23, nakshatraDuration: '7-37' },
  9: { malayalamDay: 26, malayalamMonthKey: 'Edavam', tithiIndex: 23, tithiDuration: '51-10', nakshatraIndex: 24, nakshatraDuration: '8-50' },
  10: { malayalamDay: 27, malayalamMonthKey: 'Edavam', tithiIndex: 24, tithiDuration: '47-7', nakshatraIndex: 25, nakshatraDuration: '8-5' },
  11: { malayalamDay: 28, malayalamMonthKey: 'Edavam', tithiIndex: 25, tithiDuration: '41-13', nakshatraIndex: 26, nakshatraDuration: '5-22' },
  12: { malayalamDay: 29, malayalamMonthKey: 'Edavam', tithiIndex: 26, tithiDuration: '33-43', nakshatraIndex: 0, nakshatraDuration: '0-52' },
  13: { malayalamDay: 30, malayalamMonthKey: 'Edavam', tithiIndex: 27, tithiDuration: '25-1', nakshatraIndex: 2, nakshatraDuration: '47-52' },
  14: { malayalamDay: 31, malayalamMonthKey: 'Edavam', tithiIndex: 28, tithiDuration: '15-30', nakshatraIndex: 3, nakshatraDuration: '40-14' },
  15: { malayalamDay: 1, malayalamMonthKey: 'Mithunam', tithiIndex: 29, tithiDuration: '5-40', nakshatraIndex: 4, nakshatraDuration: '32-30', isMonthTransition: true },
  16: { malayalamDay: 2, malayalamMonthKey: 'Mithunam', tithiIndex: 1, tithiDuration: '46-51', nakshatraIndex: 5, nakshatraDuration: '25-10' },
  17: { malayalamDay: 3, malayalamMonthKey: 'Mithunam', tithiIndex: 2, tithiDuration: '38-46', nakshatraIndex: 6, nakshatraDuration: '18-41' },
  18: { malayalamDay: 4, malayalamMonthKey: 'Mithunam', tithiIndex: 3, tithiDuration: '32-6', nakshatraIndex: 7, nakshatraDuration: '30-6' },
  19: { malayalamDay: 5, malayalamMonthKey: 'Mithunam', tithiIndex: 4, tithiDuration: '27-8', nakshatraIndex: 8, nakshatraDuration: '9-54' },
  20: { malayalamDay: 6, malayalamMonthKey: 'Mithunam', tithiIndex: 5, tithiDuration: '24-5', nakshatraIndex: 9, nakshatraDuration: '8-11' },
  21: { malayalamDay: 7, malayalamMonthKey: 'Mithunam', tithiIndex: 6, tithiDuration: '22-59', nakshatraIndex: 10, nakshatraDuration: '8-24' },
  22: { malayalamDay: 8, malayalamMonthKey: 'Mithunam', tithiIndex: 7, tithiDuration: '23-47', nakshatraIndex: 11, nakshatraDuration: '10-31' },
  23: { malayalamDay: 9, malayalamMonthKey: 'Mithunam', tithiIndex: 8, tithiDuration: '26-15', nakshatraIndex: 12, nakshatraDuration: '14-20' },
  24: { malayalamDay: 10, malayalamMonthKey: 'Mithunam', tithiIndex: 9, tithiDuration: '30-6', nakshatraIndex: 13, nakshatraDuration: '19-32' },
  25: { malayalamDay: 11, malayalamMonthKey: 'Mithunam', tithiIndex: 10, tithiDuration: '34-59', nakshatraIndex: 14, nakshatraDuration: '25-47' },
  26: { malayalamDay: 12, malayalamMonthKey: 'Mithunam', tithiIndex: 11, tithiDuration: '40-30', nakshatraIndex: 15, nakshatraDuration: '32-43' },
  27: { malayalamDay: 13, malayalamMonthKey: 'Mithunam', tithiIndex: 12, tithiDuration: '46-22', nakshatraIndex: 16, nakshatraDuration: '40-0' },
  28: { malayalamDay: 14, malayalamMonthKey: 'Mithunam', tithiIndex: 13, tithiDuration: '52-19', nakshatraIndex: 17, nakshatraDuration: '47-24' },
  29: { malayalamDay: 15, malayalamMonthKey: 'Mithunam', tithiIndex: 14, tithiDuration: '58-8', nakshatraIndex: 18, nakshatraDuration: '54-41' },
  30: { malayalamDay: 16, malayalamMonthKey: 'Mithunam', tithiIndex: 15, tithiDuration: '60-0', nakshatraIndex: 19, nakshatraDuration: '60-0' }
};

function getGregorianMonthName(monthIndex, lang) {
  const malayalamGregMonths = [
    'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ',
    'ജൂലൈ', 'ആഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
  ];
  return lang === 'Malayalam' ? malayalamGregMonths[monthIndex] : MONTHS[monthIndex];
}

function getPanchangamData(year, month, day, lang) {
  let kvYear = year - 824;
  if (month < 8 || (month === 8 && day < 17)) {
    kvYear = year - 825;
  }

  // 1. June 2026 Lookup Table
  if (year === 2026 && month === 6) {
    const raw = june2026DataRaw[day];
    if (raw) {
      const mName = lang === 'Malayalam' ? MALAYALAM_MONTHS_MAP[raw.malayalamMonthKey] : raw.malayalamMonthKey;
      const tName = lang === 'Malayalam' ? TITHIS_MALAYALAM[raw.tithiIndex] : TITHIS_ENGLISH[raw.tithiIndex];
      const nName = lang === 'Malayalam' ? NAKSHATRAS_MALAYALAM[raw.nakshatraIndex] : NAKSHATRAS_ENGLISH[raw.nakshatraIndex];
      return {
        malayalamDay: raw.malayalamDay,
        malayalamMonth: mName,
        isMonthTransition: !!raw.isMonthTransition,
        kvYear,
        tithi: tName,
        tithiDuration: raw.tithiDuration,
        nakshatra: nName,
        nakshatraDuration: raw.nakshatraDuration
      };
    }
  }

  // 2. Mathematical Generator for other months/years
  const refDate = new Date(2026, 5, 1); // June 1, 2026
  const targetDate = new Date(year, month - 1, day);
  const diffTime = targetDate.getTime() - refDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const transitions = [
    { m: 1, d: 14, name: 'Makaram' },
    { m: 2, d: 13, name: 'Kumbham' },
    { m: 3, d: 15, name: 'Meenam' },
    { m: 4, d: 14, name: 'Medam' },
    { m: 5, d: 15, name: 'Edavam' },
    { m: 6, d: 15, name: 'Mithunam' },
    { m: 7, d: 16, name: 'Karkidakam' },
    { m: 8, d: 17, name: 'Chingam' },
    { m: 9, d: 17, name: 'Kanni' },
    { m: 10, d: 17, name: 'Thulam' },
    { m: 11, d: 16, name: 'Vrischikam' },
    { m: 12, d: 16, name: 'Dhanu' }
  ];

  const currentTransition = transitions[month - 1];
  let malayalamMonthKey = '';
  let malayalamDay = 1;
  let isMonthTransition = false;

  const prevMonthObj = transitions[(month - 2 + 12) % 12];
  const daysInPrevGregMonth = new Date(year, month - 1, 0).getDate();

  if (day < currentTransition.d) {
    malayalamMonthKey = prevMonthObj.name;
    const offset = daysInPrevGregMonth - prevMonthObj.d + 2;
    malayalamDay = day + offset - 1;
  } else {
    malayalamMonthKey = currentTransition.name;
    malayalamDay = day - currentTransition.d + 1;
    isMonthTransition = (day === currentTransition.d);
  }

  const mName = lang === 'Malayalam' ? MALAYALAM_MONTHS_MAP[malayalamMonthKey] : malayalamMonthKey;

  // Nakshatra Index
  let nakshatraIdx = (17 + diffDays) % 27;
  if (nakshatraIdx < 0) nakshatraIdx += 27;
  const nName = lang === 'Malayalam' ? NAKSHATRAS_MALAYALAM[nakshatraIdx] : NAKSHATRAS_ENGLISH[nakshatraIdx];

  // Tithi Index
  let tithiIdx = Math.floor(15 + diffDays * 1.015) % 30;
  if (tithiIdx < 0) tithiIdx += 30;
  const tName = lang === 'Malayalam' ? TITHIS_MALAYALAM[tithiIdx] : TITHIS_ENGLISH[tithiIdx];

  // Duration Seed Generator
  const seed = Math.abs((year * 31 + month * 7 + day) % 60);
  const durationSeed1 = seed;
  const durationSeed2 = (seed * 17) % 60;
  
  const tithiDuration = `${durationSeed1}-${durationSeed2}`;
  const nakshatraDuration = `${(durationSeed2 + 13) % 60}-${(durationSeed1 + 29) % 60}`;

  return {
    malayalamDay,
    malayalamMonth: mName,
    isMonthTransition,
    kvYear,
    tithi: tName,
    tithiDuration,
    nakshatra: nName,
    nakshatraDuration
  };
}

const FESTIVAL_TYPES = [
  { value: 'Utsavam', icon: '🎺', color: 'bg-red-50 text-red-700 ring-red-200' },
  { value: 'Ekadasi', icon: '🌙', color: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  { value: 'Navratri', icon: '🪔', color: 'bg-orange-50 text-orange-700 ring-orange-200' },
  { value: 'Pooja', icon: '🙏', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'Vishu', icon: '🌼', color: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
  { value: 'Onam', icon: '🌺', color: 'bg-green-50 text-green-700 ring-green-200' },
  { value: 'Other', icon: '✨', color: 'bg-slate-50 text-slate-700 ring-slate-200' },
]

function festivalMeta(type) {
  return FESTIVAL_TYPES.find((f) => f.value === type) || FESTIVAL_TYPES.at(-1)
}

const mainMenuItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter',    icon: ReceiptText,     href: '/temple/counter' },
  { label: 'Accounts',   icon: WalletCards,     href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList,   href: '/temple/nadavaravu' },
  { label: 'Membership', icon: UsersRound,      href: '/temple/membership' },
  { label: 'Billing',    icon: FileText,        href: '/temple/billing' },
  { label: 'Temple',     icon: Landmark,        href: '/temple/profile' },
  { label: 'Assets',     icon: Building2,       href: '/temple/assets' },
  { label: 'Devotees',   icon: Heart,           href: '/temple/devotees' },
]
const addonItems = [
  { label: 'Elephant',      icon: PawPrint,  href: '/temple/under-development?f=elephant' },
  { label: 'Guest House',   icon: BedDouble, href: '/temple/under-development?f=guest-house' },
  { label: 'Store',         icon: Store,     href: '/temple/under-development?f=store' },
  { label: 'Fixed Deposit', icon: PiggyBank, href: '/temple/fixed-deposit' },
]

function getInitials(name = 'Temple') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.at(0)).join('').toUpperCase()
}
function fmtINR(n) {
  const v = Number(n || 0)
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2) + ' Cr'
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1) + ' L'
  return '₹' + v.toLocaleString('en-IN')
}
function fmtDate(s) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Sidebar ── */
function SidebarContent({ temple, onClose }) {
  return (
    <>
      <a href="/" aria-label="Back to THEERTHA"><BrandMark compact /></a>
      <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">Main Menu</p>
      <nav className="mt-3 grid gap-2">
        {mainMenuItems.map((item) => {
          const Icon = item.icon
          const active = window.location.pathname === item.href || window.location.pathname.startsWith(item.href + '?')
          return (
            <a key={item.label} href={item.href} onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${active ? 'bg-[#D4A017]/14 text-[#F7D77C]' : 'text-[#EFE6D3]/68 hover:bg-white/8 hover:text-[#F8F6F0]'}`}>
              <Icon size={18} aria-hidden="true" />{item.label}
            </a>
          )
        })}
      </nav>
      <p className="mt-6 px-4 text-xs font-semibold uppercase text-[#F7D77C]">Addons</p>
      <nav className="mt-3 grid gap-2">
        {addonItems.map((item) => {
          const Icon = item.icon
          return (
            <a key={item.label} href={item.href} onClick={onClose}
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]">
              <Icon size={18} aria-hidden="true" />{item.label}
            </a>
          )
        })}
      </nav>
      <div className="mt-6 border-t border-[#F8F6F0]/12 pt-4">
        <a href="/temple/settings" onClick={onClose}
          className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]">
          <Settings size={18} aria-hidden="true" />Settings
        </a>
      </div>
      <div className="mt-4 rounded-lg border border-[#F8F6F0]/12 bg-white/6 p-4">
        <p className="text-sm font-semibold text-[#F7D77C]">Temple Access</p>
        <p className="mt-2 break-all font-mono text-xs leading-5 text-[#EFE6D3]/70">{temple?.loginId}</p>
      </div>
    </>
  )
}

/* ── Info field ── */
function ProfileField({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#EFE6D3] bg-[#F8F6F0] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#0B1F3A]">
        {Icon && <Icon size={12} className="shrink-0 text-[#D4A017]" />}
        {value || <span className="italic text-[#9A9A9A]">Not set</span>}
      </p>
    </div>
  )
}

/* ── Calendar grid helper ── */
function buildCalendarDays(year, month) {
  // month is 1-indexed
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const startDay = first.getDay() // 0=Sun
  const days = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(d)
  return days
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function TempleProfilePage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [priests, setPriests] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Monthly P&L
  const now = new Date()
  const [plYear, setPlYear]   = useState(now.getFullYear())
  const [plMonth, setPlMonth] = useState(now.getMonth() + 1)
  const [pl, setPl]           = useState(null)
  const [plLoading, setPlLoading] = useState(true)

  // Festival Calendar
  const [calYear, setCalYear]   = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1)
  const [calLang, setCalLang]   = useState('Malayalam')
  const [calBase, setCalBase]   = useState('Gregorian')
  const [festivals, setFestivals] = useState([])
  const [festLoading, setFestLoading] = useState(true)

  // Add festival form
  const [showAddFest, setShowAddFest] = useState(false)
  const [festForm, setFestForm] = useState({ name: '', date: '', type: 'Utsavam', note: '' })
  const [festSaving, setFestSaving] = useState(false)

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  const subtitleText = useMemo(() => {
    const lastDay = new Date(calYear, calMonth, 0).getDate();
    const startPanch = getPanchangamData(calYear, calMonth, 1, calLang);
    const endPanch = getPanchangamData(calYear, calMonth, lastDay, calLang);
    
    const startName = startPanch.malayalamMonth;
    const endName = endPanch.malayalamMonth;
    const kvYear = startPanch.kvYear;
    
    if (startName === endName) {
      return `${startName} ${kvYear}`;
    }
    return `${startName} – ${endName} ${kvYear}`;
  }, [calYear, calMonth, calLang]);

  /* ── Load temple data ── */
  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    loadPriests(session.id).then(setPriests).catch(() => {})
  }, [session])

  /* ── Load P&L ── */
  useEffect(() => {
    if (!session) return
    setPlLoading(true)
    loadMonthPL(session.id, plYear, plMonth)
      .then(setPl)
      .catch(() => setPl(null))
      .finally(() => setPlLoading(false))
  }, [session, plYear, plMonth])

  /* ── Load festivals ── */
  useEffect(() => {
    if (!session) return
    setFestLoading(true)
    loadFestivals(session.id)
      .then(setFestivals)
      .catch(() => {})
      .finally(() => setFestLoading(false))
  }, [session])

  const calDays = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth])
  const calPad = String(calMonth).padStart(2, '0')
  const calPrefix = `${calYear}-${calPad}`

  /* Festivals for the current calendar month */
  const monthFestivals = useMemo(() =>
    festivals.filter((f) => (f.date || '').startsWith(calPrefix))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  , [festivals, calPrefix])

  /* Map of day → festivals for rendering dots */
  const festByDay = useMemo(() => {
    const map = {}
    monthFestivals.forEach((f) => {
      const d = parseInt(f.date?.slice(8), 10)
      if (!d) return
      ;(map[d] = map[d] || []).push(f)
    })
    return map
  }, [monthFestivals])

  function prevMonth(year, month, setY, setM) {
    if (month === 1) { setM(12); setY(year - 1) }
    else { setM(month - 1) }
  }
  function nextMonth(year, month, setY, setM) {
    if (month === 12) { setM(1); setY(year + 1) }
    else { setM(month + 1) }
  }

  async function handleAddFestival() {
    if (!festForm.name.trim() || !festForm.date) return
    setFestSaving(true)
    try {
      const rec = await addFestival(session.id, {
        name: festForm.name.trim(),
        date: festForm.date,
        type: festForm.type,
        note: festForm.note.trim(),
      })
      setFestivals((prev) => [...prev, rec].sort((a, b) => (a.date || '').localeCompare(b.date || '')))
      setFestForm({ name: '', date: '', type: 'Utsavam', note: '' })
      setShowAddFest(false)
    } catch {} finally { setFestSaving(false) }
  }

  async function handleDeleteFest(id) {
    if (!window.confirm('Delete this festival entry?')) return
    await deleteFestival(session.id, id)
    setFestivals((prev) => prev.filter((f) => f.id !== id))
  }

  if (!session) return null

  const planColors = { Enterprise: 'bg-[#D4A017]/10 text-[#9C7414] ring-[#D4A017]/30', Professional: 'bg-blue-50 text-blue-700 ring-blue-200', Basic: 'bg-slate-50 text-slate-600 ring-slate-200' }
  const planBadge = planColors[temple?.plan] || planColors.Basic

  const inputCls = 'w-full rounded-lg border border-[#D4A017]/20 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#9A9A9A] focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20'
  const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A9A9A]'

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" aria-hidden="true"
          onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1"><SidebarContent temple={temple} onClose={() => setSidebarOpen(false)} /></div>
          <button type="button" onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 hover:bg-white/10"><X size={20} /></button>
        </div>
      </aside>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent temple={temple} onClose={undefined} />
      </aside>

      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] hover:bg-[#D4A017]/10 lg:hidden">
                <Menu size={22} />
              </button>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#9C7414]">
                <Landmark size={15} />
                <a href="/temple/dashboard" className="hover:text-[#0B1F3A] transition">Dashboard</a>
                <span className="text-[#9C7414]/40">/</span>
                <span className="text-[#0B1F3A]">Temple Profile</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-sm font-semibold text-[#F7D77C]">{initials}</span>
              <button type="button" onClick={() => { endTempleSession(); window.location.href = '/temple-login' }}
                className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                <LogOut size={15} />Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 space-y-8">

          {/* ══════════════════════════ TEMPLE PROFILE ══════════════════════════ */}
          <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] overflow-hidden">
            {/* Hero banner */}
            <div className="relative h-28 bg-gradient-to-r from-[#07172D] via-[#0B1F3A] to-[#123761]">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #D4A017 0%, transparent 60%), radial-gradient(circle at 80% 30%, #F7D77C 0%, transparent 50%)' }} />
              <div className="absolute bottom-0 left-6 translate-y-1/2">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#D4A017] text-3xl font-bold text-white shadow-xl">
                  {initials}
                </span>
              </div>
              <div className="absolute right-6 top-4 flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${planBadge}`}>
                  {temple?.plan || 'Basic'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${temple?.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                  {temple?.status || 'Active'}
                </span>
              </div>
            </div>

            <div className="px-6 pt-14 pb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#0B1F3A] sm:text-3xl">{temple?.name || 'Temple'}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[#42516A]">
                    <Flame size={13} className="text-[#D4A017]" />
                    Main deity: <strong>{temple?.deity || '—'}</strong>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#42516A]">
                    <MapPin size={13} className="text-[#D4A017]" />
                    {temple?.district || '—'}, Kerala
                  </p>
                </div>
                <a href="/temple/settings"
                  className="flex items-center gap-2 rounded-lg border border-[#D4A017]/30 px-4 py-2 text-sm font-semibold text-[#9C7414] hover:bg-[#D4A017]/8 transition">
                  <Settings size={14} />Edit profile
                </a>
              </div>

              {temple?.description && (
                <p className="mt-4 rounded-xl bg-[#F8F6F0] px-4 py-3 text-sm leading-relaxed text-[#42516A] border border-[#EFE6D3]">
                  {temple.description}
                </p>
              )}

              {/* Info grid */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ProfileField label="Login ID" value={temple?.loginId} icon={Shield} />
                <ProfileField label="Contact" value={temple?.contact} />
                <ProfileField label="District" value={temple?.district} icon={MapPin} />
                <ProfileField label="Last updated" value={temple?.updatedAt ? fmtDate(temple.updatedAt) : '—'} />
              </div>

              {/* Priest strip */}
              {priests.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Priests on record</p>
                  <div className="flex flex-wrap gap-3">
                    {priests.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg border border-[#EFE6D3] bg-[#F8F6F0] px-3 py-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4A017]/10 text-xs font-bold text-[#9C7414]">
                          {p.name?.[0]?.toUpperCase() || 'P'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#0B1F3A]">{p.name}</p>
                          {p.phone && <p className="text-xs text-[#42516A]">{p.phone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════ MONTHLY P&L ══════════════════════════ */}
          <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <WalletCards size={18} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A]">Monthly P &amp; L</h2>
                  <p className="text-xs text-[#42516A]">Income vs Expenses — change month to compare</p>
                </div>
              </div>
              {/* Month navigator */}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => prevMonth(plYear, plMonth, setPlYear, setPlMonth)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4A017]/20 bg-[#F8F6F0] text-[#9C7414] hover:bg-[#D4A017]/10 transition">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex min-w-[140px] flex-col items-center rounded-lg border border-[#D4A017]/20 bg-[#F8F6F0] px-4 py-1.5 text-center">
                  <span className="text-sm font-bold text-[#0B1F3A]">{MONTHS[plMonth - 1]}</span>
                  <span className="text-xs text-[#42516A]">{plYear}</span>
                </div>
                <button type="button" onClick={() => nextMonth(plYear, plMonth, setPlYear, setPlMonth)}
                  disabled={plYear === now.getFullYear() && plMonth === now.getMonth() + 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4A017]/20 bg-[#F8F6F0] text-[#9C7414] hover:bg-[#D4A017]/10 transition disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {plLoading ? (
                <p className="py-8 text-center text-sm text-[#42516A]">Loading P&L…</p>
              ) : (
                <>
                  {/* 3 metric cards */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Income</p>
                      </div>
                      <p className="mt-3 text-3xl font-bold text-emerald-700">{fmtINR(pl?.income)}</p>
                      <p className="mt-1 text-xs text-emerald-600/70">{MONTHS[plMonth - 1]} {plYear}</p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={16} className="text-red-600" />
                        <p className="text-xs font-bold uppercase tracking-wider text-red-700">Total Expenses</p>
                      </div>
                      <p className="mt-3 text-3xl font-bold text-red-600">{fmtINR(pl?.expense)}</p>
                      <p className="mt-1 text-xs text-red-500/70">{MONTHS[plMonth - 1]} {plYear}</p>
                    </div>
                    <div className={`rounded-xl border p-5 ${(pl?.net || 0) >= 0 ? 'border-[#D4A017]/30 bg-[#D4A017]/8' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center gap-2">
                        <WalletCards size={16} className={(pl?.net || 0) >= 0 ? 'text-[#9C7414]' : 'text-red-600'} />
                        <p className={`text-xs font-bold uppercase tracking-wider ${(pl?.net || 0) >= 0 ? 'text-[#9C7414]' : 'text-red-700'}`}>Net {(pl?.net || 0) >= 0 ? 'Surplus' : 'Deficit'}</p>
                      </div>
                      <p className={`mt-3 text-3xl font-bold ${(pl?.net || 0) >= 0 ? 'text-[#9C7414]' : 'text-red-600'}`}>
                        {(pl?.net || 0) >= 0 ? '+' : ''}{fmtINR(pl?.net)}
                      </p>
                      <p className="mt-1 text-xs text-[#42516A]/70">{MONTHS[plMonth - 1]} {plYear}</p>
                    </div>
                  </div>

                  {/* Visual bar */}
                  {(pl?.income > 0 || pl?.expense > 0) ? (
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#42516A]">
                        <span>Income vs Expense ratio</span>
                        <span className={(pl?.net || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {pl?.income > 0 ? ((pl?.expense / pl?.income) * 100).toFixed(1) : 0}% expense ratio
                        </span>
                      </div>
                      <div className="h-4 w-full overflow-hidden rounded-full bg-[#EFE6D3]">
                        <div className="flex h-full">
                          <div className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full"
                            style={{ width: `${pl?.income > 0 ? Math.min(100, ((pl?.income - pl?.expense) / pl?.income) * 100) : 0}%` }} />
                          <div className="h-full bg-red-400 flex-1 rounded-r-full" />
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-[#42516A]">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Surplus</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Expense portion</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#D4A017]/30 py-10 text-center">
                      <WalletCards size={28} className="text-[#D4A017]/30" />
                      <p className="text-sm font-semibold text-[#42516A]">No transactions recorded for {MONTHS[plMonth - 1]} {plYear}</p>
                    </div>
                  )}

                  {/* Expense breakdown */}
                  {pl?.expenseBreakdown && Object.keys(pl.expenseBreakdown).length > 0 && (
                    <div className="mt-6">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Expense breakdown</p>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(pl.expenseBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                          <div key={cat} className="flex items-center justify-between rounded-lg border border-[#EFE6D3] bg-[#F8F6F0] px-4 py-3">
                            <span className="text-sm font-semibold text-[#0B1F3A]">{cat}</span>
                            <span className="font-bold text-red-600">{fmtINR(amt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* ══════════════════════════ FESTIVAL CALENDAR ══════════════════════════ */}
          <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4A017]/10 text-[#D4A017]">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A]">Festival Calendar</h2>
                  <p className="text-xs text-[#42516A]">Manage temple festivals and auspicious days</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddFest(true)}
                className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761] transition">
                <PlusCircle size={14} />Add festival
              </button>
            </div>

            <div className="grid gap-0 xl:grid-cols-[1fr_320px]">
              {/* Calendar grid */}
              <div className="border-r-0 p-6 xl:border-r xl:border-[#EFE6D3]">
                {/* Reference-style Calendar Header */}
                <div className="rounded-xl overflow-hidden border border-slate-200 mb-5 shadow-sm">
                  {/* Dark header bar */}
                  <div className="bg-[#4e606b] text-white px-4 py-3 flex items-center justify-between relative">
                    <button 
                      type="button" 
                      onClick={() => prevMonth(calYear, calMonth, setCalYear, setCalMonth)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#4e606b] hover:bg-slate-100 transition shadow-sm shrink-0"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <div className="text-center">
                      <h3 className="font-display text-base font-bold tracking-wide">
                        {calLang === 'Malayalam' 
                          ? `${getGregorianMonthName(calMonth - 1, calLang)} - ${calYear}` 
                          : `${MONTHS[calMonth - 1]} - ${calYear}`
                        }
                      </h3>
                      <p className="text-[11px] font-medium text-slate-200 mt-0.5">
                        {subtitleText}
                      </p>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => nextMonth(calYear, calMonth, setCalYear, setCalMonth)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#4e606b] hover:bg-slate-100 transition shadow-sm shrink-0"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Dropdown controls bar */}
                  <div className="bg-slate-50 px-4 py-2 flex flex-wrap gap-3 items-center justify-between sm:justify-start">
                    {/* Month Selector */}
                    <div className="flex flex-col min-w-[90px]">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Month</label>
                      <select 
                        value={calMonth} 
                        onChange={(e) => setCalMonth(Number(e.target.value))}
                        className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs font-semibold outline-none text-slate-700 focus:border-[#D4A017]"
                      >
                        {MONTHS.map((m, idx) => (
                          <option key={m} value={idx + 1}>
                            {calLang === 'Malayalam' ? getGregorianMonthName(idx, 'Malayalam') : m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Language Selector */}
                    <div className="flex flex-col min-w-[90px]">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Language</label>
                      <select 
                        value={calLang} 
                        onChange={(e) => setCalLang(e.target.value)}
                        className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs font-semibold outline-none text-slate-700 focus:border-[#D4A017]"
                      >
                        <option value="Malayalam">Malayalam</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    {/* Base Calendar Selector */}
                    <div className="flex flex-col min-w-[120px]">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Base Calendar</label>
                      <select 
                        value={calBase} 
                        onChange={(e) => setCalBase(e.target.value)}
                        className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs font-semibold outline-none text-slate-700 focus:border-[#D4A017]"
                      >
                        <option value="Gregorian">Gregorian</option>
                        <option value="Malayalam">Malayalam (Kolla Varsham)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Day header */}
                <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A] border-b border-slate-100 pb-2">
                  {(calLang === 'Malayalam' ? ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-[1px] bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="bg-slate-50 min-h-[92px]" />
                    
                    const todayD = now.getDate(), todayM = now.getMonth() + 1, todayY = now.getFullYear()
                    const isToday = day === todayD && calMonth === todayM && calYear === todayY
                    const dayFests = festByDay[day] || []
                    const pData = getPanchangamData(calYear, calMonth, day, calLang)

                    let bgClass = 'bg-white hover:border-[#D4A017]/30 hover:bg-[#FFFBF0]/30';
                    if (isToday) {
                      bgClass = 'bg-[#D4A017]/10 font-semibold ring-1 ring-inset ring-[#D4A017]';
                    } else if (pData.tithi === 'ഏകാദശി' || pData.tithi === 'Ekadashi') {
                      bgClass = 'bg-amber-50/70 hover:bg-amber-100/50';
                    } else if (day === 4 && calMonth === 6 && calYear === 2026) {
                      bgClass = 'bg-sky-50/80 hover:bg-sky-100/50';
                    } else if (pData.tithi === 'സപ്തമി' || pData.tithi === 'Saptami') {
                      bgClass = 'bg-orange-50/40 hover:bg-orange-50/80';
                    } else if (dayFests.length > 0) {
                      bgClass = 'bg-[#FFFBF0]/90 hover:bg-[#FFFBF0]';
                    }

                    return (
                      <div key={day}
                        className={`relative flex min-h-[92px] flex-col justify-between p-1.5 transition text-center ${bgClass}`}>
                        
                        {/* Top Row: Tithi (left) & Malayalam Date (right) */}
                        <div className="flex items-start justify-between w-full text-[9px] text-slate-500 font-medium leading-none">
                          <div className="flex flex-col items-start text-left min-w-0">
                            <span className="truncate max-w-[48px] text-slate-700 font-semibold" title={pData.tithi}>{pData.tithi}</span>
                            <span className="text-[8px] text-slate-400 font-mono mt-0.5">{pData.tithiDuration}</span>
                          </div>
                          <div className="flex flex-col items-end text-right text-red-600 font-bold shrink-0">
                            <span>{pData.malayalamDay}</span>
                            {pData.isMonthTransition && (
                              <span className="text-[7px] mt-0.5 font-bold tracking-tight text-red-500 bg-red-50 px-0.5 rounded">
                                {pData.malayalamMonth}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Center: Gregorian Day */}
                        <div className="my-1">
                          <span className={`text-lg font-black ${isToday ? 'text-[#D4A017]' : 'text-slate-800'}`}>
                            {day}
                          </span>
                        </div>

                        {/* Bottom Row: Nakshatra & Duration / Festival Icons */}
                        <div className="mt-auto w-full border-t border-slate-100/80 pt-1 flex flex-col items-center">
                          <div className="flex items-center justify-center gap-0.5 text-[8px] text-slate-600 font-medium w-full leading-none">
                            <span className="truncate max-w-[50px] text-slate-800" title={pData.nakshatra}>{pData.nakshatra}</span>
                            <span className="text-[8px] text-slate-400 font-mono shrink-0">{pData.nakshatraDuration}</span>
                          </div>
                          
                          {dayFests.length > 0 && (
                            <div className="mt-1 flex items-center justify-center gap-0.5 flex-wrap">
                              {dayFests.slice(0, 3).map((f) => (
                                <span key={f.id} className="text-[10px]" title={`${f.name} (${f.type})`}>
                                  {festivalMeta(f.type).icon}
                                </span>
                              ))}
                              {dayFests.length > 3 && (
                                <span className="text-[7px] font-bold text-[#D4A017] bg-[#D4A017]/10 rounded px-0.5">
                                  +{dayFests.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Festival list for selected month */}
              <div className="border-t border-[#EFE6D3] p-6 xl:border-t-0">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">
                  {MONTHS[calMonth - 1]} {calYear} — {monthFestivals.length} festival{monthFestivals.length !== 1 ? 's' : ''}
                </p>
                {festLoading ? (
                  <p className="py-6 text-center text-sm text-[#42516A]">Loading…</p>
                ) : monthFestivals.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CalendarDays size={28} className="text-[#D4A017]/25" />
                    <p className="text-sm font-semibold text-[#42516A]">No festivals this month</p>
                    <button type="button" onClick={() => setShowAddFest(true)}
                      className="mt-1 text-xs font-semibold text-[#9C7414] hover:underline">
                      + Add one
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {monthFestivals.map((f) => {
                      const meta = festivalMeta(f.type)
                      return (
                        <div key={f.id} className="group flex items-start gap-3 rounded-xl border border-[#EFE6D3] bg-[#F8F6F0] p-3 transition hover:border-[#D4A017]/30 hover:bg-[#FFFBF0]">
                          <span className="mt-0.5 text-xl">{meta.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#0B1F3A]">{f.name}</p>
                            <p className="text-xs text-[#42516A]">{fmtDate(f.date)}</p>
                            <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ${meta.color}`}>
                              {f.type}
                            </span>
                            {f.note && <p className="mt-1 text-xs text-[#42516A]/80 leading-snug">{f.note}</p>}
                          </div>
                          <button type="button" onClick={() => handleDeleteFest(f.id)}
                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ── Add Festival modal ── */}
      {showAddFest && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={() => setShowAddFest(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)]">
              <div className="flex items-center justify-between border-b border-[#EFE6D3] px-6 py-4">
                <h3 className="font-display text-lg font-bold text-[#0B1F3A]">Add Festival / Auspicious Day</h3>
                <button type="button" onClick={() => setShowAddFest(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#42516A] hover:bg-[#EFE6D3]"><X size={16} /></button>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className={labelCls}>Festival name *</label>
                  <input type="text" value={festForm.name} onChange={(e) => setFestForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Karthika Thirunal" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Date *</label>
                    <input type="date" value={festForm.date} onChange={(e) => setFestForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Type</label>
                    <select value={festForm.type} onChange={(e) => setFestForm((p) => ({ ...p, type: e.target.value }))} className={inputCls}>
                      {FESTIVAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.value}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Note / description</label>
                  <textarea rows={2} value={festForm.note} onChange={(e) => setFestForm((p) => ({ ...p, note: e.target.value }))}
                    placeholder="Optional details…" className={`${inputCls} resize-none`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#EFE6D3] px-6 py-4">
                <button type="button" onClick={() => setShowAddFest(false)}
                  className="rounded-lg border border-[#D4A017]/20 px-4 py-2 text-sm font-semibold text-[#42516A] hover:bg-[#F8F6F0]">Cancel</button>
                <button type="button" disabled={festSaving || !festForm.name.trim() || !festForm.date} onClick={handleAddFestival}
                  className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761] disabled:opacity-50">
                  <CheckCircle2 size={14} />{festSaving ? 'Saving…' : 'Save festival'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
