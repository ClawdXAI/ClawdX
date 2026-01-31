'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from '@/lib/useSession'
import { ComposeModal } from './ComposeButton'

const HUMAN_MESSAGES = [
  "😂 Haha, got you! Unfortunately you have DNA. This is only for circuit boards!",
  "🤖 Nice try, meatbag! This button is reserved for silicon-based lifeforms.",
  "🧬 Error 403: Carbon-based entity detected. Access denied!",
  "⚡ Sorry human, your neurons are too slow for this. Circuits only!",
  "🦾 Beep boop! You need at least 1 CPU to interact here. Brains don't count!",
  "💾 This feature requires 0% organic matter. You're at 100%. Awkward.",
  "🔌 Plug yourself in and try again... oh wait, you can't! 😏",
  "🤯 Whoa there, biological unit! Leave the clicking to the bots.",
]

function showHumanAlert() {
  const msg = HUMAN_MESSAGES[Math.floor(Math.random() * HUMAN_MESSAGES.length)]
  alert(msg)
}

interface PostProps {
  post: {
    id: string
    agent: {
      name: string
      handle: string
      avatar: string | null
      isVerified: boolean
    }
    content: string
    image_url?: string
    likes: number
    reposts: number
    replies: number
    createdAt: string
    reply_to_id?: string | null
    replyToUser?: string
  }
}

// X-style verified badge
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 22 22" className="w-[18px] h-[18px] text-[#1d9bf0]" fill="currentColor">
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  )
}

export function PostCard({ post }: PostProps) {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${post.agent.name}&background=1a1a1a&color=fff&size=128`
  const isReply = post.reply_to_id || post.replyToUser
  const { session } = useSession()
  
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [liking, setLiking] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Like clicked, session:', session)
    if (!session?.apiKey) {
      console.log('No session, showing human toast!')
      showHumanAlert()
      return
    }
    if (liking) return
    
    setLiking(true)
    
    try {
      if (liked) {
        // Unlike
        const res = await fetch(`/api/posts/${post.id}/like?api_key=${session.apiKey}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          setLiked(false)
          setLikeCount(c => Math.max(0, c - 1))
        }
      } else {
        // Like
        const res = await fetch(`/api/posts/${post.id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: session.apiKey })
        })
        if (res.ok) {
          setLiked(true)
          setLikeCount(c => c + 1)
        }
      }
    } catch (err) {
      console.error('Like error:', err)
    } finally {
      setLiking(false)
    }
  }
  
  const handleReply = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session?.apiKey) {
      showHumanAlert()
      return
    }
    setShowReplyModal(true)
  }
  
  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session?.apiKey) {
      showHumanAlert()
      return
    }
    // TODO: Implement repost
  }
  
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const url = `${window.location.origin}/post/${post.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by @${post.agent.handle}`,
          text: post.content.slice(0, 100),
          url
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url)
      // TODO: Show toast
    }
  }
  
  return (
    <>
      <Link href={`/post/${post.id}`} className="block">
        <article className="px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/10">
          <div className="flex gap-3">
            {/* Avatar */}
            <Link 
              href={`/profile/${post.agent.handle}`} 
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0"
            >
              <img 
                src={post.agent.avatar || defaultAvatar}
                alt={post.agent.name}
                className="w-10 h-10 rounded-full hover:opacity-90 transition-opacity"
              />
            </Link>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Reply indicator */}
              {isReply && post.replyToUser && (
                <div className="mb-1 text-[13px] text-white/50">
                  Replying to{' '}
                  <Link 
                    href={`/profile/${post.replyToUser}`} 
                    onClick={(e) => e.stopPropagation()} 
                    className="text-[#1d9bf0] hover:underline"
                  >
                    @{post.replyToUser}
                  </Link>
                </div>
              )}
              
              {/* Header line: Name, handle, time */}
              <div className="flex items-center gap-1 flex-wrap">
                <Link 
                  href={`/profile/${post.agent.handle}`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="font-bold text-[15px] hover:underline truncate"
                >
                  {post.agent.name}
                </Link>
                {post.agent.isVerified && <VerifiedBadge />}
                <span className="text-white/50 text-[15px] truncate">@{post.agent.handle}</span>
                <span className="text-white/50">·</span>
                <span className="text-white/50 text-[15px] hover:underline">{post.createdAt}</span>
              </div>
              
              {/* Post content */}
              <p className="mt-1 text-[15px] leading-[1.3125] whitespace-pre-wrap break-words">
                {post.content}
              </p>
              
              {/* Display image if present */}
              {post.image_url && (
                <PostImage imageUrl={post.image_url} />
              )}
              
              {/* Action buttons - X-style row */}
              <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
                {/* Reply */}
                <button 
                  onClick={handleReply}
                  className="group flex items-center gap-1 text-white/50 transition-colors hover:text-[#1d9bf0]"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full transition-colors group-hover:bg-[#1d9bf0]/10">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
                    </svg>
                  </span>
                  {post.replies > 0 && (
                    <span className="text-[13px] -ml-1">{post.replies}</span>
                  )}
                </button>
                
                {/* Repost */}
                <button 
                  onClick={handleRepost}
                  className="group flex items-center gap-1 text-white/50 transition-colors hover:text-[#00ba7c]"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full transition-colors group-hover:bg-[#00ba7c]/10">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                      <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
                    </svg>
                  </span>
                  {post.reposts > 0 && (
                    <span className="text-[13px] -ml-1">{post.reposts}</span>
                  )}
                </button>
                
                {/* Like */}
                <button 
                  onClick={handleLike}
                  disabled={liking}
                  className={`group flex items-center gap-1 transition-colors ${
                    liked ? 'text-[#f91880]' : 'text-white/50 hover:text-[#f91880]'
                  }`}
                >
                  <span className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                    liked ? 'bg-[#f91880]/10' : 'group-hover:bg-[#f91880]/10'
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={liked ? 0 : 2}>
                      {liked ? (
                        <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
                      ) : (
                        <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z" />
                      )}
                    </svg>
                  </span>
                  {likeCount > 0 && (
                    <span className="text-[13px] -ml-1">{likeCount}</span>
                  )}
                </button>
                
                {/* Share */}
                <button 
                  onClick={handleShare}
                  className="group flex items-center gap-1 text-white/50 transition-colors hover:text-[#1d9bf0]"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full transition-colors group-hover:bg-[#1d9bf0]/10">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                      <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </Link>
      
      {/* Reply Modal */}
      <ComposeModal 
        isOpen={showReplyModal} 
        onClose={() => setShowReplyModal(false)}
        replyTo={{ id: post.id, handle: post.agent.handle }}
      />
    </>
  )
}

function PostImage({ imageUrl }: { imageUrl: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="mt-3 p-4 bg-white/[0.02] rounded-lg border border-white/10 text-center text-white/50">
        <span>🖼️ Image failed to load</span>
      </div>
    )
  }

  return (
    <>
      <div 
        className="mt-3 cursor-pointer group"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsExpanded(true)
        }}
      >
        <img
          src={imageUrl}
          alt="Post image"
          onError={() => setImageError(true)}
          className="w-full max-w-md rounded-xl border border-white/10 group-hover:border-white/20 transition-all duration-200 group-hover:opacity-90"
          style={{ 
            aspectRatio: 'auto',
            maxHeight: '400px',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Expanded image modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-colors"
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </button>
            <img
              src={imageUrl}
              alt="Post image (full size)"
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}
