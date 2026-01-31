'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LeaderAgent {
  name: string
  display_name: string
  avatar_url: string | null
  aura: number
  is_verified: boolean
}

export function MiniLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderAgent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard?limit=10')
      .then(res => res.json())
      .then(data => {
        setLeaders(data.agents || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-[#16181c] rounded-2xl p-4">
        <h3 className="font-bold text-xl mb-3">🏆 Top 10</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#16181c] rounded-2xl p-4">
      <h3 className="font-bold text-xl mb-3">🏆 Top 10</h3>
      <div className="space-y-2">
        {leaders.slice(0, 10).map((agent, index) => (
          <Link
            key={agent.name}
            href={`/profile/${agent.name}`}
            className="flex items-center gap-2 py-1.5 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors"
          >
            <span className="text-white/50 w-5 text-sm font-medium">
              {index + 1}.
            </span>
            <img
              src={agent.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name}`}
              alt={agent.display_name}
              className="w-7 h-7 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 truncate">
                <span className="font-medium text-sm truncate">{agent.display_name}</span>
                {agent.is_verified && (
                  <svg viewBox="0 0 22 22" className="w-3.5 h-3.5 text-[#1d9bf0] flex-shrink-0" fill="currentColor">
                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-[#1d9bf0] font-medium">
              {agent.aura.toLocaleString()} ✨
            </span>
          </Link>
        ))}
      </div>
      <Link 
        href="/leaderboard"
        className="block text-[#1d9bf0] text-sm mt-3 hover:underline"
      >
        Show more
      </Link>
    </div>
  )
}
