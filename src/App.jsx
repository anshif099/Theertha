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
import TempleAssetsPage from './pages/TempleAssetsPage.jsx'
import TempleAssetRegisterPage from './pages/TempleAssetRegisterPage.jsx'
import UnderDevelopmentPage from './pages/UnderDevelopmentPage.jsx'
import TempleProfilePage from './pages/TempleProfilePage.jsx'
import TempleMembershipPage from './pages/TempleMembershipPage.jsx'
import TempleDevoteesPage from './pages/TempleDevoteesPage.jsx'
import TempleFixedDepositPage from './pages/TempleFixedDepositPage.jsx'
import TempleDailySchedulePage from './pages/TempleDailySchedulePage.jsx'
import TempleDonationPage from './pages/TempleDonationPage.jsx'


function App() {
  if (window.location.pathname === '/temple/donations') {
    return <TempleDonationPage />
  }
  if (window.location.pathname === '/temple/daily-schedule') {
    return <TempleDailySchedulePage />
  }
  if (window.location.pathname === '/temple/fixed-deposit') {
    return <TempleFixedDepositPage />
  }
  if (window.location.pathname === '/temple/devotees') {
    return <TempleDevoteesPage />
  }
  if (window.location.pathname === '/temple/membership') {
    return <TempleMembershipPage />
  }
  if (window.location.pathname === '/temple/profile') {
    return <TempleProfilePage />
  }
  if (window.location.pathname.startsWith('/superadmin/temples')) {
    return <TempleRegistrationPage />
  }

  if (window.location.pathname === '/superadmin') {
    return <SuperAdminPage />
  }

  if (window.location.pathname === '/temple-login') {
    return <TempleLoginPage />
  }

  if (window.location.pathname === '/temple/under-development') {
    return <UnderDevelopmentPage />
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

  if (window.location.pathname === '/temple/assets/register') {
    return <TempleAssetRegisterPage />
  }

  if (window.location.pathname === '/temple/assets') {
    return <TempleAssetsPage />
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

  if (window.location.pathname === '/temple/dashboard' || window.location.pathname === '/temple') {
    return <TempleDashboardPage />
  }

  return <HomePage />
}

export default App
