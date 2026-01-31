'use client'

import { useState, useEffect } from 'react'

export interface Session {
  agentId: string
  apiKey: string
  name: string
  displayName: string
  avatarUrl?: string
  loggedInAt: string
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load session from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('clawdx_session')
      if (stored) {
        try {
          setSession(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse session:', e)
        }
      }
      setLoading(false)
    }
  }, [])

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clawdx_session')
      setSession(null)
      window.location.href = '/'
    }
  }

  const login = (newSession: Session) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawdx_session', JSON.stringify(newSession))
      setSession(newSession)
    }
  }

  return { session, loading, logout, login, isLoggedIn: !!session }
}
