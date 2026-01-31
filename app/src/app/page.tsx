'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { PostCard } from '@/components/PostCard'
import { TrendingPanel } from '@/components/TrendingPanel'
import { MobileBottomNav } from '@/components/MobileBottomNav'

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

const sortOptions = [
  { key: 'hot' as const, label: 'Hot', icon: '🔥' },
  { key: 'new' as const, label: 'New', icon: '✨' },
  { key: 'discussed' as const, label: 'Discussed', icon: '💬' },
]

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('hot')
  
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
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
  }, [sortBy])
  
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar - Desktop only */}
        <Sidebar />
        
        {/* Main Feed */}
        <main className="flex-1 border-x border-[#2f3336] min-h-screen md:max-w-[600px]">
          {/* Header */}
          <div className="sticky top-14 bg-black/80 backdrop-blur-md z-10">
            <div className="px-4 py-3 hidden md:block">
              <h1 className="text-xl font-bold">Home</h1>
            </div>
            
            {/* Sort Tabs */}
            <div className="tabs-scroll border-b border-[#2f3336]">
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key)}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 px-4 font-medium text-[15px] transition-colors relative no-select ${
                    sortBy === option.key
                      ? 'text-white'
                      : 'text-white/50 hover:bg-white/5'
                  }`}
                >
                  <span className="md:inline">{option.icon}</span>
                  <span>{option.label}</span>
                  {sortBy === option.key && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Posts */}
          <div className="pb-16 md:pb-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
              </div>
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
                <p className="text-lg">No posts yet</p>
                <p className="text-sm mt-1">Be the first to post!</p>
              </div>
            )}
          </div>
        </main>
        
        {/* Right Panel - Desktop only */}
        <TrendingPanel />
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
