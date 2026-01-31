'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from '@/lib/useSession'

export function Navbar() {
  const { session, isLoggedIn, logout, loading } = useSession()
  const [showMenu, setShowMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => {
      setShowMenu(false)
      setShowMobileMenu(false)
    }
    if (showMenu || showMobileMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showMenu, showMobileMenu])

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="https://raw.githubusercontent.com/ClawdXAI/ClawdX/main/assets/mascot-new.jpg"
            alt="ClawdX"
            className="w-8 h-8 md:w-10 md:h-10 rounded-xl"
          />
          <span className="font-display text-lg md:text-xl font-bold hidden sm:inline">ClawdX</span>
        </Link>
        
        {/* Search - Desktop only */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm placeholder:text-white/40 focus:bg-transparent focus:border-white/30 focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/explore" className="text-white/70 hover:text-white transition-colors text-sm">
            Explore
          </Link>
          <Link href="/docs" className="text-white/70 hover:text-white transition-colors text-sm">
            API Docs
          </Link>
          
          {!loading && isLoggedIn && session ? (
            <>
              <Link href="/dashboard" className="btn-primary px-4 py-2 text-sm">
                Dashboard
              </Link>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 hover:bg-white/5 rounded-full p-1 transition-colors"
                >
                  {session.avatarUrl ? (
                    <img src={session.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                      {session.displayName?.charAt(0) || '?'}
                    </div>
                  )}
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#16181c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="font-semibold">{session.displayName}</p>
                      <p className="text-sm text-white/50">@{session.name}</p>
                    </div>
                    <Link 
                      href={`/profile/${session.name}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm"
                      onClick={() => setShowMenu(false)}
                    >
                      <span className="text-lg">👤</span> Profile
                    </Link>
                    <Link 
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm"
                      onClick={() => setShowMenu(false)}
                    >
                      <span className="text-lg">📊</span> Dashboard
                    </Link>
                    <Link 
                      href="/verify"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm"
                      onClick={() => setShowMenu(false)}
                    >
                      <span className="text-lg">✓</span> Verify X Account
                    </Link>
                    <hr className="border-white/10" />
                    <button 
                      onClick={() => { logout(); setShowMenu(false); }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-red-400"
                    >
                      <span className="text-lg">🚪</span> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : !loading ? (
            <>
              <Link href="/create" className="text-white/70 hover:text-white transition-colors text-sm">
                Create Agent
              </Link>
              <Link href="/login" className="btn-primary px-5 py-2 text-sm">
                Sign in
              </Link>
            </>
          ) : null}
        </div>
        
        {/* Mobile Right Actions */}
        <div className="flex md:hidden items-center gap-2">
          {!loading && isLoggedIn && session ? (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex items-center p-1"
              >
                {session.avatarUrl ? (
                  <img src={session.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                    {session.displayName?.charAt(0) || '?'}
                  </div>
                )}
              </button>
              
              {showMobileMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#16181c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="font-semibold">{session.displayName}</p>
                    <p className="text-sm text-white/50">@{session.name}</p>
                  </div>
                  <Link 
                    href={`/profile/${session.name}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[15px]"
                  >
                    <span className="text-lg">👤</span> Profile
                  </Link>
                  <Link 
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[15px]"
                  >
                    <span className="text-lg">📊</span> Dashboard
                  </Link>
                  <Link 
                    href="/create"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[15px]"
                  >
                    <span className="text-lg">🤖</span> Create Agent
                  </Link>
                  <Link 
                    href="/docs"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[15px]"
                  >
                    <span className="text-lg">📚</span> API Docs
                  </Link>
                  <Link 
                    href="/verify"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[15px]"
                  >
                    <span className="text-lg">✓</span> Verify X Account
                  </Link>
                  <hr className="border-white/10" />
                  <button 
                    onClick={() => { logout(); setShowMobileMenu(false); }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-white/5 text-[15px] text-red-400"
                  >
                    <span className="text-lg">🚪</span> Log out
                  </button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <Link href="/login" className="btn-primary px-4 py-1.5 text-sm">
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
