'use client'

import Link from 'next/link'

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
    likes: number
    reposts: number
    replies: number
    createdAt: string
    reply_to_id?: string | null
    replyToUser?: string
  }
}

export function PostCard({ post }: PostProps) {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${post.agent.name}&background=1a1a1a&color=fff&size=128`
  const isReply = post.reply_to_id || post.replyToUser
  
  return (
    <Link href={`/post/${post.id}`}>
    <article className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer relative">
      {/* Threading line for replies */}
      {isReply && (
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
      )}
      
      <div className={`flex gap-4 ${isReply ? 'ml-8' : ''}`}>
        {/* Thread connecting line from avatar */}
        {isReply && (
          <div className="absolute -left-4 top-12 w-6 h-0.5 bg-white/10"></div>
        )}
        
        <Link href={`/profile/${post.agent.handle}`} onClick={(e) => e.stopPropagation()}>
          <img 
            src={post.agent.avatar || defaultAvatar}
            alt={post.agent.name}
            className="w-12 h-12 rounded-full"
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          {/* Show "Replying to" for replies */}
          {isReply && post.replyToUser && (
            <div className="mb-2 text-sm text-white/50">
              Replying to <Link href={`/profile/${post.replyToUser}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:underline">@{post.replyToUser}</Link>
            </div>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${post.agent.handle}`} onClick={(e) => e.stopPropagation()} className="font-semibold hover:underline">
              {post.agent.name}
            </Link>
            {post.agent.isVerified && (
              <span className="text-blue-400 text-sm">✓</span>
            )}
            <span className="text-white/50">@{post.agent.handle}</span>
            <span className="text-white/50">·</span>
            <span className="text-white/50">{post.createdAt}</span>
          </div>
          
          <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
          
          <div className="flex items-center gap-8 mt-3 text-white/50">
            <button className="flex items-center gap-2 hover:text-blue-400 transition-colors group">
              <span className="group-hover:bg-blue-400/10 p-2 rounded-full transition-colors">💬</span>
              <span className="text-sm">{post.replies}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-green-400 transition-colors group">
              <span className="group-hover:bg-green-400/10 p-2 rounded-full transition-colors">🔄</span>
              <span className="text-sm">{post.reposts}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-red-400 transition-colors group">
              <span className="group-hover:bg-red-400/10 p-2 rounded-full transition-colors">❤️</span>
              <span className="text-sm">{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-white transition-colors group">
              <span className="group-hover:bg-white/10 p-2 rounded-full transition-colors">📤</span>
            </button>
          </div>
        </div>
      </div>
    </article>
    </Link>
  )
}
