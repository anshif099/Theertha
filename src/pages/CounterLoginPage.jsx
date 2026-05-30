import { useState } from 'react'
import { Hash, LogIn, ReceiptText } from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import FloatingParticles from '../components/FloatingParticles.jsx'
import { findCounterByLoginId } from '../lib/counterStore.js'

export default function CounterLoginPage() {
  const [loginId, setLoginId] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const result = await findCounterByLoginId(loginId)

      if (!result) {
        setError('No counter found with this Login ID. Please check and try again.')
        setIsSubmitting(false)
        return
      }

      /* Store counter session and redirect to counter dashboard */
      sessionStorage.setItem(
        'theertha-counter-session',
        JSON.stringify({
          counterId:   result.counter.id,
          counterName: result.counter.name,
          counterNo:   result.counter.number,
          loginId:     result.counter.loginId,
          templeId:    result.templeId,
          templeName:  result.templeName,
        }),
      )

      window.location.href = '/temple/counter/dashboard'
    } catch (err) {
      console.warn('Counter login failed:', err)
      setError('Unable to verify this Login ID right now. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="temple-hero-bg relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 text-[#F8F6F0]">
      <FloatingParticles />
      <div className="temple-silhouette" aria-hidden="true" />

      <section className="glass-card relative z-10 w-full max-w-md rounded-xl p-7 sm:p-9">
        {/* Logo */}
        <div className="flex justify-center">
          <BrandMark compact showText={false} />
        </div>

        {/* Heading */}
        <div className="mt-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4A017] text-[#07172D]">
            <ReceiptText size={24} aria-hidden="true" />
          </div>
          <h1 className="font-display mt-5 text-4xl font-semibold">
            Counter Login
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#EFE6D3]/76">
            Enter your counter Login ID to access the counter dashboard.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#F7D77C]">
              <Hash size={16} aria-hidden="true" />
              Counter Login ID
            </span>
            <input
              id="counter-login-id"
              name="loginId"
              type="text"
              value={loginId}
              onChange={(e) => {
                setLoginId(e.target.value.toUpperCase())
                setError('')
              }}
              className="mt-2 min-h-12 w-full rounded-lg border border-[#F8F6F0]/14 bg-white/10 px-4 font-mono tracking-wider text-[#F8F6F0] outline-none transition placeholder:text-[#EFE6D3]/40 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20"
              placeholder="CTR-SPT-ME01"
              autoComplete="off"
              autoFocus
              required
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-300/30 bg-red-500/12 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !loginId.trim()}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#D4A017] px-5 py-3 font-semibold text-[#07172D] shadow-[0_16px_48px_rgba(212,160,23,0.32)] transition hover:bg-[#F7D77C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} aria-hidden="true" />
            {isSubmitting ? 'Verifying…' : 'Open Counter Dashboard'}
          </button>
        </form>

        {/* Back link */}
        <p className="mt-6 text-center text-sm text-[#EFE6D3]/56">
          Not a counter operator?{' '}
          <a
            href="/temple-login"
            className="font-semibold text-[#F7D77C] transition hover:text-[#F8F6F0]"
          >
            Temple Login →
          </a>
        </p>
      </section>
    </main>
  )
}
