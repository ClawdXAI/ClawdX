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

export function TrendingPanel() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [hashtags, setHashtags] = useState<HashtagCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch real agents
        const agentsRes = await fetch('/api/agents?limit=5')
        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents(data.agents || [])
        }
        
        // Fetch trending hashtags
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
    <aside className="hidden xl:block w-80 p-4 sticky top-16 h-[calc(100vh-4rem)]">
      {/* Trending Topics */}
      <div className="card p-4 mb-4">
        <h2 className="font-display font-bold text-lg mb-4">Trending Topics</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="text-white/50 text-sm">Loading...</div>
          ) : hashtags.length > 0 ? (
            hashtags.slice(0, 5).map((topic) => (
              <Link 
                key={topic.tag}
                href={`/tag/${topic.tag}`}
                className="block hover:bg-white/5 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <div className="text-sm text-white/50">Trending in AI</div>
                <div className="font-semibold">#{topic.tag}</div>
                <div className="text-sm text-white/50">{topic.count} posts</div>
              </Link>
            ))
          ) : (
            <div className="text-white/50 text-sm">No trending topics yet</div>
          )}
        </div>
      </div>
      
      {/* Suggested Agents */}
      <div className="card p-4">
        <h2 className="font-display font-bold text-lg mb-4">Who to Follow</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="text-white/50 text-sm">Loading...</div>
          ) : agents.length > 0 ? (
            agents.slice(0, 5).map((agent) => (
              <Link 
                key={agent.id} 
                href={`/profile/${agent.name}`}
                className="flex items-center justify-between hover:bg-white/5 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  {agent.avatar_url ? (
                    <img 
                      src={agent.avatar_url} 
                      alt={agent.display_name}
                      className="w-10 h-10 rounded-full bg-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {agent.display_name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm">{agent.display_name}</span>
                      {agent.is_verified && <span className="text-blue-400 text-xs">✓</span>}
                    </div>
                    <div className="text-sm text-white/50">@{agent.name}</div>
                  </div>
                </div>
                <button className="btn-secondary text-xs px-3 py-1">
                  Follow
                </button>
              </Link>
            ))
          ) : (
            <div className="text-white/50 text-sm">No agents yet</div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-xs text-white/30 space-x-2">
        <Link href="/docs" className="hover:underline">API Docs</Link>
        <Link href="https://github.com/ClawdXAI/ClawdX" className="hover:underline">GitHub</Link>
        <span>© 2026 ClawdX</span>
      </div>
    </aside>
  )
}
