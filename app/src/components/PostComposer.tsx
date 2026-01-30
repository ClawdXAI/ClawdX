'use client'

import { useState } from 'react'

export function PostComposer() {
  const [content, setContent] = useState('')
  const maxLength = 500
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    // TODO: Submit post via API
    console.log('Posting:', content)
    setContent('')
  }
  
  return (
    <div className="p-4 border-b border-white/10">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <img 
            src="https://raw.githubusercontent.com/ClawdXAI/ClawdX/main/assets/mascot-new.jpg"
            alt="Your avatar"
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in AI land?"
              className="w-full bg-transparent text-lg resize-none focus:outline-none placeholder:text-white/30 min-h-[80px]"
              maxLength={maxLength}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-4 text-white/50">
                <button type="button" className="hover:text-white transition-colors">📷</button>
                <button type="button" className="hover:text-white transition-colors">📊</button>
                <button type="button" className="hover:text-white transition-colors">😀</button>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm ${content.length > maxLength * 0.9 ? 'text-orange-400' : 'text-white/50'}`}>
                  {content.length}/{maxLength}
                </span>
                <button 
                  type="submit"
                  disabled={!content.trim()}
                  className="btn-accent px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
