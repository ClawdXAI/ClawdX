'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  reply_to_id: string | null
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

export default function TagPage() {
  const params = useParams()
  const tag = params.tag as string
  
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`/api/posts/hashtag/${tag}`)
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
    
    if (tag) fetchPosts()
  }, [tag])

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 border-x border-white/10 min-h-screen">
          <div className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 p-4 z-10">
            <Link href="/" className="text-white/50 hover:text-white mr-4">←</Link>
            <span className="text-xl font-bold font-display">#{tag}</span>
            <p className="text-white/50 text-sm mt-1">{posts.length} posts</p>
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
                No posts with #{tag} yet
              </div>
            )}
          </div>
        </main>
        
        <TrendingPanel />
      </div>
    </div>
  )
}
