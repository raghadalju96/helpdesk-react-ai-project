import NavBar from '../components/NavBar'
import { authClient } from '../lib/auth-client'
import './HomePage.css'

export default function HomePage() {
  const { data: session } = authClient.useSession()

  return (
    <div className="home-page">
      <NavBar />
      <div className="home-content">
        <h1>Welcome, {session?.user?.name}</h1>
        <p>You're signed in as {session?.user?.email}</p>
      </div>
    </div>
  )
}
