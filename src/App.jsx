import HomePage from './pages/HomePage.jsx'
import SuperAdminPage from './pages/SuperAdminPage.jsx'
import TempleDashboardPage from './pages/TempleDashboardPage.jsx'
import TempleLoginPage from './pages/TempleLoginPage.jsx'
import TempleRegistrationPage from './pages/TempleRegistrationPage.jsx'

function App() {
  if (window.location.pathname.startsWith('/superadmin/temples')) {
    return <TempleRegistrationPage />
  }

  if (window.location.pathname === '/superadmin') {
    return <SuperAdminPage />
  }

  if (window.location.pathname === '/temple-login') {
    return <TempleLoginPage />
  }

  if (window.location.pathname.startsWith('/temple')) {
    return <TempleDashboardPage />
  }

  return <HomePage />
}

export default App
