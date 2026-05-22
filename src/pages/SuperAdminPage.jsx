import { useMemo, useState } from 'react'
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
import { deleteTemple, loadTemples } from '../lib/templeStore.js'

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminSession)
  const [temples, setTemples] = useState(loadTemples)
  const [search, setSearch] = useState('')
  const [loginError, setLoginError] = useState('')

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
    setIsAuthenticated(true)
  }

  function handleLogout() {
    endAdminSession()
    setIsAuthenticated(false)
  }

  function handleDeleteTemple(templeId) {
    setTemples(deleteTemple(templeId))
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
