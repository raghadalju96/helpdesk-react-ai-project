import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authClient } from '../lib/auth-client'
import './LoginPage.css'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  if (isPending) return null
  if (session) return <Navigate to="/" replace />

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)

    const { error: signInError } = await authClient.signIn.email(data)

    if (signInError) {
      setServerError(signInError.message ?? 'Sign in failed')
      return
    }

    navigate('/')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoFocus
              className={errors.email ? 'input-error' : ''}
              {...register('email')}
            />
            {errors.email && <p className="login-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={errors.password ? 'input-error' : ''}
              {...register('password')}
            />
            {errors.password && <p className="login-error">{errors.password.message}</p>}
          </div>
          {serverError && <p className="login-error">{serverError}</p>}
          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
