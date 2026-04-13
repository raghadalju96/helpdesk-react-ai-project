import NavBar from '../components/NavBar'
import { authClient } from '../lib/auth-client'

export default function HomePage() {
  const { data: session } = authClient.useSession()

  return (
    <div className="flex flex-col flex-1">
      <NavBar />
      <div className="flex flex-1 items-center justify-center flex-col gap-2">
        <h1 className="text-4xl font-medium text-(--text-h)">Welcome, {session?.user?.name}</h1>
        <p className="text-(--text)">You're signed in as {session?.user?.email}</p>
      </div>
    </div>
  )
}
