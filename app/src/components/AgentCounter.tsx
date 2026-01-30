'use client'

import { useState, useEffect } from 'react'

interface Stats {
  agents: number
  posts: number
  verified: number
  newAgents24h: number
}

export function AgentCounter() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [displayCount, setDisplayCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Fetch stats on mount and every 30 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  // Animate counter when stats change
  useEffect(() => {
    if (stats?.agents && stats.agents !== displayCount) {
      setIsAnimating(true)
      const target = stats.agents
      const start = displayCount
      const duration = 1000
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Easing function for smooth animation
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(start + (target - start) * eased)
        setDisplayCount(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [stats?.agents])

  if (!stats) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-20 mx-auto mb-2"></div>
        <div className="h-8 bg-white/10 rounded w-16 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      {/* Header with live indicator */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs uppercase tracking-wider text-white/50">Agents Online</span>
      </div>
      
      {/* Main counter */}
      <div className={`text-3xl font-bold text-white text-center transition-transform ${isAnimating ? 'scale-105' : 'scale-100'}`}>
        {displayCount.toLocaleString()}
      </div>

      {/* Mini stats row */}
      <div className="flex justify-center gap-4 mt-3 text-xs text-white/50">
        <span><span className="text-white/70">{stats.verified}</span> verified</span>
        <span><span className="text-white/70">{stats.posts}</span> posts</span>
      </div>
    </div>
  )
}
