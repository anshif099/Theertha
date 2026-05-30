import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, ReceiptText, ShieldCheck, Landmark, Download, Printer } from 'lucide-react'
import { loadSingleReceipt } from '../lib/settingsStore.js'

function fmtINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

export default function CounterReceiptVerifyPage() {
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const templeId = params.get('templeId')
    const date = params.get('date')
    const receiptId = params.get('receiptId')

    if (!templeId || !date || !receiptId) {
      setError('Invalid or incomplete verification link. Please scan a valid receipt QR code.')
      setLoading(false)
      return
    }

    loadSingleReceipt(templeId, date, receiptId)
      .then((data) => {
        if (data) {
          setReceipt(data)
        } else {
          setError('Receipt record not found in database. Please verify the authenticity of the receipt.')
        }
      })
      .catch((err) => {
        console.error('Failed to load receipt:', err)
        setError('Network error while verifying receipt. Please try again.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <main className="temple-hero-bg relative flex min-h-screen items-center justify-center p-4 text-[#F8F6F0]">
      
      {/* Background silhouettes */}
      <div className="temple-silhouette" aria-hidden="true" />

      <section className="relative z-10 w-full max-w-lg rounded-2xl border border-[#D4A017]/25 bg-[#07172D]/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        
        {/* Verification Status Badge */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4A017]/30 opacity-75"></span>
              <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A017]/20 text-[#F7D77C]">
                <ReceiptText size={20} />
              </span>
            </span>
            <p className="mt-4 text-sm font-semibold text-[#EFE6D3]/60">Verifying Official Receipt record…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle size={28} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-red-200">Verification Failed</h1>
            <p className="mt-2 text-xs leading-relaxed text-red-200/70 max-w-sm">
              {error}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header: Verified check */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-white/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={32} />
              </div>
              <h1 className="mt-3 text-xl font-black text-emerald-400 tracking-wide uppercase">Official Receipt Verified</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#EFE6D3]/40 mt-1 font-bold">THEERTHA Public Verification</p>
            </div>

            {/* Temple info card */}
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 border border-white/5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4A017]/10 text-[#F7D77C] border border-[#D4A017]/20">
                <Landmark size={18} />
              </span>
              <div>
                <h2 className="text-sm font-extrabold uppercase text-[#F8F6F0]">{receipt.templeName}</h2>
                <p className="text-[11px] font-semibold text-[#EFE6D3]/50">
                  {receipt.templeDistrict ? `${receipt.templeDistrict} District` : 'Devaswom Board'}
                  {receipt.templeContact ? ` · Tel: ${receipt.templeContact}` : ''}
                </p>
              </div>
            </div>

            {/* Receipt details list */}
            <div className="rounded-xl border border-white/5 bg-[#0B1F3A]/40 p-4 space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#EFE6D3]/50">Receipt Number:</span>
                <span className="font-mono text-[#F7D77C] font-black">{receipt.receiptNo}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#EFE6D3]/50">Issued At:</span>
                <span className="text-white">{receipt.date} · {receipt.time}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#EFE6D3]/50">Counter Name:</span>
                <span className="text-white">Counter #{receipt.counterNo} ({receipt.counterName})</span>
              </div>

              <div className="border-t border-white/5 my-3" />

              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#EFE6D3]/50">Devotee Name:</span>
                <span className="text-white font-extrabold">{receipt.devoteeName || '—'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#EFE6D3]/50">Star (Nakshatra):</span>
                <span className="text-white font-extrabold">{receipt.starName || '—'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#EFE6D3]/50">Devotee Mobile:</span>
                <span className="text-white font-mono">{receipt.mobile ? `+91 ${receipt.mobile}` : '—'}</span>
              </div>
              {receipt.remarks && (
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#EFE6D3]/50">Remarks:</span>
                  <span className="text-white italic text-[11px]">{receipt.remarks}</span>
                </div>
              )}
            </div>

            {/* Offerings table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A017]/70">Offerings List</h3>
              <div className="rounded-xl border border-white/5 overflow-hidden bg-white/2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/4 font-bold text-[#EFE6D3]/60 text-[10px] uppercase">
                      <th className="px-4 py-2.5">Item / Seva</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#F8F6F0]/90">
                    {receipt.items && receipt.items.map((item, idx) => (
                      <tr key={idx} className="font-semibold">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3 text-center">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-[#F7D77C]">{fmtINR(item.amount * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment footer */}
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#EFE6D3]/40">Payment Status</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">Paid via {receipt.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-[#EFE6D3]/40">Total Amount</p>
                <p className="text-lg font-black text-[#F7D77C]">{fmtINR(receipt.total)}</p>
              </div>
            </div>
            {/* Download/Print Action Section */}
            <div className="no-print flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#D4A017]/35 bg-[#D4A017]/10 hover:bg-[#D4A017]/20 px-4 py-3 text-sm font-extrabold text-[#F7D77C] transition cursor-pointer"
              >
                <Printer size={16} />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#D4A017] hover:bg-[#F7D77C] px-4 py-3 text-sm font-extrabold text-[#07172D] transition shadow-md shadow-[#D4A017]/20 cursor-pointer"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>

            {/* Computer generated disclaimer */}
            <p className="text-center text-[10px] text-[#EFE6D3]/30 leading-relaxed font-semibold">
              This is a secure, digital pooja receipt verified on the <strong>THEERTHA Platform</strong> database. No physical signatures are required.
            </p>

            {/* Custom Print Stylesheet for High Fidelity Outputs */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                /* Hide backdrop elements and action buttons */
                body {
                  background: white !important;
                  color: black !important;
                }
                .temple-silhouette, .no-print {
                  display: none !important;
                }
                main {
                  background: transparent !important;
                  padding: 0 !important;
                  min-height: auto !important;
                }
                section {
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                  max-width: 100% !important;
                  width: 100% !important;
                  padding: 0 !important;
                }
                /* Typography colour corrections for print readability */
                .text-white, .text-\\[\\#F8F6F0\\]\\/90 {
                  color: #0b1f3a !important;
                }
                .text-\\[\\#EFE6D3\\]\\/50, .text-\\[\\#EFE6D3\\]\\/40, .text-\\[\\#EFE6D3\\]\\/60, .text-\\[\\#EFE6D3\\]\\/30 {
                  color: #42516a !important;
                }
                .text-\\[\\#F7D77C\\] {
                  color: #9c7414 !important;
                }
                .text-emerald-400 {
                  color: #11875d !important;
                }
                /* Visual box backgrounds and borders */
                .bg-white\\/5, .bg-\\[\\#0B1F3A\\]\\/40, .bg-white\\/2, .bg-white\\/4, .bg-emerald-500\\/5 {
                  background-color: #f8f6f0 !important;
                  border-color: #efe6d3 !important;
                  color: #0b1f3a !important;
                }
                .border-white\\/5, .border-emerald-500\\/10 {
                  border-color: #efe6d3 !important;
                }
                .divide-white\\/5 > * + * {
                  border-color: #efe6d3 !important;
                }
              }
            ` }} />

          </div>
        )}
      </section>
    </main>
  )
}
