import HomePage from './pages/HomePage.jsx'
import CounterDashboardPage from './pages/CounterDashboardPage.jsx'
import CounterLoginPage from './pages/CounterLoginPage.jsx'
import CounterLedgerPage from './pages/CounterLedgerPage.jsx'
import { hasAdminSession } from './lib/adminSession.js'
import { getTempleSession } from './lib/templeSession.js'
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
import TempleAssetsPage from './pages/TempleAssetsPage.jsx'
import TempleAssetRegisterPage from './pages/TempleAssetRegisterPage.jsx'
import UnderDevelopmentPage from './pages/UnderDevelopmentPage.jsx'
import TempleProfilePage from './pages/TempleProfilePage.jsx'
import TempleMembershipPage from './pages/TempleMembershipPage.jsx'
import TempleDevoteesPage from './pages/TempleDevoteesPage.jsx'
import TempleFixedDepositPage from './pages/TempleFixedDepositPage.jsx'
import TempleDailySchedulePage from './pages/TempleDailySchedulePage.jsx'
import TempleDonationPage from './pages/TempleDonationPage.jsx'
import { getNormalizedPath } from './lib/router.js'

function App() {
  const path = getNormalizedPath()

  if (path === '/temple/donations') {
    return <TempleDonationPage />
  }
  if (path === '/temple/daily-schedule') {
    return <TempleDailySchedulePage />
  }
  if (path === '/temple/fixed-deposit') {
    return <TempleFixedDepositPage />
  }
  if (path === '/temple/devotees') {
    return <TempleDevoteesPage />
  }
  if (path === '/temple/membership') {
    return <TempleMembershipPage />
  }
  if (path === '/temple/profile') {
    return <TempleProfilePage />
  }
  if (path.startsWith('/superadmin/temples')) {
    return <TempleRegistrationPage />
  }

  if (path === '/superadmin') {
    return <SuperAdminPage />
  }

  if (path === '/temple-login') {
    return <TempleLoginPage />
  }

  if (path === '/temple/under-development') {
    return <UnderDevelopmentPage />
  }

  if (path === '/temple/settings') {
    return <TempleSettingsPage />
  }

  if (path === '/temple/billing') {
    return <TempleBillingPage />
  }

  if (path === '/temple/accounts') {
    return <TempleAccountsPage />
  }

  if (path === '/temple/nadavaravu') {
    return <TempleNadavaravuPage />
  }

  if (path === '/temple/booking') {
    return <TempleBookingPage />
  }

  if (path === '/temple/assets/register') {
    return <TempleAssetRegisterPage />
  }

  if (path === '/temple/assets') {
    return <TempleAssetsPage />
  }

  if (path === '/temple/counter') {
    return hasAdminSession() || getTempleSession() ? <CounterLedgerPage /> : <CounterLoginPage />
  }

  if (path === '/superadmin/counters') return <CounterLedgerPage superAdminOnly />
  if (path === '/temple/counter/login') return <CounterLoginPage />

  if (path === '/temple/counter/dashboard') {
    return <CounterDashboardPage />
  }

  if (path === '/temple/counter/receipt-preview') {
    return <CounterReceiptPreviewPage />
  }

  if (path === '/receipt/verify') {
    return <CounterReceiptVerifyPage />
  }

  if (path === '/temple/dashboard' || path === '/temple') {
    return <TempleDashboardPage />
  }

  return <HomePage />
}

export default App
