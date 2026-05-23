import { useEffect, useState } from 'react'
import AdminLogin from '../components/admin/AdminLogin.jsx'
import SuperAdminShell from '../components/admin/SuperAdminShell.jsx'
import TempleForm from '../components/admin/TempleForm.jsx'
import {
  endAdminSession,
  hasAdminSession,
  startAdminSession,
  verifyAdminLogin,
} from '../lib/adminSession.js'
import {
  getRegisteredTemple,
  getTemple,
  saveTemple,
} from '../lib/templeStore.js'

function getRouteState() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const templeId = parts[2] === 'new' ? null : parts[2]

  return {
    isEdit: Boolean(templeId && parts[3] === 'edit'),
    templeId,
  }
}

export default function TempleRegistrationPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminSession)
  const [loginError, setLoginError] = useState('')
  const routeState = getRouteState()
  const [editingTemple, setEditingTemple] = useState(() =>
    routeState.isEdit ? getTemple(routeState.templeId) : null,
  )
  const [isLoadingTemple, setIsLoadingTemple] = useState(routeState.isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!routeState.isEdit) {
      return undefined
    }

    let isActive = true

    getRegisteredTemple(routeState.templeId)
      .then((temple) => {
        if (isActive) {
          setEditingTemple(temple)
        }
      })
      .catch((error) => {
        console.warn('Unable to load temple for editing:', error)
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingTemple(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [routeState.isEdit, routeState.templeId])

  function handleLogin(credentials) {
    if (!verifyAdminLogin(credentials)) {
      setLoginError('Invalid super admin username or password.')
      return
    }

    startAdminSession()
    setLoginError('')
    setIsAuthenticated(true)
  }

  function handleLogout() {
    endAdminSession()
    setIsAuthenticated(false)
  }

  async function handleSaveTemple(temple) {
    setIsSaving(true)
    setSaveError('')

    try {
      await saveTemple(temple)
      window.location.href = '/superadmin'
    } catch (error) {
      console.warn('Unable to save temple:', error)
      setSaveError('Temple could not be saved to Realtime Database.')
      setIsSaving(false)
    }
  }

  if (!isAuthenticated) {
    return <AdminLogin error={loginError} onLogin={handleLogin} />
  }

  if (routeState.isEdit && isLoadingTemple) {
    return (
      <SuperAdminShell onLogout={handleLogout}>
        <section className="rounded-lg border border-[#D4A017]/18 bg-white p-8 text-center shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
          <p className="text-sm font-semibold uppercase text-[#9C7414]">
            Loading Temple
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold">
            Syncing temple record
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#42516A]">
            Fetching the registered temple from Realtime Database.
          </p>
        </section>
      </SuperAdminShell>
    )
  }

  if (routeState.isEdit && !editingTemple) {
    return (
      <SuperAdminShell onLogout={handleLogout}>
        <section className="rounded-lg border border-[#D4A017]/18 bg-white p-8 text-center shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
          <p className="text-sm font-semibold uppercase text-[#9C7414]">
            Temple Not Found
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold">
            This temple record is unavailable
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#42516A]">
            The temple may have been deleted or the edit link may be outdated.
          </p>
          <a
            href="/superadmin"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-md bg-[#0B1F3A] px-5 py-3 font-semibold text-[#F8F6F0] transition hover:bg-[#123761]"
          >
            Back to Dashboard
          </a>
        </section>
      </SuperAdminShell>
    )
  }

  return (
    <SuperAdminShell onLogout={handleLogout}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#9C7414]">
              {editingTemple ? 'Edit Temple' : 'Register Temple'}
            </p>
            <h1 className="font-display mt-2 text-4xl font-semibold">
              {editingTemple ? editingTemple.name : 'New Temple Registration'}
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#42516A]">
              Add temple identity, randomly generated login ID, plan, contact,
              status, and administration notes in a focused registration page.
            </p>
          </div>
          <a
            href="/superadmin"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#D4A017]/32 px-4 py-2 text-sm font-semibold text-[#0B1F3A] transition hover:bg-[#D4A017]/12"
          >
            Back
          </a>
        </div>
        <TempleForm
          key={editingTemple?.id || 'new-temple'}
          editingTemple={editingTemple}
          isSaving={isSaving}
          onCancel={() => {
            window.location.href = '/superadmin'
          }}
          onSave={handleSaveTemple}
          saveError={saveError}
        />
      </div>
    </SuperAdminShell>
  )
}
