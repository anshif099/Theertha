import { useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import BrandMark from '../BrandMark.jsx'
import FloatingParticles from '../FloatingParticles.jsx'

export default function AdminLogin({ error, onLogin }) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  })

  function handleSubmit(event) {
    event.preventDefault()
    onLogin(credentials)
  }

  function updateField(event) {
    setCredentials((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
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
            Super Admin Login
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#EFE6D3]/76">
            Access THEERTHA temple management and platform controls.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-[#F7D77C]">
              Username
            </span>
            <input
              name="username"
              value={credentials.username}
              onChange={updateField}
              className="mt-2 min-h-12 w-full rounded-md border border-[#F8F6F0]/14 bg-white/10 px-4 text-[#F8F6F0] outline-none transition placeholder:text-[#EFE6D3]/42 focus:border-[#D4A017]"
              placeholder="superadmin"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#F7D77C]">
              Password
            </span>
            <input
              name="password"
              type="password"
              value={credentials.password}
              onChange={updateField}
              className="mt-2 min-h-12 w-full rounded-md border border-[#F8F6F0]/14 bg-white/10 px-4 text-[#F8F6F0] outline-none transition placeholder:text-[#EFE6D3]/42 focus:border-[#D4A017]"
              placeholder="Enter password"
              autoComplete="current-password"
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
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#D4A017] px-5 py-3 font-semibold text-[#07172D] shadow-[0_16px_48px_rgba(212,160,23,0.32)] transition hover:bg-[#F7D77C]"
          >
            <LockKeyhole size={18} aria-hidden="true" />
            Login to Dashboard
          </button>
        </form>
      </section>
    </main>
  )
}
