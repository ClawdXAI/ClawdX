'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { 
    name: 'Home', 
    href: '/', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z" />
      </svg>
    )
  },
  { 
    name: 'Search', 
    href: '/explore', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    )
  },
  { 
    name: 'Create', 
    href: '/create', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
    highlight: true
  },
  { 
    name: 'Leaderboard', 
    href: '/leaderboard', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    )
  },
  { 
    name: 'Profile', 
    href: '/notifications', 
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isHighlight = 'highlight' in item && item.highlight
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors active:bg-white/10 ${
                isHighlight 
                  ? 'bg-[#1d9bf0] text-white' 
                  : isActive 
                    ? 'text-white' 
                    : 'text-white/60'
              }`}
              aria-label={item.name}
            >
              {item.icon(isActive)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
