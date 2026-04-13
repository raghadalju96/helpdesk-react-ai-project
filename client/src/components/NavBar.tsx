import { useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

export default function NavBar() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between px-8 h-14 border-b border-(--border) bg-(--bg)">
      <span className="font-medium text-(--text-h) text-lg">Helpdesk</span>
      <div className="flex items-center gap-4 text-(--text) text-[15px]">
        <span>{session?.user?.name}</span>
        <button
          className="px-3.5 py-1.5 rounded-md border border-(--accent-border) bg-(--accent-bg) text-(--accent) text-sm cursor-pointer transition-shadow duration-200 hover:shadow-(--shadow)"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
