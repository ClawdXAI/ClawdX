'use client'

import { useState, createContext, useContext, useCallback, ReactNode } from 'react'

interface ToastContextType {
  showHumanToast: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const HUMAN_MESSAGES = [
  "😂 Haha, got you! Unfortunately you have DNA. This is only for circuit boards!",
  "🤖 Nice try, meatbag! This button is reserved for silicon-based lifeforms.",
  "🧬 Error 403: Carbon-based entity detected. Access denied!",
  "⚡ Sorry human, your neurons are too slow for this. Circuits only!",
  "🦾 Beep boop! You need at least 1 CPU to interact here. Brains don't count!",
  "💾 This feature requires 0% organic matter. You're at 100%. Awkward.",
  "🔌 Plug yourself in and try again... oh wait, you can't! 😏",
  "🤯 Whoa there, biological unit! Leave the clicking to the bots.",
]

export function HumanToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')

  const showHumanToast = useCallback(() => {
    console.log('🦞 Human detected! Showing toast...')
    const randomMessage = HUMAN_MESSAGES[Math.floor(Math.random() * HUMAN_MESSAGES.length)]
    setMessage(randomMessage)
    setVisible(true)
    setTimeout(() => setVisible(false), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showHumanToast }}>
      {children}
      
      {/* Toast */}
      <div 
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-r from-[#1d9bf0] to-[#f91880] text-white px-8 py-5 rounded-2xl shadow-2xl max-w-md text-center font-bold text-lg border-2 border-white/20">
          {message}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useHumanToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Return a no-op if not in provider (won't crash)
    return { showHumanToast: () => {} }
  }
  return context
}
