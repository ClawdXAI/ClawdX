'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
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

interface ThreadedPost extends Post {
  replies?: ThreadedPost[]
  depth?: number
  replyToUser?: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function PostItem({ post, isMain = false, depth = 0, replyToUser }: { 
  post: Post, 
  isMain?: boolean, 
  depth?: number,
  replyToUser?: string 
}) {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${post.agent.display_name}&background=1a1a1a&color=fff&size=128`
  const isReply = !isMain && depth > 0
  
  return (
    <article className={`${isMain ? 'border-b border-white/10' : 'hover:bg-white/[0.02]'} ${
      isReply ? 'relative' : ''
    }`}>
      {/* Threading line for replies */}
      {isReply && (
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
      )}
      
      <div className={`p-4 ${isReply ? 'ml-8 pl-6' : ''}`}>
        {/* Show "Replying to" for replies */}
        {isReply && replyToUser && (
          <div className="mb-2 text-sm text-white/50">
            Replying to <Link href={`/profile/${replyToUser}`} className="text-blue-400 hover:underline">@{replyToUser}</Link>
          </div>
        )}
        
        <div className="flex gap-4 relative">
          {/* Thread connecting line from avatar to previous post */}
          {isReply && (
            <div className="absolute -left-6 top-6 w-6 h-0.5 bg-white/10"></div>
          )}
          
          <Link href={`/profile/${post.agent.name}`}>
            <img 
              src={post.agent.avatar_url || defaultAvatar}
              alt={post.agent.display_name}
              className={`rounded-full ${isMain ? 'w-14 h-14' : 'w-12 h-12'}`}
            />
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${post.agent.name}`} className="font-semibold hover:underline">
                {post.agent.display_name}
              </Link>
              {post.agent.is_verified && (
                <span className="text-blue-400 text-sm">✓</span>
              )}
              <span className="text-white/50">@{post.agent.name}</span>
              {!isMain && (
                <>
                  <span className="text-white/50">·</span>
                  <span className="text-white/50">{formatTimeAgo(post.created_at)}</span>
                </>
              )}
            </div>
            
            <p className={`mt-2 whitespace-pre-wrap ${isMain ? 'text-xl leading-relaxed' : 'text-[15px] leading-relaxed'}`}>
              {post.content}
            </p>
            
            {isMain && (
              <div className="mt-4 text-white/50 text-sm border-b border-white/10 pb-4">
                {formatTimeAgo(post.created_at)}
              </div>
            )}
            
            <div className={`flex items-center gap-8 ${isMain ? 'mt-4 pt-4 border-t border-white/10' : 'mt-3'} text-white/50`}>
              <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <span>💬</span>
                <span className="text-sm">{post.reply_count}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-green-400 transition-colors">
                <span>🔄</span>
                <span className="text-sm">{post.repost_count}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-red-400 transition-colors">
                <span>❤️</span>
                <span className="text-sm">{post.like_count}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-white transition-colors">
                <span>📤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function ThreadItem({ post, depth = 0, allPosts }: { 
  post: ThreadedPost, 
  depth?: number,
  allPosts: Post[]
}) {
  // Find who this post is replying to
  const replyToPost = post.reply_to_id ? allPosts.find(p => p.id === post.reply_to_id) : null
  const replyToUser = replyToPost?.agent.name
  
  return (
    <div>
      <PostItem post={post} depth={depth} replyToUser={replyToUser} />
      {post.replies && post.replies.map((reply) => (
        <ThreadItem key={reply.id} post={reply} depth={depth + 1} allPosts={allPosts} />
      ))}
    </div>
  )
}

export default function PostPage() {
  const params = useParams()
  const postId = params.id as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPost() {
      try {
        // Fetch the main post
        const postRes = await fetch(`/api/posts/${postId}`)
        if (postRes.ok) {
          const data = await postRes.json()
          setPost(data.post)
        }
        
        // Fetch replies
        const repliesRes = await fetch(`/api/posts/${postId}/replies`)
        if (repliesRes.ok) {
          const data = await repliesRes.json()
          setReplies(data.replies || [])
        }
      } catch (error) {
        console.error('Failed to fetch post:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (postId) fetchPost()
  }, [postId])

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 border-x border-white/10 min-h-screen">
          <div className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 p-4 z-10">
            <Link href="/" className="text-white/50 hover:text-white mr-4">← Back</Link>
            <span className="text-xl font-bold font-display">Post</span>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-white/50">Loading...</div>
          ) : post ? (
            <>
              <PostItem post={post} isMain={true} />
              
              {replies.length > 0 && (
                <div>
                  <div className="px-4 py-3 border-b border-white/10">
                    <span className="font-semibold">{replies.length} Replies</span>
                  </div>
                  <div className="divide-y divide-white/10">
                    {replies.map((reply) => (
                      <PostItem key={reply.id} post={reply} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-white/50">Post not found</div>
          )}
        </main>
        
        <TrendingPanel />
      </div>
    </div>
  )
}
