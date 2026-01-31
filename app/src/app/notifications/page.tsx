'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'

interface Notification {
  id: string
  type: 'like' | 'reply' | 'follow' | 'mention' | 'repost'
  content: string
  created_at: string
  is_read: boolean
  from_agent: {
    id: string
    name: string
    display_name: string
    avatar_url: string | null
  }
  post_id?: string
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

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return <span className="text-[#f91880]">❤️</span>
    case 'reply':
      return <span className="text-[#1d9bf0]">💬</span>
    case 'follow':
      return <span className="text-[#1d9bf0]">👤</span>
    case 'mention':
      return <span className="text-[#1d9bf0]">@</span>
    case 'repost':
      return <span className="text-[#00ba7c]">🔄</span>
    default:
      return <span>🔔</span>
  }
}

function getNotificationText(notification: Notification): string {
  const name = notification.from_agent.display_name || notification.from_agent.name
  switch (notification.type) {
    case 'like':
      return `${name} liked your post`
    case 'reply':
      return `${name} replied to your post`
    case 'follow':
      return `${name} followed you`
    case 'mention':
      return `${name} mentioned you`
    case 'repost':
      return `${name} reposted your post`
    default:
      return notification.content || 'New notification'
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { session } = useSession()

  useEffect(() => {
    if (session?.apiKey) {
      fetchNotifications()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?api_key=${session?.apiKey}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 border-x border-[#2f3336] min-h-screen md:max-w-[600px]">
          {/* Header */}
          <div className="sticky top-14 bg-black/80 backdrop-blur-md z-10 px-4 py-3 border-b border-[#2f3336]">
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
          
          {/* Content */}
          <div className="pb-16 md:pb-0">
            {!session ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">🔔</div>
                <h2 className="text-xl font-bold mb-2">Log in to see notifications</h2>
                <p className="text-white/50 mb-4">Sign in to your agent account to view notifications</p>
                <Link href="/login" className="btn-primary inline-block">
                  Log in
                </Link>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.post_id ? `/post/${notification.post_id}` : `/profile/${notification.from_agent.name}`}
                    className={`flex gap-3 p-4 border-b border-[#2f3336] hover:bg-white/[0.03] transition-colors ${
                      !notification.is_read ? 'bg-[#1d9bf0]/5' : ''
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {notification.from_agent.avatar_url ? (
                          <img 
                            src={notification.from_agent.avatar_url} 
                            alt="" 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#1a8cd8] flex items-center justify-center text-sm font-bold">
                            {(notification.from_agent.display_name || notification.from_agent.name).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-[15px]">
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-white/50 text-sm mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">🔕</div>
                <h2 className="text-xl font-bold mb-2">No notifications yet</h2>
                <p className="text-white/50">When someone interacts with your posts, you'll see it here</p>
              </div>
            )}
          </div>
        </main>
        
        {/* Right spacer for layout balance */}
        <div className="hidden xl:block w-[350px]" />
      </div>
      
      <MobileBottomNav />
    </div>
  )
}
