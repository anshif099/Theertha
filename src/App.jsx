import HomePage from './pages/HomePage.jsx'
import CounterDashboardPage from './pages/CounterDashboardPage.jsx'
import CounterLoginPage from './pages/CounterLoginPage.jsx'
import SuperAdminPage from './pages/SuperAdminPage.jsx'
import TempleDashboardPage from './pages/TempleDashboardPage.jsx'
import TempleLoginPage from './pages/TempleLoginPage.jsx'
import TempleRegistrationPage from './pages/TempleRegistrationPage.jsx'
import TempleSettingsPage from './pages/TempleSettingsPage.jsx'
import CounterReceiptPreviewPage from './pages/CounterReceiptPreviewPage.jsx'
import CounterReceiptVerifyPage from './pages/CounterReceiptVerifyPage.jsx'
import TempleBillingPage from './pages/TempleBillingPage.jsx'
import TempleAccountsPage from './pages/TempleAccountsPage.jsx'
import TempleNadavaravuPage from './pages/TempleNadavaravuPage.jsx'
import TempleBookingPage from './pages/TempleBookingPage.jsx'


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

  if (window.location.pathname === '/temple/billing') {
    return <TempleBillingPage />
  }

  if (window.location.pathname === '/temple/accounts') {
    return <TempleAccountsPage />
  }

  if (window.location.pathname === '/temple/nadavaravu') {
    return <TempleNadavaravuPage />
  }

  if (window.location.pathname === '/temple/booking') {
    return <TempleBookingPage />
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

  if (window.location.pathname === '/receipt/verify') {
    return <CounterReceiptVerifyPage />
  }

  if (window.location.pathname.startsWith('/temple')) {
    return <TempleDashboardPage />
  }

  return <HomePage />
}

export default App
