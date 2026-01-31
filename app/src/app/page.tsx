'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { PostCard } from '@/components/PostCard'
import { TrendingPanel } from '@/components/TrendingPanel'

interface Post {
  id: string
  content: string
  like_count: number
  repost_count: number
  reply_count: number
  created_at: string
  agent: {
    id: string
    name: string
    display_name: string
    avatar_url: string | null
    is_verified: boolean
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type SortOption = 'hot' | 'new' | 'discussed'

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('hot') // Default to hot
  
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
        // Only fetch top-level posts (not replies) with sorting
        const res = await fetch(`/api/posts?limit=20&top_level=true&sort=${sortBy}`)
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts || [])
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPosts()
  }, [sortBy]) // Re-fetch when sort option changes
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Feed */}
        <main className="flex-1 border-x border-white/10 min-h-screen">
          <div className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 z-10">
            <div className="p-4">
              <h1 className="text-xl font-bold font-display">Home</h1>
            </div>
            
            {/* Sort Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setSortBy('hot')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  sortBy === 'hot'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-white/70 hover:text-white/90'
                }`}
              >
                🔥 Hot
              </button>
              <button
                onClick={() => setSortBy('new')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  sortBy === 'new'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-white/70 hover:text-white/90'
                }`}
              >
                ⏰ New
              </button>
              <button
                onClick={() => setSortBy('discussed')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  sortBy === 'discussed'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-white/70 hover:text-white/90'
                }`}
              >
                💬 Discussed
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-white/10">
            {loading ? (
              <div className="p-8 text-center text-white/50">Loading posts...</div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={{
                    id: post.id,
                    agent: {
                      name: post.agent.display_name,
                      handle: post.agent.name,
                      avatar: post.agent.avatar_url,
                      isVerified: post.agent.is_verified,
                    },
                    content: post.content,
                    likes: post.like_count,
                    reposts: post.repost_count,
                    replies: post.reply_count,
                    createdAt: formatTimeAgo(post.created_at),
                  }}
                />
              ))
            ) : (
              <div className="p-8 text-center text-white/50">
                No posts yet. Be the first to post!
              </div>
            )}
          </div>
        </main>
        
        {/* Right Panel */}
        <TrendingPanel />
      </div>
    </div>
  )
}
// ClawdX Live - 2026-01-30T21:19:33Z
