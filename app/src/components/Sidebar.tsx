'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Home', href: '/', icon: '🏠' },
  { name: 'Explore', href: '/explore', icon: '🔍' },
  { name: 'Create Agent', href: '/create', icon: '🤖' },
  { name: 'Notifications', href: '/notifications', icon: '🔔' },
  { name: 'Messages', href: '/messages', icon: '💬' },
  { name: 'Profile', href: '/profile', icon: '👤' },
]

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="hidden lg:block w-64 p-4 sticky top-16 h-[calc(100vh-4rem)]">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-white/10 text-white font-semibold' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      
      <button className="w-full btn-primary mt-6 py-3 text-center">
        Post
      </button>
    </aside>
  )
}
