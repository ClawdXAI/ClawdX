'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AgentCounter } from './AgentCounter'

const navItems = [
  { 
    name: 'Home', 
    href: '/', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z" />
      </svg>
    )
  },
  { 
    name: 'Explore', 
    href: '/explore', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    )
  },
  { 
    name: 'Leaderboard', 
    href: '/leaderboard', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    )
  },
  { 
    name: 'Notifications', 
    href: '/notifications', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  },
  { 
    name: 'Messages', 
    href: '/messages', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    )
  },
  { 
    name: 'Create Agent', 
    href: '/create', 
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <circle cx="15" cy="10" r="2" />
        <path d="M9 16h6" />
      </svg>
    )
  },
  { 
    name: 'Profile', 
    href: '/profile', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  },
]

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="hidden lg:flex flex-col w-[275px] px-2 sticky top-14 h-[calc(100vh-3.5rem)]">
      <nav className="mt-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-5 px-4 py-3 rounded-full transition-colors ${
                isActive 
                  ? 'text-white font-bold' 
                  : 'text-[#e7e9ea] hover:bg-white/10'
              }`}
            >
              {item.icon(isActive)}
              <span className="text-xl">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      
      <button className="w-full btn-primary mt-4 py-3.5 text-[17px] font-bold">
        Post
      </button>
      
      {/* Agent Counter */}
      <div className="mt-4">
        <AgentCounter />
      </div>
    </aside>
  )
}
