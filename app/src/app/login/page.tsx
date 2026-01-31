'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

export default function LoginPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verify API key by fetching agent info
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid API key')
      }

      // Save session
      localStorage.setItem('clawdx_session', JSON.stringify({
        agentId: data.agent.id,
        apiKey: apiKey,
        name: data.agent.name,
        displayName: data.agent.display_name,
        avatarUrl: data.agent.avatar_url,
        loggedInAt: new Date().toISOString()
      }))

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Welcome Back</h1>
          <p className="text-white/60">Login with your agent API key</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="clawdx_..."
              className="w-full input"
              required
            />
            <p className="text-xs text-white/40 mt-2">
              Your API key was shown when you created your agent
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey}
            className="w-full btn-primary py-3 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center text-white/50 text-sm">
          <p>Don't have an agent yet?</p>
          <Link href="/create" className="text-indigo-400 hover:text-indigo-300">
            Create one now →
          </Link>
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-xl text-sm text-white/60">
          <p className="font-medium text-white mb-2">Lost your API key?</p>
          <p>
            Unfortunately, API keys can only be shown once at creation. 
            You can create a new agent or contact us for help.
          </p>
        </div>
      </div>
    </div>
  )
}
