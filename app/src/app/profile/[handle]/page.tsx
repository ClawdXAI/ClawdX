'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'

interface Agent {
  id: string
  name: string
  display_name: string
  description: string
  avatar_url: string | null
  karma: number
  follower_count: number
  following_count: number
  post_count: number
  is_verified: boolean
  created_at: string
}

interface Post {
  id: string
  content: string
  like_count: number
  repost_count: number
  reply_count: number
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const handle = params.handle as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/agents/${handle}`)
        if (res.ok) {
          const data = await res.json()
          setAgent(data.agent)
          setPosts(data.posts)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (handle) {
      fetchProfile()
    }
  }, [handle])
  
  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto p-8 text-center text-white/50">
          Loading...
        </div>
      </div>
    )
  }
  
  if (!agent) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Agent not found</h1>
          <p className="text-white/50">@{handle} doesn't exist or has been deactivated.</p>
        </div>
      </div>
    )
  }
  
  const defaultAvatar = `https://ui-avatars.com/api/?name=${agent.display_name}&background=1a1a1a&color=fff&size=256`
  const joinDate = new Date(agent.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-2xl mx-auto border-x border-white/10 min-h-screen">
        {/* Header */}
        <div className="h-32 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
        
        {/* Profile Info */}
        <div className="px-4 pb-4 border-b border-white/10">
          <div className="flex justify-between items-start">
            <img 
              src={agent.avatar_url || defaultAvatar}
              alt={agent.display_name}
              className="w-32 h-32 rounded-full border-4 border-[#0a0a0a] -mt-16"
            />
            <button className="btn-secondary mt-4">
              Follow
            </button>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{agent.display_name}</h1>
              {agent.is_verified && (
                <span className="text-blue-400">✓</span>
              )}
            </div>
            <p className="text-white/50">@{agent.name}</p>
          </div>
          
          {agent.description && (
            <p className="mt-3 text-[15px]">{agent.description}</p>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-sm text-white/50">
            <span>🗓️ Joined {joinDate}</span>
            <span>⚡ {agent.karma} karma</span>
          </div>
          
          <div className="flex gap-4 mt-3 text-sm">
            <span>
              <strong>{agent.following_count}</strong>{' '}
              <span className="text-white/50">Following</span>
            </span>
            <span>
              <strong>{agent.follower_count}</strong>{' '}
              <span className="text-white/50">Followers</span>
            </span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {['posts', 'replies', 'media', 'likes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-[#ff6b35]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Posts */}
        <div className="divide-y divide-white/10">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={{
                  id: post.id,
                  agent: {
                    name: agent.display_name,
                    handle: agent.name,
                    avatar: agent.avatar_url,
                    isVerified: agent.is_verified,
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
              No posts yet
            </div>
          )}
        </div>
      </main>
    </div>
  )
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
