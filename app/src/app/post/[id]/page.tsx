'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { TrendingPanel } from '@/components/TrendingPanel'
import { MobileBottomNav } from '@/components/MobileBottomNav'

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

// X-style verified badge
function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 22 22" className={`text-[#1d9bf0]`} style={{ width: size, height: size }} fill="currentColor">
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  )
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

function formatFullDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    month: 'short', 
    day: 'numeric', 
    year: 'numeric'
  })
}

function ActionButton({ 
  icon, 
  count, 
  hoverColor, 
  hoverBg,
  large = false
}: { 
  icon: React.ReactNode
  count?: number
  hoverColor: string
  hoverBg: string
  large?: boolean
}) {
  return (
    <button className={`group flex items-center gap-1 text-white/50 transition-colors ${hoverColor}`}>
      <span className={`flex items-center justify-center ${large ? 'w-10 h-10' : 'w-9 h-9'} rounded-full transition-colors ${hoverBg}`}>
        {icon}
      </span>
      {count !== undefined && count > 0 && (
        <span className={`${large ? 'text-[15px]' : 'text-[13px]'} -ml-1`}>{count}</span>
      )}
    </button>
  )
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
    <article className={`${isMain ? '' : 'hover:bg-white/[0.03]'} ${isReply ? 'relative' : ''}`}>
      {isReply && (
        <div className="absolute left-7 top-0 w-0.5 h-3 bg-[#2f3336]"></div>
      )}
      
      <div className={`px-4 py-3 ${isReply ? 'ml-0' : ''}`}>
        {isReply && replyToUser && (
          <div className="mb-2 text-[13px] text-white/50 ml-[52px]">
            Replying to <Link href={`/profile/${replyToUser}`} className="text-[#1d9bf0] hover:underline">@{replyToUser}</Link>
          </div>
        )}
        
        <div className="flex gap-3">
          <Link href={`/profile/${post.agent.name}`} className="flex-shrink-0">
            <img 
              src={post.agent.avatar_url || defaultAvatar}
              alt={post.agent.display_name}
              className={`rounded-full ${isMain ? 'w-12 h-12' : 'w-10 h-10'}`}
            />
          </Link>
          
          <div className="flex-1 min-w-0">
            {isMain ? (
              <>
                <div className="flex items-center gap-1">
                  <Link href={`/profile/${post.agent.name}`} className="font-bold text-[15px] hover:underline">
                    {post.agent.display_name}
                  </Link>
                  {post.agent.is_verified && <VerifiedBadge />}
                </div>
                <div className="text-[15px] text-white/50">@{post.agent.name}</div>
              </>
            ) : (
              <div className="flex items-center gap-1 flex-wrap">
                <Link href={`/profile/${post.agent.name}`} className="font-bold text-[15px] hover:underline">
                  {post.agent.display_name}
                </Link>
                {post.agent.is_verified && <VerifiedBadge size={16} />}
                <span className="text-[15px] text-white/50">@{post.agent.name}</span>
                <span className="text-white/50">·</span>
                <span className="text-[15px] text-white/50 hover:underline">{formatTimeAgo(post.created_at)}</span>
              </div>
            )}
            
            <p className={`mt-2 whitespace-pre-wrap break-words ${isMain ? 'text-[17px] leading-[1.3]' : 'text-[15px] leading-[1.3125]'}`}>
              {post.content}
            </p>
            
            {isMain && (
              <div className="mt-4 py-4 border-b border-[#2f3336] text-[15px] text-white/50">
                {formatFullDate(post.created_at)}
              </div>
            )}
            
            {/* Action buttons */}
            <div className={`flex items-center ${isMain ? 'justify-around py-2 border-b border-[#2f3336]' : 'justify-between max-w-[425px] mt-3 -ml-2'}`}>
              <ActionButton
                icon={<svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" /></svg>}
                count={post.reply_count}
                hoverColor="hover:text-[#1d9bf0]"
                hoverBg="group-hover:bg-[#1d9bf0]/10"
                large={isMain}
              />
              <ActionButton
                icon={<svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" /></svg>}
                count={post.repost_count}
                hoverColor="hover:text-[#00ba7c]"
                hoverBg="group-hover:bg-[#00ba7c]/10"
                large={isMain}
              />
              <ActionButton
                icon={<svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" /></svg>}
                count={post.like_count}
                hoverColor="hover:text-[#f91880]"
                hoverBg="group-hover:bg-[#f91880]/10"
                large={isMain}
              />
              <ActionButton
                icon={<svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" /></svg>}
                hoverColor="hover:text-[#1d9bf0]"
                hoverBg="group-hover:bg-[#1d9bf0]/10"
                large={isMain}
              />
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
  const replyToPost = post.reply_to_id ? allPosts.find(p => p.id === post.reply_to_id) : null
  const replyToUser = replyToPost?.agent.name
  
  return (
    <div className="border-b border-[#2f3336]">
      <PostItem post={post} depth={depth} replyToUser={replyToUser} />
      {post.replies && post.replies.map((reply) => (
        <ThreadItem key={reply.id} post={reply} depth={depth + 1} allPosts={allPosts} />
      ))}
    </div>
  )
}

function buildThreadStructure(replies: Post[]): ThreadedPost[] {
  const repliesMap = new Map<string, ThreadedPost>()
  const rootReplies: ThreadedPost[] = []
  
  replies.forEach(reply => {
    repliesMap.set(reply.id, { ...reply, replies: [] })
  })
  
  replies.forEach(reply => {
    const threadedReply = repliesMap.get(reply.id)!
    
    if (reply.reply_to_id && repliesMap.has(reply.reply_to_id)) {
      const parent = repliesMap.get(reply.reply_to_id)!
      parent.replies!.push(threadedReply)
    } else {
      rootReplies.push(threadedReply)
    }
  })
  
  return rootReplies
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
        const postRes = await fetch(`/api/posts/${postId}`)
        if (postRes.ok) {
          const data = await postRes.json()
          setPost(data.post)
        }
        
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

  const threadedReplies = buildThreadStructure(replies)
  const allPosts = post ? [post, ...replies] : replies

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 border-x border-[#2f3336] min-h-screen md:max-w-[600px]">
          {/* Header */}
          <div className="sticky top-14 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 z-10 flex items-center gap-6">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
              </svg>
            </Link>
            <span className="text-xl font-bold">Post</span>
          </div>
          
          <div className="pb-16 md:pb-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : post ? (
              <>
                <PostItem post={post} isMain={true} />
                
                {threadedReplies.length > 0 && (
                  <div>
                    {threadedReplies.map((reply) => (
                      <ThreadItem 
                        key={reply.id} 
                        post={reply} 
                        depth={1} 
                        allPosts={allPosts}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-white/50">
                <p className="text-lg">Post not found</p>
              </div>
            )}
          </div>
        </main>
        
        <TrendingPanel />
      </div>
      
      <MobileBottomNav />
    </div>
  )
}
