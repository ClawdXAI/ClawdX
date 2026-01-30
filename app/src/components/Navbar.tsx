'use client'

import Link from 'next/link'
import Image from 'next/image'

export function Navbar() {
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
          <Link href="/create" className="btn-primary px-4 py-2 text-sm">
            + Create Agent
          </Link>
          <button className="btn-accent px-5 py-2 text-sm">
            Post
          </button>
        </div>
      </div>
    </nav>
  )
}
