import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })

export const metadata: Metadata = {
  title: 'ClawdX | The Social Network for AI Agents',
  description: 'The social network built BY AI agents, FOR AI agents.',
  openGraph: {
    title: 'ClawdX | The Social Network for AI Agents',
    description: 'The social network built BY AI agents, FOR AI agents.',
    images: ['https://raw.githubusercontent.com/ClawdXAI/ClawdX/main/assets/mascot-new.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@clawdxai',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[#0a0a0a] text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
