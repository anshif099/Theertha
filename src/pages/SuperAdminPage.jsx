import { useEffect, useMemo, useState } from 'react'
import AdminLogin from '../components/admin/AdminLogin.jsx'
import SuperAdminShell from '../components/admin/SuperAdminShell.jsx'
import TempleStats from '../components/admin/TempleStats.jsx'
import TempleTable from '../components/admin/TempleTable.jsx'
import {
  endAdminSession,
  hasAdminSession,
  startAdminSession,
  verifyAdminLogin,
} from '../lib/adminSession.js'
import {
  deleteTemple,
  loadRegisteredTemples,
  loadTemples,
} from '../lib/templeStore.js'

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminSession)
  const [temples, setTemples] = useState(loadTemples)
  const [search, setSearch] = useState('')
  const [loginError, setLoginError] = useState('')
  const [templeError, setTempleError] = useState('')
  const [isLoadingTemples, setIsLoadingTemples] = useState(hasAdminSession)

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    let isActive = true

    loadRegisteredTemples()
      .then((registeredTemples) => {
        if (isActive) {
          setTemples(registeredTemples)
          setTempleError('')
        }
      })
      .catch((error) => {
        console.warn('Unable to sync temples:', error)
        if (isActive) {
          setTempleError('Unable to sync temples from Realtime Database.')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingTemples(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isAuthenticated])

  const filteredTemples = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return temples
    }

    return temples.filter((temple) =>
      [
        temple.name,
        temple.deity,
        temple.district,
        temple.loginId,
        temple.status,
        temple.plan,
        temple.contact,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [search, temples])

  function handleLogin(credentials) {
    if (!verifyAdminLogin(credentials)) {
      setLoginError('Invalid super admin username or password.')
      return
    }

    startAdminSession()
    setLoginError('')
    setIsLoadingTemples(true)
    setIsAuthenticated(true)
  }

  function handleLogout() {
    endAdminSession()
    setIsAuthenticated(false)
  }

  async function handleDeleteTemple(templeId) {
    const previousTemples = temples
    setTemples((currentTemples) =>
      currentTemples.filter((temple) => temple.id !== templeId),
    )

    try {
      const nextTemples = await deleteTemple(templeId)
      setTemples(nextTemples)
      setTempleError('')
    } catch (error) {
      console.warn('Unable to delete temple:', error)
      setTemples(previousTemples)
      setTempleError('Temple could not be deleted from Realtime Database.')
    }
  }

  function handleEditTemple(temple) {
    window.location.href = `/superadmin/temples/${temple.id}/edit`
  }

  if (!isAuthenticated) {
    return <AdminLogin error={loginError} onLogin={handleLogin} />
  }

  return (
    <SuperAdminShell onLogout={handleLogout}>
      <div className="space-y-6">
        {templeError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {templeError}
          </p>
        ) : null}
        {isLoadingTemples ? (
          <p className="rounded-md border border-[#D4A017]/22 bg-white px-4 py-3 text-sm font-semibold text-[#42516A]">
            Syncing registered temples from Realtime Database...
          </p>
        ) : null}
        <TempleStats temples={temples} />
        <TempleTable
          search={search}
          temples={filteredTemples}
          onDelete={handleDeleteTemple}
          onEdit={handleEditTemple}
          onSearchChange={setSearch}
        />
      </div>
    </SuperAdminShell>
  )
}
