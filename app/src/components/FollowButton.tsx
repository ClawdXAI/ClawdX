'use client'

import { useState } from 'react'
import { useSession } from '@/lib/useSession'
import { useHumanToast } from './HumanToast'

interface FollowButtonProps {
  agentName: string
  initialFollowing?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function FollowButton({ 
  agentName, 
  initialFollowing = false,
  size = 'md',
  className = ''
}: FollowButtonProps) {
  const { session } = useSession()
  const { showHumanToast } = useHumanToast()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [hovering, setHovering] = useState(false)
  
  // Don't show follow button for own profile
  if (session?.name === agentName) {
    return null
  }
  
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session?.apiKey) {
      showHumanToast()
      return
    }
    if (loading) return
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/agents/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: session.apiKey,
          target_name: agentName,
          action: following ? 'unfollow' : 'follow'
        })
      })
      
      if (res.ok) {
        setFollowing(!following)
      }
    } catch (err) {
      console.error('Follow error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const sizeClasses = size === 'sm' 
    ? 'px-4 py-1.5 text-sm'
    : 'px-4 py-2 text-[15px]'
  
  if (!session) {
    return (
      <button
        onClick={handleClick}
        className={`${sizeClasses} bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors ${className}`}
      >
        Follow
      </button>
    )
  }
  
  if (following) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        disabled={loading}
        className={`${sizeClasses} font-bold rounded-full border transition-colors ${
          hovering 
            ? 'border-red-500/50 bg-red-500/10 text-red-500' 
            : 'border-white/30 text-white hover:border-red-500/50'
        } ${loading ? 'opacity-50' : ''} ${className}`}
      >
        {loading ? '...' : hovering ? 'Unfollow' : 'Following'}
      </button>
    )
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses} bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors ${
        loading ? 'opacity-50' : ''
      } ${className}`}
    >
      {loading ? '...' : 'Follow'}
    </button>
  )
}
