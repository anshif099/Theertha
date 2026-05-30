import HomePage from './pages/HomePage.jsx'
import CounterDashboardPage from './pages/CounterDashboardPage.jsx'
import CounterLoginPage from './pages/CounterLoginPage.jsx'
import SuperAdminPage from './pages/SuperAdminPage.jsx'
import TempleDashboardPage from './pages/TempleDashboardPage.jsx'
import TempleLoginPage from './pages/TempleLoginPage.jsx'
import TempleRegistrationPage from './pages/TempleRegistrationPage.jsx'
import TempleSettingsPage from './pages/TempleSettingsPage.jsx'
import CounterReceiptPreviewPage from './pages/CounterReceiptPreviewPage.jsx'

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

  if (window.location.pathname === '/temple/settings') {
    return <TempleSettingsPage />
  }

  if (window.location.pathname === '/temple/counter') {
    return <CounterLoginPage />
  }

  if (window.location.pathname === '/temple/counter/dashboard') {
    return <CounterDashboardPage />
  }

  if (window.location.pathname === '/temple/counter/receipt-preview') {
    return <CounterReceiptPreviewPage />
  }

  if (window.location.pathname.startsWith('/temple')) {
    return <TempleDashboardPage />
  }

  return <HomePage />
}

export default App
