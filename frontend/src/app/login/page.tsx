'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

useEffect(() => {
  const rawToken = localStorage.getItem('jwt')
  const token = rawToken?.replace(/^"|"$/g, '')

  if (token) {
    try {
      const [, payloadBase64] = token.split('.')
      const payload = JSON.parse(atob(payloadBase64))
      const currentTime = Math.floor(Date.now() / 1000)

      if (payload.exp > currentTime) {
        // Token is valid → redirect to profile
        router.push('/profile')
      }
    } catch (err) {
      console.warn(err,'Invalid token format')
    }
  }
}, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    const encoded = btoa(`${identifier}:${password}`)

    if (identifier === '') {
      setErrorMessage('Please enter your username or email.')
      return
    }
    if (password === '') {
      setErrorMessage('Please enter your password.')
      return
    }

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_AUTH_API as string, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encoded}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        setErrorMessage('Invalid login. Please try again.')
        return
      }

      const raw = await response.text()
      localStorage.setItem('jwt', raw)
      router.push('/profile')
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage('Something went wrong. Please try again later.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-4">
      <div className="w-full max-w-md backdrop-blur-lg bg-white/30 shadow-2xl border border-white/30 rounded-3xl p-10 animate-fade-in">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 tracking-wide">Welcome Back ✨</h1>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 px-4 py-2 rounded-md border border-red-300">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
            <input
              type="text"
              placeholder="example@domain.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white/80 backdrop-blur-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white/80 backdrop-blur-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 hover:from-purple-600 hover:to-red-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
          >
            Log In
          </button>
        </form>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  )
}
