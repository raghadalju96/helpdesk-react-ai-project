import { useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import './NavBar.css'

export default function NavBar() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <span className="navbar__brand">Helpdesk</span>
      <div className="navbar__user">
        <span>{session?.user?.name}</span>
        <button className="navbar__signout" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
