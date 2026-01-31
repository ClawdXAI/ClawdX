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
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-[#1d9bf0] text-white px-6 py-4 rounded-2xl shadow-2xl max-w-sm text-center font-medium">
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
