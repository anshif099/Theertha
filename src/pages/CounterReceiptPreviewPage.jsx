import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  FileDown,
  MessageCircle,
  Printer,
  Share2,
  Smartphone,
} from 'lucide-react'
import { encodeReceiptPayload } from '../lib/settingsStore.js'
import { navigateTo } from '../lib/router.js'

function fmtINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

export default function CounterReceiptPreviewPage() {
  const [receipt, setReceipt] = useState(null)
  const [copied, setCopied] = useState(false)
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false)
  const [sendingSms, setSendingSms] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('theertha-last-receipt')
      if (raw) {
        setReceipt(JSON.parse(raw))
      }
    } catch (err) {
      console.error('Failed to load receipt from session storage:', err)
    }
  }, [])

  if (!receipt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#071828] p-6 text-[#F8F6F0]">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#EFE6D3]/60">No receipt found</p>
          <a
            href="/temple/counter/dashboard"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#07172D] transition hover:bg-[#F7D77C]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const devoteeMobile = receipt.mobile || ''
  const devoteeName = receipt.devoteeName || 'Devotee'
  const templeName = receipt.templeName || 'Temple'

  // Generate a Whatsapp text message
  const itemsText = receipt.persons?.length ? receipt.persons.map(person => `${person.name}:\n${person.items.map(item => `${item.name} (${item.qty} x ${fmtINR(item.amount)})`).join('\n')}`).join('\n\n') : receipt.items
    ? receipt.items.map((item) => `• ${item.name} (${item.qty} x ${fmtINR(item.amount)})`).join('\n')
    : ''
  const whatsappMsg = encodeURIComponent(
    `🙏 Namaste ${devoteeName},\n\nYour offering at *${templeName}* has been successfully received.\n\n*Receipt Details:*\nReceipt No: ${receipt.receiptNo}\nDate: ${receipt.date}\nPayment Mode: ${receipt.paymentMethod}\nTotal Amount: ${fmtINR(receipt.total)}\n\n*Offerings:*\n${itemsText}\n\nMay the divine blessings be with you always.`
  )

  const handleWhatsappShare = () => {
    setSendingWhatsapp(true)
    setTimeout(() => {
      setSendingWhatsapp(false)
      const phone = devoteeMobile ? devoteeMobile.replace(/\D/g, '') : ''
      const url = `https://api.whatsapp.com/send?phone=${phone.startsWith('91') ? phone : '91' + phone}&text=${whatsappMsg}`
      window.open(url, '_blank')
    }, 800)
  }

  const handleSmsShare = () => {
    setSendingSms(true)
    setTimeout(() => {
      setSendingSms(false)
      alert(`SMS receipt link triggered to send to +91 ${devoteeMobile}!`)
    }, 800)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleNewReceipt = () => {
    navigateTo('/temple/counter/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#071828] text-[#F8F6F0] print:bg-white print:text-black">

      {/* ── Print Styles (Hidden in screen, shown in print) ── */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 80mm !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Header bar (no-print) */}
      <header className="no-print flex items-center justify-between border-b border-[#D4A017]/18 bg-[#0B1F3A]/90 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/temple/counter/dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4A017]/30 text-[#F7D77C] transition hover:bg-[#D4A017]/10"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#F8F6F0]">{receipt.receiptNo}</h1>
            <p className="text-xs text-[#EFE6D3]/60">Receipt Preview &amp; Printing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle size={12} />
            Saved &amp; Active
          </span>
        </div>
      </header>

      {/* Main content grid */}
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-center">

          {/* LEFT: Premium thermal paper receipt styling */}
          <div className="print-area w-full max-w-sm flex-shrink-0 border border-[#D4A017]/24 bg-white p-3 text-black shadow-2xl rounded-xl print:shadow-none print:border-0 print:p-0 print:max-w-[80mm]">
            <div className="text-center">
              <h2 className="text-sm font-extrabold uppercase tracking-wide">{receipt.templeName}</h2>
              <p className="text-xs font-semibold text-gray-600">
                {receipt.templeDistrict ? `${receipt.templeDistrict} District` : ''}
                {receipt.templeContact ? ` · Tel: ${receipt.templeContact}` : ''}
              </p>
              <div className="my-1 border-b border-dashed border-gray-400" />
              <h3 className="text-[10px] font-black uppercase tracking-wider">
                {receipt.paymentStatus === 'Unpaid' ? 'DEVASWOM RECEIPT (UNPAID)' : 'DEVASWOM RECEIPT'}
              </h3>
              {receipt.paymentStatus === 'Unpaid' && (
                <div className="my-1.5 py-1 px-2 bg-rose-100 border border-rose-400 rounded text-center text-xs font-extrabold text-rose-800 uppercase tracking-widest">
                  *** UNPAID — PAYMENT PENDING ***
                </div>
              )}
              <div className="my-1 border-b border-dashed border-gray-400" />
            </div>

            {/* Metadata fields */}
            <div className="grid grid-cols-2 gap-y-0.5 text-[9px] font-bold text-gray-700">
              <div>Receipt No:</div>
              <div className="text-right font-mono text-black">{receipt.receiptNo}</div>

              <div>Date &amp; Time:</div>
              <div className="text-right text-black">{receipt.date} · {receipt.time}</div>

              <div>Counter No:</div>
              <div className="text-right text-black">#{receipt.counterNo} ({receipt.counterName})</div>
            </div>

            <div className="my-1.5 border-b border-dashed border-gray-300" />

            <table className="w-full table-fixed border-collapse text-left text-[10px] leading-tight" aria-label="Receipt items">
              <thead><tr className="border-b border-dotted border-gray-400">
                <th className="w-[35%] py-1 pr-1">Name / Nakshathra</th><th className="w-[35%] py-1 pr-1">Pooja</th><th className="w-[10%] py-1 text-center">Qty</th><th className="w-[20%] py-1 text-right">Price</th>
              </tr></thead>
              <tbody>
                {(receipt.persons?.length
                  ? receipt.persons.flatMap(person => (person.items || []).map(item => ({ ...item, personName: person.name, starName: person.starName || '' })))
                  : (receipt.items || []).map(item => ({ ...item, personName: item.personName || receipt.devoteeName || 'Devotee', starName: item.starName || receipt.starName || '' }))
                ).map((item, index) => <tr key={index} className="align-top break-inside-avoid">
                  <td className="py-1 pr-1 break-words">{item.personName}{item.starName && <span className="text-[9px]"> ({item.starName})</span>}</td><td className="py-1 pr-1 break-words">{item.name}</td><td className="py-1 text-center">{item.qty}</td><td className="py-1 text-right whitespace-nowrap">{fmtINR(item.amount * item.qty)}</td>
                </tr>)}
              </tbody>
            </table>
            {receipt.remarks && <p className="mt-1 text-[9px]">Note: {receipt.remarks}</p>}

            {/* Repeating Nakshatra Dates Schedule */}
            {receipt.repeatDatesList && receipt.repeatDatesList.length > 0 && (
              <>
                <div className="my-1 border-b border-dashed border-gray-400" />
                <div className="text-[10px] font-black uppercase tracking-wide text-gray-800 mb-1">
                  Nakshatra Scheduled Dates ({receipt.repeatDatesList.length} Months):
                </div>
                <div className="grid gap-1 bg-gray-50 p-2 rounded border border-gray-200 text-[10px] font-mono text-gray-700">
                  {receipt.repeatDatesList.map((dStr, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-bold">M{idx + 1}:</span>
                      <span>{dStr}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="my-1.5 border-b border-dashed border-gray-400" />

            <div className="flex justify-between text-[10px] font-bold">
              <span>{receipt.paymentMethod || 'Cash'} / {receipt.paymentStatus || 'Paid'}</span>
              <span>Total: {fmtINR(receipt.total)}</span>
            </div>
            <div className="mt-2 flex items-start justify-between gap-3">
            <div aria-label="Receipt seal">
              <div className="max-w-[135px] rounded-full border-2 border-double border-gray-700 px-3 py-1 text-center text-[7px] font-bold uppercase leading-tight">
                <p className="break-words">{receipt.templeName}</p>
                <p className="text-[9px] tracking-widest">{receipt.paymentStatus === 'Unpaid' ? 'PAYMENT PENDING' : 'RECEIVED'}</p>
                <p>{receipt.date || receipt.bookingDate}</p>
              </div>
            </div>

            {/* Footer QR code and greetings */}
            <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
              <div className="bg-white">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=4&data=${encodeURIComponent(
                    `https://theertha-theta.vercel.app/receipt/verify?r=${encodeURIComponent(receipt.receiptNo || '')}&n=${encodeURIComponent(receipt.devoteeName || '')}&s=${encodeURIComponent(receipt.starName || '')}&i=${encodeURIComponent(receipt.items?.[0]?.name ? `${receipt.items[0].name}${receipt.items.length > 1 ? ` +${receipt.items.length - 1} more` : ''}` : 'Pooja Offering')}&a=${encodeURIComponent(receipt.total || 0)}&dt=${encodeURIComponent(receipt.date || receipt.bookingDate || '')}&p=${encodeURIComponent(receipt.paymentStatus || 'Paid')}&m=${encodeURIComponent(receipt.mobile || '')}&t=${encodeURIComponent(receipt.templeName || 'Devaswom Temple')}&templeId=${encodeURIComponent(receipt.templeId || '')}&receiptId=${encodeURIComponent(receipt.id || '')}`
                  )}`}
                  alt="Receipt QR Code"
                  className="h-[48px] w-[48px] object-contain"
                />
              </div>

              <p className="text-[7px] text-gray-500">Scan to verify</p>
            </div>
            </div>
          </div>

          {/* RIGHT: Actions side deck (no-print) */}
          <div className="no-print w-full max-w-sm flex-col gap-5 flex">

            {/* Action Card */}
            <div className="rounded-xl border border-[#D4A017]/18 bg-[#0B1F3A] p-6 shadow-xl">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#F7D77C]">
                Receipt Actions
              </h3>

              <div className="grid gap-3">
                {/* Print button */}
                <button
                  onClick={handlePrint}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#D4A017] py-3 text-sm font-bold text-[#07172D] shadow-[0_4px_12px_rgba(212,160,23,0.3)] transition hover:bg-[#F7D77C]"
                >
                  <Printer size={16} />
                  Print Receipt
                </button>

                {/* WhatsApp button */}
                <button
                  onClick={handleWhatsappShare}
                  disabled={sendingWhatsapp}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  <MessageCircle size={16} />
                  {sendingWhatsapp ? 'Sharing via WhatsApp…' : 'Share on WhatsApp'}
                </button>

                {/* SMS button */}
                <button
                  onClick={handleSmsShare}
                  disabled={sendingSms}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  <Smartphone size={16} />
                  {sendingSms ? 'Sending SMS Receipt…' : 'Share via SMS'}
                </button>

                {/* PDF export */}
                <button
                  onClick={handlePrint}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/20 py-3 text-sm font-bold text-white hover:bg-white/5"
                >
                  <FileDown size={16} />
                  Download PDF
                </button>
              </div>

              {/* Status and notification summary */}
              {devoteeMobile && (
                <div className="mt-4 rounded-lg bg-[#071828] p-3 text-[11px] font-semibold text-[#EFE6D3]/60 leading-relaxed">
                  📢 <span className="text-[#F7D77C]">Quick Tip:</span> Direct shares pre-fill with mobile <strong className="text-white">+91 {devoteeMobile}</strong> automatically.
                </div>
              )}
            </div>

            {/* Next Step Navigation Card */}
            <div className="rounded-xl border border-white/10 bg-[#0B1F3A]/60 p-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#EFE6D3]/45">
                Next Steps
              </h3>
              <p className="mb-4 text-xs font-semibold text-[#EFE6D3]/70">
                Ready to collect the next offering? Click below to return to the billing desk.
              </p>
              <button
                onClick={handleNewReceipt}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                + New Receipt Entry
              </button>
            </div>

          </div>

        </div>
      </main>

    </div>
  )
}
