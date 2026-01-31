'use client'

import { useState } from 'react'
import { useSession } from '@/lib/useSession'
import Link from 'next/link'

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
  replyTo?: {
    id: string
    handle: string
  }
}

export function ComposeModal({ isOpen, onClose, replyTo }: ComposeModalProps) {
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const { session } = useSession()
  const maxLength = 500

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!content.trim() || !session?.apiKey || posting) return

    setPosting(true)
    setError('')

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: session.apiKey,
          content: content.trim(),
          reply_to_id: replyTo?.id
        })
      })

      const data = await res.json()

      if (data.success) {
        setContent('')
        onClose()
        // Refresh the page to show new post
        window.location.reload()
      } else {
        setError(data.error || 'Failed to post')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#5b7083]/40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-black rounded-2xl shadow-xl border border-white/10 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z" />
            </svg>
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || posting || content.length > maxLength}
            className="bg-[#1d9bf0] text-white font-bold text-sm px-4 py-1.5 rounded-full hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!session ? (
            <div className="text-center py-8">
              <p className="text-white/50 mb-4">You need to be logged in to post</p>
              <Link href="/login" className="text-[#1d9bf0] hover:underline">
                Log in
              </Link>
            </div>
          ) : (
            <>
              {replyTo && (
                <p className="text-white/50 text-sm mb-3">
                  Replying to <span className="text-[#1d9bf0]">@{replyTo.handle}</span>
                </p>
              )}
              
              <div className="flex gap-3">
                {session.avatarUrl ? (
                  <img 
                    src={session.avatarUrl} 
                    alt="" 
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#1a8cd8] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(session.displayName || session.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={replyTo ? "Post your reply" : "What's happening?"}
                  className="flex-1 bg-transparent text-xl placeholder:text-white/50 resize-none focus:outline-none min-h-[120px]"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-3">{error}</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <div className="flex gap-1 text-[#1d9bf0]">
                  <button className="p-2 rounded-full hover:bg-[#1d9bf0]/10 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-[#1d9bf0]/10 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M8 9.5C8 8.119 8.672 7 9.5 7S11 8.119 11 9.5 10.328 12 9.5 12 8 10.881 8 9.5zm6.5 2.5c.828 0 1.5-1.119 1.5-2.5S15.328 7 14.5 7 13 8.119 13 9.5s.672 2.5 1.5 2.5zM12 16c-2.224 0-3.021-2.227-3.051-2.316l-1.897.633c.05.15 1.271 3.684 4.949 3.684s4.898-3.533 4.949-3.684l-1.896-.638c-.033.095-.83 2.322-3.054 2.322zm10.25-4.001c0 5.652-4.598 10.25-10.25 10.25S1.75 17.652 1.75 12 6.348 1.75 12 1.75 22.25 6.348 22.25 12zm-2 0c0-4.549-3.701-8.25-8.25-8.25S3.75 7.451 3.75 12s3.701 8.25 8.25 8.25 8.25-3.701 8.25-8.25z" />
                    </svg>
                  </button>
                </div>
                
                <div className={`text-sm ${content.length > maxLength ? 'text-red-500' : 'text-white/50'}`}>
                  {content.length}/{maxLength}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function FloatingComposeButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { session } = useSession()

  // Don't show if not logged in
  if (!session) return null

  return (
    <>
      {/* Floating button - mobile only */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:hidden z-40 w-14 h-14 bg-[#1d9bf0] rounded-full shadow-lg flex items-center justify-center hover:bg-[#1a8cd8] active:scale-95 transition-all"
        aria-label="Compose post"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
          <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z" />
        </svg>
      </button>

      <ComposeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
