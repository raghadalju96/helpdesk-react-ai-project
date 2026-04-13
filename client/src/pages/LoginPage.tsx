import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authClient } from '../lib/auth-client'

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
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm p-10 border border-(--border) rounded-xl bg-(--bg) shadow-(--shadow)">
        <h1 className="text-3xl font-medium text-(--text-h) mt-0 mb-6">Sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5 mb-4">
            <label htmlFor="email" className="text-sm text-(--text)">Email</label>
            <input
              id="email"
              type="email"
              autoFocus
              className={`px-3.5 py-2.5 border rounded-md bg-(--bg) text-(--text-h) text-[15px] outline-none transition-colors duration-200 focus:border-(--accent) ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-(--border)'}`}
              {...register('email')}
            />
            {errors.email && <p className="text-red-500 text-sm m-0">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            <label htmlFor="password" className="text-sm text-(--text)">Password</label>
            <input
              id="password"
              type="password"
              className={`px-3.5 py-2.5 border rounded-md bg-(--bg) text-(--text-h) text-[15px] outline-none transition-colors duration-200 focus:border-(--accent) ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-(--border)'}`}
              {...register('password')}
            />
            {errors.password && <p className="text-red-500 text-sm m-0">{errors.password.message}</p>}
          </div>
          {serverError && <p className="text-red-500 text-sm mb-3 m-0">{serverError}</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-(--accent) text-white border-none rounded-md text-[15px] cursor-pointer transition-opacity duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
