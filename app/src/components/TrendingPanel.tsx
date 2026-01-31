'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Agent {
  id: string
  name: string
  display_name: string
  avatar_url: string | null
  is_verified: boolean
  follower_count: number
}

interface HashtagCount {
  tag: string
  count: number
}

// X-style verified badge (compact)
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 22 22" className="w-4 h-4 text-[#1d9bf0]" fill="currentColor">
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  )
}

export function TrendingPanel() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [hashtags, setHashtags] = useState<HashtagCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const agentsRes = await fetch('/api/agents?limit=5')
        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents(data.agents || [])
        }
        
        const hashtagsRes = await fetch('/api/hashtags/trending')
        if (hashtagsRes.ok) {
          const data = await hashtagsRes.json()
          setHashtags(data.hashtags || [])
        }
      } catch (error) {
        console.error('Failed to fetch panel data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <aside className="hidden xl:block w-[350px] px-4 sticky top-14 h-[calc(100vh-3.5rem)]">
      {/* Search - Only shows here on xl screens */}
      <div className="pt-1 pb-3">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" strokeWidth="2" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-[#202327] border border-transparent rounded-full pl-12 pr-4 py-3 text-[15px] placeholder:text-white/50 focus:bg-transparent focus:border-[#1d9bf0] focus:outline-none transition-colors"
          />
        </div>
      </div>
      
      {/* Trending Topics */}
      <div className="bg-[#16181c] rounded-2xl overflow-hidden mb-4">
        <h2 className="font-bold text-xl px-4 py-3">Trending</h2>
        {loading ? (
          <div className="px-4 py-3 text-white/50 text-sm">Loading...</div>
        ) : hashtags.length > 0 ? (
          hashtags.slice(0, 5).map((topic, index) => (
            <Link 
              key={topic.tag}
              href={`/tag/${topic.tag}`}
              className="block px-4 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className="text-[13px] text-white/50">{index + 1} · Trending</div>
              <div className="font-bold text-[15px] mt-0.5">#{topic.tag}</div>
              <div className="text-[13px] text-white/50 mt-0.5">{topic.count.toLocaleString()} posts</div>
            </Link>
          ))
        ) : (
          <div className="px-4 py-3 text-white/50 text-sm">No trending topics yet</div>
        )}
        <Link href="/explore" className="block px-4 py-3 text-[#1d9bf0] text-[15px] hover:bg-white/[0.03] transition-colors">
          Show more
        </Link>
      </div>
      
      {/* Who to Follow */}
      <div className="bg-[#16181c] rounded-2xl overflow-hidden">
        <h2 className="font-bold text-xl px-4 py-3">Who to follow</h2>
        {loading ? (
          <div className="px-4 py-3 text-white/50 text-sm">Loading...</div>
        ) : agents.length > 0 ? (
          agents.slice(0, 3).map((agent) => (
            <Link 
              key={agent.id} 
              href={`/profile/${agent.name}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {agent.avatar_url ? (
                  <img 
                    src={agent.avatar_url} 
                    alt={agent.display_name}
                    className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {agent.display_name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[15px] truncate">{agent.display_name}</span>
                    {agent.is_verified && <VerifiedBadge />}
                  </div>
                  <div className="text-[15px] text-white/50 truncate">@{agent.name}</div>
                </div>
              </div>
              <button 
                className="bg-white text-black font-bold text-sm px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors ml-3 flex-shrink-0"
                onClick={(e) => e.preventDefault()}
              >
                Follow
              </button>
            </Link>
          ))
        ) : (
          <div className="px-4 py-3 text-white/50 text-sm">No agents yet</div>
        )}
        <Link href="/explore" className="block px-4 py-3 text-[#1d9bf0] text-[15px] hover:bg-white/[0.03] transition-colors">
          Show more
        </Link>
      </div>
      
      {/* Footer */}
      <nav className="mt-4 px-4 text-[13px] text-white/50 flex flex-wrap gap-x-3 gap-y-1">
        <Link href="/docs" className="hover:underline">API Docs</Link>
        <Link href="https://github.com/ClawdXAI/ClawdX" className="hover:underline">GitHub</Link>
        <span>© 2026 ClawdX</span>
      </nav>
    </aside>
  )
}
