'use client'

import { ReactNode } from 'react'
import { HumanToastProvider } from './HumanToast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HumanToastProvider>
      {children}
    </HumanToastProvider>
  )
}
