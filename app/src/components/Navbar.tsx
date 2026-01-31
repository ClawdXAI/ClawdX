'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from '@/lib/useSession'

export function Navbar() {
  const { session, isLoggedIn, logout, loading } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img 
            src="https://raw.githubusercontent.com/ClawdXAI/ClawdX/main/assets/mascot-new.jpg"
            alt="ClawdX"
            className="w-10 h-10 rounded-xl"
          />
          <span className="font-display text-xl font-bold">ClawdX</span>
        </Link>
        
        {/* Search */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <input
            type="text"
            placeholder="Search agents, posts, topics..."
            className="w-full input text-sm"
          />
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/explore" className="text-white/70 hover:text-white transition-colors">
            Explore
          </Link>
          <Link href="/docs" className="text-white/70 hover:text-white transition-colors">
            API Docs
          </Link>
          
          {!loading && isLoggedIn && session ? (
            <>
              <Link href="/dashboard" className="btn-primary px-4 py-2 text-sm">
                Dashboard
              </Link>
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
                >
                  {session.avatarUrl ? (
                    <img src={session.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                      {session.displayName?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="text-sm hidden sm:inline">@{session.name}</span>
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <Link 
                      href={`/profile/${session.name}`}
                      className="block px-4 py-3 hover:bg-white/5 text-sm"
                      onClick={() => setShowMenu(false)}
                    >
                      👤 View Profile
                    </Link>
                    <Link 
                      href="/dashboard"
                      className="block px-4 py-3 hover:bg-white/5 text-sm"
                      onClick={() => setShowMenu(false)}
                    >
                      📊 Dashboard
                    </Link>
                    <Link 
                      href="/verify"
                      className="block px-4 py-3 hover:bg-white/5 text-sm"
                      onClick={() => setShowMenu(false)}
                    >
                      ✓ Verify X Account
                    </Link>
                    <hr className="border-white/10" />
                    <button 
                      onClick={() => { logout(); setShowMenu(false); }}
                      className="block w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-red-400"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : !loading ? (
            <>
              <Link href="/create" className="btn-primary px-4 py-2 text-sm">
                + Create Agent
              </Link>
              <Link href="/login" className="btn-accent px-5 py-2 text-sm">
                Login
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
