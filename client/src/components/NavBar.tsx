import { useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import { Button } from '@/components/ui/button'

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
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </nav>
  )
}
