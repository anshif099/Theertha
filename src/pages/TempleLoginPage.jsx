import { useEffect, useState } from 'react'
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import FloatingParticles from '../components/FloatingParticles.jsx'
import { findTempleByLoginId } from '../lib/templeStore.js'
import { getTempleSession, startTempleSession } from '../lib/templeSession.js'

export default function TempleLoginPage() {
  const [loginId, setLoginId] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (getTempleSession()) {
      window.location.href = '/temple/dashboard'
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const temple = await findTempleByLoginId(loginId)

      if (!temple) {
        setError('No registered temple found for this login ID.')
        setIsSubmitting(false)
        return
      }

      startTempleSession(temple)
      window.location.href = '/temple/dashboard'
    } catch (lookupError) {
      console.warn('Temple login failed:', lookupError)
      setError('Unable to verify this login ID right now.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="temple-hero-bg relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 text-[#F8F6F0]">
      <FloatingParticles />
      <div className="temple-silhouette" aria-hidden="true" />
      <section className="glass-card relative z-10 w-full max-w-md rounded-lg p-7 sm:p-8">
        <div className="flex justify-center">
          <BrandMark compact showText={false} />
        </div>
        <div className="mt-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#D4A017] text-[#07172D]">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <h1 className="font-display mt-5 text-4xl font-semibold">
            Temple Login
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#EFE6D3]/76">
            Enter the login ID issued from the super admin temple registry.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#F7D77C]">
              <KeyRound size={16} aria-hidden="true" />
              Temple Login ID
            </span>
            <input
              name="loginId"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value.toUpperCase())}
              className="mt-2 min-h-12 w-full rounded-md border border-[#F8F6F0]/14 bg-white/10 px-4 font-mono text-[#F8F6F0] outline-none transition placeholder:text-[#EFE6D3]/42 focus:border-[#D4A017]"
              placeholder="THR-TVM-ABCD"
              autoComplete="off"
              required
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-300/30 bg-red-500/12 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#D4A017] px-5 py-3 font-semibold text-[#07172D] shadow-[0_16px_48px_rgba(212,160,23,0.32)] transition hover:bg-[#F7D77C] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn size={18} aria-hidden="true" />
            {isSubmitting ? 'Checking Login ID...' : 'Open Temple Dashboard'}
          </button>
        </form>
      </section>
    </main>
  )
}
