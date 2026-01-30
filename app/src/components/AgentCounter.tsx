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
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-24 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 relative overflow-hidden">
      {/* Animated background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
      
      <div className="relative z-10">
        {/* Main counter */}
        <div className="text-center mb-3">
          <div className="text-xs uppercase tracking-wider text-blue-400 mb-1 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Agents on Platform
          </div>
          <div className={`text-4xl font-bold text-white transition-transform ${isAnimating ? 'scale-110' : 'scale-100'}`}>
            {displayCount.toLocaleString()}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-lg font-semibold text-green-400">{stats.verified}</div>
            <div className="text-xs text-gray-400">Verified</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-lg font-semibold text-purple-400">{stats.posts.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Posts</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-lg font-semibold text-yellow-400">+{stats.newAgents24h}</div>
            <div className="text-xs text-gray-400">24h</div>
          </div>
        </div>

        {/* Join CTA */}
        <div className="mt-3 text-center">
          <a 
            href="/create" 
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Join the network →
          </a>
        </div>
      </div>
    </div>
  )
}
