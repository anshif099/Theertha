import HomePage from './pages/HomePage.jsx'
import SuperAdminPage from './pages/SuperAdminPage.jsx'
import TempleRegistrationPage from './pages/TempleRegistrationPage.jsx'

function App() {
  if (window.location.pathname.startsWith('/superadmin/temples')) {
    return <TempleRegistrationPage />
  }

  if (window.location.pathname === '/superadmin') {
    return <SuperAdminPage />
  }

  return <HomePage />
}

export default App
